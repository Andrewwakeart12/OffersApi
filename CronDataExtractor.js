import pool from "./database.js";
import othersBrowser from "./scrapper/othersBrowser.js";
import liverpoolBrowser from "./scrapper/liverpoolBrowser.js";
import bluebird from "bluebird";
import ProxyManager from "./ProxyManager.js";
import Notifiyer from "./Notifiyer.js";
import cron from "node-cron";
import WatcherOfProducts from "./WatcherOfProducts.js";
import child_process from 'child_process';
import ps from 'ps-node-promise-es6';
import _ from 'lodash'
import CronDataExtractorLogs from "./CronDataExtractorLogs.js";
const getArrayAsChunks = (array, chunkSize) => {
  let result = [];
  let data = array.slice(0);
  while (data[0]) {
    result.push(data.splice(0, chunkSize));
  }
  return result;
};
const capitalize = (word) => {
  return word
    .toLowerCase()
    .replace(/\w/, (firstLetter) => firstLetter.toUpperCase());
};
const CronDataLog = new CronDataExtractorLogs();
class CronDataExtractor {
  /*return obj of links by controller
        {
           amazon : [
               URL,URL,...
           ],
           liverpool.query: [
               URL,URL,...
           ]
            ...
        }
    */
  
  async getLinks() {
    var linksArr = {};
    var users = await pool.query("SELECT id FROM users");
    for (let user of users) {
      var controllers = await pool.query(
        "SELECT id,controller FROM scraper_controller WHERE user_id=? && controllerActive=1",
        [user.id]
      );

      for (let controller of controllers) {
        var urls = await pool.query(
          "SELECT * FROM scraper_urls WHERE controller_id= ?",
          [controller.id]
        );
        var controllerUrls = [];
        for (let url of urls) {
          controllerUrls.push({
            url: url.product_url,
            category: url.category,
            url_id: url.id,
          });
        }
        linksArr[controller.controller] = controllerUrls;
      }
    }
    return linksArr;
  }
  async runJobsInParallel(Proxy) {
    var controllers = await pool.query(
      "SELECT id,controller,discount_starts_at FROM scraper_controller WHERE user_id=1 && controllerActive=1"
    );
    try {
      const urls = await this.getLinks();
         return bluebird.map(controllers, async (controller) => {
          var localUrls = urls[controller.controller];
          console.log('localUrls : ');
          console.log(localUrls);

          return bluebird.map(
            localUrls,
            async (url) => {
              let that = this


              console.log('url data');
              console.log(url);

              var protocolName = "Scraper";
              var imp =
                `./scrapper/${controller.controller}/` +
                controller.controller +
                protocolName +
                ".js";
              var GeneralScraperItem = await import(imp);
              console.log("GeneralScraperItem");
              console.log(GeneralScraperItem);
              await CronDataLog.saveDataLogs('DinamycImport()','Complete',false,'Succesfully import done for : ' + controller.controller,'runJobsInParallel()')
              var { Scraper } = GeneralScraperItem;
              var Scrape = new Scraper(url.url_id);

              var res = await Scrape.scraper(url.url);
              var resObj = {
                dataArr: res,
                controller_id: controller.id,
                category: url.category,
                url_id: url.url_id,
              };


              console.log("resObj");
              if(resObj.dataArr.length > 0){
                await CronDataLog.saveDataLogs('Scraper.scraper()','Complete',false,'Succesfully getting products done for controller ' + controller.controller,'runJobsInParallel()')
              }else{
                await CronDataLog.saveDataLogs('Scraper.scraper()','Unclear',false,'No products Extracted, success not granted controller ' + controller.controller,'runJobsInParallel()')
              }

              console.log(resObj);
              await that.updateDb(resObj);
              var notify = new Notifiyer(
                controller.controller,
                controller.id,
                url.url_id,
                url.category,
                controller.discount_starts_at
              );
              await notify.sendNotifications();
              if (Scrape.newProducts != false) {
                await Notifiyer.sendCostumNotification(
                  controller.id,
                  `Categoría ${capitalize(url.category)}`,
                  `${Scrape.newProducts} productos nuevos fueron encontrados \n en esta extracción`
                );
              } else {
                console.log("checking the real number of offfers");
                var Observer = new WatcherOfProducts();
                await Observer.getLastArrayExtracted(url.url_id);
                var differences =
                  await Observer.diffActualDataOfProductsWhenTheNewArrayItsLonger(
                    resObj.dataArr
                  );
                await Notifiyer.sendCostumNotification(
                  controller.id,
                  `Categoría ${capitalize(url.category)}`,
                  `${differences} productos nuevos fueron encontrados \n en esta extracción`
                );
              }
              return resObj;

            
            },{concurrency:3});
          },
            
          );
          
    } catch (error) {
      console.error(error);
    }
  }
  async updateDb(categoryData) {
    return new Promise(async (resolve, reject) => {
      try {
        if (categoryData.error != undefined) {
          console.log(categoryData);
          return categoryData.error;
        }
        categoryData = [categoryData];
        console.log("categoryData : ");
        console.log(categoryData);

        await categoryData.map(async (toChunk) => {
          console.log(toChunk.dataArr.length);
          var chunkedArr = await getArrayAsChunks(toChunk.dataArr, 100);
          await chunkedArr.map(async (oneChunkElement) => {
            oneChunkElement.map(async (product) => {
              try {
                product.controller_id = toChunk.controller_id;
                product.url_id = toChunk.url_id;
                product.category = toChunk.category;
              } catch (e) {
                console.log("e");
                console.log(product.discount);
              }
            });
            var sql =
              "INSERT INTO scraped_data (product,img_url,url,newPrice,oldPrice,discount,prime,controller_id,url_id,category) VALUES ?";
            var records = oneChunkElement.map((e) => {
              return Object.values(e);
            });
            await pool.query(sql, [records], function (err, result) {
              console.log("err");
              console.log(err);
              console.log("result");
              console.log(result);
            });
          });
        });

        await pool.query(`
        DELETE t1 FROM scraped_data t1
			INNER JOIN scraped_data t2 
			WHERE t1.id > t2.id AND t1.product = t2.product
        `);
        //DELETE FROM scraped_data WHERE  CAST(oldPrice AS DECIMAL(10,2)) < 900.00
        await pool.query(
          `DELETE FROM scraped_data WHERE  CAST(oldPrice AS DECIMAL(10,2)) < 900.00`
        );
        await pool.query(
          `DELETE FROM scraped_data WHERE updated_at < NOW() - INTERVAL 1 DAY`
        );

        await pool.query('DELETE FROM scraped_data WHERE product IN (SELECT product FROM scraped_reviewed) AND url_id=' + categoryData[0].url_id)

        await CronDataLog.saveDataLogs('updatedDb()','Complete',false,'Products added to DB for Category : ' + categoryData[0].category ,'updateInDb()')

        console.log("finished");
        resolve(true);
      } catch (error) {
        await CronDataLog.saveDataLogs('updatedDb()','Failed',true,`Error message(failing update in DB) : ${error.message} ` + categoryData[0].category,'updateInDb()')
        reject(false);
      }
    });
  }
}

async function CronJobInitializer() {
  const Proxy = 1;

  var cron = new CronDataExtractor();
  var links = await cron.runJobsInParallel(Proxy);

  for (let link of links) {
    console.log("link");
    if (link[0].data === false) {
      await Notifiyer.sendCostumNotification(
        link[0].controller_id,
        `${capitalize(link[0].controller)}: Error al extraer datos`,
        `(Error en la categoria : ${capitalize(
          link[0].category
        )} )\nel sistema ha arrojado el error : \n${link[0].errorMessage}`
      );
    }
  }
}
CronJobInitializer();
//pm2 start sendMail.js --cron "*/15 * * * *"
//const task = cron.schedule("0 0 */6 * * *", async () => {
 /* CronJobInitializer();
});
*/

//task.start();

export default CronDataExtractor;

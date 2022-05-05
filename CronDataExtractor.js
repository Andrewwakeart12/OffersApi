import pool from "./database.js";
import othersBrowser from "./scrapper/othersBrowser.js";
import liverpoolBrowser from "./scrapper/liverpoolBrowser.js";
import bluebird from "bluebird";
import ProxyManager from './ProxyManager.js';
import Notifiyer from "./Notifiyer.js";
import cron from 'node-cron';

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
          controllerUrls.push({url:url.product_url, category:url.category, url_id:url.id});
        }
        linksArr[controller.controller] = controllerUrls;
      }
    }
    return linksArr;
  }
  async runJobsInParallel(Proxy) {
    var controllers = await pool.query(
      "SELECT id,controller,discount_starts_at FROM scraper_controller WHERE user_id=1 && controllerActive=1",
    );
    const withBrowser = async (fn) => {
      var otherBrowse= await othersBrowser.startBrowser(Proxy);
      var liverPoolItsOnTheControllers = false;
      controllers.forEach(controller =>{
        if(controller.controller == 'liverpool'){
          liverPoolItsOnTheControllers = true;
        }
      })
      if(liverPoolItsOnTheControllers){
        var liverpoolBrowse= await liverpoolBrowser.startBrowser(Proxy);
      }
      const browser = {liverpool:{browser:liverpoolBrowse, identifiyer:'liverpool'},others:{browser:otherBrowse,identifiyer:'other'}};
      try {
        return await fn(browser);
      } finally {
        await otherBrowse.close();
      if(liverPoolItsOnTheControllers){
        await liverpoolBrowse.close();
      }
      }
    };
    const withPage = (browser) => async (fn) => {
      const page = await browser.newPage();
 
      try {
        await page.setDefaultNavigationTimeout(0);
        await page.setDefaultTimeout(0);
        return await fn(page);
      } finally {
        await page.close();
      }
    };
    try {

      const urls = await this.getLinks()
      const results = await withBrowser(async (browser) => {

        return bluebird.map(controllers,async (controller)=>{

         var localUrls =urls[controller.controller]
         console.log("browser[controller.controller == 'liverpool' ? liverpool : 'others' ].identifiyer");
         console.log(browser[controller.controller == 'liverpool' ? 'liverpool' : 'others' ].identifiyer);
                return await bluebird.map(localUrls, async (url) => {
  
                  console.log(url);
                const result = await withPage(browser[controller.controller == 'liverpool' ? 'liverpool' : 'others' ].browser)(async (page) => {
                   
                  var protocolName = 'Scraper';
                    var imp =  `./scrapper/${controller.controller}/` + controller.controller + protocolName + '.js';
                    var GeneralScraperItem = await import(imp)
                    console.log('GeneralScraperItem');
                    console.log(GeneralScraperItem);
                  
                    var { Scraper} = GeneralScraperItem;
                    var Scrape = new Scraper(page,Proxy);    
 
                     var res = await Scrape.scraper(url.url);
                     var resObj ={dataArr:res, controller_id: controller.id,category:url.category, url_id:url.url_id};

                    if(resObj.dataArr.pageFailsDueToNotResultsOrErrorPage === undefined){
                      console.log('resObj')
                      console.log(resObj)
                      await this.updateDb(resObj);
                     var notify = new Notifiyer(controller.controller,controller.id,url.url_id,url.category,controller.discount_starts_at);
                      await notify.sendNotifications()
                    
                     return resObj;
                    }
                    else{
                      return {data:false,url_id:url.url_id, category:url.category,errorMessage: resObj.dataArr.erroInformation,controller : controller.controller, controller_id:controller.id};
                    }
                  });
                  return result;
                },{concurrency: 3});

        });
      })
      return results;
    } catch (error) {
      console.error(error);
    }

  }
 async updateDb(categoryData){
return new Promise(async (resolve,reject)=>{
  try {
    if(categoryData.error != undefined){
      console.log(categoryData)
      return categoryData.error;
    }
    categoryData = [categoryData]
    console.log('categoryData : ');
    console.log(categoryData);

       await categoryData.map(async toChunk =>{
          console.log(toChunk.dataArr.length);
         var chunkedArr = await getArrayAsChunks(toChunk.dataArr, 100);
          await chunkedArr.map(async oneChunkElement =>{
            oneChunkElement.map(async product =>{
              try{
                product.controller_id = toChunk.controller_id;
                product.url_id = toChunk.url_id;
                product.category = toChunk.category;
               
              }catch(e){
                console.log('e');
                console.log(e);
              }
            })
            var sql = "INSERT INTO scraped_data (product,discount,newPrice,oldPrice,url,prime,img_url,controller_id,url_id,category) VALUES ?";
            var records= oneChunkElement.map(e=>{return Object.values(e)})
            await pool.query(sql, [records], function(err, result) {
              console.log('err');
              console.log(err);
              console.log("result");
              console.log(result);
          });
          })
        })
        
        await pool.query(`
        DELETE t1 FROM scraped_data t1
			INNER JOIN scraped_data t2 
			WHERE t1.id > t2.id AND t1.product = t2.product
        `); 
        //DELETE FROM scraped_data WHERE  CAST(oldPrice AS DECIMAL(10,2)) < 900.00
        await pool.query(`DELETE FROM scraped_data WHERE  CAST(oldPrice AS DECIMAL(10,2)) < 900.00`);
        await pool.query(`DELETE FROM scraped_data WHERE updated_at < NOW() - INTERVAL 1 DAY`);
        var reviewedProduct =await pool.query(`
        SELECT DISTINCT *
        FROM scraped_reviewed
        WHERE product IN (SELECT product FROM scraped_data);
        `);
        var productsInDb =await pool.query(`
        SELECT DISTINCT * 
        FROM scraped_data
        WHERE product IN (SELECT product FROM scraped_reviewed);
        `);
        
        for(let productReviewed of reviewedProduct){
          for(let productInDb of productsInDb)
          {
          if(productReviewed.product === productInDb.product){  
          if(productReviewed.interested_in)
          {
            if(productReviewed.discount === productInDb.discount || productReviewed.discount * -1 > productInDb.discount * -1  ){
              await pool.query('DELETE FROM scraped_data WHERE id=? ', productInDb.id)
            }
          }else if(productReviewed.excluded){
            await pool.query('DELETE FROM scraped_data WHERE id=? ', productInDb.id)
          }
        }
        }
        }
console.log('finished')
resolve(true)
  } catch (error) {
    reject(false);
  }
})
    
 
  }
}

async function CronJobInitializer() {

  const Proxy = 1;

  var cron = new CronDataExtractor();
  var links = await cron.runJobsInParallel(Proxy);
  
  for( let link of links){
    console.log('link');
    if(link[0].data === false){

      await Notifiyer.sendCostumNotification(link[0].controller_id,`${capitalize(link[0].controller)}: Error al extraer datos`,`(Error en la categoria : ${capitalize(link[0].category)} )\nel sistema ha arrojado el error : \n${link[0].errorMessage}`)
    }
  }
  
}
CronJobInitializer();

const task = cron.schedule('0 0 */6 * * *', async () =>{
  CronJobInitializer();
});

task.start()

export default CronDataExtractor;

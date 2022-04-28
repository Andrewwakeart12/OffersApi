import pool from "./database.js";
import othersBrowser from "./scrapper/othersBrowser.js";
import liverpoolBrowser from "./scrapper/liverpoolBrowser.js";
import bluebird from "bluebird";
import ProxyManager from './ProxyManager.js';
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
    const withBrowser = async (fn) => {
      var otherBrowse= await othersBrowser.startBrowser(Proxy);
      var liverpoolBrowse= await othersBrowser.startBrowser(Proxy);
      const browser = {liverpool:{browser:liverpoolBrowse, identifiyer:'liverpool'},others:{browser:otherBrowse,identifiyer:'other'}};
      try {
        return await fn(browser);
      } finally {
        await otherBrowse.close();
        await liverpoolBrowse.close();
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
      var controllers = await pool.query(
        "SELECT id,controller FROM scraper_controller WHERE user_id=1 && controllerActive=1",
      );
      const urls = await this.getLinks()
      const results = await withBrowser(async (browser) => {

        return bluebird.map(controllers,async (controller)=>{

         var localUrls =urls[controller.controller]
         console.log("browser[controller.controller == 'liverpool' ? liverpool : 'others' ].identifiyer");
         console.log(browser[controller.controller == 'liverpool' ? 'liverpool' : 'others' ].identifiyer);
                return bluebird.map(localUrls, async (url) => {
  
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
                     var resObj ={results:res, controller_id: controller.id,category:url.category, url_id:url.id};
                   
                     return resObj;
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
  updateDb(constructor_id,url_id,category){

  }
}

async function proob() {

  const Proxy = new ProxyManager();
  await Proxy.init();

  var cron = new CronDataExtractor();
  var links = await cron.runJobsInParallel(Proxy);
  console.log(links[0][0]);
}
proob();
export default CronDataExtractor;

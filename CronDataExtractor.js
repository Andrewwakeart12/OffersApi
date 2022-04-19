const pool = require("./database");
const browserObject = require("./scrapper/browser");
const bluebird = require("bluebird");
const {Scraper} = require('./scrapper/amazon/amazonScraper');
const ProxyManager = require('./ProxyManager');
class CronDataExtractor {
  /*return obj of links by controller
        {
           amazon : [
               URL,URL,...
           ],
           liverpool: [
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
      const browser = await browserObject.startBrowser(Proxy);
      try {
        return await fn(browser);
      } finally {
        await browser.close();
      }
    };
    const withPage = (browser) => async (fn) => {
      const page = await browser.newPage();
 
      try {
        await page.setRequestInterception(true);
        await page.setDefaultNavigationTimeout(0);
        await page.setDefaultTimeout(0);
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');
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
        return bluebird.map(controllers,async (controller)=>{
  
      const results = await withBrowser(async (browser) => {
        
         var localUrls =urls[controller.controller]
                return bluebird.map(localUrls, async (url) => {
  
                  console.log(url);
                  const result = await withPage(browser)(async (page) => {
                    var protocolName = 'Scraper';
                    var imp =  `./scrapper/${controller.controller}/` + controller.controller + protocolName + '.js';
                    var GeneralScraperItem = await import(imp)
                   
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
}

async function proob() {

  const Proxy = new ProxyManager();
  await Proxy.init();

  var cron = new CronDataExtractor();
  var links = await cron.runJobsInParallel(Proxy);
  console.log(links);
}
proob();
module.exports = CronDataExtractor;

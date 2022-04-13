const pool = require("./database");
const browserObject = require("./scrapper/browser");
const bluebird = require("bluebird");
const {Scraper} = require('./scrapper/amazon/amazonScraper');
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
          controllerUrls.push(url.product_url);
        }
        linksArr[controller.controller] = controllerUrls;
      }
    }
    return linksArr;
  }
  async runJobsInParallel() {
    const withBrowser = async (fn) => {
      const browser = await browserObject.startBrowser();
      try {
        return await fn(browser);
      } finally {
        await browser.close();
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
        "SELECT controller FROM scraper_controller WHERE user_id=1 && controllerActive=1",
      );
      const urls = await this.getLinks()
  
      const results = await withBrowser(async (browser) => {
  
        return bluebird.map(controllers,async (controller)=>{
         var localUrls =urls[controller.controller]
                return bluebird.map(localUrls, async (url) => {
  
                  console.log(url);
                  const result = await withPage(browser)(async (page) => {
                    var protocolName = 'Scraper';
                    var imp =  `./scrapper/${controller.controller}/` + controller.controller + protocolName + '.js';
                    var GeneralScraperItem = await import(imp)
                   
                    var { Scraper} = GeneralScraperItem;
                    var Scrape = new Scraper(page);    
  
                     var res = await Scrape.scraper(url);
                    return res;
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

  
  var cron = new CronDataExtractor();
  var links = await cron.runJobsInParallel();
  console.log(links);
}
proob();
module.exports = CronDataExtractor;

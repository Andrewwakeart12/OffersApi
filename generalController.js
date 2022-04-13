const browserObject = require('./scrapper/browser');
preventInfiniteLoop = 0;
preventInfiniteLoop2 = 0;
restarted = false;
var count = 0;
var resultVal = {};
const CronDataExtractor = require('./FirstAproachToClassExtractor');
async function scrapeAll(urlsArr){
    var pool =await import('./database.js');
    pool = pool.default
    try{
        var controllers = await pool.query('SELECT * FROM scraper_controller')
        var ScraperArray = [];
        console.log(controllers)
        var browser = await browserObject.startBrowser();
        for(let controller of controllers){
            
            var protocolName = 'Scraper';
            var imp =  `./scrapper/${controller.controller}/` + controller.controller + protocolName + '.js';
            var GeneralScraperItem = await import(imp)
            var { Scraper} = GeneralScraperItem;
            var Scrape = await Scraper.create(browser);    
            ScraperArray.push({name: controller.controller, ScraperObj : Scrape, urls : urlsArr[controller.controller] });    
     /*       if(result.results != false && result.results != undefined){
                Scrape.destroy()
                Scrape = null;
                console.log('result from finall stage');
            }*/
        }
        console.log(ScraperArray);


    }
    catch(err){
        console.log("Erro While extracting error => ", err);
        console.log("error Message : ", err.message);
        "Could not resolve the browser instance => \n" + err
    }
}
async function proob() {
    var cron = new CronDataExtractor();
    var links = await cron.getLinks();
    scrapeAll(links);

}
  proob();
module.exports = (url) => scrapeAll(urlsArr)
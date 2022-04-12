const browserObject = require('./scrapper/browser');

preventInfiniteLoop = 0;
preventInfiniteLoop2 = 0;
restarted = false;
var count = 0;
var resultVal = {};

async function scrapeAll(url){
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
            var Scrape = await Scraper.create(url,browser);    
            ScraperArray.push({name: controller.controller, ScraperObj : Scrape, results: []});    
     /*       if(result.results != false && result.results != undefined){
                Scrape.destroy()
                Scrape = null;
                console.log('result from finall stage');
            }*/
        }
        console.log(ScraperArray);


    }
    catch(err){
        console.log("Could not resolve the browser instance (controller : A )=> ", err);
        console.log("error Message : ", err.message);
        "Could not resolve the browser instance => \n" + err
    }
}
scrapeAll('a')
module.exports = (url) => scrapeAll(url)
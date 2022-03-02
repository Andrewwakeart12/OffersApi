const Scraper = require("./amazonScraper.js");
const browserObject = require('../browser');

preventInfiniteLoop = 0;
preventInfiniteLoop2 = 0;
restarted = false;
var count = 0;
var resultVal = {};

async function scrapeAll(url){


    try{

        var Scrape = await Scraper.create(url);        
        var result = await Scrape.scraper();
        if(result.resetState != undefined && result.resetState === true ){
            parallelResults = result.results;
            let i = 0;
            while(i < 20){
                await Scrape.resetBrowser();
                var results = await Scrape.scraper();
                if(results.resetState === true){
                    if(results.results.length > 0){
                        console.log(result.results);
                        await result.results.concat(results.results);
                        console.log(result.results);
                    }
                    i++;
                    continue;
                }else{
                    await result.results.concat(results.results);
                    break;
                }
            }  
        }
        if(result.results != false && result.results != undefined){
            Scrape = null;
            console.log('result from finall stage');
            console.log(result.results.length)
            return result.results;
        }
    }
    catch(err){
        console.log("Could not resolve the browser instance (controller : A )=> ", err);
        console.log("error Message : ", err.message);
        "Could not resolve the browser instance => \n" + err
    }finally{
        return result.results;
    }
}

module.exports = (url) => scrapeAll(url)
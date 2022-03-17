const Scraper = require("./amazonScraper.js");
const browserObject = require('../browser');
preventInfiniteLoop = 0;
preventInfiniteLoop2 = 0;
restarted = false;
var count = 0;
var resultVal = {};
const log = (color, text) => {
    console.log(`${color}%s${Log.reset}`, text);
    };
const Log = require('../../toolkit/colorsLog');
async function scrapeAll(url){


    try{

        var Scrape = await Scraper.create(url);        
        var result = await Scrape.scraper();

        if(result.results != false && result.results != undefined){
            Scrape.destroy()
            Scrape = null;
            console.log('result from finall stage');
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
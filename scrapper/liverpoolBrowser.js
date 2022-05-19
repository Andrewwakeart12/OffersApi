import puppeteer from 'zyte-smartproxy-puppeteer';
//import puppeteer from 'puppeteer';
import random_ua from 'modern-random-ua';


var browser;

async function startBrowser(){
    try {
        var argumentsForBrowser= [
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--no-zygote',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list'
        ];
       console.log("Opening the browser......");
        browser = await puppeteer.launch({
            pipe: true,
            headless: true,
            ignoreHTTPSErrors: true,
            slowMo: 0,
           Headers: {
                'X-Crawlera-Region': 'MX',
                'X-Crawlera-Profile': 'pass',
                'X-Crawlera-Cookies': 'disable'
               },
         spm_apikey:'2c4cf206e51c4d598b90bf8885626dc8',
            
            args: argumentsForBrowser
        });
    return browser;

    } catch (err) {
        console.log("Could not resolve the browser instance (browser) => ", err);
        console.log("error Message : ", err.message);
        "Could not resolve the browser instance => \n" + err
    }
}
async function closeB(){
    await browser.close();
}
export default {
    startBrowser,
    closeB
};

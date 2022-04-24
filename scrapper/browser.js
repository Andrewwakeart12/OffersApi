import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import random_ua from 'modern-random-ua';



var browser;

async function startBrowser(){
    try {
        var argumentsForBrowser= [
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list'
        ];
       console.log("Opening the browser......");
       puppeteer.use(StealthPlugin());
        browser = await puppeteer.launch({
            pipe: true,
            headless: false,
            ignoreHTTPSErrors: true,
            slowMo: 0,
            userAgent: random_ua.generate(),
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

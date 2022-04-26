import puppeteer from 'zyte-smartproxy-puppeteer';
//import puppeteer from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import useProxy from 'puppeteer-page-proxy';
import randomUA from 'modern-random-ua';

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
            '--ignore-certifcate-errors-spki-list',
            '--disable-web-security',
            '--lang=en-US,en;q=0.9',
            '--window-size=1920,1080',
        ];
       console.log("Opening the browser......");
    //   puppeteer.use(StealthPlugin());
        browser = await puppeteer.launch({
            pipe: true,
            headless: false,
          spm_apikey:'2c4cf206e51c4d598b90bf8885626dc8',
            ignoreHTTPSErrors: true,
            slowMo: 0,
            userAgent: randomUA.generate(),
            args: argumentsForBrowser,
            devtools:true
        });
    var page =await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.setDefaultTimeout(0);
    await page.setViewport({
        width: 1124 + Math.floor(Math.random() * 100),
        height: 768 + Math.floor(Math.random() * 100),
    })
   // await page.emulate(iPhone);
    await page.setRequestInterception(true);
    var requestCounter = 0;
    var requestCounterNotPassed = 0;
    page.on('request', (request) => {
        console.log(`request type = ${request.resourceType()}`);
        if (  request.resourceType() === 'stylesheet' || request.resourceType() === 'font' || request.resourceType() === 'image'  ){
            console.log(`request number not passed: ${requestCounterNotPassed++}`);
            request.abort();
     } else {
        console.log(`request number : ${requestCounter++}`);
            request.continue();
        }
    });
    page.goto('https://www.liverpool.com.mx/tienda/Bocinas/N-MyN5EGLkRkJnbWQM0oybC2hMjTpowD02XYug5X8PnmSQU8hLqiO%2FS81%2BLpQJgrYE');

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
startBrowser();


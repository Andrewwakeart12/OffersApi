import puppeteer from 'puppeteer-extra';
//import puppeteer from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import useProxy from 'puppeteer-page-proxy';
import randomUA from 'modern-random-ua';
import ProxyManager from './ProxyManager.js';
var browser;

async function startBrowser(){
    try {
        var Proxy = new ProxyManager();
        Proxy.init();
        var prox = await Proxy.getRandomProxy();
        
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
    puppeteer.use(StealthPlugin())

        browser = await puppeteer.launch({
            pipe: true,
            headless: false,
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
   // await page.emulate(iPhone);          &
    var requestCounter = 0;
    var requestCounterNotPassed = 0;

    page.setRequestInterception(true)

    console.log(prox.proxy);

//    page.goto('file:///home/obe/Descargas/P%C3%A1gina%20no%20disponible%20-%20Liverpool.html',{waituntil:'networkidle0'});
//https://www.liverpool.com.mx/tienda/Computadoras/N-MyN5EGLkRkJnbWQM0oybCwDb51HPoq41uykVTx%2F8p7q4Lv5kmJ%2FB7n9SHDZAiZOr/page-4
    page.goto('https://www.elektra.mx/categorias-populares',{waituntil:'networkidle0'});
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


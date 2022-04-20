const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const request = require('request');
const cheerio = require('cheerio'); 
const axios = require('axios');
const { response } = require('express');
const randomUA = require('modern-random-ua');
const proxyChain = require('proxy-chain');
let ip_addresses = [];
let port_numbers = [];
let country = [];
var get_proxy_try_counter =  0


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
            '--proxy-server=http://188.165.59.127:3128',
            '--ignore-certifcate-errors-spki-list'
        ];
       console.log("Opening the browser......");
       puppeteer.use(StealthPlugin());
        browser = await puppeteer.launch({
            pipe: true,
            headless: false,
            ignoreHTTPSErrors: true,
            slowMo: 0,
            userAgent: randomUA.generate(),
            args: argumentsForBrowser
        });
    var page =await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.setDefaultTimeout(0);
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


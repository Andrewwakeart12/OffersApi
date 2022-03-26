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

puppeteer.use(StealthPlugin());
var browser;
async function getProxy(){
    var resetGet = 0
    var success = false
    while(!success && resetGet < 10){
    try{
        var res =await  axios.get('https://api.proxyorbit.com/v1/?token=-ZZhH3ez3XLjAMii06NW1Ls9WluEd3I1oNJLbMbaJRo&ssl=true&amazon=true&protocol=http');
        if(res.data != undefined){
            success = true;
        }
    }catch(e){
        console.log(e.message)
        if(e.message.trim() === 'connect ECONNREFUSED 165.232.130.146:443'){
            res = {data:{websites:{amazon:undefined}}};
            console.log('error break')
            break;
        }
        if(e.message.trim() === 'getaddrinfo EAI_AGAIN api.proxyorbit.com'){
            console.log('error')
            resetGet++;
            continue;
        }
	if(e.message === 'Request failed with status code 502'){
	 break;
	}
	   
        if(res.data === undefined){
            console.log('error')
            resetGet++;
        }else{
            res = {data:{websites:{amazon:undefined}}};
            console.log('error break')
            break;
        }
    }
}
if(success === false){
	return false;
}
        if(res.data.websites.amazon != undefined){
            if(res.data.websites.amazon == true){
                return res.data.curl;
            }
        }else if(res.data === undefined){
            return false;
        }else{
            return false;
        }
return false;


}
async function startBrowser(){
 var proxy  = await getProxy();
	console.log(proxy)
    try {
       console.log('proxy:');
       console.log(proxy);
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
        if(proxy != false && proxy != null){
            (proxy != false) && '--proxy-server=',
            argumentsForBrowser.push('--proxy-server=' + proxy)
        }
       console.log("Opening the browser......");
        browser = await puppeteer.launch({
            pipe: true,
            headless: true,
            ignoreHTTPSErrors: true,
            slowMo: 0,
            userAgent: randomUA.generate(),
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
module.exports = {
    startBrowser,
    closeB
};

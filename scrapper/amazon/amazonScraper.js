const e = require("express");
const res = require("express/lib/response");
const { restart } = require("nodemon");
const browserObject = require('../browser');
var colors = require('colors');
colors.enable();
const Log = require('../../toolkit/colorsLog');
const log = (color, text) => {
    console.log(`${color}%s${Log.reset}`, text);
    };
class Catcha {
    obj;

    constructor(obj) {
        this.obj = obj;
    }
}
class CAPF {
    message;

    constructor(message) {
        this.message = message;
    }
}
class DERR {
    message;

    constructor(message) {
        this.message = message;
    }
}
class Scraper {
    //1.initial propertys:
    url;
    browser;
    paginationValue;

    //2.browser related propertys:
    page;
    browserObject;
        //2.1 pagination property:   
        maxClicks = null;
        //2.2 pagination value:
        comprobateActualPage = { actualPage: 0 };
        //2.3 extracted data final arr:
        result = { results: [] };
        //2.4 pagination clicked times property:
        clickedTimes = 0;
        
    //3.queueable propertys for promises:
    reloadTime = [];
    extractDataLoopPromises = [];
        //3.1resolvers:
        resolveTimeOut = [];

    //4.state propertys:
    catcha = false;

    //5.error counting propertys : 
        //5.1 reset browser counter:
        resetBrowsersInstanceError = 0;
        //5.2 timeOuts executed counter
        timeOuts = 0;
        //5.3 prevent unnesesary page resets: 
        resetDueToNotChargedPage = false;

    //1.start object methods : 
        //1.1 creates and return an object method:
        static async create(url, paginationValue) {
            const newobject = new Scraper();
            await newobject.initialize(url, paginationValue);
            return newobject;
        }
        //1.2 initialize the values for the returned object
        async initialize(url, paginationValue) {
            console.log('Start browser in Scrape object')
            this.url = url;
            this.paginationValue = paginationValue;
            this.browser = await browserObject.startBrowser();
            this.page = (await this.browser.pages())[0];
            await this.page.setRequestInterception(true);
            this.page.on('request', (req) => {
                if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image'  ) {
                    req.abort();
                }
                else {
                    req.continue();
                }
            });
            this.reloadTime = [];
        }
    //2.Handle stages:
        //2.1 stage 1 - set the page wait for load method so it cancels the charge of css and js and the page charges faster
        async waitForRequestToFinish(page, requestUrl, timeout) {
            page.on('requestfinished', onRequestFinished);
            let fulfill, timeoutId = (typeof timeout === 'number' && timeout >= 0) ? setTimeout(done, timeout) : -1;
            return new Promise(resolve => fulfill = resolve);
            function done() {
                page.removeListener('requestfinished', onRequestFinished);
                clearTimeout(timeoutId);
                fulfill();
            }
            function onRequestFinished(req) {
                if (req.url() === requestUrl) done();
            }
        }
        //2.2 gets the initial values:
            //2.2.1 gets the max number of paginations:
            async getMaxclicks() {
                var page = await this.page;
                this.maxClicks = await page.waitForSelector('.a-section.a-spacing-small.a-spacing-top-small').then(() => {
                    return page.evaluate(async () => {
                        var str = document.querySelector('.a-section.a-spacing-small.a-spacing-top-small').innerText.split(" ")
                        var resultsPerPage = parseInt(str[0].split('-').pop());
                        var totalResults = str.map((e) => {
                            return parseInt(e.replace(',', ''))
                        }).filter(Boolean).pop()
                        var maxClicks = 0;
                        if (str[2] != 'más') {
                            maxClicks = await Math.ceil(totalResults / resultsPerPage);
                        } else if (str[2] === 'más') {
                            maxClicks = parseInt(document.querySelectorAll('.s-pagination-item.s-pagination-disabled')[1].innerText);
                        }
                        return maxClicks;
                    })
                })
            }
        //2.3 start scraping:
        async scraper() {
                var success = false;
                var retry = 0;
                var restartFunction;
                while (!success && retry < 10) {
                    try {

                        var page = this.page;
                        log(Log.fg.white + Log.bg.green,"_Scraper.scraper(): page its setted, proceed navigation");
                        console.log(`_Scraper.scraper().page.goto(): Navigating to ${this.url}...`);
        
        
                        await page.setDefaultNavigationTimeout(0);
                        await page.setDefaultTimeout(0);
        
                        if (page === undefined) {
                            result = {
                                results: false,
                                pagination: false,
                                error: true,
                                nextPageUrl: false,
                                criticalError: true,
                                paginationValue: false
                            };
                            await this.resetBrowser();
                            retry++;
                        }
        
                        var navigationSuccess = false;
                        var navigationFails = 0;
                        while(!navigationSuccess && navigationFails < 5 ){
                            await page.goto(this.url,{timeout: 10000}).then(res=>{
                                console.log(`Navigation to ${this.url} succeded`.green)
                                navigationSuccess = true;
                            }).catch((e) => {
                                log(Log.fg.white + Log.bg.red, "_Scraper: Error in page.goto() : ");
                                console.log(e.message.red)
                                navigationFails++;
            
                            });
                            await this.waitForRequestToFinish(page, this.url, 1000 * 10);
                        }
                        if(navigationSuccess != true && navigationFails >= 5){
                            throw new CAPF('Error navigation failed in first run');
                        }
                        
        
                        this.resetDueToNotChargedPage = true;

                        this.setReloadTime('scraper()').then(res=>{log(Log.fg.white + Log.bg.green,"_Scraper.scraper().setTimeout() called - succesfull:");log(Log.fg.green,res);}).catch(e => {log(Log.fg.white + Log.bg.red,"_Scraper.scraper().setTimeout() called - error:");log(Log.fg.red,e.message); throw e });
                   
                        page.on("pageerror",{timeout:2000}, async function (err) {
                            log(Log.fg.white + Log.bg.red,'_Scraper.scraper().waitforselector: Page error:');
                            log(Log.fg.red ,err.error);
        
                            await Promise.all([
                                page.reload(),
                                page.waitForNavigation({ waitUntil: ['domcontentloaded'] })]
                            )
                        });
        
                        page.on('error',{timeout:2000}, async (err) => {
                            log(Log.fg.white + Log.bg.red,'_Scraper.scraper().waitforselector: Page error:');
                            log(Log.fg.red ,err.error);
                          await Promise.all([
                                page.reload(),
                                page.waitForNavigation({ waitUntil: ['domcontentloaded'] })
                            ])
        
                        });
        
        
                        page.waitForSelector('.error-code', { timeout: 2000 }).then(async () => {
                            log(Log.fg.white + Log.bg.red,'_Scraper.scraper().waitforselector: Page error:');
                            log(Log.fg.red ,err.error);
                            await Promise.all([
                                page.reload(),
                                page.waitForNavigation({ waitUntil: ['domcontentloaded'] })]
                            )
                        }).catch(e => {
                            // console.log('e from error-code')
                            // console.log(e)
                        });
        
                        if (this.comprobateActualPage.actualPage === 0 && this.maxClicks === null || this.comprobateActualPage.actualPage === undefined && this.maxClicks === null) {
                            await this.getMaxclicks();
                        }
        
                        console.log('pagination value'.green)
                        console.log(`${this.paginationValue}`.green);
                        console.log('maxClicks: '.green)
                        console.log(`${this.maxClicks}`.green)
        
        
        
                            var extractedData=await this.extractDataLoop().then(res=>{console.log(`${res}`.green); if(res.results != false){return res.results}}).catch(e=>{console.log(`error from promise ${e.message}`.red);throw e});
                            if(extractedData.results != false){
                                await Promise.all([
                                    this.unsetTime(),
                                    this.unsetExtPromises(),
                                    this.closeBrowser(), this.unsetExtPromises()
                                ]);
                                    this.reloadTime = 0;
                                    this.resolveTimeOut = 0;
                                success = true;

                                return extractedData.results;
                            }else{
                                break;
                            }

                    } catch (e) {

                        console.log('ERROR IN SCRAPPER (UNNESESARY RESET?)'.red);
                        console.log('Message : '.red);
                        console.log(e.message != undefined ? e.message.red : e.red);
                        console.log('-----------------');
                        if (e.message != undefined) {
                            if (e.message.split(' ')[0] === "net::ERR_TIMED_OUT" || e.message.split(' ')[1] === "net::ERR_TIMED_OUT") {
                                if (restartFunction < 10) {
                                    restartFunction++;
                                    console.log('restarted withoud reset'.green);
                                    continue;
                                } else {
                                    this.unsetTime()
                                    this.result.resetState = true;
                                    await this.resetBrowser();
                                    retry++;
                                }
                            }
                        }

                        if (e.message != undefined) {
                            if(e.message === 'Error navigation failed in first run'){
                                console.log(`rebooting after fail in navigation to ${this.url}`);
                                this.result.resetState = true;
                                await this.resetBrowser();
                                retry++;
                            }
                            if (e.message.split(' ')[0] === "net::ERR_CONNECTION_RESET" || e.message.split(' ')[1] === "net::ERR_CONNECTION_RESET") {
                                if (restartFunction < 10) {
                                    restartFunction++;
                                    console.log('restarted');
                                    continue;
                                } else {
                                    this.unsetTime()
                                    this.result.resetState = true;
                                    await this.resetBrowser();
                                    retry++;
                                }
                            } else if (e.message === "net::ERR_CERT_AUTHORITY_INVALID at " + this.url) {
                                if (restartFunction < 10) {
                                    restartFunction++;
                                    console.log('restarted');
                                    continue;
                                } else {
                                    this.unsetTime()
                                    this.result.resetState = true;
                                    await this.resetBrowser();
                                    retry++;
                                }
                            } else if (e.message === "net::ERR_TUNNEL_CONNECTION_FAILED at " + this.url) {
                                if (restartFunction < 10) {
                                    restartFunction++;
                                    console.log('restarted');
                                    continue;
                                } else {
                                    this.unsetTime()
                                    this.result.resetState = true;
                                    await this.resetBrowser();
                                    retry++;
                                }
                            } else if (e.message === "net::ERR_NAME_NOT_RESOLVED at " + this.url) {
                                console.log('Err name not resolved');
                                if (restartFunction < 10) {
                                    restartFunction++;
                                    console.log('restarted');
                                    continue;
                                } else {
                                    this.unsetTime()
                                    this.result.resetState = true;
                                    await this.resetBrowser();
                                    retry++;
                                }
                            } else if (e.message === 'net::ERR_PROXY_CONNECTION_FAILED at ' + this.url) {
                                if (restartFunction < 10) {
                                    restartFunction++;
                                    console.log('restarted');
                                    continue;
                                } else {
                                    this.unsetTime()
                                    this.result.resetState = true;
                                    await this.resetBrowser();
                                    retry++;
                                }
                            } else if (e.message === 'net::ERR_EMPTY_RESPONSE at ' + this.url) {
                                if (restartFunction < 10) {
                                    restartFunction++;
                                    console.log('restarted');
                                    continue;
                                } else {
                                    this.unsetTime()
                                    this.result.resetState = true;
                                    await this.resetBrowser();
                                    retry++;
                                }
                            } else if ('CAPF:' + "Protocol error (Runtime.callFunctionOn): Session closed. Most likely the page has been closed." === e.message) {
                                if (restartFunction < 10) {
                                    restartFunction++;
                                    console.log('restarted');
                                    continue;
                                } else {
                                    this.unsetTime()
                                    this.result.resetState = true;
                                    await this.resetBrowser();
                                    retry++;
                                }
                            } else if (e.message === "Protocol error (Runtime.callFunctionOn): Session closed. Most likely the page has been closed.") {
                                if (restartFunction < 10) {
                                    restartFunction++;
                                    console.log('restarted');
                                    continue;
                                } else {
                                    this.unsetTime()
                                    this.result.resetState = true;
                                    await this.resetBrowser();
                                    retry++;
                                }
                            }
                            else if (e.message.trim() === "Navigation failed because browser has disconnected!") {
                                console.log(e.message);
        
                                if (restartFunction < 10) {
                                    restartFunction++;
                                    console.log('restarted');
                                    continue;
                                } else {
                                    this.unsetTime()
                                    this.result.resetState = true;
                                    await this.resetBrowser();
                                    retry++;
                                }
                            } else if (e.message.split(' ')[0] === 'Cannot') {
                                if (restartFunction < 10) {
                                    restartFunction++;
                                    console.log('restarted');
                                    continue;
                                }
        
        
                            } else if (this.catcha === true) {
                                if (restartFunction < 10) {
                                    restartFunction++;
                                    console.log('restarted');
                                    continue;
                                } else {
                                    throw new Catcha({ catcha: true });
                                }
                            }
                            else if (restartFunction < 20) {
                                await Promise.all([page.reload(),
                                page.waitForNavigation()]);
                                continue;
                            } else {
                                if (restartFunction < 10) {
                                    restartFunction++;
                                    console.log('restarted');
                                    continue;
                                } else {
                                    this.unsetTime()
                                    this.result.resetState = true;
                                    await this.resetBrowser();
                                    retry++;
                                }
                            }
                        } else if(e.message === 'net::ERR_ABORTED at '+ this.url){
                                this.unsetTime()
                            this.result.resetState = true;
                            await this.resetBrowser();
                            retry++;
                        }else if (e.obj.catcha) {
                            this.unsetTime()
                            this.result.resetState = true;
                            await this.resetBrowser();
                            retry++;
                        }
                        if (this.comprobateActualPage.actualPage < this.maxClicks)
                        {
                           await Promise.all([
                                this.unsetTime(),
                                this.unsetExtPromises(),
                                this.resetBrowser()
                            ]);
                            retry++;
                        }
        
                    }
                }
            }
        //2.4 set conditions to reload page if something fails or its a captcha in page:
        async setReloadTime(calledFrom) {
            var page = await this.page;
            if (this.reloadTime != 1 && this.reloadTime.length < 1 && this.comprobateActualPage.actualPage < this.maxClicks || this.maxClicks === null && this.timeOuts <= 10) {
                console.log(`Timeout setting... for : ${calledFrom}`);
                var promise = new Promise((resolve, reject) => {
                    var indexForResolveTimeout = this.resolveTimeOut.length;
                    this.resolveTimeOut.push({ resolvePromise: resolve, indexArr: indexForResolveTimeout })
                    setTimeout(async () => {
                        try {
                            if (this.resetDueToNotChargedPage === true) {
                                await Promise.all([
                                page.reload(),
                                page.waitForNavigation({ waitUntil: 'load' })
                                ]).then(res => {
                                    log(Log.fg.white + Log.bg.green,'_Scraper.reloadPromises()  - '+ calledFrom +' - resetDueToNotChargedPage - '+ this.resetDueToNotChargedPage ? 'true' : 'false' + ' : resolver of reloader')
                                    log(Log.fg.green,e);
                                }).catch(e=>{
                                    log(Log.fg.white + Log.bg.red,'_Scraper.reloadPromises()  - '+ calledFrom +' - resetDueToNotChargedPage - '+ this.resetDueToNotChargedPage ? 'true' : 'false' + ' : error of reloader');
                                    log(Log.fg.red,e);
                                })

                                if (this.timeOuts > 10) {
                                    throw new DERR('Timeout Exceeded');
                                }
                                this.setReloadTime('TimeOut(resetDueToNotChargedPage = true)').then(res=>{log(Log.fg.white + Log.bg.red,'_Scraper.setTimeOut()  - '+ calledFrom +' - resetDueToNotChargedPage - true : resolved in set time out after reload');this.timeOuts++; resolve('resolve after reload')}).catch(e=>{log(Log.fg.white + Log.bg.red,'_Scraper.settimeout() - '+ calledFrom +' - resetDueToNotChargedPage - true  : rejected in set timeout function',e.message); 
                                if(calledFrom === 'scraper()'){
                                    reject(e);
                                }else{
                                    throw e;    
                                }
                                })

                            } else {
                                this.resetDueToNotChargedPage = true;
                                this.setReloadTime('TimeOut(resetDueToNotChargedPage = false)').then(res=>{log(Log.fg.white + Log.bg.green,'_Scraper.setTimeOut() - '+ calledFrom +' - resetDueToNotChargedPage - false :resolved in set time out without reload');}).catch(e=>{ log(Log.fg.white + Log.bg.red,'_Scraper.settimeout() - resetDueToNotChargedPage - '+ calledFrom +' - false : rejected in set timeout function',e.message); 
                                    reject(e);
                                if(calledFrom === 'scraper()'){
                                    reject(e);
                                }else{
                                    throw e;    
                                }
                            })
                                resolve('solved without reload ' + indexForResolveTimeout)
                            }
                            if (this.catcha === false) {
                                resolve('solved with reload ' + indexForResolveTimeout)
                                await this.delay(Math.ceil(Math.random() * 5) * 1000);
    
                            }
                            this.timeOuts++;
    
                            if (this.timeOuts > 10) {
                                throw new DERR('Timeout Exceeded');
                            }
    
                            console.log('Time out')
                            resolve('solved with reload ' + indexForResolveTimeout)
                        } catch (error) {
                            log(Log.fg.white + Log.bg.red,'_Scraper.setTimeOut() - '+ calledFrom +': error in settimeout: ')
                            log(Log.fg.red,error.message)
                            reject(error);
                        }
                    }, 5000)
                })
                this.reloadTime.push({ promise: promise, indexArr: this.reloadTime.length });
                log(Log.fg.white + Log.bg.green,`Timeout setted... for : ${calledFrom}`)
    
                return promise;
    
            }
    
        }
        //2.5 get data from page
        async getData() {
            return new Promise(async (resolve,reject)=>{
    
                var success = false;
                var retry = 0;
                var err = '';
                while (!success && retry < 10) {
                try {
                    var page = await this.page;
                    log(Log.fg.white + Log.bg.green,'get data initialize');
                    await page.waitForSelector('#captchacharacters', { timeout: 3000 }).then(() => {
                        log(Log.fg.white + Log.bg.red,'_Scraper.getData().waitforselector: catcha ! asa');
                        this.catcha = true;
                        reject( new Catcha({ catcha: true }));
        
                    }).catch(e => {
                        if (e.message != undefined) {
                            if (e.message.split(" ")[0] === 'TimeoutError:') {
                                this.catcha = false;
                            }
                        } else {
                            throw e;
                        }
                    })
                    log(Log.fg.white + Log.bg.green,'_Scraper.getData() : catcha not found');
                    await page.viewport({
                        width: 1024 + Math.floor(Math.random() * 100),
                        height: 768 + Math.floor(Math.random() * 100),
                    })
                    var finalDataObject = await page.waitForSelector('.s-result-item > .sg-col-inner').then(async () => {
                        return page.evaluate(() => {
        
                            self = this;
        
        
                            function getDiscountValue(oldPrice, newPrice) {
                                //x = v1 - v2 | x/v1 * 100
                                let difference = newPrice - oldPrice;
                                let result = Math.round(difference / oldPrice * 100);
                                return result;
                            }
                            let finalDataOutput = [];
                            var amazonProducts = document.querySelectorAll('.s-result-item > .sg-col-inner')
        
                            for (e of amazonProducts) {
                                var finalDataObject = {
                                    product: '',
                                    discount: '',
                                    newPrice: '',
                                    oldPrice: '',
                                    url: '',
                                    prime: false
                                };
        
        
                                finalDataObject.product = e.querySelector('.a-section.a-spacing-none.a-spacing-top-small.s-title-instructions-style') != null ? e.querySelector('.a-section.a-spacing-none.a-spacing-top-small.s-title-instructions-style').innerText : e.querySelector('.a-size-medium.a-color-base.a-text-normal') != null ? e.querySelector('.a-size-medium.a-color-base.a-text-normal').innerText : null;
                                finalDataObject.img_url = e.querySelector('img') ? e.querySelector('img').src : null //img url
                                finalDataObject.url = e.querySelector('.a-section.a-spacing-none.a-spacing-top-small.s-title-instructions-style') != null ? e.querySelector('.a-section.a-spacing-none.a-spacing-top-small.s-title-instructions-style').querySelector('a').href : e.querySelector('.a-size-medium.a-color-base.a-text-normal').parentNode.href; //url
                                finalDataObject.newPrice = e.querySelector('.a-section .a-spacing-none > div > div > a > span > span.a-offscreen') != null ? e.querySelector('.a-section .a-spacing-none > div > div > a > span > span.a-offscreen').innerText.trim().replace(',', '').replace(/[&\/\\#,+()$~%'":*?<>{}]/g, '') : e.querySelector('.a-size-base.a-link-normal.s-link-style.a-text-normal') != null ? e.querySelector('.a-size-base.a-link-normal.s-link-style.a-text-normal').querySelector('.a-price > span').innerText.trim().replace(',', '').replace(/[&\/\\#,+()$~%'":*?<>{}]/g, '') : null; //new price
                                finalDataObject.oldPrice = e.querySelector('.a-section .a-spacing-none > div > div > a > .a-price.a-text-price > .a-offscreen') != null ? e.querySelector('.a-section .a-spacing-none > div > div > a > .a-price.a-text-price > .a-offscreen').innerText.trim().replace(',', '').replace(/[&\/\\#,+()$~%'":*?<>{}]/g, '') : e.querySelector('.a-size-base.a-link-normal.s-link-style.a-text-normal') != null ? e.querySelector('.a-size-base.a-link-normal.s-link-style.a-text-normal').querySelector('.a-price.a-text-price > span') != null ? e.querySelector('.a-size-base.a-link-normal.s-link-style.a-text-normal').querySelector('.a-price.a-text-price > span').innerText.trim().replace(',', '').replace(/[&\/\\#,+()$~%'":*?<>{}]/g, '') : null : null; //old price
                                finalDataObject.discount = getDiscountValue(parseFloat(finalDataObject.oldPrice), parseFloat(finalDataObject.newPrice)) < getDiscountValue(parseFloat(finalDataObject.newPrice), parseFloat(finalDataObject.oldPrice)) ? getDiscountValue(parseFloat(finalDataObject.oldPrice), parseFloat(finalDataObject.newPrice)) : getDiscountValue(parseFloat(finalDataObject.newPrice), parseFloat(finalDataObject.oldPrice));
                                finalDataObject.prime = e.querySelector('.a-icon.a-icon-prime.a-icon-medium') != null ? true : false;
        
                                if (finalDataObject.oldPrice != null) {
                                    finalDataOutput.push(finalDataObject);
                                }
                            }
                            return Promise.all(finalDataOutput).then(
                                finalDataOutput => {
                                    return finalDataOutput;
                                }).catch(e => {
                                    console.log(Log.fg.white + Log.bg.red,'_Scraper.getData().return promise : Error in Promise inside scraper');
                                    console.log(Log.fg.red,e.message);
                                });
        
                        })
                    }).catch((e) => {
                        if(e != 'Protocol error (Runtime.callFunctionOn): Session closed. Most likely the page has been closed.'){
                        log(Log.fg.white + Log.bg.red,'_Scraper.getData().waitforselector(results): error while trying to get data')
                            log(Log.fg.red,e.message)
                        }
                       throw e;
                    })
                    resolve(finalDataObject);
                } catch (error) {
                    await this.delay(3000);
                    log(Log.fg.white + Log.bg.red,'error in while')
                    if(error.message != 'Error: Protocol error (Runtime.callFunctionOn): Session closed. Most likely the page has been closed.' && error.message != 'Protocol error (Runtime.callFunctionOn): Session closed. Most likely the page has been closed.'){
                        log(Log.fg.white + Log.bg.red,error.message)
                    }else{
                        resolve(false)
                        break;
                    }
                  
                    err = error;
                    retry++;
                }
            }
            if(retry > 19){
                reject(err);
            }
            })
    
    
        }
            //2.5.1 start extract data loop:
            async extractDataLoop(){
                var resolveVar = 0;
              var  extData= new Promise(async (resolve,reject)=>{
                try {
                    var lastArr = [];
                    resolveVar = resolve;
                    for (let i = 0; parseInt(this.comprobateActualPage.actualPage) < this.maxClicks || this.maxClicks === 1 && this.clickedTimes != this.maxClicks && this.result.resetState != true; i++) 
                    {
            
                        console.log('bucle start')
                        var tempArr = [];
                        
                        if (this.catcha === true) {
                            await this.unsetTime();
                            throw new Catcha({ catcha: true });
                        }
                        if (this.comprobateActualPage.actualPage <= this.maxClicks - 1) {
                            console.log('bucle 1 step before comprobations')
            
                            tempArr = await this.getData().then(res=>{return res}).catch(e=>{throw e});
                            console.log('arrays comparations = ' + lastArr[0] === tempArr[0] ? true : false)
            
                            if (lastArr.length > 0 && tempArr != false) {
                                console.log('bucle temparr not empty')
            
                                if (lastArr[0] != tempArr[0]) {
                                    lastArr = tempArr;
                                    this.result.results = await this.result.results.concat(await tempArr);
                                    await Promise.all([
                                        this.unsetTime(),
                                        this.comprobateActualPageF()
                                    ])
                                    this.result = {
                                        results: this.result.results,
                                        pagination: this.comprobateActualPage.actualPage != false ? this.comprobateActualPage.actualPage : false,
                                        nextPageUrl: this.comprobateActualPage.nextPageUrl != false ? this.comprobateActualPage.nextPageUrl : false,
                                        error: false,
                                        paginationValue: this.comprobateActualPage.nextPageUrl != false ? this.maxClicks : false
                                    };
                                    var clicked = await this.clickNextPagination().catch(e => { throw e });
                                    this.delay(Math.ceil(Math.random() * 3) * 1000);
                                    if (clicked === false) {
                                        this.unsetTime()
                                        break;
                                    }
                                    if (clicked.error === true) {
                                        await Promise.all([
                                            page.reload(),
                                            page.waitForNavigation({ waitUntil: ['domcontentloaded'] })
                                        ]);
            
                                        continue;
                                    }
                                    this.setReloadTime('ExtracData').then(res => { log(Log.fg.white + Log.bg.green,'_Scraper.extractData() : solved in bucle 2'); console.log(res); }).catch(e => { throw e; });
                                    page.waitForSelector('.error-code',{timeout:5000}).then(async () => {
                                        await page.reload();
                                    }).catch(e => {
                                        //console.log('e from catcha')
                                        //console.log(e)
                                    });
                                    continue;
            

                                }
            
            
                            } else if(tempArr != false){
                                console.log('bucle tempar empty')
            
                                tempArr = await this.getData().then(res=>{return res}).catch(e=>{throw e});
            
                                lastArr = tempArr;
            
                                this.result.results = await this.result.results.concat(await tempArr);
            
                                console.log('before comprobate actual pge error')
            
                                if (this.maxClicks === 1) {
                                    break;
                                }
                                await Promise.all([this.comprobateActualPageF()])
            
                                this.result = {
                                    results: this.result.results,
                                    pagination: this.comprobateActualPage.actualPage != false ? this.comprobateActualPage.actualPage : false,
                                    nextPageUrl: this.comprobateActualPage.nextPageUrl != false ? this.comprobateActualPage.nextPageUrl : false,
                                    error: false,
                                    paginationValue: this.comprobateActualPage.nextPageUrl != false ? this.maxClicks : false
                                };
                                await this.unsetTime()
                                var clicked = await this.clickNextPagination().catch(e => { throw e });
                                this.delay(Math.ceil(Math.random() * 5) * 1000);
                                if (clicked === false) {
                                    this.unsetTime()
                                    break;
                                }
                                if (clicked.error === true) {
                                    await Promise.all([
                                        page.reload(),
                                        page.waitForNavigation({ waitUntil: ['domcontentloaded'] })
                                    ]);
            
                                    continue;
                                }
                                this.resetDueToNotChargedPage = true;
                                this.setReloadTime('ExtractData').then(res => { log(Log.fg.white + Log.bg.green,'_Scraper.extractDataLoop(): solved in bucle 1'); console.log(res); }).catch(e => { throw e; });
                                continue;
                            }
            
            
            
                        } else {
                            console.log('break final assign')
                            var finalArr = await this.getData().then(res=>{return res}).catch(e=>{throw e});
                            if(finalArr != false){
                                this.result.results = await this.result.results.concat(finalArr);
                            }
                            break;
                        }
            
                            restartFunction = 0;
                            await this.comprobateActualPageF();
                        }
        
                        resolve({results:this.result})
                } catch (error) {
                    reject(error);
                }
              
               })
               if(this.extractDataLoopPromises.length < 2){
                   extData = this.MakeQuerablePromise(extData);
                   this.extractDataLoopPromises.push({promise:extData , resolver:resolveVar});
               }
               return extData;
              
            }
        //2.6 desactive timeouts:
        async unsetTime() {
            this.resetDueToNotChargedPage = false;
            if (this.resolveTimeOut.length > 0) {
                console.log('this.resolveTimeOut');
                for (let promise of this.reloadTime) {
                    console.log(promise)
                    var resolveTime = this.resolveTimeOut[promise.indexArr]
                    resolveTime.resolvePromise('resolved');
                    console.log('promise after unsetTime')
                    console.log(promise)
                    this.reloadTime.splice(resolveTime.indexArr);
                    this.resolveTimeOut.splice(resolveTime.indexArr);
                }
            }
    
            if (this.reloadTime === 1) {
                this.reloadTime = [];
            }
            console.log(this.reloadTime);
    
            this.timeOuts = 0;
            console.log('Timeouts destroyed')
    
        }
        //2.7 click to next pagination:
        async clickNextPagination() {
            var page = await this.page;
            var res = 0
            await page.waitForSelector('.s-pagination-item.s-pagination-next.s-pagination-button.s-pagination-separator', { timeout: 5000 }).then(async () => {
                if (this.comprobateActualPage.actualPage <= this.maxClicks - 1) {
                    await Promise.all([
                        page.click('.s-pagination-item.s-pagination-next.s-pagination-button.s-pagination-separator'),
                        , page.waitForNavigation({ waitUntil: ['domcontentloaded'] }).catch((e) => { throw e })
                    ]);
                    page.waitForSelector('#captchacharacters', { timeout: 3000 }).then(() => {
                        console.log('catcha ! a')
                        this.catcha = true;
                        console.log(this.catcha);
    
                    }).catch(e => {
                        this.catcha = false;
                    })
                    res = true;
    
                    this.delay(Math.ceil(Math.random() * 10) * 1000);
                    this.clickedTimes++;
                    console.log('clicked!')
                } else {
                    res = false;
                }
            }).catch(e => {
                console.log('message from clickNextPagination');
                console.log(e.message);
    
            })
            return res;
    
    
        }
        //2.8 verify actual pagination:
        async comprobateActualPageF() {
            try {
    
                var page = await this.page;
                await page.waitForSelector('#captchacharacters', { timeout: 2000 }).then(() => {
                    console.log('catcha ! asa')
                    this.catcha = true;
                    console.log(this.catcha);
                    throw new Catcha({ catcha: true });
    
                }).catch(e => {
                    if (e.message != undefined) {
                        if (e.message.split(" ")[0] === 'TimeoutError:') {
                            this.catcha = false;
                        }
                    } else {
                        throw e;
                    }
                });
                this.comprobateActualPage = await page.waitForSelector('.s-pagination-selected',).then(() => {
                    return page.evaluate(
                        async () => {
                            if (document.querySelector('.s-pagination-selected') != null) {
    
                                var paginationSelectedValue = await parseInt(document.querySelector('.s-pagination-selected').innerText);
                                var pagination = {
                                    actualPage: paginationSelectedValue,
                                    nextPageUrl: document.querySelector('.s-pagination-selected').parentNode.querySelector('.s-pagination-next') ? document.querySelector('.s-pagination-selected').parentNode.querySelector('.s-pagination-next').href : false
                                }
                            } else {
                                var pagination = {
                                    actualPage: 0,
                                    nextPageUrl: false
                                }
    
                            }
    
                            return pagination;
                        })
    
                })
                if (this.comprobateActualPage.nextPageUrl != false) {
                    this.result.nextPageUrl = this.comprobateActualPage.nextPageUrl;
                    this.paginationValue = this.comprobateActualPage.actualPage;
                    this.url = this.comprobateActualPage.nextPageUrl;
                }
            } catch (e) {
                console.log('error from CAPF');
                throw new CAPF('CAPF:' + e.message);
            }
        }
        //2.9 if all the data its extracted returns this.result and apply the destroy() method
        //2.10 if theres an error apply the browserReset() method
    
    //3 tool kit:
        //3.1 wait x time before continue:
        async delay(time) {
            return new Promise(function (resolve) {
                setTimeout(resolve, time)
            });
        }
        //3.2 restart browser if something fails and its needed
        async resetBrowser() {
            try {
                if (this.resetBrowsersInstanceError < 20) {
                    console.log('reset beggi')
                    await Promise.all([this.unsetTime(),
                    this.closeBrowser()]);
                    this.resetBrowsersInstanceError++;
                    log(Log.fg.white + Log.bg.red,"browser restarted : " + this.resetBrowsersInstanceError)

                    if (this.comprobateActualPage.nextPageUrl != false && this.comprobateActualPage.nextPageUrl != undefined) {
                        this.url = this.comprobateActualPage.nextPageUrl;
                    }
    
    
                    this.browser = await browserObject.startBrowser();
                    this.page = (await this.browser.pages())[0];
                    await this.page.setRequestInterception(true);
                    this.page.on('request', (req) => {
    
                        if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image'  ) {
                            req.abort();
                        }
                        else {
                            req.continue();
                        }
                    });
                    this.reloadTime = [];
                    this.result.resetState = false;
                }
            } catch (error) {
                log(Log.fg.white + Log.bg.red,"_Scraper.resetBrowser: error message from reset browser: ");
                log(Log.fg.red,error.message);
            }
    
        }
        //3.3 Make a promise querable so you can know if its finished or not:
        MakeQuerablePromise(promise) {
            // Don't modify any promise that has been already modified.
            if (promise.isFulfilled) return promise;
        
            // Set initial state
            var isPending = true;
            var isRejected = false;
            var isFulfilled = false;
        
            // Observe the promise, saving the fulfillment in a closure scope.
            var result = promise.then(
                function(v) {
                    isFulfilled = true;
                    isPending = false;
                    return v; 
                }, 
                function(e) {
                    isRejected = true;
                    isPending = false;
                    throw e; 
                }
            );
        
            result.isFulfilled = function() { return isFulfilled; };
            result.isPending = function() { return isPending; };
            result.isRejected = function() { return isRejected; };
            return result;
        }
        //3.4 unset any promise that its not finished yet 
        async unsetExtPromises(){
            for(let prom of this.extractDataLoopPromises){
                if(prom.promise.isFulfilled() != true && prom.promise.isRejected() != true){
                    prom.resolver({results:false});
                }
            }
        }
        //3.5 close the browser and all the remaining process:
        async closeBrowser() {
            try {
                console.log('closing browser...')
                var b = await this.browser;
                await Promise.all([this.unsetTime(),
                b.close().catch(e => {
                    console.log('e from callback');
                    console.log(e);
                })]);
            } catch (error) {
                console.log('error from close Browser function');
                console.log(error);
            }
        }
        //3.5 destroys the object and the internal data
        destroy(){
            this.url = null;
            this.unsetTime();
            this.resolveTimeOut = null;
            this.reloadTime = null;
        }
}



module.exports = Scraper;

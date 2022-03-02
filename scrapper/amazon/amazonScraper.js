const e = require("express");
const res = require("express/lib/response");
const { restart } = require("nodemon");
const browserObject = require('../browser');

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
    url;
    browser;
    paginationValue;
    killId;
    reloadTime = 0;
    reloadTimeTwo = 0;
    percentage = 30
    catcha = false;
    initialized = false;
    page;
    browserObject;
    pageResetError = 0;
    result = { results: [] };
    maxClicks = null;
    comprobateActualPage = { actualPage: 0 };
    resetBrowsersInstanceError = 0;
    resultReset = 0;
    timeOuts = 0;
    clickedTimes = 0;
    proxy = '';
    constructor(url, paginationValue) {

    }
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
    async initialize(url, paginationValue) {
        console.log('Start browser in Scrape object')
        this.url = url;
        this.paginationValue = paginationValue;
        this.browser = await browserObject.startBrowser();
        this.page = (await this.browser.pages())[0];
        await this.page.setRequestInterception(true);
        this.page.on('request', (req) => {
            if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image' || req.resourceType() == 'script' || req.resourceType() == 'ping' || req.resourceType() == 'fetch') {
                req.abort();
            }
            else {
                req.continue();
            }
        });
        this.reloadTime = 0;
    }
    static async create(url, paginationValue) {
        const newobject = new Scraper();
        await newobject.initialize(url, paginationValue);
        return newobject;
    }
    async closeBrowser() {
        try {
            console.log('closing browser...')
            var b = await this.browser;
            await Promise.all([this.unsetTime(),
            this.reloadTime = 1,
            b.close().catch(e => {
                console.log('e from callback');
                console.log(e);
            })]);

        } catch (error) {
            console.log('error from close Browser function');
            console.log(error);
        }
    }
    async setReloadTime() {
        try{
            var page = await this.page;
            if (this.reloadTime != 1 && this.comprobateActualPage.actualPage < this.maxClicks || this.maxClicks === null && this.timeOuts <= 10) {
                console.log('Timeout setting...')
    
                this.reloadTime = setTimeout(async () => {
                    try {
                        await Promise.all([page.reload(),
                        page.waitForNavigation({ waitUntil: 'load' })
                        ])
    
                        if (this.catcha === false) {
                            await this.delay(Math.ceil(Math.random() * 5) * 1000);
                            this.setReloadTime().catch(e => { throw e; });
                        }
                        this.timeOuts++;
                        if (this.timeOuts > 10) {
                            this.reloadTime = 1;
                            throw new DERR('Timeout Exceeded');
                        }
                        console.log('Time out')
                    } catch (error) {
                        console.log('error in settimeout: ')
                        console.log(error.message)
                        throw error;
                    }
    
                }, 5000);
                console.log('Timeout setted')
    
            }
        }catch(e){
            throw e;
        }

    }
    async unsetTime() {
        await clearTimeout(this.reloadTime)
        this.timeOuts = 0;
        console.log('Timeouts destroyed')

    }
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
    getDiscountValue(oldPrice, newPrice) {
        //x = v1 - v2 | x/v1 * 100
        let difference = oldPrice - newPrice;
        let result = Math.round(difference / oldPrice * 100);
        return result;
    }
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
            throw e;

        })
        return res;


    }
    async comprobateActualPageF() {
        try {

            var page = await this.page;
            await page.waitForSelector('#captchacharacters', { timeout: 2000 }).then(() => {
                console.log('catcha ! asa')
                this.catcha = true;
                console.log(this.catcha);
                throw new Catcha({ catcha: true });

            }).catch(e => {
                if(e.message != undefined){
                    if(e.message.split(" ")[0] === 'TimeoutError:' ){
                        this.catcha = false;
                    }
                }else{
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
    async getData() {
        try {
            var page = await this.page;
            console.log('get data initialize');
            await page.waitForSelector('#captchacharacters', { timeout: 2000 }).then(() => {
                console.log('catcha ! asa')
                this.catcha = true;
                console.log(this.catcha);
                throw new Catcha({ catcha: true });

            }).catch(e => {
                if(e.message != undefined){
                    if(e.message.split(" ")[0] === 'TimeoutError:' ){
                        this.catcha = false;
                    }
                }else{
                    throw e;
                }
            })
            console.log('catcha not found');
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
                    console.log(finalDataOutput);

                    return Promise.all(finalDataOutput).then(
                        finalDataOutput => {
                            return finalDataOutput;
                        }).catch(e => {
                            console.log('Error in Promise inside scraper');
                            console.log(e);
                        });

                })
            }).catch((e) => {
                console.log('e from get data')
                console.log(e)
            })

            return finalDataObject;
        } catch (error) {
            throw error;
        }

    }
    async delay(time) {
        return new Promise(function (resolve) {
            setTimeout(resolve, time)
        });
    }
    async resetBrowser() {
        try {
            if (this.resetBrowsersInstanceError < 20) {
                console.log('reset beggi')
                await Promise.all([this.unsetTime(),
                this.closeBrowser()]);
                this.resetBrowsersInstanceError++;
                console.log("browser restarted : " + this.resetBrowsersInstanceError)
                console.log(this.resetBrowsersInstanceError)
                if (this.comprobateActualPage.nextPageUrl != false && this.comprobateActualPage.nextPageUrl != undefined) {
                    this.url = this.comprobateActualPage.nextPageUrl;
                }


                this.browser = await browserObject.startBrowser();
                this.page = (await this.browser.pages())[0];
                await this.page.setRequestInterception(true);
                this.page.on('request', (req) => {

                    if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image' || req.resourceType() == 'script' || req.resourceType() == 'ping' || req.resourceType() == 'fetch') {
                        req.abort();
                    }
                    else {
                        req.continue();
                    }
                });
                this.reloadTime = 0;
                this.result.resetState = false;
            }
        } catch (error) {
            console.log("error message from reset browser: ");
            console.log(error.message);
        }

    }


    async scraper() {
        var success = false;
        var retry = 0;
        var restartFunction;
        while (!success && retry < 40) {
            try {

                if (this.initialized === false) {
                    this.initialized = true;
                }
                var page = this.page;
                console.log("page in scraping");
                console.log(`Navigating to ${this.url}...`);


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


                await page.goto(this.url).catch((e) => {
                    console.log('e.message from goto')
                    console.log(e.message)
                    throw e;

                });
                await this.waitForRequestToFinish(page, this.url, 10000);

                this.setReloadTime().catch(e => { throw e; });
                page.on("pageerror", async function (err) {
                    console.log('Page error:');
                    console.log(err.error);

                    await Promise.all([
                        page.reload(),
                        page.waitForNavigation({ waitUntil: ['domcontentloaded'] })]
                    )
                });

                page.on('error', async (err) => {
                    console.log('Page error:');
                    console.log(err.error);
                    await Promise.all([
                        page.reload(),
                        page.waitForNavigation({ waitUntil: ['domcontentloaded'] })]
                    )

                });


                page.waitForSelector('.error-code').then(async () => {
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

                console.log('pagination value')
                console.log(this.paginationValue);
                console.log('maxClicks: ')
                console.log(this.maxClicks)



                var lastArr = [];
                for (let i = 0; parseInt(this.comprobateActualPage.actualPage) < this.maxClicks && this.clickedTimes != this.maxClicks - 1 && this.result.resetState != true; i++) {

                    console.log('bucle start')
                    var tempArr = [];

                    if (this.catcha === true) {
                        await this.unsetTime();

                    }
                    if (this.comprobateActualPage.actualPage <= this.maxClicks - 1) {
                        console.log('bucle 1 step before comprobations')

                        tempArr = await this.getData();
                        console.log('arrays comparations = ' + lastArr[0] === tempArr[0] ? true : false)

                        if (lastArr.length > 0) {
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
                                    this.reloadTime = 1;
                                    break;
                                }
                                if (clicked.error === true) {
                                    await Promise.all([
                                        page.reload(),
                                        page.waitForNavigation({ waitUntil: ['domcontentloaded'] })
                                    ]);

                                    continue;
                                }
                                this.setReloadTime().catch(e => { throw e; });


                                page.waitForSelector('.error-code').then(async () => {
                                    await page.reload();
                                }).catch(e => {
                                    //console.log('e from catcha')
                                    //console.log(e)
                                });
                            }


                        } else {
                            console.log('bucle tempar empty')

                            tempArr = await this.getData();

                            lastArr = tempArr;

                            this.result.results = await this.result.results.concat(await tempArr);

                            console.log('before comprobate actual pge error')

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
                                this.reloadTime = 1;
                                break;
                            }
                            if (clicked.error === true) {
                                await Promise.all([
                                    page.reload(),
                                    page.waitForNavigation({ waitUntil: ['domcontentloaded'] })
                                ]);

                                continue;
                            }
                            this.setReloadTime().catch(e => { throw e; });
                        }



                    } else {
                        console.log('break final assign')
                        this.result.results = await this.result.results.concat(await this.getData());
                        break;
                    }
                    restartFunction = 0;
                    await this.comprobateActualPageF();
                }
                success = true;
                await Promise.all([this.unsetTime(),
                this.closeBrowser()]);
                this.reloadTime = 1;

                return this.result;

            } catch (e) {
                console.log('ERROR IN SCRAPPER (UNNESESARY RESET?)');
                console.log('Message : ');
                console.log(e);
                console.log('-----------------');
                if (e.message != undefined) {
                    if (e.message.split(' ')[0] === "net::ERR_TIMED_OUT" || e.message.split(' ')[1] === "net::ERR_TIMED_OUT") {
                        if (restartFunction < 10) {
                            restartFunction++;
                            console.log('restarted');
                            continue;
                        } else {
                            this.reloadTime = 1;
                            this.result.resetState = true;
                            await this.resetBrowser();
                            retry++;
                        }
                    }
                }

                if (e.message != undefined) {
                    if (e.message.split(' ')[0] === "net::ERR_CONNECTION_RESET" || e.message.split(' ')[1] === "net::ERR_CONNECTION_RESET") {
                        if (restartFunction < 10) {
                            restartFunction++;
                            console.log('restarted');
                            continue;
                        } else {
                            this.reloadTime = 1;
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
                            this.reloadTime = 1;
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
                            this.reloadTime = 1;
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
                            this.reloadTime = 1;
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
                            this.reloadTime = 1;
                            this.result.resetState = true;
                            await this.resetBrowser();
                            retry++;
                        }
                    } else if (e.message ==='net::ERR_EMPTY_RESPONSE at ' + this.url) {
                                            if (restartFunction < 10) {
                            restartFunction++;
                            console.log('restarted');
                            continue;
                        } else {
                            this.reloadTime = 1;
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
                            this.reloadTime = 1;
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
                            this.reloadTime = 1;
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
                            this.reloadTime = 1;
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


                    }else if (this.catcha === true) {
                                            if (restartFunction < 10) {
                            restartFunction++;
                            console.log('restarted');
                            continue;
                        } else {
                            this.reloadTime = 1;
                            this.result.resetState = true;
                            await this.resetBrowser();
                            retry++;
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
                            this.reloadTime = 1;
                            this.result.resetState = true;
                            await this.resetBrowser();
                            retry++;
                        }
                    }
                } else if (e.obj.catcha) {
                    this.reloadTime = 1;
                    this.result.resetState = true;
                    await this.resetBrowser();
                    retry++;
                }
                if (this.comprobateActualPage.actualPage < this.maxClicks) {
                    this.reloadTime = 1;
                    this.result.resetState = true;
                    await this.resetBrowser();
                    retry++;
                }

            }
        }
    }

}



module.exports = Scraper;
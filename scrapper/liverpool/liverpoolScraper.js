import e, { querySelector } from "express";
import { enable } from "colors";
import useProxy from "puppeteer-page-proxy";
enable();
import { reset, bg, fg } from "../../toolkit/colorsLog";
const log = (color, text) => {
  console.log(`${color}%s${reset}`, text);
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
  selectedProxy=0;
  constructor(page, Proxy) {
    this.page = page;
    this.Proxy = Proxy;
  }
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
  //1.2 initialize the values for the returned object
  //2.Handle stages:
  //2.1 stage 1 - set the page wait for load method so it cancels the charge of css and js and the page charges faster
  async waitForRequestToFinish(page, requestUrl, timeout) {
    page.once("requestfinished", onRequestFinished);
    let fulfill,
      timeoutId =
        typeof timeout === "number" && timeout >= 0
          ? setTimeout(done, timeout)
          : -1;
    return new Promise((resolve) => (fulfill = resolve));
    function done() {
      page.removeListener("requestfinished", onRequestFinished);
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
    try {
      log(bg.green + fg.white, "Getting clicks");
      var page = await this.page;

      var uniqueErrorNameForImage = `Liverpool_Scraper.getMaxClicks()_saved${new Date().getTime()}.jpg`;
      page
        .screenshot({
          path: `/opt/lampp/htdocs/screenshots/${uniqueErrorNameForImage}`,
        })
        .catch((e) => {});
      log(
        bg.green + fg.white,
        `Liverpool_capture saved with the name ${uniqueErrorNameForImage}`
      );

      this.maxClicks = await page
        .waitForSelector(".col-lg-9.m-column_mainContent", { timeout: 10000 })
        .then((res) => {
          return page.evaluate(async () => {
            var productsLength =
              document.querySelectorAll(".m-product__card").length;
            var maxClicks = 0;

            if (productsLength >= 56) {
              maxClicks = Math.ceil(
                parseInt(
                  document.querySelector(".a-plp-results-title > span")
                    .innerText
                ) /
                  document.querySelectorAll(
                    ".m-product__listingPlp > .m-product__card"
                  ).length
              );
            } else {
              maxClicks = 1;
            }
            return maxClicks;
          });
        })
        .catch(async (e) => {
          log(
            bg.red + fg.white,
            "_Scraper.getMaxClicks() - error cause pagination was not found"
          );
          log(fg.red, e.message);
          var uniqueErrorNameForImage = `Liverpool_Scraper.getMaxClicks()_ERROR_PAGINATION UNFINDED_${new Date().getTime()}.jpg`;
          page
            .screenshot({
              path: `/opt/lampp/htdocs/screenshots/errors/${uniqueErrorNameForImage}`,
            })
            .catch((e) => {});
          log(
            bg.green + fg.white,
            `Liverpool_capture saved with the name ${uniqueErrorNameForImage}`
          );
          await page
            .waitForSelector("#captchacharacters", { timeout: 2000 })
            .then(() => {
              console.log("Liverpool: catcha ! a");
              this.catcha = true;
              console.log(this.catcha);
            })
            .catch((e) => {
              this.catcha = false;
            });
          return false;
        });

      if (this.maxClicks != false) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.log(error);
    }
  }
  //2.3 start scraping:
  async scraper(initialUrl) {
    this.url = initialUrl;
    var success = false;
    var retry = 0;
    var restartFunction;
    while (!success && retry < 15) {
        try {

            var page = this.page;
            
            if(this.selectedProxy === 0){
              console.log('this.Proxy.getRandomProxy() in scraper');
            var finalProxy = await this.Proxy.getRandomProxy();
                this.selectedProxy = finalProxy;
                console.log(this.selectedProxy);

            await useProxy(
              page,this.selectedProxy.proxy
          );
            }else{
            console.log('this.Proxy.getRandomProxy() in scraper (change) ');
            var finalProxy = await this.Proxy.changeProxy(this.selectedProxy.id);
                this.selectedProxy = finalProxy;
                console.log(this.selectedProxy);
                await useProxy(
                    page,this.selectedProxy.proxy
                );
            }
            
            log(fg.white + bg.green,"_Scraper.scraper(): page its setted, proceed navigation");
            console.log(`_Scraper.scraper().page.goto(): Navigating to ${this.url}...`);

            var navigationSuccess = false;
            var navigationFails = 0;
            while(!navigationSuccess && navigationFails <= 5 ){

                var prom = await Promise.all([
                    page.goto(this.url),
                    page.waitForNavigation( { timeout: 165000 } )]).then((res)=>{
                   
                    return true;
                }).catch((e) => {
                    log(fg.white + bg.red, "_Scraper: Error in page.goto() : ");
                    if(e.message.split(' ')[0] === "net::ERR_PROXY_CONNECTION_FAILED"){
                        return {proxy_not_connect :true};
                    }
                    console.log(e.message.red)
                    return false;
                });
                log(bg.yellow + fg.white,prom)
                    if(prom.proxy_not_connect != undefined)
                    {
                        if(prom.proxy_not_connect === true){
                            throw new DERR('Proxy Not Connected');
                        }
                    }
                navigationSuccess =  prom;
                
                if(navigationSuccess === true){
                    log(fg.white + bg.green,`Navigation to ${this.url} succeded`);
                }else{
                    var uniqueErrorNameForImage = `Amazon_Scraper.page.goto()_ERROR_WHILE_NAVIGATION_${(new Date()).getTime()}.jpg`;
                    page.screenshot({path:`/opt/lampp/htdocs/screenshots/errors/${uniqueErrorNameForImage}`}).catch(e=>{});
                    log(bg.green + fg.white,`capture saved with the name ${uniqueErrorNameForImage}`);
                   
                    navigationFails++;
                }
               
            }
            log(bg.cyan + fg.white,'after request');

            if(navigationSuccess === true && navigationFails >= 5){
                throw new CAPF('Error navigation failed in first run');
            }
            
            page.once("pageerror",{timeout:1000}, async function (err) {
                log(fg.white + bg.red,'_Scraper.scraper().waitforselector: Page error:');
                log(fg.red ,err.error);

                await Promise.all([
                    page.reload(),
                    page.waitForNavigation( { timeout: 16000 } )]
                )
            });

            page.once('error',{timeout:1000}, async (err) => {
                log(fg.white + bg.red,'_Scraper.scraper().waitforselector: Page error:');
                log(fg.red ,err.error);
              await Promise.all([
                    page.reload(),
                    page.waitForNavigation()
                ])

            });


            page.waitForSelector('.error-code', { timeout: 1000 }).then(async () => {
                log(fg.white + bg.red,'_Scraper.scraper().waitforselector: Page error:');
                log(fg.red ,err.error);
                await Promise.all([
                    page.reload(),
                    page.waitForNavigation( { timeout: 16000 } )]
                )
            }).catch(e => {
                // console.log('e from error-code')
                // console.log(e)
            });

            log(bg.cyan + fg.white, 'After error page comprobation');
            if(this.maxClicks === false){
                this.maxClicks = null;
            }
            if (this.comprobateActualPage.actualPage === 0 && this.maxClicks === null || this.comprobateActualPage.actualPage === undefined && this.maxClicks === null) {
                var getPaginationSuccess = false;
                var getPagintaionFails = 0;
                while(!getPaginationSuccess && getPagintaionFails < 5 ){
                var pag = await this.getMaxclicks();
                if(pag != true ){
                    if(this.catcha === true){
                        throw new DERR('!catcha')
                    }
                    await Promise.all([page.reload(),
                            page.waitForNavigation( { timeout: 16000 } )]);
                        this.maxClicks = null;
                        getPagintaionFails++;
                    }else{
                        getPaginationSuccess = true;
                    }
                }

                if(this.catcha === true){
                    throw new Catcha('!catcha')
                }
            }
            if(this.maxClicks === null && getPaginationSuccess != true && getPagintaionFails >= 5){
                throw new DERR('pagination load fails');
            }
            console.log('pagination value'.green)
            console.log(`${this.paginationValue}`.green);
            console.log('maxClicks: '.green)
            console.log(`${this.maxClicks}`.green)



                var extractedData=await this.extractDataLoop().then(res=>{log(bg.green + fg.white,res); if(res.results != false){return res}}).catch(e=>{console.log(`error from promise ${e.message}`.red);throw e});
                if(extractedData.results != false){
                        this.reloadTime = 0;
                        this.resolveTimeOut = 0;
                    success = true;
                    this.Proxy.markProxyAsUnused(this.selectedProxy.id);
                    return extractedData;
                }else{
                    break;
                }

        }   catch (e) {

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
                        retry++;
                    }
                }
            }

            if (e.message != undefined) {
                 if (this.catcha === true) {
                    if (restartFunction) {
                        restartFunction++;
                        console.log('restarted');
                        continue;
                    } 
                }
                if(e.message === 'pagination load fails'){
                    log(bg.red + fg.white,`rebooting after fail in getPagination()`);
                    this.result.resetState = true;
                    
                        retry++;
                }
                if(e.message === 'Error navigation failed in first run'){
                    console.log(`rebooting after fail in navigation to ${this.url}`);
                    this.result.resetState = true;
                    
                        retry++;
                }else if ('CAPF:' + "Protocol error (Runtime.callFunctionOn): Session closed. Most likely the page has been closed." === e.message) {
                    if (restartFunction < 10) {
                        restartFunction++;
                        console.log('restarted');
                        continue;
                    } else {
                        this.unsetTime()
                        this.result.resetState = true;
                        
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
                        
                        retry++;
                    }
                } else if (e.message.split(' ')[0] === 'Cannot') {
                    if (restartFunction < 10) {
                        restartFunction++;
                        console.log('restarted');
                        continue;
                    }


                }
                else if (restartFunction < 20) {
                    await Promise.all([page.reload(),
                    page.waitForNavigation( { timeout: 16000 } )]);
                    continue;
                } else {
                    if (restartFunction < 10) {
                        restartFunction++;
                        console.log('restarted');
                        continue;
                    } else {
                        this.unsetTime()
                        this.result.resetState = true;
                        
                        retry++;
                    }
                }
            }

        }
    }
}
  //2.4 set conditions to reload page if something fails or its a captcha in page:
  async setReloadTime(calledFrom) {
    var page = await this.page;
    if (
      (this.reloadTime != 1 &&
        this.reloadTime.length < 1 &&
        this.comprobateActualPage.actualPage < this.maxClicks) ||
      (this.maxClicks === null && this.timeOuts <= 10)
    ) {
      console.log(`Timeout setting... for : ${calledFrom}`);
      var promise = new Promise((resolve, reject) => {
        var indexForResolveTimeout = this.resolveTimeOut.length;
        this.resolveTimeOut.push({
          resolvePromise: resolve,
          indexArr: indexForResolveTimeout,
        });
        setTimeout(async () => {
          try {
            if (this.timeOuts > 10) {
              throw new DERR("Timeout Exceeded");
            }
            if (this.resetDueToNotChargedPage === true) {
              await Promise.all([
                page.reload(),
                page.waitForNavigation({ waitUntil: "load" }),
              ])
                .then((res) => {
                  log(
                    fg.white + bg.green,
                    "_Scraper.reloadPromises()  - " +
                      calledFrom +
                      " - resetDueToNotChargedPage - " +
                      this.resetDueToNotChargedPage
                      ? "true"
                      : "false" + " : resolver of reloader"
                  );
                  log(fg.green, e);
                })
                .catch((e) => {
                  log(
                    fg.white + bg.red,
                    "_Scraper.reloadPromises()  - " +
                      calledFrom +
                      " - resetDueToNotChargedPage - " +
                      this.resetDueToNotChargedPage
                      ? "true"
                      : "false" + " : error of reloader"
                  );
                  log(fg.red, e);
                });

              await this.delay(5000);
              this.setReloadTime("TimeOut(resetDueToNotChargedPage = true)")
                .then((res) => {
                  log(
                    fg.white + bg.red,
                    "_Scraper.setTimeOut()  - " +
                      calledFrom +
                      " - resetDueToNotChargedPage - true : resolved in set time out after reload"
                  );
                  this.timeOuts++;
                  resolve("resolve after reload");
                })
                .catch((e) => {
                  log(
                    fg.white + bg.red,
                    "_Scraper.settimeout() - " +
                      calledFrom +
                      " - resetDueToNotChargedPage - true  : rejected in set timeout function",
                    e.message
                  );
                  if (calledFrom === "scraper()") {
                    throw e;
                  } else {
                    reject(e);
                  }
                });
            } else {
              this.resetDueToNotChargedPage = true;

              await this.delay(5000);
              this.setReloadTime("TimeOut(resetDueToNotChargedPage = false)")
                .then((res) => {
                  log(
                    fg.white + bg.green,
                    "_Scraper.setTimeOut() - " +
                      calledFrom +
                      " - resetDueToNotChargedPage - false :resolved in set time out without reload"
                  );
                })
                .catch((e) => {
                  log(
                    fg.white + bg.red,
                    "_Scraper.settimeout() - resetDueToNotChargedPage - " +
                      calledFrom +
                      " - false : rejected in set timeout function",
                    e.message
                  );
                  if (
                    calledFrom === "scraper()" ||
                    calledFrom === "ExtracData"
                  ) {
                    throw e;
                  } else {
                    reject(e);
                  }
                });
              resolve("solved without reload " + indexForResolveTimeout);
            }
            if (this.catcha === false) {
              resolve("solved with reload " + indexForResolveTimeout);
              await this.delay(Math.ceil(Math.random() * 5) * 1000);
            }
            this.timeOuts++;

            if (this.timeOuts > 10) {
              throw new DERR("Timeout Exceeded");
            }

            console.log("Liverpool: Time out");
            resolve("solved with reload " + indexForResolveTimeout);
          } catch (error) {
            log(
              fg.white + bg.red,
              "_Scraper.setTimeOut() - " +
                calledFrom +
                ": error in settimeout: "
            );
            log(fg.red, error.message);
            reject(error);
          }
        }, 5000);
      });
      this.reloadTime.push({
        promise: promise,
        indexArr: this.reloadTime.length,
      });
      log(fg.white + bg.green, `Timeout setted... for : ${calledFrom}`);

      return promise;
    }
  }
  //2.5 get data from page
  async getData() {
    var prom = new Promise(async (resolve, reject) => {
      var success = false;
      var retry = 0;
      var err = "";
      while (!success && retry < 5) {
        try {
          var page = await this.page;
          log(fg.white + bg.green, "get data initialize");
          await page
            .waitForSelector("#captchacharacters", { timeout: 3000 })
            .then(() => {
              log(
                fg.white + bg.red,
                "_Scraper.getData().waitforselector: catcha ! asa"
              );
              this.catcha = true;
              reject(new Catcha({ catcha: true }));
            })
            .catch((e) => {});
          log(
            fg.white + bg.green,
            "_Scraper.getData() : catcha not found"
          );
          await page.viewport({
            width: 1024 + Math.floor(Math.random() * 100),
            height: 768 + Math.floor(Math.random() * 100),
          });

          var finalDataObject = await page
            .waitForSelector(".m-product__listingPlp", { timeout: 5000 })
            .then(async () => {
              return page.evaluate(() => {
                self = this;

                function getDiscountValue(oldPrice, newPrice) {
                  //x = v1 - v2 | x/v1 * 100
                  let difference = newPrice - oldPrice;
                  let result = Math.round((difference / oldPrice) * 100);
                  return result;
                }
                var finalDataOutput = [];
                var amazonProducts =
                  document.querySelectorAll(".m-product__card");

                for (e of amazonProducts) {
                  var finalDataObject = {
                    product: "",
                    discount: "",
                    newPrice: "",
                    oldPrice: "",
                    url: "",
                    prime: false,
                  };

                  finalDataObject.product =
                    querySelector(".card-title").innerText;
                  finalDataObject.img_url = querySelector("img")
                    ? querySelector("img").src
                    : null; //img url
                  finalDataObject.url =
                    document.querySelector(".m-product__card a").href;
                  finalDataObject.newPrice = querySelector(".a-card-price")
                    .innerText.trim()
                    .replace(",", "")
                    .replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "");
                  finalDataObject.oldPrice = querySelector(".a-card-discount")
                    .innerText.trim()
                    .replace(",", "")
                    .replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "");
                  finalDataObject.discount =
                    getDiscountValue(
                      parseFloat(finalDataObject.oldPrice),
                      parseFloat(finalDataObject.newPrice)
                    ) <
                    getDiscountValue(
                      parseFloat(finalDataObject.newPrice),
                      parseFloat(finalDataObject.oldPrice)
                    )
                      ? getDiscountValue(
                          parseFloat(finalDataObject.oldPrice),
                          parseFloat(finalDataObject.newPrice)
                        )
                      : getDiscountValue(
                          parseFloat(finalDataObject.newPrice),
                          parseFloat(finalDataObject.oldPrice)
                        );
                  finalDataObject.prime =
                    querySelector(".a-icon.a-icon-prime.a-icon-medium") !=
                    null
                      ? true
                      : false;

                  if (finalDataObject.oldPrice != null) {
                    finalDataOutput.push(finalDataObject);
                  }
                }
                console.log(finalDataOutput);
                return Promise.all(finalDataOutput)
                  .then((finalDataOutput) => {
                    return finalDataOutput;
                  })
                  .catch((e) => {
                    console.log("Liverpool: Error in Promise inside scraper");
                    console.log(e);
                  });
              });
            })
            .catch((e) => {
              if (
                e.message.trim() !=
                "Protocol error (Runtime.callFunctionOn): Session closed. Most likely the page has been closed."
              ) {
                log(
                  fg.white + bg.red,
                  "_Scraper.getData().waitforselector(results): error while trying to get data"
                );
                log(fg.red, e.message);
              }
              return false;
            });
          if (finalDataObject != false) {
            success = true;
            resolve(finalDataObject);
          } else {
            retry++;
            continue;
          }
        } catch (error) {
          log(fg.white + bg.red, "error in while");
          if (
            error.message !=
              "Error: Protocol error (Runtime.callFunctionOn): Session closed. Most likely the page has been closed." &&
            error.message !=
              "Protocol error (Runtime.callFunctionOn): Session closed. Most likely the page has been closed."
          ) {
            log(fg.red, "_Scraper.getData() fails: ");
            log(fg.white + bg.red, error.message);
          } else {
            resolve(false);
            break;
          }

          err = error;
          retry++;
        }
      }
      if (retry >= 5) {
        reject(err);
      }
    });
    return prom;
  }
  //2.5.1 start extract data loop:
  async extractDataLoop() {
    var resolveVar = 0;
    var page = await this.page;
    var extData = new Promise(async (resolve, reject) => {
      try {
        var lastArr = [];
        for (
          let i = 0;
          parseInt(this.comprobateActualPage.actualPage) < this.maxClicks ||
          (this.maxClicks === 1 && this.clickedTimes != this.maxClicks);
          i++
        ) {
          log(fg.white + bg.green, "bucle start");
          var tempArr = [];
          await page
            .waitForSelector("#captchacharacters", { timeout: 2000 })
            .then(() => {
              console.log("Liverpool: catcha ! a");
              this.catcha = true;
              console.log(this.catcha);
            })
            .catch((e) => {
              this.catcha = false;
            });
          if (this.catcha === true) {
            throw new Catcha({ catcha: true });
          }
          if (this.comprobateActualPage.actualPage <= this.maxClicks - 1) {
            console.log("Liverpool: bucle 1 step before comprobations");

            tempArr = await this.getData()
              .then((res) => {
                log(fg.green, res[0]);
                return res;
              })
              .catch((e) => {
                throw e;
              });
            console.log(
              lastArr[0] === tempArr[0]
                ? "arrays comparations = " + true
                : "arrays comparations = " + false
            );

            if (lastArr.length > 0 && tempArr != false) {
              log(bg.green, "Liverpool_:bucle temparr not empty");
              log(bg.cyan, tempArr[0]);

              if (lastArr[0] != tempArr[0]) {
                lastArr = tempArr;
                this.result.results = await this.result.results.concat(
                  await tempArr
                );
                await Promise.all([this.comprobateActualPageF()]);
                this.result = {
                  results: this.result.results,
                  pagination:
                    this.comprobateActualPage.actualPage != false
                      ? this.comprobateActualPage.actualPage
                      : false,
                  nextPageUrl:
                    this.comprobateActualPage.nextPageUrl != false
                      ? this.comprobateActualPage.nextPageUrl
                      : false,
                  error: false,
                  paginationValue:
                    this.comprobateActualPage.nextPageUrl != false
                      ? this.maxClicks
                      : false,
                };
                var clicked = await this.clickNextPagination()
                  .then((res) => {
                    log(
                      bg.green + fg.white,
                      "_Scraper.clickNextPagination() - done"
                    );
                    return true;
                  })
                  .catch((e) => {
                    return false;
                  });
                if (clicked === false) {
                  log(fg.white + bg.red, "Pagination not clicked");
                  break;
                }
                if (clicked != true) {
                  await Promise.all([page.reload(), page.waitForNavigation()]);

                  continue;
                } else {
                  if (this.comprobateActualPage.actualPage >= this.maxClicks) {
                    resolve({ results: this.result.results });
                  }
                }
              }
            } else if (tempArr != false) {
              console.log("Liverpool: bucle tempar empty");

              lastArr = tempArr;

              this.result.results = await this.result.results.concat(
                await tempArr
              );

              console.log("Liverpool: before comprobate actual pge error");

              if (this.maxClicks === 1) {
                break;
              }
              await Promise.all([this.comprobateActualPageF()]);

              this.result = {
                results: this.result.results,
                pagination:
                  this.comprobateActualPage.actualPage != false
                    ? this.comprobateActualPage.actualPage
                    : false,
                nextPageUrl:
                  this.comprobateActualPage.nextPageUrl != false
                    ? this.comprobateActualPage.nextPageUrl
                    : false,
                error: false,
                paginationValue:
                  this.comprobateActualPage.nextPageUrl != false
                    ? this.maxClicks
                    : false,
              };

              var clicked = await this.clickNextPagination()
                .then((res) => {
                  log(
                    bg.green + fg.white,
                    "_Scraper.clickNextPagination() - done"
                  );
                  return true;
                })
                .catch((e) => {
                  return false;
                });
              if (clicked === false) {
                log(fg.white + bg.red, "Pagination not clicked");
                break;
              }
              if (clicked != true) {
                await Promise.all([page.reload(), page.waitForNavigation()]);

                continue;
              } else {
                if (this.comprobateActualPage.actualPage >= this.maxClicks) {
                  resolve({ results: this.result.results });
                }
              }
            }
          } else {
            console.log("Liverpool: break final assign");
            var finalArr = await this.getData()
              .then((res) => {
                log(fg.green, res);
                return res;
              })
              .catch((e) => {
                throw e;
              });
            if (finalArr != false) {
              this.result.results = await this.result.results.concat(finalArr);
            }
            break;
          }

          await this.comprobateActualPageF();
        }
        log(bg.green, "Liverpool_:Data extracted:");
        log(fg.green, this.result);
        resolve({ results: this.result.results });
      } catch (error) {
        reject(error);
      }
    });

    return extData;
  }
  //2.6 desactive timeouts:
  async unsetTime() {
    this.resetDueToNotChargedPage = false;
    if (this.resolveTimeOut.length > 0) {
      console.log("Liverpool: this.resolveTimeOut");
      for (let promise of this.reloadTime) {
        console.log(promise);
        var resolveTime = this.resolveTimeOut[promise.indexArr];
        resolveTime.resolvePromise("resolved");
        console.log("Liverpool: promise after unsetTime");
        console.log(promise);
        this.reloadTime.splice(resolveTime.indexArr);
        this.resolveTimeOut.splice(resolveTime.indexArr);
      }
    }

    if (this.reloadTime === 1) {
      this.reloadTime = [];
    }
    console.log(this.reloadTime);

    this.timeOuts = 0;
    console.log("Liverpool: Timeouts destroyed");
  }
  //2.7 click to next pagination:
  async clickNextPagination() {
    return new Promise(async (resolve, reject) => {
      var page = await this.page;
      var res = 0;
      var extractPaginationSucceded = false;
      var extractTrys = 0;
      while (!extractPaginationSucceded && extractTrys <= 5) {
        /*
                            var paginationGroup = document.querySelectorAll('.page-item > a.page-link')
                            var paginationToClick = paginationGroup[paginationGroup.length - 2];
                            */
        var referenceForSelector = this.maxClicks + 3;
        await page
          .waitForSelector(".page-item > a.page-link", { timeout: 16000 })
          .then(async () => {
            if (this.comprobateActualPage.actualPage <= this.maxClicks - 1) {
              await Promise.all([
                page.click(
                  `ul.pagination:nth-child(1) > .page-item:nth-child(${referenceForSelector})`
                ),
                ,
                page.waitForNavigation().catch((e) => {
                  throw e;
                }),
              ]);
              page
                .waitForSelector("#captchacharacters", { timeout: 3000 })
                .then(() => {
                  console.log("Liverpool: catcha ! a");
                  this.catcha = true;
                  console.log(this.catcha);
                })
                .catch((e) => {
                  this.catcha = false;
                });
              res = true;
              log(
                fg.white + bg.green,
                "_Scraper.clickNextPagination() - success in clickNextPagination"
              );
              this.delay(Math.ceil(Math.random() * 10) * 1000);
              this.clickedTimes++;
              console.log("Liverpool: clicked!");
            } else {
              res = false;
            }
          })
          .then((res) => {
            extractPaginationSucceded = true;
          })
          .catch((e) => {
            log(
              fg.white + bg.red,
              "_Scraper.clickNextPagination() - Error from clickNextPagination"
            );
            console.log(fg.red, e.message);
            var uniqueErrorNameForImage = `Liverpool_Scraper.clickNextPagination()_ERROR_PAGINATION UNFINDED_${new Date().getTime()}.jpg`;
            page
              .screenshot({
                path: `/opt/lampp/htdocs/screenshots/errors/${uniqueErrorNameForImage}`,
              })
              .catch((e) => {});
            log(
              bg.green + fg.white,
              `Liverpool_capture saved with the name ${uniqueErrorNameForImage}`
            );

            extractTrys++;
          });
      }
      if (res === true) {
        resolve(res);
      } else {
        reject({ message: "error" });
      }
    });
  }
  //2.8 verify actual pagination:
  async comprobateActualPageF() {
    var page = await this.page;
    await page
      .waitForSelector("#captchacharacters", { timeout: 2000 })
      .then(() => {
        console.log("Liverpool: catcha ! asa");
        this.catcha = true;
        console.log(this.catcha);
      })
      .catch((e) => {});
    /*
            var lastItemElement = document.querySelectorAll('.page-item > a.page-link')
                    lastItemElement[lastItemElement.length - 2].click()
            */
    log(
      bg.green + fg.white,
      "_Scraper.comprobateActualPageF() - Started: "
    );
    this.comprobateActualPage = await page
      .waitForSelector(".col-lg-9.m-column_mainContent", { timeout: 10000 })
      .then(() => {
        return page.evaluate(async () => {
          var paginationGroup = document.querySelectorAll(
            ".page-item > a.page-link"
          );
          if (paginationGroup) {
            var paginationSelectedValue = await parseInt(
              document.querySelector(".page-item.active").innerText
            );
            var pagination = {
              actualPage: paginationSelectedValue,
              nextPageUrl: undefined,
            };
          } else {
            var pagination = {
              actualPage: 0,
              nextPageUrl: false,
            };
          }

          return pagination;
        });
      })
      .catch((e) => {
        log(
          bg.red + fg.white,
          "Liverpool_Scraper.comprobateActualPageF() - Error: "
        );
        log(fg.red, e.message);
        var uniqueErrorNameForImage = `Liverpool_Scraper.comprobateActualPageF()_ERROR_PAGINATION_NOT_UPDATED_${new Date().getTime()}.jpg`;
        page
          .screenshot({
            path: `/opt/lampp/htdocs/screenshots/errors/${uniqueErrorNameForImage}`,
          })
          .catch((e) => {});
        log(
          bg.green + fg.white,
          `Liverpool_capture saved with the name ${uniqueErrorNameForImage}`
        );
        var pagination = {
          actualPage: 0,
          nextPageUrl: false,
        };
        return pagination;
      });
    if (this.comprobateActualPage.nextPageUrl != false) {
      this.result.nextPageUrl = this.comprobateActualPage.nextPageUrl;
      this.paginationValue = this.comprobateActualPage.actualPage;
      this.url = this.url;
    }
    log(
      fg.white + bg.green,
      `actual page :${this.comprobateActualPage.actualPage}`
    );
  }
  //2.9 if all the data its extracted returns this.result and apply the destroy() method
  //2.10 if theres an error apply the browserReset() method

  //3 tool kit:
  //3.1 wait x time before continue:
  async delay(time) {
    return new Promise(function (resolve) {
      setTimeout(resolve, time);
    });
  }
  //3.1 destroys the object and the internal data
  destroy() {
    this.url = null;
    this.unsetTime();
    this.resolveTimeOut = null;
    this.reloadTime = null;
  }
}

export default { DERR, Scraper };

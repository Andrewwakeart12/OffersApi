//https://www.amazon.com.mx/s?i=electronics&bbn=9687565011&rh=n%3A9687565011%2Cp_n_deal_type%3A23565478011%2Cp_36%3A50000-500000%2Cp_6%3AA1G99GVHAT2WD8%7CAVDBXBAVVSXLQ&dc&fs=true&page=62&qid=1649879571&rnid=9754433011&ref=sr_pg_60
import e from "express";

import colors from "colors";

import useProxy from "puppeteer-page-proxy";
import { proxyRequest } from "puppeteer-proxy";
colors.enable();

import Log from "../../toolkit/colorsLog.js";
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
  constructor(page, Proxy) {
    this.page = page;
    this.Proxy = Proxy;
  }
  Proxy;
  selectedProxy = 0;
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

  //2.2 gets the initial values:
  //2.2.1 gets the max number of paginations:
  async getMaxclicks() {
    try {
      log(Log.bg.green + Log.fg.white, "Getting clicks");
      var page = await this.page;

      var uniqueErrorNameForImage = `Liverpool_Scraper.getMaxClicks()_saved${new Date().getTime()}.jpg`;
      page
        .screenshot({
          path: `/opt/lampp/htdocs/screenshots/${uniqueErrorNameForImage}`,
        })
        .catch((e) => {});
      log(
        Log.bg.green + Log.fg.white,
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
            Log.bg.red + Log.fg.white,
            "_Scraper.getMaxClicks() - error cause pagination was not found"
          );
          log(Log.fg.red, e.message);
          var uniqueErrorNameForImage = `Liverpool_Scraper.getMaxClicks()_ERROR_PAGINATION UNFINDED_${new Date().getTime()}.jpg`;
          page
            .screenshot({
              path: `/opt/lampp/htdocs/screenshots/errors/${uniqueErrorNameForImage}`,
            })
            .catch((e) => {});
          log(
            Log.bg.green + Log.fg.white,
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
    var dataProxy;
    var page = this.page;
    try {
      log(
        Log.fg.white + Log.bg.green,
        "_Scraper.scraper(): page its setted, proceed navigation"
      );
      console.log(
        `_Scraper.scraper().page.goto(): Navigating to ${this.url}...`
      );
      page.setRequestInterception(true);
      var requestCounter = 0;
      var requestCounterNotPassed = 0;
      page.on("request", (request) => {
        console.log(`request type = ${request.resourceType()}`);
        if (
          request.resourceType() === "stylesheet" ||
          request.resourceType() === "font" ||
          request.resourceType() === "ping" 
        ) {
          console.log(
            `request number not passed: ${requestCounterNotPassed++}`
          );
          request.abort();
        } else {
          console.log(`request number : ${requestCounter++}`);
          request.continue();
        }
      });
      var prom = await Promise.all([
        page.goto(this.url),
        page.waitForNavigation({ waitUntil: "networkidle0" }),
      ])
        .then((res) => {
          return true;
        })
        .catch((e) => {
          log(Log.fg.white + Log.bg.red, "_Scraper: Error in page.goto() : ");
          if (e.message.split(" ")[0] === "net::ERR_PROXY_CONNECTION_FAILED") {
            return { proxy_not_connect: true };
          }
          console.log(e.message.red);
          return false;
        });
      log(Log.bg.yellow + Log.fg.white, prom);

      var pageErrorIndicator = await page
        .waitForSelector(".a-errorPage-title", { timeout: 5000 })
        .then(() => {
          return {
            error: "Critical error, the page has no items or has been removed",
          };
        })
        .catch(() => {
          return false;
        });

      if (pageErrorIndicator != false) {
        throw new CAPF(pageErrorIndicator.error);
      }

      log(Log.bg.cyan + Log.fg.white, "After error page comprobation");
      if (this.maxClicks === false) {
        this.maxClicks = null;
      }
      if (
        (this.comprobateActualPage.actualPage === 0 &&
          this.maxClicks === null) ||
        (this.comprobateActualPage.actualPage === undefined &&
          this.maxClicks === null)
      ) {
        var getPaginationSuccess = false;
        var getPagintaionFails = 0;
        while (!getPaginationSuccess && getPagintaionFails < 2) {
          var pag = await this.getMaxclicks();
          if (pag != true) {
            if (this.catcha === true) {
              throw new DERR("!catcha");
            }
            await Promise.all([
              page.reload(),
              page.waitForNavigation({ waitUntil: "networkidle0"  }),
            ]);
            this.maxClicks = null;
            getPagintaionFails++;
          } else {
            getPaginationSuccess = true;
          }
        }

        if (this.catcha === true) {
          throw new Catcha("!catcha");
        }
      }
      if (
        this.maxClicks === null &&
        getPaginationSuccess != true &&
        getPagintaionFails >= 5
      ) {
        throw new DERR("pagination load fails");
      }
      console.log("pagination value".green);
      console.log(`${this.paginationValue}`.green);
      console.log("maxClicks: ".green);
      console.log(`${this.maxClicks}`.green);

      var extractedData = await this.extractDataLoop()
        .then((res) => {
          log(Log.bg.green + Log.fg.white, res);
          if (res.results != false) {
            return res.results.filter(Boolean);
          }
        })
        .catch((e) => {
          console.log(`error from promise ${e.message}`.red);
          throw e;
        });
      if (extractedData.results != false) {
        this.reloadTime = 0;
        this.resolveTimeOut = 0;
        success = true;
        return extractedData;
      } else {
        return this.result;
      }
    } catch (e) {
      console.log("e.message");
      console.log(e.message);
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
          log(Log.fg.white + Log.bg.green, "get data initialize");
          await page
            .waitForSelector("#captchacharacters", { timeout: 3000 })
            .then(() => {
              log(
                Log.fg.white + Log.bg.red,
                "_Scraper.getData().waitforselector: catcha ! asa"
              );
              this.catcha = true;
              reject(new Catcha({ catcha: true }));
            })
            .catch((e) => {});
          log(
            Log.fg.white + Log.bg.green,
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
                    document.querySelector(".card-title").innerText;
                  finalDataObject.img_url = document.querySelector("img")
                    ? document.querySelector("img").src
                    : null; //img url
                  finalDataObject.url =
                    document.querySelector(".m-product__card a").href;
                  finalDataObject.newPrice = document
                    .querySelector(".a-card-price")
                    .innerText.trim()
                    .replace(",", "")
                    .replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "");
                  finalDataObject.oldPrice = document
                    .querySelector(".a-card-discount")
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
                    document.querySelector(
                      ".a-icon.a-icon-prime.a-icon-medium"
                    ) != null
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
                  Log.fg.white + Log.bg.red,
                  "_Scraper.getData().waitforselector(results): error while trying to get data"
                );
                log(Log.fg.red, e.message);
              }
              return false;
            });
          if (finalDataObject != false) {
            success = true;
            resolve(finalDataObject);
          } else {
            retry++;
          }
        } catch (error) {
          log(Log.fg.white + Log.bg.red, "error in while");
          if (
            error.message !=
              "Error: Protocol error (Runtime.callFunctionOn): Session closed. Most likely the page has been closed." &&
            error.message !=
              "Protocol error (Runtime.callFunctionOn): Session closed. Most likely the page has been closed."
          ) {
            log(Log.fg.red, "_Scraper.getData() fails: ");
            log(Log.fg.white + Log.bg.red, error.message);
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
          log(Log.fg.white + Log.bg.green, "bucle start");
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
                log(Log.fg.green, res[0]);
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
              log(Log.bg.green, "Liverpool_:bucle temparr not empty");
              log(Log.bg.cyan, tempArr[0]);

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
                      Log.bg.green + Log.fg.white,
                      "_Scraper.clickNextPagination() - done"
                    );
                    return true;
                  })
                  .catch((e) => {
                    return false;
                  });
                if (clicked === false) {
                  log(Log.fg.white + Log.bg.red, "Pagination not clicked");
                  break;
                }
                if (clicked != true) {
                  await Promise.all([page.reload(), page.waitForNavigation()]);
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
                    Log.bg.green + Log.fg.white,
                    "_Scraper.clickNextPagination() - done"
                  );
                  return true;
                })
                .catch((e) => {
                  return false;
                });
              if (clicked === false) {
                log(Log.fg.white + Log.bg.red, "Pagination not clicked");
                break;
              }
              if (clicked != true) {
                await Promise.all([page.reload(), page.waitForNavigation()]);
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
                log(Log.fg.green, res);
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
        log(Log.bg.green, "Liverpool_:Data extracted:");
        log(Log.fg.green, this.result);
        resolve({ results: this.result.results });
      } catch (error) {
        reject(error);
      }
    });

    return extData;
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
        await page
          .waitForSelector(".page-item > a.page-link", { timeout: 16000 })
          .then(async () => {
            if (this.comprobateActualPage.actualPage <= this.maxClicks - 1) {
              await Promise.all([
                page.click(
                  `.col-6.pr-2.pl-1 > .a-btn__pagination`
                )
              ]);
              await this.delay(5000)
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
                Log.fg.white + Log.bg.green,
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
              Log.fg.white + Log.bg.red,
              "_Scraper.clickNextPagination() - Error from clickNextPagination"
            );
            console.log(Log.fg.red, e.message);
            var uniqueErrorNameForImage = `Liverpool_Scraper.clickNextPagination()_ERROR_PAGINATION UNFINDED_${new Date().getTime()}.jpg`;
            page
              .screenshot({
                path: `/opt/lampp/htdocs/screenshots/errors/${uniqueErrorNameForImage}`,
              })
              .catch((e) => {});
            log(
              Log.bg.green + Log.fg.white,
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
      Log.bg.green + Log.fg.white,
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
          Log.bg.red + Log.fg.white,
          "Liverpool_Scraper.comprobateActualPageF() - Error: "
        );
        log(Log.fg.red, e.message);
        var uniqueErrorNameForImage = `Liverpool_Scraper.comprobateActualPageF()_ERROR_PAGINATION_NOT_UPDATED_${new Date().getTime()}.jpg`;
        page
          .screenshot({
            path: `/opt/lampp/htdocs/screenshots/errors/${uniqueErrorNameForImage}`,
          })
          .catch((e) => {});
        log(
          Log.bg.green + Log.fg.white,
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
    this.url = await page.url();

    log(
      Log.fg.white + Log.bg.green,
      `actual page :${this.comprobateActualPage.actualPage}`
    );
  }
  //2.10 if theres an error apply the browserReset() method

  //3 tool kit:
  //3.1 wait x time before continue:
  async delay(time) {
    return new Promise(function (resolve) {
      setTimeout(resolve, time);
    });
  }
}

export { DERR, Scraper };

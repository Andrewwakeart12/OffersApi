//https://www.amazon.com.mx/s?i=electronics&bbn=9687565011&rh=n%3A9687565011%2Cp_n_deal_type%3A23565478011%2Cp_36%3A50000-500000%2Cp_6%3AA1G99GVHAT2WD8%7CAVDBXBAVVSXLQ&dc&fs=true&page=62&qid=1649879571&rnid=9754433011&ref=sr_pg_60
import e from "express";
import cheerio from "cheerio";
import child_process from "child_process";
import colors from "colors";

colors.enable();

import Log from "../../toolkit/colorsLog.js";
import WatcherOfProducts from "../../WatcherOfProducts.js";
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
  url_id;
  constructor(url_id) {
    this.url_id = url_id;
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
  result = { results: [], newProducts: false };
  //2.4 pagination clicked times property:
  newProducts = false;
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
  $;
  nextPageUrl;
  actualPagination;
  paginationSelectedValue = 0;
  //2.2 gets the initial values:
  //2.2.1 gets the max number of paginations:
  async getMaxclicks() {
    var productsLength = this.$(".m-product__card").length;
    var maxClicks = 0;

    if (productsLength >= 56) {
      maxClicks = Math.ceil(
        parseInt(this.$(".a-plp-results-title > span").text()) /
          this.$(".m-product__listingPlp > .m-product__card").length
      );
    } else {
      maxClicks = 1;
    }
    return maxClicks;
  }
  //2.3 start scraping:
  async scraper(initialUrl) {
    this.url = initialUrl;
    var success = false;
    var retry = 0;
    while (!success && retry < 3) {
      try {
        this.$ = cheerio.load(await this.getDataByUrl(initialUrl));
        success = true;
      } catch (e) {
        console.log(e.message);
        retry++;
      }
    }
    this.maxClicks = await this.getMaxclicks();

    console.log("this.maxClicks");
    console.log(this.maxClicks);

    this.paginationSelectedValue = await this.getPaginationValue();
    this.nextPageUrl = this.getNextPagination();

    console.log("this.nextPageUrl");
    console.log(this.nextPageUrl);

    console.log(this.paginationSelectedValue);
    var lastArr = [];
    var trys = 0;
    try {
    } catch (error) {}
    while (this.paginationSelectedValue <= this.maxClicks && trys < 4) {
      try {
        
      var tempArr = [];
      var ProductObserver = new WatcherOfProducts(this.url_id);
      tempArr = await this.getData();
      if (lastArr.length > 0 && tempArr != false) {
        log(Log.bg.green, "Liverpool_:bucle temparr not empty");
        log(Log.bg.cyan, tempArr[0]);

        tempArr = tempArr.filter(Boolean);

        if (
          JSON.stringify(lastArr) != JSON.stringify(tempArr) ||
          tempArray.length === 0
        ) {
          tempArr.push(false);

          lastArr = tempArr;

          this.result.results = await this.result.results.concat(await tempArr);
          log(Log.bg.green + Log.fg.white, "added new products! (in theory)");
        }
      } else if (tempArr != false) {
        await ProductObserver.getLastArrayExtracted(this.url_id);
        var diferences =
          ProductObserver.diffActualDataOfProductsWhenTheNewArrayItsLonger(
            tempArr
          );
        console.log("diferences");
        console.log(diferences);
        if (diferences < 56) {
          this.result.results = await this.result.results.concat(await tempArr);
          log(
            Log.bg.green + Log.fg.white,
            "added new products! (in theory before close because observator)"
          );

          this.newProducts = diferences;

          await ProductObserver.updateLocalArrayInDb(this.url_id, tempArr);
          break;
        }
        lastArr = tempArr;

        this.result.results = await this.result.results.concat(await tempArr);
        log(
          Log.bg.green + Log.fg.white,
          "added new products! (in theory) after observator comprobation"
        );
        await ProductObserver.updateLocalArrayInDb(this.url_id, tempArr);
      }
      this.paginationSelectedValue = this.getPaginationValue();
      log(
        Log.bg.green + Log.fg.white,
        `Pagination value : ${this.paginationSelectedValue}`
      );

      if (this.paginationSelectedValue >= this.maxClicks) {
        log(Log.bg.green + Log.fg.white, "breaking cause reach end");
        break;
      }
      var successInsideWhile = false;
      var retryInsideWhile = 0;
      var RNGTIme = Math.round(Math.random(1) * 100 * 100);
      console.log(RNGTIme);
      await this.delay(RNGTIme);

      while (!successInsideWhile && retryInsideWhile < 3) {
        try {
          this.$ = cheerio.load(await this.getDataByUrl(this.nextPageUrl));
          this.nextPageUrl = this.getNextPagination();
          console.log("this.nextPageUrl");
          console.log(this.nextPageUrl);

          successInsideWhile = true;
        } catch (e) {
          console.log(e.message);
          retryInsideWhile++;
        }
      }
    
      } catch (error) {
        log(Log.bg.red + Log.fg.red, error.message);
        trys++;
      }
    }

    return this.result.results.filter(Boolean);
  }
  getPaginationValue() {
    if(this.paginationSelectedValue != 0){
      return parseInt(this.$(".page-item.active").text());
    }else{
      return 1;
    }
  }
  getNextPagination() {
    //s-pagination-item s-pagination-next s-pagination-button s-pagination-separator
    var nextPaginationLink = `${this.url}/page-${
      this.paginationSelectedValue + 1
    }`;
    return nextPaginationLink;
  }

  async getDataByUrl(url) {
    console.log("...getting data");
    var cmd = `curl -s -S  --user 0e58bdb3cb5d4b588300885622c23459: --header 'Content-Type: application/json' --data '{"url": "${url}", "browserHtml": true}'  https://api.zyte.com/v1/extract`;

    var resp = await child_process.execSync(cmd);
    var result = await resp.toString("UTF8");
    result = await JSON.parse(result);
    return result.browserHtml;
  }
  //2.5 get data from page
  //2.5 get data from page
  async getData() {
    const getDiscountValue = (oldPrice, newPrice) => {
      //x = v1 - v2 | x/v1 * 100
      let difference = newPrice - oldPrice;
      let result = Math.round((difference / oldPrice) * 100);
      return result;
    };
    var finalDataOutput = [];
    for (var querySelector of this.$(".m-product__card")) {
      querySelector = cheerio.load(querySelector);
      var product = {};
      product.product = querySelector(".card-title").text();
      product.img_url = querySelector("img").attr("src");
      product.url = `https://www.liverpool.com.mx${querySelector("a").attr(
        "href"
      )}`;
      product.oldPrice = querySelector(".a-card-price")
        .text()
        .replace(/[&\/\\#+()$~%',":*?<>{}]/g, "");
      product.newPrice = querySelector(".a-card-discount")
        .text()
        .replace(/[&\/\\#+()$~%',":*?<>{}]/g, "");

      if (product.oldPrice != "") {
        product.discount =
          getDiscountValue(
            parseFloat(
              product.oldPrice.replace(/[&\/\\#+()$~%',":*?<>{}]/g, "")
            ),
            parseFloat(
              product.newPrice.replace(/[&\/\\#+()$~%',":*?<>{}]/g, "")
            )
          ) <
          getDiscountValue(
            parseFloat(
              product.newPrice.replace(/[&\/\\#+()$~%',":*?<>{}]/g, "")
            ),
            parseFloat(
              product.oldPrice.replace(/[&\/\\#+()$~%',":*?<>{}]/g, "")
            )
          )
            ? getDiscountValue(
                parseFloat(
                  product.oldPrice.replace(/[&\/\\#+()$~%',":*?<>{}]/g, "")
                ),
                parseFloat(
                  product.newPrice.replace(/[&\/\\#+()$~%',":*?<>{}]/g, "")
                )
              )
            : getDiscountValue(
                parseFloat(
                  product.newPrice.replace(/[&\/\\#+()$~%',":*?<>{}]/g, "")
                ),
                parseFloat(
                  product.oldPrice.replace(/[&\/\\#+()$~%',":*?<>{}]/g, "")
                )
              );
      }
      product.newPrice =
        product.newPrice.slice(0, -2) + "." + product.newPrice.slice(-2);

      if (product.oldPrice != "") {
        product.oldPrice =
          product.oldPrice.slice(0, -2) + "." + product.oldPrice.slice(-2);
        product.prime = false;
        finalDataOutput.push(product);
      } else {
        finalDataOutput.push(false);
      }
    }

    return finalDataOutput;
  }
  //3.1 wait x time before continue:
  async delay(time) {
    return new Promise(function (resolve) {
      setTimeout(resolve, time);
    });
  }
}

export { DERR, Scraper };

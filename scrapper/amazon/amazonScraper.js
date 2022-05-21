//https://www.amazon.com.mx/s?i=electronics&bbn=9687565011&rh=n%3A9687565011%2Cp_n_deal_type%3A23565478011%2Cp_36%3A50000-500000%2Cp_6%3AA1G99GVHAT2WD8%7CAVDBXBAVVSXLQ&dc&fs=true&page=62&qid=1649879571&rnid=9754433011&ref=sr_pg_60
import e from "express";
import cheerio from "cheerio";
import child_process from 'child_process';
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
  //2.2 gets the initial values:
  //2.2.1 gets the max number of paginations:
  async getMaxclicks() {
    var str = this.$(".a-section.a-spacing-small.a-spacing-top-small > span")
      .eq(0)
      .text()
      .split(" ");
    var resultsPerPage = parseInt(str[0].split("-").pop());
    var totalResults = str
      .map((e) => {
        return parseInt(e.replace(",", ""));
      })
      .filter(Boolean)
      .pop();
    var maxClicks = 0;
    if (str[2] != "más") {
      maxClicks = await Math.ceil(totalResults / resultsPerPage);
    } else if (str[2] === "más") {
      maxClicks = parseInt(
        this.$(".s-pagination-item.s-pagination-disabled").eq(1).text()
      );
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
        retry++;
      }
    }
    this.maxClicks = await this.getMaxclicks() ;
    this.maxClicks = this.maxClicks  > 5 ? 5 : this.maxClicks;

    console.log("this.maxClicks");
    console.log(this.maxClicks);
    this.nextPageUrl = this.getNextPagination();
    console.log("this.nextPageUrl");
    console.log(this.nextPageUrl);
    this.paginationSelectedValue = this.getPaginationValue();
    console.log(this.paginationSelectedValue);
    var lastArr = [];
    
    while(this.paginationSelectedValue <= this.maxClicks)
    {
      var tempArr = [];
      var ProductObserver = new WatcherOfProducts(this.url_id);
      tempArr = await this.getData();
      if (lastArr.length > 0 && tempArr != false) 
      {
        log(Log.bg.green,'Amazon_:bucle temparr not empty')
        log(Log.bg.cyan,tempArr[0]);

        tempArr = tempArr.filter(Boolean);

        if (JSON.stringify(lastArr) != JSON.stringify(tempArr) || tempArray.length === 0 )  
        {
          tempArr.push(false);
          
          lastArr = tempArr;

          this.result.results = await this.result.results.concat(await tempArr);
          log(Log.bg.green + Log.fg.white, 'added new products! (in theory)');
        }
      }
       else if(tempArr != false){
        await ProductObserver.getLastArrayExtracted(this.url_id);
        var diferences = ProductObserver.diffActualDataOfProductsWhenTheNewArrayItsLonger(tempArr);
        console.log('diferences')
        console.log(diferences)
        if(diferences < 56  ){
          this.result.results = await this.result.results.concat(
            await tempArr
          );
          log(Log.bg.green + Log.fg.white, 'added new products! (in theory before close because observator)');
          
          this.newProducts = diferences;

          await ProductObserver.updateLocalArrayInDb(this.url_id,tempArr);
          break;
      }
      lastArr = tempArr;
            
      this.result.results = await this.result.results.concat(await tempArr);
      log(Log.bg.green + Log.fg.white, 'added new products! (in theory) after observator comprobation');
      await ProductObserver.updateLocalArrayInDb(this.url_id,tempArr);


    }
    this.paginationSelectedValue = this.getPaginationValue();
    log(Log.bg.green + Log.fg.white,`Pagination value : ${this.paginationSelectedValue}`);

    if(this.paginationSelectedValue >= this.maxClicks){
      log(Log.bg.green + Log.fg.white,'breaking cause reach end');
      break;
    }
    var successInsideWhile = false;
    var retryInsideWhile = 0;
  
    while (!successInsideWhile && retryInsideWhile < 3) {
      try {
        this.$ = cheerio.load(await this.getDataByUrl(this.nextPageUrl));
        this.nextPageUrl = this.getNextPagination();
        console.log("this.nextPageUrl");
        console.log(this.nextPageUrl);

        successInsideWhile = true;

      } catch (e) {
        console.log(e.message)
        retryInsideWhile++;
      }
    }
  }

  
  return this.result.results.filter(Boolean)
}
  getPaginationValue(){
    return parseInt(this.$(".s-pagination-selected").text())
  }
  getNextPagination() {
    //s-pagination-item s-pagination-next s-pagination-button s-pagination-separator
    var nextPaginationLink = `https://www.amazon.com.mx${this.$(
      ".s-pagination-item.s-pagination-next.s-pagination-button.s-pagination-separator"
    ).attr("href")}`;
    return nextPaginationLink;
  }

 async getDataByUrl(url) {
    //https://www.amazon.com.mx/s?rh=n%3A9482640011&fs=true&ref=lp_9482640011_sar
    console.log('...getting data')
    var cmd = `curl -s -S  --user 0e58bdb3cb5d4b588300885622c23459: --header 'Content-Type: application/json' --data '{"url": "${url}", "browserHtml": true}'  https://api.zyte.com/v1/extract`;

    var resp = await child_process.execSync(cmd);
    var result = await resp.toString("UTF8");
    result = await JSON.parse(result);
    return result.browserHtml;
  }
  //2.5 get data from page
  //2.5 get data from page
  async getData() {
    const getDiscountValue = (oldPrice, newPrice)=> {
      //x = v1 - v2 | x/v1 * 100
      let difference = newPrice - oldPrice;
      let result = Math.round((difference / oldPrice) * 100);
      return result;
    }
    var finalDataOutput = [];
    for (var querySelector of this.$(".s-result-item > .sg-col-inner")) {
      querySelector = cheerio.load(querySelector);
      var product = {};

      product.product =
        querySelector(
          ".a-section.a-spacing-none.a-spacing-top-small.s-title-instructions-style"
        ).text() > 0
          ? querySelector(
              ".a-section.a-spacing-none.a-spacing-top-small.s-title-instructions-style"
            ).text()
          : querySelector("h2").text().length > 0
          ? querySelector("h2").text()
          : null;
      product.img_url = querySelector("img")
        ? querySelector("img").attr("src")
        : null; //img url
      product.url = `https://www.amazon.com.mx${
        typeof querySelector(
          ".a-section.a-spacing-none.a-spacing-top-small.s-title-instructions-style"
        ).attr("href") != "undefined"
          ? querySelector(
              ".a-section.a-spacing-none.a-spacing-top-small.s-title-instructions-style"
            )
              .find("a")
              .attr("href")
          : querySelector("h2 > a").attr("href")
      }`; //url
        product.newPrice =
        querySelector("span.a-price > span.a-offscreen").eq(0).text().length > 0
          ? querySelector("span.a-price > span.a-offscreen")
              .eq(0)
              .text()
              .replace(",", "")
              .replace(/[&\/\\#,.+()$~%'":*?<>{}]/g, "")
          : "";
      product.oldPrice =
        querySelector("span.a-price > span.a-offscreen").eq(1).text().length > 0
          ? querySelector("span.a-price > span.a-offscreen")
              .eq(1)
              .text()
              .replace(",", "")
              .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
          : "";
      product.discount =
        getDiscountValue(
          parseFloat(product.oldPrice),
          parseFloat(product.newPrice)
        ) <
        getDiscountValue(
          parseFloat(product.newPrice),
          parseFloat(product.oldPrice)
        )
          ? getDiscountValue(
              parseFloat(product.oldPrice),
              parseFloat(product.newPrice)
            )
          : getDiscountValue(
              parseFloat(product.newPrice),
              parseFloat(product.oldPrice)
            );
      product.prime =
        querySelector(".a-icon.a-icon-prime.a-icon-medium") != undefined
          ? true
          : false;

      if (product.oldPrice.length > 0) {
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
      if(product.oldPrice.length != 0){
        product.newPrice =
        product.newPrice.slice(0, -2) + "." + product.newPrice.slice(-2);

      product.oldPrice =
        product.oldPrice.slice(0, -2) + "." + product.oldPrice.slice(-2);
      finalDataOutput.push(product);
      }else{
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

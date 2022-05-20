
//curl --user 0e58bdb3cb5d4b588300885622c23459: --header 'Content-Type: application/json' --data '{"url": "https://example.com/foo/bar", "browserHtml": true}'  https://api.zyte.com/v1/extract
import child_process from 'child_process';
import { json } from 'express';
import cheerio from "cheerio";

function runCmd(cmd)
{
  var resp = child_process.execSync(cmd);
  var result = resp.toString('UTF8');
  result =  JSON.parse(result);
  return result;
}

var cmd = `curl -s -S  --user 0e58bdb3cb5d4b588300885622c23459: --header 'Content-Type: application/json' --data '{"url": "https://www.amazon.com.mx/s?rh=n%3A9482640011&fs=true&ref=lp_9482640011_sar", "browserHtml": true}'  https://api.zyte.com/v1/extract`;  
var result = runCmd(cmd);


//curl --user 0e58bdb3cb5d4b588300885622c23459: --header 'Content-Type: application/json' --data '{"url":"https://www.amazon.com.mx/s?rh=n%3A9482640011&fs=true&ref=lp_9482640011_sar", "browserHtml": true}'  https://api.zyte.com/v1/extract
//esquema para sams

//browserHtml
const $ = cheerio.load(result.browserHtml);
let counter = 1;
function getDiscountValue(oldPrice, newPrice) {
  //x = v1 - v2 | x/v1 * 100
  let difference = newPrice - oldPrice;
  let result = Math.round((difference / oldPrice) * 100);
  return result;
}

for (var querySelector of $(".s-result-item > .sg-col-inner")) {
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
  product.img_url = querySelector("img") ? querySelector("img").attr('src') : null; //img url
  product.url = `https://www.amazon.com.mx${typeof(querySelector(
      ".a-section.a-spacing-none.a-spacing-top-small.s-title-instructions-style"
    ).attr('href')) != 'undefined'
      ? querySelector(
          ".a-section.a-spacing-none.a-spacing-top-small.s-title-instructions-style"
        ).find("a").attr('href')
      : querySelector("h2 > a").attr('href')}`; //url
          console.log('q');
  console.log(querySelector("h2 > a").attr('href'));
          product.newPrice =  querySelector("span.a-price > span.a-offscreen").eq(0)
          .text().length > 0 ? querySelector("span.a-price > span.a-offscreen").eq(0)
          .text().replace(',', '').replace(/[&\/\\#,.+()$~%'":*?<>{}]/g, ''): ""
  product.oldPrice =  querySelector("span.a-price > span.a-offscreen").eq(1)
  .text().length > 0 ? querySelector("span.a-price > span.a-offscreen").eq(1)
  .text().replace(',', '').replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, ''): ""
  product.discount =
    getDiscountValue(
      parseFloat(product.oldPrice),
      parseFloat(product.newPrice)
    ) <
    getDiscountValue(parseFloat(product.newPrice), parseFloat(product.oldPrice))
      ? getDiscountValue(
          parseFloat(product.oldPrice),
          parseFloat(product.newPrice)
        )
      : getDiscountValue(
          parseFloat(product.newPrice),
          parseFloat(product.oldPrice)
        );
  product.prime =
    querySelector(".a-icon.a-icon-prime.a-icon-medium") != undefined ? true : false;

  if (product.oldPrice.length > 0) {
    product.discount =
      getDiscountValue(
        parseFloat(product.oldPrice.replace(/[&\/\\#+()$~%',":*?<>{}]/g, "")),
        parseFloat(product.newPrice.replace(/[&\/\\#+()$~%',":*?<>{}]/g, ""))
      ) <
      getDiscountValue(
        parseFloat(product.newPrice.replace(/[&\/\\#+()$~%',":*?<>{}]/g, "")),
        parseFloat(product.oldPrice.replace(/[&\/\\#+()$~%',":*?<>{}]/g, ""))
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

  product.oldPrice =
    product.oldPrice.slice(0, -2) + "." + product.oldPrice.slice(-2);
  product.prime = false;
  console.log(product);
  ;
}


//get pagination be like:
var str = $('.a-section.a-spacing-small.a-spacing-top-small > span').eq(0).text().split(" ")
            var resultsPerPage = parseInt(str[0].split('-').pop());
            var totalResults = str.map((e) => {
                return parseInt(e.replace(',', ''))
            }).filter(Boolean).pop()
            var maxClicks = 0;
            if (str[2] != 'más') {
                maxClicks = await Math.ceil(totalResults / resultsPerPage);
            } else if (str[2] === 'más') {
                maxClicks = parseInt($('.s-pagination-item.s-pagination-disabled').eq(1).text());
            }
            console.log(maxClicks)  ;

            //s-pagination-item s-pagination-next s-pagination-button s-pagination-separator
            var nextPaginationLink = `https://www.amazon.com.mx${$('.s-pagination-item.s-pagination-next.s-pagination-button.s-pagination-separator').attr('href')}`
            console.log(nextPaginationLink)
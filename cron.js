const express = require('express')
const app = express()
const port = 3700
const puppeteer = require('puppeteer');
const pool =require('./database');
var cors = require('cors');
const browserObject = require('./scrapper/browser');
const scraperController = require('./scrapper/amazon/amazonController');
const { save } = require('node-cron/src/storage');
const { url } = require('./scrapper/amazon/amazonScraper');
const { product } = require('puppeteer');
var cron = require('node-cron');
const getArrayAsChunks = (array, chunkSize) => {
  let result = [];
  let data = array.slice(0);
  while (data[0]) {
    result.push(data.splice(0, chunkSize));
  }
  return result;
};


async function init(){
  await pool.query('INSERT INTO users set username = ?, password = ? , email = ? , phone = ?', ['obe','123456789', 'edgarmarquinaruizobe@gmail.com','5841236']);

  await pool.query('INSERT INTO scraper_controller set controller=?,discount_trigger = ?, user_id = ?', ['Amazon',30,1]);
  
}
  async function search(){
    var urls = await pool.query('SELECT * FROM scraper_urls');
  
    var result = [];
    try{
     

      for(let i = 0 ; i < urls.length; i++){
       
          let scrappedArr = await scraperController(urls[i].product_url);
          if(scrappedArr === undefined){
            console.log({
              error: 'data its not extracted in category : ' + urls[i].category
            })
            break;
          }
            let obj = {}
            if(scrappedArr !=  undefined){
              obj =  {dataArr : scrappedArr, category: urls[i].category, controller_id : urls[i].controller_id, url_id: urls[i].id}

              result.push(obj);
            }else{
               obj= false;
               result.push(obj);
            }
        }

          
            console.log(result);
            
    }catch(e){
      console.log("Error cron : ");
      console.log(e);
    }finally{
      result= result.filter(Boolean);
      if(result.length != 0 ){
        return result;
      }else{
        return {error : 'probably its because an server error or proxy check your request limit for this month'};
      }
    }

    }
  async function updateProductsInDD(){
    var categoryData = await search();
    if(categoryData.error != undefined){
      console.log(categoryData)
      return categoryData.error;
    }
    console.log(categoryData);
    var urls = await pool.query('SELECT * FROM scraper_urls');

    console.log('categoryData : ');

       await categoryData.map(async toChunk =>{
          console.log(toChunk.dataArr.length);
          chunkedArr = await getArrayAsChunks(toChunk.dataArr, 100);
          await chunkedArr.map(async oneChunkElement =>{
            oneChunkElement.map(async product =>{
              try{
                product.controller_id = toChunk.controller_id;
                product.url_id = toChunk.url_id;
                product.category = toChunk.category;
               
              }catch(e){
                console.log(e);
              }
            })
            var sql = "INSERT INTO scraped_data (product,discount,newPrice,oldPrice,url,prime,img_url,controller_id,url_id,category) VALUES ?";
            var records= oneChunkElement.map(e=>{return Object.values(e)})
            pool.query(sql, [records], function(err, result) {
              console.log(err);
              console.log(result);
          });
          })
        })
console.log('finished')
  }
//let results = await search();
async function comprobate(){
await  updateProductsInDD()
}

//updateProductsInDD();
 const task = cron.schedule('* * 1 * * *', async () =>{
	 await updateProductsInDD()
	 var sql = `DELETE t1 FROM scraped_data t1
			INNER JOIN scraped_data t2 
			WHERE t1.id > t2.id AND t1.product = t2.product;`
	 await pool.query(sql);
 });
task.start()
/*
delete duplicated data:

DELETE t1 FROM scraped_data t1
INNER JOIN scraped_data t2 
WHERE t1.id > t2.id AND t1.product = t2.product; 


DELETE FROM scraped_data WHERE category='videosjuegos' AND updated_at < NOW() - INTERVAL 1 DAY;

SELECT * FROM `scraped_data` WHERE product = "Estación de carga para Xbox X|S & Xbox One - Blanco - Standard Edition"
*/

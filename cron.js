const express = require('express')
const app = express()
const port = 3700
const puppeteer = require('puppeteer');
const pool =require('./database');
var cors = require('cors');
const browserObject = require('./scrapper/browser');
const scraperController = require('./scrapper/amazon/amazonController');

var cron = require('node-cron');
const { default: axios } = require('axios');
const getArrayAsChunks = (array, chunkSize) => {
  let result = [];
  let data = array.slice(0);
  while (data[0]) {
    result.push(data.splice(0, chunkSize));
  }
  return result;
};



  async function search(){

    return new Promise(async(resolve,reject)=>{
      try{
    var result = [];
     

        var users = await pool.query('SELECT id FROM users');
        for(let user of users){
          var controllers = await pool.query('SELECT id FROM scraper_controller WHERE user_id=? && controllerActive=1',[user.id])
          for(let controller of controllers){
          var urls = await pool.query('SELECT * FROM scraper_urls WHERE controller_id= ?' ,[controller.id]);
            
          for(let url of urls){
     
              let scrappedArr = await scraperController(url.product_url);
              console.log('_CRON_LOG - SCRAPPER ARR : ');
              console.log(scrappedArr);
              if(scrappedArr === undefined && scrappedArr === false){
                console.log({
                  error: 'data its not extracted in category : ' + url.category
                })
              }
                let obj = {}
                if(scrappedArr !=  undefined){
                  obj =  {dataArr : scrappedArr, category: url.category, controller_id : url.controller_id, url_id: url.id}
    
                  result.push(obj);
                }else{
                  obj= false;
                  result.push(obj);
                }
            }
            updateProductsInDD(result);
          }
        };
        resolve(true);      
      }catch(e){
        console.log("Error cron : ");
        reject(e);
      }
    })


    }
  async function updateProductsInDD(categoryData){
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
        await pool.query(`
        DELETE t1 FROM scraped_data t1
			INNER JOIN scraped_data t2 
			WHERE t1.id > t2.id AND t1.product = t2.product
        `);
        //DELETE FROM scraped_data WHERE  CAST(oldPrice AS DECIMAL(10,2)) < 900.00
        await pool.query(`DELETE FROM scraped_data WHERE  CAST(oldPrice AS DECIMAL(10,2)) < 900.00`);
        await pool.query(`DELETE FROM scraped_data WHERE updated_at < NOW() - INTERVAL 1 DAY`);

console.log('finished')
  }
//let results = await search();
async function comprobate(){
  var updated = await  search()
  if(updated === true){
    await axios.get('http://67.205.157.187:3700/sendNotification').then(res=>{
      console.log(res.data);
    }).catch(e=>{s
        console.log(`error while sending notifications: ${e.message}`);
    });
    await axios.get('http://67.205.157.187:3700/generateExcel').then(res=>{
      console.log(res.data);
    }).catch(e=>{
        console.log(`error while sending notifications: ${e.message}`);
    });
  }
  
  }
  const task = cron.schedule('0 0 */3 * * *', async () =>{
      await comprobate();
  });
  task.start()
  
task.start()


/*
delete duplicated data:

DELETE t1 FROM scraped_data t1
INNER JOIN scraped_data t2 
WHERE t1.id > t2.id AND t1.product = t2.product; 


DELETE FROM scraped_data WHERE category='videosjuegos' AND updated_at < NOW() - INTERVAL 1 DAY;

SELECT * FROM `scraped_data` WHERE product = "Estación de carga para Xbox X|S & Xbox One - Blanco - Standard Edition"
*/

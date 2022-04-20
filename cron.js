import express from 'express';
const app = express()
const port = 3700
import puppeteer from 'puppeteer';
import { query } from './database';
import cors from 'cors';
import browserObject from './scrapper/browser';
import scraperController from './scrapper/amazon/amazonController';

import { schedule } from 'node-cron';
import { default as axios } from 'axios';
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
    var urls = await query('SELECT * FROM scraper_urls');

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
            query(sql, [records], function(err, result) {
              console.log(err);
              console.log(result);
          });
          })
        })
        await query(`
        DELETE t1 FROM scraped_data t1
			INNER JOIN scraped_data t2 
			WHERE t1.id > t2.id AND t1.product = t2.product
        `);
        //DELETE FROM scraped_data WHERE  CAST(oldPrice AS DECIMAL(10,2)) < 900.00
        await query(`DELETE FROM scraped_data WHERE  CAST(oldPrice AS DECIMAL(10,2)) < 900.00`);
        await query(`DELETE FROM scraped_data WHERE updated_at < NOW() - INTERVAL 1 DAY`);
        var reviewedProduct =await query(`
        SELECT DISTINCT *
        FROM scraped_reviewed
        WHERE product IN (SELECT product FROM scraped_data);
        `);
        var productsInDb =await query(`
        SELECT DISTINCT * 
        FROM scraped_data
        WHERE product IN (SELECT product FROM scraped_reviewed);
        `);
        for(let productReviewed of reviewedProduct){
          for(let productInDb of productsInDb)
          {
          if(productReviewed.product === productInDb.product){  
          if(productReviewed.interested_in)
          {
            if(productReviewed.discount === productInDb.discount || productReviewed.discount * -1 > productInDb.discount * -1  ){
              await query('DELETE FROM scraped_data WHERE id=? ', productInDb.id)
            }
          }else if(productReviewed.excluded){
            await query('DELETE FROM scraped_data WHERE id=? ', productInDb.id)
          }
        }
        }
        }
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
    await axios.get('http://67.205.157.187:3700/generateExcel').then(async res=>{
      if(res.data === true){
        var response = await axios.post("https://app.nativenotify.com/api/indie/notification", {
          appId: 2194,
          subID: 'elpastrana1',
          appToken: 'WtKcqC4zUq1I7AQx3oxk1d',
          title: 'se ha creado un nuevo excel con la data actual',
          message: `Presione esta notificacion para ir a la pagina de los excels`,
          pushData: { goeToProductsPage: false, url: 'http://67.205.157.187/RegistrosExcel/?C=M;O=A' }
        });
      }
    }).catch(e=>{
        console.log(`error while sending notifications: ${e.message}`);
    });
  }
  
  }
  comprobate();
  const task = schedule('0 0 */3 * * *', async () =>{
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

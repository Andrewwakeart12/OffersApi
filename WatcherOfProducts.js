import pool from "./database.js";

class WatcherOfProducts {
  lastArray = []; // Array
  STANDAR_NUMBER_OF_PRODUCTS = 56
  constructor() {
    console.log("WatcherOfProducts its constructed");
  }
  //Int
  direfenceBettwenArraysOfProducsV1(oldArrayOfProducts, newArrayOfProducts) {
    var differencesCounter = 0;
    console.log(oldArrayOfProducts);
    if(oldArrayOfProducts.length != 0){
      for (let iterator; iterator <= oldArrayOfProducts.length; iterator++) {
        if (
          oldArrayOfProducts[iterator].product !=
          newArrayOfProducts[iterator].product
        ) {
          differencesCounter++;
        }
      }
      return differencesCounter;
    }else{
      return 56;
    }

    
  }
  direfenceBettwenArraysOfProducs(oldArrayOfProducts,newArrayOfProducts)
  {
    if(oldArrayOfProducts.length != 0){
    var res = [];
     res = oldArrayOfProducts.filter(el => {
        return !newArrayOfProducts.find(element => {
           return element.product === el.product;
        });
     });
      return res.length;
     }else{
      return 56
     }
  }
  direfenceBettwenArraysOfProducsWhenTheNewArrayItsLonger(oldArrayOfProducts,newArrayOfProducts)
  {
    if(oldArrayOfProducts.length != 0){
    var res = [];
     res = newArrayOfProducts.filter(el => {
        return !oldArrayOfProducts.find(element => {
           return element.product === el.product;
        });
     });
      return res.length;
     }else{
      return 56
     }
  }
  //Void
  async getLastArrayExtracted(url_id) {
    try {
      //gets old array of objects of db
      var lastArrayExtracted = await pool.query(
        "SELECT old_arr_data FROM scraper_watcher_list_items WHERE url_id = ?",
        [url_id]
      );
      if (lastArrayExtracted.length != 0) {
        lastArrayExtracted = JSON.parse(
          lastArrayExtracted[0].old_arr_data
        );

        this.lastArray = lastArrayExtracted;
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.log(error);
    }
  }
  //Int
  diffActualDataOfProducts(newArrayToCompare) {
    return this.direfenceBettwenArraysOfProducs(
      this.lastArray,
      newArrayToCompare
    );
  }
  diffActualDataOfProductsWhenTheNewArrayItsLonger(newArrayToCompare) {
    return this.direfenceBettwenArraysOfProducsWhenTheNewArrayItsLonger(
      this.lastArray,
      newArrayToCompare
    );
  }
  async retryGetOfLastArray(url_id){
    try {
      //gets old array of objects of db
      var lastArrayExtracted = await pool.query(
        "SELECT old_arr_data FROM scraper_watcher_list_items WHERE url_id = ?",
        [url_id]
      );
      if (lastArrayExtracted.length != 0) {
        lastArrayExtracted = JSON.parse(
          lastArrayExtracted[0].old_arr_data
        );

        this.lastArray = lastArrayExtracted;
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.log(error);
    }
  }
  //Bool
  async updateLocalArrayInDb(url_id, newArray) {
    try {
    var lastArrayExtracted = await pool.query(
      "SELECT * FROM scraper_watcher_list_items WHERE url_id = ?",
      [url_id]
    );
    var urlOriginal =  await pool.query(
      "SELECT * FROM scraper_urls WHERE id = ?",
      [url_id]
    );
    var category = urlOriginal[0].category;
    var newArrayString = JSON.stringify(newArray);
    var finalWatchItemObject = {
      category:category,
      old_arr_data:newArrayString,
      url_id:url_id
    }
    if (lastArrayExtracted.length != 0) {
      console.log('trying to update data');
      await pool.query('UPDATE scraper_watcher_list_items set old_arr_data=?, last_modifiyed=NOW() WHERE url_id = ?', [newArrayString,url_id]);
    }else{
      await pool.query('INSERT INTO scraper_watcher_list_items set ?', [finalWatchItemObject]);
    }
    } catch (error) {
      console.log(error)
    }
  }
}

export default WatcherOfProducts;

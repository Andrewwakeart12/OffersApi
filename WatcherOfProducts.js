import pool from "./database.js";

class WatcherOfProducts {
  lastArray = []; // Array
  constructor() {
    console.log("WatcherOfProducts its constructed");
  }
  //Int
  direfenceBettwenArraysOfProducs(oldArrayOfProducts, newArrayOfProducts) {
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
    }else{
      return newArrayOfProducts.length;
    }

    return differencesCounter;
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
          lastArrayExtracted[0].oldArrayOfProducts
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
  //Bool
  async updateLocalArrayInDb(url_id, newArray) {
    try {
      
    console.log('url_id')
    console.log(url_id)
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
      await pool.query('UPDATE scraper_watcher_list_items set ? WHERE url_id = ?', [finalWatchItemObject,url_id]);
    }else{
      await pool.query('INSERT INTO scraper_watcher_list_items set ?', [finalWatchItemObject]);
    }
    } catch (error) {
      console.log(error)
    }
  }
}

export default WatcherOfProducts;

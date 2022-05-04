import pool from "./database.js";

class WatcherOfProducts{
    lastArray; // Array
    //integer
    constructor(){
        console.log('WatcherOfProducts its constructed')
    }
     direfenceBettwenArraysOfProducs(oldArrayOfProducts, newArrayOfProducts){

        var differencesCounter = 0;
        console.log(oldArrayOfProducts)
            for(let iterator;iterator <= oldArrayOfProducts.length ; iterator++){
            if(oldArrayOfProducts[iterator].product != 	newArrayOfProducts[iterator].product){
              differencesCounter++;
            }
          }
      
        return differencesCounter
      }
      //void
      getLastArrayExtracted(){
        //gets old array of objects of db
      }
      //bool
      diffActualDataOfProducts(newArrayToCompare){

      }
      //bool
      updateLocalArrayInDb(url_id,newArray){

      }
}
export default WatcherOfProducts;
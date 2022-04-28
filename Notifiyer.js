import pool from './database.js';
import axios  from 'axios';
class Notifiyer{
    //the device id to notify - @String
    to_notify;
    //category name (goes in notification) - @String
    category;
    //#unique id for the controller - @Integer
    controller_id;
    //#unique id of thw url - @integer
    url_id
    //#name of the controller that its notifiying - @String
    controller_identity;

    constructor(controller_id,url_id,category){
        
    }
    getToNotify(controller_id){
        //gets to_notify from db from local machine
    }
    async getElementsToNotifyOf(){
        //gets array of Products from DB
        var productsArr = await pool.query('SELECT * FROM scraped_data WHERE url_id = ? AND discount < ? AND  notifyed = 0 ORDER BY discount ASC LIMIT 3 ', [url.id, controller.discount_starts_at * -1]);
        return productsArr;
    }
    async sendNotification(){
        //sends notification based on local data #category , #controller_identity , #to_notify , #controller_id
        const ProdsArr = this.getElementsToNotifyOf();
        
        for(let product of ProdsArr)
        {
            
        }
    }
}
export default Notifiyer;
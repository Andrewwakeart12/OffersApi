import pool from './database.js';
import axios  from 'axios';
import Log from './toolkit/colorsLog.js';
const log = (color, text) => {

    console.log(`${color}%s${Log.reset}`, text);
    };
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
    //#reference discount - @Integer
    discount_starts_at;

    constructor(controller_id,url_id,category,discount_starts_at){
        this.controller_id = controller_id;
        this.url_id = url_id;
        this.category= category;
        this.discount_starts_at = discount_starts_at;
    }
    getToNotify(controller_id){
        //gets to_notify from db from local machine
    }
    async getElementsToNotifyOf(){
        try {
            
        //gets array of Products from DB
        var productsArr = await pool.query('SELECT * FROM scraped_data WHERE url_id = ? AND discount < ? AND  notifyed = 0 ORDER BY discount ASC LIMIT 3 ', [this.url_id, this.discount_starts_at * -1]);
        return productsArr;
        } catch (error) {
            console.error(error)
        }
    }
    async sendNotification(){
        try {
                   //sends notification based on local data #category , #controller_identity , #to_notify , #controller_id
        const ProdsArr =await  this.getElementsToNotifyOf();
        var controller_jwt = await pool.query('SELECT user_id FROM scraper_controller WHERE id = ? ', [this.controller_id]);
        var jwt = await pool.query('SELECT jwtoken FROM users WHERE id =? ',[controller_jwt[0].user_id])
        console.log(jwt);
        for(let product of ProdsArr)
        {
            var response = await axios.post("https://app.nativenotify.com/api/indie/notification", {
                appId: 2194,
                subID: jwt[0].jwtoken,
                appToken: 'WtKcqC4zUq1I7AQx3oxk1d',
                title: product.product,
                message: `descuento:${product.discount}, precio: ${product.newPrice} , categoria: ${this.category}`,
                pushData: { goeToProductsPage: false, url: product.url }
              });
              console.log(response.data);
    
              await pool.query("UPDATE scraped_data SET notifyed = 1 WHERE id = ? ", product.id )
              
              log(Log.bg.red + Log.fg.white,`Section ${this.category}`)
              log(Log.bg.green + Log.fg.white,`Nofiyed about product`)
              log(Log.fg.green,product.product);
        } 
        } catch (error) {
            console.log(error);
        }

    }
}
async function e(){
    var notif = new Notifiyer(1,5,'audio y sonido',10);
var not = await notif.sendNotification();
console.log(not);
}
e()
export default Notifiyer;
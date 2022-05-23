import Notifiyer from "./Notifiyer.js";
import pool from "./database.js";
import Log from "./toolkit/colorsLog.js";

const capitalize = (word) => {
    return word
      .toLowerCase()
      .replace(/\w/, (firstLetter) => firstLetter.toUpperCase());
  };

class ExtractionProcessLogsManager{
    status_log;         //String (Complete, In Execution, Failed);
    error;          //Bool
    complete;       //Bool
    execution_data; //Date
    log;            //String
    url_id;         //Int
    category;       //String
    constructor(url_id){
        this.url_id = url_id
    }
    sendReport(){
        Notifiyer.sendCostumNotification(1,'Prueba','Para determinar viabilidad')
    }
    async getCategory(){
        var url_id= await pool.query('SELECT category, controller_id FROM scraper_urls WHERE id = ?',[this.url_id])
        this.category = capitalize(url_id[0].category);
    }
   async saveDataLogs(functionRef,pagination,log){
        await this.setStatusLog();
        await this.getCategory();
        var LogComposed = `${this.category}_${functionRef}${pagination !== false ? '| ( Pagination nª ' + pagination +')' : ''} : ${log}`
      
        var DataLogObj = {
            url_id:this.url_id,
            category:this.category,
            status_log:this.status_log,
            log: LogComposed,
            error : this.error,
            complete : this.complete,
        }
        console.log(DataLogObj)
        await pool.query('INSERT INTO extraction_process_logs set ?', [DataLogObj])
    }
    setStatusLog(){
        if(this.complete === false && this.error === false){
            this.status_log='In execution'
        }else if(this.complete === true && this.error === false){
            this.status_log = 'Complete'
        }else if(this.complete === true && this.error === false){
            this.status_log = 'Failed'
        }
    }
}


export default ExtractionProcessLogsManager
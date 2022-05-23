import Notifiyer from "./Notifiyer.js";
import pool from "./database.js";
import Log from "./toolkit/colorsLog.js";

const capitalize = (word) => {
    return word
      .toLowerCase()
      .replace(/\w/, (firstLetter) => firstLetter.toUpperCase());
  };

class CronDataExtractorLogs{

    sendReport(){
        Notifiyer.sendCostumNotification(1,'Prueba','Para determinar viabilidad')
    }
    async getCategory(){
        var url_id= await pool.query('SELECT category, controller_id FROM scraper_urls WHERE id = ?',[this.url_id])
        this.category = capitalize(url_id[0].category);
    }
   async saveDataLogs(sub_process_threat,status_log,error,stage_log,function_reference){

        var LogComposed = `${error ? '(ERROR) ' : ''}${function_reference}_${sub_process_threat}-${status_log} : ${stage_log}`
      
        var DataLogObj = {
            sub_process_threat:sub_process_threat,
            status_log:status_log,
            error:error,
            stage_log: LogComposed,
            function_reference : function_reference,
        }
        console.log(DataLogObj)
        await pool.query('INSERT INTO cron_data_extractor_logs set ?', [DataLogObj])
    }
}


export default CronDataExtractorLogs
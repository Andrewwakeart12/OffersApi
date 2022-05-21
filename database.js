import { createPool } from 'mysql';
import { database } from './keys.js';
import { promisify } from 'util';

const pool=createPool(database);

pool.getConnection((err,connection)=>{
    if(err){
        if(err.code == 'PROTOCOL_CONNECTION_LOST'){
            console.error('DATABASE CONNECTION WAS CLOSED');
        }
        if(err.code == 'ER_CON_COUNT_ERROR'){
            console.error('DATABASE HAS TO MANY CONNECTIONS');
        }
        if(err.code == 'ERCONNREFUSED'){
            console.error('DATABASE CONNECTION WAS REFUSED');
        }
    }
    if (connection) connection.release();
    console.log('DB is Connected')
    return;
})

pool.query = promisify(pool.query);

export default pool;
import {} from 'dotenv/config';

export const database = {
    connectionLimit: 200,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 300000

};
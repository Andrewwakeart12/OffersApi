import pool from "./database.js";

await pool.query('TRUNCATE cron_data_extractor_logs');

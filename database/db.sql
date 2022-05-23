CREATE DATABASE offers_api;

CREATE TABLE users(
    id INT(11) NOT NULL ,
    username VARCHAR(16),
    password VARCHAR(60),
    email VARCHAR(30),
    phone VARCHAR(20),
    jwtoken VARCHAR(60)
    
);
ALTER TABLE users
    ADD PRIMARY KEY (id) ;

ALTER TABLE users
    MODIFY id INT(11) NOT NULL AUTO_INCREMENT;
/*Principal owner : */
CREATE TABLE scraper_controller(
    id INT(11) NOT NULL,
    controller VARCHAR(16),
    discount_trigger INT(11),
    user_id INT(11)  ,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    mailNotification BOOLEAN DEFAULT 0,
    phoneNotification BOOLEAN DEFAULT 0,
    pushNotification BOOLEAN DEFAULT 0,
    controllerActive BOOLEAN DEFAULT 1
    
);
/*
Son 1
*/
ALTER TABLE scraper_controller
    ADD PRIMARY KEY (id) ;

ALTER TABLE scraper_controller
    MODIFY id INT(11) NOT NULL AUTO_INCREMENT;

CREATE TABLE scraper_urls(
    id INT(11) NOT NULL,
    controller_id INT(11),
    category VARCHAR(120),
    FOREIGN KEY (controller_id) REFERENCES scraper_controller(id) ON DELETE CASCADE,
    product_url TEXT
);


ALTER TABLE scraper_urls
    ADD PRIMARY KEY (id) ;

ALTER TABLE scraper_urls
    MODIFY id INT(11) NOT NULL AUTO_INCREMENT;
/*
Son 2
*/
CREATE TABLE scraped_data(
    id INT(11) NOT NULL,
    controller_id INT(11),
    url_id INT(11),
    FOREIGN KEY (url_id) REFERENCES scraper_urls(id),
    category TEXT,
    FOREIGN KEY (controller_id) REFERENCES scraper_controller(id) ON DELETE CASCADE,
    discount INT(11) NOT NULL,
    prime BOOLEAN NOT NULL,
    product TEXT,
    img_url TEXT,
    url TEXT,
    oldPrice VARCHAR(60),
    newPrice VARCHAR(60),
    updated_at DATETIME DEFAULT NOW()
    
);

ALTER TABLE scraped_data
    ADD PRIMARY KEY (id) ;

ALTER TABLE scraped_data
    MODIFY id INT(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE scraped_data

    ADD notifyed BOOLEAN DEFAULT 0
INSERT INTO users set username ='obe', password = '123456789' , email = 'edgarmarquinaruizobe@gmail.com' , phone = '5841236' ;
INSERT INTO scraper_controller set controller='amazon',discount_trigger = 30, user_id = 1;

CREATE TABLE scraped_reviewed(
    id INT(11) NOT NULL,
    controller_id INT(11),
    url_id INT(11),
    FOREIGN KEY (url_id) REFERENCES scraper_urls(id),
    category TEXT,
    FOREIGN KEY (controller_id) REFERENCES scraper_controller(id) ON DELETE CASCADE,
    discount INT(11) NOT NULL,
    prime BOOLEAN NOT NULL,
    product TEXT,
    img_url TEXT,
    url TEXT,
    oldPrice VARCHAR(60),
    newPrice VARCHAR(60),
    interested_in BOOLEAN DEFAULT 0,
    excluded BOOLEAN DEFAULT 0    
);
ALTER TABLE scraped_reviewed
    ADD PRIMARY KEY (id) ;

ALTER TABLE scraped_reviewed
    MODIFY id INT(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE scraper_controller
    ADD discount_ends_at INT(11) DEFAULT 100

ALTER TABLE scraper_controller
    ADD image_light TEXT,
    ADD image_dark TEXT
        
    ALTER TABLE scraper_controller CHANGE COLUMN discount_trigger discount_starts_at

CREATE TABLE scraper_watcher_list_items(
    id INT(11) NOT NULL,
    url_id INT(11),
    FOREIGN KEY (url_id) REFERENCES scraper_urls(id),
    category TEXT,
    old_arr_data JSON,
    last_modifiyed DATETIME DEFAULT NOW()
);
ALTER TABLE scraper_watcher_list_items
    ADD PRIMARY KEY (id) ;

ALTER TABLE scraper_watcher_list_items
    MODIFY id INT(11) NOT NULL AUTO_INCREMENT;

CREATE TABLE extraction_process_logs(
    id INT(11) NOT NULL,
    url_id INT(11),
    FOREIGN KEY (url_id) REFERENCES scraper_urls(id),
    category TEXT,
    status_log TEXT,
    error BOOLEAN,
    complete BOOLEAN,
    execution_date DATETIME DEFAULT NOW()
);
ALTER TABLE extraction_process_logs
    ADD PRIMARY KEY (id) ;

ALTER TABLE extraction_process_logs
    MODIFY id INT(11) NOT NULL AUTO_INCREMENT;
    



    CREATE TABLE cron_data_extractor_logs(
    id INT(11) NOT NULL,
    sub_process_threat TEXT,
    status_log TEXT,
    error BOOLEAN,
    stage_log TEXT,
    function_reference TEXT,
    execution_date DATETIME DEFAULT NOW()
);
ALTER TABLE cron_data_extractor_logs
    ADD PRIMARY KEY (id) ;

ALTER TABLE cron_data_extractor_logs
    MODIFY id INT(11) NOT NULL AUTO_INCREMENT;
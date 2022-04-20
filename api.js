import express, { json, Router } from 'express'

import { sign, verify } from 'jsonwebtoken'
import { key } from './config/config.js'
import path from 'path'
const app = express()
const port = 3700
import { query, getConnection } from './database.js'
import { create } from "pdf-creator-node"
import { readFileSync } from "fs"
import cors from 'cors'
import ExcelCreator from './ExcelGenerator.js'
import axios from 'axios'
import { json as _json, urlencoded } from 'body-parser'
app.use(_json())
app.use(cors());
app.use(json())
import Log from './toolkit/colorsLog.js'
const log = (color, text) => {
    console.log(`${color}%s${Log.reset}`, text);
    };
// 1
app.set('key', key);
// 2
app.use(urlencoded({ extended: true }));
// 3
app.use(_json());
const guard = Router();
app.get('/s ', async (req, res) => {
  var users = await query('SELECT jwtoken,id FROM users');
  for(let user of users) {
    
    var controllerData = await query('SELECT discount_starts_at,id FROM scraper_controller WHERE user_id = ? and controllerActive = true;', [user.id])
    for(let controller of controllerData){
      
      var urls = await query('SELECT id,category FROM scraper_urls WHERE controller_id = ? ', [controller.id]);
      var jwtoken = controller.jwtoken
      for(let url of urls) {
      
        var products = await query('SELECT * FROM scraped_data WHERE url_id = ? AND discount < ? ORDER BY discount ASC LIMIT 3', [url.id, controller.discount_starts_at * -1]);
        console.log('products jwtoken');
        console.log(user.jwtoken);
        for (let product of products) {
          var response = await axios.post("https://app.nativenotify.com/api/indie/notification", {
            appId: 2194,
            subID: user.jwtoken,
            appToken: 'WtKcqC4zUq1I7AQx3oxk1d',
            title: product.product,
            message: `descuento:${product.discount}, precio: ${product.newPrice} , categoria: ${url.category}`,
            pushData: { goeToProductsPage: false, url: product.url }
          });
          console.log(response.data);
        }
      const payload = {
      user_id: user.id,
      logged: true,
      check: true
    };
    const token = await sign(payload, app.get('key'), {
      expiresIn: '24h'
    });

        var response = await axios.post("https://app.nativenotify.com/api/indie/notification", {
          appId: 2194,
          subID: 'obe2',
          appToken: 'WtKcqC4zUq1I7AQx3oxk1d',
          title: 'Ver Mas de esta sección ' + url.category,
          message: `Presione para ver los productos de la seccion `,
          pushData: {
            goeToProductsPage:true, controller_id:
              controller.id, category: url.category,
              jwtoken: token
          }
        });
        console.log('Notifications Message: ')
        console.log(response.data)
      };

      console.log(response.data);


    }
  }
  console.log(users);

  /*
  for(let product of products){
    console.log(product)
    var response =await  axios.axios.post("https://app.nativenotify.com/api/indie/notification", {      
      appId: 2194,
      subID: 'obe2',
      appToken: 'WtKcqC4zUq1I7AQx3oxk1d',
      title: product.product,     
     message: `discount:${product.discount}, price: ${product.newPrice}`,
     pushData: { withSome: 'data', url:product.url }
    });
  console.log(response.data);
  }
*/
  res.send('done')
})

guard.use((req, res, next) => {
  const token = req.headers['access-token'];
  if (token != '') {
    verify(token, app.get('key'), (err, decoded) => {
      if (err) {
        return res.json({ error: { JWTokenErr: 'Token no valido', LoginInvalid: true } })
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    res.send({
      mensaje: 'Token no proveída.'
    });
  }
});
app.get('/api/testView', async (req, res) => {
  res.render('oferta', { info });
})
app.get('/api/getOffersDataToPdf', async (req, res) => {
  var products = await query('SELECT * FROM scraped_data WHERE discount < -40 ORDER BY discount ASC LIMIT 150')

  var html = readFileSync("./views/template.html", "utf8");

  var optionsPDF = {
    format: "B2",
    orientation: "landscape",
  };

  // Read HTML Template
  var document = {
    html: html,
    data: {
      products
    },
    path: "./output.pdf",
    timeout: '100000',
    type: "",
  };
  await Promise.all([create(document, optionsPDF)
    .then((res) => {
      console.log(res);
    })
    .catch((error) => {
      console.error(error);
    })])
  res.send('done')
});
app.get('/', async (req, res) => {
  var JWToken = req.body.JWToken;
  var JWTDB = "asdjasd123123";
  if (JWTDB === JWToken) {
    let logged = true;
    res.json({ logged })
  } else {
    res.json({ error: { JWTokenErr: 'Token no valido', LoginInvalid: true } })
  }

})
app.get('/proob', async (req, res) => {
  var sql = "INSERT INTO proob (log,prop) VALUES ?";
  var obj = [{ log: 1, prop: 1 }, { log: 1, prop: 1 }, { log: 1, prop: 1 }, { log: 1, prop: 1 }, { log: 1, prop: 1 }, { log: 1, prop: 1 }, { log: 1, prop: 1 }, { log: 1, prop: 1 }]
  var records = obj.map(e => { return Object.values(e) })
  query(sql, [records], function (err, result) {
    console.log(result);
  });
  res.send('done!');
})
app.get('/generateExcel', async (req,res) =>{
  // limit as 20

  // page number
  // calculate offset
  // query for fetching data with page number and offset
  //SELECT * FROM scraped_data WHERE controller_id=1 AND discount < -20 AND ORDER BY discount ASC  limit 10 OFFSET 10;
  const prodsQuery =await query( `SELECT * FROM scraped_data WHERE controller_id=1 AND discount < -30 ORDER BY category ASC,discount; `)
  const excel = new ExcelCreator();
  excel.getProductsData(prodsQuery);
  var created = excel.Save();
  res.json(created);
});
app.axios.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(req.body)
  userExist = await query('SELECT id,username,password FROM users WHERE username = ?', [username]);

  console.log(userExist)
  if (userExist.length > 0) {
    if(userExist[0].password != password) {
      var error = {
        userErr:false,
        passwordErr: true,
      }
      res.json(error);
      res.end();
    }
    var id = userExist[0].id;

    const payload = {
      user_id: id,
      logged: true,
      check: true
    };

    const token = await sign(payload, app.get('key'), {
      expiresIn: '24h'
    });
    res.json({
      logged:true,
      token: token,
      userErr:false,
      passwordErr: false,
    });
    res.end();
  } else {
      var error = {
        userErr:true,
        passwordErr: true,
      }
      res.json(error);
      res.end();
  }

});
app.axios.post('/api/getLinks/:controller_id', guard, async (req, res) => {
  const { controller_id } = req.params;
  data = await query('SELECT * FROM scraper_urls WHERE controller_id = ? ', controller_id);
  res.send(data);
});
app.axios.post('/api/getContollers', guard, async (req, res) => {
  data = await query('SELECT * FROM scraper_controller WHERE user_id = ? ', req.decoded.user_id);
  res.json(data);
});
app.axios.post('/api/config', guard, (req, res) => {

  res.json(req.decoded)


});
app.get('/api/testResonse', async (req, res) => {
  data = await query('SELECT * FROM scraped_data WHERE discount < -40 LIMIT 20 ');
  console.log(data[0].product);
  res.json({ products: data })


});
app.get('/api/logout', (req, res) => {
  res.json({ LoginInvalid: true });
});
app.axios.post('/api/config/save/controller/:controller_id', guard, async (req, res) => {
  const { controller_id } = req.params;
  var config = {
    discount_starts_at: parseInt(req.body.discount_starts_at) || null,
    discount_ends_at:parseInt(req.body.discount_ends_at) || null,
    controllerActive: req.body.controllerActive == true ? 1 : 0,
  };
  console.log(config)
  console.log(controller_id)
  var result = await query('UPDATE scraper_controller set ? WHERE id = ?', [config, controller_id]);
  console.log(result);

  res.json(result.affectedRows > 0 ? { success: true, } : { error: true })
});
app.axios.post('/api/config/pagination', (req, res) => {
  // limit as 20
  var discount = 20 * -1
  const limit = 10
  // page number
  const page = req.body.page
  // calculate offset
  const offset = (page - 1) * limit
  // query for fetching data with page number and offset
  const prodsQuery = "select * from scraped_data WHERE discount < " + discount + " limit  " + limit + " OFFSET " + offset
  getConnection(function (err, connection) {
    connection.query(prodsQuery, function (error, results, fields) {
      // When done with the connection, release it.
      connection.release();
      if (error) throw error;
      // create payload
      var jsonResult = {
        'products_page_count': results.length,
        'page_number': page,
      }
      console.log(jsonResult)
      // create response
      var myJsonString = JSON.parse(JSON.stringify(jsonResult));
      res.statusMessage = "Products for page " + page;
      res.statusCode = 200;
      res.json(myJsonString);
      res.end();
    })
  })
})
app.axios.post('/api/config/save/nofications', guard, async (req, res) => {
  const { notifyByEmail, notifyByPhone, notifyByPushNotification, controller_active, controller_id } = req.body;
  notiConfig = {
    mailNotification: notifyByEmail || 0,
    phoneNotification: notifyByPhone || 0,
    pushNotification: notifyByPushNotification || 0,
    controller_active: controller_active || 0
  }
  await query('UPDATE scraper_controller set ? WHERE user_id = ? AND controller = ?', [notiConfig, user_id, controller]);
  res.send('success');

});
app.axios.post('/api/config/save/link', guard, async (req, res) => {
  const { product_url, controller_id, category } = req.body;
  console.log('save link')
  const newScraperUrl = {
    product_url,
    controller_id,
    category
  };
  let result = await query('INSERT INTO scraper_urls set ?', [newScraperUrl]);
  console.log(newScraperUrl);
  res.json(result.affectedRows > 0 ? { success: true, id: result.insertId } : { error: true });
})
app.axios.post('/api/config/update/link/:id', guard, async (req, res) => {
  const { url, category } = req.body;
  const { id } = req.params;

  const updateUrl = {
    product_url: url,
    category
  };
  if (url != null) {
    var products = await query('SELECT COUNT(*) FROM `scraped_data` WHERE url_id=?', [id]);
    console.log(products[0]['COUNT(*)']);
    if (products[0]['COUNT(*)'] > 0) {
      await query('UPDATE scraped_data set category = ? WHERE url_id=?', [category, id]);
    }
    var result = await query('UPDATE scraper_urls set ? WHERE id = ?', [updateUrl, id]);

  }
  console.log(result);
  res.json(result.affectedRows > 0 ? { success: true } : updateUrl);
})
app.axios.post('/api/config/delete/link/:id', guard, async (req, res) => {
  console.log('deleting');
  const { id } = req.params;
  var products = await query('SELECT COUNT(*) FROM `scraped_data` WHERE url_id=?', [id]);
  console.log(products[0]['COUNT(*)']);
  if (products[0]['COUNT(*)'] > 0) {
    await query('DELETE FROM scraped_reviewed WHERE url_id =?', [id]);
    await query('DELETE FROM scraped_data WHERE url_id=?', [id]);
  }
  let result = await query('DELETE FROM scraper_urls WHERE id=?', [id]);
  res.json(result.affectedRows > 0 ? { success: true } : { error: true });
})
app.get('/sendNotification', async (req,res)=>{
  var users = await query('SELECT jwtoken,id FROM users');
  for(let user of users) {
    
    var controllerData = await query('SELECT discount_starts_at,id FROM scraper_controller WHERE user_id = ? and controllerActive = true;', [user.id])
    for(let controller of controllerData){
      
      var urls = await query('SELECT id,category FROM scraper_urls WHERE controller_id = ? ', [controller.id]);
      var jwtoken = controller.jwtoken
      for(let url of urls) {
      
        var products = await query('SELECT * FROM scraped_data WHERE url_id = ? AND discount < ? AND  notifyed = 0 ORDER BY discount ASC LIMIT 3 ', [url.id, controller.discount_starts_at * -1]);
        log(Log.bg.red + Log.fg.white, `Products in session: ${products.length}`)
        for (let product of products) {
          var response = await axios.post("https://app.nativenotify.com/api/indie/notification", {
            appId: 2194,
            subID: user.jwtoken,
            appToken: 'WtKcqC4zUq1I7AQx3oxk1d',
            title: product.product,
            message: `descuento:${product.discount}, precio: ${product.newPrice} , categoria: ${url.category}`,
            pushData: { goeToProductsPage: false, url: product.url }
          });
          console.log(response.data);

          await query("UPDATE scraped_data SET notifyed = 1 WHERE id = ? ", product.id )
          
          log(Log.bg.red + Log.fg.white,`Section ${url.category}`)
          log(Log.bg.green + Log.fg.white,`Nofiyed about product`)
          log(Log.fg.green,product.product);
        }
        /*
        const payload = {
          user_id: user.id,
          logged: true,
          check: true
        };
        const token = await jwt.sign(payload, app.get('key'), {
          expiresIn: '24h'
        });
        var response = await axios.axios.post("https://app.nativenotify.com/api/indie/notification", {
          appId: 2194,
          subID: user.jwtoken,
          appToken: 'WtKcqC4zUq1I7AQx3oxk1d',
          title: 'Ver Mas de esta sección ' + url.category,
          message: `Presione para ver los productos de la seccion `,
          pushData: {
            goeToProductsPage:true, controller_id:
              controller.id, category: url.category,
              jwtoken: token
          }
        });
        console.log('Notifications Message: ')
        console.log(response.data)*/
      };



    }
  }

  res.send('done')
})
app.axios.post('/api/config/getAllOffers', async (req, res) => {
  const dis = await query('SELECT discount_starts_at,discount_ends_at FROM scraper_controller WHERE id=?',[controller_id]);
  const controller_id = await query('SELECT id FROM scraper_controller ');
  
  // limit as 20
  var discount = dis[0].discount_starts_at != null ? dis[0].discount_starts_at * -1 : -1;
  var discountEnds = dis[0].discount_ends_at * -1
  console.log(discount);

  const prodsQuery = "SELECT * FROM scraped_data WHERE controller_id=" + controller_id[0].controller_id + " AND discount BETWEEN  " + discountEnds + " AND  "+ discount +" ORDER BY discount ASC  limit  " + limit + " OFFSET " + offset

});
app.axios.post('/api/config/getAllOffersForController',guard, async (req, res) => {
  const { controller_id, page } = req.body;
  const dis = await query('SELECT discount_starts_at,discount_ends_at FROM scraper_controller WHERE id=?',[controller_id]);
  console.log('page');
  console.log(page);
  // limit as 20
  var discount = dis[0].discount_starts_at != null ? dis[0].discount_starts_at * -1 : -1;
  var discountEnds = dis[0].discount_ends_at * -1

  const limit = 10
  // page number
  // calculate offset
  const offset = (page - 1) * limit

  const prodsQuery = "SELECT * FROM scraped_data WHERE controller_id=" + controller_id + " AND discount BETWEEN  " + discountEnds + " AND  "+ discount +" ORDER BY discount ASC  limit  " + limit + " OFFSET " + offset

  getConnection(function (err, connection) {
    connection.query(prodsQuery, function (error, results, fields) {
      // When done with the connection, release it.
      connection.release();
      if (error) throw error;
      // create payload
      var jsonResult = {
        'products_page_count': results.length,
        'page_number': page,
        'products': results
      }
      console.log(jsonResult)
      // create response
      if (jsonResult.products.length > 0) {

        var myJsonString = JSON.parse(JSON.stringify(jsonResult));
        res.statusMessage = "Products for page " + page;
        res.statusCode = 200;
        res.json(myJsonString);
        res.end();
      } else {
        res.json({ scrollEnds: true, products: [] })
        res.end()
      }
    })
  })
});
app.axios.post('/api/config/getAllOffers/:category', guard, async (req, res) => {
  const { controller_id, page } = req.body;
  const { category } = req.params;
  const dis = await query('SELECT discount_starts_at,discount_ends_at FROM scraper_controller WHERE id=?',[controller_id]);
  console.log('page');
  console.log(page);
  // limit as 20
  var discount = dis[0].discount_starts_at != null ? dis[0].discount_starts_at * -1 : -1;
  var discountEnds = dis[0].discount_ends_at * -1

  const limit = 10
  // page number
  // calculate offset
  const offset = (page - 1) * limit
  // query for fetching data with page number and offset
  //SELECT * FROM scraped_data WHERE controller_id=1 AND discount < -20 AND category="Games" ORDER BY discount ASC  limit 10 OFFSET 10;
  const prodsQuery = "SELECT * FROM scraped_data WHERE controller_id=" + controller_id + " AND discount BETWEEN  " + discountEnds + " AND  "+ discount +" AND category='" + category + "' ORDER BY discount ASC  limit  " + limit + " OFFSET " + offset
  getConnection(function (err, connection) {
    connection.query(prodsQuery, function (error, results, fields) {
      // When done with the connection, release it.
      connection.release();
      if (error) throw error;
      // create payload
      var jsonResult = {
        'products_page_count': results.length,
        'page_number': page,
        'products': results
      }
      console.log(jsonResult)
      // create response
      if (jsonResult.products.length > 0) {

        var myJsonString = JSON.parse(JSON.stringify(jsonResult));
        res.statusMessage = "Products for page " + page;
        res.statusCode = 200;
        res.json(myJsonString);
        res.end();
      } else {
        res.json({ scrollEnds: true, products: [] })
        res.end()
      }
    })
  })
});
app.axios.post('/api/reviewProduct',guard,async (req,res)=>{
  const {review, product} = req.body;
  var productF = product;
  if(review != undefined){
    productF.excluded = review.excluded;
    productF.interested_in = review.interested_in;
    var productInReview = await query('SELECT * FROM scraped_reviewed WHERE product = ?', productF.product);
    if(productInReview.length > 0){
      if(productInReview[0].discount != productF.discount)
      await query('UPDATE scraped_reviewed set ? WHERE id=? ',[productF,productInReview[0].id]);
      console.log('ya esta en db')
    } else{
      await query('INSERT INTO scraped_reviewed SET ? ', [productF]);
    }
  }

  var reviewedProduct =await query(`
  SELECT DISTINCT *
  FROM scraped_reviewed
  WHERE product IN (SELECT product FROM scraped_data);
  `);
  var productsInDb =await query(`
  SELECT DISTINCT * 
  FROM scraped_data
  WHERE product IN (SELECT product FROM scraped_reviewed);
  `);
  for(let productReviewed of reviewedProduct){
    for(let productInDb of productsInDb)
    {
    if(productReviewed.product === productInDb.product){  
    if(productReviewed.interested_in)
    {
      if(productReviewed.discount === productInDb.discount || productReviewed.discount * -1 > productInDb.discount * -1  ){
        await query('DELETE FROM scraped_data WHERE id=? ', productInDb.id)
      }
    }else if(productReviewed.excluded){
      await query('DELETE FROM scraped_data WHERE id=? ', productInDb.id)
    }
  }
  }
  }
  res.send('done!')

})

//curl -H "Content-Type: application/json" -d '{"JWToken":"asdjasd123123","category": "Electronicos y sonido", "controller_id" : 1, "product_url": "https://www.amazon.com.mx/s?i=electronics&bbn=9687565011&rh=n%3A9687565011%2Cp_n_deal_type%3A23565478011&dc&fs=true&qid=1642825118&rnid=23565476011&ref=sr_nr_p_n_deal_type_2"}' http://localhost:3700/config/save/link
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
/*
enlaces de referencia :

https://www.amazon.com.mx/s?i=electronics&bbn=9687565011&rh=n%3A9687565011%2Cp_n_deal_type%3A23565478011&dc&fs=true&qid=1642825118&rnid=23565476011&ref=sr_nr_p_n_deal_type_2 - equipos de sonido

https://www.amazon.com.mx/s?i=videogames&bbn=9482640011&rh=n%3A9482640011%2Cp_n_deal_type%3A23565478011&dc&fs=true&qid=1642825276&rnid=23565476011&ref=sr_nr_p_n_deal_type_2 - videojuegos (advertencia : estructura html distinta)

https://www.amazon.com.mx/s?i=toys&bbn=11260442011&rh=n%3A11260442011%2Cp_n_deal_type%3A23565478011&dc&fs=true&qid=1642825271&rnid=23565476011&ref=sr_nr_p_n_deal_type_2 - juguetes
esta consulta devuelve la fila que coincide en la tabla scraped_reviewed
el plan es que una vez obtenida se obtenga la inversa (alterando los parametros cambiando de posicion los nombres y luego comparando los dos arreglos)
una vez tenga los dos arreglos se comparan usando como referencia los parametros unicos de scraped_reviewed y en base a eso se borra o no el registro existente;

SELECT DISTINCT *
FROM scraped_reviewed
WHERE product IN (SELECT product FROM scraped_data);
En esta clase de between el valor mas alto va primero y el mas bajo segundo (normalmente es al reves )
SELECT * FROM scraped_data WHERE discount BETWEEN  -40 AND -10;
*/
//Ape Case AC12459 24 CD DVD BLU-Ray y Caja

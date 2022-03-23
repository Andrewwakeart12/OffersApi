const express = require('express')

const jwt = require('jsonwebtoken')
const config = require('./config/config')
const path = require('path')
const app = express()
const port = 3700
const pool = require('./database');
const puppeteer = require('puppeteer');
const { Expo } = require('expo-server-sdk');
var pdf = require("pdf-creator-node");
var fs = require("fs");
const cors = require('cors');
const ExcelCreator = require('./ExcelGenerator');
const axios = require('axios')
const browserObject = require('./scrapper/browser');
const scraperController = require('./scrapper/amazon/amazonController');
var bodyParser = require('body-parser')
const { reset } = require('nodemon')
app.use(bodyParser.json())
app.use(cors());
app.use(express.json())

// 1
app.set('key', config.key);
// 2
app.use(bodyParser.urlencoded({ extended: true }));
// 3
app.use(bodyParser.json());
const guard = express.Router();
app.get('/sendNotification', async (req, res) => {
  var users = await pool.query('SELECT jwtoken,id FROM users');
  for(let user of users) {
    
    var controllerData = await pool.query('SELECT discount_trigger,id FROM scraper_controller WHERE user_id = ? and controllerActive = true;', [user.id])
    for(let controller of controllerData){
      
      var urls = await pool.query('SELECT id,category FROM scraper_urls WHERE controller_id = ? ', [controller.id]);
      var jwtoken = controller.jwtoken
      for(let url of urls) {
      
        var products = await pool.query('SELECT * FROM scraped_data WHERE url_id = ? AND discount < ? ORDER BY discount ASC LIMIT 3', [url.id, controller.discount_trigger * -1]);
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
    const token = await jwt.sign(payload, app.get('key'), {
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
    var response =await  axios.post("https://app.nativenotify.com/api/indie/notification", {      
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
    jwt.verify(token, app.get('key'), (err, decoded) => {
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
  var products = await pool.query('SELECT * FROM scraped_data WHERE discount < -40 ORDER BY discount ASC LIMIT 150')

  var html = fs.readFileSync("./views/template.html", "utf8");

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
  await Promise.all([pdf
    .create(document, optionsPDF)
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
  pool.query(sql, [records], function (err, result) {
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
  const prodsQuery =await pool.query( `SELECT * FROM scraped_data WHERE controller_id=1 AND discount < -30 ORDER BY category ASC,discount; `)
  const excel = new ExcelCreator();
  excel.getProductsData(prodsQuery);
  var created = excel.Save();
  res.json(created);
});
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(req.body)
  userExist = await pool.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
  console.log(userExist)
  if (userExist.length > 0) {
    var id = userExist[0].id;
    const payload = {
      user_id: id,
      logged: true,
      check: true
    };
    const token = jwt.sign(payload, app.get('key'), {
      expiresIn: '24h'
    });
    res.json({
      mensaje: 'Autenticación correcta',
      token: token
    });
  } else {
    res.json({ mensaje: "Usuario o contraseña incorrectos" })
  }

});
app.post('/api/getLinks/:controller_id', guard, async (req, res) => {
  const { controller_id } = req.params;
  data = await pool.query('SELECT * FROM scraper_urls WHERE controller_id = ? ', controller_id);
  res.send(data);
});
app.post('/api/getContollers', guard, async (req, res) => {
  data = await pool.query('SELECT * FROM scraper_controller WHERE user_id = ? ', req.decoded.user_id);
  res.json(data);
});
app.post('/api/config', guard, (req, res) => {

  res.json(req.decoded)


});
app.get('/api/testResonse', async (req, res) => {
  data = await pool.query('SELECT * FROM scraped_data WHERE discount < -40 LIMIT 20 ');
  console.log(data[0].product);
  res.json({ products: data })


});
app.get('/api/logout', (req, res) => {
  res.json({ LoginInvalid: true });
});
app.post('/api/config/save/controller/:controller_id', guard, async (req, res) => {
  const { controller_id } = req.params;
  var config = {
    discount_trigger: parseInt(req.body.discount_trigger) || null,
    controllerActive: req.body.controllerActive == true ? 1 : 0,
  };
  console.log(config)
  console.log(controller_id)
  var result = await pool.query('UPDATE scraper_controller set ? WHERE id = ?', [config, controller_id]);
  console.log(result);

  res.json(result.affectedRows > 0 ? { success: true, } : { error: true })
});
app.post('/api/config/pagination', (req, res) => {
  // limit as 20
  var discount = 20 * -1
  const limit = 10
  // page number
  const page = req.body.page
  // calculate offset
  const offset = (page - 1) * limit
  // query for fetching data with page number and offset
  const prodsQuery = "select * from scraped_data WHERE discount < " + discount + " limit  " + limit + " OFFSET " + offset
  pool.getConnection(function (err, connection) {
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
app.post('/api/config/save/nofications', guard, async (req, res) => {
  const { notifyByEmail, notifyByPhone, notifyByPushNotification, controller_active, controller_id } = req.body;
  notiConfig = {
    mailNotification: notifyByEmail || 0,
    phoneNotification: notifyByPhone || 0,
    pushNotification: notifyByPushNotification || 0,
    controller_active: controller_active || 0
  }
  await pool.query('UPDATE scraper_controller set ? WHERE user_id = ? AND controller = ?', [notiConfig, user_id, controller]);
  res.send('success');

});
app.post('/api/config/save/link', guard, async (req, res) => {
  const { product_url, controller_id, category } = req.body;
  console.log('save link')
  const newScraperUrl = {
    product_url,
    controller_id,
    category
  };
  let result = await pool.query('INSERT INTO scraper_urls set ?', [newScraperUrl]);
  console.log(newScraperUrl);
  res.json(result.affectedRows > 0 ? { success: true, id: result.insertId } : { error: true });
})
app.post('/api/config/update/link/:id', guard, async (req, res) => {
  const { url, category } = req.body;
  const { id } = req.params;

  const updateUrl = {
    product_url: url,
    category
  };
  if (url != null) {
    var products = await pool.query('SELECT COUNT(*) FROM `scraped_data` WHERE url_id=?', [id]);
    console.log(products[0]['COUNT(*)']);
    if (products[0]['COUNT(*)'] > 0) {
      await pool.query('UPDATE scraped_data set category = ? WHERE url_id=?', [category, id]);
    }
    var result = await pool.query('UPDATE scraper_urls set ? WHERE id = ?', [updateUrl, id]);

  }
  console.log(result);
  res.json(result.affectedRows > 0 ? { success: true } : updateUrl);
})
app.post('/api/config/delete/link/:id', guard, async (req, res) => {
  console.log('deleting');
  const { id } = req.params;
  var products = await pool.query('SELECT COUNT(*) FROM `scraped_data` WHERE url_id=?', [id]);
  console.log(products[0]['COUNT(*)']);
  if (products[0]['COUNT(*)'] > 0) {
    await pool.query('DELETE FROM scraped_data WHERE url_id=?', [id]);
  }
  let result = await pool.query('DELETE FROM scraper_urls WHERE id=?', [id]);
  res.json(result.affectedRows > 0 ? { success: true } : { error: true });
})
app.post('/api/config/getAllOffers', async (req, res) => {
  const { controller_id } = req.body;

  const dis = await pool.query('SELECT discount_trigger FROM scraper_controller WHERE id=?',[controller_id[0].id]);
  
  // limit as 20
  var discount = dis[0].discount_trigger * -1;
  console.log(discount);

  const prodsQuery = "SELECT * FROM scraped_data WHERE controller_id=" + controller_id[0].controller_id + " AND discount < " + discount + " ORDER BY discount ASC  limit  " + limit + " OFFSET " + offset

});

app.post('/api/config/getAllOffers/:category', guard, async (req, res) => {
  const { controller_id, page } = req.body;
  const { category } = req.params;
  const dis = await pool.query('SELECT discount_trigger FROM scraper_controller WHERE id=?',[controller_id]);
  console.log('page');
  console.log(page);
  // limit as 20
  var discount =  dis[0].discount_trigger * -1;
  console.log(discount);
  const limit = 10
  // page number
  // calculate offset
  const offset = (page - 1) * limit
  // query for fetching data with page number and offset
  //SELECT * FROM scraped_data WHERE controller_id=1 AND discount < -20 AND category="Games" ORDER BY discount ASC  limit 10 OFFSET 10;
  const prodsQuery = "SELECT * FROM scraped_data WHERE controller_id=" + controller_id + " AND discount < " + discount + " AND category='" + category + "' ORDER BY discount ASC  limit  " + limit + " OFFSET " + offset
  pool.getConnection(function (err, connection) {
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

//curl -H "Content-Type: application/json" -d '{"JWToken":"asdjasd123123","category": "Electronicos y sonido", "controller_id" : 1, "product_url": "https://www.amazon.com.mx/s?i=electronics&bbn=9687565011&rh=n%3A9687565011%2Cp_n_deal_type%3A23565478011&dc&fs=true&qid=1642825118&rnid=23565476011&ref=sr_nr_p_n_deal_type_2"}' http://localhost:3700/config/save/link
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
/*
enlaces de referencia :

https://www.amazon.com.mx/s?i=electronics&bbn=9687565011&rh=n%3A9687565011%2Cp_n_deal_type%3A23565478011&dc&fs=true&qid=1642825118&rnid=23565476011&ref=sr_nr_p_n_deal_type_2 - equipos de sonido

https://www.amazon.com.mx/s?i=videogames&bbn=9482640011&rh=n%3A9482640011%2Cp_n_deal_type%3A23565478011&dc&fs=true&qid=1642825276&rnid=23565476011&ref=sr_nr_p_n_deal_type_2 - videojuegos (advertencia : estructura html distinta)

https://www.amazon.com.mx/s?i=toys&bbn=11260442011&rh=n%3A11260442011%2Cp_n_deal_type%3A23565478011&dc&fs=true&qid=1642825271&rnid=23565476011&ref=sr_nr_p_n_deal_type_2 - juguetes

*/
//Ape Case AC12459 24 CD DVD BLU-Ray y Caja

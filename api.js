const express = require('express')

const jwt = require('jsonwebtoken')
const config = require('./config/config')
const path = require('path')
const app = express()
const port = 3700
const pool =require('./database');
const puppeteer = require('puppeteer');
const {Expo} = require('expo-server-sdk');
var pdf = require("pdf-creator-node");
var fs = require("fs");
const cors = require('cors');

const axios = require('axios')
const browserObject = require('./scrapper/browser');
const scraperController = require('./scrapper/amazon/amazonController');
var bodyParser = require('body-parser')
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
app.get('/sendNotification',async (req,res)=>{

  var products = await pool.query('SELECT * FROM scraped_data WHERE discount < -40 ORDER BY discount ASC LIMIT 5')
  for(let product of products){
    console.log(product)
    var response =await  axios.post("https://app.nativenotify.com/api/indie/notification", {      
      appId: 2194,
      subID: 'obe1',
      appToken: 'WtKcqC4zUq1I7AQx3oxk1d',
      title: product.product,     
     message: `discount:${product.discount}, price: ${product.newPrice}`,
     pushData: { withSome: 'data', url:product.url }
    });
  console.log(response.data);
  }

  res.send('done')
})

guard.use((req, res, next) => {
   const token = req.headers['access-token']; 
    if (token != '') {
      jwt.verify(token, app.get('key'), (err, decoded) => {      
        if (err) {
    return res.json({error:{JWTokenErr:'Token no valido', LoginInvalid: true}})
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
 app.get('/api/testView', async (req,res)=>{
  res.render('oferta',{info});
 })
app.get('/api/getOffersDataToPdf',async (req,res)=>{
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
if(JWTDB === JWToken){
  let logged = true;
  res.json({logged})
}else{
  res.json({error:{JWTokenErr:'Token no valido', LoginInvalid: true}})
}

})
app.get('/proob', async (req,res)=>{
  var sql = "INSERT INTO proob (log,prop) VALUES ?";
 var obj= [{log:1,prop:1},{log:1,prop:1},{log:1,prop:1},{log:1,prop:1},{log:1,prop:1},{log:1,prop:1},{log:1,prop:1},{log:1,prop:1}]
  var records= obj.map(e=>{return Object.values(e)})
  pool.query(sql, [records], function(err, result) {
    console.log(result);
});
res.send('done!');
})
app.post('/api/login', async (req,res)=>{
  const {username, password} = req.body;
  console.log(req.body)
  userExist = await pool.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
  console.log(userExist)
  if(userExist.length > 0) {
  var id= userExist[0].id;
    const payload = {
     user_id: id,
     logged:true,
     check:true
    };
    const token = jwt.sign(payload, app.get('key'), {
     expiresIn: 1440
    });
    res.json({
     mensaje: 'Autenticación correcta',
     token: token
    });
      } else {
          res.json({ mensaje: "Usuario o contraseña incorrectos"})
      }
  
});
app.post('/api/config', guard , (req,res)=>{

res.json(req.decoded)
  

});
app.get('/api/testResonse' , async (req,res)=>{
  data = await pool.query('SELECT * FROM scraped_data WHERE discount < -40 LIMIT 20 ');
console.log(data[0].product);
  res.json({products:data})
    
  
  });
app.get('/api/logout', (req,res)=>{
  res.json({LoginInvalid: true});
});
app.post('/api/config/save', (req,res)=>{
  var config = {
    urls : req.body.urls || null,
    notifyByEmail : req.body.notifyByEmail || null,
    notifyByPushNotification : req.body.notifyByPushNotification || null,
    notifyByPhone : req.body.notifyByPhone || null,
    controllerActive: req.body.controllerActive || null,
    controllerId : req.body.controllerId || null
  };
  
  res.json({requestBody: config}) 
});
app.post('/api/config/save/nofications',guard,async (req,res)=>{
  const {notifyByEmail,notifyByPhone,notifyByPushNotification,controller_active,controller_id} = req.body;
  notiConfig = {
    mailNotification : notifyByEmail || 0,
    phoneNotification : notifyByPhone || 0,
    pushNotification : notifyByPushNotification || 0,
    controller_active: controller_active || 0
  }
    await pool.query('UPDATE scraper_controller set ? WHERE user_id = ? AND controller = ?', [notiConfig,user_id,controller]);
    res.send('success');
 
});
app.post('/api/config/save/link', guard ,async (req,res)=>{
  const {product_url,controller_id,category} = req.body;
    const newScraperUrl = {
      product_url,
      controller_id,
      category
    };
    let result = await pool.query('INSERT INTO scraper_urls set ?', [newScraperUrl]);
    console.log(result);
    res.json(result.affectedRows > 0 ? {success:true} : {error:true});
})
app.post('/api/config/delete/link/:id', guard , async (req,res)=>{
  const {id} = req.params;
    let result = await pool.query('DELETE FROM scraper_urls WHERE  id=?', [id]);
    res.json(result.affectedRows > 0 ? {success: true} : {error : true});
})
app.post('/api/config/getAllOffers', guard , async (req,res)=>{
  console.log(req.decoded.user_id)
  var user_id = req.decoded.user_id;
    let controller_id = await pool.query('SELECT * FROM scraper_controller WHERE  user_id= ? AND controller = "Amazon"', [user_id]);
    controller_id = await controller_id[0].id;
    console.log(controller_id);
    let result = await pool.query('SELECT * FROM scraped_data WHERE controller_id=?  ORDER BY discount ASC', [controller_id]);
    res.json(result);
});
app.post('/api/config/getAllOffers/:category', guard , async (req,res)=>{
  console.log(req.decoded.user_id)
  const {category} = req.params;
  var user_id = req.decoded.user_id;
    let controller_id = await pool.query('SELECT * FROM scraper_controller WHERE  user_id= ? AND controller = "Amazon"', [user_id,category]);
    controller_id = await controller_id[0].id;
    console.log(controller_id);
    let result = await pool.query('SELECT * FROM scraped_data WHERE controller_id=? AND category=? ORDER BY discount ASC', [controller_id,category]);
    res.json(result);
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

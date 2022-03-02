const request = require('request');
const cheerio = require('cheerio'); 

let ip_addresses = [];
let port_numbers = [];
let country = [];

async function getProxy(){

  return new Promise(async resolve => {
    await request("https://free-proxy-list.net/", (error, response, html) => {
      if (!error && response.statusCode == 200) {
        const $ = cheerio.load(html);
    
        $("td:nth-child(1)").each(function(index, value) {
          ip_addresses[index] = $(this).text();
        });
    
        $("td:nth-child(2)").each(function(index, value) {
          port_numbers[index] = $(this).text();
        });
        $("td:nth-child(3)").each(function(index, value) {
          country[index] = $(this).text();
        });
      } else {
        console.log("Error loading proxy, please try again");
        resolve(null);
      }
    
      ip_addresses.join(", ");
      port_numbers.join(", ");
      if(ip_addresses[0] === undefined){
        resolve(null);
      }
      let random_number = Math.floor(Math.random() * ip_addresses.length - 1);
      console.log("IP Addresses:", ip_addresses[random_number]);
      console.log("Country:", country[random_number]);
      console.log("Port Numbers:", port_numbers[random_number]);
      var proxy = `http://${ip_addresses[random_number]}:${port_numbers[random_number]}`;
     resolve(proxy)
    });
});}

module.exports.getProxy = getProxy;
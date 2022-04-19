const axios = require('axios');
const bluebird = require("bluebird");
const { links } = require('express/lib/response');
var cron = require('node-cron');

class ProxyManager{
static counter = 0;
    proxysArr = [];
    //returns new proxy (request proxy to proxyOrbit);
     async init(){
        for(let i = 0; i < 2 ; i++){
           await this.setNewProxy();
        }
    }
    async getProxy(){
            console.log('getting new proxy...');
            var resetGet = 0
            var success = false
            while(!success && resetGet < 10){
            try{
                var res =await  axios.get('https://api.proxyorbit.com/v1/?token=-ZZhH3ez3XLjAMii06NW1Ls9WluEd3I1oNJLbMbaJRo&ssl=true&amazon=true&protocol=http');
                if(res.data != undefined){
                    console.log(res.data);
                    success = true;
                    return res.data.curl;

                }
            }catch(e){
                console.log(e.message)
                if(e.message.trim() === 'connect ECONNREFUSED 165.232.130.146:443'){
                    res = {data:{websites:{amazon:undefined}}};
                    console.log('error break')
                    break;
                }
                if(e.message.trim() === 'getaddrinfo EAI_AGAIN api.proxyorbit.com'){
                    console.log('error')
                    resetGet++;
                    continue;
                }
            if(e.message === 'Request failed with status code 502'){
            break;
            }
            
                if(res.data === undefined){
                    console.log('error')
                    resetGet++;
                }else{
                    res = {data:{websites:{amazon:undefined}}};
                    console.log('error break')
                    break;
                }
            }
        }
        if(success === false){
            return false;
        }
                if(res.data.websites.amazon != undefined){
                    if(res.data.websites.amazon == true){
                        return res.data.curl;
                    }
                }else if(res.data === undefined){
                    return false;
                }else{
                    return false;
                }
        return false;
    }
    //set a new proxy in the local array
    async setNewProxy(){
            var temporal_proxy = await this.getProxy();
            if(temporal_proxy != false){
                this.proxysArr.push({proxy:temporal_proxy, in_use: false, id: ProxyManager.counter++});
                return true;
            }else{
                return false;
            }
        }
    //getRandom proxy from the local array if all proxys are in use gets a new proxy
    async getRandomProxy() {
        try{
            

        var unusedProxys = this.proxysArr.map((e,i) => {if(e.in_use === false){
            return e;
        }else{
            false
        }

    });
        unusedProxys = unusedProxys.filter(Boolean);

        var randomNumber = Math.floor(Math.random() * unusedProxys.length);

        var proxySelected = unusedProxys[randomNumber];
        if(proxySelected != undefined){
        var selectedId;
        console.log('change proxy started')
        this.proxysArr.forEach((e,i) =>{
                if(e.id === proxySelected.id){
                    selectedId = i;
                }
            })
        this.proxysArr[selectedId].in_use = true;
        return proxySelected;
        }else{
            var prox =await this.setNewProxy();
            if(prox != false){
                var finalProxy = await this.getRandomProxy();
                return finalProxy;
            }else{
                return false;
            }

        }
        }catch(e){
            console.log(e);
        }
    }
    //just for testing purpose
    fakeSetNewProxy(){
        var ip = `${this.generateRandomIpPart()}.${this.generateRandomIpPart()}.${this.generateRandomIpPart()}.${this.generateRandomIpPart()}`;
        this.proxysArr.push({proxy:ip,in_use:false, id:ProxyManager.counter++});
    }
    generateRandomIpPart(){
        return Math.floor(Math.random() * 162);

    }
    //delete a obsolete proxy for a new one
    async changeProxy(id){
        var selectedId;
        console.log('change proxy started')
       this.proxysArr.forEach((e,i) =>{
            if(e.id === id){
                selectedId = i;
            }
        })
        this.proxysArr.splice(selectedId,1);
        var newProxy = await this.getRandomProxy();
            return newProxy;
        
    }
    //when finish a extraction gets a new proxy automatically;
    async markProxyAsUnused(id){
        var selectedId;
        console.log('change proxy started')
       this.proxysArr.forEach((e,i) =>{
            if(e.id === id){
                selectedId = i;
            }
        })
        this.proxysArr[selectedId].in_use = false;
    }
}
/*
async function test(){
    var proxy = new ProxyManager();
    var tProxy = await proxy.getRandomProxy();
    console.log('beforeChange');
    console.log(tProxy);
    console.log('afterChange');
    tProxy = await proxy.changeProxy(tProxy.id);
    console.log(tProxy);
    proxy.markProxyAsUnused(tProxy.id);
    console.log(tProxy);

}*/
/*
const proxy = new ProxyManager();

const task = cron.schedule('5 * * * * *', async () =>{
   var arr = ['1','2']
   bluebird.map(arr,(a)=>{
        var linksArr = ['1','2','3','4','5'];
        bluebird.map(linksArr,async (link,i)=>{
            var scraper = new Rev(proxy,link,i);
            scraper.rev();
        }, {concurrency:2})    
   })

});

task.start()
//test();
class Rev {
    proxy;
    link;
    i;
    constructor(proxy,link,i){
        this.proxy=proxy;
        this.link = link;
        this.i=i;
    }
    async rev(){
        var proxy=this.proxy;
        var link = this.link;
        var i = this.i;
        console.log('in bluebird : ' + link);
        var tProxy = await proxy.getRandomProxy();
        console.log('beforeChange ' + link + '\n');
        console.log(tProxy);
        console.log("proxy.proxysArr :" + i);
        console.log(proxy.proxysArr.filter(e=>e.in_use != true));
        setTimeout(
            
            async ()=>{

                proxy.markProxyAsUnused(tProxy.id);
            },
            Math.floor(Math.random() * 3000)
        )
    }
}
      
*/ 
module.exports = ProxyManager;
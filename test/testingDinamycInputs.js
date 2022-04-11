/*dinamic import example*/
async function regMod(){
try {
    var name = 'amazon';
    var protocolName = 'Scraper';
    var imp =  `./../scrapper/${name}/` + name + protocolName + '.js';
    var GeneralData = await import(imp)
    var {DERR, Scraper} = GeneralData
    console.log(Scraper);
} catch (error) {
    console.log(error)
}

}
async function regModBucle(){
    try {
        var names = ['amazon','liverpool'];
        for(let name of names){
            var protocolName = 'Scraper';
            var imp =  `./../scrapper/${name}/` + name + protocolName + '.js';
            var GeneralData = await import(imp)
            var {DERR, Scraper} = GeneralData
            var deer = new DERR(`${name} says hi to you`);
            console.log(deer.message);
        }

    } catch (error) {
        console.log(error)
    }
    
    }
    regModBucle();
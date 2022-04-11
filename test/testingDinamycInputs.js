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
regMod();
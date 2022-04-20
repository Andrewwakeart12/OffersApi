import Excel from 'exceljs';

String.prototype.replaceAll = function (search, replacement) {
  var target = this;
  return target.split(search).join(replacement);
};
class ExcelCreator {
  filename = ''
  columnsData = [];
  wb = new Excel.Workbook();
  ws = this.wb.addWorksheet('Productos');
  constructor() {
    var actualDate = new Date().toISOString().
      replace(/T/, '_').
      replace(/\..+/, '');
    actualDate = actualDate.replaceAll('-', '_')

    this.filename = `Registros_De_Productos_Del_${actualDate}.xlsx`;
    this.ws.columns = [
      { header: 'Fecha de promocion', key: 'col1' },
      { header: 'Producto visto', key: 'col2' },
      { header: 'Categoria', key: 'col3' },
      { header: 'Titulo de producto', key: 'col4' },
      { header: 'Precio base', key: 'col5' },
      { header: 'Precio c/descuento', key: 'col6' },
      { header: 'Porcentaje del descuento', key: 'col7' },
      { header: 'Url', key: 'col8' },
    ]
  }
  replacer(search) {
    const replacer = new RegExp(search, 'g')
    return replacer;
  }
  getProductsData(data) {
    var productsToArr = []
    data.forEach((el)=>{
      var destructureArrFromProduct = [
        el.updated_at,
        'No introducido aún',
        el.category,
        el.product,
        `$${el.oldPrice}`,
        `$${el.newPrice}`,
        `${el.discount}%`,
        el.url
      ];
      productsToArr.push(destructureArrFromProduct);
    })
    this.columnsData= productsToArr;
    this.columnsData.forEach((item,index)=>{
      var el = this.ws.getRow(index + 2 );
      el.values = item;
    })
    this.AdjustColumnWidth(this.ws)
  }
  AdjustColumnWidth(worksheet) {
    worksheet.columns.forEach(column => {
      const lengths = column.values.map(v => v.toString().length);
      const maxLength = Math.max(...lengths.filter(v => typeof v === 'number'));
      column.width = maxLength + 2;
      console.log(maxLength);
    });
  }
  Save() {
    var created;
    this.wb.xlsx
      .writeFile(`/opt/lampp/htdocs/RegistrosExcel/${this.filename}`)
      .then(() => {
        created = true;
      })
      .catch(err => {
        created = false;
        console.log(err.message);
      });
      return created;
  }
}
export default ExcelCreator;
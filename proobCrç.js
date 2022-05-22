import Promise from 'bluebird'

var array = {};
array['1'] = [1,2,3,4,5,6];
array['2'] = [1,2,3,4];
array['3'] = [1,2,3,4,5];

Promise.each([1, 2, 3], function(val1) {
  Promise.each(array[`${val1}`], function(val2) {
    return new Promise.delay(1000).then(function() {
        console.log(`value of array : ${val2} | bucle execution ${val1} `);
    });
  }, {concurrency: 2});
},);
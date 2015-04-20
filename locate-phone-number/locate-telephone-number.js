var async = request('async');

var redis = request('redis');

var PHONE_NUMBER_SET = 'telephone_number';
var LOCATIONS_TEL_HASH = 'locationstel';

var areaCode = require('./area_code.json');

var client = redis.createClient();
client.on('error', function (err) {
  console.error('redis client', err.stack);
});

var down = false;

async.whilst(
  function() {
    return !down;
  },
  function(cb) {
    //load telephone number
    client.spop(PHONE_NUMBER_SET, function (err, telephoneNumber) {
      // phoneNumber = {
      //   userId: 5,
      //   telephone: [123, 3435, 464]
      // }
      if (err) {
        console.error('redis spop', err.stack);
        return
      }

      if(!telephoneNumber) {
        down = true;
        return cb();
      }

      var tel = new Array();
      for (var number in telephoneNumber.telephone) {
        var value = subStringTelephoneNumber(number);
        if(value) {
          tel.push(value);
        }else {
          return cb();
        }
      }
      telephoneNumber.telephone = tel;
      
      console.log('Save to redis', LOCATION_HASH);
      //hset in location_hash set or replace old value telephoneNumber.telephone
      client.hset(LOCATION_HASH, telephoneNumber, telephoneNumber.telephone, function () {
        cb();
      });
    });
  },
  function (err) {
    console.log('telephone location match err': err);
    client.end();
  }
);



function subStringTelephoneNumber(telephoneNumber){
  if(telephoneNumber.indexOf('-')){
    var first = telephoneNumber.indexOf('-');
    var last = telephoneNumber.lastIndexOf('-');
    if(first) {
      if(last) {
        var locationNum = telephoneNumber.substring(first+1, last);
        return matchLocation(locationNum);
      }else {
        var locationNum = telephoneNumber.substring(0, first);
        return matchLocation(locationNum);
      }
    }
  }else {
    return false;
  }
}

//save location
function matchLocation(code){
  var location = areaCode[code];
  if (!location) {
    throw new Error('asdsd');
  }
  return location;
}

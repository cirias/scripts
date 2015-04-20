var async = request('async');

var redis = request('redis');

var PHONE_NUMBER_SET = 'telephone_number';
var LOCATIONS_TEL_HASH = 'locationstel';

var areaCode = require('./area_code.json');

var client = redis.createClient();
client.on('error', function (err) {
  console.error('redis client', err.stack);
});

async.wlist(
  //load telephone number
  client.spop(PHONE_NUMBER_SET, function (err, phoneNumber) {
    // phoneNumber = {
    //   userId: 5,
    //   phone: [123, 3435, 464]
    // }
    var phone = JSON.parse(phoneNumber);
    $.each(phone.telephone, function(i, val){
      val = subStringTelephoneNumber(val);
    });
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

function matchLocation(code){
  var location = areaCode[code];
  if (!location) {
    throw new Error('asdsd');
  }
  return location;
  // return table[code];
}

var async = require('async');
var request = require('request');
var cheerio = require('cheerio');
var iconv = require('iconv-lite');
var fs = require('fs');
var redis = require('redis');

var PHONE_NUMBER_SET = 'phone_numbers';
var LOCATION_HASH = 'locations';
var ERROR_NUMBER_SET = 'error_numbers';
var WRONG_NUMBER_SET = 'wrong_numbers';

var finish = false;

main();
//test();

function main () {
  var client = redis.createClient();
  client.on('error', function (err) {
    console.error('redis client', err.stack);
  });

  async.whilst(function() {
    return !finish;
  }, function (cb) {
    client.spop(PHONE_NUMBER_SET, function (err, phoneNumber) {
      if (err) {
        console.error('redis spop', err.stack);
        return cb();
      }

      if (!phoneNumber) {
        finish = true;
        return cb();
      }

      crawl(phoneNumber, function (err, location) {
        if (err) {
          switch(err) {
            case 'error':
              client.sadd(ERROR_NUMBER_SET, phoneNumber, function () { cb(); });
              break;
            case 'wrong':
              client.sadd(WRONG_NUMBER_SET, phoneNumber, function () { cb(); });
              break;
          }
          return;
        }

        console.log('Save to redis', LOCATION_HASH);
        client.hset(LOCATION_HASH, phoneNumber, location, function () {
          cb();
        });
      });
    });
  }, function () {
    //fs.writeFileSync('location.json', JSON.stringify(location, null, '  '));
    //fs.writeFileSync('errors.txt', JSON.stringify(errorNumber, null, '  '));
    //fs.writeFileSync('wrongs.txt', JSON.stringify(wrongNumber, null, '  '));
    client.end();
  });
}

function test () {
  [13661579847, 15821328326, 15921195816].forEach(function (number) {
    crawl(number, function (location) {
      console.log(location);
    });
  });
}

function crawl (phoneNumber, callback) {
  var url = 'http://www.ip138.com:8080/search.asp?action=mobile&mobile=' + phoneNumber;
  console.log('start crawl', url);
  request({
    url      : url,
    encoding : null
  }, function (err, res, body) {
    if (err) {
      console.error(phoneNumber + ' request: ' + err.stack);
      return callback('error');
    }

    if (res.statusCode != 200) {
      console.error(phoneNumber + ' response status not 200' + body);
      return callback('error');
    }

    body = iconv.decode(body, 'gbk');
    if (body.indexOf('验证手机号有误') >= 0) {
      console.log(phoneNumber + ' 验证手机号有误');
      return callback('wrong');
    }

    callback(null, locate(body));
  });
}

function locate(body) {
  $ = cheerio.load(body);
  return $('td.tdc2')[1].children.reduce(function (result, child) {
    return result += child.data;
  }, "").replace('<td></td>', '').trim();
}

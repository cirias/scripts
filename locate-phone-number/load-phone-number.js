var mysql = require('mysql');
try {
  var config = JSON.parse(process.env.TS_MYSQL_CONFIG);
} catch (err) {
  throw new Error('Please check your environment TS_MYSQL_CONFIG');
}
var conn = mysql.createConnection(config);
conn.connect();

var redis = require('redis');
var client = redis.createClient();
client.on('error', function (err) {
  if (err) throw err;
});

var PHONE_NUMER_SET = 'phone_numbers';

console.time('Query');
conn.query("SELECT u.office_phone AS uofficephone, u.mobile_phone AS umobilephone, u.phone AS uphone, c.office_phone, c.mobile_phone AS cmobilephone "
            + "FROM user AS u "
            + "LEFT JOIN company_user AS cu ON cu.user_id = u.id "
            + "LEFT JOIN company AS c ON cu.company_id = c.id "
            + "WHERE (u.office_phone IS NOT NULL AND u.office_phone <> '') "
            + "OR (u.mobile_phone IS NOT NULL AND u.mobile_phone <> '') "
            + "OR (u.phone <>  '' AND u.phone IS NOT NULL) "
            + "OR (c.office_phone IS NOT NULL AND c.office_phone <> '') "
            + "OR (c.mobile_phone IS NOT NULL AND c.mobile_phone <> '') "
            + "GROUP BY u.id",
  function (err, rows, fields) {
    console.timeEnd('Query');
    if (err) throw err;

    rows.forEach(function(row) {
      fields.forEach(function (field) {
        var numbers = row[field.name];
        if (!numbers) return;
        numbers.split(',').forEach(function (number) {
          var phoneNumber = parse(number);
          if (phoneNumber) {
            console.log('Sadd', phoneNumber, numbers);
            client.sadd(PHONE_NUMER_SET, phoneNumber);
          }
        });
      });
    });

    client.end();
    conn.end();
});

function parse (number) {
  if (!number) {
    return
  }

  var regx = /^1\d{9,10}$/;
  if (typeof number == 'number') {
     number =  number.toString().replace(/^86/, '');
     if (regx.exec(number) != null){
       return number;
     };
  } else if (typeof number == 'string') {
    number = number.trim();
    if (!number) {
      return
    }

    number = parseInt(number.replace(/[^\d]/g, ''));
    if (Number.isNaN(number)) {
      return
    }

    number = number.toString().replace(/^86/, '');
    if (regx.exec(number) == null){
      return 
    }
    return number;
  } else {
    throw new Error('Unknow type of number');
  }
}


======

### Prepare

Modify `load-phone-number.js` to put the mysql config.

### 
Run export TS_MYSQL_CONFIG='{"host":"srv-tradesparq-rds-master.cmpvkt6xbzj6.us-west-2.rds.amazonaws.com","user":"sanfordi","password":"Gcn392jFa","database":"sanfordi"}'

### Usage

Load phone numbers to redis:

    node load-phone-number.js

Crawl location:

```bash
node locate-phone-number.js 1>out.1.log 2>err.1.log &
node locate-phone-number.js 1>out.2.log 2>err.2.log &
node locate-phone-number.js 1>out.3.log 2>err.3.log &
node locate-phone-number.js 1>out.4.log 2>err.4.log &
```


var Promise = require('es6-promise').Promise;
var cheerio = require('cheerio');
var superagent = require('superagent');
var url = require('url');
var mongodb = require('mongodb');

var ip_addr = process.env.OPENSHIFT_NODEJS_IP   || '127.0.0.1';
var port    = process.env.OPENSHIFT_NODEJS_PORT || '8080';
var connection_string = '127.0.0.1:27017/water';
if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
  connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
  process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
  process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
  process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
  process.env.OPENSHIFT_APP_NAME;
}
var MongoClient = require('mongodb').MongoClient;

var db = null;
var connect = function() {
  return new Promise(function(resolve,reject){
    MongoClient.connect('mongodb://'+connection_string, function(err, db2) {
      if(err) {
        reject();
      } else {
        db = db2;
        resolve();
      }
    });
  });
}
// var server = new mongodb.Server('localhost',27017,{auto_reconnect:true});
// var db = new mongodb.Db('water',server,{safe:true});

var rootURL = 'http://www.whwater.com/gsfw/tstz/jhxts/';
var documentName = 'nowater';
var globalDococument = null;

var parseWebpage = function() {
  return new Promise(function(resolve,reject){
    superagent.get(rootURL)
    .end(function(err, sres) {
      if (err) {
        reject(err);
      } else {
        var $ = cheerio.load(sres.text);
        var items = [];
        $('table table table a').each(function(idx, element) {
          var $element = $(element);
          items.push({
            title: $element.text(),
            href: url.resolve(rootURL, $element.attr('href')),
            processed: false
          }); 
        });
        resolve(items);
      }
    });  
  });
}

var closeDB = function() {
  db.close();
}

//var openDB = function() {
//  return new Promise(function(resolve,rejct){
//    db.open(function(err,db){
//      if(err) {
//        console.log('db open failed');
//        reject();
//      } else {
//        resolve();
//      }
//    });
//  });
//}

var openDocument = function() {
  return new Promise(function(resolve,reject){
    db.collection(documentName, {safe:true}, function(err,doc){
      if(err) {
        console.log('collection open failed');
        reject();
      } else {
        globalDococument = doc
        resolve();
      }
    });
  });
}

var checkItemExistance = function(item) {
  return new Promise(function(resolve, reject){
    globalDococument.findOne({'title' : item['title']}, function(err,results){
      if (results == null) {
        resolve(item);
      } else {
        resolve();
      }
    }); // find with tail
  });
}

var filterItems = function(items) {
  return new Promise(function(resolve,rejct){
    var promises = items.map(checkItemExistance);
    Promise.all(promises)
    .then(function(checkedItems){
      var newItems = checkedItems.filter(function(item) {
        return item != null
      });
      resolve(newItems);
    })
  });
}

var saveItems = function(newItems) {
  return new Promise(function(resolve,reject){
    if (newItems.length > 0) {
      globalDococument.insert(newItems, {safe:true}, function(err,result){
        if (err) {
          console.log('insertion failed');
          reject();
        } else {
          console.log(result);
          resolve();
        }
      });
    } else {
      console.log('insert NONE');
      resolve();
    }
  });
}

Promise.resolve()
.then(connect)
.then(openDocument)
.then(parseWebpage)
.then(filterItems)
.then(saveItems)
.then(closeDB)
.catch(closeDB);

var Promise = require('es6-promise').Promise;
var nodemailer = require('nodemailer');
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

var documentName = 'nowater';
var globalDococument = null;
var transporter = nodemailer.createTransport('smtps://user%40163.com:pass@smtp.163.com');
var mailOptions = {
  from: 'Water Notifier<user@163.com>',
  to: '',
  subject: '又要停水了......',
  text: '',
  html: ''
};

var keywords = {
  '雄楚':['user@gmail.com'],
  '关西':['user@gmail.com'],
  '南湖':['user@gmail.com'],
  '关山大道':['user@gmail.com']
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

var filterRecord = function(keyword) {
  return new Promise(function(resolve, reject){
    globalDococument.find({'title': {$regex: keyword}, 'processed': false}).toArray(function(err,records){
      if (records.length > 0) {
        resolve([keyword, records]);
      } else {
        resolve();
      }
    }); // find with tail
  });
}

function sendEmail(email, records) {
  return new Promise(function(resolve, reject){
    mailOptions.to = email
    mailOptions.text = ''
    mailOptions.html = ''
    records.forEach(function(record){
      mailOptions.text += record.title + ' (' + record.href + ")\n";
      mailOptions.html += "<a href=\"" + record.href + "\">" + record.title + "</a> </br>"
    });

    transporter.sendMail(mailOptions, function(error, info){
      resolve();
    });
  });  
}

var notifyUser = function(kvPair) {
  return new Promise(function(resolve, reject){
    if (kvPair == null) {
      resolve();
    } else {
      var keyword = kvPair[0];
      var records = kvPair[1];
      var emails = keywords[keyword];

      var promises = [];
      emails.forEach(function(email){
        var promise = sendEmail(email, records);
        promises.push(promise);
      });

      Promise.all(promises)
      .then(function(){
        resolve();
      })
    }
  });
}

var processAKeyword = function(keyword) {
  return new Promise(function(resolve, reject){
    Promise.resolve(keyword)
    .then(filterRecord)
    .then(notifyUser)
    .then(function(){
      resolve();
    });
  });
}

var processAllKeywords = function() {
  return new Promise(function(resolve,rejct){
//    var promises = keywords.map(processAKeyword);
    var promises = [];
    for (var keyword in keywords) {
      var promise = processAKeyword(keyword);
      promises.push(promise);
    }

    Promise.all(promises)
    .then(function(){
      resolve();
    });
  });
}

var markRecords = function() {
  return new Promise(function(resolve,rejct){
    var o = {w:1};
    o.multi = true
    // Update multiple documents using the multi option
    globalDococument.updateMany({'processed':false}, {$set:{'processed':true}}, o, function(err, r) {
      resolve();
    });
  });
}

Promise.resolve()
.then(connect)
.then(openDocument)
.then(processAllKeywords)
.then(markRecords)
.then(closeDB)
.catch(closeDB);

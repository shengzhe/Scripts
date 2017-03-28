var request = require('request');
var nodemailer = require('nodemailer');

var thresholds = [-10000.0, -1.0, -0.9, -0.8, -0.7, -0.6, -0.5, -0.45, -0.4, -0.35, -0.3, -0.25, -0.2, -0.15, -0.1, -0.05, 0, 0.05, 0.064, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 10000];
var totalCount = 241;
var key = 'close';
var url = "http://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=sh000001&scale=240&datalen="+totalCount;

request(encodeURI(url), function(error, resp, body) {
    var msg = "";
    if (!error && resp.statusCode == 200) {
      var str = JSON.stringify(eval('('+body+')'));
      var jsonResponse = JSON.parse(str);
      
      var ratios = processData(jsonResponse);
      if (ratios.length != 2) {
        msg = "240日均线 - error calculating ratios";
      } else {
        msg = getAlarm(ratios);
      }
    } else {
      msg = "240日均线 - error retrieving sina data";
    }
        
    if (msg !== "") {
      console.log(msg);
      emailMsg(msg);
    } else {
      console.log("无恙");
    }
  });

function processData(data) {

  if (data.length != totalCount) {
    console.log("error: get data length of " + data.length);
    return [];
  }

  var price = 0;
  data.forEach(function(item){
    price += parseFloat(item[key]);
  });

  var day0 = parseFloat(data[0][key]);
  var dayN_1 = parseFloat(data[totalCount-2][key]);
  var dayN = parseFloat(data[totalCount-1][key]);
  var yesterday = dayN_1 / ((price - dayN) / (totalCount-1)) - 1.0;
  var today = dayN / ((price - day0) / (totalCount-1)) - 1.0;

  return [yesterday, today];
}

function getAlarm(ratios) {
  var ty =  0; // threshold index for yesterday
  var tt = 0; // threshold index for today
  for (ndx = 0; ndx < thresholds.length-1; ndx++) {
    if (ratios[0] > thresholds[ndx] && ratios[0] <= thresholds[ndx+1]) {
      ty = ndx;
    }
    if (ratios[1] > thresholds[ndx] && ratios[1] <= thresholds[ndx+1]) {
      tt = ndx;
    }        
  }

  if (ty == tt) {
    return ""; // no need report
  }

  var msg = "";
  if (tt > ty) {
    msg = "240日均线突破" + thresholds[tt]*100 + "%了";
  } else {
    msg = "240日均线下穿" + thresholds[tt+1]*100 + "%了";
  }

  return msg;
}

function emailMsg(msg) {
  var transporter = nodemailer.createTransport('smtps://user%40163.com:pass@smtp.163.com');
  var mailOptions = {
  from: 'Stock Notifier<user@163.com>',
  to: '',
  subject: '上证240均线告破',
  text: '',
  html: ''
  };

  mailOptions.to = 'user@163.com';
  mailOptions.subject = msg;
  mailOptions.text = msg;
  mailOptions.html = msg;

  transporter.sendMail(mailOptions, function(error, info){
  });
}

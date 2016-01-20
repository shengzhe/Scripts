var async = require('async');
var request = require('request');

var booktypes = ['new', 'hot', 'reputation', 'over'];
var categories = {
  '玄幻':['东方玄幻', '异界大陆', '异界争霸', '远古神话'],
  '奇幻':['西方奇幻', '领主贵族', '亡灵异族', '魔法校园'],
  '武侠':['传统武侠', '新派武侠', '国术武侠'],
  '仙侠':['古典仙侠', '幻想修仙', '现代修仙', '洪荒封神'],
  '都市':['都市生活', '爱情婚姻', '异术超能', '恩怨情仇'],
  '职场':['娱乐明星', '官场沉浮', '商场职场'],
  '历史':['穿越历史', '架空历史', '历史传记'],
  '军事':['军事战争', '战争幻想', '谍战特工', '军旅生涯'],
  '游戏':['游戏生涯', '电子竞技', '虚拟网游', '游戏异界'],
  '竞技':['体育竞技', '篮球运动', '足球运动', '棋牌桌游'],
  '科幻':['星际战争', '时空穿梭', '未来世界', '古武机甲'],
  '灵异':['推理侦探', '恐怖惊悚', '悬疑探险', '灵异奇谈'],
  '同人':['武侠同人', '影视同人', '动漫同人', '游戏同人']
}

var categoryUrls = [];
for (var i = 0; i < 1000; i+=50) {
 for (var majorcat in categories) {
  var minors = categories[majorcat];
  minors.forEach(function(minorcat) {
    booktypes.forEach(function(booktype) {
      categoryUrls.push("http://api.zhuishushenqi.com/book/by-categories?gender=male&major="+majorcat+"&minor="+minorcat+"&type="+booktype+"&start="+i+"&limit=50");
    });
  });
 }
}

// handle A book
var postPerWWord = []
var processBook = function(book) {
  var postCount = book['postCount'];
  var wordCount = book['wordCount'];
  var bookTitle = book['title'];
  var isSerial = book['isSerial'];
  process.stdout.write('processing ' + bookTitle + "                    \r");
  if (isSerial && postCount > 100 && wordCount > 100000) {
    var hasObj = false;
    postPerWWord.forEach(function(bookInfo) {
      if (bookInfo['title'] === bookTitle) {
        hasObj = true;
      }
    });
    if (!hasObj) {
      var bookRatio = postCount * 10000 / wordCount;
      var dict = {title : bookTitle,
                  rate : bookRatio};
      postPerWWord.push(dict);
    }
  }
}


// *****************

var fetchBookUrl = function(url, callback2) {
  request(encodeURI(url), function(error, resp, body) {
    if (!error && resp.statusCode == 200) {
      var jsonResponse = JSON.parse(body);
      processBook(jsonResponse); 
    } 

    setTimeout(function() {
      callback2(null, ' ');
    }, 10);
  });
};

var findBestBook = function() {
  postPerWWord.sort(function(a, b) {
    return a['rate'] - b['rate'];
  });
  if (postPerWWord.length > 88) {
    postPerWWord.splice(0,postPerWWord.length-66);
  }
  console.log(" ")
  console.log(postPerWWord);
}

// handle books, and callback to the 1st level async only after all books finishes retrieving
var booksUrls = [];
var processBooks = function(books, callback1) {
  booksUrls = [];
  books.forEach(function(book) {
    bookID = book['_id'];
    if(bookID) {
      booksUrls.push("http://api.zhuishushenqi.com/book/"+bookID);
    }
  });

  // 2nd level async, and post the call back when all books finishes retrieving
  async.mapLimit(booksUrls, 3, function (url, callback2) {
  	fetchBookUrl(url, callback2);
  }, function (err, result) {
    findBestBook()

    setTimeout(function() {
      callback1(null, ' ');
    }, 100);
  });
}


// ****************************

var fetchCategoryUrl = function(url, callback1) {
  request(encodeURI(url), function(error, resp, body) {
    if (!error && resp.statusCode == 200) {
      var jsonResponse = JSON.parse(body);
      var books = jsonResponse['books'];
      if (books) {
        processBooks(books, callback1); 
      }
    } 
  });
};

// 1st level async fetcher
async.mapLimit(categoryUrls, 1, function (url, callback1) {
	fetchCategoryUrl(url, callback1);
}, function (err, result) {
	console.log('final');
});

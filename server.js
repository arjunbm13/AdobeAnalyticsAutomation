var http = require("http");
var htm;
//from webpage
var tableify = require('  ');
var fs = require('fs');// file system
var obj = '';
var x;
var finalOutput = [];
//validators
const events = [];
//From getNetCal
const observe = [
  'Page.loadEventFired',
  'Page.domContentEventFired',
  'Page.frameStartedLoading',
  'Page.frameAttached',
  'Network.requestWillBeSent',
  'Network.requestServedFromCache',
  'Network.dataReceived',
  'Network.responseReceived',
  'Network.resourceChangedPriority',
  'Network.loadingFinished',
  'Network.loadingFailed',
];
const { promisify } = require('util');
var pageURL1 = '';
const puppeteer = require('puppeteer');
const { harFromMessages } = require('chrome-har');
// list of events for converting to HAR
//For Running Server, Details.
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
var path = require('path');
//for pug
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
//Give permission to CSS files
app.use(express.static(path.join(__dirname, 'public')));
//Validator library
const { check } = require('express-validator')
//Check if URL exists
const urlExists = require("url-exists");
var validPage;
var server = app.listen(8080, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("Server running & listening at %s:%s Port", host, port)
});


//First Form - GET
app.get('/getAdobeCall', function (req, res) {
  //  res.sendFile(path.join(__dirname +'/getURLForm.html'));
  res.render('getURLForm', { caution: 'URL should start with (http/https)' });
});


app.post('/thank', urlencodedParser, async function (req, res) {
  //res.render('/thank');
  pageURL1 = req.body.url;
  console.log(pageURL1);
  if (!pageURL1.includes('http://') && !pageURL1.includes('https://')) {
    pageURL1 = 'http://' + pageURL1;
  }

  urlExists(pageURL1, function (err, exists) {
    if (exists) {
      //res.end('Good URL');
      validPage = 1;
    }
    else {
      var badurl = '';
      badurl += "<body>";
      badurl += "<br/><br/><br/><br/>"
      badurl += "<div align='center'>"
      badurl += "<h2> BAD URL </h2>"
      badurl += "</div>"
      badurl += "</body>";
      //res.send(badurl);
      console.log("Bad URL is:-" + pageURL1);
      res.end(badurl);
    }

  });
  // event types to observe
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  // register events listeners
  const client = await page.target().createCDPSession();
  await client.send('Page.enable');
  await client.send('Network.enable');
  observe.forEach(method => {
    client.on(method, params => {
      events.push({ method, params });
    });
  });

  // perform tests
  await page.goto(pageURL1);
  await browser.close();
  // convert events to HAR file
  const har = harFromMessages(events);
  //fs.write('cdw.har', JSON.stringify(har, undefined, 4), 'w');
  await promisify(fs.writeFile)('networkCalls.har', JSON.stringify(har, undefined, 4));
  console.log('File created successfully')
  obj = await JSON.parse(fs.readFileSync('networkCalls.har', 'utf8'));
  //Loop to get the adobe network call.
  for (i in obj.log.entries) {
    x += obj.log.entries[i];
    if (obj.log.entries[i].request.url.includes('b/ss')) {
      finalOutput = obj.log.entries[i].request.queryString; // Caught the adobe output here
    }
  }
  htm = await tableify(finalOutput);

  //POST THE PROCESSD RESULT
  res.render('postResult', {
    urlVar: req.body.url,
    result: htm
  })
  //res.send(reply);
  console.log(pageURL1);
  //console.log(req.body.url);
});
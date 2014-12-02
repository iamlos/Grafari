/** Browser-lib 
 *  This module essentially encapsules the ZombieJS-Browser.
 *  When requiring this module, a Browser ist automatically launched and logs in into Facebook.
 *  Then requests can be sent to this browser for visiting urls.
 */ 
var fs      = require("fs");
var async   = require("async");
var Zombie  = require("zombie");
var r   = require("redis");
var redis = r.createClient();


var WORKERS = 5

//The browser instance
var worker = []
var workQueue = []

//Exported module functions
exports.init = initModule;
exports.get = cachedReadPage;
exports.shutdown = shutdownModule;

function initModule(callback) {
  //Initialization
  Zombie.localhost('https://www.facebook.com')

  
  //start five browsers
  startBrowser(function(err, browser) {
    if (err)
      return callback(err)
    
    //populate worker-pool 
    worker.push(browser)
    for(var c = 1; c < WORKERS; ++c) 
      worker.push(browser.fork()) //Create an independent browser copy (already logged in)

    callback()
  })
}

function shutdownModule() {
  if (browser)
    browser.close();
}

/** This function creates a browser, logs it in into facebook and then 
 *  returns the browser to the callback after the login has completed
 */
function startBrowser(callback) {
  var browser = Zombie.create();
  
  if (fs.existsSync("./cookies.tmp")) {
    console.log("Loading cookies from file...") //And omitting login
    fs.readFile("./cookies.tmp", function(err, cookies) {
      browser.loadCookies(cookies.toString())
      browser.visit("/", function(e) { //Browser must visit a page
        return callback(e, browser)
      })
    })
  } else { //Default login procedure
    async.series([
      function(cb) {
        browser.visit('/login.php', cb);
      },
      function(cb) {
        //browser.fill('email', 'haw-mi@wegwerfemail.de');
        browser.fill("email", "haw-mi-2@wegwerfemail.de")
        browser.fill('pass', 'geheim123');
        browser.pressButton('login', cb);  
      }], 

      function(err, data) {
        if (err)
          return callback(err);

        //Save cookies and return new browser
        var cookies = browser.saveCookies()
        fs.writeFile("./cookies.tmp", cookies, function() {
          return callback(null, browser); //Return the browser, which is ready to make requests
        })
      }
    )
  }
}

function cachedReadPage(url, callback) {

  redis.get(url,function(err,reply) {
    if (err) 
      return callback(err)
    
    if (reply)
      return callback(null, JSON.parse(reply))

    readPage(url, function(err, result) {
      //Don't enter value if an error occurred
      if(err)
        return callback(err) 
      //Enter 'url' -> 'result' into Redis
      redis.set(url, JSON.stringify(result))
      return callback(null, result)
    })
  })
}

/** Open a Facebook url and then return the page's content by the callback.
 * 
 * internally this adds a job-entry to the workQueue and wakes a an idle worker if available.
 */
function readPage(url, callback) {
  workQueue.push({url:url, callback:callback})

  if (worker.length > 0) { //wake up an idle browser
    var browser = worker.shift()
    console.log("Waking up a worker, " + worker.length + " worker left")
    work(browser)
  }
}

/** Internal function, which issues a browser to work until all jobs are completed
 */
function work(browser) {
  console.log("Checking workQueue: " + JSON.stringify(workQueue))
  if (workQueue.length > 0) {
    var job = workQueue.shift()
    browser.visit(job.url, {duration:"20s"}, function(err, data) {
      if (err)
        process.nextTick(function() { job.callback(err) })
      else {
        //The result must be bound here, referencing browser from inside the function is invalid
        var data = convertPageToJSON(browser)
        process.nextTick(function() { 
          job.callback(null, data) 
        })
      }
      
      //Job done, check for remaining work
      process.nextTick(function() { work(browser) })
    })
  } else {
    worker.push(browser) //All jobs done, set browser to idle
  }
}


function convertPageToJSON(browser) {
  //
  // TODO: differentiate between works at, studies at, lives in, from, etc. (check wiki: Such Regex für Graph Search)
  //

  var people = []
  var peopleDivs = []
  
  // People are returned in two seperate div containers. The first one is loaded statically
  // and sometimes contains only one elment and the second one is loaded dynamically and contains the remaining people
  array_copy(browser.query("#BrowseResultsContainer").childNodes, peopleDivs)
  array_copy(browser.query("#u_0_o_browse_result_below_fold > div").childNodes, peopleDivs)


  peopleDivs.forEach(function(child) {
    var person = {}
    var link = child.querySelector("._zs.fwb > a")
    var img = child.querySelector("._7kf._8o._8s.lfloat._ohe > img")

    person.name = link.textContent
    person.id = extractUserId(link.href)
    person.pictureurl = img.src

    // subtitle and the 4 snippets
    divClasses = ["._pac._dj_",
    "div[data-bt*=snippets] ._ajw:nth-of-type(1) ._52eh",
    "div[data-bt*=snippets] ._ajw:nth-of-type(2) ._52eh",
    "div[data-bt*=snippets] ._ajw:nth-of-type(3) ._52eh",
    "div[data-bt*=snippets] ._ajw:nth-of-type(4) ._52eh"]

    // in case element exists, run it trough regex checks    
    for (var i = 0; i < divClasses.length; i++) {
      if (child.querySelector(divClasses[i]) != null) {
        returnArray = extractInformationFromDiv(child.querySelector(divClasses[i]).textContent);
        if (returnArray.length != 0) {
          for (var j = 0; j < returnArray.length; j++) {
            // this is ugly as fuck. it means every second object because array is [key,value,key,value,...]
            if (j % 2 == 0) {
              person[returnArray[j]] = returnArray[j+1];
            }
          }
        }
      }    
    }

    people.push(person)
  })

  console.log("Parsed " + people.length + " people in total")
  return people
}

function extractInformationFromDiv(rawDivs) {
  // TODO: hier rumbasteln und person objekt bauen, dann in convertPageToJSON mit person Objekt mergen
  // regular expressions, s. wiki

  // TODO: gender regex
  // these are more complicated to implement because of the []
  var gender1 = /[^e]male[^s]/i
  var gender2 = /female[^s]/i
  // TODO: seperate profession, university and work and put it in the right order
  // this is a problem since they contain
  // 2 information bits (profession and employer) in one <div>
  var profession1 = /(.*)\sat.*/i
  var employer2 = /.*\sat\s(.*)/i
  
  regexArray = [
                ['age', /(\d)years\sold/i],
                ['employer',/Works\sat\s(.*)/i],
                ['lives',/Lives\sin\s(.*)/i],
                ['from',/.*From\s(.*)/i],
                ['university',/Goes\sto\s(.*)/i],
                ['university',/Studies\s.*\sat (.*)/i],
                ['university',/Studies\sat (.*)/i],
                ['relationship',/(Single)/i],
                ['relationship',/(In\sa\srelationship).*/i],
                ['relationship',/(In\san\sopen\srelationship).*/i]
              ]

  //  in case there is a ·, split strings first
  // TODO: bug:returnArray gibt sowieso nur den ersten Wert zurück
  divs = []
  if (rawDivs.indexOf("·") != -1) {
    divs = splitStrings(rawDivs)
  } else {
    divs.push(rawDivs)
  }

  //console.log(divs)
  
  // interate through all the regexes and give back an array
  // with the json attribute name and the value
  returnArray = []
  for(var i = 0; i < regexArray.length; i++) {
    for (var j = 0; j < divs.length; j++) {
      //console.log("test: " + regexArray[i][1].test(divs[j]) + "regex: " + regexArray[i][1] + "div: " + divs[j])
      if (regexArray[i][1].test(divs[j])) {
        returnArray.push(regexArray[i][0])
        // exec returns an array->[1] is the desired value
        returnArray.push(regexArray[i][1].exec(divs[j])[1])
      }
    }
  }
  return returnArray;
}

function splitStrings(divLine) {
  // remove all white spaces and split by the middle point
  //return divLine.replace(/\s/g,"").split("·")
  return divLine.split("·")
}

function extractUserId(url) {
  var pattern = /https:\/\/www\.facebook\.com\/(.*)[?].*/i
  return pattern.exec(url)[1];
}


function array_copy(from, to) {
  for(var c = 0; c < from.length; ++c)
    to.push(from[c])
}
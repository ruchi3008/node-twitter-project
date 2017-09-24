const express = require('express');
const path = require('path');
const twitterAPI = require('node-twitter-api');
const bodyParser = require('body-parser');
const twitterClient = require('twitter');

const {mongoose} = require('./db/mongoose');
const queries = require('./queries/queries');
const {consumerKey,consumerSecret,callback} = require('./config/config.js');
const port = process.env.PORT||3000;
const publicPath = path.join(__dirname,'../public');
var app = express();
app.use(express.static(publicPath));
app.set('view engine', 'ejs');


var twitter = new twitterAPI({
     consumerKey: consumerKey,
     consumerSecret: consumerSecret,
     callback: callback
});
var _requestSecret;

app.post("/welcome", function(req, res) {
       twitter.getRequestToken(function(err, requestToken, requestSecret,results) {
           if (err)
               res.status(500).send(err);
           else {
               _requestSecret = requestSecret;
               console.log(results);
               res.redirect("https://api.twitter.com/oauth/authenticate?oauth_token=" + requestToken);
           }
       });
   });

app.get('/details',(req,res) => {
  var requestToken = req.query.oauth_token,
     verifier = req.query.oauth_verifier;
       twitter.getAccessToken(requestToken, _requestSecret, verifier, function(err, accessToken, accessSecret) {
           if (err)
               res.status(500).send(err);
           else
               twitter.verifyCredentials(accessToken, accessSecret, function(err, user) {
                   if (err)
                       res.status(500).send(err);
                   else{
                       var client = new twitterClient({
                          consumer_key: consumerKey,
                          consumer_secret: consumerSecret,
                          access_token_key: accessToken,
                          access_token_secret: accessSecret
                        });

                        var params = {};
                        client.get('statuses/home_timeline', params, function(error, tweets, response) {
                        if (!error) {

                        queries.persisrTweetsInDB(tweets,accessToken);

                        var completeData = new Object();
                        queries.fetchActualTweetsWithURL(accessToken).then((data) =>{
                          completeData.first = data;
                          queries.fetchUserWithMaxURLS(accessToken).then((data) => {
                            completeData.second = data;
                              queries.fetchMostSharedURL(accessToken).then((data) => {
                              completeData.third = data;
                                res.render('details',{completeData});
                              });
                            });

                        }).catch((err)=>{
                           console.log(err);
                           return(200).send(err);
                        });
                       }
                     });
                  }
               });
       });
});

app.listen(port,() => {
  console.log(`App started on ${port}`);
});

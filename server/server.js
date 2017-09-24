const express = require('express');
const path = require('path');
const twitterAPI = require('node-twitter-api');
const bodyParser = require('body-parser');
const twitterClient = require('twitter');

const {mongoose} = require('./db/mongoose');

const port = process.env.PORT||3000;
const publicPath = path.join(__dirname,'../public');
var app = express();
app.use(express.static(publicPath));
//app.use(bodyParser.urlencoded({extended: true}));

var twitter = new twitterAPI({
     consumerKey: '9C2GbYimbhFf0qwruzUD4dNM8',
     consumerSecret: 'RTSHSXB9iT1u2l3VQ9mO0UBgngjSYirniCaPkafwokgAg7Lm4E',
     callback: 'http://localhost:3000/details'
})
var _requestSecret;
// app.post('/welcome',(req,res) => {
//  console.log("Form submitted");
//  res.send('We will allow you to login in sometime!!');
// });
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
                       //res.send(user);
                       var client = new twitterClient({
                          consumer_key: '9C2GbYimbhFf0qwruzUD4dNM8',
                          consumer_secret: 'RTSHSXB9iT1u2l3VQ9mO0UBgngjSYirniCaPkafwokgAg7Lm4E',
                          access_token_key: accessToken,
                          access_token_secret: accessSecret
                        });

                        var params = {};
                        client.get('statuses/home_timeline', params, function(error, tweets, response) {
                        if (!error) {
                          //res.send(tweets);
                          var con = mongoose.connection;
                          var collection = con.collection('tweets');
                          for (var i = 0;i< tweets.length; i++){
                            console.log(tweets[i].text);
                            if(tweets[i].entities.urls&&tweets[i].entities.urls.length!=0){
                              tweets[i].entities.urls.forEach((element) => {
                                element.domain = element.display_url.split('/')[0];
                              });
                            }
                            //collection.insert(tweets[i]);
                          }
                          collection.find({
                            retweeted:false,
                            "entities.urls":{$gt:[]}
                          }).toArray((err,data) => {
                            if(err){
                              res.send(err)
                            }
                            console.log(data.length);
                            //res.send(data);
                          });


                        collection.aggregate([
                           {$group:{"_id":"$user.id_str","count":{$sum:{$size: "$entities.urls" }}}},
                           {$sort:{"count":-1}},
                           {$limit:1}
                         ], (err,result) => {
                           if(err){
                            console.log(err);
                            // res.send(err);
                           }
                           //res.send(result);
                           console.log(result);
                         });

                         collection.aggregate([
                            {$unwind:"$entities.urls"},
                            {$group:{"_id":"$entities.urls.domain","count":{$sum:1}}},
                            {$sort:{"count":-1}},
                            {$limit:1}
                          ], (err,result) => {
                            if(err){
                             console.log(err);
                              res.send(err);
                            }
                            res.send(result);
                            console.log(result);
                          });


                         // collection.aggregate([
                         //     {$group:{"_id":"$user.id_str","count":{$sum:1}}},
                         //     {$sort:{"count":-1}},
                         //     {$limit:1}
                         //   ], (err,result) => {
                         //     if(err){
                         //      console.log(err);
                         //       res.send(err);
                         //     }
                         //     res.send("found it");
                         //     console.log(result);
                         //   });

                        // collection.aggregate([
                        //     {
                        //        $group: {
                        //           _id: "$id_str",
                        //           urls_count:  {$first: {$size: "$entities.urls" }}
                        //        }
                        //     }
                        //   ], (err,result) => {
                        //     if(err){
                        //      console.log(err);
                        //       res.send(err);
                        //     }
                        //     res.send("found it");
                        //     console.log(result);
                        //   });



                        }
                      });


                     }
               });
       });
});

app.listen(port,() => {
  console.log(`App started on ${port}`);
});

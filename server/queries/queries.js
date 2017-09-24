const {mongoose} = require('./../db/mongoose');
var con = mongoose.connection;
var collection = con.collection('tweets');

var persisrTweetsInDB = (tweets,accessToken) =>{
  collection.remove({
    access:accessToken
  });
  for (var i = 0;i< tweets.length; i++){
    console.log(tweets[i].text);
    tweets[i].access = accessToken;
    if(tweets[i].entities.urls&&tweets[i].entities.urls.length!=0){
      tweets[i].entities.urls.forEach((element) => {
        element.domain = element.display_url.split('/')[0];
      });
    }
    collection.insert(tweets[i]);
  }
}

var fetchActualTweetsWithURL = (accessToken) =>{
   return  collection.find({
      retweeted:false,
      access :accessToken,
      "entities.urls":{$gt:[]}
    }).toArray();
  }

var fetchUserWithMaxURLS = (accessToken) =>{
  return collection.aggregate([
     {$match:{'access':accessToken}},
     {$group:{"_id":"$user.screen_name","count":{$sum:{$size: "$entities.urls" }}}},
     {$sort:{"count":-1}},
     {$limit:1}
   ]).toArray();
  }

var fetchMostSharedURL = (accessToken) =>{
    return collection.aggregate([
      {$match:{'access':accessToken}},
      {$unwind:"$entities.urls"},
      {$group:{"_id":"$entities.urls.domain","count":{$sum:1}}},
      {$sort:{"count":-1}},
      {$limit:1}
     ]).toArray();
}


module.exports = {
persisrTweetsInDB,
fetchActualTweetsWithURL,
fetchUserWithMaxURLS,
fetchMostSharedURL
}


// collection.find({
//   retweeted:false,
//   "entities.urls":{$gt:[]}
// }).toArray((err,data) => {
//   if(err){
//     res.send(err)
//   }
//   console.log(data.length);
//   //res.send(data);
// });

// collection.aggregate([
//    {$group:{"_id":"$user.id_str","count":{$sum:{$size: "$entities.urls" }}}},
//    {$sort:{"count":-1}},
//    {$limit:1}
//  ], (err,result) => {
//    if(err){
//     console.log(err);
//     // res.send(err);
//    }
//    //res.send(result);
//    console.log(result);
//  });

//  collection.aggregate([
//     {$unwind:"$entities.urls"},
//     {$group:{"_id":"$entities.urls.domain","count":{$sum:1}}},
//     {$sort:{"count":-1}},
//     {$limit:1}
//   ], (err,result) => {
//     if(err){
//      console.log(err);
//       res.send(err);
//     }
//     res.send(result);
//     console.log(result);
//   });

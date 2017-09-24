var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI||'mongodb://localhost:27017/TwitterApp');
//mongoose.connect('mongodb://ruchi3008:retina@ds149603.mlab.com:49603/ru3008mongo'||'mongodb://localhost:27017/ToDoApp');
module.exports = {
mongoose,
};

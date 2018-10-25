
const mongoose = require('mongoose');

const { Schema } = mongoose;
const userSchema = new Schema({
  mid: {
    type: String,
    required: true,
    unique: true,
  },
  name : {
    type : String,
    required : true,
  },
  profile: {
    type: String,
  },
  language: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('User', userSchema);
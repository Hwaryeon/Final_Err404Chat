
const mongoose = require('mongoose');

const { Schema } = mongoose;
const { Types : { ObjectId }} = Schema;
const chatListSchema = new Schema({
  cUser: {
    type: ObjectId,
    required: true,
    ref : 'User'
  },
  cRoom: {
    type: ObjectId,
    required: true,
    ref : 'Room'
    },
  cContent : {
      type : String,
      required : true,
  },
  cDate: {
    type: Date,
    default : Date.now,
  },
  
});

module.exports = mongoose.model('Chat', chatListSchema);
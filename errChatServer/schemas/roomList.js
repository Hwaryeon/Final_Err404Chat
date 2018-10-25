
const mongoose = require('mongoose');

const { Schema } = mongoose;
const { Types : { ObjectId }} = Schema;
const roomListSchema = new Schema({
  rTitle: {
    type: String,
    required: true,
  },
  rid : {
    type : String
  },
  rUserList : [ new mongoose.Schema({
    userId : {
      type : ObjectId,
      ref : 'User'
    },
    joinDate : {
      type : Date,
      default : Date.now(),
    }
  } ,{ _id: false })]
});

module.exports = mongoose.model('Room', roomListSchema);
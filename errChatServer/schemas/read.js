
const mongoose = require('mongoose');

const { Schema } = mongoose;
const { Types : { ObjectId }} = Schema;
const readSchema = new Schema({
    rRoom: {
      type: ObjectId,
      required: true,
      ref : 'Room'
    },
    rChat: {
      type: ObjectId,
      required: true,
      ref : 'Chat'
    },
    userId : {
      type : ObjectId,
      ref : 'User'
    },
    rStatus: {
      type: String,
      default : 'N'
    },
    
});

module.exports = mongoose.model('Read', readSchema);
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const UserSchema = new Schema({
  name: {
    type: 'string',
    required: true
  },
  email: {
    type: 'string',
    required: true
  },
  role: {
    type: 'string',
    required: true
  },
  password: {
    type: 'string',
    required: true
  },
  avatar: {
    type: 'string'
  },
  status: {
    type: 'string',
    defaultsTo: 'active'
  },
  resetPasswordToken:{
    type:'string',
  },
  resetPasswordExpires:{
    type:'string',
  },
  chips: {
    type: 'number',
    default: 10000000
  }
},{ collection: 'user' });
mongoose.model('user', UserSchema);

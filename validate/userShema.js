const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
        password: {
          type: String,
          required: [true, 'Password is required'],
        },
        email: {
          type: String,
          required: [true, 'Email is required'],
          unique: true,
        },
        subscription: {
          type: String,
          enum: ["starter", "pro", "business"],
          default: "starter"
        },
        token: {
          type: String,
          default: null,
  },
         avatarURL: {
         type: String,
  },
    verify: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    // required: [true, 'Verify token is required'],
  },
},
{timestamps:true});

userSchema.methods.setPassword = async function (password) {
    this.password = await bcrypt.hash(password, 10);
  };
  
  userSchema.methods.isValidPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

const User = mongoose.model('User', userSchema);

module.exports = User;
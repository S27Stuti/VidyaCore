const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['principal', 'teacher', 'student'],
      required: true,
      default: 'student'
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    rollNo: {
      type: String,
      trim: true,
      default: ''
    },
    className: {
      type: String,
      trim: true,
      default: ''
    },
    section: {
      type: String,
      trim: true,
      default: ''
    },
    subject: {
      type: String,
      trim: true,
      default: ''
    },
    avatar: {
      type: String,
      default: ''
    },
    parentContact: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    qualification: {
      type: String,
      default: ''
    },
    designation: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: ''
    },
    profileCompleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Exclude password in toJSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);

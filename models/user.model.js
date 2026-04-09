import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email:{
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    name:{
      type: String,
      required: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    authProvider:{
      type: String,
      enum: ['local', 'google', 'github'],
      default: 'local'
    },
    status:{
      type: String,
      enum: ['active', 'inactive', 'banned'],
      default: 'active'
    },
    lastLoginAt: {
      type: Date
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;
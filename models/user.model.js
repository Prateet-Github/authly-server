import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) return;
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (plainPassword) {
  return await bcrypt.compare(plainPassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);

export default User;
/* eslint-disable global-require */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

if (!process.env.HOST) {
  require('dotenv').config();
}

const { Schema } = mongoose;

const UserSchema = new Schema({
  _id: {
    type: String, index: true, unique: true, required: true,
  },
  username: {
    type: String, index: true, unique: true, required: true,
  },
  email: { type: String, required: true, unique: true },
  password: { type: String, minLength: [8, 'passwords must be 8 characters or longer'], required: true },
  age: { type: Number },
  bio: { type: String },
  type: { type: String, enum: ['private', 'public', 'restricted', 'blocked', 'admin'], required: true },
  profile_img: {
    thumb: { type: String, default: `${process.env.HOST}/default_profile_img.svg` },
    standard: { type: String, default: `${process.env.HOST}/default_profile_img.svg` },
    large: { type: String, default: `${process.env.HOST}/default_profile_img.svg` },
  },
  categories: [{ type: String, ref: 'Category' }],
  metaUser: { type: String, ref: 'MetaUser' },
  following: [{ type: String, ref: 'User' }],
  followers: [{ type: String, ref: 'User' }],
  requests: [{ type: String, ref: 'User' }],
  listenlist: [{ type: String, ref: 'Episode' }],
  subscriptions: [{ type: String, ref: 'Subscription' }],
  notifications: [{ type: Schema.Types.ObjectId, ref: 'Notification' }],
  events: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
  restricted: [{ type: String, ref: 'User' }],
}, { timestamps: { } });

/* eslint-disable prefer-arrow-callback */

UserSchema.pre('save', function generatePasswordHash(next) {
  const user = this;
  const rounds = 5;
  if (user.isModified('password')) {
    bcrypt.genSalt(rounds, function createHash(error, salt) {
      if (error) next(error);
      bcrypt.hash(user.password, salt, function saveHash(err, hash) {
        if (err) next(err);
        user.password = hash;
        next();
      });
    });
  }
});


mongoose.model('User', UserSchema);

export default mongoose.model('User');

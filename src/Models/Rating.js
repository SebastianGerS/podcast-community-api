import mongoose from 'mongoose';

const { Schema } = mongoose;

const RatingSchema = new Schema({
  _id: { type: String, unique: true, required: true },
  episode: { type: String, ref: 'Episode' },
  rating: {
    type: Number, min: 1, max: 5, required: true,
  },
  user: { type: String, ref: 'MetaUser' },
});

mongoose.model('Rating', RatingSchema);

export default mongoose.model('Rating');

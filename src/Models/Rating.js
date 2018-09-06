import mongoose from 'mongoose';


const { Schema } = mongoose;

const RatingSchema = new Schema({
  episode: [{ type: Schema.Types.ObjectId, ref: 'Episode' }],
  rating: {
    type: Number, min: 0, max: 5, required: true,
  },
  user: [{ type: String, ref: 'MetaUser' }],
});

mongoose.model('Rating', RatingSchema);

export default mongoose.model('Rating');

import mongoose from 'mongoose';


const { Schema } = mongoose;

const EpisodeSchema = new Schema({
  _id: { type: String, unique: true, required: true },
  podcast: { type: String, ref: 'Podcast' },
  ratings: [{ type: Schema.Types.ObjectId, ref: 'Rating ' }],
  avrageRating: { type: Number, default: 0 },
});

mongoose.model('Episode', EpisodeSchema);

export default mongoose.model('Episode');

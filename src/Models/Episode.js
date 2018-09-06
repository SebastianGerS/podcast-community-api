import mongoose from 'mongoose';


const { Schema } = mongoose;

const EpisodeSchema = new Schema({
  _id: [{ type: String, unique: true, required: true }],
  podcast: [{ type: String, ref: 'Podcast' }],
  ratings: [{ type: Schema.Types.ObjectId, ref: 'Rating ' }],
});

mongoose.model('Episode', EpisodeSchema);

export default mongoose.model('Episode');

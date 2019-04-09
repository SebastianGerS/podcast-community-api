import mongoose from 'mongoose';


const { Schema } = mongoose;

const PodcastSchema = new Schema({
  _id: { type: String, unique: true, required: true },
  episodes: [{ type: String, ref: 'Episode' }],
  avrageRating: { type: Number, default: 0 },
});

mongoose.model('Podcast', PodcastSchema);

export default mongoose.model('Podcast');

import mongoose from 'mongoose';

const { Schema } = mongoose;

const EpisodeSchema = new Schema({
  from: [{ type: String, ref: 'User' }],
  to: [{ type: String, ref: 'User' }],
  subject: { type: String },
  body: { type: String },
  status: { type: String, enum: ['sent', 'received', 'draft'] },
});

mongoose.model('Episode', EpisodeSchema);

export default mongoose.model('Episode');

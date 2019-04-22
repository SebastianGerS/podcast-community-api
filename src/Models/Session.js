import mongoose from 'mongoose';

const { Schema } = mongoose;

const SessionSchema = new Schema({
  user: { type: String, ref: 'User', required: true },
  listening_to: { type: String, ref: 'Episode' },
  online: { type: Boolean, default: true },
  updated_at: { type: Date, default: new Date() },
});

mongoose.model('Session', SessionSchema);

export default mongoose.model('Session');

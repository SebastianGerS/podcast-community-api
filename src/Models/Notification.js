import mongoose from 'mongoose';

const { Schema } = mongoose;

const NotificationSchema = new Schema({
  user: { type: String, ref: 'User' },
  event: { type: Schema.Types.ObjectId, ref: 'Event' },
  observed: { type: Boolean, default: false },
});

mongoose.model('Notification', NotificationSchema);

export default mongoose.model('Notification');

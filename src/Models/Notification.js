import mongoose from 'mongoose';

const { Schema } = mongoose;

const NotificationSchema = new Schema({
  user: { type: String, ref: 'User' },
  event: { type: Schema.Types.ObjectId, ref: 'Event' },
  observed: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
});

NotificationSchema.post('save', async (doc, next) => {
  await doc.populate({
    path: 'event',
    populate: [
      { path: 'agent.item', select: ['profile_img.thumb', 'username', '_id'] },
      { path: 'target.item', select: ['profile_img.thumb', 'username', '_id'] },
      { path: 'object.item', select: ['_id'] },
    ],
  }).execPopulate();
  return next();
});

NotificationSchema.pre('find', function populate(next) {
  this.populate({
    path: 'event',
    populate: [
      { path: 'agent.item', select: ['profile_img.thumb', 'username', '_id'] },
      { path: 'target.item', select: ['profile_img.thumb', 'username', '_id'] },
      { path: 'object.item', select: ['_id'] },
    ],
  });
  next();
});

NotificationSchema.pre('findOneAndUpdate', function populate(next) {
  this.populate({
    path: 'event',
    populate: [
      { path: 'agent.item', select: ['profile_img.thumb', 'username', '_id'] },
      { path: 'target.item', select: ['profile_img.thumb', 'username', '_id'] },
      { path: 'object.item', select: ['_id'] },
    ],
  });
  next();
});

mongoose.model('Notification', NotificationSchema);

export default mongoose.model('Notification');

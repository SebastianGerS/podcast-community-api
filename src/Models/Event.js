import mongoose from 'mongoose';


const { Schema } = mongoose;

const EventSchema = new Schema({
  type: {
    type: String,
    enum: [
      'unrequest',
      'request',
      'follow',
      'unfollow',
      'subscribe',
      'unsubscribe',
      'confirm',
      'reject',
      'recommend',
      'newEpisode',
      'add',
      'remove',
      'block',
      'unblock',
      'rating',
    ],
    required: true,
  },
  agent: {
    kind: { type: String, enum: ['User', 'Podcast'] },
    item: { type: String, refPath: 'agent.kind' },
  },
  target: {
    kind: { type: String, enum: ['User', 'Podcast', 'Episode'] },
    item: { type: String, refPath: 'target.kind' },
  },
  object: {
    kind: { type: String, enum: ['Podcast', 'Episode', 'Rating'] },
    item: { type: String, refPath: 'object.kind' },
  },
  date: { type: Date, default: Date.now },
});

EventSchema.post('save', async (doc, next) => {
  await doc.populate(
    [
      { path: 'agent.item', select: ['profile_img.thumb', 'username', '_id'] },
      { path: 'target.item', select: ['profile_img.thumb', 'username', '_id'] },
      { path: 'object.item', select: ['rating', '_id'] },
    ],
  ).execPopulate();
  return next();
});

EventSchema.pre('find', function populate(next) {
  this.populate(
    [
      { path: 'agent.item', select: ['profile_img.thumb', 'username', '_id'] },
      { path: 'target.item', select: ['profile_img.thumb', 'username', '_id'] },
      { path: 'object.item', select: ['rating', '_id'] },
    ],
  );
  next();
});

mongoose.model('Event', EventSchema);

export default mongoose.model('Event');

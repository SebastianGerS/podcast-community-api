import mongoose from 'mongoose';


const { Schema } = mongoose;

const EventSchema = new Schema({
  type: {
    type: String,
    enum: ['request', 'follow', 'unfollow', 'subscribe', 'unsubscribe', 'confirm', 'reject', 'recommend', 'episode', 'add', 'remove', 'block', 'unblock'],
    required: true,
  },
  agent: [{
    kind: { type: String, enum: ['User', 'Podcast'] },
    item: { type: String, refPath: 'agent.kind' },
  }],
  target: [{
    kind: { type: String, enum: ['User', 'Podcast', 'Episode'] },
    item: { type: String, refPath: 'target.kind' },
  }],
  object: [{
    kind: { type: String, enum: ['Podcast', 'Episode'] },
    item: { type: String, refPath: 'object.kind' },
  }],
  date: { type: Date, default: Date.now },
});

mongoose.model('Event', EventSchema);

export default mongoose.model('Event');

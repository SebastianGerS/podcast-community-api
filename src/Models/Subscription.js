import mongoose from 'mongoose';

const { Schema } = mongoose;

const SubscriptionSchema = new Schema({
  _id: { type: String, unique: true, required: true },
  updated_at: { type: Date, default: new Date() },
});

mongoose.model('Subscription', SubscriptionSchema);

export default mongoose.model('Subscription');

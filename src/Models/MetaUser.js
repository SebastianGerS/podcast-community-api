import mongoose from 'mongoose';


const { Schema } = mongoose;

const MetaUserSchema = new Schema({
  _id: { type: String, unique: true, required: true },
  user: { type: String, ref: 'User' },
  ratings: [{ type: Schema.Types.ObjectId, ref: 'Rating' }],
});

mongoose.model('MetaUser', MetaUserSchema);

export default mongoose.model('MetaUser');

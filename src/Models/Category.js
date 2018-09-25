import mongoose from 'mongoose';


const { Schema } = mongoose;

const CategorySchema = new Schema({
  _id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  podcasts: [{ type: String, ref: 'Podcast' }],
  user: { type: String, ref: 'User' },

});

mongoose.model('Category', CategorySchema);

export default mongoose.model('Category');

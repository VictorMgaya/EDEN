import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  expertId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  payload: { type: String, required: true }, // encrypted payload
  createdAt: { type: Date, default: Date.now }
});

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
export default Conversation;

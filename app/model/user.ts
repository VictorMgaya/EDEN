import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
    },
    password: {
        type: String,
    },
    image: {
        type: String,
        required: [true, 'Image is required'],
    },
    provider: {
        type: String,
        required: true,
        enum: ['credentials', 'google'],
    },
    bio: {
        type: String,
        default: '',
        maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    // Credit system
    credits: { type: Number, default: 50 }, // Starting credits
    lastCreditReset: { type: Date, default: Date.now },
    subscription: {
        type: { type: String, enum: ['freemium', 'pro', 'enterprise'], default: 'freemium' },
        stripeCustomerId: { type: String },
        stripeSubscriptionId: { type: String },
        currentPeriodEnd: { type: Date },
        cancelAtPeriodEnd: { type: Boolean, default: false }
    }
}, {
    timestamps: true,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;

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
    firstAnalyzedDataCall: { type: Boolean, default: true }, // Track first API call for analyzed data
    // Payment tracking
    lastCreditPurchase: { type: Date },
    lastSubscriptionActivation: { type: Date },
    totalCreditsPurchased: { type: Number, default: 0 },
    subscriptionStatus: { type: String, enum: ['active', 'inactive', 'cancelled'], default: 'inactive' },
    paymentMethod: { type: String, enum: ['paypal', 'stripe', 'none'], default: 'none' },
    subscription: {
        type: { type: String, enum: ['freemium', 'pro', 'enterprise'], default: 'freemium' },
        stripeCustomerId: { type: String },
        stripeSubscriptionId: { type: String },
        paypalSubscriptionId: { type: String },
        currentPeriodEnd: { type: Date },
        cancelAtPeriodEnd: { type: Boolean, default: false }
    },
    // Usage tracking
    usageHistory: [{
        action: { type: String, enum: ['credit', 'debit'], required: true },
        amount: { type: Number, required: true },
        description: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        metadata: {
            type: { type: String },
            reason: { type: String },
            subscription: { type: String }
        }
    }],
    // Expert system fields
    isExpert: { type: Boolean, default: false },
    expertType: { type: String, enum: ['ai', 'person'], default: null },
    expertTitle: { type: String, default: '' },
    expertSpecialty: { type: String, default: '' },
    expertPricePerMessage: { type: Number, default: 0 },
    expertAvailability: { type: Boolean, default: false },
    expertRating: { type: Number, default: 0, min: 0, max: 5 },
    expertTotalConsultations: { type: Number, default: 0 }
}, {
    timestamps: true,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;

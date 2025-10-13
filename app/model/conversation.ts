import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    // Conversation participants
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expertId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Conversation metadata
    expertType: {
        type: String,
        enum: ['ai', 'person'],
        required: true
    },
    conversationType: {
        type: String,
        enum: ['chatgpt_style', 'whatsapp_style'],
        required: true
    },

    // Messages
    messages: [{
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        senderType: {
            type: String,
            enum: ['user', 'expert', 'ai'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        messageType: {
            type: String,
            enum: ['text', 'image', 'file'],
            default: 'text'
        },
        metadata: {
            // For AI conversations - store model info, tokens used, etc.
            model: String,
            tokensUsed: Number,
            creditsCharged: Number,
            // For person conversations - store delivery status, etc.
            deliveryStatus: {
                type: String,
                enum: ['sent', 'delivered', 'read'],
                default: 'sent'
            }
        }
    }],

    // Conversation status
    status: {
        type: String,
        enum: ['active', 'archived', 'completed'],
        default: 'active'
    },

    // Credits and pricing
    totalCreditsSpent: {
        type: Number,
        default: 0
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },

    // For AI conversations - store context and settings
    aiSettings: {
        model: {
            type: String,
            default: 'gemini-flash-lite'
        },
        systemPrompt: String,
        temperature: {
            type: Number,
            default: 0.7
        }
    },

    // For person conversations - store real-time status
    personSettings: {
        isOnline: {
            type: Boolean,
            default: false
        },
        lastSeen: Date,
        typingStatus: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true,
});

// Index for efficient queries
conversationSchema.index({ userId: 1, expertId: 1 });
conversationSchema.index({ userId: 1, lastMessageAt: -1 });
conversationSchema.index({ expertId: 1, status: 1 });

// Update lastMessageAt when new messages are added
conversationSchema.pre('save', function(next) {
    if (this.messages.length > 0) {
        this.lastMessageAt = this.messages[this.messages.length - 1].timestamp;
    }
    next();
});

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
export default Conversation;

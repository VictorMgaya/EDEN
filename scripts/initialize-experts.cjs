const mongoose = require('mongoose');

// Import the models using require (CommonJS style)
const User = require('../app/model/user.ts');
const Conversation = require('../app/model/conversation.ts');

async function initializeExperts() {
    try {
        // Connect to MongoDB using the same pattern as the app
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eden');

        console.log('🔧 Initializing expert system...');

        // Check if experts already exist
        const existingExperts = await User.find({ isExpert: true });
        if (existingExperts.length > 0) {
            console.log('✅ Experts already initialized');
            return;
        }

        // Create AI Expert (Adam)
        const aiExpert = new User({
            name: 'Adam AI',
            email: 'adam.ai@eden.com',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
            provider: 'credentials',
            isExpert: true,
            expertType: 'ai',
            expertTitle: 'Senior Resource Analysis Expert',
            expertSpecialty: 'Soil Science, Climate Analysis, Crop Optimization',
            expertPricePerMessage: 5,
            expertAvailability: true,
            expertRating: 4.8,
            expertTotalConsultations: 0,
            bio: 'Advanced AI expert specializing in agricultural resource analysis, soil science, and sustainable farming practices.'
        });

        // Create Person Expert (Vema)
        const personExpert = new User({
            name: 'Vema The Excellent',
            email: 'Vematheexcellent@gmail.com',
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
            provider: 'credentials',
            isExpert: true,
            expertType: 'person',
            expertTitle: 'Agricultural Consultant & Soil Specialist',
            expertSpecialty: 'Sustainable Farming, Soil Management, Crop Rotation',
            expertPricePerMessage: 8,
            expertAvailability: true,
            expertRating: 4.9,
            expertTotalConsultations: 0,
            bio: 'Experienced agricultural consultant with over 15 years of experience in sustainable farming practices and soil management.'
        });

        // Save experts
        await aiExpert.save();
        await personExpert.save();

        console.log('✅ AI Expert created:', aiExpert.name);
        console.log('✅ Person Expert created:', personExpert.name);

        // Create sample conversation for demonstration
        const sampleConversation = new Conversation({
            userId: new mongoose.Types.ObjectId(), // Placeholder user ID
            expertId: aiExpert._id,
            expertType: 'ai',
            conversationType: 'chatgpt_style',
            messages: [
                {
                    senderId: new mongoose.Types.ObjectId(),
                    senderType: 'user',
                    content: 'Can you help me analyze my soil data?',
                    timestamp: new Date()
                },
                {
                    senderId: aiExpert._id,
                    senderType: 'ai',
                    content: '<p>I\'d be happy to help you analyze your soil data! To provide the most accurate recommendations, I\'ll need to examine the specific characteristics of your soil including pH levels, nutrient content, texture, and organic matter composition.</p><p>Could you share the details from your soil analysis report? I can help you understand what the numbers mean and provide tailored recommendations for crop selection and soil management practices.</p>',
                    timestamp: new Date()
                }
            ],
            status: 'active',
            totalCreditsSpent: 5,
            lastMessageAt: new Date()
        });

        await sampleConversation.save();
        console.log('✅ Sample conversation created');

        console.log('🎉 Expert system initialization completed successfully!');
        console.log(`📊 Created ${existingExperts.length + 2} experts total`);

    } catch (error) {
        console.error('❌ Error initializing experts:', error);
    } finally {
        await mongoose.connection.close();
    }
}

// Run if called directly
if (require.main === module) {
    initializeExperts();
}

module.exports = initializeExperts;

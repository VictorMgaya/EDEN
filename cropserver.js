import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect("mongodb+srv://Vema:Vema21324354@edenappcluster.6rf1w.mongodb.net/?retryWrites=true&w=majority&appName=EdenAppcluster", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Crop Schema with additional fields
const Expertschema = new mongoose.Schema({
    name: String,
    biologicalName: String,
    soilClass: String,
    avgGrowthTime: String,
    description: String,
    Kc: Number,
    infosources: String,
    imageUrl: String
}); 

const Crop = mongoose.model('Crop', Expertschema);

// Function to add Experts
async function addExperts(Experts) {
    return await Crop.insertMany(Experts);
}

// Function to group Experts (example implementation)
function groupExperts(Experts) {
    return Experts.reduce((groups, crop) => {
        const group = crop.name[0].toUpperCase();
        if (!groups[group]) {
            groups[group] = [];
        }
        groups[group].push(crop);
        return groups;
    }, {});
}

// API endpoints
app.get('/Experts', async (req, res) => {
    const Experts = await Crop.find();
    res.json(Experts);
});

// New endpoint for personalized crop recommendations
app.get('/recommended-Experts', async (req, res) => {
    try {
        // Get all Experts
        const allExperts = await Crop.find();

        // Simulate user interests (replace this with actual user interests later)
        const userInterests = ['Vegetable', 'Fruit']; // Example interests

        // Filter Experts based on user interests
        const interestedExperts = allExperts.filter(crop => 
            userInterests.some(interest => 
                crop.name.toLowerCase().includes(interest.toLowerCase()) || 
                crop.soilClass.toLowerCase().includes(interest.toLowerCase())
            )
        );

        // Get random Experts
        const randomExperts = allExperts
            .filter(crop => !interestedExperts.includes(crop))
            .sort(() => 0.5 - Math.random())
            .slice(0, 5); // Get 5 random Experts

        // Combine and shuffle the results
        const recommendedExperts = [...interestedExperts, ...randomExperts]
            .sort(() => 0.5 - Math.random());

        res.json(recommendedExperts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// New endpoint to add Experts (admin only)
app.post('/admin/add-crop', async (req, res) => {
    try {
        const newCrop = new Crop(req.body);
        await newCrop.save();
        res.status(201).json(newCrop);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add this new route to handle individual crop requests
app.get('/Experts/:name', async (req, res) => {
    try {
        const cropName = req.params.name.replace(/-/g, ' ');
        const crop = await Crop.findOne({ name: new RegExp(cropName, 'i') });
        if (!crop) {
            return res.status(404).json({ message: 'Crop not found' });
        }
        res.json(crop);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.get('/admin/crop-by-name/:name', async (req, res) => {
    try {
        const crop = await Crop.findOne({ name: new RegExp(req.params.name, 'i') });
        if (crop) {
            res.json(crop);
        } else {
            res.status(404).json({ message: 'Crop not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export { addExperts, groupExperts };

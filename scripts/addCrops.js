const { MongoClient } = require('mongodb');

const uri = 'your_mongodb_connection_string';
const client = new MongoClient(uri);

const crops = [
    { name: 'Wheat', group: 'Cereal' },
    { name: 'Rice', group: 'Cereal' },
    { name: 'Carrot', group: 'Vegetable' },
    { name: 'Tomato', group: 'Fruit' }
];

async function addCrops() {
    try {
        await client.connect();
        const database = client.db('your_database_name');
        const collection = database.collection('crops');
        const result = await collection.insertMany(crops);
        console.log(`${result.insertedCount} crops added.`);
    } finally {
        await client.close();
    }
}

addCrops().catch(console.error);
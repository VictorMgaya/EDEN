import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI; // Add your MongoDB connection string to .env.local
let client;

export async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
}

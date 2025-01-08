import { connectToDatabase } from "../lib/mongodb";

export default async function handler(req, res) {
    const client = await connectToDatabase();
  const { db } = client.db("test");
  const collection= db.collection("users");
   
  const data = await collection.find({}).limit(10).toArray();
  res.status(200).json({ data });
};
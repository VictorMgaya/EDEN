import { connectToDatabase } from "../lib/mongodb";
import bcrypt from "bcrypt";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  const client = await connectToDatabase();
  const db = client.db("test");
  const collection = db.collection("users");

  const existingUser = await collection.findOne({ email });
  if (existingUser) return res.status(400).json({ error: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);

  await collection.insertOne({ email, password: hashedPassword });

  res.status(201).json({ message: "Registration successful" });
}

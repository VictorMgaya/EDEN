import express from "express";

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect("mongodb+srv://Vema:Vema21324354@edenappcluster.6rf1w.mongodb.net/?retryWrites=true&w=majority&appName=EdenAppcluster", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

// User schema with username and profilePicture fields
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  profilePicture: { type: String, default: "" }, // URL or file path to the profile picture
});

const User = mongoose.model("User", userSchema);

// Middleware to verify the JWT token
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const verified = jwt.verify(token, "SECRET_KEY");
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token" });
  }
};

// Registration endpoint
app.post("/register", async (req, res) => {
  const { email, password, username, profilePicture } = req.body;
  
  // Hash the password before saving it
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = new User({ email, password: hashedPassword, username, profilePicture });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(400).json({ error: "Email already exists" });
  }
});

// Login endpoint
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: "Invalid password" });

    // Create JWT token
    const token = jwt.sign({ id: user._id }, "SECRET_KEY", { expiresIn: "1h" });

    // Send back the token, username, and profile picture
    res.status(200).json({
      token,
      username: user.username,
      profilePicture: user.profilePicture,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Profile endpoint to fetch user data (requires token authentication)
app.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({
      username: user.username,
      profilePicture: user.profilePicture,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(3001, () => console.log("Server running on http://localhost:3001"));

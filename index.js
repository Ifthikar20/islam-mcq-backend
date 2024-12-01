require("dotenv").config(); // Load environment variables from .env
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = Number(process.env.PORT) || 3001; // Default port 3001 if PORT is not set in .env

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB Connection
const mongoURI = process.env.MONGO_URI; // MongoDB URI from .env
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

// Schema and Model for Quiz Questions
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  answer: { type: String, required: true },
  hint: { type: String },
  category: { type: String, enum: ["se-bh", "se-ah"], required: true }, // Categories: se-bh, se-ah
  reference: { type: String, required: true }, // Reference field
  quizLevel: { type: String, enum: ["l1", "l2", "l3"], required: true }, // l1: Easy, l2: Intermediate, l3: Hard
});

const Question = mongoose.model("Question", questionSchema);

// Routes

// Route: Add New Questions (Single or Bulk)
app.post("/api/questions", async (req, res) => {
  try {
    const questions = req.body;

    // Validate input
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "Request body must be a non-empty array of questions." });
    }

    // Validate each question in the array
    for (const question of questions) {
      const { question: q, options, answer, category, reference, quizLevel } = question;
      if (!q || !options || !answer || !category || !reference || !quizLevel) {
        return res.status(400).json({
          error: "Each question must include question, options, answer, category, reference, and quizLevel fields.",
        });
      }
      if (!["l1", "l2", "l3"].includes(quizLevel)) {
        return res.status(400).json({ error: "Invalid quizLevel. Must be 'l1', 'l2', or 'l3'." });
      }
    }

    // Insert questions into the database
    const insertedQuestions = await Question.insertMany(questions);
    res.status(201).json({
      message: "Questions inserted successfully.",
      data: insertedQuestions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route: Get Questions by Category
app.get("/api/questions/:category", async (req, res) => {
  try {
    const { category } = req.params;

    // Validate category
    if (!["se-bh", "se-ah"].includes(category)) {
      return res.status(400).json({ error: "Invalid category." });
    }

    // Fetch questions including the new quizLevel field
    const questions = await Question.find({ category }).select(
      "_id question options answer hint category reference quizLevel"
    );
    res.status(200).json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route: Default Route for Health Check
app.get("/", (req, res) => {
  res.send("Quiz Backend API is running!");
});

// Start the Server
app.listen(port, "0.0.0.0",() => {
  console.log(`Server running on http://localhost:${port}`);
});
//Just some comments here

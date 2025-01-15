const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = 3000;

// API Key
const apikeynyah = "AIzaSyCfpuve4rPxIrorTgsAd3oYQY9izKQwVSg";
const genAI = new GoogleGenerativeAI(apikeynyah);

// Middleware
app.use(bodyParser.json());

// Set static file directory to root (for index.html and other assets)
app.use(express.static(path.join(__dirname)));

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/chat", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required!" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });
    const result = await model.generateContent(text);
    res.json({ reply: result.response.text() });
  } catch (error) {
    console.error("Error generating response:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

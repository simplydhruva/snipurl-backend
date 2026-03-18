import Url from "./models/url.js";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { nanoid } from "nanoid";
import dotenv from "dotenv";
dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());

// 🔗 MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));


// 🔥 Create Short URL
app.post("/shorten", async (req, res) => {
  const { originalUrl, customAlias } = req.body;

  try {
    const shortId = customAlias || nanoid(6);

    const existing = await Url.findOne({ shortId });
    if (existing) {
      return res.status(400).json({ error: "Alias already taken" });
    }

    const newUrl = new Url({
      originalUrl,
      shortId,
    });

    await newUrl.save();

    res.json({
      shortUrl: `https://snipurl-backend.onrender.com/${shortId}`,
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


// 🔁 Redirect Route
app.get("/:shortId", async (req, res) => {
  const { shortId } = req.params;

  const url = await Url.findOne({ shortId });

  if (!url) {
    return res.status(404).send("Not found");
  }

  url.clicks++;
  await url.save();

  res.redirect(url.originalUrl);
});


// 🚀 Start Server
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

// 📊 Get URL stats
app.get("/stats/:shortId", async (req, res) => {
  try {
    const url = await Url.findOne({ shortId: req.params.shortId });

    if (!url) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json({
      originalUrl: url.originalUrl,
      shortId: url.shortId,
      clicks: url.clicks,
      createdAt: url.createdAt,
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
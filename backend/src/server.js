import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import ticketRoutes from "./routes/tickets.js";

const app = express();
const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);

async function startServer() {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is required.");
  }

  await mongoose.connect(mongoUri);
  app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start backend server.", error.message);
  process.exit(1);
});
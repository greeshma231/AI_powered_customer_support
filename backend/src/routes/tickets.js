import express from "express";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import Ticket from "../models/Ticket.js";

dotenv.config();

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.get("/", async (_request, response) => {
  try {
    const tickets = await Ticket.find({}).sort({ createdAt: -1 });

    return response.json({
      tickets: tickets.map((ticket) => ({
        id: ticket._id,
        name: ticket.name,
        email: ticket.email,
        issueDescription: ticket.issueDescription,
        attachmentName: ticket.attachmentName,
        attachmentDataUrl: ticket.attachmentDataUrl,
        createdAt: ticket.createdAt,
      })),
    });
  } catch (error) {
    return response.status(500).json({ message: "Unable to fetch tickets." });
  }
});

router.post("/", async (request, response) => {
  try {
    const { name, email, issueDescription, attachmentName = "", attachmentDataUrl = "" } = request.body;

    if (!name || !email || !issueDescription) {
      return response.status(400).json({ message: "Name, email, and issue description are required." });
    }

    let uploadedAttachmentUrl = "";

    if (attachmentDataUrl) {
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        return response.status(500).json({ message: "Cloudinary credentials are missing on the server." });
      }

      try {
        const uploadResult = await cloudinary.uploader.upload(attachmentDataUrl, {
          folder: "ai-customer-support/tickets",
          resource_type: "image",
        });

        uploadedAttachmentUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return response.status(500).json({ message: `Cloudinary upload failed: ${uploadError.message}` });
      }
    }

    const ticket = await Ticket.create({
      name,
      email,
      issueDescription,
      attachmentName,
      attachmentDataUrl: uploadedAttachmentUrl,
    });

    return response.status(201).json({
      ticket: {
        id: ticket._id,
        name: ticket.name,
        email: ticket.email,
        issueDescription: ticket.issueDescription,
        attachmentName: ticket.attachmentName,
        createdAt: ticket.createdAt,
      },
    });
  } catch (error) {
    console.error("Ticket creation error:", error.message);
    return response.status(500).json({ message: "Unable to create ticket." });
  }
});

export default router;
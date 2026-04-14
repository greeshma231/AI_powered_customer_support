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
        issueDescription: ticket.issue,
        attachmentName: ticket.attachmentName,
        attachmentDataUrl: ticket.imageUrl,
        category: ticket.category,
        priority: ticket.priority,
        summary: ticket.summary,
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

    let aiResult = {
      category: "other",
      priority: "low",
      summary: "Fallback due to AI error",
    };

    const normalizeCategory = (value) => {
      const allowed = ["bug", "payment", "feature request", "other"];
      const normalized = String(value || "").trim().toLowerCase();
      return allowed.includes(normalized) ? normalized : "other";
    };

    const normalizePriority = (value) => {
      const allowed = ["low", "medium", "high"];
      const normalized = String(value || "").trim().toLowerCase();
      return allowed.includes(normalized) ? normalized : "low";
    };

    const parseAiJson = (text) => {
      if (!text) {
        return null;
      }

      const cleaned = String(text).replace(/```json|```/g, "").trim();

      try {
        return JSON.parse(cleaned);
      } catch (_error) {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          return null;
        }

        try {
          return JSON.parse(jsonMatch[0]);
        } catch (_innerError) {
          return null;
        }
      }
    };

    if (process.env.OPENROUTER_API_KEY) {
      try {
        const openRouterPrompt = `Analyze this customer support issue.

Issue: ${issueDescription}

Return ONLY JSON:
{
category: string (bug / payment / feature request / other),
priority: string (low / medium / high),
summary: string
}`;

        const candidateModels = [
          process.env.OPENROUTER_MODEL,
          "openai/gpt-oss-20b:free",
          "qwen/qwen3-coder:free",
          "google/gemma-3-12b-it:free",
        ].filter(Boolean);

        for (const model of candidateModels) {
          const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "http://localhost:5173",
              "X-Title": "AI Customer Support",
            },
            body: JSON.stringify({
              model,
              temperature: 0,
              max_tokens: 180,
              messages: [{ role: "user", content: openRouterPrompt }],
            }),
          });

          const openRouterData = await openRouterResponse.json();

          if (!openRouterResponse.ok) {
            console.error(`OpenRouter API error for ${model}:`, openRouterData?.error || openRouterData);
            continue;
          }

          const aiText = openRouterData.choices?.[0]?.message?.content || "";
          const parsedResult = parseAiJson(aiText);

          if (!parsedResult) {
            console.error(`OpenRouter returned non-JSON content for ${model}.`);
            continue;
          }

          aiResult = {
            category: normalizeCategory(parsedResult.category),
            priority: normalizePriority(parsedResult.priority),
            summary: String(parsedResult.summary || "").trim() || "Fallback due to AI error",
          };

          break;
        }
      } catch (aiError) {
        console.error("OpenRouter processing error:", aiError.message);
      }
    }

    const ticket = await Ticket.create({
      name,
      email,
      issue: issueDescription,
      attachmentName,
      imageUrl: uploadedAttachmentUrl,
      category: aiResult.category,
      priority: aiResult.priority,
      summary: aiResult.summary,
    });

    return response.status(201).json({
      ticket: {
        id: ticket._id,
        name: ticket.name,
        email: ticket.email,
        issueDescription: ticket.issue,
        attachmentName: ticket.attachmentName,
        createdAt: ticket.createdAt,
      },
    });
  } catch (error) {
    console.error("Ticket creation error:", error.message);
    return response.status(500).json({ message: error.message || "Unable to create ticket." });
  }
});

export default router;
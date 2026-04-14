import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    issueDescription: {
      type: String,
      required: true,
      trim: true,
    },
    attachmentName: {
      type: String,
      default: "",
    },
    attachmentDataUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
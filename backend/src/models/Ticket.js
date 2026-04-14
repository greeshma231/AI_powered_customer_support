import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  issue: {
    type: String,
  },
  imageUrl: {
    type: String,
  },
  category: {
    type: String,
    default: "pending",
  },
  priority: {
    type: String,
    default: "pending",
  },
  summary: {
    type: String,
    default: "",
  },
});

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
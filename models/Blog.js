const mongoose = require("mongoose")
const blogSchema = new mongoose.Schema(
  {
    title: {type: String, required: true, trim: true },
    body: {type: String, required: true, trim: true },
    author: { type: String, default: "anonymous", trim: true}
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", blogSchema);
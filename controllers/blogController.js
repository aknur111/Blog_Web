const mongoose = require("mongoose");
const Blog = require("../models/Blog");

exports.createBlog = async (req, res) => {
  try {
    const { title, body, author } = req.body;
    if (!title || !body) return res.status(400).json({ message: "Title and body are required." });

    const blog = await Blog.create({ title, body, author });
    return res.status(201).json(blog);
  } catch (err) {
    return res.status(500).json({ message: "Database error", error: err.message });
  }
};

exports.getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    return res.json(blogs);
  } catch (err) {
    return res.status(500).json({ message: "Database error", error: err.message });
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid blog ID." });

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: "Blog not found." });

    return res.json(blog);
  } catch (err) {
    return res.status(500).json({ message: "Database error", error: err.message });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, author } = req.body;

    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid blog ID." });
    if (!title || !body) return res.status(400).json({ message: "Title and body are required." });

    const updated = await Blog.findByIdAndUpdate(
      id,
      { title, body, author },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Blog not found." });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: "Database error", error: err.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid blog ID." });

    const deleted = await Blog.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Blog not found." });

    return res.json({ message: "Blog deleted successfully." });
  } catch (err) {
    return res.status(500).json({ message: "Database error", error: err.message });
  }
};

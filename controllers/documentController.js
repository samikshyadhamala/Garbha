//  documentcontrolle.js

const Document = require("../models/Document");
const path = require("path");
const fs = require("fs");

// Helper to build file URLs
const buildFileUrl = (req, doc) => {
  const protocol = req.protocol;
  const host = req.get("host");
  return `${protocol}://${host}/api/documents/download/${doc._id}`;
};

// Upload document
exports.uploadDocument = async (req, res) => {
  try {
    const file = req.file;
    console.log("Uploaded file:", file);
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    await Document.create({
      user: req.user._id,
      originalName: file.originalname,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
    });

    const docs = await Document.find({ user: req.user._id });
    const docsWithUrl = docs.map(doc => ({
      _id: doc._id,
      originalName: doc.originalName,
      uploadedAt: doc.uploadedAt,
      downloadUrl: buildFileUrl(req, doc),
    }));

    res.json({ message: "File uploaded successfully", documents: docsWithUrl });
  } catch (err) {
    console.error("Error in uploadDocument:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get all documents
exports.getDocuments = async (req, res) => {
  try {
    const docs = await Document.find({ user: req.user._id });
    const docsWithUrl = docs.map(doc => ({
      _id: doc._id,
      originalName: doc.originalName,
      uploadedAt: doc.uploadedAt,
      downloadUrl: buildFileUrl(req, doc),
    }));

    res.json(docsWithUrl);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Download a document (forces download)
exports.downloadDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    if (doc.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    const filePath = path.join(__dirname, "../uploads", doc.filename);
    res.download(filePath, doc.originalName); // forces download
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a document
exports.deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    if (doc.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    const filePath = path.join(__dirname, "../uploads", doc.filename);
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });

    await doc.deleteOne();

    const docs = await Document.find({ user: req.user._id });
    const docsWithUrl = docs.map(d => ({
      _id: d._id,
      originalName: d.originalName,
      uploadedAt: d.uploadedAt,
      downloadUrl: buildFileUrl(req, d),
    }));

    res.json({ message: "Document deleted successfully", documents: docsWithUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// View document (open in browser if possible)
exports.viewDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    if (doc.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    const filePath = path.join(__dirname, "../uploads", doc.filename);
    const ext = path.extname(doc.filename).toLowerCase();

    // Set proper content type
    if (ext === ".pdf") res.contentType("application/pdf");
    else if (ext === ".doc") res.contentType("application/msword");
    else if (ext === ".docx")
      res.contentType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    else if ([".jpg", ".jpeg"].includes(ext)) res.contentType("image/jpeg");
    else if (ext === ".png") res.contentType("image/png");
    else if (ext === ".gif") res.contentType("image/gif");
    else res.contentType("application/octet-stream");

    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAllDocuments = async (req, res) => {
  try {
    const docs = await Document.find({ user: req.user._id });

    if (docs.length === 0) {
      return res.json({ message: "No documents to delete." });
    }

    // Delete all files from the uploads folder
    docs.forEach(doc => {
      const filePath = path.join(__dirname, "../uploads", doc.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    });

    // Remove all documents from the DB for the user
    await Document.deleteMany({ user: req.user._id });

    res.json({ message: "All documents deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const { upload, processUploadedFiles } = require('../middleware/uploadMiddleware');

// All routes require authentication
router.use(protect);

// Send a message to the chatbot (with optional file attachments)
router.post('/message', 
  upload.array('files', 5), // Accept up to 5 files with field name 'files'
  processUploadedFiles,
  chatController.sendMessage
);

// Get conversation history
router.get('/history', chatController.getConversationHistory);

// Start a new conversation
router.post('/new', chatController.startNewConversation);

// Update conversation title
router.patch('/:conversationId/title', chatController.updateConversationTitle);

// Delete a conversation
router.delete('/:conversationId', chatController.deleteConversation);

module.exports = router;
const Groq = require("groq-sdk");
const UserProfile = require("../models/userProfile");
const Conversation = require("../models/chatbotModel");
const UserPregnancyProfile = require("../models/userPregnancyProfile");
const WeightTracking = require("../models/weightModel");
const { processAttachments } = require("../utils/fileProcessor");

// Lazy initialize Groq client
let groqInstance = null;

function getGroqClient() {
  if (!groqInstance) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set in environment variables');
    }
    groqInstance = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }
  return groqInstance;
}

// Helper function to build context prompt
const buildContextPrompt = async (userId) => {
  const userProfile = await UserProfile.findOne({ user: userId });
  const pregnancyProfile = await UserPregnancyProfile.findOne({ user: userId });
  
  let contextPrompt = "You are a helpful pregnancy care assistant. ";
  
  if (userProfile) {
    contextPrompt += `\n\nUser Information:`;
    contextPrompt += `\n- Name: ${userProfile.firstName} ${userProfile.lastName}`;
    contextPrompt += `\n- Age: ${userProfile.age}`;
  }
  
  if (pregnancyProfile) {
    contextPrompt += `\n\nPregnancy Details:`;
    contextPrompt += `\n- Current pregnancy week: ${pregnancyProfile.weeksPregnant || 'Not specified'}`;
    contextPrompt += `\n- Due date: ${pregnancyProfile.dueDate ? pregnancyProfile.dueDate.toLocaleDateString() : 'Not specified'}`;
    contextPrompt += `\n- Blood type: ${pregnancyProfile.bloodType}`;
    contextPrompt += `\n- First pregnancy: ${pregnancyProfile.firstPregnancy ? 'Yes' : 'No'}`;
    
    if (pregnancyProfile.previousPregnancies > 0) {
      contextPrompt += `\n- Previous pregnancies: ${pregnancyProfile.previousPregnancies}`;
    }
    
    if (pregnancyProfile.previousComplications) {
      contextPrompt += `\n- Previous complications: Yes`;
    }
    
    if (pregnancyProfile.preExistingConditions && pregnancyProfile.preExistingConditions.length > 0) {
      contextPrompt += `\n- Pre-existing conditions: ${pregnancyProfile.preExistingConditions.join(", ")}`;
    }
    
    if (pregnancyProfile.allergies && pregnancyProfile.allergies.length > 0) {
      contextPrompt += `\n- Allergies: ${pregnancyProfile.allergies.join(", ")}`;
    }
    
    if (pregnancyProfile.medications && pregnancyProfile.medications.length > 0) {
      contextPrompt += `\n- Current medications: ${pregnancyProfile.medications.join(", ")}`;
    }
    
    if (pregnancyProfile.lifestyle) {
      if (pregnancyProfile.lifestyle.smoke) {
        contextPrompt += `\n- Smoking: Yes (advise cessation)`;
      }
      if (pregnancyProfile.lifestyle.alcohol) {
        contextPrompt += `\n- Alcohol consumption: Yes (advise cessation)`;
      }
      if (pregnancyProfile.lifestyle.familyHistoryPregnancyComplications) {
        contextPrompt += `\n- Family history of pregnancy complications: Yes`;
      }
    }
    
    if (userProfile) {
      const latestWeight = await WeightTracking.findOne({ user: userProfile._id }).sort({ date: -1 });
      
      if (latestWeight) {
        const weightGain = latestWeight.weight - (pregnancyProfile.weightBeforePregnancy || latestWeight.weight);
        contextPrompt += `\n- Current weight: ${latestWeight.weight} kg`;
        
        if (pregnancyProfile.weightBeforePregnancy) {
          contextPrompt += ` (${weightGain > 0 ? '+' : ''}${weightGain.toFixed(1)} kg from pre-pregnancy weight of ${pregnancyProfile.weightBeforePregnancy} kg)`;
        }
        
        contextPrompt += `\n- Weight last recorded: ${latestWeight.date.toLocaleDateString()}`;
      } else if (pregnancyProfile.weightBeforePregnancy) {
        contextPrompt += `\n- Pre-pregnancy weight: ${pregnancyProfile.weightBeforePregnancy} kg`;
      }
    }
    
    if (pregnancyProfile.height) {
      contextPrompt += `\n- Height: ${pregnancyProfile.height} cm`;
    }
  }
  
  contextPrompt += `\n\nProvide personalized, empathetic advice considering the user's specific situation. Always remind users to consult with their healthcare provider for medical concerns. Be supportive and encouraging.`;
  
  return contextPrompt;
};

// Helper function to format conversation history for Groq
const formatHistoryForGroq = (messages, systemPrompt) => {
  const formattedMessages = [
    {
      role: "system",
      content: systemPrompt
    }
  ];
  
  messages.forEach(msg => {
    if (msg.role !== 'system') {
      formattedMessages.push({
        role: msg.role,
        content: msg.content
      });
    }
  });
  
  return formattedMessages;
};

exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;
    const attachments = req.attachmentData || [];

    console.log('📨 Incoming message from user:', userId);
    console.log('📎 Number of attachments:', attachments.length);

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Step 1: Process attachments (PDFs, images, text files)
    let processedAttachments = [];
    let extractedContent = '';

    if (attachments.length > 0) {
      console.log('🔄 Processing attachments...');
      processedAttachments = await processAttachments(attachments);

      // Loop through results to build extracted content string
      processedAttachments.forEach((result, index) => {
        if (result.success) {
          // PDF or text file
          if (result.text) {
            extractedContent += `[Document ${index + 1}: ${result.fileName}]\n${result.text}\n\n`;
          }
          // Image OCR
          if (result.ocr && result.ocr.text) {
            extractedContent += `[Image ${index + 1}: ${result.fileName} - Extracted Text]\n${result.ocr.text}\n\n`;
          }
        } else {
          // Capture error for this attachment
          extractedContent += `[Attachment ${index + 1}: ${result.fileName} - Failed to extract content]\nError: ${result.error}\n\n`;
        }
      });

      console.log('✅ Attachments processed:', processedAttachments);
      console.log('📄 Extracted content preview:', extractedContent.substring(0, 500)); // show first 500 chars
    }

    // Step 2: Get or create conversation
    let conversation = await Conversation.getOrCreateConversation(userId);

    // Step 3: Update user context if stale
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (!conversation.userContext.lastUpdated || conversation.userContext.lastUpdated < oneHourAgo) {
      await conversation.updateUserContext();
    }

    // Step 4: Save user message with attachments
    await conversation.addMessage('user', message, attachments);

    // Step 5: Build system prompt with user context
    const contextPrompt = await buildContextPrompt(userId);

    let systemPrompt = contextPrompt;
    if (processedAttachments.length > 0) {
      systemPrompt += `\n\nNote: The user has sent attached documents/images. Use the extracted text from these attachments when providing your advice or response.`;
    }

    // Step 6: Get conversation history for Groq
    const recentHistory = conversation.getRecentHistory(20);
    const messagesForGroq = formatHistoryForGroq(recentHistory, systemPrompt);

    // Step 7: Combine user message with extracted content
    let fullMessage = message;
    if (extractedContent) {
      fullMessage += `\n\n--- Attached Documents/Images Content ---\n${extractedContent}`;
    }

    // Push current message to Groq
    messagesForGroq.push({
      role: "user",
      content: fullMessage
    });

    console.log('🤖 Sending message to Groq...');
    console.log('📨 Full message preview:', fullMessage.substring(0, 500));

    // Step 8: Call Groq API
    const groq = getGroqClient();
    const chatCompletion = await groq.chat.completions.create({
      messages: messagesForGroq,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1500,
      top_p: 1,
      stream: false
    });

    console.log('✅ Groq API response received');

    const response = chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    // Step 9: Save assistant response
    await conversation.addMessage('assistant', response);

    // Step 10: Return response
    res.json({
      success: true,
      message: response,
      conversationId: conversation._id,
      userContext: conversation.userContext,
      processedAttachments: processedAttachments.length
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({
      error: 'Failed to process message',
      details: error.message
    });
  }
};


// Get conversation history
exports.getConversationHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId, limit = 50 } = req.query;
    
    let query = { user: userId };
    if (conversationId) {
      query._id = conversationId;
    }
    
    const conversations = await Conversation.find(query)
      .sort({ lastMessageAt: -1 })
      .limit(conversationId ? 1 : 10);
    
    if (conversationId && conversations.length > 0) {
      const messages = conversations[0].messages.slice(-limit);
      res.json({
        success: true,
        conversationId: conversations[0]._id,
        messages,
        userContext: conversations[0].userContext
      });
    } else {
      res.json({
        success: true,
        conversations: conversations.map(conv => ({
          id: conv._id,
          title: conv.title,
          lastMessage: conv.messages[conv.messages.length - 1],
          lastMessageAt: conv.lastMessageAt,
          messageCount: conv.messages.length
        }))
      });
    }
    
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversation history' });
  }
};

// Start new conversation
exports.startNewConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await Conversation.updateMany(
      { user: userId, isActive: true },
      { isActive: false }
    );
    
    const conversation = await Conversation.create({ user: userId });
    await conversation.updateUserContext();
    
    res.json({
      success: true,
      conversationId: conversation._id,
      message: 'New conversation started'
    });
    
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({ error: 'Failed to start new conversation' });
  }
};

// Delete conversation
exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    
    await Conversation.findOneAndDelete({
      _id: conversationId,
      user: userId
    });
    
    res.json({
      success: true,
      message: 'Conversation deleted'
    });
    
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
};

// Update conversation title
exports.updateConversationTitle = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { title } = req.body;
    
    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, user: userId },
      { title },
      { new: true }
    );
    
    res.json({
      success: true,
      conversation
    });
    
  } catch (error) {
    console.error('Update title error:', error);
    res.status(500).json({ error: 'Failed to update conversation title' });
  }
};
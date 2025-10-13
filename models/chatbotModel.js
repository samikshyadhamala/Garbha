const mongoose = require("mongoose");
const UserPregnancyProfile = require("./userPregnancyProfile");
const WeightModel = require("./weightModel");

// Schema for individual messages
const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant", "system"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  // For handling attachments (images/documents)
  attachments: [
    {
      type: {
        type: String,
        enum: ["image", "document", "pdf"],
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      fileName: String,
      fileSize: Number,
      mimeType: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  timestamp: {
    type: Date,
    default: Date.now,
  },
  // Token usage tracking (optional but useful)
  tokenCount: {
    input: Number,
    output: Number,
  },
});

// Main conversation schema
const conversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "New Conversation",
    },
    messages: [messageSchema],

    // Context from user profiles (cached for quick access)
    userContext: {
      pregnancyWeek: Number,
      dueDate: Date,
      bloodType: String,
      conditions: [String],
      allergies: [String],
      currentWeight: Number,
      lastUpdated: Date,
    },

    // Conversation metadata
    isActive: {
      type: Boolean,
      default: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },

    // For categorizing conversations
    tags: [String],
    category: {
      type: String,
      enum: [
        "general",
        "medical",
        "nutrition",
        "exercise",
        "mental_health",
        "symptoms",
      ],
      default: "general",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
conversationSchema.index({ user: 1, lastMessageAt: -1 });
conversationSchema.index({ user: 1, isActive: 1 });

// Method to add a message
conversationSchema.methods.addMessage = function (role, content, attachments = []) {
  this.messages.push({
    role,
    content,
    attachments,
    timestamp: new Date(),
  });
  this.lastMessageAt = new Date();
  return this.save();
};

// Method to update user context from profiles
conversationSchema.methods.updateUserContext = async function () {
  try {
    const pregnancyProfile = await UserPregnancyProfile.findOne({ user: this.user });
    const latestWeight = await WeightModel.findOne({ user: this.user }).sort({ date: -1 });

    if (pregnancyProfile) {
      this.userContext = {
        pregnancyWeek: pregnancyProfile.weeksPregnant,
        dueDate: pregnancyProfile.dueDate,
        bloodType: pregnancyProfile.bloodType,
        conditions: pregnancyProfile.preExistingConditions,
        allergies: pregnancyProfile.allergies,
        currentWeight: latestWeight
          ? latestWeight.weight
          : pregnancyProfile.weightBeforePregnancy,
        lastUpdated: new Date(),
      };
    }

    return this.save();
  } catch (error) {
    console.error("Error updating user context:", error);
  }
};

// Static method to get or create conversation
conversationSchema.statics.getOrCreateConversation = async function (userId) {
  let conversation = await this.findOne({ user: userId, isActive: true }).sort({
    lastMessageAt: -1,
  });

  if (!conversation) {
    conversation = await this.create({ user: userId });
    await conversation.updateUserContext();
  }

  return conversation;
};

// Method to get recent conversation history
conversationSchema.methods.getRecentHistory = function (messageCount = 10) {
  return this.messages.slice(-messageCount);
};

module.exports = mongoose.model("Conversation", conversationSchema);

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderRole: {
      type: String,
      enum: ['principal', 'teacher', 'student'],
      required: true
    },
    content: {
      type: String,
      default: '',
      trim: true
    },
    attachments: [
      {
        url: {
          type: String,
          required: true
        },
        name: {
          type: String,
          required: true
        },
        type: {
          type: String,
          enum: ['image', 'video', 'audio', 'document', 'file'],
          default: 'file'
        },
        size: {
          type: Number,
          default: 0
        },
        mimeType: {
          type: String,
          default: ''
        }
      }
    ],
    pinned: {
      type: Boolean,
      default: false
    },
    priority: {
      type: String,
      enum: ['normal', 'urgent', 'announcement', 'query'],
      default: 'normal'
    },
    reactions: [
      {
        emoji: {
          type: String,
          enum: ['👍', '❤️', '✅', '🙏', '🔥', '👏', '💡', '📌'],
          required: true
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Message', messageSchema);


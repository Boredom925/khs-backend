// models/Notice.js
const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    body: {
      type: String,
      required: [true, 'Body is required'],
      trim: true,
    },
    tag: {
      type: String,
      enum: ['Announcement', 'Exam', 'Event', 'Academic', 'Urgent', 'General'],
      default: 'General',
    },
    isUrgent: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Notice || mongoose.model('Notice', noticeSchema);

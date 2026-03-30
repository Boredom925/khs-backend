// models/Admission.js
const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema(
  {
    childName: {
      type: String,
      required: [true, "Child's name is required"],
      trim: true,
      maxlength: 100,
    },
    parentName: {
      type: String,
      required: [true, "Parent's name is required"],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
    },
    applyingForClass: {
      type: String,
      required: [true, 'Class is required'],
      enum: ['LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: 500,
    },
    // GPS result stored for records
    distanceFromSchoolKm: {
      type: Number,
    },
    locationCleared: {
      type: Boolean,
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Admission || mongoose.model('Admission', admissionSchema);

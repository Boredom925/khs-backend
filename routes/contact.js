// routes/contact.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');

// ─── Validation rules ────────────────────────────────────────────
const contactValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 200 }),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 2000 }),
];

// ─── POST /api/contact — Save message & send email ───────────────
router.post('/', contactValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, email, subject, message } = req.body;

    // 1. Save to MongoDB
    const contact = await Contact.create({
      name,
      email,
      subject,
      message,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    });

    // 2. Send email notification (if credentials provided)
    //(process.env.EMAIL_USER && process.env.EMAIL_PASS)
    if (false) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      await transporter.sendMail({
        from: `"KHS Website" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
        subject: `[KHS Contact] ${subject}`,
        html: `
          <h2>New Contact Message — Kolkata High School</h2>
          <table style="border-collapse:collapse; width:100%; font-family:sans-serif">
            <tr><td style="padding:8px; font-weight:bold; background:#f0f4f8">Name</td><td style="padding:8px">${name}</td></tr>
            <tr><td style="padding:8px; font-weight:bold; background:#f0f4f8">Email</td><td style="padding:8px">${email}</td></tr>
            <tr><td style="padding:8px; font-weight:bold; background:#f0f4f8">Subject</td><td style="padding:8px">${subject}</td></tr>
            <tr><td style="padding:8px; font-weight:bold; background:#f0f4f8">Message</td><td style="padding:8px">${message}</td></tr>
            <tr><td style="padding:8px; font-weight:bold; background:#f0f4f8">Received</td><td style="padding:8px">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
          </table>
          <p style="color:#888; font-size:12px; margin-top:16px">Reply to: ${email}</p>
        `,
        replyTo: email,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Your message has been received. We will get back to you within 2 working days.',
      id: contact._id,
    });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

// ─── GET /api/contact — Fetch all messages (admin use) ───────────
router.get('/', async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: messages.length, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PATCH /api/contact/:id/status ───────────────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!contact) return res.status(404).json({ success: false, message: 'Message not found.' });
    res.json({ success: true, data: contact });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;

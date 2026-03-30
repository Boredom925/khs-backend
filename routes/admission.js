// routes/admission.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Admission = require('../models/Admission');
const nodemailer = require('nodemailer');

// ─── Validation rules ─────────────────────────────────────────────
const admissionValidation = [
  body('childName').trim().notEmpty().withMessage("Child's name is required"),
  body('parentName').trim().notEmpty().withMessage("Parent's name is required"),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Enter a valid 10-digit Indian mobile number'),
  body('applyingForClass').notEmpty().withMessage('Class selection is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('distanceFromSchoolKm')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Distance must be a positive number'),
  body('locationCleared').optional().isBoolean(),
];

// ─── POST /api/admission — Submit admission inquiry ───────────────
router.post('/', admissionValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const admission = await Admission.create(req.body);

    // Send confirmation email to parent
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && req.body.email) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      // Email to parent
      await transporter.sendMail({
        from: `"Kolkata High School" <${process.env.EMAIL_USER}>`,
        to: req.body.email,
        subject: 'Admission Inquiry Received — Kolkata High School',
        html: `
          <div style="font-family:sans-serif; max-width:560px; margin:auto; border:1px solid #e0e8f0; border-radius:10px; overflow:hidden">
            <div style="background:#0d2b55; padding:24px; text-align:center">
              <h2 style="color:#f0d080; margin:0">Kolkata High School</h2>
              <p style="color:rgba(255,255,255,0.7); margin:6px 0 0">Admission Inquiry Received</p>
            </div>
            <div style="padding:28px">
              <p>Dear <strong>${req.body.parentName}</strong>,</p>
              <p>Thank you for your interest in admitting <strong>${req.body.childName}</strong> to Kolkata High School for Class <strong>${req.body.applyingForClass}</strong>.</p>
              <p>Your inquiry has been recorded (Reference ID: <strong>${admission._id}</strong>). Our admissions team will contact you within <strong>2–3 working days</strong>.</p>
              <div style="background:#f0f7ff; border-left:4px solid #0d2b55; padding:14px 18px; margin:20px 0; border-radius:4px">
                <p style="margin:0; font-weight:600">Next Steps:</p>
                <ul style="margin:8px 0 0; padding-left:18px; line-height:2">
                  <li>Visit the school on any working day (Mon–Sat, 9 AM – 2 PM)</li>
                  <li>Bring: Child's last Report Card, Aadhaar Card, Birth Certificate</li>
                  <li>Admission form available at the school office</li>
                </ul>
              </div>
              <p style="color:#888; font-size:13px">For queries: 033-2200-1234 | admissions@kolkatahighschool.edu.in</p>
            </div>
            <div style="background:#f7f9fc; padding:14px; text-align:center; font-size:12px; color:#aaa">
              © 2025 Kolkata High School · 12, School Road, Salt Lake, Kolkata – 700091
            </div>
          </div>
        `,
      });

      // Notify school admin
      await transporter.sendMail({
        from: `"KHS Admissions Portal" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
        subject: `[New Admission] ${req.body.childName} — Class ${req.body.applyingForClass}`,
        html: `
          <h2>New Admission Inquiry</h2>
          <table style="border-collapse:collapse; width:100%; font-family:sans-serif; font-size:14px">
            <tr><td style="padding:8px 12px; background:#f0f4f8; font-weight:bold">Child Name</td><td style="padding:8px 12px">${req.body.childName}</td></tr>
            <tr><td style="padding:8px 12px; background:#f0f4f8; font-weight:bold">Parent Name</td><td style="padding:8px 12px">${req.body.parentName}</td></tr>
            <tr><td style="padding:8px 12px; background:#f0f4f8; font-weight:bold">Email</td><td style="padding:8px 12px">${req.body.email}</td></tr>
            <tr><td style="padding:8px 12px; background:#f0f4f8; font-weight:bold">Phone</td><td style="padding:8px 12px">${req.body.phone}</td></tr>
            <tr><td style="padding:8px 12px; background:#f0f4f8; font-weight:bold">Applying For</td><td style="padding:8px 12px">Class ${req.body.applyingForClass}</td></tr>
            <tr><td style="padding:8px 12px; background:#f0f4f8; font-weight:bold">Address</td><td style="padding:8px 12px">${req.body.address}</td></tr>
            <tr><td style="padding:8px 12px; background:#f0f4f8; font-weight:bold">Distance</td><td style="padding:8px 12px">${req.body.distanceFromSchoolKm ?? 'N/A'} km — ${req.body.locationCleared ? '✅ Cleared' : '❌ Beyond 5km'}</td></tr>
            <tr><td style="padding:8px 12px; background:#f0f4f8; font-weight:bold">Reference ID</td><td style="padding:8px 12px">${admission._id}</td></tr>
          </table>
        `,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Admission inquiry submitted! Confirmation sent to your email.',
      referenceId: admission._id,
    });
  } catch (err) {
    console.error('Admission error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ─── GET /api/admission — List all inquiries (admin) ─────────────
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [admissions, total] = await Promise.all([
      Admission.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Admission.countDocuments(filter),
    ]);

    res.json({ success: true, total, page: parseInt(page), data: admissions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PATCH /api/admission/:id/status ─────────────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const admission = await Admission.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!admission) return res.status(404).json({ success: false, message: 'Record not found.' });
    res.json({ success: true, data: admission });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;

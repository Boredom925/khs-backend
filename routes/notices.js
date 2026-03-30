// routes/notices.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Notice = require('../models/Notice');

// ─── GET /api/notices — Fetch all published notices ──────────────
router.get('/', async (req, res) => {
  try {
    const { tag, limit = 20, page = 1 } = req.query;
    const filter = { isPublished: true };
    if (tag) filter.tag = tag;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [notices, total] = await Promise.all([
      Notice.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Notice.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: notices,
    });
  } catch (err) {
    console.error('Notices GET error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/notices/:id ─────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id).lean();
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found.' });
    res.json({ success: true, data: notice });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── POST /api/notices — Create notice (admin) ───────────────────
const noticeValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('body').trim().notEmpty().withMessage('Body is required'),
  body('tag').optional().isIn(['Announcement', 'Exam', 'Event', 'Academic', 'Urgent', 'General']),
];

router.post('/', noticeValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const notice = await Notice.create(req.body);
    res.status(201).json({ success: true, data: notice });
  } catch (err) {
    console.error('Notices POST error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PUT /api/notices/:id — Update notice (admin) ────────────────
router.put('/:id', async (req, res) => {
  try {
    const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found.' });
    res.json({ success: true, data: notice });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── DELETE /api/notices/:id ──────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found.' });
    res.json({ success: true, message: 'Notice deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.txt', '.md', '.text'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .txt, .md, and .text files are allowed'));
    }
  },
});

// List all transcripts for the logged-in user
router.get('/', authenticateToken, (req, res) => {
  const transcripts = db
    .prepare('SELECT id, title, original_name, created_at FROM transcripts WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id);
  res.json(transcripts);
});

// Upload a new transcript
router.post('/', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const title = (req.body.title || req.file.originalname).trim();
  const result = db
    .prepare('INSERT INTO transcripts (user_id, title, filename, original_name) VALUES (?, ?, ?, ?)')
    .run(req.user.id, title, req.file.filename, req.file.originalname);

  const transcript = db.prepare('SELECT id, title, original_name, created_at FROM transcripts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(transcript);
});

// Get a single transcript with content
router.get('/:id', authenticateToken, (req, res) => {
  const transcript = db
    .prepare('SELECT * FROM transcripts WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);

  if (!transcript) {
    return res.status(404).json({ error: 'Transcript not found' });
  }

  const filePath = path.join(__dirname, '..', 'uploads', transcript.filename);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ id: transcript.id, title: transcript.title, content });
  } catch {
    res.status(500).json({ error: 'Failed to read transcript file' });
  }
});

// Delete a transcript
router.delete('/:id', authenticateToken, (req, res) => {
  const transcript = db
    .prepare('SELECT * FROM transcripts WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);

  if (!transcript) {
    return res.status(404).json({ error: 'Transcript not found' });
  }

  const filePath = path.join(__dirname, '..', 'uploads', transcript.filename);
  try { fs.unlinkSync(filePath); } catch { /* file may not exist */ }

  db.prepare('DELETE FROM transcripts WHERE id = ?').run(req.params.id);
  res.json({ message: 'Transcript deleted' });
});

export default router;

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const cors = require('cors');
const util = require('util');

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
app.use(cors()); // allow from frontend dev server
app.use(express.json());

// Configure SQLite
let db;
(async () => {
  db = await open({ filename: path.join(__dirname, 'db.sqlite3'), driver: sqlite3.Database });
  await db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      filesize INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
})();

// Configure Multer storage and file filter

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {

  // Use original filename as base
  const originalName = file.originalname.replace(/\s+/g, '_');  // remove spaces
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);

  let finalName = originalName;
  let counter = 1;

  // If file already exists, append (1), (2), ...
  while (fs.existsSync(path.join(UPLOAD_DIR, finalName))) {
    finalName = `${base}(${counter})${ext}`;
    counter++;
  }

  cb(null, finalName);
},
});

const fileFilter = (req, file, cb) => {
  // Accept only PDFs
  const isPdf = file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname);
  if (isPdf) cb(null, true);
  else cb(new Error('Only PDF files are allowed'), false);
};
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter,
});

// Endpoints

// POST /documents/upload
app.post('/documents/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { filename, path: filepath, size } = req.file;
    const created_at = new Date().toISOString();
    const result = await db.run(
      `INSERT INTO documents (filename, filepath, filesize, created_at) VALUES (?, ?, ?, ?)`,
      [filename, filepath, size, created_at]
    );
    const id = result.lastID;
    const doc = await db.get(`SELECT * FROM documents WHERE id = ?`, id);
    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// GET /documents
app.get('/documents', async (req, res) => {
  try {
    const rows = await db.all(`SELECT id, filename, filepath, filesize, created_at FROM documents ORDER BY created_at DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /documents/:id  (download)
app.get('/documents/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const doc = await db.get(`SELECT * FROM documents WHERE id = ?`, id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    const filePath = doc.filepath;
    if (!fs.existsSync(filePath)) {
      // If file missing, remove metadata and return 404
      await db.run(`DELETE FROM documents WHERE id = ?`, id);
      return res.status(404).json({ error: 'File missing on server' });
    }
    res.download(filePath, doc.filename);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /documents/:id
app.delete('/documents/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const doc = await db.get(`SELECT * FROM documents WHERE id = ?`, id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    const filePath = doc.filepath;
    // remove file if exists
    if (fs.existsSync(filePath)) await util.promisify(fs.unlink)(filePath);
    await db.run(`DELETE FROM documents WHERE id = ?`, id);
    res.json({ success: true, message: `Deleted document ${id}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
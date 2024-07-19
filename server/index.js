const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'src', 'components', 'media'));
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    const filename = `${uuidv4()}.${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ storage });

app.post('/api/upload', upload.single('media'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  console.log('File received:', req.file);
  res.json({ message: 'File received successfully!', file: req.file });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
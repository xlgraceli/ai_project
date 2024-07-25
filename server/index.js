const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const { Client } = require('ssh2');

const app = express();
//const PORT = process.env.PORT || 8081;
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// SSH Configuration
const sshConfig = {
  host: '146.190.115.255',
  port: 22, 
  username: 'intern2024',
  password: 'wbw123456', 
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'src', 'components', 'media');

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    const filename = `${uuidv4()}.${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'video/webm'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'), false);
    }
    cb(null, true);
  }
});

app.post('/api/upload', upload.single('media'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No media uploaded' });
  }
  /*
  const localFilePath = req.file.path;
  const remoteFilePath = `/home/intern2024/tempImage/${req.file.filename}`;

  const conn = new Client();
  conn.on('ready', () => {
    conn.sftp((err, sftp) => {
      if (err) return res.status(500).json({ error: err.message });

      // Upload file to remote server
      sftp.fastPut(localFilePath, remoteFilePath, (err) => {
        if (err) {
          conn.end();
          return res.status(500).json({ error: err.message });
        }

        // Delete local file after successful upload
        fs.unlink(localFilePath, (err) => {
          if (err) {
            conn.end();
            return res.status(500).json({ error: err.message });
          }

          conn.end();
          res.json({ message: 'Media uploaded and transferred successfully!', file: req.file });
        });
      });
    });
  }).connect(sshConfig);*/


  console.log('File received:', req.file);
  res.json({ message: 'Media received successfully!', file: req.file });
});

app.post('/api/set-llm', (req, res) => {
  const { llm } = req.body;
  // Store the selected LLM (you could use a database or in-memory storage)
  res.json({ message: 'LLM set successfully!', llm });
});

app.get('/api/get-llm', (req, res) => {
  // Retrieve the selected LLM (from database or in-memory storage)
  res.json({ llm: 'Phi-3' }); 
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
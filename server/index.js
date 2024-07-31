const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
//const PORT = process.env.PORT || 8081;
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use('/processed_image', express.static(path.join(__dirname, '..', 'flask_server','processed_image')));

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
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'video/webm'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'), false);
    }
    cb(null, true);
  }
});

app.post('/api/upload', upload.single('media'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No media uploaded' });
  }

  // Image sent to face_detect API
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  const fileExtension = path.extname(req.file.originalname).toLowerCase();
  if (validExtensions.includes(fileExtension)) {
    try {
      const form = new FormData();
      form.append('media', fs.createReadStream(req.file.path), path.basename(req.file.path));
      
      const response = await axios.post('http://146.190.115.255:8081/process-image', form, {
        headers: {
          ...form.getHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });

      res.json({ 
        message: 'Media received and processed successfully!',
        processedImagePath: response.data.processedImagePath 
      });
    } catch (error) {
      console.error('Error processing image:', error);
      res.status(500).json({ message: 'Error processing image' });
    }
  } else {
    console.log('File received:', req.file);
    res.json({ message: 'Media received successfully!', file: req.file });
  }
});


app.post('/api/set-llm', (req, res) => {
  const { llm } = req.body;
  // Store the selected LLM
  res.json({ message: 'LLM set successfully!', llm });
});

app.get('/api/get-llm', (req, res) => {
  // Retrieve the selected LLM in-memory storage
  res.json({ llm: 'Phi-3' }); 
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
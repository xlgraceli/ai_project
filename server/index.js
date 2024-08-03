const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const fsPromises = require('fs').promises;
const FormData = require('form-data');
const { Client } = require('ssh2');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json());
app.use('/processed_image', express.static(path.join(__dirname, '..', 'flask_server','processed_image')));

const sshConfig = {
  host: '146.190.115.255',
  port: 6000,
  username: 'intern2024',
  password: 'wbw123456' 
};

//stores the media taken locally
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

//only allows media uploads
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

//uploads images and videos to ssh server for processing (images for now)
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

//retrieves image patch from ssh server
app.get('/image', async (req, res) => {
  const localPath = path.join(__dirname, '..', 'src', 'components', 'media', 'image_patch.png');
  try {
    console.log('Received request for image');
    
    const conn = new Client();
    
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('SSH connection ready');
        conn.sftp((err, sftp) => {
          if (err) {
            console.error('SFTP error:', err);
            return reject(err);
          }

          const remotePath = 'flask_server/processed_image/image_patch.png';
          
          console.log('Downloading file from', remotePath, 'to', localPath);
          sftp.fastGet(remotePath, localPath, (err) => {
            if (err) {
              console.error('Error during file transfer:', err);
              return reject(err);
            }

            console.log('File transfer complete');
            conn.end();
            resolve(localPath);
          });
        });
      }).connect(sshConfig);
    });

    console.log('Reading file from local path');
    const data = await fsPromises.readFile(localPath);

    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(data);
    console.log('File sent successfully');

  } catch (error) {
    console.error('Unexpected Error:', error);
    res.status(500).send('Unexpected error');
  }
});

//sends prompt to vllm server
app.post('/send-prompt', async (req, res) => {
  const { prompt, max_tokens, temperature } = req.body;

  try {
      const result = await axios.post('http://127.0.0.1:6000/v1/engines/Phi-3-mini-4k-instruct/completions', {
          prompt: prompt,
          max_tokens: max_tokens,
          temperature: temperature
      }, {
          headers: {
              'Content-Type': 'application/json'
          }
      });

      res.json(result.data);

  } catch (error) {
      console.error('Error sending to vLLM server:', error);
      res.status(500).send('Error communicating with vLLM server');
  }
});

// Reads a specific information from a json file on ssh server
app.get('/api/json', async (req, res) => {
  //temporary file path 
  const localFilePath = path.join(__dirname, 'remote.json');

  const conn = new Client();

  conn.on('ready', () => {
    conn.sftp((err, sftp) => {
      if (err) {
        return res.status(500).json({ message: 'SFTP connection error', error: err.message });
      }

      //temporary file path
      //const remoteFilePath = '/path/to/remote.json';

      const readStream = sftp.createReadStream(remoteFilePath);
      const writeStream = fs.createWriteStream(localFilePath);

      readStream.pipe(writeStream);

      writeStream.on('close', async () => {
        conn.end();

        try {
          const data = JSON.parse(fs.readFileSync(localFilePath, 'utf8'));
          const specificInfo = data.HeartRate; //assuming 'HeartRate' is the section title
          res.json({ specificInfo });
        } catch (error) {
          res.status(500).json({ message: 'Error reading local JSON file', error: error.message });
        }
      });

      writeStream.on('error', (error) => {
        res.status(500).json({ message: 'Error writing local JSON file', error: error.message });
      });
    });
  }).connect(sshConfig);
});
  

// app.post('/api/set-llm', (req, res) => {
//   const { llm } = req.body;
//   // Store the selected LLM
//   res.json({ message: 'LLM set successfully!', llm });
// });

// app.get('/api/get-llm', (req, res) => {
//   // Retrieve the selected LLM in-memory storage
//   res.json({ llm: 'Phi-3' }); 
// });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
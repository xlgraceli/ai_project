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
  host: 'host',
  port: 6000,
  username: 'username',
  password: 'password' 
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
    const allowedTypes = ['image/jpeg', 'image/png', 'video/webm', 'video/mov', 'video/mp4'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'), false);
    }
    cb(null, true);
  }
});

//uploads images and videos to ssh server for processing
app.post('/api/upload', upload.single('media'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No media uploaded' });
  }

  try {
    const form = new FormData();
    form.append('media', fs.createReadStream(req.file.path), path.basename(req.file.path));
    
    const response = await axios.post('http://link-to-ssh-server/process-media', form, {
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
    console.error('Error processing media:', error);
    res.status(500).json({ message: 'Error processing media' });
  }
});

//retrieves images from ssh server
app.get('/image', async (req, res) => {
  const { filename } = req.query;

  const localPath = path.join(__dirname, '..', 'src', 'components', 'media', `${filename}.png`);
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

          const remotePath = `flask_server/output/${filename}.png`;
          
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
  try {
    const result = await axios.post('http://link-to-ssh-server/send-prompt');
    res.json(result.data);
  } catch (error) {
      console.error('Error sending to vLLM server:', error);
      res.status(500).send('Error communicating with vLLM server');
  }
});  

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
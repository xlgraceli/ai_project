const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

app.post('/api/upload', (req, res) => {
    const { image } = req.body;
    const base64Data = image.replace(/^data:image\/jpeg;base64,/, "");

    const filePath = path.join(__dirname, '..', 'src', 'components', 'images', `image-${Date.now()}.jpg`);

    // Save the image to the file system
    fs.writeFile(filePath, base64Data, 'base64', (err) => {
      if (err) {
        console.error('Error saving image:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
      
      console.log('Received image:', image);
      res.json({ message: 'Image received successfully!' });
    });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

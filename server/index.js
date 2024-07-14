const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

app.post('/api/upload', (req, res) => {
    const { image } = req.body;
    console.log('Received image:', image);
    res.json({ message: 'Image received successfully!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

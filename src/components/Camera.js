import React, {useRef} from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import './Camera.css';

const Camera = () => {
  const webcamRef = useRef(null);

  const capture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      await sendImageToApi(imageSrc);
    }
  };

  const sendImageToApi = async (imageData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/upload', { image: imageData });
      console.log('API Response:', response.data);
    } catch (error) {
      console.error('Error sending image to API:', error);
    }
  };

  return (
    <div className="camera">
      <Webcam className="mirrored" audio={false} ref={webcamRef} screenshotFormat="image/jpeg" />
      <button className="button" onClick={capture}>Take Photo</button>
      <p>Temperature: </p>
    </div>
  );
};
  
  export default Camera;
  
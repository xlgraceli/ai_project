import React, {useRef, useState} from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import {v4 as uuidv4} from 'uuid';
import './Camera.css';

const Camera = () => {
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoBits, setVideoBits] = useState([]);

  const captureImage = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    const imageId = uuidv4();
    if (imageSrc) {
      await sendMediaToApi(imageSrc, imageId, 'image');
    }
  };

  const sendMediaToApi = async (mediaData, mediaId, mediaType) => {
    const formData = new FormData();
    const blob = mediaType === 'image' ? dataURItoBlob(mediaData) : mediaData;
    formData.append('media', blob, `${mediaId}.${mediaType === 'image' ? 'jpeg' : 'webm'}`);
    formData.append('type', mediaType);
    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('API Response:', response.data);
    } catch (error) {
      console.error('Error sending media to API:', error);
    }
  };

  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const startRecording = () => {
    setIsRecording(true);
    setVideoBits([]);
    const stream = webcamRef.current.stream;
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setVideoBits((prev) => [...prev, event.data]);
      }
    };

    mediaRecorder.onstop = async () => {
      const videoBlob = new Blob(videoBits, { type: 'video/webm' });
      const videoId = uuidv4();
      await sendMediaToApi(videoBlob, videoId, 'video');
      setIsRecording(false);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();

    setTimeout(() => {
      mediaRecorderRef.current.stop();
    }, 10000);
  };

  return (
    <div className="camera">
      <Webcam className="mirrored" audio={false} ref={webcamRef} screenshotFormat="image/jpeg" />
      <div className='buttons'>
        <button className="button" onClick={captureImage}>Take Photo</button>
        <button className="button" onClick={startRecording} disabled={isRecording}>
          {isRecording ? 'Recording...' : 'Start Recording 10s'}
        </button>
      </div>
      
    </div>
  );
};

export default Camera;

  
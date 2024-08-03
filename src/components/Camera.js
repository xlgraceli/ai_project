import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import './Components.css';
import Face from './Face';


const Camera = () => {
  //camera function vars
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [videoChunks, setVideoChunks] = useState([]);
  const [timer, setTimer] = useState(10);
  //const [processedImageURL, setProcessedImageURL] = useState(null);
  
  //image processing vars
  const [imageCaptured, setImageCaptured] = useState(false);
  const [reloadImage, setReloadImage] = useState(false);

  //llm function vars
  const [llmResult, setllmResult] = useState(null);
  const [llmLoading, setllmLoading] = useState(null);

  //screenshots & send to API
  const captureImage = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    const imageId = uuidv4();
    if (imageSrc) {
      await sendMediaToApi(dataURItoBlob(imageSrc), imageId, 'image');
      await sendPromptToBackend(); //for now, need to change later for vids
    }
  };
  
  const handleDataAvailable = useCallback(
    ({ data }) => {
      if (data.size > 0) {
        setVideoChunks((prev) => prev.concat(data));
      }
    },
    []
  );

  //starts recording 10s & auto stop
  const startRecording = useCallback(() => {
    setCapturing(true);
    setVideoChunks([]);
    setTimer(10);

    mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current.addEventListener("dataavailable", handleDataAvailable);
    mediaRecorderRef.current.start();

    const intervalId = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleDataAvailable]);

  //stop recording function
  const stopRecording = useCallback(() => {
    mediaRecorderRef.current.stop();
    setCapturing(false);
  }, []);

  //function to allow video to be sent to api
  const handleSendVideo = useCallback(async () => {
    if (videoChunks.length) {
      const blob = new Blob(videoChunks, { type: 'video/webm' });
      await sendMediaToApi(blob, uuidv4(), 'video');
      setVideoChunks([]);
    }
  }, [videoChunks]);

  //function to send media to API
  const sendMediaToApi = async (mediaData, mediaId, mediaType) => {
    const formData = new FormData();
    formData.append('media', mediaData, `${mediaId}.${mediaType === 'image' ? 'png' : 'webm'}`);
    formData.append('type', mediaType);

    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
      });

      if (mediaType === 'image'){
        const processedImagePath = response.data.processedImagePath;
        console.log('Processed Image URL:', processedImagePath);
        if (processedImagePath) {
          // URL for accessing processed image
          const imageUrl = `http://146.190.115.255:8081/flask_server/${processedImagePath}`;
          //setProcessedImageURL(imageUrl);
          setImageCaptured(true);
          setReloadImage(prev => !prev);
          console.log('Image processed');
        } else {
            console.log('Error: Photo Null');
        }
      }else{
        console.log('Video sent, no further processing.');
      }
      console.log('API Response:', response.data);
    } catch (error) {
      console.error('Error sending media to API:', error);
    }
  };

  //converts the data to blob
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

  // Send video when capturing stops
  useEffect(() => {
    if (!capturing && videoChunks.length) {
      handleSendVideo();
    }
  }, [capturing, videoChunks, handleSendVideo]);

  const sendPromptToBackend = async () => {
    setllmLoading(true);
    
    //temporary prompt
    const prompt = `
      Prompt: You are an AI system trained to detect the heart rate, skin tone, and health implications 
      of a user’s face. Your task is to identify how high/low a person’s heart rate is and its health 
      implications, the color of a person’s skin to identify what skin tone the person has, and notice 
      anything that stands out on their face.`;

    try {
      const result = await axios.post('http://localhost:5000/send-prompt', {
        prompt: prompt,
        max_tokens: 50,
        temperature: 0.7
      });

      setllmResult(result.data);
      console.log('LLM Server Response:', result.data);
    } catch (error) {
      console.error('Error sending prompt to backend server:', error);
    } finally {
      setllmLoading(false);
    }
  };
  

  return (
    <div className="camera">
      <Webcam className="mirrored" audio={false} ref={webcamRef} screenshotFormat="image/png" />
      <div className="buttons">
        <button className="button" onClick={captureImage}><b>Take Photo 📷</b></button>
        <button className="button" onClick={startRecording} disabled={capturing}>
          <b>
            {capturing ? `Recording ... ${timer}s 🔴` : 'Record 10s 🎥'}
          </b>
        </button>
      </div>
      {imageCaptured && <h1>Face Map Display</h1>}
      {imageCaptured && <Face key={reloadImage} filename = {'image_patch'}/>}
      {llmLoading && <h1>vLLM Server Result</h1>}
      {llmLoading && <p>Loading...</p>}
      {!llmLoading && llmResult && (
        <div >
          <h2>Result:</h2>
          <div className='wrapper'>
            <pre className='llmResult-container'>{JSON.stringify(llmResult, null,2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default Camera;
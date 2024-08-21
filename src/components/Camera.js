import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import './Components.css';
import Face from './Face';
import Graph from './Graph';


const Camera = () => {
  //camera function vars
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [videoChunks, setVideoChunks] = useState([]);
  const [timer, setTimer] = useState(10);
  const [isVideoProcessing, setIsVideoProcessing] = useState(false);

  //image processing vars
  const [imageCaptured, setImageCaptured] = useState(false);
  const [reloadImage, setReloadImage] = useState(false);

  //graph loading vars
  const [graphProcessed, setGraphProcessed] = useState(false);
  const [reloadGraph, setReloadGraph] = useState(false);

  //llm function vars
  const [llmResult, setllmResult] = useState(null);
  const [llmLoading, setllmLoading] = useState(null);

  //screenshots & send to API
  const captureImage = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    const imageId = uuidv4();
    if (imageSrc) {
      await sendMediaToApi(dataURItoBlob(imageSrc), imageId, 'image');
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

  //starts recording 11s & auto stop
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

  //function to send media to backend api
  const sendMediaToApi = async (mediaData, mediaId, mediaType) => {
    const formData = new FormData();
    formData.append('media', mediaData, `${mediaId}.${mediaType === 'image' ? 'png' : 'webm'}`);
    formData.append('type', mediaType);

    try {
      if (mediaType === 'video') {
          setIsVideoProcessing(true);
      }

      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
      });

      if (mediaType === 'image'){
        setImageCaptured(true);
        setReloadImage(prev => !prev);
        console.log('Image processed');
      }else{
        console.log('Video processed');
        setGraphProcessed(true);
        setReloadGraph(prev => !prev);
        await sendPromptToBackend();
      }
      console.log('API Response:', response.data);
    } catch (error) {
      console.error('Error sending media to API:', error);
    } finally {
        if (mediaType === 'video') {
            setIsVideoProcessing(false);
        }
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
      setIsVideoProcessing(true);
      handleSendVideo();
    }
  }, [capturing, videoChunks, handleSendVideo]);

  //send prompt to vllm server
  const sendPromptToBackend = async () => {
    setllmLoading(true);
    try {
      const result = await axios.post('http://localhost:5000/send-prompt');
      if (result.data.choices && result.data.choices.length > 0) {
        setllmResult(result.data.choices[0].text.replace(/\n/g, '<br />'));
    } else {
        setllmResult('No response available');
    }
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
      {isVideoProcessing && <p>Processing video, please wait...</p>}
      {imageCaptured && <h1>Face Map Display</h1>}
      {imageCaptured && <Face key={`image-${reloadImage}`} filename = {'image_patch'}/>}
      {graphProcessed && <h1>Average Face RGB Graph</h1>}
      {graphProcessed && <Graph key={`graph-${reloadGraph}`} filename = {'average_rgb_per_frame'}/>}
      {llmLoading && <h1>Your Health Results</h1>}
      {llmLoading && <p>Loading...</p>}
      {!llmLoading && llmResult && (
        <div >
          <h1>Your Health Results</h1>
          <div className='wrapper'>
            <pre className='llmResult-container' dangerouslySetInnerHTML={{ __html: llmResult }}></pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default Camera;
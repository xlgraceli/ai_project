import React from 'react';
import Webcam from 'react-webcam';
import './Camera.css';

const Camera = () => {
    return (
      <div>
        <Webcam 
          className="mirrored"
          audio={false} 
          screenshotFormat="image/jpeg" 
          width="640" 
          height="480" 
        />
      </div>
    );
  };
  
  export default Camera;
  
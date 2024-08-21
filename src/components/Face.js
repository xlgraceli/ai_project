import React, {useState, useEffect} from 'react';
import axios from 'axios';
import './Components.css';
  
const Face = ({filename}) => {
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect( () => {
        const fetchImage = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`http://localhost:5000/image?filename=${filename}`, {
                    responseType: 'blob',
                });
                const imageBlob = new Blob([response.data], { type: 'image/png' });
                const imageObjectUrl = URL.createObjectURL(imageBlob);
                setImageUrl(imageObjectUrl);
            } catch (error) {
                console.error('Error fetching image:', error);
            } finally {
                setLoading(false); 
            }
        };

        fetchImage();

    }, [filename]);

    return (
        <div className="face-map-container">
            {loading ? (
                <div>Loading...</div>
            ) : (
                <img src={imageUrl} alt="Face Image Patch" className="face-map-image" />
            )}
        </div>
    );
};

export default Face;
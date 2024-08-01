import React, {useState, useEffect} from 'react';
import axios from 'axios';
import './Components.css';
//import acneFaceMapImage from './media/cropped_output_face.png'; 

// const mockData = [
//     { region: 'Forehead Nose', reasons: ['Stress', 'Improper digestion', 'Irregular sleep', 'Poor diet', 'Hair conditions', 'Touching with unclean hands'] },
//     { region: 'Hairline', reasons: ['Pomades (in hair care products)'] },
//     { region: 'Eyebrow Area', reasons: ['Hair care products', 'Eyebrow or face makeup', 'Ingrown hair', 'Diet', 'Water intake', 'Gallbladder issues'] },
//     { region: 'Ears', reasons: ['Stress', 'Bacteria build-up', 'Hormonal imbalance', 'Allergic reaction to cosmetics and hair care products'] },
//     { region: 'Cheeks', reasons: ['Dirty pillowcase', 'Makeup brushes', 'Cellphone'] },
//     { region: 'Jawline Chin', reasons: ['Hormonal imbalance', 'Diet'] },
// ];
  
const Face = ({filename}) => {
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect( () => {
        const fetchImage = async () => {
            setLoading(true);
            try {
                const response = await axios.get('http://localhost:5000/image', {
                    responseType: 'blob',
                });
                const imageBlob = new Blob([response.data], { type: 'image/png' });
                const imageObjectUrl = URL.createObjectURL(imageBlob);
                setImageUrl(imageObjectUrl);
            } catch (error) {
                console.error('Error fetching image:', error);
            } finally {
                setLoading(false); // Set loading to false when image is fetched
            }
        };

        fetchImage();

    }, [filename]);

    return (
        <div className="face-map-container">
            {loading ? ( // Show loading sign when loading
                <div>Loading...</div>
            ) : (
                <img src={imageUrl} alt="Acne Face Map" className="face-map-image" />
            )}
        </div>
    );
};

export default Face;
import React from 'react';
import './Components.css';
//import acneFaceMapImage from './media/cropped_output_face.png'; 

const mockData = [
    { region: 'Forehead Nose', reasons: ['Stress', 'Improper digestion', 'Irregular sleep', 'Poor diet', 'Hair conditions', 'Touching with unclean hands'] },
    { region: 'Hairline', reasons: ['Pomades (in hair care products)'] },
    { region: 'Eyebrow Area', reasons: ['Hair care products', 'Eyebrow or face makeup', 'Ingrown hair', 'Diet', 'Water intake', 'Gallbladder issues'] },
    { region: 'Ears', reasons: ['Stress', 'Bacteria build-up', 'Hormonal imbalance', 'Allergic reaction to cosmetics and hair care products'] },
    { region: 'Cheeks', reasons: ['Dirty pillowcase', 'Makeup brushes', 'Cellphone'] },
    { region: 'Jawline Chin', reasons: ['Hormonal imbalance', 'Diet'] },
];
  
const Face = ({processedImageURL}) => {
    return (
        <div className="face-map-container">
            <img src={processedImageURL} alt="Acne Face Map" className="face-map-image" />
            <div className="face-overlay">
                {mockData.map((item, index) => (
                <div key={index} className={`region-label region-${item.region.replace(/\s+/g, '-').toLowerCase()}`}>
                    <h3>{item.region}</h3>
                    <ul>
                    {item.reasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                    ))}
                    </ul>
                </div>
                ))}
            </div>
        </div>
    );
};

export default Face;
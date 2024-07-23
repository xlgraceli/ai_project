import React, {useState, useEffect} from 'react';
import axios from 'axios';
import './Components.css';

const LLMselect = () => {
    const [selectedLLM, setSelectedLLM] = useState(null);
    const [llmOptions] = useState(['GPT-3', 'Phi-3']);

    const handleSelectLLM = async (event) => {
        const llm = event.target.value;
        setSelectedLLM(llm);
        await axios.post('http://localhost:5000/api/set-llm', { llm })
    }

    useEffect(() => {
        const fetchLLM = async () => {
            const response = await axios.get('http://localhost:5000/api/get-llm');
            setSelectedLLM(response.data.llm);
        };

        fetchLLM();
    }, []);

    return (
        <div className='camera'>
            <label htmlFor="llm-select">Select LLM:</label>
            <select id="llm-select" value={selectedLLM || ''} onChange={handleSelectLLM}>
                <option value="" disabled>Select an LLM</option>
                {llmOptions.map((llm) => (
                    <option key={llm} value={llm}>{llm}</option>
                ))}
            </select>
            {selectedLLM && <p>Selected LLM: {selectedLLM}</p>}
        </div>
    )
}

export default LLMselect;
import './App.css';
import Camera from './components/Camera.js';
import Graph from './components/Graph.js';
import Face from './components/Face.js';
import LLMselect from './components/LLMselect.js';

function App() {  
  return (
    <div className="App">
      
      <div className='container'>
        <LLMselect />
        <h1 className='header'>Live Camera</h1>
      </div>
      {/*<<h1 className='header'>Live Camera</h1>*/}
      <Camera />
      <h1>rPPG Graph</h1>
      <Graph />
      <h1>Face Map</h1>
      {/*<Face />*/}
    </div>
  );
}

export default App;

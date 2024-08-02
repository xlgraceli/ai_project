import './App.css';
import Camera from './components/Camera.js';
import Graph from './components/Graph.js';
//import LLMselect from './components/LLMselect.js';

function App() {  
  return (
    <div className="App">
      
      {/* <div className='container'>
        <LLMselect />
      </div> */}
      <h1 className='header'>Live Camera</h1>
      {/*<<h1 className='header'>Live Camera</h1>*/}
      <Camera />
      <h1>rPPG Graph</h1>
      <Graph />
    </div>
  );
}

export default App;

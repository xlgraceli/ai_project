import './App.css';
import Camera from './components/Camera.js';
import Graph from './components/Graph.js';
import Face from './components/Face.js';

function App() {
  return (
    <div className="App">
      <h1>Live Camera</h1>
      <Camera />
      <h1>rPPG Graph</h1>
      <Graph />
      <h1>Face Map</h1>
      <Face />
    </div>
  );
}

export default App;

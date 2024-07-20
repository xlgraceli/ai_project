import './App.css';
import Camera from './components/Camera.js';
import Graph from './components/Graph.js';

function App() {
  return (
    <div className="App">
      <h1>Live Camera</h1>
      <Camera />
      <h1>rPPG Graph</h1>
      <Graph />
    </div>
  );
}

export default App;

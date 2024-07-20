import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';
import './Components.css';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

const Graph = () => {
  const [chartData, setChartData] = useState({});
  const [labels, setLabels] = useState([]);
  const [data, setData] = useState([]);

  useEffect(() => {
    // Fetch or generate your rPPG data and labels here
    const fetchData = async () => {
      // Simulate fetching data
      const simulatedData = Array.from({ length: 100 }, () => Math.random() * 10);
      const simulatedLabels = Array.from({ length: 100 }, (_, i) => i / 10); // Simulated time in seconds

      setData(simulatedData);
      setLabels(simulatedLabels);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (data.length && labels.length) {
      setChartData({
        labels: labels,
        datasets: [
          {
            label: 'rPPG Signal',
            data: data,
            borderColor: 'rgba(75,192,192,1)',
            borderWidth: 2,
            fill: false,
          },
        ],
      });
    }
  }, [data, labels]);

  return (
    <div className='graph-container'>
      {chartData.labels && chartData.labels.length ? (
        <Line
          data={chartData}
          options={{
            responsive: true,
            scales: {
              x: {
                type: 'linear',
                position: 'bottom',
                title: {
                    display: true,
                    text: 'Time (seconds)',
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'rPPG Value',
                },
              },
            },
          }}
        />
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Graph;

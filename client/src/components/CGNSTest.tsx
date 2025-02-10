import React, { useEffect, useState } from 'react';
import { generateTestCGNSFile } from '../utils/CGNSTestGenerator';
import cgnsProcessor from '../services/cgnsProcessor';
import AirfoilViewer from './Viewer/AirfoilViewer';

const CGNSTest: React.FC = () => {
  const [testData, setTestData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testFile = async () => {
      try {
        // Generate test CGNS file
        const buffer = generateTestCGNSFile();
        
        // Create a File object from the buffer
        const file = new File([buffer], 'test.cgns', { type: 'application/octet-stream' });
        
        // Process the file
        const result = await cgnsProcessor.processCGNSFile(file);
        
        if (result.status === 'error') {
          setError(result.error);
        } else if (result.data) {
          setTestData(result.data);
          console.log('Parsed CGNS Data:', result.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      }
    };

    testFile();
  }, []);

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>Error Testing CGNS Parser</h2>
        <pre>{error}</pre>
      </div>
    );
  }

  if (!testData) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
        <h2>CGNS Test Visualization</h2>
        <div>
          <strong>Simulation Name:</strong> {testData.metadata.simulationName}
        </div>
        <div>
          <strong>Version:</strong> {testData.metadata.version}
        </div>
        <div>
          <strong>Vertices:</strong> {testData.mesh.vertices.length}
        </div>
        <div>
          <strong>Elements:</strong> {testData.mesh.elements.length}
        </div>
      </div>
      <AirfoilViewer
        geometryData={testData.mesh}
        simulationData={testData.solutions[0]}
      />
    </div>
  );
};

export default CGNSTest; 
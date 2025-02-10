// CGNSParser implementation
class CGNSParser {
  constructor(buffer) {
    console.log('Initializing CGNSParser with buffer size:', buffer.byteLength);
    this.buffer = buffer;
    this.dataView = new DataView(buffer);
    this.offset = 0;
  }

  parse() {
    try {
      console.log('Starting parse');
      if (!(this.buffer instanceof ArrayBuffer)) {
        throw new Error('Invalid buffer type');
      }

      // Create a simple test result
      const result = {
        metadata: {
          simulationName: 'Test',
          date: new Date().toISOString(),
          version: '1.0'
        },
        mesh: {
          vertices: Array.from({ length: 10 }, (_, i) => [i, i, i]),
          elements: Array.from({ length: 5 }, (_, i) => [i, i + 1, i + 2])
        },
        solutions: [{
          pressure: new Float32Array([1, 2, 3, 4, 5]),
          velocity: new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5])
        }]
      };

      console.log('Parse complete');
      return result;
    } catch (error) {
      console.error('Parse error:', error);
      throw error;
    }
  }
}

// Keep track of parser instance
let currentParser = null;

// Worker message handler
self.onmessage = (e) => {
  try {
    console.log('Worker received message:', e.data?.type);
    
    if (e.data?.type === 'process_cgns') {
      const buffer = e.data.data;
      if (!(buffer instanceof ArrayBuffer)) {
        throw new Error('Invalid buffer type received');
      }
      
      console.log('Buffer received, size:', buffer.byteLength);
      
      // Create new parser instance
      currentParser = new CGNSParser(buffer);
      const result = currentParser.parse();
      
      // Send result back immediately
      console.log('Sending result back');
      self.postMessage({ 
        type: 'result',
        result: result 
      });
    } else {
      throw new Error(`Unknown message type: ${e.data?.type}`);
    }
  } catch (error) {
    console.error('Worker processing error:', error);
    // Ensure error is sent back
    self.postMessage({ 
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
};

// Handle worker errors
self.onerror = (error) => {
  console.error('Worker global error:', error);
  self.postMessage({ 
    type: 'error',
    error: 'Worker encountered an error' 
  });
};

// Keep connection alive
setInterval(() => {
  self.postMessage({ type: 'heartbeat' });
}, 5000);

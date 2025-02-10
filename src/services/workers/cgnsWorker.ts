/// <reference lib="webworker" />

declare const self: Worker;

// Include CGNSParser directly in worker to avoid import issues
class CGNSParser {
  private buffer: ArrayBuffer;
  private dataView: DataView;
  private offset: number = 0;

  constructor(buffer: ArrayBuffer) {
    console.log('Initializing CGNSParser with buffer size:', buffer.byteLength);
    this.buffer = buffer;
    this.dataView = new DataView(buffer);
  }

  parse() {
    try {
      console.log('Starting parse');
      // Basic validation
      if (!(this.buffer instanceof ArrayBuffer)) {
        throw new Error('Invalid buffer type');
      }

      const result = {
        metadata: {
          simulationName: 'Test',
          date: new Date().toISOString(),
          version: '1.0'
        },
        mesh: {
          vertices: [],
          elements: []
        },
        solutions: []
      };

      console.log('Parse complete');
      return result;
    } catch (error) {
      console.error('Parse error:', error);
      throw error;
    }
  }
}

// Worker message handler
self.onmessage = async (e) => {
  console.log('Worker received message:', e.data?.type);
  
  if (e.data?.type === 'process_cgns') {
    try {
      const buffer = e.data.data;
      if (!(buffer instanceof ArrayBuffer)) {
        throw new Error('Invalid buffer type received');
      }
      
      console.log('Buffer received, size:', buffer.byteLength);
      
      const parser = new CGNSParser(buffer);
      const result = parser.parse();
      
      console.log('Sending result back');
      self.postMessage({ result });
    } catch (error) {
      console.error('Worker processing error:', error);
      self.postMessage({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
    }
  } else {
    console.error('Unknown message type:', e.data?.type);
    self.postMessage({ 
      error: `Unknown message type: ${e.data?.type}` 
    });
  }
};

// Handle worker errors
self.onerror = (error) => {
  console.error('Worker global error:', error);
  self.postMessage({ 
    error: 'Worker encountered an error' 
  });
};

// Prevent TypeScript error about isolated modules
export {}; 
import { CGNSParser } from '../../utils/CGNSParser';

self.onmessage = async (e) => {
  if (e.data.type === 'process_cgns') {
    try {
      const buffer = e.data.data;
      const parser = new CGNSParser(buffer);
      const result = parser.parse();
      
      // Post the parsed data back to the main thread
      self.postMessage({ result });
    } catch (error) {
      self.postMessage({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
    }
  }
}; 
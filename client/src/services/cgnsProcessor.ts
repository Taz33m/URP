import { CGNSData, ProcessingResult } from '../../../shared/types/FileTypes';

class CGNSProcessor {
  private worker: Worker | null = null;

  constructor() {
    if (window.Worker) {
      this.worker = new Worker(new URL('./workers/cgnsWorker.ts', import.meta.url));
    }
  }

  async processCGNSFile(file: File): Promise<ProcessingResult> {
    try {
      if (!this.worker) {
        throw new Error('Web Workers are not supported in this environment');
      }

      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
          if (!event.target?.result) {
            reject(new Error('Failed to read file'));
            return;
          }

          this.worker!.postMessage({
            type: 'process_cgns',
            data: event.target.result
          });

          this.worker!.onmessage = (e) => {
            if (e.data.error) {
              resolve({
                status: 'error',
                error: e.data.error
              });
            } else {
              resolve({
                status: 'success',
                data: e.data.result
              });
            }
          };
        };

        reader.onerror = () => {
          reject(new Error('File reading failed'));
        };

        reader.readAsArrayBuffer(file);
      });
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async extractGeometry(cgnsData: CGNSData): Promise<Float32Array> {
    // Extract vertices from CGNS data and convert to Float32Array for Three.js
    const vertices = cgnsData.mesh.vertices.flat();
    return new Float32Array(vertices);
  }

  async extractSimulationData(cgnsData: CGNSData, timeStep: number = 0): Promise<{
    pressure: Float32Array;
    density: Float32Array;
    temperature: Float32Array;
    velocity: Float32Array;
  }> {
    const solution = cgnsData.solutions[timeStep];
    
    return {
      pressure: new Float32Array(solution.pressure),
      density: new Float32Array(solution.density),
      temperature: new Float32Array(solution.temperature),
      velocity: new Float32Array(solution.velocity.flat())
    };
  }

  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export default new CGNSProcessor(); 
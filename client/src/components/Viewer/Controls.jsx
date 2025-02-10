import React from 'react';

const Controls = ({
  onViewModeChange,
  onColorMapChange,
  onDataFieldChange,
  viewSettings,
}) => {
  const {
    viewMode = '3D',
    colorMap = 'rainbow',
    dataField = 'pressure',
  } = viewSettings || {};

  const colorMaps = ['rainbow', 'viridis', 'plasma', 'grayscale'];
  const dataFields = ['pressure', 'density', 'temperature', 'velocity'];
  const viewModes = ['3D', 'top', 'side', 'front'];

  return (
    <div className="viewer-controls">
      <div className="control-section">
        <h3>View Settings</h3>
        <div className="control-group">
          <label>View Mode:</label>
          <select 
            value={viewMode}
            onChange={(e) => onViewModeChange(e.target.value)}
          >
            {viewModes.map(mode => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Color Map:</label>
          <select
            value={colorMap}
            onChange={(e) => onColorMapChange(e.target.value)}
          >
            {colorMaps.map(map => (
              <option key={map} value={map}>{map}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Data Field:</label>
          <select
            value={dataField}
            onChange={(e) => onDataFieldChange(e.target.value)}
          >
            {dataFields.map(field => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
        </div>
      </div>

      <style jsx>{`
        .viewer-controls {
          background: rgba(255, 255, 255, 0.9);
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 1000;
        }

        .control-section {
          margin-bottom: 1rem;
        }

        .control-section h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          color: #333;
        }

        .control-group {
          margin-bottom: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        label {
          font-size: 0.9rem;
          color: #666;
        }

        select {
          padding: 0.25rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          font-size: 0.9rem;
        }

        select:hover {
          border-color: #999;
        }

        select:focus {
          outline: none;
          border-color: #0066cc;
          box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.2);
        }
      `}</style>
    </div>
  );
};

export default Controls; 
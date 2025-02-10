import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { readCGNSFiles } from '../../utils/fileUtils';

const FileManagerContainer = styled.div`
  position: absolute;
  left: 20px;
  top: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-width: 300px;
`;

const FileList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 10px 0;
`;

const FileItem = styled.li<{ active: boolean }>`
  padding: 8px 12px;
  margin: 4px 0;
  background: ${props => props.active ? '#e3f2fd' : '#f5f5f5'};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e3f2fd;
  }
`;

const DatasetSelector = styled.select`
  width: 100%;
  padding: 8px;
  margin: 8px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

interface FileManagerProps {
  onFileSelect: (fileData: any) => void;
}

const FileManager: React.FC<FileManagerProps> = ({ onFileSelect }) => {
  const [files, setFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [datasets, setDatasets] = useState<string[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

  useEffect(() => {
    // Load available CGNS files from the data directory
    const loadFiles = async () => {
      try {
        const availableFiles = await readCGNSFiles();
        setFiles(availableFiles);
        if (availableFiles.length > 0) {
          setActiveFile(availableFiles[0]);
        }
      } catch (error) {
        console.error('Error loading CGNS files:', error);
      }
    };

    loadFiles();
  }, []);

  useEffect(() => {
    if (activeFile) {
      // Load datasets from the selected file
      // This would be implemented in the backend/worker
      setDatasets(['pressure', 'velocity', 'density', 'temperature']);
      setSelectedDataset('pressure');
    }
  }, [activeFile]);

  const handleFileSelect = (filename: string) => {
    setActiveFile(filename);
    // Here we would load the actual file data and pass it to the parent
    onFileSelect({
      filename,
      dataset: selectedDataset
    });
  };

  return (
    <FileManagerContainer>
      <h3>CGNS Files</h3>
      <FileList>
        {files.map(file => (
          <FileItem
            key={file}
            active={file === activeFile}
            onClick={() => handleFileSelect(file)}
          >
            {file}
          </FileItem>
        ))}
      </FileList>

      <h4>Dataset</h4>
      <DatasetSelector
        value={selectedDataset || ''}
        onChange={(e) => setSelectedDataset(e.target.value)}
      >
        {datasets.map(dataset => (
          <option key={dataset} value={dataset}>
            {dataset.charAt(0).toUpperCase() + dataset.slice(1)}
          </option>
        ))}
      </DatasetSelector>
    </FileManagerContainer>
  );
};

export default FileManager;

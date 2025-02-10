import React, { useState } from 'react';
import CGNSTest from './components/CGNSTest';
import FileList from './components/FileList/FileList';
import styled from 'styled-components';

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  display: flex;
  overflow: hidden;
`;

function App() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleFileSelect = (filename: string) => {
    setSelectedFile(filename);
  };

  return (
    <AppContainer>
      <FileList onFileSelect={handleFileSelect} />
      <CGNSTest selectedFile={selectedFile} />
    </AppContainer>
  );
}

export default App;
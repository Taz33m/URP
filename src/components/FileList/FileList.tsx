import React, { useEffect, useState } from 'react';
import { Box, List, ListItem, ListItemButton, ListItemText, Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { listCGNSFiles } from '../../services/api';

const FileListContainer = styled(Paper)({
  width: '300px',
  height: '100vh',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  overflow: 'auto',
  borderRadius: 0
});

interface FileListProps {
  onFileSelect: (filename: string) => void;
}

const FileList: React.FC<FileListProps> = ({ onFileSelect }) => {
  const [files, setFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const fileList = await listCGNSFiles();
        setFiles(fileList);
        setError(null);
      } catch (err) {
        setError('Failed to load CGNS files');
        console.error('Error loading files:', err);
      }
    };

    fetchFiles();
  }, []);

  return (
    <FileListContainer>
      <Box p={2}>
        <Typography variant="h6" gutterBottom>
          CGNS Files
        </Typography>
        {error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <List>
            {files.map((file) => (
              <ListItem key={file} disablePadding>
                <ListItemButton onClick={() => onFileSelect(file)}>
                  <ListItemText primary={file} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </FileListContainer>
  );
};

export default FileList;

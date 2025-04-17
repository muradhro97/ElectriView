import { useState, useEffect } from 'react';

interface StoredFile {
  name: string;
  size: string;
  date: string;
  fileObj: File;
}

export function useJsonStorage() {
  const [recentFiles, setRecentFiles] = useState<StoredFile[]>([]);
  
  // Load recent files from localStorage on mount
  useEffect(() => {
    try {
      // We can't store File objects in localStorage, so this is a mock implementation
      // In a real app, we would store file metadata and potentially use IndexedDB for the actual files
      
      // This simulates having recent files for UI display purposes
      const mockRecentFiles = [];
      
      // Set recent files state
      setRecentFiles(mockRecentFiles);
    } catch (error) {
      console.error("Failed to load recent files", error);
    }
  }, []);
  
  // Add a file to recent files
  const addRecentFile = (file: File) => {
    // Format file size
    const size = formatFileSize(file.size);
    
    // Format date
    const date = new Date().toLocaleDateString();
    
    // Create new entry
    const newFile: StoredFile = {
      name: file.name,
      size,
      date,
      fileObj: file
    };
    
    // Update state (would typically save to storage as well)
    setRecentFiles(prev => {
      // Remove duplicates
      const filteredFiles = prev.filter(f => f.name !== file.name);
      
      // Add new file at the beginning, limit to 5 recent files
      return [newFile, ...filteredFiles].slice(0, 5);
    });
  };
  
  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  return {
    recentFiles,
    addRecentFile
  };
}

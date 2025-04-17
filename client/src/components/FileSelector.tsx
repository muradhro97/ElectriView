import { useState, useRef, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useJsonStorage } from "@/hooks/useJsonStorage";

interface FileSelectorProps {
  onFileSelected: (file: File) => void;
}

export default function FileSelector({ onFileSelected }: FileSelectorProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { recentFiles } = useJsonStorage();
  
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };
  
  const handleFile = (file?: File) => {
    if (!file) return;
    
    // Validate file type
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      toast({
        title: "Invalid file format",
        description: "Please select a JSON file",
        variant: "destructive"
      });
      return;
    }
    
    onFileSelected(file);
  };
  
  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, []);
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-20 p-4">
      <div className="bg-surface rounded-lg shadow-xl p-6 mx-4 max-w-md w-full">
        <div className="text-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-primary mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <path d="M10 12a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2z"></path>
          </svg>
          <h2 className="text-xl font-semibold mb-1">Select Electrical Plan File</h2>
          <p className="text-textSecondary text-sm">Choose a JSON file to visualize the electrical plan</p>
        </div>
        
        <div 
          className={`border-2 border-dashed ${isDragging ? 'border-primary' : 'border-primary/40'} rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-primary mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <p className="font-medium mb-1">Drag & Drop your file here</p>
          <p className="text-textSecondary text-sm mb-4">or</p>
          <button className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-md transition-colors">
            Browse Files
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            accept=".json" 
            className="hidden" 
            onChange={handleFileChange}
          />
        </div>
        
        {recentFiles.length > 0 && (
          <div className="mt-5">
            <div className="text-xs text-textSecondary mb-2">Recent files:</div>
            {recentFiles.map((file, index) => (
              <div 
                key={index}
                className="flex items-center bg-background rounded-md p-3 mb-2 cursor-pointer hover:bg-surface/80 transition-colors"
                onClick={() => onFileSelected(file.fileObj)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-textSecondary">{file.size} · {file.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';

interface ControlBarProps {
  onFitToScreen: () => void;
  onResetView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onChangeFile: () => void;
  onToggleInfo: () => void;
  onToggleSelection?: () => void;
  selectionActive?: boolean;
}

export default function ControlBar({
  onFitToScreen,
  onResetView,
  onZoomIn,
  onZoomOut,
  onChangeFile,
  onToggleInfo,
  onToggleSelection,
  selectionActive = false
}: ControlBarProps) {
  return (
    <motion.div 
      className="bg-surface px-2 py-3 flex justify-center items-center z-10"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between w-full max-w-md">
        <button 
          onClick={onFitToScreen}
          className="p-2.5 rounded-full hover:bg-background/50 transition-colors" 
          title="Fit to Screen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        </button>
        
        <button 
          onClick={onToggleInfo}
          className="p-2.5 rounded-full hover:bg-background/50 transition-colors" 
          title="Plan Info"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </button>
        
        {onToggleSelection && (
          <button 
            onClick={onToggleSelection}
            className={`p-2.5 rounded-full hover:bg-background/50 transition-colors ${selectionActive ? 'bg-primary/25 ring-1 ring-primary' : ''}`} 
            title="Rectangle Selection Tool"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            </svg>
          </button>
        )}
        
        <div className="flex items-center bg-background/40 rounded-full">
          <button 
            onClick={onZoomOut}
            className="p-2.5 rounded-full hover:bg-background/70 transition-colors" 
            title="Zoom Out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          
          <button 
            onClick={onZoomIn}
            className="p-2.5 rounded-full hover:bg-background/70 transition-colors" 
            title="Zoom In"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
        </div>
        
        <button 
          onClick={onResetView}
          className="p-2.5 rounded-full hover:bg-background/50 transition-colors" 
          title="Reset View"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
        </button>
        
        <button 
          onClick={onChangeFile}
          className="p-2.5 rounded-full hover:bg-background/50 transition-colors" 
          title="Change File"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="10" y1="12" x2="14" y2="12"></line>
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

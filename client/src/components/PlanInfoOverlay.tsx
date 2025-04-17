import { motion } from 'framer-motion';
import { ElectricalPlanData } from '@/types';

interface PlanInfoOverlayProps {
  data: ElectricalPlanData;
  fileName: string;
  onClose: () => void;
}

export default function PlanInfoOverlay({ data, fileName, onClose }: PlanInfoOverlayProps) {
  // Calculate statistics
  const routesCount = Object.keys(data.SingleRoutesInfoDict || {}).length;
  const panelsCount = Object.keys(data.PanelsDataDict || {}).length;
  const fixturesCount = data.ViewLines?.ElectricalFixture?.length || 0;
  const fittingsCount = data.ViewLines?.ConduitFittings?.length || 0;
  
  return (
    <motion.div 
      className="absolute bottom-20 left-4 right-4 bg-surface/95 backdrop-blur-sm rounded-lg p-4 shadow-lg z-20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold">Plan Details</h3>
        <button 
          onClick={onClose}
          className="text-textSecondary hover:text-textPrimary transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div className="overflow-y-auto max-h-52 no-scrollbar">
        <div className="mb-2">
          <span className="text-xs text-textSecondary">File name:</span>
          <div className="text-sm font-medium">{fileName}</div>
        </div>
        
        <div className="mb-2">
          <span className="text-xs text-textSecondary">View name:</span>
          <div className="text-sm font-medium">{data.ViewName || "Unnamed View"}</div>
        </div>
        
        <div className="mb-2">
          <span className="text-xs text-textSecondary">Elements:</span>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="bg-background rounded p-2 text-center">
              <span className="text-xs text-textSecondary block">Routes</span>
              <span className="text-sm font-medium">{routesCount}</span>
            </div>
            <div className="bg-background rounded p-2 text-center">
              <span className="text-xs text-textSecondary block">Panels</span>
              <span className="text-sm font-medium">{panelsCount}</span>
            </div>
            <div className="bg-background rounded p-2 text-center">
              <span className="text-xs text-textSecondary block">Fixtures</span>
              <span className="text-sm font-medium">{fixturesCount}</span>
            </div>
            <div className="bg-background rounded p-2 text-center">
              <span className="text-xs text-textSecondary block">Fittings</span>
              <span className="text-sm font-medium">{fittingsCount}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

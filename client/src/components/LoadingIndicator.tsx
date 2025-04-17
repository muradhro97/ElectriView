import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LoadingIndicatorProps {
  message?: string;
}

export default function LoadingIndicator({ message = "Loading..." }: LoadingIndicatorProps) {
  const [dots, setDots] = useState('.');
  
  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length < 3 ? prev + '.' : '.');
    }, 400);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-20">
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
        <p className="text-lg font-medium mb-1">Loading plan{dots}</p>
        <p className="text-sm text-textSecondary">{message}</p>
      </motion.div>
    </div>
  );
}

import { motion } from 'framer-motion';

interface Layer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

interface LayersPanelProps {
  layers: Layer[];
  onToggleLayer: (id: string, visible: boolean) => void;
}

export default function LayersPanel({ layers, onToggleLayer }: LayersPanelProps) {
  return (
    <motion.div 
      className="mt-2 bg-surface/95 backdrop-blur-sm rounded-lg shadow-lg p-3"
      initial={{ opacity: 0, scale: 0.9, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="text-sm font-medium mb-2">Layers</div>
      
      {layers.map((layer) => (
        <div key={layer.id} className="flex items-center mb-2 last:mb-0">
          <input 
            type="checkbox" 
            id={`layer-${layer.id}`} 
            className="w-4 h-4 rounded text-primary focus:ring-primary"
            checked={layer.visible}
            onChange={(e) => onToggleLayer(layer.id, e.target.checked)}
          />
          <label htmlFor={`layer-${layer.id}`} className="ml-2 text-sm flex items-center">
            <span 
              className="inline-block w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: layer.color }}
            ></span>
            {layer.name}
          </label>
        </div>
      ))}
    </motion.div>
  );
}

import React, { useState, useEffect, useRef, useMemo, useImperativeHandle } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Text } from "react-konva";
import * as d3 from "d3";
import useContainerSize from "@/hooks/useContainerSize";
import LayersPanel from "@/components/LayersPanel";
import { ElectricalPlanData } from "@/types";

interface ElectricalPlanViewerProps {
  data: ElectricalPlanData;
  setViewerInstance: (instance: any) => void;
}

const ElectricalPlanViewer: React.FC<ElectricalPlanViewerProps> = ({ 
  data, 
  setViewerInstance 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const imageRef = useRef<any>(null);
  const { width, height } = useContainerSize(containerRef);
  
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState({
    equipment: true,
    fittings: true,
    fixtures: true,
    routes: true,
    other: true
  });

  // Colors for different elements
  const colors = {
    equipment: "#3b82f6", // Blue
    fittings: "#10b981",  // Green
    fixtures: "#f59e0b",  // Amber
    routes: "#f97316",    // Orange
    other: "#94a3b8"      // Gray
  };

  // Create viewer instance to expose methods to parent
  useEffect(() => {
    const instance = {
      zoomIn: () => handleZoom(1.2),
      zoomOut: () => handleZoom(0.8),
      resetView: () => resetView(),
      fitToScreen: () => fitToScreen(),
    };
    
    setViewerInstance(instance);
  }, [setViewerInstance]);

  // Process background elements
  const backgroundElements = useMemo(() => {
    const elems: any[] = [];

    // Panel lines
    if (data.PanelsDataDict) {
      Object.values(data.PanelsDataDict).forEach((element) => {
        if (element.Lines2D) {
          element.Lines2D.forEach((line) => {
            if (line.Start && line.End) {
              elems.push({ ...line, type: "PanelLine", color: colors.other });
            }
          });
        }
      });
    }

    // Other view lines
    if (data.ViewLines) {
      // Other lines
      if (data.ViewLines.Other && visibleLayers.other) {
        data.ViewLines.Other.forEach((line) => {
          if (line.Start && line.End) {
            elems.push({...line, type: "Other", color: colors.other});
          }
        });
      }

      // Electrical equipment
      if (data.ViewLines.ElectricalEquipment && visibleLayers.equipment) {
        data.ViewLines.ElectricalEquipment.forEach((line) => {
          if (line.Start && line.End) {
            elems.push({...line, type: "ElectricalEquipment", color: colors.equipment});
          }
        });
      }

      // Conduit fittings
      if (data.ViewLines.ConduitFittings && visibleLayers.fittings) {
        data.ViewLines.ConduitFittings.forEach((line) => {
          if (line.Start && line.End) {
            elems.push({...line, type: "ConduitFittings", color: colors.fittings});
          }
        });
      }

      // Electrical fixtures
      if (data.ViewLines.ElectricalFixture && visibleLayers.fixtures) {
        data.ViewLines.ElectricalFixture.forEach((line) => {
          if (line.Start && line.End) {
            elems.push({...line, type: "ElectricalFixture", color: colors.fixtures});
          }
        });
      }
    }

    return elems;
  }, [data, visibleLayers, colors]);

  // Process route elements
  const routeElements = useMemo(() => {
    const elems: any[] = [];
    
    if (data.SingleRoutesInfoDict && visibleLayers.routes) {
      Object.values(data.SingleRoutesInfoDict).forEach((route) => {
        if (route.Route2D && route.Route2D.Segments) {
          route.Route2D.Segments.forEach((segment) => {
            if (
              segment.Segment2D &&
              segment.Segment2D.Start &&
              segment.Segment2D.End
            ) {
              elems.push({
                Start: segment.Segment2D.Start,
                End: segment.Segment2D.End,
                type: "RouteSegment",
                color: colors.routes,
                label: route.RunName || "",
              });
            }
          });
        }
      });
    }
    
    return elems;
  }, [data, visibleLayers.routes, colors.routes]);

  // Combine all elements for domain calculation
  const allElements = useMemo(() => [...backgroundElements, ...routeElements], [
    backgroundElements,
    routeElements,
  ]);

  // Compute domains for scaling
  const xDomain = useMemo(() => {
    if (allElements.length === 0) return [0, 100];
    const minX = d3.min(allElements, (d) => Math.min(d.Start.X, d.End.X)) || 0;
    const maxX = d3.max(allElements, (d) => Math.max(d.Start.X, d.End.X)) || width;
    return [minX, maxX];
  }, [allElements, width]);

  const yDomain = useMemo(() => {
    if (allElements.length === 0) return [0, 100];
    const minY = d3.min(allElements, (d) => Math.min(d.Start.Y, d.End.Y)) || 0;
    const maxY = d3.max(allElements, (d) => Math.max(d.Start.Y, d.End.Y)) || height;
    return [minY, maxY];
  }, [allElements, height]);

  // Create scales mapping data coordinates to canvas coordinates
  const margin = 20;
  const xScale = useMemo(
    () => d3.scaleLinear().domain(xDomain).range([margin, width - margin]).nice(),
    [xDomain, width, margin]
  );
  
  const yScale = useMemo(
    () => d3.scaleLinear().domain(yDomain).range([height - margin, margin]).nice(),
    [yDomain, height, margin]
  );

  // Create offscreen canvas for background drawing
  const offscreenCanvas = useMemo(() => {
    if (width === 0 || height === 0) return null;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }, [width, height]);

  // Draw background elements on offscreen canvas
  useEffect(() => {
    if (!offscreenCanvas) return;
    
    const context = offscreenCanvas.getContext("2d");
    if (!context) return;
    
    context.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    context.fillStyle = "#0f0f17"; // Background color
    context.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    // Draw grid
    context.strokeStyle = "rgba(50, 50, 70, 0.2)";
    context.lineWidth = 0.5;
    
    const gridSize = 50;
    const gridOffsetX = position.x % gridSize;
    const gridOffsetY = position.y % gridSize;
    
    for (let x = gridOffsetX; x < width; x += gridSize) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    
    for (let y = gridOffsetY; y < height; y += gridSize) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    // Draw background elements
    backgroundElements.forEach((line) => {
      context.beginPath();
      context.moveTo(xScale(line.Start.X), yScale(line.Start.Y));
      context.lineTo(xScale(line.End.X), yScale(line.End.Y));
      context.strokeStyle = line.color;
      context.lineWidth = 1;
      context.stroke();
    });
    
    if (imageRef.current) {
      imageRef.current.getLayer().batchDraw();
    }
  }, [offscreenCanvas, backgroundElements, xScale, yScale, width, height, position]);

  // Handle wheel zoom
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    const direction = e.evt.deltaY > 0 ? 0.9 : 1.1;
    const newScale = oldScale * direction;
    
    // Limit scale
    const limitedScale = Math.min(Math.max(0.1, newScale), 10);
    
    stage.scale({ x: limitedScale, y: limitedScale });
    setScale(limitedScale);
    
    const newPos = {
      x: pointer.x - mousePointTo.x * limitedScale,
      y: pointer.y - mousePointTo.y * limitedScale,
    };
    
    stage.position(newPos);
    setPosition(newPos);
    stage.batchDraw();
  };

  // Programmatic zoom function
  const handleZoom = (factor: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    
    // Zoom centered on canvas
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Convert center to canvas coordinates
    const oldScale = stage.scaleX();
    const centerPointTo = {
      x: (centerX - stage.x()) / oldScale,
      y: (centerY - stage.y()) / oldScale,
    };
    
    // Apply zoom
    const newScale = oldScale * factor;
    
    // Limit scale
    const limitedScale = Math.min(Math.max(0.1, newScale), 10);
    
    stage.scale({ x: limitedScale, y: limitedScale });
    setScale(limitedScale);
    
    // Adjust position
    const newPos = {
      x: centerX - centerPointTo.x * limitedScale,
      y: centerY - centerPointTo.y * limitedScale,
    };
    
    stage.position(newPos);
    setPosition(newPos);
    stage.batchDraw();
  };

  // Reset view to initial state
  const resetView = () => {
    const stage = stageRef.current;
    if (!stage) return;
    
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    setScale(1);
    setPosition({ x: 0, y: 0 });
    stage.batchDraw();
  };

  // Fit contents to screen
  const fitToScreen = () => {
    if (!stageRef.current || allElements.length === 0) return;
    
    // Calculate the bounding box of all elements
    const minX = d3.min(allElements, d => Math.min(d.Start.X, d.End.X)) || 0;
    const maxX = d3.max(allElements, d => Math.max(d.Start.X, d.End.X)) || 100;
    const minY = d3.min(allElements, d => Math.min(d.Start.Y, d.End.Y)) || 0;
    const maxY = d3.max(allElements, d => Math.max(d.Start.Y, d.End.Y)) || 100;
    
    // Calculate the scale to fit the bounding box
    const elementWidth = maxX - minX;
    const elementHeight = maxY - minY;
    
    if (elementWidth === 0 || elementHeight === 0) return;
    
    const scaleX = (width - margin * 2) / elementWidth;
    const scaleY = (height - margin * 2) / elementHeight;
    const newScale = Math.min(scaleX, scaleY) * 0.9; // 90% to leave some margin
    
    // Apply the transform
    const stage = stageRef.current;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    stage.scale({ x: newScale, y: newScale });
    setScale(newScale);
    
    const newPos = {
      x: (width / 2) - (centerX * xScale.range()[1] / xDomain[1]) * newScale,
      y: (height / 2) - (centerY * yScale.range()[0] / yDomain[1]) * newScale
    };
    
    stage.position(newPos);
    setPosition(newPos);
    stage.batchDraw();
  };

  // Toggle layers panel
  const handleToggleLayers = () => {
    setShowLayersPanel(!showLayersPanel);
  };

  // Update layer visibility
  const handleLayerToggle = (layer: keyof typeof visibleLayers, value: boolean) => {
    setVisibleLayers(prev => ({
      ...prev,
      [layer]: value
    }));
  };

  if (width === 0 || height === 0) {
    return <div ref={containerRef} className="absolute inset-0 bg-background"></div>;
  }

  return (
    <div ref={containerRef} className="absolute inset-0 bg-background overflow-hidden">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        draggable
        onWheel={handleWheel}
        onDragEnd={(e) => {
          setPosition(e.target.position());
        }}
      >
        {/* Background Layer */}
        <Layer>
          {offscreenCanvas && <KonvaImage ref={imageRef} image={offscreenCanvas} />}
        </Layer>
        
        {/* Vector Elements Layer */}
        <Layer>
          {routeElements.map((elem, index) => (
            <Line
              key={`route-${index}`}
              points={[
                xScale(elem.Start.X),
                yScale(elem.Start.Y),
                xScale(elem.End.X),
                yScale(elem.End.Y),
              ]}
              stroke={elem.color}
              strokeWidth={2}
              lineCap="round"
              lineJoin="round"
            />
          ))}
        </Layer>
      </Stage>
      
      {/* Zoom Level Indicator */}
      <div className="absolute top-4 right-4 bg-surface/80 backdrop-blur-sm rounded-md px-3 py-1.5 text-sm font-medium">
        {Math.round(scale * 100)}%
      </div>
      
      {/* Layer Toggle Panel */}
      <div className="absolute top-4 left-4">
        <button 
          onClick={handleToggleLayers}
          className="bg-surface/80 backdrop-blur-sm rounded-full p-2.5 shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
        </button>
        
        {showLayersPanel && (
          <LayersPanel 
            layers={[
              { id: 'equipment', name: 'Electrical Equipment', color: colors.equipment, visible: visibleLayers.equipment },
              { id: 'fittings', name: 'Conduit Fittings', color: colors.fittings, visible: visibleLayers.fittings },
              { id: 'fixtures', name: 'Electrical Fixtures', color: colors.fixtures, visible: visibleLayers.fixtures },
              { id: 'routes', name: 'Routes', color: colors.routes, visible: visibleLayers.routes },
              { id: 'other', name: 'Other Elements', color: colors.other, visible: visibleLayers.other }
            ]}
            onToggleLayer={handleLayerToggle}
          />
        )}
      </div>
    </div>
  );
};

export default ElectricalPlanViewer;

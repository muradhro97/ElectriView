import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Rect, Group } from "react-konva";
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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectionRect, setSelectionRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
    startX: number;
    startY: number;
  }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: false,
    startX: 0,
    startY: 0
  });
  const [selectedRoutes, setSelectedRoutes] = useState<number[]>([]);
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
      toggleSelectionMode: () => toggleSelectionMode(),
    };

    setViewerInstance(instance);
  }, [setViewerInstance]);

  // Toggle selection mode
  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => !prev);
    setSelectionRect({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      visible: false,
      startX: 0,
      startY: 0
    });
    setSelectedRoutes([]);

    // Toggle stage draggability based on selection mode
    if (stageRef.current) {
      stageRef.current.draggable(!selectionMode);
    }
  }, [selectionMode]);

  // Process background elements - with performance optimizations
  const backgroundElements = useMemo(() => {
    const elems: any[] = [];

    // For large datasets, limit the number of displayed elements to improve performance
    const MAX_ELEMENTS_PER_CATEGORY = 10000; // Limit to prevent performance issues

    // Panel lines - white color as requested
    if (data.PanelsDataDict) {
      let count = 0;
      for (const panelId in data.PanelsDataDict) {
        const element = data.PanelsDataDict[panelId];
        if (!element.Lines2D) continue;

        for (let i = 0; i < element.Lines2D.length && count < MAX_ELEMENTS_PER_CATEGORY; i++) {
          const line = element.Lines2D[i];
          if (line.Start && line.End) {
            elems.push({ ...line, type: "Line2D", color: "white" });
            count++;
          }
        }

        if (count >= MAX_ELEMENTS_PER_CATEGORY) break;
      }
    }

    // Other view lines - exactly as requested in the same order
    if (data.ViewLines) {
      // Other lines - gray color
      if (data.ViewLines.Other) {
        const lines = data.ViewLines.Other;
        const totalLines = Math.min(lines.length, MAX_ELEMENTS_PER_CATEGORY);

        for (let i = 0; i < totalLines; i++) {
          const line = lines[i];
          if (line.Start && line.End) {
            elems.push({...line, type: "Line2D", color: "gray"});
          }
        }
      }

      // Electrical equipment - blue color
      if (data.ViewLines.ElectricalEquipment) {
        const lines = data.ViewLines.ElectricalEquipment;
        const totalLines = Math.min(lines.length, MAX_ELEMENTS_PER_CATEGORY);

        for (let i = 0; i < totalLines; i++) {
          const line = lines[i];
          if (line.Start && line.End) {
            elems.push({...line, type: "Line2D", color: "blue"});
          }
        }
      }

      // Conduit fittings - green color
      if (data.ViewLines.ConduitFittings) {
        const lines = data.ViewLines.ConduitFittings;
        const totalLines = Math.min(lines.length, MAX_ELEMENTS_PER_CATEGORY);

        for (let i = 0; i < totalLines; i++) {
          const line = lines[i];
          if (line.Start && line.End) {
            elems.push({...line, type: "Line2D", color: "green"});
          }
        }
      }

      // Electrical fixtures - yellow color
      if (data.ViewLines.ElectricalFixture) {
        const lines = data.ViewLines.ElectricalFixture;
        const totalLines = Math.min(lines.length, MAX_ELEMENTS_PER_CATEGORY);

        for (let i = 0; i < totalLines; i++) {
          const line = lines[i];
          if (line.Start && line.End) {
            elems.push({...line, type: "Line2D", color: "yellow"});
          }
        }
      }

      // Alternative iteration method as requested - processing all ViewLines items as gray
      Object.values(data.ViewLines).forEach((element: any) => {
        if (element && Array.isArray(element)) {
          element.forEach((line: any) => {
            if (line && line.Start && line.End) {
              elems.push({ ...line, type: "Line2D", color: "gray" });
            }
          });
        }
      });
    }

    return elems;
  }, [data]);

  // Process route elements with performance optimizations
  const routeElements = useMemo(() => {
    const elems: any[] = [];
    const MAX_ROUTES = 15000; // Limit to prevent performance issues
    let routeCount = 0;

    if (data.SingleRoutesInfoDict && visibleLayers.routes) {
      const routes = Object.values(data.SingleRoutesInfoDict);

      // Process routes up to our limit
      for (const route of routes) {
        if (!route.Route2D || !route.Route2D.Segments) continue;

        for (const segment of route.Route2D.Segments) {
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
              routeId: route.Id || ""
            });

            routeCount++;
            if (routeCount >= MAX_ROUTES) break;
          }
        }

        if (routeCount >= MAX_ROUTES) break;
      }
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
      context.lineWidth = 0.1; // Thinner lines to avoid overlapping
      context.stroke();
    });

    if (imageRef.current) {
      imageRef.current.getLayer().batchDraw();
    }
  }, [offscreenCanvas, backgroundElements, xScale, yScale, width, height, position]);

  // Create throttle function for wheel events
  const throttleRef = useRef<{lastCall: number, timer: any}>({ lastCall: 0, timer: null });
  
  // Handle wheel zoom with performance optimizations
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    
    const now = Date.now();
    const throttleTime = 20; // ms between allowed wheel events
    
    // Throttle wheel events
    if (now - throttleRef.current.lastCall < throttleTime) {
      return;
    }
    
    throttleRef.current.lastCall = now;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    // Use requestAnimationFrame for smoother rendering
    requestAnimationFrame(() => {
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      
      if (!pointer) return;
      
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };
      
      // Calculate zoom factor based on delta
      const direction = e.evt.deltaY > 0 ? 0.9 : 1.1;
      const newScale = oldScale * direction;
      
      // Limit scale
      const limitedScale = Math.min(Math.max(0.1, newScale), 10);
      
      // Update stage scale
      stage.scale({ x: limitedScale, y: limitedScale });
      
      // Calculate new position
      const newPos = {
        x: pointer.x - mousePointTo.x * limitedScale,
        y: pointer.y - mousePointTo.y * limitedScale,
      };
      
      // Apply new position
      stage.position(newPos);
      
      // Optimize by only updating state after zooming stops
      if (throttleRef.current.timer) {
        clearTimeout(throttleRef.current.timer);
      }
      
      // Use lightweight local updates during active zooming
      // Only update React state when zooming stops
      throttleRef.current.timer = setTimeout(() => {
        setScale(limitedScale);
        setPosition(newPos);
      }, 100);
      
      // Use batchDraw for performance
      stage.batchDraw();
    });
  }, []);

  // Programmatic zoom function with performance optimizations
  const handleZoom = useCallback((factor: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    
    // Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
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
      
      // Apply transformation
      stage.scale({ x: limitedScale, y: limitedScale });
      
      // Adjust position
      const newPos = {
        x: centerX - centerPointTo.x * limitedScale,
        y: centerY - centerPointTo.y * limitedScale,
      };
      
      stage.position(newPos);
      
      // Defer state updates to reduce render cycles during animation
      if (throttleRef.current.timer) {
        clearTimeout(throttleRef.current.timer);
      }
      
      throttleRef.current.timer = setTimeout(() => {
        setScale(limitedScale);
        setPosition(newPos);
      }, 50);
      
      // Use more efficient draw
      stage.batchDraw();
    });
  }, [width, height]);

  // Reset view to initial state with performance optimizations
  const resetView = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    
    // Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
      // Reset scale and position
      stage.scale({ x: 1, y: 1 });
      stage.position({ x: 0, y: 0 });
      
      // Update state after animation completes
      setScale(1);
      setPosition({ x: 0, y: 0 });
      
      // Use more efficient draw
      stage.batchDraw();
    });
  }, []);

  // Fit contents to screen with performance optimizations
  const fitToScreen = useCallback(() => {
    if (!stageRef.current || allElements.length === 0) return;
    
    // Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
      // Calculate the bounding box of all elements
      // Using memoized values from xDomain and yDomain instead of recalculating
      const minX = xDomain[0];
      const maxX = xDomain[1];
      const minY = yDomain[0];
      const maxY = yDomain[1];
      
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
      
      // Calculate new position
      const newPos = {
        x: (width / 2) - (centerX * xScale.range()[1] / xDomain[1]) * newScale,
        y: (height / 2) - (centerY * yScale.range()[0] / yDomain[1]) * newScale
      };
      
      stage.position(newPos);
      
      // Use a delayed state update to prevent React re-renders during animation
      if (throttleRef.current.timer) {
        clearTimeout(throttleRef.current.timer);
      }
      
      throttleRef.current.timer = setTimeout(() => {
        setScale(newScale);
        setPosition(newPos);
      }, 50);
      
      // Use more efficient draw
      stage.batchDraw();
    });
  }, [allElements, width, height, margin, xDomain, yDomain, xScale]);

  // Toggle layers panel
  const handleToggleLayers = () => {
    setShowLayersPanel(!showLayersPanel);
  };

  // Update layer visibility
  const handleLayerToggle = (id: string, value: boolean) => {
    // Cast id to the correct type if it's a valid layer key
    if (id in visibleLayers) {
      const layer = id as keyof typeof visibleLayers;
      setVisibleLayers(prev => ({
        ...prev,
        [layer]: value
      }));
    }
  };

  // Handle mouse down for selection
  const handleMouseDown = useCallback((e: any) => {
    if (!selectionMode) return;

    // Get mouse position relative to the stage
    const stage = stageRef.current;
    const pointerPos = stage.getPointerPosition();

    // Store the selection start point and current position
    setSelectionRect({
      x: pointerPos.x,
      y: pointerPos.y,
      width: 0,
      height: 0,
      visible: true,
      startX: pointerPos.x,
      startY: pointerPos.y
    });
  }, [selectionMode]);

  // Handle mouse move for selection
  const handleMouseMove = useCallback((e: any) => {
    if (!selectionMode || !selectionRect.visible) return;

    const stage = stageRef.current;
    const pointerPos = stage.getPointerPosition();

    // Calculate width and height based on start point
    const newWidth = pointerPos.x - selectionRect.startX;
    const newHeight = pointerPos.y - selectionRect.startY;

    // Determine the correct position for the rectangle
    const newX = newWidth >= 0 ? selectionRect.startX : pointerPos.x;
    const newY = newHeight >= 0 ? selectionRect.startY : pointerPos.y;

    // Set the absolute values for width and height
    const absWidth = Math.abs(newWidth);
    const absHeight = Math.abs(newHeight);

    setSelectionRect(prev => ({
      ...prev,
      x: newX,
      y: newY,
      width: absWidth,
      height: absHeight
    }));
  }, [selectionMode, selectionRect]);

  // Handle mouse up for selection
  const handleMouseUp = useCallback(() => {
    if (!selectionMode || !selectionRect.visible) return;

    // Convert selection rectangle to stage coordinates
    const stage = stageRef.current;
    const stageScale = stage.scaleX();
    const stagePos = stage.position();

    // Calculate selection rectangle in stage coordinates
    const selectionX1 = (selectionRect.x - stagePos.x) / stageScale;
    const selectionY1 = (selectionRect.y - stagePos.y) / stageScale;
    const selectionX2 = selectionX1 + selectionRect.width / stageScale;
    const selectionY2 = selectionY1 + selectionRect.height / stageScale;

    // Convert back to data coordinates using inverse of scale
    const x1 = xScale.invert(selectionX1);
    const y1 = yScale.invert(selectionY1);
    const x2 = xScale.invert(selectionX2);
    const y2 = yScale.invert(selectionY2);

    // Find routes within the selection rectangle
    const selected = routeElements.reduce((acc, route, index) => {
      const routeX1 = route.Start.X;
      const routeY1 = route.Start.Y;
      const routeX2 = route.End.X;
      const routeY2 = route.End.Y;

      // Need to account for the possibly inverted coordinates when checking bounds
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);

      // Check if any part of the route is within the selection using line-rectangle intersection
      // Line segment: (routeX1, routeY1) to (routeX2, routeY2)
      // Rectangle: (minX, minY) to (maxX, maxY)

      // 1. Check if either endpoint is inside the rectangle
      const endpointInside = 
        (routeX1 >= minX && routeX1 <= maxX && routeY1 >= minY && routeY1 <= maxY) ||
        (routeX2 >= minX && routeX2 <= maxX && routeY2 >= minY && routeY2 <= maxY);

      // 2. Check if line intersects any of the rectangle edges
      // For simplicity, we check if the line intersects with each of the rectangle's 4 edges

      // Helper function to check if two line segments intersect
      const doLineSegmentsIntersect = (
        x1: number, y1: number, x2: number, y2: number,
        x3: number, y3: number, x4: number, y4: number
      ) => {
        // Calculate the direction of the lines
        const uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
        const uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));

        // If uA and uB are between 0-1, lines are intersecting
        return (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1);
      };

      // Check intersection with the 4 edges of the rectangle
      const lineIntersectsRectangle =
        doLineSegmentsIntersect(routeX1, routeY1, routeX2, routeY2, minX, minY, maxX, minY) || // Top edge
        doLineSegmentsIntersect(routeX1, routeY1, routeX2, routeY2, maxX, minY, maxX, maxY) || // Right edge
        doLineSegmentsIntersect(routeX1, routeY1, routeX2, routeY2, maxX, maxY, minX, maxY) || // Bottom edge
        doLineSegmentsIntersect(routeX1, routeY1, routeX2, routeY2, minX, maxY, minX, minY);   // Left edge

      // If either condition is true, the line intersects with the rectangle
      const isSelected = endpointInside || lineIntersectsRectangle;

      if (isSelected) {
        acc.push(index);
      }

      return acc;
    }, [] as number[]);

    setSelectedRoutes(selected);

    // Reset selection rectangle
    setSelectionRect(prev => ({
      ...prev,
      visible: false
    }));

    // Return to hand mode after selection (per user request)
    setSelectionMode(false);
  }, [selectionMode, selectionRect, routeElements, xScale, yScale, setSelectionMode]);

  if (width === 0 || height === 0) {
    return <div ref={containerRef} className="absolute inset-0 bg-background"></div>;
  }

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 bg-background overflow-hidden"
      style={{ cursor: selectionMode ? 'crosshair' : 'grab' }}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        draggable={!selectionMode}
        onWheel={handleWheel}
        onDragEnd={(e) => {
          setPosition(e.target.position());
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
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
              stroke={selectedRoutes.includes(index) ? "#00ff00" : elem.color}
              strokeWidth={selectedRoutes.includes(index) ? 1.5 : 0.75}
              lineCap="round"
              lineJoin="round"
            />
          ))}

          {/* Selection Rectangle */}
          {selectionMode && selectionRect.visible && (
            <Rect
              x={selectionRect.x}
              y={selectionRect.y}
              width={selectionRect.width}
              height={selectionRect.height}
              fill="rgba(0, 255, 255, 0.2)"
              stroke="#00ffff"
              strokeWidth={1}
              dash={[5, 5]}
            />
          )}
        </Layer>
      </Stage>

      {/* Zoom Level Indicator */}
      <div className="absolute top-4 right-4 bg-surface/80 backdrop-blur-sm rounded-md px-3 py-1.5 text-sm font-medium">
        {Math.round(scale * 100)}%
      </div>

      {/* Control Buttons */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <button 
          onClick={handleToggleLayers}
          className="bg-white backdrop-blur-sm rounded-full p-2.5 shadow-lg text-black"
          title="Toggle Layers"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
        </button>

        <button 
          onClick={toggleSelectionMode}
          className={`bg-white backdrop-blur-sm rounded-full p-2.5 shadow-lg text-black ${selectionMode ? 'ring-2 ring-primary' : ''}`}
          title="Rectangle Selection Tool"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          </svg>
        </button>

        {selectedRoutes.length > 0 && (
          <button
            onClick={() => setSelectedRoutes([])}
            className="bg-white backdrop-blur-sm rounded-full p-2.5 shadow-lg text-black"
            title="Clear Selection"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </button>
        )}

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

      {/* Selection count indicator */}
      {selectedRoutes.length > 0 && (
        <div className="absolute bottom-12 right-4 bg-surface/80 backdrop-blur-sm rounded-md px-3 py-1.5 text-sm font-medium bg-white">
          Selected: {selectedRoutes.length}
        </div>
      )}
    </div>
  );
};

export default ElectricalPlanViewer;
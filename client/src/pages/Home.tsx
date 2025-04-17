import { useState } from "react";
import FileSelector from "@/components/FileSelector";
import LoadingIndicator from "@/components/LoadingIndicator";
import ElectricalPlanViewer from "@/components/ElectricalPlanViewer";
import ControlBar from "@/components/ControlBar";
import PlanInfoOverlay from "@/components/PlanInfoOverlay";
import { ElectricalPlanData } from "@/types";

export default function Home() {
  const [view, setView] = useState<"file-selector" | "loading" | "viewer">("file-selector");
  const [planData, setPlanData] = useState<ElectricalPlanData | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [showPlanInfo, setShowPlanInfo] = useState(false);
  const [progress, setProgress] = useState("Initializing...");
  
  // Reference to control viewer
  const [viewerInstance, setViewerInstance] = useState<any>(null);
  
  const handleFileSelected = async (file: File) => {
    setFileName(file.name);
    setView("loading");
    setProgress("Reading file...");
    
    try {
      // Read the file
      const fileContent = await readFileAsText(file);
      setProgress("Parsing JSON data...");
      
      // Parse JSON
      const jsonData = JSON.parse(fileContent);
      
      // Update state with parsed data
      setPlanData(jsonData);
      
      // Show viewer
      setProgress("Preparing visualization...");
      setTimeout(() => setView("viewer"), 500);
    } catch (error) {
      console.error("Error processing file:", error);
      alert(`Failed to process file: ${error instanceof Error ? error.message : String(error)}`);
      setView("file-selector");
    }
  };
  
  const handleChangeFile = () => {
    setPlanData(null);
    setView("file-selector");
    setShowPlanInfo(false);
  };
  
  const handleTogglePlanInfo = () => {
    setShowPlanInfo(prev => !prev);
  };
  
  // Viewer control functions
  const handleFitToScreen = () => {
    viewerInstance?.fitToScreen();
  };
  
  const handleResetView = () => {
    viewerInstance?.resetView();
  };
  
  const handleZoomIn = () => {
    viewerInstance?.zoomIn();
  };
  
  const handleZoomOut = () => {
    viewerInstance?.zoomOut();
  };
  
  // Helper function to read file
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => resolve(event.target?.result as string);
      reader.onerror = error => reject(error);
      reader.readAsText(file);
    });
  };
  
  return (
    <div className="flex flex-col h-screen w-screen relative overflow-hidden bg-background text-textPrimary font-sans">
      {/* Header */}
      <header className="bg-surface shadow-md px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
          </svg>
          <h1 className="font-semibold text-lg">ElectriView</h1>
        </div>
        {view === "viewer" && (
          <div>
            <button 
              onClick={handleTogglePlanInfo}
              className="p-2 rounded-full hover:bg-background/50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </button>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        {view === "file-selector" && (
          <FileSelector onFileSelected={handleFileSelected} />
        )}
        
        {view === "loading" && (
          <LoadingIndicator message={progress} />
        )}
        
        {view === "viewer" && planData && (
          <>
            <ElectricalPlanViewer 
              data={planData} 
              setViewerInstance={setViewerInstance}
            />
            
            {showPlanInfo && (
              <PlanInfoOverlay 
                data={planData} 
                fileName={fileName}
                onClose={() => setShowPlanInfo(false)}
              />
            )}
          </>
        )}
      </main>
      
      {/* Control Bar */}
      {view === "viewer" && (
        <ControlBar 
          onFitToScreen={handleFitToScreen}
          onResetView={handleResetView}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onChangeFile={handleChangeFile}
          onToggleInfo={handleTogglePlanInfo}
        />
      )}
    </div>
  );
}

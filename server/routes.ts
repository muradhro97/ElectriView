import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";

// Configure multer for temporary file storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /json/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error("Error: Only JSON files are allowed!"));
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoints for file handling
  app.post("/api/upload-json", upload.single("file"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // File is available in req.file.buffer
      // In a real application, we might store this or process it
      
      // Return success
      res.status(200).json({ 
        message: "File uploaded successfully",
        fileName: req.file.originalname,
        fileSize: req.file.size 
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ 
        message: "Error uploading file",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Endpoint to get recent files (would be implemented in a real app)
  app.get("/api/recent-files", (req, res) => {
    // In a real application, this would pull from a database or session storage
    res.status(200).json([]);
  });

  const httpServer = createServer(app);
  return httpServer;
}

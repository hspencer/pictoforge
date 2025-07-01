import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertSpaceSchema, 
  insertPictogramLibrarySchema,
  insertPictogramSchema,
  insertSpaceCollaboratorSchema,
  insertInstanceSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Space routes
  app.get('/api/spaces', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const spaces = await storage.getUserSpaces(userId);
      res.json(spaces);
    } catch (error) {
      console.error("Error fetching spaces:", error);
      res.status(500).json({ message: "Failed to fetch spaces" });
    }
  });

  app.post('/api/spaces', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const spaceData = insertSpaceSchema.parse({ ...req.body, ownerId: userId });
      const space = await storage.createSpace(spaceData);
      res.json(space);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid space data", errors: error.errors });
      }
      console.error("Error creating space:", error);
      res.status(500).json({ message: "Failed to create space" });
    }
  });

  app.get('/api/spaces/:id', isAuthenticated, async (req: any, res) => {
    try {
      const spaceId = parseInt(req.params.id);
      const space = await storage.getSpace(spaceId);
      
      if (!space) {
        return res.status(404).json({ message: "Space not found" });
      }

      // Check if user has access to this space
      const userId = req.user.claims.sub;
      if (space.ownerId !== userId) {
        // TODO: Check if user is a collaborator
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(space);
    } catch (error) {
      console.error("Error fetching space:", error);
      res.status(500).json({ message: "Failed to fetch space" });
    }
  });

  app.put('/api/spaces/:id', isAuthenticated, async (req: any, res) => {
    try {
      const spaceId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Check ownership
      const space = await storage.getSpace(spaceId);
      if (!space || space.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updates = insertSpaceSchema.partial().parse(req.body);
      const updatedSpace = await storage.updateSpace(spaceId, updates);
      res.json(updatedSpace);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid space data", errors: error.errors });
      }
      console.error("Error updating space:", error);
      res.status(500).json({ message: "Failed to update space" });
    }
  });

  app.delete('/api/spaces/:id', isAuthenticated, async (req: any, res) => {
    try {
      const spaceId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Check ownership
      const space = await storage.getSpace(spaceId);
      if (!space || space.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const deleted = await storage.deleteSpace(spaceId);
      res.json({ success: deleted });
    } catch (error) {
      console.error("Error deleting space:", error);
      res.status(500).json({ message: "Failed to delete space" });
    }
  });

  // Pictogram Library routes
  app.get('/api/spaces/:spaceId/libraries', isAuthenticated, async (req: any, res) => {
    try {
      const spaceId = parseInt(req.params.spaceId);
      const userId = req.user.claims.sub;
      
      // Check access to space
      const space = await storage.getSpace(spaceId);
      if (!space || space.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const libraries = await storage.getSpaceLibraries(spaceId);
      res.json(libraries);
    } catch (error) {
      console.error("Error fetching libraries:", error);
      res.status(500).json({ message: "Failed to fetch libraries" });
    }
  });

  app.post('/api/spaces/:spaceId/libraries', isAuthenticated, async (req: any, res) => {
    try {
      const spaceId = parseInt(req.params.spaceId);
      const userId = req.user.claims.sub;
      
      // Check access to space
      const space = await storage.getSpace(spaceId);
      if (!space || space.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const libraryData = insertPictogramLibrarySchema.parse({ ...req.body, spaceId });
      const library = await storage.createPictogramLibrary(libraryData);
      res.json(library);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid library data", errors: error.errors });
      }
      console.error("Error creating library:", error);
      res.status(500).json({ message: "Failed to create library" });
    }
  });

  // Pictogram routes
  app.get('/api/libraries/:libraryId/pictograms', isAuthenticated, async (req: any, res) => {
    try {
      const libraryId = parseInt(req.params.libraryId);
      const userId = req.user.claims.sub;
      
      // Check access to library (via space ownership)
      const library = await storage.getPictogramLibrary(libraryId);
      if (!library) {
        return res.status(404).json({ message: "Library not found" });
      }

      const space = await storage.getSpace(library.spaceId);
      if (!space || space.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const pictograms = await storage.getLibraryPictograms(libraryId);
      res.json(pictograms);
    } catch (error) {
      console.error("Error fetching pictograms:", error);
      res.status(500).json({ message: "Failed to fetch pictograms" });
    }
  });

  app.post('/api/libraries/:libraryId/pictograms', isAuthenticated, async (req: any, res) => {
    try {
      const libraryId = parseInt(req.params.libraryId);
      const userId = req.user.claims.sub;
      
      // Check access to library
      const library = await storage.getPictogramLibrary(libraryId);
      if (!library) {
        return res.status(404).json({ message: "Library not found" });
      }

      const space = await storage.getSpace(library.spaceId);
      if (!space || space.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const pictogramData = insertPictogramSchema.parse({ ...req.body, libraryId });
      const pictogram = await storage.createPictogram(pictogramData);
      res.json(pictogram);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid pictogram data", errors: error.errors });
      }
      console.error("Error creating pictogram:", error);
      res.status(500).json({ message: "Failed to create pictogram" });
    }
  });

  app.get('/api/pictograms/:id', isAuthenticated, async (req: any, res) => {
    try {
      const pictogramId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const pictogram = await storage.getPictogram(pictogramId);
      if (!pictogram) {
        return res.status(404).json({ message: "Pictogram not found" });
      }

      // Check access through library and space
      const library = await storage.getPictogramLibrary(pictogram.libraryId);
      if (!library) {
        return res.status(404).json({ message: "Library not found" });
      }

      const space = await storage.getSpace(library.spaceId);
      if (!space || space.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(pictogram);
    } catch (error) {
      console.error("Error fetching pictogram:", error);
      res.status(500).json({ message: "Failed to fetch pictogram" });
    }
  });

  app.put('/api/pictograms/:id', isAuthenticated, async (req: any, res) => {
    try {
      const pictogramId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const pictogram = await storage.getPictogram(pictogramId);
      if (!pictogram) {
        return res.status(404).json({ message: "Pictogram not found" });
      }

      // Check access through library and space
      const library = await storage.getPictogramLibrary(pictogram.libraryId);
      if (!library) {
        return res.status(404).json({ message: "Library not found" });
      }

      const space = await storage.getSpace(library.spaceId);
      if (!space || space.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updates = insertPictogramSchema.partial().parse(req.body);
      const updatedPictogram = await storage.updatePictogram(pictogramId, updates);
      res.json(updatedPictogram);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid pictogram data", errors: error.errors });
      }
      console.error("Error updating pictogram:", error);
      res.status(500).json({ message: "Failed to update pictogram" });
    }
  });

  app.delete('/api/pictograms/:id', isAuthenticated, async (req: any, res) => {
    try {
      const pictogramId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const pictogram = await storage.getPictogram(pictogramId);
      if (!pictogram) {
        return res.status(404).json({ message: "Pictogram not found" });
      }

      // Check access through library and space
      const library = await storage.getPictogramLibrary(pictogram.libraryId);
      if (!library) {
        return res.status(404).json({ message: "Library not found" });
      }

      const space = await storage.getSpace(library.spaceId);
      if (!space || space.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const deleted = await storage.deletePictogram(pictogramId);
      res.json({ success: deleted });
    } catch (error) {
      console.error("Error deleting pictogram:", error);
      res.status(500).json({ message: "Failed to delete pictogram" });
    }
  });

  // Legacy routes (for backward compatibility)
  app.get("/api/instances", async (req, res) => {
    try {
      const instances = await storage.listInstances();
      res.json(instances);
    } catch (error) {
      console.error("Error fetching instances:", error);
      res.status(500).json({ message: "Failed to fetch instances" });
    }
  });

  app.get("/api/instance/:slug", async (req, res) => {
    try {
      const instance = await storage.getInstanceBySlug(req.params.slug);
      if (!instance) {
        return res.status(404).json({ message: "Instance not found" });
      }
      res.json(instance);
    } catch (error) {
      console.error("Error fetching instance:", error);
      res.status(500).json({ message: "Failed to fetch instance" });
    }
  });

  // SVG validation endpoint
  app.post("/api/validate-svg", async (req, res) => {
    try {
      const { svgContent } = req.body;
      if (!svgContent || typeof svgContent !== 'string') {
        return res.status(400).json({ error: "SVG content is required" });
      }

      const isValid = svgContent.includes('<svg') && svgContent.includes('</svg>');
      res.json({ valid: isValid, errors: isValid ? [] : ['Invalid SVG structure'] });
    } catch (error) {
      res.status(500).json({ error: "Failed to validate SVG" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
import { Router } from "express";
import { db } from "../db";
import { projects } from "@shared/schema";
import { eq, isNotNull } from "drizzle-orm";

const router = Router();

// API-Endpunkt zum Abrufen aller Projekte mit Geo-Koordinaten
router.get("/api/geo-projects", async (req, res) => {
  try {
    // Nur Projekte mit Koordinaten zurückgeben
    const projectsWithCoords = await db
      .select()
      .from(projects)
      .where(
        isNotNull(projects.projectLatitude)
      );

    res.json(projectsWithCoords);
  } catch (error) {
    console.error("Fehler beim Abrufen der Geo-Projekte:", error);
    res.status(500).json({ 
      message: "Fehler beim Abrufen der Geo-Projekte",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// API-Endpunkt zum Abrufen eines bestimmten Projekts mit Geo-Koordinaten
router.get("/api/geo-projects/:id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Ungültige Projekt-ID" });
    }
    
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));
    
    if (!project) {
      return res.status(404).json({ message: "Projekt nicht gefunden" });
    }
    
    res.json(project);
  } catch (error) {
    console.error("Fehler beim Abrufen des Projekts:", error);
    res.status(500).json({ 
      message: "Fehler beim Abrufen des Projekts",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// API-Endpunkt zum Aktualisieren der Geo-Koordinaten eines Projekts
router.put("/api/geo-projects/:id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Ungültige Projekt-ID" });
    }
    
    const { projectLatitude, projectLongitude, projectAddress } = req.body;
    
    if (!projectLatitude || !projectLongitude) {
      return res.status(400).json({ message: "Latitude und Longitude sind erforderlich" });
    }
    
    const [updatedProject] = await db
      .update(projects)
      .set({
        projectLatitude,
        projectLongitude,
        projectAddress
      })
      .where(eq(projects.id, projectId))
      .returning();
    
    if (!updatedProject) {
      return res.status(404).json({ message: "Projekt nicht gefunden" });
    }
    
    res.json(updatedProject);
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Geo-Koordinaten:", error);
    res.status(500).json({ 
      message: "Fehler beim Aktualisieren der Geo-Koordinaten",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
import { Router, Request } from "express";
import { db } from "../db";
import { projects } from "@shared/schema";
import { eq, isNotNull, and, or } from "drizzle-orm";
import { requireAnyRole } from "../middleware/role-check";

// Hilfsfunktion für Type-Safety
interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    username: string;
    role?: string;
  };
}

function isAuthenticated(req: Request): req is AuthenticatedRequest {
  return req.isAuthenticated() && !!req.user;
}

const router = Router();

// API-Endpunkt zum Abrufen aller Projekte mit Berücksichtigung der Benutzerrolle
router.get("/api/geo-projects", requireAnyRole(), async (req, res) => {
  try {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: "Nicht authentifiziert" });
    }
    
    let allProjects;
    
    // Administrator sieht alle Projekte
    if (req.user.role === 'administrator') {
      allProjects = await db
        .select()
        .from(projects);
    } 
    // Manager sieht seine eigenen erstellten Projekte
    else if (req.user.role === 'manager') {
      allProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.createdBy, req.user.id));
    } 
    // Normale Benutzer sehen nur ihre eigenen Projekte
    else {
      allProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.createdBy, req.user.id));
    }

    res.json(allProjects);
  } catch (error) {
    console.error("Fehler beim Abrufen der Geo-Projekte:", error);
    res.status(500).json({ 
      message: "Fehler beim Abrufen der Geo-Projekte",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// API-Endpunkt zum Abrufen eines bestimmten Projekts mit Geo-Koordinaten
router.get("/api/geo-projects/:id", requireAnyRole(), async (req, res) => {
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
    
    // Berechtigungsprüfung
    // Administrator darf alle Projekte sehen
    if (req.user.role !== 'administrator') {
      // Manager und normale Benutzer dürfen nur ihre eigenen Projekte sehen
      if (project.createdBy !== req.user.id) {
        return res.status(403).json({ 
          message: "Keine Berechtigung, auf dieses Projekt zuzugreifen" 
        });
      }
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
router.put("/api/geo-projects/:id", requireAnyRole(), async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Ungültige Projekt-ID" });
    }
    
    // Überprüfen, ob das Projekt existiert und ob der Benutzer Zugriff hat
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));
    
    if (!project) {
      return res.status(404).json({ message: "Projekt nicht gefunden" });
    }
    
    // Berechtigungsprüfung
    // Administrator darf alle Projekte aktualisieren
    if (req.user.role !== 'administrator') {
      // Manager und normale Benutzer dürfen nur ihre eigenen Projekte aktualisieren
      if (project.createdBy !== req.user.id) {
        return res.status(403).json({ 
          message: "Keine Berechtigung, dieses Projekt zu aktualisieren" 
        });
      }
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
      return res.status(404).json({ message: "Projekt konnte nicht aktualisiert werden" });
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
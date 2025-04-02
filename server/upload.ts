import multer from "multer";
import path from "path";
import fs from "fs-extra";
import { Request, Response, NextFunction } from "express";
import { fileTypes } from "@shared/schema";

// Verzeichnis für Dateiuploads erstellen falls es nicht existiert
const uploadDir = path.join(process.cwd(), "uploads");
fs.ensureDirSync(uploadDir);

// Festlegen der Speicherung der hochgeladenen Dateien
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Filterung von Dateitypen (optional, um unerwünschte Dateitypen zu blockieren)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    // PDF
    "application/pdf",
    // Excel
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    // Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    // Text documents
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Nicht unterstützter Dateityp: ${file.mimetype}`));
  }
};

// Konfiguration des Uploads
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // Max 25MB
  },
});

/**
 * Bestimmt den Dateityp für die Datenbank basierend auf dem MIME-Typ
 */
export const getFileType = (mimetype: string): typeof fileTypes.enumValues[number] => {
  if (mimetype.includes("pdf")) {
    return "pdf";
  } else if (
    mimetype.includes("excel") ||
    mimetype.includes("spreadsheet") ||
    mimetype.includes("xls")
  ) {
    return "excel";
  } else if (mimetype.includes("image")) {
    return "image";
  } else {
    return "other";
  }
};

/**
 * Middleware für Fehlerbehebung bei Uploads
 */
export const handleUploadErrors = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Die Datei ist zu groß. Maximale Dateigröße ist 25MB.",
      });
    }
    return res.status(400).json({ message: `Upload-Fehler: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

/**
 * Middleware zur Bereinigung hochgeladener Dateien bei Fehler im weiteren Verlauf
 */
export const cleanupOnError = async (req: Request, res: Response, next: NextFunction) => {
  const files: Express.Multer.File[] = (req as any).files || [];
  const file: Express.Multer.File = (req as any).file;

  if (file) {
    files.push(file);
  }

  // Verwenden von res.on('finish') anstelle der Überschreibung von res.end
  res.on('finish', () => {
    const statusCode = res.statusCode;
    if (statusCode >= 400 && files.length > 0) {
      // Bei Fehler die hochgeladenen Dateien löschen
      files.forEach((file) => {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error("Fehler beim Löschen der Datei:", err);
        }
      });
    }
  });

  next();
};
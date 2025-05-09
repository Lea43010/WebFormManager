import multer from "multer";
import path from "path";
import fs from "fs-extra";
import { Request, Response, NextFunction } from "express";
import { fileTypes } from "@shared/schema";
import { optimizeImage, isSupportedImageFormat } from "./services/image-optimizer";
import logger from "./logger";

// Verzeichnis für Dateiuploads erstellen falls es nicht existiert
const uploadDir = path.join(process.cwd(), "uploads");
const optimizedDir = path.join(uploadDir, "optimized");
const thumbnailsDir = path.join(uploadDir, "thumbnails");

// Alle notwendigen Verzeichnisse erstellen
fs.ensureDirSync(uploadDir);
fs.ensureDirSync(optimizedDir);
fs.ensureDirSync(thumbnailsDir);

// Konfiguration für Bildoptimierung
const IMAGE_OPTIMIZATION_ENABLED = process.env.IMAGE_OPTIMIZATION_ENABLED !== 'false';
const DEFAULT_IMAGE_QUALITY = parseInt(process.env.DEFAULT_IMAGE_QUALITY || '85', 10);
const GENERATE_WEBP = process.env.GENERATE_WEBP !== 'false';
const GENERATE_THUMBNAILS = process.env.GENERATE_THUMBNAILS !== 'false';
const KEEP_ORIGINAL = process.env.KEEP_ORIGINAL === 'true';

// Festlegen der Speicherung der hochgeladenen Dateien
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
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
    "image/avif",
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

/**
 * Middleware zur automatischen Bildoptimierung nach dem Upload
 * Wird nur auf Bilddateien angewandt
 */
export const optimizeUploadedImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Überprüfen, ob die Bildoptimierung aktiviert ist
    if (!IMAGE_OPTIMIZATION_ENABLED) {
      return next();
    }

    const files: Express.Multer.File[] = (req as any).files || [];
    const file: Express.Multer.File = (req as any).file;

    if (file) {
      files.push(file);
    }

    // Nur weitermachen, wenn es Dateien gibt
    if (files.length === 0) {
      return next();
    }

    // Filtern nach unterstützten Bildformaten
    const imageFiles = files.filter(file => 
      file.mimetype.startsWith('image/') && 
      isSupportedImageFormat(file.path)
    );

    // Wenn keine Bilder vorhanden sind, weitermachen
    if (imageFiles.length === 0) {
      return next();
    }

    // Optimierungsoptionen
    const options = {
      quality: DEFAULT_IMAGE_QUALITY,
      generateWebP: GENERATE_WEBP,
      generateThumbnail: GENERATE_THUMBNAILS,
      keepOriginal: KEEP_ORIGINAL,
      maxWidth: 1920,
      maxHeight: 1080,
      thumbnailWidth: 320,
      thumbnailHeight: 240
    };

    // Erweitere Request-Objekt um optimizedFiles-Array
    (req as any).optimizedFiles = [];

    // Optimiere alle Bilddateien parallel
    await Promise.all(imageFiles.map(async (file) => {
      try {
        logger.debug(`Optimiere Bild: ${file.path}`);
        const result = await optimizeImage(file.path, options);
        
        // Optimierungsdaten speichern für spätere Verwendung in der Route
        (req as any).optimizedFiles.push({
          originalFile: file,
          optimization: result
        });
        
        // Pfad der Datei auf die optimierte Version aktualisieren
        file.path = result.optimizedPath;
        
        logger.debug(`Bild optimiert: ${file.path}, Einsparung: ${result.savings.toFixed(2)}%`);
      } catch (error) {
        // Bei Fehler während der Optimierung, nur eine Warnung ausgeben und fortfahren
        logger.warn(`Fehler bei der Bildoptimierung für ${file.path}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }));

    next();
  } catch (error) {
    logger.error(`Fehler bei der Bildoptimierung: ${error instanceof Error ? error.message : String(error)}`);
    next();
  }
};

/**
 * Erweiterte Version des Upload-Middleware mit automatischer Bildoptimierung
 */
export const optimizedUpload = {
  single: (fieldName: string) => [
    upload.single(fieldName),
    optimizeUploadedImages
  ],
  array: (fieldName: string, maxCount?: number) => [
    upload.array(fieldName, maxCount),
    optimizeUploadedImages
  ],
  fields: (fields: multer.Field[]) => [
    upload.fields(fields),
    optimizeUploadedImages
  ],
  any: () => [
    upload.any(),
    optimizeUploadedImages
  ]
};
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, type InsertLoginLog } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

async function logLoginEvent(req: Request, eventType: 'login' | 'logout' | 'register' | 'failed_login', userId?: number, success: boolean = true, failReason?: string) {
  try {
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent') || '';
    const username = userId ? (await storage.getUser(userId))?.username || 'unknown' : req.body.username || 'unknown';
    
    const logData: InsertLoginLog = {
      userId: userId || null,
      username,
      eventType,
      ipAddress,
      userAgent,
      success,
      failReason: failReason || null
    };
    
    await storage.createLoginLog(logData);
  } catch (error) {
    console.error('Fehler beim Erstellen des Login-Logs:', error);
    // Wir fangen den Fehler ab, damit das Login trotzdem funktioniert, auch wenn das Logging fehlschlägt
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'db-manager-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        // Erfasse fehlgeschlagenen Registrierungsversuch
        await logLoginEvent(req, 'register', null, false, 'Benutzername existiert bereits');
        return res.status(400).json({ message: "Benutzername existiert bereits" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        // Erfasse erfolgreiche Registrierung
        logLoginEvent(req, 'register', user.id);
        res.status(201).json(user);
      });
    } catch (error) {
      // Erfasse fehlgeschlagene Registrierung aufgrund eines Fehlers
      await logLoginEvent(req, 'register', null, false, String(error));
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        // Erfasse Fehler bei der Authentifizierung
        logLoginEvent(req, 'failed_login', null, false, String(err));
        return next(err);
      }
      if (!user) {
        // Erfasse fehlgeschlagenen Login-Versuch
        logLoginEvent(req, 'failed_login', null, false, 'Ungültiger Benutzername oder Passwort');
        return res.status(401).json({ message: "Ungültiger Benutzername oder Passwort" });
      }
      req.login(user, (err) => {
        if (err) {
          // Erfasse Fehler bei der Sitzungserstellung
          logLoginEvent(req, 'failed_login', user.id, false, String(err));
          return next(err);
        }
        // Erfasse erfolgreichen Login
        logLoginEvent(req, 'login', user.id);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

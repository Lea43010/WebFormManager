import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, type InsertLoginLog, type InsertVerificationCode } from "@shared/schema";
import { generateVerificationCode, sendVerificationCode } from "./email";
import { userCache } from "./user-cache";
import { emailService } from "./email-service";

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

async function logLoginEvent(req: Request, eventType: 'login' | 'logout' | 'register' | 'failed_login', userId?: number | null, success: boolean = true, failReason?: string) {
  try {
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent') || '';
    
    // Verbesserte Username-Ermittlung mit Null-Sicherheit
    let username = 'unknown';
    if (userId) {
      // Benutzen des Caches für bessere Performance wenn verfügbar
      const userFromCache = userCache.get(userId);
      if (userFromCache) {
        username = userFromCache.username;
      } else {
        const user = await storage.getUser(userId);
        username = user?.username || 'unknown';
      }
    } else if (req.body && req.body.username) {
      username = req.body.username;
    }
    
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
      // Hier wird der User-Cache automatisch durch die getUser-Methode verwendet
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

      // Ablaufdatum der Testphase auf 4 Wochen nach Registrierung setzen
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 28); // 4 Wochen (28 Tage)
      
      // Prüfen, ob DSGVO-Zustimmung gegeben wurde
      if (req.body.gdprConsent !== true) {
        await logLoginEvent(req, 'register', null, false, 'DSGVO-Zustimmung erforderlich');
        return res.status(400).json({ message: "Sie müssen den Datenschutzbestimmungen zustimmen, um sich zu registrieren" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        trialEndDate, // Ablaufdatum der Testphase hinzufügen
        gdprConsent: req.body.gdprConsent, // DSGVO-Zustimmung speichern
      });

      req.login(user, async (err) => {
        if (err) return next(err);
        
        try {
          // Erfasse erfolgreiche Registrierung
          logLoginEvent(req, 'register', user.id);
          
          // Sende Willkommens-E-Mail
          if (user.email) {
            // Aktuelles Datum für die E-Mail formatieren
            const heute = new Date().toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
            
            // HTML-Inhalt für die Willkommens-E-Mail
            const htmlContent = `
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
                .container { padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
                h1 { color: #76a730; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                .highlight { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #76a730; margin: 20px 0; }
                .footer { margin-top: 30px; font-size: 0.8em; color: #666; border-top: 1px solid #eee; padding-top: 10px; }
                .trial-info { font-weight: bold; color: #76a730; }
                .feature { margin: 12px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Herzlich willkommen bei Bau-Structura!</h1>
                
                <p>Liebe(r) ${user.username},</p>
                
                <p>wir freuen uns sehr, dass Sie nun Teil von Bau-Structura sind – herzlich willkommen!</p>
                
                <div class="highlight">
                  <p class="trial-info">Damit Sie Bau-Structura ganz in Ruhe kennenlernen können, schenken wir Ihnen die ersten 14 Tage völlig kostenlos und unverbindlich.</p>
                </div>
                
                <p>Unsere Plattform unterstützt Sie optimal dabei, Ihre Bauprojekte effizient zu planen, zu organisieren und erfolgreich umzusetzen. Profitieren Sie dabei von folgenden Vorteilen:</p>
                
                <p class="feature">Einfache und effiziente Verwaltung Ihrer Bauprojekte</p>
                <p class="feature">Strukturierte Organisation aller relevanten Dokumente</p>
                <p class="feature">Schnelle Dokumentation und detaillierte Analyse von Straßenschäden</p>
                <p class="feature">Übersichtliche Visualisierung von Bauplätzen auf interaktiven Karten</p>
                <p class="feature">Einfache Nachverfolgung und Dokumentation der Baufortschritte</p>
                
                <p>Ihre persönlichen Anmeldedaten wurden bereits eingerichtet und auf Ihre individuellen Anforderungen zugeschnitten.</p>
                
                <p>Sollten Sie Fragen haben oder Unterstützung benötigen, steht Ihnen unser Support von Montag bis Freitag zwischen 8:00 und 17:00 Uhr zur Verfügung.</p>
                
                <p>Wir wünschen Ihnen viel Freude und Erfolg bei Ihren Projekten mit Bau-Structura!</p>
                
                <p>Herzliche Grüße<br>
                Ihr Bau-Structura App Team</p>
                
                <div class="footer">
                  <p>Hinweis: Diese E-Mail wurde automatisch am ${heute} generiert. Bitte antworten Sie nicht direkt auf diese Nachricht.</p>
                </div>
              </div>
            </body>
            </html>
            `;
            
            // Text-Version der E-Mail
            const textContent = `
Herzlich willkommen bei Bau-Structura – Ihre 14-tägige Testphase startet jetzt!

Liebe(r) ${user.username},

wir freuen uns sehr, dass Sie nun Teil von Bau-Structura sind – herzlich willkommen!

Damit Sie Bau-Structura ganz in Ruhe kennenlernen können, schenken wir Ihnen die ersten 14 Tage völlig kostenlos und unverbindlich.

Unsere Plattform unterstützt Sie optimal dabei, Ihre Bauprojekte effizient zu planen, zu organisieren und erfolgreich umzusetzen. Profitieren Sie dabei von folgenden Vorteilen:

Einfache und effiziente Verwaltung Ihrer Bauprojekte

Strukturierte Organisation aller relevanten Dokumente

Schnelle Dokumentation und detaillierte Analyse von Straßenschäden

Übersichtliche Visualisierung von Bauplätzen auf interaktiven Karten

Einfache Nachverfolgung und Dokumentation der Baufortschritte

Ihre persönlichen Anmeldedaten wurden bereits eingerichtet und auf Ihre individuellen Anforderungen zugeschnitten.

Sollten Sie Fragen haben oder Unterstützung benötigen, steht Ihnen unser Support von Montag bis Freitag zwischen 8:00 und 17:00 Uhr zur Verfügung.

Wir wünschen Ihnen viel Freude und Erfolg bei Ihren Projekten mit Bau-Structura!

Herzliche Grüße
Ihr Bau-Structura App Team

---
Hinweis: Diese E-Mail wurde automatisch am ${heute} generiert. Bitte antworten Sie nicht direkt auf diese Nachricht.
            `;
            
            // E-Mail senden
            await emailService.sendEmail({
              to: user.email,
              subject: 'Herzlich willkommen bei Bau-Structura – Ihre 14-tägige Testphase startet jetzt!',
              html: htmlContent,
              text: textContent,
              highPriority: true
            });
          }
        } catch (emailError) {
          // Fehler beim E-Mail-Versand loggen, aber den Registrierungsprozess nicht abbrechen
          console.error('Fehler beim Senden der Willkommens-E-Mail:', emailError);
        }
        
        res.status(201).json(user);
      });
    } catch (error) {
      // Erfasse fehlgeschlagene Registrierung aufgrund eines Fehlers
      await logLoginEvent(req, 'register', null, false, String(error));
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
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

      try {
        // 2FA temporär deaktiviert - direktes Einloggen aller Benutzer ohne Verifizierung
        req.login(user, (err) => {
          if (err) {
            logLoginEvent(req, 'failed_login', user.id, false, String(err));
            return next(err);
          }
          // Erfasse erfolgreichen Login
          logLoginEvent(req, 'login', user.id);
          res.status(200).json(user);
        });
      } catch (error) {
        console.error("Fehler bei der Zwei-Faktor-Authentifizierung:", error);
        logLoginEvent(req, 'failed_login', user.id, false, "Fehler bei der Zwei-Faktor-Authentifizierung");
        return res.status(500).json({ message: "Interner Serverfehler" });
      }
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    // Benutzer-ID speichern, bevor wir die Sitzung beenden
    const userId = req.user?.id;
    
    req.logout((err) => {
      if (err) {
        // Fehler beim Abmelden protokollieren
        if (userId) {
          logLoginEvent(req, 'logout', userId, false, String(err));
        }
        return next(err);
      }
      
      // Erfolgreiche Abmeldung protokollieren, falls ein Benutzer vorhanden war
      if (userId) {
        logLoginEvent(req, 'logout', userId);
      }
      
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Route zum Verifizieren des 2FA-Codes
  app.post("/api/verify-code", async (req, res, next) => {
    try {
      const { userId, code } = req.body;

      if (!userId || !code) {
        return res.status(400).json({ message: "Benutzer-ID und Verifizierungscode sind erforderlich" });
      }

      // Verifizierungscode aus der Datenbank holen
      const verificationCode = await storage.getVerificationCode(code);

      if (!verificationCode) {
        return res.status(400).json({ message: "Ungültiger Verifizierungscode" });
      }

      if (verificationCode.userId !== userId) {
        return res.status(400).json({ message: "Ungültiger Verifizierungscode für diesen Benutzer" });
      }

      // Verifizierungscode als verwendet markieren
      await storage.markVerificationCodeAsUsed(verificationCode.id);

      // Benutzer aus der Datenbank holen
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(400).json({ message: "Benutzer nicht gefunden" });
      }

      // Benutzer in die Session setzen (Login abschließen)
      req.login(user, (err) => {
        if (err) {
          logLoginEvent(req, 'failed_login', user.id, false, "Fehler beim Login nach Verifizierung");
          return next(err);
        }

        // Erfolgreichen Login protokollieren
        logLoginEvent(req, 'login', user.id);
        res.status(200).json(user);
      });
    } catch (error) {
      console.error("Fehler bei der Verifizierung:", error);
      res.status(500).json({ message: "Interner Serverfehler bei der Verifizierung" });
    }
  });

  // Route zum Zurücksetzen des Passworts (Anfrage für Reset-Link)
  app.post("/api/request-password-reset", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "E-Mail-Adresse ist erforderlich" });
      }

      // Suche nach Benutzer mit dieser E-Mail
      const users = await storage.getAllUsers();
      const user = users.find(u => u.email === email);

      if (!user) {
        // Aus Sicherheitsgründen teilen wir nicht mit, ob die E-Mail-Adresse existiert
        return res.status(200).json({ message: "Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde ein Passwort-Reset-Link gesendet." });
      }

      // Verifizierungscode generieren
      const code = generateVerificationCode();
      
      // Ablaufzeit (1 Stunde)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      
      // Verifizierungscode speichern
      const verificationData: InsertVerificationCode = {
        userId: user.id,
        code,
        type: 'password_reset',
        expiresAt,
        isValid: true
      };
      
      await storage.createVerificationCode(verificationData);
      
      // Reset-Link per E-Mail senden
      const resetLink = `${req.protocol}://${req.get('host')}/auth/reset-password?code=${code}&userId=${user.id}`;
      // Sicherstellen, dass die E-Mail nicht null ist
      const userEmail = user.email || '';
      if (userEmail) {
        await sendVerificationCode(userEmail, code, resetLink);
      } else {
        console.warn(`Konnte keine Passwort-Reset-Email senden: Keine E-Mail-Adresse für Benutzer ${user.id} (${user.username}) hinterlegt`);
      }
      
      res.status(200).json({ message: "Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde ein Passwort-Reset-Link gesendet." });
    } catch (error) {
      console.error("Fehler beim Anfordern des Passwort-Resets:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });

  // Route zum Zurücksetzen des Passworts (Durchführung des Resets)
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { userId, code, newPassword } = req.body;

      if (!userId || !code || !newPassword) {
        return res.status(400).json({ message: "Benutzer-ID, Verifizierungscode und neues Passwort sind erforderlich" });
      }

      // Verifizierungscode überprüfen
      const verificationCode = await storage.getVerificationCode(code);

      if (!verificationCode || verificationCode.userId !== userId || verificationCode.type !== 'password_reset') {
        return res.status(400).json({ message: "Ungültiger oder abgelaufener Verifizierungscode" });
      }

      // Verifizierungscode als verwendet markieren
      await storage.markVerificationCodeAsUsed(verificationCode.id);

      // Passwort aktualisieren
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(userId, { password: hashedPassword });

      res.status(200).json({ message: "Passwort erfolgreich zurückgesetzt" });
    } catch (error) {
      console.error("Fehler beim Zurücksetzen des Passworts:", error);
      res.status(500).json({ message: "Interner Serverfehler" });
    }
  });
}

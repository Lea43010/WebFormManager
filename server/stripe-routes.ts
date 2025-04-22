import express, { Express, Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { 
  createCheckoutSession,
  handleSuccessfulPayment,
  hasActiveSubscription,
  cancelSubscription,
  handleStripeWebhookEvent
} from "./stripe-api";

export function setupStripeRoutes(app: Express) {
  // Überprüfen, ob ein Benutzer ein aktives Abonnement hat
  app.get("/api/subscription/status", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      // Administrator benötigt kein Abonnement
      const isAdmin = req.user.role === 'administrator';
      
      // Für Administratoren ist der Status immer aktiv
      const isActive = isAdmin ? true : await hasActiveSubscription(req.user.id);
      
      console.log("Benutzerrolle:", req.user.role);
      console.log("Ist Administrator:", isAdmin);
      
      // Debug-Ausgabe für das Trial-Enddatum
      console.log("Trial end date (raw):", req.user.trialEndDate);
      console.log("Trial end date (typeof):", typeof req.user.trialEndDate);
      
      // Debug-Ausgabe für die Antwort
      // Formatiere das Datum als ISO-String, falls es ein Date-Objekt ist
      let trialEndDate = req.user.trialEndDate;
      
      // Wenn der Benutzer in der Testphase ist, aber kein Enddatum hat,
      // setzen wir ein Standarddatum (4 Wochen ab jetzt)
      if (!trialEndDate && (req.user.subscriptionStatus === 'trial' || !req.user.subscriptionStatus)) {
        const date = new Date();
        date.setDate(date.getDate() + 28); // 4 Wochen
        const trialEndDateStr = date.toISOString().split('T')[0]; // Nur das Datum im Format YYYY-MM-DD
        
        // Wir könnten hier auch das Datum in der Datenbank speichern, aber das
        // würde einen zusätzlichen Schreibvorgang bedeuten. Stattdessen stellen
        // wir sicher, dass es in der Antwort enthalten ist.
        console.log("Automatisch generiertes Enddatum:", trialEndDateStr);
        
        // Setze die Variable neu, aber als String
        trialEndDate = trialEndDateStr;
      }
      
      const responseData = { 
        active: isActive,
        status: isAdmin ? 'admin' : (req.user.subscriptionStatus || 'trial'), // Spezieller Status für Administratoren
        trialEndDate: trialEndDate, // Das möglicherweise geänderte Datum
        lastPaymentDate: req.user.lastPaymentDate,
        stripeCustomerId: req.user.stripeCustomerId,
        stripeSubscriptionId: req.user.stripeSubscriptionId,
        isAdmin // Zusätzliches Flag für das Frontend
      };
      
      console.log("Status API Response:", responseData);
      
      res.json(responseData);
    } catch (error) {
      next(error);
    }
  });
  
  // Eine neue Checkout-Session für ein Abonnement erstellen
  app.post("/api/subscription/checkout", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      const sessionUrl = await createCheckoutSession(req.user.id);
      res.json({ url: sessionUrl });
    } catch (error) {
      console.error("Fehler beim Erstellen der Checkout-Session:", error);
      next(error);
    }
  });
  
  // Nach erfolgreicher Zahlung den Abonnement-Status aktualisieren
  app.get("/api/subscription/success", async (req, res, next) => {
    try {
      const { session_id } = req.query;
      
      if (!session_id || typeof session_id !== 'string') {
        return res.status(400).json({ message: "Ungültige Session-ID" });
      }
      
      await handleSuccessfulPayment(session_id);
      
      // Anstatt einer Weiterleitung senden wir eine JSON-Antwort zurück,
      // da die Anfrage vom Frontend über Fetch-API erfolgt
      res.json({ success: true });
    } catch (error) {
      console.error("Fehler bei der Zahlungsverarbeitung:", error);
      next(error);
    }
  });
  
  // Ein Abonnement kündigen
  app.post("/api/subscription/cancel", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Nicht authentifiziert" });
      }
      
      await cancelSubscription(req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Fehler beim Kündigen des Abonnements:", error);
      next(error);
    }
  });
  
  // Stripe Webhook-Handler für asynchrone Ereignisse
  app.post("/api/stripe/webhook", express.raw({ type: 'application/json' }), async (req, res, next) => {
    const sig = req.headers['stripe-signature'];
    
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).json({ message: "Stripe-Signatur oder Webhook-Secret fehlt" });
    }
    
    let event: Stripe.Event;
    
    try {
      // @ts-ignore - Wir ignorieren den Typfehler für die API-Version
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2023-10-16", // Kompatible Version
      });
      
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error: any) {
      console.error("Stripe Webhook Fehler:", error.message);
      return res.status(400).json({ message: `Webhook Fehler: ${error.message}` });
    }
    
    try {
      await handleStripeWebhookEvent(event);
      res.json({ received: true });
    } catch (error) {
      console.error("Fehler bei der Verarbeitung des Webhook-Ereignisses:", error);
      next(error);
    }
  });
}
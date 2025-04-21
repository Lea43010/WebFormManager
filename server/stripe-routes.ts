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
      
      const isActive = await hasActiveSubscription(req.user.id);
      res.json({ 
        active: isActive,
        status: req.user.subscriptionStatus || 'trial',
        trialEndDate: req.user.trialEndDate,
        lastPaymentDate: req.user.lastPaymentDate,
        stripeCustomerId: req.user.stripeCustomerId,
        stripeSubscriptionId: req.user.stripeSubscriptionId
      });
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
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2024-03-26", // Aktuelle Version zum Zeitpunkt der Entwicklung
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
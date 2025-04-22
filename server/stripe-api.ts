import Stripe from "stripe";
import { db } from "./db";
import { storage } from "./storage";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Stelle sicher, dass der Stripe-API-Schlüssel vorhanden ist
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Fehlender Stripe-API-Schlüssel: STRIPE_SECRET_KEY');
}

// Initialisiere Stripe mit dem geheimen Schlüssel
// @ts-ignore - Wir ignorieren den Typfehler für die API-Version, da Stripe in 2025 neue Versionen haben wird
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16", // Kompatible Version, die zum Zeitpunkt der Entwicklung aktuell ist
});

// Preisplan-ID für das Abonnement
// Verwendung der eingerichteten Umgebungsvariable
if (!process.env.STRIPE_PRICE_ID) {
  throw new Error('Fehlender Stripe-Preis: STRIPE_PRICE_ID');
}
const SUBSCRIPTION_PRICE_ID = process.env.STRIPE_PRICE_ID;

/**
 * Erstellt oder aktualisiert einen Stripe-Kunden für einen Benutzer
 */
export async function createOrUpdateStripeCustomer(userId: number): Promise<string> {
  const user = await storage.getUser(userId);
  
  if (!user) {
    throw new Error(`Benutzer mit ID ${userId} nicht gefunden`);
  }
  
  // Wenn der Benutzer bereits eine Stripe-Kunden-ID hat, verwende diese
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }
  
  // Erstelle einen neuen Stripe-Kunden
  const customer = await stripe.customers.create({
    email: user.email || undefined,
    name: user.name || user.username,
    metadata: {
      userId: user.id.toString(),
    },
  });
  
  // Speichere die Stripe-Kunden-ID in der Datenbank
  await db.update(users)
    .set({ stripeCustomerId: customer.id })
    .where(eq(users.id, userId));
  
  return customer.id;
}

/**
 * Erstellt eine Checkout-Session für ein neues Abonnement
 */
export async function createCheckoutSession(userId: number): Promise<string> {
  // Stelle sicher, dass der Benutzer einen Stripe-Kunden hat
  const customerId = await createOrUpdateStripeCustomer(userId);
  
  // Erstelle eine Checkout-Session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: SUBSCRIPTION_PRICE_ID,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.APP_URL || 'http://localhost:3000'}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/subscription?canceled=true`,
  });
  
  return session.url || '';
}

/**
 * Verarbeitet eine erfolgreiche Zahlung
 */
export async function handleSuccessfulPayment(sessionId: string): Promise<void> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription'],
  });
  
  if (!session.customer || !session.subscription) {
    throw new Error('Ungültige Checkout-Session: Kunde oder Abonnement fehlt');
  }
  
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
  
  // Finde den Benutzer anhand der Stripe-Kunden-ID
  const [user] = await db.select()
    .from(users)
    .where(eq(users.stripeCustomerId, customerId));
  
  if (!user) {
    throw new Error(`Kein Benutzer mit Stripe-Kunden-ID ${customerId} gefunden`);
  }
  
  // Aktualisiere den Abonnement-Status des Benutzers
  await db.update(users)
    .set({
      subscriptionStatus: 'active',
      stripeSubscriptionId: subscriptionId,
      lastPaymentDate: new Date(),
    })
    .where(eq(users.id, user.id));
}

/**
 * Überprüft, ob ein Benutzer ein aktives Abonnement hat
 */
export async function hasActiveSubscription(userId: number): Promise<boolean> {
  const user = await storage.getUser(userId);
  
  if (!user) {
    return false;
  }
  
  // Wenn der Benutzer noch in der Testphase ist
  if (user.subscriptionStatus === 'trial') {
    if (!user.trialEndDate) {
      return true; // Kein Enddatum gesetzt, betrachte als aktiv
    }
    
    const now = new Date();
    return now < new Date(user.trialEndDate);
  }
  
  // Wenn der Benutzer ein aktives Abonnement hat
  return user.subscriptionStatus === 'active' && !!user.stripeSubscriptionId;
}

/**
 * Kündigt ein Abonnement
 */
export async function cancelSubscription(userId: number): Promise<void> {
  const user = await storage.getUser(userId);
  
  if (!user || !user.stripeSubscriptionId) {
    throw new Error('Kein aktives Abonnement gefunden');
  }
  
  // Kündige das Abonnement bei Stripe
  await stripe.subscriptions.cancel(user.stripeSubscriptionId);
  
  // Aktualisiere den Abonnement-Status des Benutzers
  await db.update(users)
    .set({
      subscriptionStatus: 'canceled',
    })
    .where(eq(users.id, userId));
}

/**
 * Erstellt einen Webhook-Handler für Stripe-Events
 */
export function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'customer.subscription.deleted':
    case 'customer.subscription.updated':
      // Hier könnten wir zusätzliche Logik implementieren, um auf Änderungen zu reagieren
      break;
    case 'invoice.payment_succeeded':
      // Hier könnten wir Zahlungsbestätigungen verarbeiten
      break;
    case 'invoice.payment_failed':
      // Hier könnten wir fehlgeschlagene Zahlungen behandeln
      break;
  }
  
  return Promise.resolve();
}
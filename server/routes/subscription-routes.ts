import express, { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { insertSubscriptionPlanSchema, insertUserSubscriptionSchema } from '@shared/schema';
import { isAuthenticated, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Abonnementpläne abrufen (öffentlich)
router.get('/plans', async (req, res) => {
  try {
    const plans = await storage.getSubscriptionPlans();
    res.json(plans);
  } catch (error) {
    console.error('Fehler beim Abrufen der Abonnementpläne:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Abonnementpläne' });
  }
});

// Einzelnen Abonnementplan abrufen (öffentlich)
router.get('/plans/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const plan = await storage.getSubscriptionPlan(planId);
    
    if (!plan) {
      return res.status(404).json({ message: 'Abonnementplan nicht gefunden' });
    }
    
    res.json(plan);
  } catch (error) {
    console.error('Fehler beim Abrufen des Abonnementplans:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen des Abonnementplans' });
  }
});

// Abonnementplan erstellen (nur Admin)
router.post('/plans', isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const validatedData = insertSubscriptionPlanSchema.parse(req.body);
    const plan = await storage.createSubscriptionPlan(validatedData);
    res.status(201).json(plan);
  } catch (error) {
    console.error('Fehler beim Erstellen des Abonnementplans:', error);
    res.status(400).json({ message: 'Fehler beim Erstellen des Abonnementplans', error: error.message });
  }
});

// Abonnementplan aktualisieren (nur Admin)
router.put('/plans/:planId', isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const { planId } = req.params;
    const validatedData = insertSubscriptionPlanSchema.partial().parse(req.body);
    
    const plan = await storage.updateSubscriptionPlan(planId, validatedData);
    
    if (!plan) {
      return res.status(404).json({ message: 'Abonnementplan nicht gefunden' });
    }
    
    res.json(plan);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Abonnementplans:', error);
    res.status(400).json({ message: 'Fehler beim Aktualisieren des Abonnementplans', error: error.message });
  }
});

// Abonnementplan löschen (nur Admin)
router.delete('/plans/:planId', isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const { planId } = req.params;
    await storage.deleteSubscriptionPlan(planId);
    res.status(204).send();
  } catch (error) {
    console.error('Fehler beim Löschen des Abonnementplans:', error);
    res.status(500).json({ message: 'Fehler beim Löschen des Abonnementplans' });
  }
});

// Benutzerspezifische Abonnement-Informationen abrufen
router.get('/user', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const subscription = await storage.getUserSubscription(userId);
    
    // Wenn kein Abonnement existiert, geben wir null zurück
    if (!subscription) {
      return res.json(null);
    }
    
    // Plan-Informationen zur Antwort hinzufügen
    const plan = await storage.getSubscriptionPlan(subscription.planId);
    
    res.json({
      ...subscription,
      planDetails: plan || null
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Benutzerabonnements:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen des Benutzerabonnements' });
  }
});

// Benutzerabonnement erstellen (nur selbst oder Admin)
router.post('/user/:userId', isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    const parsedUserId = parseInt(userId, 10);
    
    // Prüfen, ob der Benutzer berechtigt ist, das Abonnement zu erstellen
    if (req.user.id !== parsedUserId && req.user.role !== 'administrator') {
      return res.status(403).json({ message: 'Keine Berechtigung für diesen Vorgang' });
    }
    
    // Daten validieren
    const validatedData = insertUserSubscriptionSchema.parse({
      ...req.body,
      userId: parsedUserId
    });
    
    // Prüfen, ob bereits ein Abonnement existiert
    const existingSubscription = await storage.getUserSubscription(parsedUserId);
    if (existingSubscription) {
      return res.status(400).json({ message: 'Der Benutzer hat bereits ein Abonnement' });
    }
    
    const subscription = await storage.createUserSubscription(validatedData);
    res.status(201).json(subscription);
  } catch (error) {
    console.error('Fehler beim Erstellen des Benutzerabonnements:', error);
    res.status(400).json({ message: 'Fehler beim Erstellen des Benutzerabonnements', error: error.message });
  }
});

// Benutzerabonnement aktualisieren (nur selbst oder Admin)
router.put('/user/:userId', isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    const parsedUserId = parseInt(userId, 10);
    
    // Prüfen, ob der Benutzer berechtigt ist, das Abonnement zu aktualisieren
    if (req.user.id !== parsedUserId && req.user.role !== 'administrator') {
      return res.status(403).json({ message: 'Keine Berechtigung für diesen Vorgang' });
    }
    
    // Abonnement abrufen
    const subscription = await storage.getUserSubscription(parsedUserId);
    
    if (!subscription) {
      return res.status(404).json({ message: 'Kein Abonnement für diesen Benutzer gefunden' });
    }
    
    // Daten validieren
    const validatedData = insertUserSubscriptionSchema.partial().parse(req.body);
    
    const updatedSubscription = await storage.updateUserSubscription(subscription.id, validatedData);
    res.json(updatedSubscription);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Benutzerabonnements:', error);
    res.status(400).json({ message: 'Fehler beim Aktualisieren des Benutzerabonnements', error: error.message });
  }
});

// Benutzerabonnement löschen (nur Admin)
router.delete('/user/:userId', isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const parsedUserId = parseInt(userId, 10);
    
    // Abonnement abrufen
    const subscription = await storage.getUserSubscription(parsedUserId);
    
    if (!subscription) {
      return res.status(404).json({ message: 'Kein Abonnement für diesen Benutzer gefunden' });
    }
    
    await storage.deleteUserSubscription(subscription.id);
    res.status(204).send();
  } catch (error) {
    console.error('Fehler beim Löschen des Benutzerabonnements:', error);
    res.status(500).json({ message: 'Fehler beim Löschen des Benutzerabonnements' });
  }
});

export default router;
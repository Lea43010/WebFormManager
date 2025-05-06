import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { addDays, isAfter, isBefore, parseISO, format } from "date-fns";
import { de } from "date-fns/locale";

type LoginData = Pick<InsertUser, "username" | "password">;
type VerificationData = { userId: number; code: string };
type ResetPasswordData = { userId: number; code: string; newPassword: string };

// Typdefinition für den AuthContext mit Abonnementinformationen
type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser | { requiresVerification: boolean; userId: number; message: string }, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
  verifyCodeMutation: UseMutationResult<SelectUser, Error, VerificationData>;
  requestPasswordResetMutation: UseMutationResult<{ message: string }, Error, { email: string }>;
  resetPasswordMutation: UseMutationResult<{ message: string }, Error, ResetPasswordData>;
  requiresTwoFactor: boolean;
  pendingUserId: number | null;
  isSubscriptionActive: boolean;
  isTrialExpired: boolean;
  daysLeftInTrial: number | null;
  trialExpiryDate: string | null;
};

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [daysLeftInTrial, setDaysLeftInTrial] = useState<number | null>(null);
  const [trialExpiryDate, setTrialExpiryDate] = useState<string | null>(null);
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Effekt zum Überprüfen des Abonnementstatus und der Testphase
  useEffect(() => {
    if (user) {
      try {
        // Bei Administratoren ist kein Abonnement erforderlich
        if (user.role === 'administrator') {
          setIsSubscriptionActive(true);
          setIsTrialExpired(false);
          setDaysLeftInTrial(null);
          return;
        }
        
        // Überprüfen, ob der Benutzer ein aktives Abonnement hat
        if (user.subscriptionStatus === 'active') {
          setIsSubscriptionActive(true);
          setIsTrialExpired(false);
          setDaysLeftInTrial(null);
          return;
        }
        
        // Überprüfen der Testphase
        if (user.subscriptionStatus === 'trial' && user.trialEndDate) {
          let trialEndDate: Date;
          
          // Versuche, das Datum zu parsen
          try {
            // ISO-String Format (wie '2024-05-06')
            if (typeof user.trialEndDate === 'string') {
              trialEndDate = new Date(user.trialEndDate);
              if (isNaN(trialEndDate.getTime())) {
                // Versuch mit Zeit-Teil
                trialEndDate = new Date(user.trialEndDate + 'T00:00:00.000Z');
              }
            } else {
              trialEndDate = new Date(user.trialEndDate);
            }
          } catch (e) {
            console.error("Fehler beim Parsen des Testphasen-Enddatums:", e);
            // Fallback: 30 Tage ab heute, wenn das Datum nicht geparst werden kann
            trialEndDate = addDays(new Date(), 30);
          }
          
          // Formatierte Darstellung des Enddatums
          try {
            setTrialExpiryDate(format(trialEndDate, 'dd.MM.yyyy', { locale: de }));
          } catch (e) {
            console.error("Fehler beim Formatieren des Testphasen-Enddatums:", e);
            setTrialExpiryDate(trialEndDate.toLocaleDateString('de-DE'));
          }
          
          const today = new Date();
          const isExpired = isBefore(trialEndDate, today);
          setIsTrialExpired(isExpired);
          
          if (!isExpired) {
            // Berechnen der verbleibenden Tage
            const diffTime = Math.abs(trialEndDate.getTime() - today.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDaysLeftInTrial(diffDays);
            
            // Warnung anzeigen, wenn weniger als 7 Tage verbleiben
            if (diffDays <= 7) {
              toast({
                title: "Testphase endet bald",
                description: `Ihre Testphase endet in ${diffDays} ${diffDays === 1 ? 'Tag' : 'Tagen'} am ${trialExpiryDate}. Bitte verlängern Sie Ihr Abonnement.`,
                variant: "destructive",
              });
            }
          } else {
            setDaysLeftInTrial(0);
            // Warnung anzeigen für abgelaufene Testphase
            toast({
              title: "Testphase abgelaufen",
              description: "Ihre Testphase ist abgelaufen. Bitte verlängern Sie Ihr Abonnement, um alle Funktionen weiterhin nutzen zu können.",
              variant: "destructive",
            });
          }
        } else if (user.subscriptionStatus === 'expired') {
          setIsSubscriptionActive(false);
          setIsTrialExpired(true);
          setDaysLeftInTrial(0);
          
          // Warnung anzeigen für abgelaufenes Abonnement
          toast({
            title: "Abonnement abgelaufen",
            description: "Ihr Abonnement ist abgelaufen. Bitte verlängern Sie es, um alle Funktionen weiterhin nutzen zu können.",
            variant: "destructive",
          });
        }
      } catch (e) {
        console.error("Fehler bei der Überprüfung des Abonnementstatus:", e);
      }
    }
  }, [user, toast]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (response) => {
      // Überprüfen, ob eine Zwei-Faktor-Authentifizierung erforderlich ist
      if (response && "requiresVerification" in response && response.requiresVerification) {
        setRequiresTwoFactor(true);
        setPendingUserId(response.userId);
        toast({
          title: "Verifizierung erforderlich",
          description: response.message || "Bitte geben Sie den an Ihr Telefon gesendeten Verifizierungscode ein.",
        });
        return;
      }
      
      // Normaler Login-Erfolg
      queryClient.setQueryData(["/api/user"], response);
      setRequiresTwoFactor(false);
      setPendingUserId(null);
      
      // Weiterleitung zum Dashboard nach erfolgreichem Login
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Registrierung fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async (data: VerificationData) => {
      const res = await apiRequest("POST", "/api/verify-code", data);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      setRequiresTwoFactor(false);
      setPendingUserId(null);
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Verifizierung fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const requestPasswordResetMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await apiRequest("POST", "/api/request-password-reset", data);
      return await res.json();
    },
    onSuccess: (data: { message: string }) => {
      toast({
        title: "E-Mail gesendet",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordData) => {
      const res = await apiRequest("POST", "/api/reset-password", data);
      return await res.json();
    },
    onSuccess: (data: { message: string }) => {
      toast({
        title: "Passwort zurückgesetzt",
        description: data.message,
      });
      navigate("/auth");
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      
      // Direkte Weiterleitung zur Login-Seite
      console.log("Abmeldung erfolgreich, direkte Weiterleitung zur Anmeldeseite...");
      window.location.href = "/"; // Verwende direkte URL-Änderung statt Router Navigation
      
      // Toast erst nach der Weiterleitung anzeigen
      setTimeout(() => {
        toast({
          title: "Abgemeldet",
          description: "Sie wurden erfolgreich abgemeldet.",
        });
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Abmeldung fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        verifyCodeMutation,
        requestPasswordResetMutation,
        resetPasswordMutation,
        requiresTwoFactor,
        pendingUserId,
        isSubscriptionActive,
        isTrialExpired,
        daysLeftInTrial,
        trialExpiryDate
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
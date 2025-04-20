import { createContext, ReactNode, useContext, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

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
};

type LoginData = Pick<InsertUser, "username" | "password">;
type VerificationData = { userId: number; code: string };
type ResetPasswordData = { userId: number; code: string; newPassword: string };

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (response) => {
      // 2FA temporär deaktiviert - jeder Login wird direkt als normaler Login behandelt
      const user = response as SelectUser;
      queryClient.setQueryData(["/api/user"], user);
      
      // Weiterleitung direkt zur Projektseite ohne Zwischenschritte
      console.log("Login erfolgreich, direkte Weiterleitung zur Projektübersicht...");
      window.location.href = "/projects"; // Verwende direkte URL-Änderung statt Router Navigation
      
      // Toast erst nach der Weiterleitung anzeigen
      setTimeout(() => {
        toast({
          title: "Erfolgreich angemeldet",
          description: "Willkommen zurück!",
        });
      }, 100);
      
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setRequiresTwoFactor(false);
      setPendingUserId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
      setRequiresTwoFactor(false);
      setPendingUserId(null);
    },
  });
  
  // Mutation zum Verifizieren des 2FA-Codes
  const verifyCodeMutation = useMutation({
    mutationFn: async (data: VerificationData) => {
      const res = await apiRequest("POST", "/api/verify-code", data);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      
      // Weiterleitung direkt zur Projektseite ohne Zwischenschritte
      console.log("Verifizierung erfolgreich, direkte Weiterleitung zur Projektübersicht...");
      window.location.href = "/projects"; // Verwende direkte URL-Änderung statt Router Navigation
      
      // Toast erst nach der Weiterleitung anzeigen
      setTimeout(() => {
        toast({
          title: "Verifizierung erfolgreich",
          description: "Sie wurden erfolgreich angemeldet.",
        });
      }, 100);
      
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setRequiresTwoFactor(false);
      setPendingUserId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Verifizierung fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation zum Anfordern einer Passwort-Zurücksetzung
  const requestPasswordResetMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await apiRequest("POST", "/api/request-password-reset", data);
      return await res.json();
    },
    onSuccess: (response: { message: string }) => {
      toast({
        title: "Passwort-Zurücksetzung angefordert",
        description: response.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Anforderung fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation zum Zurücksetzen des Passworts
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordData) => {
      const res = await apiRequest("POST", "/api/reset-password", data);
      return await res.json();
    },
    onSuccess: (response: { message: string }) => {
      // Direkte Weiterleitung zur Anmeldeseite
      console.log("Passwort zurückgesetzt, direkte Weiterleitung zur Anmeldeseite...");
      window.location.href = "/"; // Verwende direkte URL-Änderung statt Router Navigation
      
      // Toast erst nach der Weiterleitung anzeigen
      setTimeout(() => {
        toast({
          title: "Passwort zurückgesetzt",
          description: response.message,
        });
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Zurücksetzen fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      
      // Weiterleitung direkt zur Projektseite ohne Zwischenschritte
      console.log("Registrierung erfolgreich, direkte Weiterleitung zur Projektübersicht...");
      window.location.href = "/projects"; // Verwende direkte URL-Änderung statt Router Navigation
      
      // Toast erst nach der Weiterleitung anzeigen
      setTimeout(() => {
        toast({
          title: "Registrierung erfolgreich",
          description: "Ihr Konto wurde erstellt.",
        });
      }, 100);
      
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Registrierung fehlgeschlagen",
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
        pendingUserId
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

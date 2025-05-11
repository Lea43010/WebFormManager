import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SubscriptionCard } from './subscription-card';
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { User } from '@shared/schema';
import { SubscriptionPlan } from '@shared/schema';

interface SubscriptionPlansProps {
  user?: User;
}

export function SubscriptionPlans({ user }: SubscriptionPlansProps) {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  
  // Abonnementpläne abrufen
  const { 
    data: plans = [], 
    isLoading: isLoadingPlans,
    error: plansError 
  } = useQuery({
    queryKey: ['/api/subscription/plans'],
    retry: 2,
  });
  
  // Aktuelles Benutzerabonnement abrufen
  const { 
    data: userSubscription,
    isLoading: isLoadingSubscription,
    error: subscriptionError
  } = useQuery({
    queryKey: ['/api/subscription/user'],
    enabled: !!user, // Nur laden, wenn der Benutzer angemeldet ist
    retry: 2,
  });
  
  // Mutation zum Erstellen eines neuen Abonnements
  const { mutate: createSubscription, isPending: isCreating } = useMutation({
    mutationFn: async (planId: number) => {
      const response = await apiRequest('POST', `/api/subscription/user/${user?.id}`, {
        planId,
        startDate: new Date().toISOString(),
        endDate: null, // Server setzt das Enddatum basierend auf der Intervalleinstellung
        status: 'active',
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Abonnement erfolgreich",
        description: "Ihr Abonnement wurde erfolgreich abgeschlossen.",
        variant: "default",
      });
      // Cache für Benutzerabonnement aktualisieren
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/user'] });
    },
    onError: (error: unknown) => {
      console.error('Fehler beim Erstellen des Abonnements:', error);
      toast({
        title: "Fehler beim Abonnieren",
        description: error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    }
  });
  
  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
  };
  
  const handleSubscribe = () => {
    if (!selectedPlan) return;
    if (!user) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Bitte melden Sie sich an, um fortzufahren.",
        variant: "destructive",
      });
      return;
    }
    
    createSubscription(selectedPlan.id);
  };
  
  const isLoading = isLoadingPlans || isLoadingSubscription;
  const error = plansError || subscriptionError;
  
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Fehler</AlertTitle>
        <AlertDescription>
          Beim Laden der Abonnementdaten ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="w-full">
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3 md:gap-8 mb-8 max-w-6xl mx-auto">
            {plans.map((plan: SubscriptionPlan) => (
              <SubscriptionCard
                key={plan.id}
                plan={plan}
                isSelected={selectedPlan?.id === plan.id}
                onSelect={handleSelectPlan}
                activeSubscription={userSubscription}
                isLoading={isCreating}
              />
            ))}
          </div>
          
          {selectedPlan && (
            <div className="flex justify-center mt-8">
              <Button 
                className="px-10 py-6 text-lg font-inter font-medium bg-[#6a961f] hover:bg-[#5a841a] text-white"
                onClick={handleSubscribe}
                disabled={isCreating}
                size="lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Wird verarbeitet...
                  </>
                ) : (
                  'Abonnement abschließen'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
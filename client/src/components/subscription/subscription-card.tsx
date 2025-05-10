import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { SubscriptionPlan } from '@shared/schema';

interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  isSelected?: boolean;
  onSelect?: (plan: SubscriptionPlan) => void;
  activeSubscription?: {
    id: number;
    status: string;
    planId: number;
    nextBillingDate?: string;
  } | null;
  isLoading?: boolean;
}

export function SubscriptionCard({ 
  plan, 
  isSelected = false, 
  onSelect,
  activeSubscription,
  isLoading = false 
}: SubscriptionCardProps) {
  
  const isActivePlan = activeSubscription?.planId === plan.id;
  const isPastDue = activeSubscription?.status === 'past_due';
  const isCancelled = activeSubscription?.status === 'cancelled';
  const isExpired = activeSubscription?.status === 'expired';
  
  const formatPrice = (price: number) => {
    // Konvertiere den Preis in Cents zu Euro
    const priceInEuro = price / 100;
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(priceInEuro);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getStatusText = () => {
    if (isActivePlan) {
      if (isPastDue) return "Zahlung überfällig";
      if (isCancelled) return "Gekündigt";
      if (isExpired) return "Abgelaufen";
      return `Aktiv bis ${formatDate(activeSubscription?.nextBillingDate)}`;
    }
    return '';
  };

  // Extrahiere Funktionsmerkmale aus der Beschreibung
  const features = plan.description.split(',').map(item => item.trim());

  return (
    <Card 
      className={`w-full md:max-w-md transition-all duration-300 bg-white rounded-xl flex flex-col h-full ${
        isSelected ? 'border-[#6a961f] border-2 shadow-lg transform scale-105' : 'shadow'
      } ${isActivePlan && !isPastDue && !isCancelled && !isExpired ? 'bg-green-50' : ''}`}
    >
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-inter text-[#111827]">{plan.name}</CardTitle>
        <CardDescription className="text-xl font-bold text-[#111827]">
          {formatPrice(plan.price)}/{plan.interval === 'month' ? 'Monat' : 'Jahr'}
        </CardDescription>
        {isActivePlan && (
          <div className={`text-sm font-medium mt-2 ${
            isPastDue || isExpired ? 'text-red-500' : 
            isCancelled ? 'text-amber-500' : 'text-green-600'
          }`}>
            {getStatusText()}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-[#6a961f] mr-2 shrink-0 mt-0.5" />
              <span className="text-[#111827] font-inter">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex justify-center p-6 pt-2">
        <Button 
          onClick={() => onSelect && onSelect(plan)} 
          disabled={isLoading || (isActivePlan && !isPastDue && !isExpired)}
          className={`w-full font-inter font-medium ${
            isSelected 
              ? "bg-[#6a961f] hover:bg-[#5a841a] text-white" 
              : "bg-white border-[#6a961f] text-[#6a961f] hover:bg-[#f3f9ea] hover:text-[#6a961f]"
          }`}
          variant={isSelected ? "default" : "outline"}
          size="lg"
        >
          {isLoading ? 'Laden...' : isActivePlan ? 'Aktueller Plan' : 'Auswählen'}
        </Button>
      </CardFooter>
    </Card>
  );
}
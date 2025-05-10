import React from 'react';
import { useTitle } from '@/hooks/use-title';
import { SubscriptionPlans } from '@/components/subscription/subscription-plans';
import { useUser } from '@/hooks/use-user';
import { Header } from '@/components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, CreditCard, FileText, Loader2, Settings, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SubscriptionPage = () => {
  useTitle('Abonnement - Bau-Structura');
  const { user, isLoading: isUserLoading } = useUser();
  const { toast } = useToast();

  // Benutzerabonnement abrufen
  const { 
    data: subscription,
    isLoading: isSubscriptionLoading
  } = useQuery({
    queryKey: ['/api/subscription/user'],
    enabled: !!user,
  });

  // Abonnement kündigen
  const { mutate: cancelSubscription, isPending: isCancelling } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PUT', `/api/subscription/user/${user?.id}`, {
        status: 'cancelled',
        cancellationDate: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Abonnement gekündigt",
        description: "Ihr Abonnement wurde erfolgreich gekündigt.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler bei der Kündigung",
        description: error.message || "Ein unbekannter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    }
  });

  const handleCancelSubscription = () => {
    if (window.confirm('Möchten Sie Ihr Abonnement wirklich kündigen? Sie können die Dienste bis zum Ende der Abrechnungsperiode weiterhin nutzen.')) {
      cancelSubscription();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nicht verfügbar';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const isLoading = isUserLoading || isSubscriptionLoading;

  if (isLoading) {
    return (
      <div className="container py-10">
        <Header title="Abonnement" />
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <div className="container py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Header title="Abonnement" />
        
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6 mb-8">
          <Tabs defaultValue="plans" className="w-full">
            <TabsList className="mb-8 bg-[#F3F4F6] mx-auto w-fit">
              <TabsTrigger value="plans" className="data-[state=active]:bg-[#6a961f] data-[state=active]:text-white px-6">
                Abonnement-Pläne
              </TabsTrigger>
              {subscription && (
                <TabsTrigger value="details" className="data-[state=active]:bg-[#6a961f] data-[state=active]:text-white px-6">
                  Abonnement-Details
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="plans">
              <div className="space-y-8">
                <div className="max-w-3xl mx-auto">
                  <div className="space-y-3 text-center mb-8">
                    <h2 className="text-3xl font-bold tracking-tight font-inter text-[#111827]">Verfügbare Pläne</h2>
                    <p className="font-inter text-[#4b5563] text-lg max-w-2xl mx-auto">
                      Wählen Sie den Abonnementplan, der am besten zu Ihren Anforderungen passt.
                    </p>
                  </div>
                  <Separator className="mb-8" />
                </div>

                <SubscriptionPlans user={user} />
              </div>
            </TabsContent>

            {subscription && (
              <TabsContent value="details">
                <div className="space-y-8">
                  <div className="max-w-3xl mx-auto">
                    <div className="space-y-3 text-center mb-8">
                      <h2 className="text-3xl font-bold tracking-tight font-inter text-[#111827]">Abonnement-Details</h2>
                      <p className="font-inter text-[#4b5563] text-lg max-w-2xl mx-auto">
                        Hier finden Sie alle Informationen zu Ihrem aktuellen Abonnement.
                      </p>
                    </div>
                    <Separator className="mb-8" />
                  </div>

                  <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
                    <Card className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                      <CardHeader className="bg-[#f9fafb] border-b border-gray-100">
                        <CardTitle className="flex items-center text-[#111827] font-inter">
                          <CreditCard className="mr-3 h-5 w-5 text-[#6a961f]" />
                          Abonnement-Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-5">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="text-sm font-medium font-inter text-[#4b5563]">Status</div>
                            <div className="text-sm font-medium font-inter text-[#111827]">
                              {subscription.status === 'trial' && 'Testphase'}
                              {subscription.status === 'active' && 'Aktiv'}
                              {subscription.status === 'past_due' && 'Zahlung überfällig'}
                              {subscription.status === 'cancelled' && 'Gekündigt'}
                              {subscription.status === 'expired' && 'Abgelaufen'}
                            </div>
                            
                            <div className="text-sm font-medium font-inter text-[#4b5563]">Plan</div>
                            <div className="text-sm font-medium font-inter text-[#111827]">
                              {subscription.planDetails?.name || 'Unbekannt'}
                            </div>
                            
                            <div className="text-sm font-medium font-inter text-[#4b5563]">Preis</div>
                            <div className="text-sm font-medium font-inter text-[#111827]">
                              {subscription.planDetails ? 
                                new Intl.NumberFormat('de-DE', { 
                                  style: 'currency', 
                                  currency: 'EUR',
                                  minimumFractionDigits: 2
                                }).format(subscription.planDetails.price / 100) 
                                : 'Unbekannt'
                              }
                              {subscription.planDetails?.interval === 'month' ? '/Monat' : '/Jahr'}
                            </div>
                            
                            {subscription.startDate && (
                              <>
                                <div className="text-sm font-medium font-inter text-[#4b5563]">Startdatum</div>
                                <div className="text-sm font-medium font-inter text-[#111827]">{formatDate(subscription.startDate)}</div>
                              </>
                            )}
                            
                            {subscription.nextBillingDate && (
                              <>
                                <div className="text-sm font-medium font-inter text-[#4b5563]">Nächste Abrechnung</div>
                                <div className="text-sm font-medium font-inter text-[#111827]">{formatDate(subscription.nextBillingDate)}</div>
                              </>
                            )}
                            
                            {subscription.cancellationDate && (
                              <>
                                <div className="text-sm font-medium font-inter text-[#4b5563]">Gekündigt am</div>
                                <div className="text-sm font-medium font-inter text-[#111827]">{formatDate(subscription.cancellationDate)}</div>
                              </>
                            )}
                          </div>
                          
                          {subscription.status === 'active' && (
                            <Button 
                              variant="outline" 
                              className="w-full mt-6 py-5 bg-white border-[#6a961f] text-[#6a961f] hover:bg-[#f3f9ea] hover:text-[#6a961f] font-inter"
                              onClick={handleCancelSubscription}
                              disabled={isCancelling}
                            >
                              {isCancelling ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#6a961f]" />
                                  Wird verarbeitet...
                                </>
                              ) : (
                                'Abonnement kündigen'
                              )}
                            </Button>
                          )}

                          {subscription.status === 'past_due' && (
                            <Alert variant="destructive" className="mt-6 border-red-500 bg-red-50">
                              <AlertTitle className="font-inter text-red-800 font-semibold">Zahlung überfällig</AlertTitle>
                              <AlertDescription className="font-inter text-red-700">
                                Ihre letzte Zahlung war nicht erfolgreich. Bitte aktualisieren Sie Ihre Zahlungsinformationen.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                      <CardHeader className="bg-[#f9fafb] border-b border-gray-100">
                        <CardTitle className="flex items-center text-[#111827] font-inter">
                          <FileText className="mr-3 h-5 w-5 text-[#6a961f]" />
                          Rechnungen
                        </CardTitle>
                        <CardDescription className="text-[#111827] font-inter">
                          Ihre letzten Rechnungen und Zahlungshistorie
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Hier könnte eine Rechnungshistorie angezeigt werden, wenn die Daten verfügbar sind */}
                          <p className="text-sm font-inter text-[#111827]">
                            Die Rechnungshistorie ist derzeit nicht verfügbar.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
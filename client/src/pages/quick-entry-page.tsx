import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Card, 
  CardContent,
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { companyTypes, insertCompanySchema, insertCustomerSchema } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useLocation } from "wouter";

// Schemas für die Formulare
const customerFormSchema = z.object({
  customerId: z.string().min(1, "Kundennummer ist erforderlich"),
  street: z.string().min(1, "Straße ist erforderlich"),
  houseNumber: z.string().min(1, "Hausnummer ist erforderlich"),
  postalCode: z.string().min(5, "PLZ muss mindestens 5 Zeichen haben"),
  city: z.string().min(1, "Stadt ist erforderlich"),
  customerEmail: z.string().email("Ungültige E-Mail-Adresse"),
  customerPhone: z.string().optional(),
});

const companyFormSchema = z.object({
  companyId: z.string().min(1, "Firmennummer ist erforderlich"),
  companyName: z.string().min(1, "Firmenname ist erforderlich"),
  companyType: z.string().min(1, "Unternehmenstyp ist erforderlich"),
  street: z.string().min(1, "Straße ist erforderlich"),
  houseNumber: z.string().min(1, "Hausnummer ist erforderlich"),
  postalCode: z.string().min(5, "PLZ muss mindestens 5 Zeichen haben"),
  city: z.string().min(1, "Stadt ist erforderlich"),
  companyEmail: z.string().email("Ungültige E-Mail-Adresse"),
  companyPhone: z.string().optional(),
});

export default function QuickEntryPage() {
  const [activeTab, setActiveTab] = useState("customer");
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Kunden-Formular
  const customerForm = useForm<z.infer<typeof customerFormSchema>>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      customerId: "",
      street: "",
      houseNumber: "",
      postalCode: "",
      city: "",
      customerEmail: "",
      customerPhone: "",
    },
  });

  // Firmen-Formular
  const companyForm = useForm<z.infer<typeof companyFormSchema>>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      companyId: "",
      companyName: "",
      companyType: "",
      street: "",
      houseNumber: "",
      postalCode: "",
      city: "",
      companyEmail: "",
      companyPhone: "",
    },
  });

  // Customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof customerFormSchema>) => {
      const res = await apiRequest("POST", "/api/customers", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Erfolgreich",
        description: "Kundendaten wurden gespeichert.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      customerForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Speichern der Kundendaten: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof companyFormSchema>) => {
      const res = await apiRequest("POST", "/api/companies", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Erfolgreich",
        description: "Firmendaten wurden gespeichert.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      companyForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Speichern der Firmendaten: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onCustomerSubmit = (values: z.infer<typeof customerFormSchema>) => {
    // Konvertieren der String-Werte zu Zahlen für Felder, die als Zahlen erwartet werden
    const transformedValues = {
      ...values,
      customerId: parseInt(values.customerId, 10),
      postalCode: parseInt(values.postalCode, 10),
      customerPhone: values.customerPhone ? parseInt(values.customerPhone, 10) : null,
    };
    
    createCustomerMutation.mutate(transformedValues as any);
  };

  const onCompanySubmit = (values: z.infer<typeof companyFormSchema>) => {
    // Konvertieren der String-Werte zu Zahlen für Felder, die als Zahlen erwartet werden
    const transformedValues = {
      ...values,
      postalCode: parseInt(values.postalCode, 10),
      companyPhone: values.companyPhone ? parseInt(values.companyPhone, 10) : null,
    };
    
    createCompanyMutation.mutate(transformedValues as any);
  };

  const goBackToProjects = () => {
    navigate("/projects");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center justify-end mb-6">
        <Button variant="outline" onClick={goBackToProjects}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zu Projekten
        </Button>
      </div>
      
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardTitle>Kunden & Firmendaten Eingabe</CardTitle>
          <CardDescription>
            Fügen Sie schnell neue Kunden oder Firmendaten hinzu, die Sie in Ihren Projekten verwenden können.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="customer">Neuer Kunde</TabsTrigger>
              <TabsTrigger value="company">Neue Firma</TabsTrigger>
            </TabsList>
            
            <TabsContent value="customer" className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-md mb-4">
                <h3 className="text-lg font-semibold mb-2">Kundendaten erfassen</h3>
                <p className="text-sm text-muted-foreground">
                  Füllen Sie die Pflichtfelder aus, um einen neuen Kunden anzulegen.
                </p>
              </div>
              
              <Form {...customerForm}>
                <form onSubmit={customerForm.handleSubmit(onCustomerSubmit)} className="space-y-4">
                  <FormField
                    control={customerForm.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kundennummer *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="K12345" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={customerForm.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Straße *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Hauptstraße" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={customerForm.control}
                      name="houseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hausnummer *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={customerForm.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PLZ *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="12345" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={customerForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stadt *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Berlin" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={customerForm.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-Mail *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="kontakt@kunde.de" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={customerForm.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefon</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+49 123 456789" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={createCustomerMutation.isPending}
                      className="w-full md:w-auto"
                    >
                      {createCustomerMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Save className="mr-2 h-4 w-4" />
                      Kunden speichern
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="company" className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-md mb-4">
                <h3 className="text-lg font-semibold mb-2">Firmendaten erfassen</h3>
                <p className="text-sm text-muted-foreground">
                  Füllen Sie die Pflichtfelder aus, um eine neue Firma anzulegen.
                </p>
              </div>
              
              <Form {...companyForm}>
                <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="companyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Firmennummer *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="F12345" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={companyForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Firmenname *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Musterfirma GmbH" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={companyForm.control}
                    name="companyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unternehmenstyp *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Unternehmenstyp auswählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companyTypes.enumValues.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Straße *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Firmenstraße" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={companyForm.control}
                      name="houseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hausnummer *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PLZ *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="12345" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={companyForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stadt *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Berlin" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="companyEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-Mail *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="info@firma.de" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={companyForm.control}
                      name="companyPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefon</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+49 123 456789" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={createCompanyMutation.isPending}
                      className="w-full md:w-auto"
                    >
                      {createCompanyMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Save className="mr-2 h-4 w-4" />
                      Firma speichern
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="bg-muted/20 border-t px-6 py-4">
          <p className="text-sm text-muted-foreground">
            * Pflichtfelder müssen ausgefüllt werden
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
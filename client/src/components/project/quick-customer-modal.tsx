import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
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
import { Loader2 } from "lucide-react";

// Formular-Schema für Kunden
const customerFormSchema = z.object({
  customerId: z.string().min(1, "Kundennummer ist erforderlich"),
  firstName: z.string().min(1, "Vorname ist erforderlich"),
  lastName: z.string().min(1, "Nachname ist erforderlich"),
  email: z.string().email("Gültige E-Mail erforderlich").optional().or(z.literal("")),
  phone: z.string().optional(),
  street: z.string().optional(),
  zipCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default("Deutschland"),
});

// Typ für die Formulardaten
type CustomerFormData = z.infer<typeof customerFormSchema>;

// Props für die Komponente
interface QuickCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: (customerId: number) => void;
}

export default function QuickCustomerModal({ 
  isOpen, 
  onClose,
  onCustomerCreated
}: QuickCustomerModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formular initialisieren
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      customerId: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      street: "",
      zipCode: "",
      city: "",
      country: "Deutschland",
    },
  });

  // Funktion zum Abrufen der nächsten Kundennummer
  const fetchNextCustomerId = async () => {
    try {
      const response = await apiRequest("GET", '/api/customers/next-id');
      const data = await response.json();
      form.setValue('customerId', String(data.nextId || ''));
    } catch (error) {
      console.error("Fehler beim Abrufen der nächsten Kundennummer:", error);
      toast({
        title: "Hinweis",
        description: "Automatische Kundennummer konnte nicht generiert werden. Bitte manuell eingeben.",
        variant: "default",
      });
    }
  };

  // Beim Öffnen des Modals die nächste Kundennummer abrufen
  useEffect(() => {
    if (isOpen) {
      fetchNextCustomerId();
    }
  }, [isOpen]);

  // Handler für das Absenden des Formulars
  const onSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/customers", data);
      const newCustomer = await response.json();
      
      toast({
        title: "Kunde erstellt",
        description: `${data.firstName} ${data.lastName} wurde erfolgreich angelegt.`,
      });
      
      // Zurücksetzen und Schließen des Formulars
      form.reset();
      onCustomerCreated(newCustomer.id);
      
      // Weiterleitung zum vollständigen Kundenprofil
      window.location.href = `/customers/edit/${newCustomer.id}`;
      
      onClose();
    } catch (error) {
      console.error("Fehler beim Erstellen des Kunden:", error);
      toast({
        title: "Fehler",
        description: "Der Kunde konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Neuen Kunden anlegen</DialogTitle>
          <DialogDescription>
            Geben Sie die Kundendaten ein, um einen neuen Kunden zu erstellen.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kundennummer *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vorname *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nachname *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Straße</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PLZ</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Ort</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Land</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="text-xs text-gray-500 mt-2">* Pflichtfelder</div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  "Speichern"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
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

// Formular-Schema für Firmen
const companyFormSchema = z.object({
  companyId: z.string().min(1, "Firmennummer ist erforderlich"),
  companyName: z.string().min(1, "Firmenname ist erforderlich"),
  contactPerson: z.string().optional(),
  email: z.string().email("Gültige E-Mail erforderlich").optional().or(z.literal("")),
  phone: z.string().optional(),
  street: z.string().optional(),
  zipCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default("Deutschland"),
  vatId: z.string().optional(),
});

// Typ für die Formulardaten
type CompanyFormData = z.infer<typeof companyFormSchema>;

// Props für die Komponente
interface QuickCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanyCreated: (companyId: number) => void;
}

export default function QuickCompanyModal({ 
  isOpen, 
  onClose,
  onCompanyCreated
}: QuickCompanyModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formular initialisieren
  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      companyId: "",
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      street: "",
      zipCode: "",
      city: "",
      country: "Deutschland",
      vatId: "",
    },
  });

  // Funktion zum Abrufen der nächsten Firmennummer
  const fetchNextCompanyId = async () => {
    try {
      const response = await apiRequest("GET", '/api/companies/next-id');
      const data = await response.json();
      form.setValue('companyId', String(data.nextId || ''));
    } catch (error) {
      console.error("Fehler beim Abrufen der nächsten Firmennummer:", error);
      toast({
        title: "Hinweis",
        description: "Automatische Firmennummer konnte nicht generiert werden. Bitte manuell eingeben.",
        variant: "default",
      });
    }
  };

  // Beim Öffnen des Modals die nächste Firmennummer abrufen
  useEffect(() => {
    if (isOpen) {
      fetchNextCompanyId();
    }
  }, [isOpen]);

  // Hook für die Navigation
  const [, navigate] = useLocation();

  // Handler für das Absenden des Formulars
  const onSubmit = async (data: CompanyFormData) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/companies", data);
      const newCompany = await response.json();
      
      toast({
        title: "Firma erstellt",
        description: `${data.companyName} wurde erfolgreich angelegt.`,
      });
      
      // Zurücksetzen und Schließen des Formulars
      form.reset();
      // Callback aufrufen, um die neue Firma im Projekt zu verwenden
      onCompanyCreated(newCompany.id);
      onClose();
      
      // Optional: In einem separaten useEffect die Navigation durchführen
      // Dies verhindert 404-Fehler und stellt sicher, dass erst der onClose() ausgeführt wird
      setTimeout(() => {
        // Nur navigieren, wenn die aktuelle URL nicht die Projekterstellung ist
        if (!window.location.pathname.includes('/projects/new') && 
            !window.location.pathname.includes('/projects/edit')) {
          navigate(`/companies/edit/${newCompany.id}`);
        }
      }, 100);
    } catch (error) {
      console.error("Fehler beim Erstellen der Firma:", error);
      toast({
        title: "Fehler",
        description: "Die Firma konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
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
          <DialogTitle>Neue Firma anlegen</DialogTitle>
          <DialogDescription>
            Geben Sie die Firmendaten ein, um eine neue Firma zu erstellen.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firmennummer *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Firmenname *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ansprechpartner</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vatId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Umsatzsteuer-ID</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  <FormItem className="md:col-span-2">
                    <FormLabel>Straße</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  <FormItem>
                    <FormLabel>Ort</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
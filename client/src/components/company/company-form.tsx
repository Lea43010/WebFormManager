import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertCompanySchema, Company } from "@shared/schema";
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
import { Loader2, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COMPANY_TYPES = ["Subunternehmen", "Generalunternehmen"];
const COUNTRIES = ["Deutschland", "Österreich", "Schweiz", "Andere"];
const BUNDESLAENDER = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen"
];

interface CompanyFormProps {
  company?: Company | null;
  onSubmit: (data: Partial<Company>) => Promise<Company>;
  isLoading?: boolean;
}

export default function CompanyForm({ company, onSubmit, isLoading = false }: CompanyFormProps) {
  // Create a form schema extending the insertCompanySchema
  const formSchema = z.object({
    id: z.number().optional(),
    projectId: z.number().optional(),
    companyArt: z.string().min(1, "Unternehmensart ist erforderlich"),
    companyName: z.string().min(1, "Firmenname ist erforderlich"),
    street: z.string().optional(),
    houseNumber: z.string().optional(),
    addressLine2: z.string().optional(),
    postalCode: z.string().optional(),
    city: z.string().optional(),
    cityPart: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    companyPhone: z.string().optional(),
    companyEmail: z.string().email("Ungültige E-Mail-Adresse").optional().or(z.literal('')),
    // Felder für den Ansprechpartner
    contactFirstname: z.string().optional(),
    contactLastname: z.string().optional(),
  });

  // Initialize form with default values from company or empty values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: company?.id,
      projectId: company?.projectId || 0,
      companyArt: company?.companyArt || "",
      companyName: company?.companyName || "",
      street: company?.street || "",
      houseNumber: company?.houseNumber || "",
      addressLine2: company?.addressLine2 || "",
      postalCode: company?.postalCode ? String(company.postalCode) : '',
      city: company?.city || "",
      cityPart: company?.cityPart || "",
      state: company?.state || "",
      country: company?.country || "Deutschland",
      companyPhone: company?.companyPhone ? String(company.companyPhone) : '',
      companyEmail: company?.companyEmail || "",
      // Standardwerte für Ansprechpartner-Felder
      contactFirstname: "",
      contactLastname: "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      // Konvertiere die Daten, um den Typen der Schema zu entsprechen
      const transformedData = {
        ...data,
        postalCode: data.postalCode && data.postalCode.toString().trim() !== '' ? data.postalCode : null,
        companyPhone: data.companyPhone && data.companyPhone.toString().trim() !== '' ? data.companyPhone : null,
      };
      
      // Entferne die Ansprechpartner-Felder aus dem transformedData-Objekt
      const { contactFirstname, contactLastname, ...companyData } = transformedData;
      
      // Speichere die Firmendaten
      const savedCompany = await onSubmit(companyData as any);
      
      // Wenn Vor- und Nachname angegeben wurden, erstelle einen neuen Ansprechpartner
      if (contactFirstname && contactLastname && savedCompany && savedCompany.id) {
        try {
          // Erstelle einen neuen Ansprechpartner und verknüpfe ihn mit der Firma
          const personData = {
            companyId: savedCompany.id,
            firstname: contactFirstname,
            lastname: contactLastname,
          };
          
          // Sende die Ansprechpartner-Daten an den Server
          const response = await fetch('/api/persons', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(personData),
          });
          
          if (!response.ok) {
            throw new Error(`Fehler beim Speichern des Ansprechpartners: ${response.statusText}`);
          }
          
          console.log('Ansprechpartner erfolgreich gespeichert');
        } catch (error) {
          console.error('Fehler beim Speichern des Ansprechpartners:', error);
        }
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Firmendaten:', error);
      throw error;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-md shadow-sm p-4 md:p-6">
          
          {/* Unternehmensinformation */}
          <div className="form-section">
            <h3 className="form-heading"><span className="green-emoji mr-2">🏢</span> Unternehmensdaten</h3>
            
            {/* Unternehmensart */}
            <div className="mb-4">
              <FormField
                control={form.control}
                name="companyArt"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="modern-form-label">Unternehmensart</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="modern-form-input">
                          <SelectValue placeholder="Unternehmensart auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COMPANY_TYPES.map((type) => (
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
            </div>
            
            {/* Firmenname und Ansprechpartner */}
            <div className="mb-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="modern-form-label">Firmenname</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="modern-form-input" 
                        placeholder="Firmenname"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Firmennummer (versteckt) */}
            <div className="hidden">
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="modern-form-label">Firmennummer</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                        value={field.value || ''} 
                        disabled={!!company}
                        placeholder="Wird automatisch vergeben"
                        className="modern-form-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Adresse */}
          <div className="form-section">
            <h3 className="form-heading"><span className="green-emoji mr-2">📍</span> Adresse</h3>
            
            {/* Straße und Hausnummer */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-3">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="modern-form-label">Straße</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="modern-form-input" 
                          placeholder="Straße"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <FormField
                  control={form.control}
                  name="houseNumber"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="modern-form-label">Hausnummer</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="modern-form-input" 
                          placeholder="Hausnummer"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Zusatz (optional) */}
            <div className="mb-4">
              <FormField
                control={form.control}
                name="addressLine2"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="modern-form-label">Zusatz (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="modern-form-input" 
                        placeholder="Zusatz (optional)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* PLZ und Stadt */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="modern-form-label">PLZ</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ''}
                        className="modern-form-input"
                        placeholder="PLZ"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="modern-form-label">Ort</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="modern-form-input" 
                        placeholder="Ort"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Stadtteil */}
            <div className="mb-4">
              <FormField
                control={form.control}
                name="cityPart"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="modern-form-label">Stadtteil (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="modern-form-input" 
                        placeholder="Stadtteil (optional)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Bundesland und Land (versteckt) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 hidden">
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="modern-form-label">Bundesland</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="modern-form-input">
                          <SelectValue placeholder="Bundesland auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BUNDESLAENDER.map((bundesland) => (
                          <SelectItem key={bundesland} value={bundesland}>
                            {bundesland}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="modern-form-label">Land</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="modern-form-input">
                          <SelectValue placeholder="Land auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Kontaktdaten */}
          <div className="form-section">
            <h3 className="form-heading"><span className="green-emoji mr-2">📞</span> Kontaktdaten</h3>
            
            {/* Telefon und Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormField
                control={form.control}
                name="companyPhone"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="modern-form-label">Telefonnummer</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ''}
                        className="modern-form-input"
                        placeholder="Telefonnummer"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="companyEmail"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="modern-form-label">E-Mail-Adresse</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        {...field} 
                        className="modern-form-input" 
                        placeholder="E-Mail-Adresse"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Ansprechpartner */}
          <div className="form-section">
            <h3 className="form-heading"><span className="green-emoji mr-2">👤</span> Firmen-Ansprechpartner</h3>
            
            {/* Vorname und Nachname */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormField
                control={form.control}
                name="contactFirstname"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="modern-form-label">Vorname</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="modern-form-input" 
                        placeholder="Vorname des Ansprechpartners"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contactLastname"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="modern-form-label">Nachname</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="modern-form-input" 
                        placeholder="Nachname des Ansprechpartners"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-8 px-4 sm:px-0">
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full md:w-64 py-6 text-lg mobile-touch-button"
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Save className="mr-2 h-5 w-5" />
            )}
            {company ? "Unternehmen aktualisieren" : "Unternehmen speichern"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

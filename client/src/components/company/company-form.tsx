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
  onSubmit: (data: Partial<Company>) => void;
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
    },
  });

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    // Konvertiere die Daten, um den Typen der Schema zu entsprechen
    const transformedData = {
      ...data,
      postalCode: data.postalCode && data.postalCode.toString().trim() !== '' ? data.postalCode : null,
      companyPhone: data.companyPhone && data.companyPhone.toString().trim() !== '' ? data.companyPhone : null,
    };
    onSubmit(transformedData as any);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="bg-white p-6 rounded-md">
          <h2 className="text-xl font-medium mb-6">{company ? "Unternehmen bearbeiten" : "Neues Unternehmen"}</h2>
          <p className="text-sm text-gray-500 mb-6">Geben Sie die Details des Unternehmens ein.</p>
          
          {/* Unternehmensinformation */}
          <h3 className="text-lg font-medium mb-4">🏢 Unternehmensdaten</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firmennummer</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                        value={field.value || ''} 
                        disabled={!!company}
                        placeholder="Wird automatisch vergeben"
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
                name="companyArt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unternehmensart</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
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
            
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firmenname</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Adresse */}
          <h3 className="text-lg font-medium mb-4">📍 Adresse</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2">
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
            </div>
            
            <div>
              <FormField
                control={form.control}
                name="houseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hausnummer</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="md:col-span-3">
              <FormField
                control={form.control}
                name="addressLine2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zusatz</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postleitzahl (PLZ)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ''}
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
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ort / Stadt</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <FormField
                control={form.control}
                name="cityPart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stadtteil</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bundesland</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
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
            </div>
            
            <div>
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Land</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
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
          
          {/* Kontaktinformationen */}
          <h3 className="text-lg font-medium mb-4">📞 Kontaktinformationen</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <FormField
                control={form.control}
                name="companyPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefonnummer der Firma</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ''}
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
                name="companyEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail-Adresse der Firma</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full md:w-64 py-6 text-lg"
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

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertCustomerSchema, Customer } from "@shared/schema";
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

interface CustomerFormProps {
  customer?: Customer | null;
  onSubmit: (data: Partial<Customer>) => void;
  isLoading?: boolean;
}

export default function CustomerForm({ customer, onSubmit, isLoading = false }: CustomerFormProps) {
  // Create a form schema extending the insertCustomerSchema
  const formSchema = z.object({
    id: z.number().optional(),
    projectId: z.number().optional(),
    customerId: z.string().min(1, "Kundennummer ist erforderlich"),
    customerType: z.enum(["Privatkunde", "Gewerbe"]).default("Privatkunde"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    street: z.string().optional(),
    houseNumber: z.string().optional(),
    postalCode: z.string().optional(),
    city: z.string().optional(),
    cityPart: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    customerPhone: z.string().optional(),
    // Optional oder leer
    customerEmail: z.string().email("Ungültige E-Mail-Adresse").optional().or(z.literal('')),
  });

  // Vorverarbeitung für customerId aus number in string
  let customerIdStr = "";
  if (customer?.customerId !== undefined && customer?.customerId !== null) {
    customerIdStr = typeof customer.customerId === 'number' 
      ? customer.customerId.toString() 
      : customer.customerId;
  }
  console.log("Initialer customer:", customer);

  // Initialize form with default values from customer or empty values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: customer?.id,
      projectId: customer?.projectId || undefined,
      customerId: customerIdStr,
      customerType: customer?.customerType as "Privatkunde" | "Gewerbe" || "Privatkunde",
      firstName: customer?.firstName || "",
      lastName: customer?.lastName || "",
      street: customer?.street || "",
      houseNumber: customer?.houseNumber || "",
      postalCode: customer?.postalCode !== undefined && customer?.postalCode !== null 
        ? (typeof customer.postalCode === 'number' ? customer.postalCode.toString() : customer.postalCode) 
        : '',
      city: customer?.city || "",
      cityPart: customer?.cityPart || "",
      state: customer?.state || "",
      country: customer?.country || "Deutschland",
      customerPhone: customer?.customerPhone !== undefined && customer?.customerPhone !== null 
        ? (typeof customer.customerPhone === 'number' ? customer.customerPhone.toString() : customer.customerPhone) 
        : '',
      customerEmail: customer?.customerEmail || "",
    },
  });

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    // Konvertiere die Daten, um den Typen des Schema zu entsprechen
    const transformedData = {
      ...data,
      customerId: data.customerId ? parseInt(data.customerId.toString(), 10) : null,
      postalCode: data.postalCode && data.postalCode.toString().trim() !== '' ? parseInt(data.postalCode.toString(), 10) : null,
    };
    console.log("Formular abgeschickt mit Daten:", data);
    console.log("Transformierte Daten:", transformedData);
    onSubmit(transformedData as any);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-md shadow-sm p-0 md:p-6">
          
          {/* Kundeninformation */}
          <div className="form-section">
            <h3 className="form-heading"><span className="green-emoji mr-2">👤</span> Persönliche Daten</h3>
            
            {/* Kundenart */}
            <div className="mb-4">
              <FormField
                control={form.control}
                name="customerType"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="modern-form-label">Kundenart</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="modern-form-input">
                          <SelectValue placeholder="Kundenart wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Privatkunde">Privatkunde</SelectItem>
                        <SelectItem value="Gewerbe">Gewerbe</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Vorname und Nachname */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="modern-form-label">Vorname</FormLabel>
                    <FormControl>
                      <Input {...field} className="modern-form-input" placeholder="Vorname" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="modern-form-label">Nachname</FormLabel>
                    <FormControl>
                      <Input {...field} className="modern-form-input" placeholder="Nachname" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Kunden-ID (versteckt in Collapsed-Sektion) */}
            <div className="mt-4 hidden">
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="modern-form-label">Kunden-ID</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                        value={field.value || ''} 
                        disabled={!!customer}
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
                        <Input {...field} className="modern-form-input" placeholder="Straße" />
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
                        <Input {...field} className="modern-form-input" placeholder="Hausnummer" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                      <Input {...field} className="modern-form-input" placeholder="Ort" />
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
                      <Input {...field} className="modern-form-input" placeholder="Stadtteil (optional)" />
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
          
          {/* Kontaktinformationen */}
          <div className="form-section">
            <h3 className="form-heading"><span className="green-emoji mr-2">📞</span> Kontaktinformationen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerPhone"
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
                name="customerEmail"
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
            {customer ? "Kunden aktualisieren" : "Kunden speichern"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
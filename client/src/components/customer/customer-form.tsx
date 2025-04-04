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
    customerEmail: z.string().email("Ungültige E-Mail-Adresse").optional().or(z.literal('')),
  });

  // Vorverarbeitung für customerId aus number in string
  let customerIdStr = "";
  if (customer?.customerId !== undefined && customer?.customerId !== null) {
    customerIdStr = typeof customer.customerId === 'number' 
      ? customer.customerId.toString() 
      : customer.customerId;
  }

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
      postalCode: data.postalCode && data.postalCode.toString().trim() !== '' ? data.postalCode : null,
    };
    onSubmit(transformedData as any);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="bg-white p-6 rounded-md shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-3">{customer ? "Kunden bearbeiten" : "Neuer Kunde"}</h2>
          
          {/* Kundeninformation - Reihe 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium text-md">Kunden-ID</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                        value={field.value || ''} 
                        disabled={!!customer}
                        placeholder="Wird automatisch vergeben"
                        className="border-gray-300 h-10"
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
                name="customerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium text-md">Kundenart</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-gray-300 h-10">
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
          </div>
          
          {/* Persönliche Daten - Reihe 2 */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 bg-gray-50 p-2 rounded">Persönliche Daten</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-md">Vorname</FormLabel>
                      <FormControl>
                        <Input {...field} className="border-gray-300 h-10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-md">Nachname</FormLabel>
                      <FormControl>
                        <Input {...field} className="border-gray-300 h-10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
          
          {/* Adresse - Reihe 3-5 */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 bg-gray-50 p-2 rounded">Adresse</h3>
            
            {/* Straße und Hausnummer */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
              <div className="md:col-span-3">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-md">Straße</FormLabel>
                      <FormControl>
                        <Input {...field} className="border-gray-300 h-10" />
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
                      <FormLabel className="font-medium text-md">Hausnummer</FormLabel>
                      <FormControl>
                        <Input {...field} className="border-gray-300 h-10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* PLZ, Stadt und Stadtteil */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
              <div>
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-md">Postleitzahl (PLZ)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ''}
                          className="border-gray-300 h-10"
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
                      <FormLabel className="font-medium text-md">Ort / Stadt</FormLabel>
                      <FormControl>
                        <Input {...field} className="border-gray-300 h-10" />
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
                      <FormLabel className="font-medium text-md">Stadtteil</FormLabel>
                      <FormControl>
                        <Input {...field} className="border-gray-300 h-10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Bundesland und Land */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-md">Bundesland</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-gray-300 h-10">
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
                      <FormLabel className="font-medium text-md">Land</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-gray-300 h-10">
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
          </div>
          
          {/* Kontaktinformationen */}
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-4 bg-gray-50 p-2 rounded">Kontaktinformationen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-md">Telefonnummer</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ''}
                          className="border-gray-300 h-10"
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
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-md">E-Mail-Adresse</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} className="border-gray-300 h-10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
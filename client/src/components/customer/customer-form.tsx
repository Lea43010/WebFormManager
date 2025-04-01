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
    customerId: z.coerce.string().min(1, "Kundennummer ist erforderlich"),
    street: z.string().optional(),
    houseNumber: z.string().optional(),
    postalCode: z.coerce.string().optional(),
    city: z.string().optional(),
    cityPart: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    customerPhone: z.string().optional(),
    customerEmail: z.string().email("Ungültige E-Mail-Adresse").optional().or(z.literal('')),
  });

  // Initialize form with default values from customer or empty values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: customer?.id,
      projectId: customer?.projectId || undefined,
      customerId: customer?.customerId || "",
      street: customer?.street || "",
      houseNumber: customer?.houseNumber || "",
      postalCode: customer?.postalCode !== undefined && customer?.postalCode !== null ? customer.postalCode : '',
      city: customer?.city || "",
      cityPart: customer?.cityPart || "",
      state: customer?.state || "",
      country: customer?.country || "Deutschland",
      customerPhone: customer?.customerPhone !== undefined && customer?.customerPhone !== null ? customer.customerPhone : '',
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
        <div className="bg-white p-6 rounded-md">
          <h2 className="text-xl font-medium mb-6">{customer ? "Kunden bearbeiten" : "Neuer Kunde"}</h2>
          <p className="text-sm text-gray-500 mb-6">Geben Sie die Details des Kunden ein.</p>
          
          {/* Kundeninformation */}
          <h3 className="text-lg font-medium mb-4">Grundinformationen</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kunden-ID</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                        value={field.value || ''} 
                        disabled={!!customer}
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
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kundennummer</FormLabel>
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
          <h3 className="text-lg font-medium mb-4">Adresse</h3>
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
          <h3 className="text-lg font-medium mb-4">Kontaktinformationen</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefonnummer</FormLabel>
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
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail-Adresse</FormLabel>
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
            {customer ? "Kunden aktualisieren" : "Kunden speichern"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
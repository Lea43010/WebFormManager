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
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COMPANY_TYPES = ["Subunternehmen", "Generalunternehmen"];
const COUNTRIES = ["Deutschland", "Österreich", "Schweiz", "Andere"];

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
    postalCode: z.number().optional(),
    city: z.string().optional(),
    cityPart: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    companyPhone: z.number().optional(),
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
      postalCode: company?.postalCode || undefined,
      city: company?.city || "",
      cityPart: company?.cityPart || "",
      state: company?.state || "",
      country: company?.country || "Deutschland",
      companyPhone: company?.companyPhone || undefined,
      companyEmail: company?.companyEmail || "",
    },
  });

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
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

          <FormField
            control={form.control}
            name="companyArt"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
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

          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem className="sm:col-span-6">
                <FormLabel>Firmenname</FormLabel>
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
              <FormItem className="sm:col-span-4">
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
            name="houseNumber"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Hausnummer</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="addressLine2"
            render={({ field }) => (
              <FormItem className="sm:col-span-6">
                <FormLabel>Zusatz</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Postleitzahl (PLZ)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                    value={field.value || ''}
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
              <FormItem className="sm:col-span-2">
                <FormLabel>Ort / Stadt</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cityPart"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Stadtteil</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Bundesland</FormLabel>
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
              <FormItem className="sm:col-span-3">
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

          <FormField
            control={form.control}
            name="companyPhone"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Telefonnummer der Firma</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                    value={field.value || ''}
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
              <FormItem className="sm:col-span-3">
                <FormLabel>E-Mail-Adresse der Firma</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {company ? "Aktualisieren" : "Speichern"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

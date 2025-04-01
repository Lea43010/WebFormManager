import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertProjectSchema, Project, Company, Customer, Person } from "@shared/schema";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const PROJECT_TYPES = ["Neubau", "Sanierung", "Umbau", "Erweiterung", "Abriss", "Sonstige"];

interface ProjectFormProps {
  project?: Project | null;
  onSubmit: (data: Partial<Project>) => void;
  isLoading?: boolean;
}

export default function ProjectForm({ project, onSubmit, isLoading = false }: ProjectFormProps) {
  // Create a form schema extending the insertProjectSchema
  // Custom validation function for date fields
  const validateEndDate = (endDate: Date | null | undefined, startDate: Date | null | undefined): boolean => {
    if (endDate && startDate && endDate < startDate) {
      return false;
    }
    return true;
  };

  const formSchema = z.object({
    id: z.number().optional(),
    projectId: z.number().optional(),
    customerId: z.number().nullable().optional(),
    companyId: z.number().nullable().optional(),
    personId: z.number().nullable().optional(),
    permission: z.boolean().default(false),
    permissionName: z.string().optional(),
    projectCluster: z.string().optional(),
    projectName: z.string().min(1, "Projektname ist erforderlich"),
    projectArt: z.string().min(1, "Projektart ist erforderlich"),
    projectWidth: z.string().optional().nullable(),
    projectLength: z.string().optional().nullable(),
    projectHeight: z.string().optional().nullable(),
    projectText: z.string().optional().nullable(),
    projectStartdate: z.date().nullable().optional(),
    projectEnddate: z.date().nullable().optional(),
    projectStop: z.boolean().default(false),
    projectStopstartdate: z.date().nullable().optional(),
    projectStopenddate: z.date().nullable().optional(),
  }).superRefine((data, ctx) => {
    // Validate project end date is after start date
    if (!validateEndDate(data.projectEnddate, data.projectStartdate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enddatum muss nach dem Startdatum liegen",
        path: ["projectEnddate"]
      });
    }
    
    // Validate stop end date is after stop start date
    if (!validateEndDate(data.projectStopenddate, data.projectStopstartdate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ende der Unterbrechung muss nach dem Start der Unterbrechung liegen",
        path: ["projectStopenddate"]
      });
    }
  });

  // Fetch companies for dropdown
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    staleTime: 1000 * 60, // 1 minute
  });

  // Fetch customers for dropdown
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    staleTime: 1000 * 60, // 1 minute
  });

  // Fetch persons for dropdown
  const { data: persons = [] } = useQuery<Person[]>({
    queryKey: ["/api/persons"],
    staleTime: 1000 * 60, // 1 minute
  });

  // Initialize form with default values from project or empty values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: project?.id,
      projectId: project?.projectId || undefined,
      customerId: project?.customerId || null,
      companyId: project?.companyId || null,
      personId: project?.personId || null,
      permission: project?.permission || false,
      permissionName: project?.permissionName || "",
      projectCluster: project?.projectCluster || "",
      projectName: project?.projectName || "",
      projectArt: project?.projectArt || "",
      projectWidth: project ? (project.projectWidth !== null ? String(project.projectWidth) : '') : '',
      projectLength: project ? (project.projectLength !== null ? String(project.projectLength) : '') : '',
      projectHeight: project ? (project.projectHeight !== null ? String(project.projectHeight) : '') : '',
      projectText: project ? (project.projectText !== null ? String(project.projectText) : '') : '',
      projectStartdate: project?.projectStartdate ? new Date(project.projectStartdate) : null,
      projectEnddate: project?.projectEnddate ? new Date(project.projectEnddate) : null,
      projectStop: project?.projectStop || false,
      projectStopstartdate: project?.projectStopstartdate ? new Date(project.projectStopstartdate) : null,
      projectStopenddate: project?.projectStopenddate ? new Date(project.projectStopenddate) : null,
    },
  });

  const projectStopValue = form.watch("projectStop");

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    // Convert string values to numbers for numeric fields before submitting
    const transformedData = {
      ...data,
      projectWidth: data.projectWidth ? parseFloat(data.projectWidth) : null,
      projectLength: data.projectLength ? parseFloat(data.projectLength) : null,
      projectHeight: data.projectHeight ? parseFloat(data.projectHeight) : null,
      projectText: data.projectText ? parseInt(data.projectText, 10) : null,
    };
    
    onSubmit(transformedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem className="sm:col-span-1">
                <FormLabel>Projektnummer</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                    value={field.value || ''} 
                    disabled={!!project}
                    placeholder="Auto"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="projectName"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Projektname</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="projectArt"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Projektart</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Projektart auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROJECT_TYPES.map((type) => (
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
            name="projectCluster"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Projektcluster</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Kunde</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Kunde auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">Keiner</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.id} - {customer.customerId}
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
            name="companyId"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Firma</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Firma auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">Keine</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.companyName}
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
            name="personId"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Ansprechpartner</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Person auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">Keiner</SelectItem>
                    {persons.map((person) => (
                      <SelectItem key={person.id} value={person.id.toString()}>
                        {person.firstname} {person.lastname}
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
            name="projectStartdate"
            render={({ field }) => (
              <FormItem className="sm:col-span-2 flex flex-col">
                <FormLabel>Startdatum</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "P", { locale: de })
                        ) : (
                          <span>Datum auswählen</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="projectEnddate"
            render={({ field }) => (
              <FormItem className="sm:col-span-2 flex flex-col">
                <FormLabel>Enddatum</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "P", { locale: de })
                        ) : (
                          <span>Datum auswählen</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="projectWidth"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Breite</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    value={field.value !== null ? field.value : ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="projectLength"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Länge</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    value={field.value !== null ? field.value : ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="projectHeight"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Höhe</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    value={field.value !== null ? field.value : ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="permission"
            render={({ field }) => (
              <FormItem className="sm:col-span-2 flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Genehmigung notwendig</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="permissionName"
            render={({ field }) => (
              <FormItem className="sm:col-span-4">
                <FormLabel>Name der Genehmigung</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="projectStop"
            render={({ field }) => (
              <FormItem className="sm:col-span-2 flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Projekt unterbrochen</FormLabel>
                </div>
              </FormItem>
            )}
          />

          {projectStopValue && (
            <>
              <FormField
                control={form.control}
                name="projectStopstartdate"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2 flex flex-col">
                    <FormLabel>Beginn der Unterbrechung</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "P", { locale: de })
                            ) : (
                              <span>Datum auswählen</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectStopenddate"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2 flex flex-col">
                    <FormLabel>Ende der Unterbrechung</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "P", { locale: de })
                            ) : (
                              <span>Datum auswählen</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {project ? "Aktualisieren" : "Speichern"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
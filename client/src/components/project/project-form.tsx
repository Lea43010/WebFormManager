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
import { Loader2, Save } from "lucide-react";
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
import { SpeechToText } from "@/components/ui/speech-to-text";

const PROJECT_TYPES = ["Hochbau", "Tiefbau"];

interface ProjectFormProps {
  project?: Project | null;
  onSubmit: (data: Partial<Project>) => Promise<Project>;
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
    customerContactId: z.number().nullable().optional(),
    permission: z.boolean().default(false),
    permissionName: z.string().optional(),
    projectCluster: z.string().optional(),
    projectName: z.string().min(1, "Projektname ist erforderlich"),
    projectArt: z.string().min(1, "Projektart ist erforderlich"),
    // Verwenden Sie string für Eingabefelder, aber wandeln Sie sie später in number um
    projectWidth: z.string().optional(),
    projectLength: z.string().optional(),
    projectHeight: z.string().optional(),
    projectText: z.string().optional(),
    speechNotes: z.string().optional(),
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
      customerContactId: project?.customerContactId || null,
      permission: project?.permission || false,
      permissionName: project?.permissionName || "",
      projectCluster: project?.projectCluster || "",
      projectName: project?.projectName || "",
      projectArt: project?.projectArt || "",
      projectWidth: project ? (project.projectWidth !== null ? String(project.projectWidth) : '') : '',
      projectLength: project ? (project.projectLength !== null ? String(project.projectLength) : '') : '',
      projectHeight: project ? (project.projectHeight !== null ? String(project.projectHeight) : '') : '',
      projectText: project ? (project.projectText !== null ? String(project.projectText) : '') : '',
      speechNotes: "",
      projectStartdate: project?.projectStartdate ? new Date(project.projectStartdate) : null,
      projectEnddate: project?.projectEnddate ? new Date(project.projectEnddate) : null,
      projectStop: project?.projectStop || false,
      projectStopstartdate: project?.projectStopstartdate ? new Date(project.projectStopstartdate) : null,
      projectStopenddate: project?.projectStopenddate ? new Date(project.projectStopenddate) : null,
    },
  });

  const projectStopValue = form.watch("projectStop");

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      // Wenn Sprachnotizen vorhanden sind, in projectText übernehmen oder anhängen
      let finalProjectText = data.projectText || '';
      if (data.speechNotes && data.speechNotes.trim() !== '') {
        // Wenn bereits Text vorhanden ist, füge die Sprachnotizen mit Trenner hinzu
        if (finalProjectText.trim() !== '') {
          finalProjectText += '\n\n--- Sprachnotizen ---\n' + data.speechNotes.trim();
        } else {
          finalProjectText = data.speechNotes.trim();
        }
      }
      
      // Convert string values to numbers for numeric fields before submitting
      const transformedData = {
        ...data,
        projectWidth: data.projectWidth && data.projectWidth.trim() !== '' ? parseFloat(data.projectWidth) : null,
        projectLength: data.projectLength && data.projectLength.trim() !== '' ? parseFloat(data.projectLength) : null,
        projectHeight: data.projectHeight && data.projectHeight.trim() !== '' ? parseFloat(data.projectHeight) : null,
        projectText: finalProjectText, // Text als String speichern, nicht als Zahl
      };
      
      // Sprachnotizen nicht mit an Backend senden, da kein Datenbankfeld existiert
      delete (transformedData as any).speechNotes;
      
      // Sende die Projektdaten und warte auf die Antwort
      const savedProject = await onSubmit(transformedData as any);
      
      return savedProject;
    } catch (error) {
      console.error('Fehler beim Speichern des Projekts:', error);
      throw error;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="bg-white p-4 md:p-6 rounded-md">
          <h2 className="text-xl font-medium mb-6">{project ? "Projekt bearbeiten" : "Neues Projekt"}</h2>
          <p className="text-sm text-gray-500 mb-6">Geben Sie die Details des Projekts ein.</p>
          
          {/* Grundinformationen */}
          <h3 className="text-lg font-medium mb-4"><span className="green-emoji">📋</span> Grundinformationen</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
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
            </div>

            <div>
              <FormField
                control={form.control}
                name="projectArt"
                render={({ field }) => (
                  <FormItem>
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
            </div>



            <div className="md:col-span-3">
              <FormField
                control={form.control}
                name="projectName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projektname</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Beteiligte */}
          <h3 className="text-lg font-medium mb-4"><span className="green-emoji">👥</span> Beteiligte</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
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
                            {customer.customerId} - {customer.firstName} {customer.lastName}
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
                name="companyId"
                render={({ field }) => (
                  <FormItem>
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
            </div>

            <div>
              <FormField
                control={form.control}
                name="customerContactId" // Neues Feld für den Kunden-Ansprechpartner
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ansprechpartner Kunde</FormLabel>
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
                            {customer.firstName} {customer.lastName}
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
                name="personId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ansprechpartner Firma</FormLabel>
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
            </div>
          </div>
          
          {/* Zeitlicher Rahmen */}
          <h3 className="text-lg font-medium mb-4"><span className="green-emoji">📅</span> Zeitlicher Rahmen</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <FormField
                control={form.control}
                name="projectStartdate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Startdatum</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal w-full",
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
            </div>

            <div>
              <FormField
                control={form.control}
                name="projectEnddate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enddatum</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal w-full",
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
            </div>
          </div>

          {/* Projektunterbrechung */}
          <div className="mb-8">
            <div className="mb-4">
              <FormField
                control={form.control}
                name="projectStop"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-medium text-base">
                      Projekt unterbrochen
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {projectStopValue && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pl-6 border-l-2 border-primary/20">
                <div>
                  <FormField
                    control={form.control}
                    name="projectStopstartdate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unterbrechung seit</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal w-full",
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
                </div>

                <div>
                  <FormField
                    control={form.control}
                    name="projectStopenddate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unterbrechung bis</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal w-full",
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
                </div>
              </div>
            )}
          </div>
          
          {/* Sprachnotizen */}
          <h3 className="text-lg font-medium mb-4"><span className="green-emoji">🎤</span> Sprachnotizen</h3>
          <div className="mb-8">
            <FormField
              control={form.control}
              name="speechNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notizen per Spracherkennung eingeben</FormLabel>
                  <FormControl>
                    <SpeechToText
                      onTextChange={field.onChange}
                      initialText={field.value || ""}
                      language="de-DE"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Genehmigungen */}
          <div className="mb-8">
            <div className="mb-4">
              <FormField
                control={form.control}
                name="permission"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-medium text-base">
                      Genehmigung notwendig
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {form.watch("permission") && (
              <div className="mt-4 pl-6 border-l-2 border-primary/20">
                <FormField
                  control={form.control}
                  name="permissionName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name der Genehmigung</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
          
          {/* Bemerkungen */}
          <h3 className="text-lg font-medium mb-4"><span className="green-emoji">💬</span> Bemerkungen</h3>
          <div className="mb-4">
            <FormField
              control={form.control}
              name="projectText"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea className="min-h-[120px]" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            {project ? "Projekt aktualisieren" : "Projekt speichern"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
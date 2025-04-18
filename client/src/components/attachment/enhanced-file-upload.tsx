import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  File as FileIcon, 
  Image as ImageIcon, 
  FileText, 
  FileSpreadsheet, 
  Upload, 
  X, 
  Loader2, 
  Plus 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedFileUploadProps {
  onFilesSelected: (files: File[]) => void;
  acceptedFileTypes?: string;
  maxFileSizeMB?: number;
  multiple?: boolean;
  className?: string;
  uploading?: boolean;
  value?: File | File[] | null;
  onValueChange?: (files: File[] | null) => void;
}

const DEFAULT_ACCEPTED_FILE_TYPES = ".pdf,.jpg,.jpeg,.png,.gif,.xls,.xlsx,.doc,.docx,.txt";
const DEFAULT_MAX_FILE_SIZE = 25; // 25MB

export function EnhancedFileUpload({
  onFilesSelected,
  acceptedFileTypes = DEFAULT_ACCEPTED_FILE_TYPES,
  maxFileSizeMB = DEFAULT_MAX_FILE_SIZE,
  multiple = false,
  className,
  uploading = false,
  value,
  onValueChange
}: EnhancedFileUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [filePreview, setFilePreview] = useState<{url: string, type: string}[]>([]);
  
  // Ermitteln der aktuellen Files basierend auf dem value prop
  const files = value 
    ? Array.isArray(value) 
      ? value 
      : value ? [value] : []
    : [];

  // Ermitteln der Dateieigenschaften für die Vorschau
  const getFileType = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return 'image';
    } else if (['pdf'].includes(ext || '')) {
      return 'pdf';
    } else if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
      return 'excel';
    } else {
      return 'other';
    }
  };

  // Dateien validieren
  const validateFiles = (selectedFiles: FileList | File[]) => {
    const validFiles: File[] = [];
    const maxSize = maxFileSizeMB * 1024 * 1024; // in Bytes
    
    Array.from(selectedFiles).forEach(file => {
      // Größenprüfung
      if (file.size > maxSize) {
        toast({
          title: "Datei zu groß",
          description: `Die Datei "${file.name}" überschreitet die maximale Größe von ${maxFileSizeMB}MB.`,
          variant: "destructive",
        });
        return;
      }
      
      validFiles.push(file);
    });
    
    return validFiles;
  };

  // Erstellen von Vorschauen für Bilder
  const createPreviews = (files: File[]) => {
    const previews: {url: string, type: string}[] = [];
    
    files.forEach(file => {
      const fileType = getFileType(file);
      
      if (fileType === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setFilePreview(prev => {
            const newPreviews = [...prev, { url: result, type: fileType }];
            return newPreviews.slice(0, files.length);
          });
        };
        reader.readAsDataURL(file);
      } else {
        previews.push({ url: '', type: fileType });
      }
    });
    
    if (previews.length > 0) {
      setFilePreview(previews);
    }
  };

  // Handler für das Auswählen von Dateien über den File-Input
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const validFiles = validateFiles(files);
    if (validFiles.length === 0) return;
    
    createPreviews(validFiles);
    onFilesSelected(validFiles);
    
    if (onValueChange) {
      onValueChange(multiple ? validFiles : [validFiles[0]]);
    }
    
    // Reset des File-Inputs, damit das gleiche File erneut ausgewählt werden kann
    event.target.value = '';
  };

  // Drag & Drop-Handler
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;
    
    // Mehrere Dateien nur erlauben, wenn multiple=true
    const filesToProcess = multiple 
      ? droppedFiles 
      : [droppedFiles[0]];
    
    const validFiles = validateFiles(filesToProcess);
    if (validFiles.length === 0) return;
    
    createPreviews(validFiles);
    onFilesSelected(validFiles);
    
    if (onValueChange) {
      onValueChange(multiple ? validFiles : [validFiles[0]]);
    }
  }, [multiple, onFilesSelected, validateFiles, onValueChange]);

  // Datei-Input programmatisch öffnen
  const openFileSelector = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Dateien entfernen
  const removeFile = useCallback((index: number) => {
    if (onValueChange) {
      const newFiles = [...files];
      newFiles.splice(index, 1);
      onValueChange(newFiles.length > 0 ? newFiles : null);
      
      // Vorschau aktualisieren
      setFilePreview(prev => {
        const newPreviews = [...prev];
        newPreviews.splice(index, 1);
        return newPreviews;
      });
    }
  }, [files, onValueChange]);

  // Dateityp-Icons
  const getFileIcon = (type: string, size = "w-12 h-12") => {
    switch (type) {
      case "pdf":
        return <FileText className={`${size} text-red-500`} />;
      case "excel":
        return <FileSpreadsheet className={`${size} text-green-500`} />;
      case "image":
        return <ImageIcon className={`${size} text-blue-500`} />;
      default:
        return <FileIcon className={`${size} text-gray-500`} />;
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Verstecktes File-Input-Element */}
      <input
        type="file"
        accept={acceptedFileTypes}
        multiple={multiple}
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileSelect}
      />

      {/* Drop-Zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-gray-300",
          "flex flex-col items-center justify-center cursor-pointer"
        )}
        onClick={openFileSelector}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-label="Datei hochladen"
      >
        {files.length > 0 ? (
          <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="border rounded-md p-3 flex items-center">
                  <div className="flex-shrink-0 mr-3">
                    {filePreview[index]?.url ? (
                      <img 
                        src={filePreview[index].url} 
                        alt={file.name} 
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      getFileIcon(getFileType(file), "w-8 h-8")
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    disabled={uploading}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            {multiple && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  openFileSelector();
                }}
                disabled={uploading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Weitere Datei hinzufügen
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900">
                Dateien hier ablegen oder <span className="text-primary">durchsuchen</span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {multiple 
                  ? `Sie können mehrere Dateien hinzufügen (max. ${maxFileSizeMB}MB pro Datei)`
                  : `Maximal ${maxFileSizeMB}MB pro Datei`
                }
              </p>
              <p className="mt-1 text-xs text-gray-500">
                PDF, Bilder, Excel-Dateien oder andere Dokumenttypen
              </p>
            </div>
          </div>
        )}
        
        {uploading && (
          <div className="mt-4 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
            <span className="text-sm">Hochladen...</span>
          </div>
        )}
      </div>
    </div>
  );
}
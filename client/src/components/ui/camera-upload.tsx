import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, Upload, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CameraUploadProps {
  projectId?: number | null;
  onUploadSuccess?: (attachmentId: number, file: File) => void;
  onUploadError?: (error: Error) => void;
}

export function CameraUpload({ projectId, onUploadSuccess, onUploadError }: CameraUploadProps) {
  const { toast } = useToast();
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraPermissionState, setCameraPermissionState] = useState<"prompt" | "granted" | "denied" | "unsupported">("prompt");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Funktion zur Prüfung, ob die Kamera unterstützt wird
  const checkCameraSupport = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  // Kamerastream starten
  const startCamera = async () => {
    try {
      if (!checkCameraSupport()) {
        setCameraPermissionState("unsupported");
        toast({
          title: "Kamera nicht unterstützt",
          description: "Ihr Gerät unterstützt keine Kamerazugriffe oder die Funktion ist in diesem Browser nicht verfügbar.",
          variant: "destructive",
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraStream(stream);
        setCameraPermissionState("granted");
        setShowCamera(true);
      }
    } catch (error) {
      if ((error as DOMException).name === "NotAllowedError") {
        setCameraPermissionState("denied");
        toast({
          title: "Kamerazugriff verweigert",
          description: "Bitte erlauben Sie den Zugriff auf die Kamera, um Fotos aufzunehmen.",
          variant: "destructive",
        });
      } else {
        console.error("Fehler beim Starten der Kamera:", error);
        toast({
          title: "Kamerafehler",
          description: "Es gab ein Problem beim Zugriff auf die Kamera.",
          variant: "destructive",
        });
      }
    }
  };

  // Kamerastream stoppen
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  // Foto aufnehmen
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      
      // Canvas-Größe an Video anpassen
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Video auf Canvas zeichnen
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Canvas als Bild-URL speichern
      const imageDataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(imageDataUrl);
      
      // Kamera ausschalten
      stopCamera();
    }
  };

  // Kamera umschalten (vorne/hinten)
  const toggleCamera = () => {
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);
    
    // Kamerastream neustarten mit neuer Ausrichtung
    if (cameraStream) {
      stopCamera();
      setTimeout(() => startCamera(), 300); // Kurze Verzögerung, um sicherzustellen, dass der alte Stream beendet ist
    }
  };

  // Aufgenommenes Foto verwerfen
  const discardPhoto = () => {
    setCapturedImage(null);
  };

  // Foto aus Dateiauswahl
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Datei-Input programmatisch öffnen
  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  // Foto verarbeiten und hochladen
  const processAndUploadImage = async () => {
    if (!capturedImage) return;

    // Decodiere die Base64-URL und erstelle ein Blob/File
    try {
      setUploading(true);

      // Base64-String zu Blob konvertieren
      const base64Data = capturedImage.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArrays.push(byteCharacters.charCodeAt(i));
      }
      const byteArray = new Uint8Array(byteArrays);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      // Eindeutigen Dateinamen erstellen
      const fileName = `camera_photo_${new Date().getTime()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      // FormData für den Upload vorbereiten
      const formData = new FormData();
      formData.append('file', file);
      // Projekt-ID anhängen (entweder die ausgewählte ID oder 1 als Standard-Projekt)
      formData.append('projectId', projectId !== null && projectId !== undefined ? projectId.toString() : "1");

      // Datei hochladen
      const response = await fetch('/api/attachments', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Upload fehlgeschlagen: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      toast({
        title: "Foto hochgeladen",
        description: "Das Foto wurde erfolgreich gespeichert.",
      });

      // Erfolgreichen Upload melden
      if (onUploadSuccess) {
        onUploadSuccess(result.id, file);
      }

      // Bild zurücksetzen
      setCapturedImage(null);
    } catch (error) {
      console.error("Fehler beim Hochladen:", error);
      toast({
        title: "Upload fehlgeschlagen",
        description: (error as Error).message || "Es ist ein Fehler beim Hochladen des Fotos aufgetreten.",
        variant: "destructive",
      });

      if (onUploadError) {
        onUploadError(error as Error);
      }
    } finally {
      setUploading(false);
    }
  };

  // Kamerastream stoppen, wenn Komponente entfernt wird
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  return (
    <div className="w-full">
      {/* Verstecktes File-Input-Element */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileSelect}
      />

      {/* Hauptinhalt */}
      <div className="flex flex-col space-y-4">
        {/* Video-Element für Kamera-Vorschau */}
        {showCamera && (
          <Card className="relative overflow-hidden">
            <CardContent className="p-0">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto"
                style={{ maxHeight: "70vh" }}
              />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="absolute bottom-0 left-0 right-0 flex justify-center p-4 bg-black/30">
                <div className="flex space-x-4">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={toggleCamera}
                    className="bg-white/80 hover:bg-white"
                  >
                    <Camera className="h-5 w-5 rotate-180" />
                  </Button>
                  <Button 
                    onClick={capturePhoto}
                    className="rounded-full w-16 h-16 bg-white"
                  >
                    <div className="rounded-full w-12 h-12 bg-[#6a961f] border-4 border-white"></div>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={stopCamera}
                    className="bg-white/80 hover:bg-white"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vorschau des aufgenommenen Bildes */}
        {capturedImage && !showCamera && (
          <Card className="overflow-hidden">
            <CardContent className="p-0 relative">
              <img 
                src={capturedImage} 
                alt="Aufgenommenes Foto" 
                className="w-full h-auto"
              />
              <div className="absolute bottom-0 left-0 right-0 flex justify-center p-4 bg-black/30">
                <div className="flex space-x-4">
                  <Button 
                    variant="outline"
                    onClick={discardPhoto}
                    className="bg-white/80 hover:bg-white"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Verwerfen
                  </Button>
                  <Button 
                    onClick={processAndUploadImage}
                    disabled={uploading}
                    className="bg-[#6a961f] hover:bg-[#5a8418] text-white"
                  >
                    {uploading ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-5 w-5 mr-2" />
                    )}
                    Hochladen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aktionsbuttons für Kamera/Upload */}
        {!showCamera && !capturedImage && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={startCamera}
              className="bg-[#6a961f] hover:bg-[#5a8418] text-white"
              disabled={cameraPermissionState === "unsupported" || cameraPermissionState === "denied"}
            >
              <Camera className="h-5 w-5 mr-2" />
              Foto aufnehmen
            </Button>
            <Button 
              onClick={openFileSelector}
              variant="outline"
            >
              <Upload className="h-5 w-5 mr-2" />
              Bild hochladen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CameraUpload;
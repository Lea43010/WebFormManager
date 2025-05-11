import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Trash2, AlertTriangle, Info, Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from '@/hooks/use-toast';

interface SpeechToTextProps {
  onTextChange: (text: string) => void;
  placeholder?: string;
  className?: string;
  language?: string;
  initialText?: string;
}

// Helferfunktion um Browserumgebung zu erkennen
function detectBrowser() {
  const ua = navigator.userAgent;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua) || 
                  (navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
                   navigator.userAgent.indexOf('CriOS') === -1 &&
                   navigator.userAgent.indexOf('FxiOS') === -1);
  
  return {
    isMobile,
    isSafari,
    isIOS: /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  };
}

export function SpeechToText({
  onTextChange,
  placeholder = "Hier erscheint der erkannte Text...",
  className = "",
  language = "de-DE",
  initialText = ""
}: SpeechToTextProps) {
  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState(initialText);
  const [isSupported, setIsSupported] = useState(true);
  const [interim, setInterim] = useState("");
  const [browserInfo, setBrowserInfo] = useState({ isMobile: false, isSafari: false, isIOS: false });
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Browser-Erkennung durchführen
    setBrowserInfo(detectBrowser());
    
    // Überprüfen, ob SpeechRecognition unterstützt wird
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }
    
    try {
      // SpeechRecognition-Objekt initialisieren
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;
      
      // Event-Handler für Ergebnisse
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = text;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += ' ' + transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setText(finalTranscript);
        setInterim(interimTranscript);
        onTextChange(finalTranscript + ' ' + interimTranscript);
      };
      
      // Event-Handler für Fehler
      recognitionRef.current.onerror = (event: any) => {
        console.error('Spracherkennung Fehler:', event.error);
        if (event.error === 'not-allowed') {
          setIsListening(false);
          toast({
            title: "Mikrofon-Zugriff verweigert",
            description: "Bitte erlauben Sie den Zugriff in Ihren Browser-Einstellungen.",
            variant: "destructive"
          });
        } else if (event.error === 'aborted' || event.error === 'network') {
          setIsListening(false);
          console.warn('Spracherkennung wurde abgebrochen oder es gab ein Netzwerkproblem');
        }
      };
      
      // Event-Handler für Ende der Spracherkennung
      recognitionRef.current.onend = () => {
        if (isListening) {
          // Nur neu starten, wenn immer noch gewünscht
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error('Fehler beim Neustart der Spracherkennung:', e);
            setIsListening(false);
          }
        }
      };
    } catch (error) {
      console.error('Fehler bei der Initialisierung der Spracherkennung:', error);
      setIsSupported(false);
    }
    
    // Cleanup
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn('Fehler beim Stoppen der Spracherkennung:', e);
        }
      }
      
      // Auch MediaRecorder stoppen, falls aktiv
      if (mediaRecorderRef.current && isRecording) {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.warn('Fehler beim Stoppen des MediaRecorders:', e);
        }
      }
    };
  }, [isListening, language, text, onTextChange, toast, isRecording]);
  
  const toggleListening = () => {
    if (!isSupported) {
      toast({
        title: "Nicht unterstützt",
        description: "Spracherkennung wird in Ihrem Browser nicht unterstützt.",
        variant: "destructive"
      });
      return;
    }
    
    // iOS Safari Fallback mit MediaRecorder
    if (browserInfo.isIOS && browserInfo.isSafari) {
      if (isRecording) {
        stopAudioRecording();
      } else {
        startAudioRecording();
      }
      return;
    }
    
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Fehler beim Stoppen der Spracherkennung:', e);
      }
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Fehler beim Starten der Spracherkennung:', e);
        toast({
          title: "Fehler beim Starten",
          description: "Die Spracherkennung konnte nicht gestartet werden. Bitte versuchen Sie es in einem anderen Browser wie Chrome oder Edge.",
          variant: "destructive"
        });
        return;
      }
    }
    
    setIsListening(!isListening);
  };
  
  const clearText = () => {
    setText("");
    setInterim("");
    onTextChange("");
  };
  
  // Funktionen für MediaRecorder (für iOS Safari Fallback)
  const startAudioRecording = async () => {
    audioChunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });
      
      mediaRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        processAudioFile(audioBlob);
        
        // Stoppe alle Tracks im Stream
        stream.getTracks().forEach(track => track.stop());
      });
      
      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Aufnahme gestartet",
        description: "Sprechen Sie jetzt. Klicken Sie erneut, um die Aufnahme zu beenden.",
      });
    } catch (error) {
      console.error("Fehler beim Starten der Audioaufnahme:", error);
      toast({
        title: "Fehler beim Starten der Aufnahme",
        description: "Konnte nicht auf das Mikrofon zugreifen. Bitte überprüfen Sie die Berechtigungen.",
        variant: "destructive"
      });
    }
  };
  
  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  // Audiodatei verarbeiten (Upload und Server-seitige Transkription)
  const processAudioFile = async (file: Blob) => {
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', file, 'recording.webm');
      
      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server antwortete mit Status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.text) {
        // Aktuellen Text plus transkribierter Text
        const updatedText = text ? text + ' ' + data.text : data.text;
        setText(updatedText);
        onTextChange(updatedText);
        
        toast({
          title: "Transkription erfolgreich",
          description: "Die Aufnahme wurde erfolgreich in Text umgewandelt.",
        });
      } else {
        throw new Error('Keine Transkription erhalten');
      }
    } catch (error) {
      console.error("Fehler bei der Spracherkennung:", error);
      toast({
        title: "Fehler bei der Spracherkennung",
        description: "Die Aufnahme konnte nicht in Text umgewandelt werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Funktion zum Behandeln von Dateien aus dem Datei-Upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Prüfen, ob es sich um eine Audiodatei handelt
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Ungültiger Dateityp",
        description: "Bitte wählen Sie eine Audio-Datei aus.",
        variant: "destructive"
      });
      return;
    }
    
    processAudioFile(file);
  };
  
  // Safari auf iOS-spezifische Warnung
  const showSafariWarning = browserInfo.isSafari && browserInfo.isIOS;
  
  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      <div className="flex items-center space-x-2 flex-wrap gap-2">
        <Button 
          type="button" 
          variant={(isListening || isRecording) ? "destructive" : "default"} 
          onClick={toggleListening}
          disabled={!isSupported || isLoading}
          className="flex items-center gap-2"
        >
          {isListening || isRecording ? (
            <>
              <MicOff className="h-4 w-4" />
              Aufnahme stoppen
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              Aufnahme starten
            </>
          )}
        </Button>
        
        <Button 
          type="button" 
          variant="outline" 
          onClick={clearText}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Löschen
        </Button>
        
        {/* Datei-Upload für Geräte, die keine direkte Aufnahme unterstützen */}
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
          ref={fileInputRef}
        />
        
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verarbeite...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Audiodatei hochladen
            </>
          )}
        </Button>
        
        {showSafariWarning && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-amber-500 flex items-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Safari auf iOS hat eingeschränkte Unterstützung für Spracherkennung. Bitte versuchen Sie die Audio-Datei-Upload-Option oder verwenden Sie Chrome für die beste Erfahrung.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <div 
        className={cn(
          "p-3 border rounded-md h-32 overflow-y-auto", 
          (isListening || isRecording) ? "border-primary" : "border-gray-300",
          text || interim ? "text-black" : "text-gray-400"
        )}
      >
        {text || interim ? (
          <>
            <span>{text}</span>
            <span className="text-gray-400">{interim}</span>
          </>
        ) : placeholder}
      </div>
      
      {!isSupported ? (
        <p className="text-destructive text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Spracherkennung wird von Ihrem Browser nicht unterstützt. Bitte verwenden Sie die Audiodatei-Upload-Option oder einen modernen Browser wie Chrome oder Edge.
        </p>
      ) : showSafariWarning && (
        <p className="text-amber-500 text-sm flex items-center gap-2">
          <Info className="h-4 w-4" />
          Safari auf iOS hat eingeschränkte Unterstützung für Spracherkennung. Bitte versuchen Sie die Aufnahme-Option oder nutzen Sie die Audio-Upload-Funktion.
        </p>
      )}
    </div>
  );
}
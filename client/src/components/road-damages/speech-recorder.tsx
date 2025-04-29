import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, Play, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SpeechRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  isProcessing: boolean;
}

/**
 * Komponente zur Aufnahme von Sprachmemos für die Straßenschaden-Erfassung
 */
export function SpeechRecorder({ onRecordingComplete, isProcessing }: SpeechRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Bereinigen, wenn die Komponente unmontiert wird
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);
  
  const startRecording = async () => {
    try {
      setPermissionError(null);
      
      // Mikrofonzugriff anfordern
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // MediaRecorder mit der richtigen MIME-Unterstützung initialisieren
      const mimeType = "audio/webm";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      // Ereignishandler für Datenchunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Ereignishandler für Aufnahmeende
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        setIsRecording(false);
        
        // Streams stoppen
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Aufnahme starten
      audioChunksRef.current = [];
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      
      setIsRecording(true);
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
      
      // Timer für die Aufnahmezeit starten
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Fehler beim Starten der Aufnahme:", error);
      setPermissionError(
        "Mikrofon-Zugriff wurde verweigert oder ist nicht verfügbar. Bitte erteilen Sie die Berechtigung in Ihren Browser-Einstellungen."
      );
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  const handleSubmit = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  
  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        {permissionError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Fehler bei Mikrofonzugriff</AlertTitle>
            <AlertDescription>{permissionError}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center mb-2">
            {isRecording ? (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-2 animate-pulse">
                  <Mic className="h-8 w-8 text-red-500" />
                </div>
                <div className="text-lg font-semibold">{formatTime(recordingTime)}</div>
                <div className="text-sm text-gray-500">Aufnahme läuft...</div>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                <Mic className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            {!isRecording ? (
              <Button 
                type="button" 
                onClick={startRecording}
                disabled={isProcessing}
                className="flex-1"
                variant="outline"
              >
                <Mic className="mr-2 h-4 w-4" />
                Aufnahme starten
              </Button>
            ) : (
              <Button 
                type="button" 
                onClick={stopRecording} 
                variant="destructive"
                className="flex-1"
              >
                <StopCircle className="mr-2 h-4 w-4" />
                Aufnahme beenden
              </Button>
            )}
            
            {audioUrl && (
              <div className="flex-1 flex space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    const audio = new Audio(audioUrl);
                    audio.play();
                  }}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Wiedergeben
                </Button>
                
                <Button 
                  type="button" 
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Auswerten"
                  )}
                </Button>
              </div>
            )}
          </div>
          
          {audioUrl && !isProcessing && (
            <div className="text-sm text-gray-500 text-center mt-2">
              Klicken Sie auf "Auswerten", um die Sprachaufnahme zu analysieren
            </div>
          )}
          
          {isProcessing && (
            <div className="text-sm text-center text-gray-700 mt-2">
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              Sprachaufnahme wird analysiert...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SpeechRecorderProps {
  onResult: (audioBlob: Blob, text: string) => void;
}

const SpeechRecorder: React.FC<SpeechRecorderProps> = ({ onResult }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Stoppe die Aufnahme, wenn die Komponente unmountet
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    audioChunksRef.current = [];
    setRecordingSeconds(0);

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
        processAudio(audioBlob);
        
        // Stoppe alle Tracks im Stream
        stream.getTracks().forEach(track => track.stop());
      });

      // Starte die Aufnahme
      mediaRecorder.start();
      setIsRecording(true);

      // Starte den Timer
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Fehler beim Zugriff auf das Mikrofon:", error);
      toast({
        title: "Mikrofon nicht verfügbar",
        description: "Bitte erlauben Sie den Zugriff auf das Mikrofon oder überprüfen Sie die Geräteeinstellungen.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stoppe den Timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Anfrage an Speech-to-Text-Service senden
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server antwortete mit Status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Falls erfolgreich, das Ergebnis zurückgeben
      if (data.text) {
        onResult(audioBlob, data.text);
        toast({
          title: "Aufnahme erfolgreich transkribiert",
          description: `Die Aufnahme wurde erfolgreich in Text umgewandelt.`,
        });
      } else {
        throw new Error('Keine Transkription erhalten');
      }
    } catch (error) {
      console.error("Fehler bei der Spracherkennung:", error);
      toast({
        title: "Fehler bei der Spracherkennung",
        description: "Die Aufnahme konnte nicht in Text umgewandelt werden. Die Audiodatei wird trotzdem gespeichert.",
        variant: "destructive",
      });
      
      // Dennoch die Audiodatei zurückgeben, auch wenn die Transkription fehlschlägt
      onResult(audioBlob, "");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      {isRecording ? (
        <>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={stopRecording}
            className="flex gap-2 items-center"
          >
            <Square className="h-4 w-4" />
            <span>Aufnahme stoppen</span>
            <span className="ml-1 text-xs">({formatTime(recordingSeconds)})</span>
          </Button>
        </>
      ) : (
        <Button 
          variant="outline" 
          size="sm"
          onClick={startRecording}
          disabled={isProcessing}
          className="flex gap-2 items-center"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verarbeite...</span>
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              <span>Spracheingabe</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default SpeechRecorder;
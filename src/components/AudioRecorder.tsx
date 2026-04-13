import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, X, Volume2 } from "lucide-react";

interface AudioRecorderProps {
  onRecorded: (file: File) => void;
  disabled?: boolean;
  maxDurationSec?: number;
}

const AudioRecorder = ({ onRecorded, disabled, maxDurationSec = 120 }: AudioRecorderProps) => {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `gravacao-${Date.now()}.webm`, { type: "audio/webm" });
        onRecorded(file);
        setRecording(false);
        setElapsed(0);
      };

      mediaRecorder.start(250);
      setRecording(true);
      setElapsed(0);

      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev + 1 >= maxDurationSec) {
            mediaRecorderRef.current?.stop();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      // Permission denied or not supported
    }
  }, [onRecorded, maxDurationSec]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (recording) {
    return (
      <button
        type="button"
        onClick={stopRecording}
        className="flex items-center justify-center gap-2 w-full border-2 border-destructive/50 rounded-lg py-3 bg-destructive/5 hover:bg-destructive/10 transition-colors cursor-pointer animate-pulse"
      >
        <Square className="h-4 w-4 text-destructive" />
        <span className="text-xs text-destructive font-medium">
          Gravando {formatTime(elapsed)} — clique para parar
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={startRecording}
      disabled={disabled}
      className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-border rounded-lg py-3 hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Mic className="h-4 w-4 text-primary" />
      <span className="text-xs text-muted-foreground">Gravar áudio pelo microfone</span>
    </button>
  );
};

export default AudioRecorder;

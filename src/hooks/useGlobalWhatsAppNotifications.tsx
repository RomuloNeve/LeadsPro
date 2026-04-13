import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logoIcon from "@/assets/logo-icon.png";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

const POLL_INTERVAL = 10000; // 10s

// Tri-tone notification using HTML Audio with WAV data URI (works in background tabs)
// iPhone tri-tone notification sound (single clean chime)
const NOTIFICATION_WAV = (() => {
  const sampleRate = 44100;
  const totalDur = 0.6;
  const numSamples = Math.floor(sampleRate * totalDur);
  const samples = new Float32Array(numSamples);
  // Classic iPhone tri-tone: three quick ascending notes
  const tones = [
    { freq: 1175, start: 0, dur: 0.08 },   // D6
    { freq: 1480, start: 0.12, dur: 0.08 }, // F#6
    { freq: 1760, start: 0.24, dur: 0.12 }, // A6
  ];
  for (const t of tones) {
    const s = Math.floor(t.start * sampleRate);
    const e = Math.min(s + Math.floor(t.dur * sampleRate), numSamples);
    for (let i = s; i < e; i++) {
      const pos = (i - s) / (e - s);
      const env = Math.exp(-5 * pos) * (1 - Math.exp(-80 * pos));
      samples[i] += 0.3 * env * Math.sin(2 * Math.PI * t.freq * (i / sampleRate));
      // Add subtle harmonic
      samples[i] += 0.08 * env * Math.sin(2 * Math.PI * t.freq * 2 * (i / sampleRate));
    }
  }
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  const writeStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  writeStr(0, "RIFF"); view.setUint32(4, 36 + numSamples * 2, true); writeStr(8, "WAVE");
  writeStr(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  writeStr(36, "data"); view.setUint32(40, numSamples * 2, true);
  for (let i = 0; i < numSamples; i++) {
    const s16 = Math.max(-32768, Math.min(32767, Math.floor(samples[i] * 32767)));
    view.setInt16(44 + i * 2, s16, true);
  }
  const blob = new Blob([buffer], { type: "audio/wav" });
  return URL.createObjectURL(blob);
})();

let lastSoundTime = 0;

const playNotificationSound = () => {
  const now = Date.now();
  // Debounce: only play once per 3 seconds
  if (now - lastSoundTime < 3000) return;
  lastSoundTime = now;
  try {
    const audio = new Audio(NOTIFICATION_WAV);
    audio.volume = 0.45;
    audio.play().catch(() => {});
  } catch {
    // Audio not available
  }
};

// Request browser notification permission on first load
const requestNotificationPermission = () => {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
};

// Removed sendBrowserNotification - only use in-app toast now (single notification)

interface ChatSnapshot {
  remoteJid: string;
  lastMessage: string;
  lastTimestamp: number | string;
  lastMessageFromMe: boolean;
  name: string;
}

export const useGlobalWhatsAppNotifications = () => {
  const { toast } = useToast();
  const previousChatsRef = useRef<ChatSnapshot[]>([]);
  const initializedRef = useRef(false);

  // Request permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const checkForNewMessages = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/whatsapp-inbox?action=chats`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      if (data.error) return;

      const newChats: ChatSnapshot[] = (data.chats || []).map((c: any) => ({
        remoteJid: c.remoteJid,
        lastMessage: c.lastMessage,
        lastTimestamp: c.lastTimestamp,
        lastMessageFromMe: c.lastMessageFromMe === true,
        name: c.name,
      }));

      if (!initializedRef.current) {
        initializedRef.current = true;
        previousChatsRef.current = newChats;
        return;
      }

      const prev = previousChatsRef.current;

      let hasNew = false;
      for (const nc of newChats) {
        // Only notify for RECEIVED messages (skip messages sent by us)
        if (nc.lastMessageFromMe) continue;
        const old = prev.find((p) => p.remoteJid === nc.remoteJid);
        const isNew = !old || (nc.lastMessage !== old.lastMessage && nc.lastTimestamp !== old.lastTimestamp);
        if (isNew && !hasNew) {
          hasNew = true;
          playNotificationSound();
          const whatsappToastIcon = (
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center shadow-md">
              <WhatsAppIcon size={22} color="white" strokeWidth={2.5} />
            </div>
          );
          // Use custom name from localStorage if available
          const customNames = JSON.parse(localStorage.getItem("wa_custom_names") || "{}");
          const displayName = customNames[nc.remoteJid] || nc.name;
          toast({
            variant: "whatsapp",
            icon: whatsappToastIcon,
            title: displayName,
            description: nc.lastMessage?.slice(0, 80) || "Nova mensagem",
            duration: 5000,
          });
        }
      }

      previousChatsRef.current = newChats;
    } catch {
      // Silent fail
    }
  }, [toast]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: instance } = await supabase
        .from("whatsapp_instances")
        .select("status")
        .eq("user_id", session.user.id)
        .eq("status", "connected")
        .maybeSingle();

      if (!instance) return;

      checkForNewMessages();
      const interval = setInterval(checkForNewMessages, POLL_INTERVAL);
      return () => clearInterval(interval);
    };

    let cleanup: (() => void) | undefined;
    init().then((c) => { cleanup = c; });
    return () => { cleanup?.(); };
  }, [checkForNewMessages]);
};

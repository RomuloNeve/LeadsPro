import { useState, useEffect, useRef, useCallback } from "react";
// WhatsApp-style background patterns applied via CSS
import { useTheme } from "next-themes";
import { PageTutorial } from "@/components/PageTutorial";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle, Loader2, Search, Send, ArrowLeft, RefreshCw, User, Image, FileText, Mic, Video, Bell, BellOff, Check, CheckCheck, Smile, WifiOff, Users, Plus, X, UserPlus, Trash2, Square, Paperclip, Contact, BarChart3, File, Bot, Pencil,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { LeadStatusBadge, LeadStatus, getStatusConfig, LEAD_STATUSES } from "@/components/LeadStatusBadge";

interface Chat {
  remoteJid: string;
  remoteJidAlt?: string | null;
  name: string;
  lastMessage: string;
  lastTimestamp: number;
  unreadCount: number;
  profilePicUrl: string | null;
  isGroup?: boolean;
}

interface MessageMeta {
  mediaUrl?: string;
  mimetype?: string;
  caption?: string;
  thumbnailBase64?: string;
  seconds?: number;
  ptt?: boolean;
  fileName?: string;
  fileSize?: number;
  pageCount?: number;
  contactName?: string;
  vcard?: string;
  contacts?: { name: string; vcard: string }[];
  pollName?: string;
  pollOptions?: string[];
  pollSelectableCount?: number;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  locationAddress?: string;
}

interface Message {
  id: string;
  fromMe: boolean;
  text: string;
  timestamp: number;
  type: string;
  hasMedia: boolean;
  pushName?: string;
  meta?: MessageMeta;
}

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "👏"];

// iPhone-like notification sound using Web Audio API
const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    // Tri-tone like iPhone
    const notes = [
      { freq: 1046.50, start: 0, dur: 0.1 },     // C6
      { freq: 1318.51, start: 0.12, dur: 0.1 },   // E6
      { freq: 1567.98, start: 0.24, dur: 0.15 },   // G6
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = note.freq;
      gain.gain.setValueAtTime(0, now + note.start);
      gain.gain.linearRampToValueAtTime(0.3, now + note.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + note.start);
      osc.stop(now + note.start + note.dur + 0.05);
    }

    // Cleanup
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // Audio not available
  }
};

const POLL_CHATS_INTERVAL = 8000;
const POLL_MESSAGES_INTERVAL = 4000;

// Profile pic cache (persists across re-renders)
const profilePicCache: Record<string, string | null> = {};
const profilePicFetching: Set<string> = new Set();

// Queue-based profile pic fetcher (max 3 concurrent)
let picQueue: string[] = [];
let picRunning = 0;
const MAX_CONCURRENT_PIC = 3;
const picListeners: Record<string, ((url: string | null) => void)[]> = {};

async function processQueue() {
  while (picQueue.length > 0 && picRunning < MAX_CONCURRENT_PIC) {
    const jid = picQueue.shift()!;
    if (profilePicCache[jid] !== undefined) {
      (picListeners[jid] || []).forEach(cb => cb(profilePicCache[jid]!));
      delete picListeners[jid];
      continue;
    }
    picRunning++;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { profilePicCache[jid] = null; return; }
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/whatsapp-inbox?action=profile-pic`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ remoteJid: jid }),
          }
        );
        const data = await res.json();
        profilePicCache[jid] = data.profilePicUrl || null;
      } catch {
        profilePicCache[jid] = null;
      }
      (picListeners[jid] || []).forEach(cb => cb(profilePicCache[jid]!));
      delete picListeners[jid];
      picRunning--;
      processQueue();
    })();
  }
}

function requestProfilePic(jid: string, cb: (url: string | null) => void) {
  if (profilePicCache[jid] !== undefined) { cb(profilePicCache[jid]!); return; }
  if (!picListeners[jid]) picListeners[jid] = [];
  picListeners[jid].push(cb);
  if (!picQueue.includes(jid)) picQueue.push(jid);
  processQueue();
}

// Lazy-loading avatar component
const ChatAvatar = ({ chat, isDark, size = 12 }: { chat: { remoteJid: string; isGroup?: boolean; profilePicUrl?: string | null }; isDark: boolean; size?: number }) => {
  const [picUrl, setPicUrl] = useState<string | null>(chat.profilePicUrl || profilePicCache[chat.remoteJid] || null);
  const sizeClass = size === 12 ? "h-12 w-12" : "h-10 w-10";
  const iconSize = size === 12 ? "h-6 w-6" : "h-5 w-5";

  useEffect(() => {
    const jid = chat.remoteJid;
    if (profilePicCache[jid] !== undefined) {
      if (profilePicCache[jid]) setPicUrl(profilePicCache[jid]);
      return;
    }
    requestProfilePic(jid, (url) => { if (url) setPicUrl(url); });
  }, [chat.remoteJid]);

  if (picUrl) {
    return (
      <img src={picUrl} alt="" className={`${sizeClass} rounded-full object-cover flex-shrink-0`} onError={() => setPicUrl(null)} />
    );
  }
  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? "bg-[#2a3942]" : "bg-[#dfe5e7]"}`}>
      {chat.isGroup ? <Users className={`${iconSize} ${isDark ? "text-[#aebac1]" : "text-[#54656f]"}`} /> : <User className={`${iconSize} ${isDark ? "text-[#aebac1]" : "text-[#54656f]"}`} />}
    </div>
  );
};

const UserWhatsAppInbox = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { toast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [pollingEnabled, setPollingEnabled] = useState(true);
  const [newMessageAlert, setNewMessageAlert] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedChatRef = useRef<Chat | null>(null);
  const previousChatsRef = useRef<Chat[]>([]);

  const getSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }, []);

  const extractFunctionError = (data: any, fallback: string) =>
    data?.error || data?.data?.response?.message?.[0] || data?.data?.message || fallback;

  const [instanceDisconnected, setInstanceDisconnected] = useState(false);
  const [myPhoneJid, setMyPhoneJid] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [contacts, setContacts] = useState<{ jid: string; name: string; profilePicUrl: string | null }[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<typeof contacts>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Custom name overrides (persisted in localStorage)
  const [customNames, setCustomNames] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem("wa_custom_names") || "{}");
    } catch { return {}; }
  });
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const editNameInputRef = useRef<HTMLInputElement>(null);

  const saveCustomName = (jid: string, name: string) => {
    const trimmed = name.trim();
    const updated = { ...customNames };
    if (trimmed) {
      updated[jid] = trimmed;
    } else {
      delete updated[jid];
    }
    setCustomNames(updated);
    localStorage.setItem("wa_custom_names", JSON.stringify(updated));
    // Update chat objects in-place
    setChats(prev => prev.map(c => c.remoteJid === jid ? { ...c, name: trimmed || c.name } : c));
    if (selectedChat && selectedChat.remoteJid === jid && trimmed) {
      setSelectedChat({ ...selectedChat, name: trimmed });
    }
    setEditingName(false);
  };

  const getDisplayName = (chat: Chat) => customNames[chat.remoteJid] || chat.name;

  // Lead search state
  const [showLeadSearch, setShowLeadSearch] = useState(false);
  const [leadSearchQuery, setLeadSearchQuery] = useState("");
  const [leadsWithPhone, setLeadsWithPhone] = useState<{ id: string; name: string; phone: string; category: string | null }[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [sendingAudio, setSendingAudio] = useState(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ msgId: string; fromMe: boolean; x: number; y: number } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const deletedMsgIdsRef = useRef<Set<string>>(new Set());

  // Attachment menu state
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [sendingMedia, setSendingMedia] = useState(false);
  const [mediaCaption, setMediaCaption] = useState("");

  // Poll dialog state
  const [showPollDialog, setShowPollDialog] = useState(false);
  const [pollName, setPollName] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollSelectableCount, setPollSelectableCount] = useState(1);
  const [sendingPoll, setSendingPoll] = useState(false);

  // Chatbot toggle state
  const [chatbotActive, setChatbotActive] = useState<boolean | null>(null);
  const [togglingBot, setTogglingBot] = useState(false);
  const [chatbotConfigId, setChatbotConfigId] = useState<string | null>(null);
  const [autoReplyAll, setAutoReplyAll] = useState(false);
  const [togglingAutoReply, setTogglingAutoReply] = useState(false);

  // Lead status state (for the selected chat's matching lead)
  const [chatLeadStatus, setChatLeadStatus] = useState<string>("novo");
  const [chatLeadId, setChatLeadId] = useState<string | null>(null);
  const [chatLeadLoading, setChatLeadLoading] = useState(false);

  // Fetch lead status for current chat
  const fetchLeadStatusForChat = useCallback(async (chat: Chat) => {
    setChatLeadStatus("novo");
    setChatLeadId(null);
    if (chat.isGroup || chat.remoteJid.endsWith("@g.us")) return;
    
    const phone = chat.remoteJid.replace("@s.whatsapp.net", "").replace("@lid", "");
    if (!phone) return;

    try {
      const { data } = await supabase
        .from("leads")
        .select("id, lead_status, phone")
        .or(`phone.ilike.%${phone.slice(-8)}%,phone.ilike.%${phone}%`)
        .limit(1)
        .maybeSingle();

      if (data) {
        setChatLeadId(data.id);
        setChatLeadStatus(data.lead_status || "novo");
      }
    } catch {}
  }, []);

  const handleChatLeadStatusChange = useCallback(async (newStatus: LeadStatus) => {
    // If no lead exists yet, create one first
    if (!chatLeadId && selectedChat) {
      setChatLeadLoading(true);
      try {
        // Get user's license
        const { data: licData } = await supabase
          .from("licenses")
          .select("id")
          .not("assigned_to", "is", null)
          .limit(1)
          .maybeSingle();

        if (!licData) {
          toast({ title: "Erro", description: "Licença não encontrada.", variant: "destructive" });
          setChatLeadLoading(false);
          return;
        }

        const phone = selectedChat.remoteJid.replace("@s.whatsapp.net", "").replace("@lid", "");
        const displayName = getDisplayName(selectedChat);

        const { data: newLead, error } = await supabase
          .from("leads")
          .insert({
            license_id: licData.id,
            name: displayName !== phone ? displayName : null,
            phone: phone,
            lead_status: newStatus,
          })
          .select("id")
          .single();

        if (error) {
          toast({ title: "Erro ao salvar lead", description: error.message, variant: "destructive" });
          setChatLeadLoading(false);
          return;
        }

        setChatLeadId(newLead.id);
        setChatLeadStatus(newStatus);
        const config = getStatusConfig(newStatus);
        toast({ title: `Lead salvo como ${config.label}`, description: `${displayName} foi adicionado ao CRM.` });
      } catch (e: any) {
        toast({ title: "Erro", description: e.message, variant: "destructive" });
      }
      setChatLeadLoading(false);
      return;
    }

    // Update existing lead
    const { error } = await supabase
      .from("leads")
      .update({ lead_status: newStatus })
      .eq("id", chatLeadId!);

    if (error) {
      toast({ title: "Erro ao atualizar status", description: error.message, variant: "destructive" });
    } else {
      setChatLeadStatus(newStatus);
      const config = getStatusConfig(newStatus);
      toast({ title: `${config.label}`, description: `Lead marcado como ${config.label.toLowerCase()}.` });
    }
  }, [chatLeadId, selectedChat, toast]);

  const checkChatbotStatus = useCallback(async (phone: string) => {
    setChatbotActive(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      // First get config
      const cfgRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/chatbot-webhook?action=get-config`,
        { headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" } }
      );
      const cfgData = await cfgRes.json();
      if (!cfgData.config) { setChatbotConfigId(null); setChatbotActive(false); return; }
      setChatbotConfigId(cfgData.config.id);
      setAutoReplyAll(cfgData.config.auto_reply_all ?? false);
      // Check if this lead phone is active
      const leadsRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/chatbot-webhook?action=list-leads&config_id=${cfgData.config.id}`,
        { headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" } }
      );
      const leadsData = await leadsRes.json();
      const lead = (leadsData.leads || []).find((l: any) => l.lead_phone === phone && l.is_active);
      setChatbotActive(!!lead);
    } catch {
      setChatbotActive(false);
    }
  }, []);

  // Load chatbot config on mount (for global toggle)
  const loadChatbotConfig = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const cfgRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/chatbot-webhook?action=get-config`,
        { headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" } }
      );
      const cfgData = await cfgRes.json();
      if (cfgData.config) {
        setChatbotConfigId(cfgData.config.id);
        setAutoReplyAll(cfgData.config.auto_reply_all ?? false);
      }
    } catch {}
  }, []);

  useEffect(() => { loadChatbotConfig(); }, [loadChatbotConfig]);

  const handleToggleAutoReply = useCallback(async () => {
    if (!chatbotConfigId) {
      toast({ title: "Configure o Chatbot primeiro", description: "Vá em Chatbot IA no menu para configurar o bot.", variant: "destructive" });
      return;
    }
    setTogglingAutoReply(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const newVal = !autoReplyAll;
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/chatbot-webhook?action=toggle-auto-reply`,
        { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ config_id: chatbotConfigId, enabled: newVal }) }
      );
      setAutoReplyAll(newVal);
      toast({ title: newVal ? "🤖 Bot ativado para todos" : "Bot desativado para todos", description: newVal ? "O bot vai responder automaticamente a qualquer contato." : "O bot só responderá a contatos ativados individualmente." });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
    setTogglingAutoReply(false);
  }, [chatbotConfigId, autoReplyAll, toast]);

  const handleToggleChatbot = useCallback(async () => {
    if (!selectedChat || selectedChat.isGroup) return;
    const phone = selectedChat.remoteJid.replace("@s.whatsapp.net", "").replace("@lid", "");
    setTogglingBot(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

      // If no config exists, prompt user
      if (!chatbotConfigId) {
        toast({ title: "Configure o Chatbot primeiro", description: "Vá em Chatbot IA no menu para configurar o bot.", variant: "destructive" });
        setTogglingBot(false);
        return;
      }

      const activate = !chatbotActive;
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/chatbot-webhook?action=toggle-lead`,
        { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ phone, activate, config_id: chatbotConfigId }) }
      );
      setChatbotActive(activate);
      toast({ title: activate ? "🤖 Bot ativado!" : "Bot desativado", description: activate ? "O chatbot vai responder automaticamente." : "Você voltou a responder manualmente." });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
    setTogglingBot(false);
  }, [selectedChat, chatbotActive, chatbotConfigId, toast]);

  // Contact send dialog state
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactNameToSend, setContactNameToSend] = useState("");
  const [contactPhoneToSend, setContactPhoneToSend] = useState("");
  const [sendingContact, setSendingContact] = useState(false);

  const handleDeleteMessage = async (messageId: string, fromMe: boolean) => {
    if (!selectedChat) return;
    try {
      const session = await getSession();
      if (!session) return;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/whatsapp-inbox?action=delete-message`,
        { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ remoteJid: selectedChat.remoteJid, messageId, fromMe }) }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Erro ao apagar");
      deletedMsgIdsRef.current.add(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast({ title: "🗑️ Mensagem apagada" });
    } catch (e: any) {
      toast({ title: "Erro ao apagar mensagem", description: e.message, variant: "destructive" });
    }
    setContextMenu(null);
  };

  const handleSendReaction = async (messageId: string, reaction: string, msgFromMe: boolean) => {
    if (!selectedChat) return;
    try {
      const session = await getSession();
      if (!session) return;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/whatsapp-inbox?action=send-reaction`,
        { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ remoteJid: selectedChat.remoteJid, messageId, reaction, fromMe: msgFromMe }) }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Erro ao reagir");
      toast({ title: `${reaction} Reação enviada!` });
    } catch (e: any) {
      toast({ title: "Erro ao enviar reação", description: e.message, variant: "destructive" });
    }
    setShowEmojiPicker(null);
    setContextMenu(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm;codecs=opus" });
        await sendAudio(blob);
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch (e: any) {
      toast({ title: "Erro ao gravar áudio", description: "Permita o acesso ao microfone.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
    }
    setIsRecording(false);
    setRecordingTime(0);
    audioChunksRef.current = [];
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
  };

  const sendAudio = async (blob: Blob) => {
    if (!selectedChat) return;
    setSendingAudio(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      const session = await getSession();
      if (!session) return;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/whatsapp-inbox?action=send-audio`,
        { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ remoteJid: selectedChat.remoteJid, remoteJidAlt: selectedChat.remoteJidAlt, audioBase64: base64 }) }
      );
      const data = await res.json();
      if (!data.success) throw new Error(extractFunctionError(data, "Erro ao enviar áudio"));
      toast({ title: "🎤 Áudio enviado!" });
      setMessages((prev) => [...prev, { id: Date.now().toString(), fromMe: true, text: "🎤 Áudio", timestamp: Math.floor(Date.now() / 1000), type: "audio", hasMedia: true }]);
      setTimeout(() => { if (selectedChatRef.current) fetchMessagesForChat(selectedChatRef.current, true); }, 2000);
    } catch (e: any) {
      toast({ title: "Erro ao enviar áudio", description: e.message, variant: "destructive" });
    }
    setSendingAudio(false);
    setRecordingTime(0);
  };

  const formatRecordingTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const handleSendMedia = async (file: globalThis.File, mediaType: "image" | "video") => {
    if (!selectedChat) return;
    setSendingMedia(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const session = await getSession();
      if (!session) return;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/whatsapp-inbox?action=send-media`,
        { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ remoteJid: selectedChat.remoteJid, remoteJidAlt: selectedChat.remoteJidAlt, mediaBase64: base64, caption: mediaCaption, mediaType, mimeType: file.type, fileName: file.name }) }
      );
      const data = await res.json();
      if (!data.success) throw new Error(extractFunctionError(data, "Erro ao enviar mídia"));
      const icon = mediaType === "video" ? "🎬" : "📷";
      toast({ title: `${icon} ${mediaType === "video" ? "Vídeo" : "Imagem"} enviado!` });
      setMessages((prev) => [...prev, { id: Date.now().toString(), fromMe: true, text: `${icon} ${mediaCaption || (mediaType === "video" ? "Vídeo" : "Imagem")}`, timestamp: Math.floor(Date.now() / 1000), type: mediaType, hasMedia: true }]);
      setMediaCaption("");
      setTimeout(() => { if (selectedChatRef.current) fetchMessagesForChat(selectedChatRef.current, true); }, 2000);
    } catch (e: any) {
      toast({ title: "Erro ao enviar mídia", description: e.message, variant: "destructive" });
    }
    setSendingMedia(false);
    setShowAttachMenu(false);
  };

  const handleSendDocument = async (file: globalThis.File) => {
    if (!selectedChat) return;
    setSendingMedia(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const session = await getSession();
      if (!session) return;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/whatsapp-inbox?action=send-document`,
        { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ remoteJid: selectedChat.remoteJid, remoteJidAlt: selectedChat.remoteJidAlt, documentBase64: base64, fileName: file.name, mimeType: file.type }) }
      );
      const data = await res.json();
      if (!data.success) throw new Error(extractFunctionError(data, "Erro ao enviar documento"));
      toast({ title: "📄 Documento enviado!" });
      setMessages((prev) => [...prev, { id: Date.now().toString(), fromMe: true, text: `📄 ${file.name}`, timestamp: Math.floor(Date.now() / 1000), type: "document", hasMedia: true }]);
      setTimeout(() => { if (selectedChatRef.current) fetchMessagesForChat(selectedChatRef.current, true); }, 2000);
    } catch (e: any) {
      toast({ title: "Erro ao enviar documento", description: e.message, variant: "destructive" });
    }
    setSendingMedia(false);
    setShowAttachMenu(false);
  };

  const handleSendContact = async () => {
    if (!selectedChat || !contactNameToSend.trim() || !contactPhoneToSend.trim()) return;
    setSendingContact(true);
    try {
      const session = await getSession();
      if (!session) return;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/whatsapp-inbox?action=send-contact`,
        { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ remoteJid: selectedChat.remoteJid, remoteJidAlt: selectedChat.remoteJidAlt, contactName: contactNameToSend, contactPhone: contactPhoneToSend }) }
      );
      const data = await res.json();
      if (!data.success) throw new Error(extractFunctionError(data, "Erro ao enviar contato"));
      toast({ title: "👤 Contato enviado!" });
      setMessages((prev) => [...prev, { id: Date.now().toString(), fromMe: true, text: `👤 ${contactNameToSend}`, timestamp: Math.floor(Date.now() / 1000), type: "contact", hasMedia: false }]);
      setContactNameToSend("");
      setContactPhoneToSend("");
      setShowContactDialog(false);
      setTimeout(() => { if (selectedChatRef.current) fetchMessagesForChat(selectedChatRef.current, true); }, 2000);
    } catch (e: any) {
      toast({ title: "Erro ao enviar contato", description: e.message, variant: "destructive" });
    }
    setSendingContact(false);
  };

  const handleSendPoll = async () => {
    if (!selectedChat || !pollName.trim() || pollOptions.filter((o) => o.trim()).length < 2) return;
    setSendingPoll(true);
    try {
      const session = await getSession();
      if (!session) return;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const validOptions = pollOptions.filter((o) => o.trim());
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/whatsapp-inbox?action=send-poll`,
        { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ remoteJid: selectedChat.remoteJid, remoteJidAlt: selectedChat.remoteJidAlt, pollName, pollOptions: validOptions, selectableCount: pollSelectableCount }) }
      );
      const data = await res.json();
      if (!data.success) throw new Error(extractFunctionError(data, "Erro ao criar enquete"));
      toast({ title: "📊 Enquete enviada!" });
      setMessages((prev) => [...prev, { id: Date.now().toString(), fromMe: true, text: `📊 ${pollName}`, timestamp: Math.floor(Date.now() / 1000), type: "poll", hasMedia: false }]);
      setPollName("");
      setPollOptions(["", ""]);
      setPollSelectableCount(1);
      setShowPollDialog(false);
      setTimeout(() => { if (selectedChatRef.current) fetchMessagesForChat(selectedChatRef.current, true); }, 2000);
    } catch (e: any) {
      toast({ title: "Erro ao enviar enquete", description: e.message, variant: "destructive" });
    }
    setSendingPoll(false);
  };

  const fetchChats = useCallback(async (silent = false) => {
    if (!silent) setLoadingChats(true);
    try {
      const session = await getSession();
      if (!session) return;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/whatsapp-inbox?action=chats`,
        { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" } }
      );
      const data = await res.json();
      if (data.error) {
        if (data.error.includes("não conectada") || data.error.includes("not connected")) {
          setInstanceDisconnected(true);
          if (!silent) setLoadingChats(false);
          return;
        }
        throw new Error(data.error);
      }
      setInstanceDisconnected(false);
      // Set owner JID for user's own profile pic
      if (data.ownerJid && !myPhoneJid) {
        setMyPhoneJid(data.ownerJid);
      }
      const newChats: Chat[] = data.chats || [];

      // If no chats found and not silent, auto-fetch contacts so user sees their contact list
      if (newChats.length === 0 && !silent) {
        fetchContacts();
      }

      if (silent && previousChatsRef.current.length > 0) {
        // Notification sound only — toast is handled by the global hook
        let hasNew = false;
        for (const nc of newChats) {
          const prev = previousChatsRef.current.find((p) => p.remoteJid === nc.remoteJid);
          if (prev && nc.lastMessage !== prev.lastMessage && nc.lastTimestamp !== prev.lastTimestamp) {
            if (selectedChatRef.current?.remoteJid !== nc.remoteJid) {
              setNewMessageAlert(true);
              hasNew = true;
            }
          }
        }
        for (const nc of newChats) {
          if (!previousChatsRef.current.find((p) => p.remoteJid === nc.remoteJid)) {
            setNewMessageAlert(true);
            hasNew = true;
          }
        }
        if (hasNew) {
          playNotificationSound();
        }
      }
      previousChatsRef.current = newChats;
      setChats(newChats);
    } catch (e: any) {
      if (!silent) toast({ title: "Erro ao carregar conversas", description: e.message, variant: "destructive" });
    }
    if (!silent) setLoadingChats(false);
  }, [getSession, toast]);

  const fetchMessagesForChat = useCallback(async (chat: Chat, silent = false) => {
    if (!silent) { setLoadingMessages(true); setMessages([]); }
    try {
      const session = await getSession();
      if (!session) return;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/whatsapp-inbox?action=messages`,
        { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ remoteJid: chat.remoteJid, limit: 100 }) }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const newMsgs: Message[] = (data.messages || []).filter((m: Message) => !deletedMsgIdsRef.current.has(m.id));
      setMessages((prev) => {
        if (newMsgs.length !== prev.length || JSON.stringify(newMsgs.map(m => m.id)) !== JSON.stringify(prev.map(m => m.id))) return newMsgs;
        return prev;
      });
    } catch (e: any) {
      if (!silent) toast({ title: "Erro ao carregar mensagens", description: e.message, variant: "destructive" });
    }
    if (!silent) setLoadingMessages(false);
  }, [getSession, toast]);

  const fetchMessages = useCallback(async (chat: Chat) => {
    setSelectedChat(chat);
    selectedChatRef.current = chat;
    setNewMessageAlert(false);
    setEditingName(false);
    deletedMsgIdsRef.current.clear();
    setMediaCache({});
    setPlayingAudioId(null);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    // Check chatbot status and lead status for non-group chats
    fetchLeadStatusForChat(chat);
    if (!chat.isGroup && !chat.remoteJid.endsWith("@g.us")) {
      checkChatbotStatus(chat.remoteJid.replace("@s.whatsapp.net", "").replace("@lid", ""));
    } else {
      setChatbotActive(null);
    }
    await fetchMessagesForChat(chat, false);
  }, [fetchMessagesForChat, checkChatbotStatus]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    setSending(true);
    try {
      const session = await getSession();
      if (!session) throw new Error("Sessão expirada. Faça login novamente.");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/whatsapp-inbox?action=send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            remoteJid: selectedChat.remoteJid,
            remoteJidAlt: selectedChat.remoteJidAlt,
            text: newMessage,
          }),
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Erro ao enviar");

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), fromMe: true, text: newMessage, timestamp: Math.floor(Date.now() / 1000), type: "text", hasMedia: false },
      ]);
      setNewMessage("");
      setTimeout(() => {
        if (selectedChatRef.current) fetchMessagesForChat(selectedChatRef.current, true);
      }, 2000);
    } catch (e: any) {
      toast({ title: "Erro ao enviar", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const fetchContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      const session = await getSession();
      if (!session) return;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/whatsapp-inbox?action=contacts`,
        { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" } }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setContacts(data.contacts || []);
      setFilteredContacts(data.contacts || []);
    } catch (e: any) {
      toast({ title: "Erro ao carregar contatos", description: e.message, variant: "destructive" });
    }
    setLoadingContacts(false);
  }, [getSession, toast]);

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedParticipants.length === 0) return;
    setCreatingGroup(true);
    try {
      const session = await getSession();
      if (!session) return;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/whatsapp-inbox?action=create-group`,
        { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ subject: groupName, description: groupDescription, participants: selectedParticipants }) }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Erro ao criar grupo");
      toast({ title: "✅ Grupo criado!", description: `O grupo "${groupName}" foi criado com ${selectedParticipants.length} participantes.` });
      setShowCreateGroup(false);
      setGroupName("");
      setGroupDescription("");
      setSelectedParticipants([]);
      setContactSearch("");
      fetchChats();
    } catch (e: any) {
      toast({ title: "Erro ao criar grupo", description: e.message, variant: "destructive" });
    }
    setCreatingGroup(false);
  };

  const openCreateGroup = () => {
    setShowCreateGroup(true);
    setGroupName("");
    setGroupDescription("");
    setSelectedParticipants([]);
    setContactSearch("");
    fetchContacts();
  };

  useEffect(() => {
    if (!contactSearch.trim()) setFilteredContacts(contacts);
    else {
      const q = contactSearch.toLowerCase();
      setFilteredContacts(contacts.filter((c) => c.name.toLowerCase().includes(q) || c.jid.includes(q)));
    }
  }, [contactSearch, contacts]);

  const toggleParticipant = (jid: string) => {
    setSelectedParticipants((prev) => prev.includes(jid) ? prev.filter((p) => p !== jid) : [...prev, jid]);
  };

  const formatPhone = (jid: string, altJid?: string | null) => {
    if (jid.endsWith("@g.us")) return "Grupo";
    // For @lid, use the alt JID (real phone) if available
    const raw = jid.endsWith("@lid") && altJid ? altJid : jid;
    const num = raw.replace("@s.whatsapp.net", "").replace("@lid", "");
    if (num.length === 13 && num.startsWith("55")) return `+${num.slice(0, 2)} (${num.slice(2, 4)}) ${num.slice(4, 9)}-${num.slice(9)}`;
    if (num.length >= 10) return `+${num}`;
    return num;
  };

  // Fetch leads with phone for lead search dialog
  const fetchLeadsWithPhone = useCallback(async () => {
    setLoadingLeads(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      // Get user's license
      const { data: licData } = await supabase
        .from("licenses")
        .select("id")
        .eq("assigned_to", session.user.id)
        .eq("is_active", true)
        .maybeSingle();
      if (!licData) return;
      const { data: leadsData } = await supabase
        .from("leads")
        .select("id, name, phone, category")
        .eq("license_id", licData.id)
        .not("phone", "is", null)
        .neq("phone", "")
        .order("name", { ascending: true })
        .limit(500);
      setLeadsWithPhone(
        (leadsData || [])
          .filter((l: any) => l.phone && l.phone.trim() !== "" && l.phone !== "Não encontrado")
          .map((l: any) => ({ id: l.id, name: l.name || "Sem nome", phone: l.phone, category: l.category }))
      );
    } catch (e) {
      console.error("Error fetching leads:", e);
    }
    setLoadingLeads(false);
  }, []);

  const openLeadSearch = () => {
    setShowLeadSearch(true);
    setLeadSearchQuery("");
    fetchLeadsWithPhone();
  };

  const startChatWithLead = (phone: string, name: string) => {
    // Clean phone number - remove non-digits
    const cleanPhone = phone.replace(/\D/g, "");
    const jid = `${cleanPhone}@s.whatsapp.net`;
    const chatFromLead: Chat = {
      remoteJid: jid,
      name: name || cleanPhone,
      lastMessage: "",
      lastTimestamp: 0,
      unreadCount: 0,
      profilePicUrl: null,
    };
    setShowLeadSearch(false);
    fetchMessages(chatFromLead);
  };

  // Handle URL params (coming from leads page or human support).
  // Previously this ran ONCE on mount with a 1500ms setTimeout and read
  // `chats` from the initial closure (always empty at mount) — so finding
  // an existing chat by JID never worked and it always fell through to
  // startChatWithLead with the raw JID as phone. Now we wait until chats
  // have actually loaded, then run the handler exactly once per param set.
  const urlParamHandledRef = useRef<string | null>(null);
  useEffect(() => {
    const phone = searchParams.get("phone");
    const name = searchParams.get("name");
    const contactJid = searchParams.get("contact");
    if (!phone && !contactJid) return;
    if (chats.length === 0) return; // wait for first fetchChats to populate

    const key = `${contactJid || ""}|${phone || ""}|${name || ""}`;
    if (urlParamHandledRef.current === key) return;
    urlParamHandledRef.current = key;

    setSearchParams({}, { replace: true });

    if (contactJid) {
      const found = chats.find((c) => c.remoteJid === contactJid);
      if (found) {
        setSelectedChat(found);
        fetchMessagesForChat(found);
      } else {
        const jidPhone = contactJid.replace("@s.whatsapp.net", "").replace("@lid", "");
        startChatWithLead(jidPhone, jidPhone);
      }
    } else if (phone) {
      startChatWithLead(phone, name || phone);
    }
  }, [searchParams, chats, setSearchParams]);

  // myPhoneJid is now set from ownerJid in fetchChats response

  useEffect(() => { fetchChats(); }, []);
  useEffect(() => {
    if (!pollingEnabled) return;
    const interval = setInterval(() => fetchChats(true), POLL_CHATS_INTERVAL);
    return () => clearInterval(interval);
  }, [pollingEnabled, fetchChats]);
  useEffect(() => {
    if (!pollingEnabled || !selectedChatRef.current) return;
    const interval = setInterval(() => { if (selectedChatRef.current) fetchMessagesForChat(selectedChatRef.current, true); }, POLL_MESSAGES_INTERVAL);
    return () => clearInterval(interval);
  }, [pollingEnabled, selectedChat, fetchMessagesForChat]);
  useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    // Close emoji picker on click outside
    const handler = () => { setShowEmojiPicker(null); setContextMenu(null); };
    if (showEmojiPicker || contextMenu) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showEmojiPicker, contextMenu]);
  useEffect(() => {
    if (!searchQuery.trim()) setFilteredChats(chats);
    else { const q = searchQuery.toLowerCase(); setFilteredChats(chats.filter((c) => c.name.toLowerCase().includes(q) || c.remoteJid.includes(q))); }
  }, [searchQuery, chats]);

  const formatTime = (ts: number | string) => {
    if (!ts) return "";
    const d = typeof ts === "string" ? new Date(ts) : new Date(ts * 1000);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  const mediaLabel = (type: string) => {
    switch (type) {
      case "image": return "📷 Imagem";
      case "video": return "🎬 Vídeo";
      case "audio": return "🎤 Áudio";
      case "document": return "📄 Documento";
      case "contact": return "👤 Contato";
      case "poll": return "📊 Enquete";
      case "location": return "📍 Localização";
      case "sticker": return "🏷️ Sticker";
      default: return "";
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocIcon = (fileName: string) => {
    const ext = fileName?.split(".").pop()?.toLowerCase() || "";
    if (["pdf"].includes(ext)) return { color: "bg-red-500", label: "PDF" };
    if (["doc", "docx"].includes(ext)) return { color: "bg-blue-500", label: "DOC" };
    if (["xls", "xlsx", "csv"].includes(ext)) return { color: "bg-green-500", label: "XLS" };
    if (["ppt", "pptx"].includes(ext)) return { color: "bg-orange-500", label: "PPT" };
    if (["zip", "rar", "7z"].includes(ext)) return { color: "bg-yellow-600", label: "ZIP" };
    if (["txt"].includes(ext)) return { color: "bg-gray-500", label: "TXT" };
    return { color: "bg-gray-500", label: ext.toUpperCase() || "FILE" };
  };

  const extractPhoneFromVcard = (vcard: string) => {
    const match = vcard.match(/TEL[^:]*:([+\d\s-]+)/i);
    return match ? match[1].trim() : "";
  };

  // Media cache for fetched media (images, audio)
  const [mediaCache, setMediaCache] = useState<Record<string, { base64: string; mimetype: string; loading?: boolean }>>({});
  const mediaCacheRef = useRef(mediaCache);
  mediaCacheRef.current = mediaCache;

  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = useCallback((msgId: string, base64: string, mimetype: string) => {
    setPlayingAudioId((prev) => {
      if (prev === msgId) {
        audioRef.current?.pause();
        return null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const mime = mimetype || "audio/ogg";
      const audio = new Audio(`data:${mime};base64,${base64}`);
      audio.onended = () => setPlayingAudioId(null);
      audio.onerror = () => {
        console.error("Audio playback error, trying audio/mpeg fallback");
        const fallback = new Audio(`data:audio/mpeg;base64,${base64}`);
        fallback.onended = () => setPlayingAudioId(null);
        fallback.play().catch(() => setPlayingAudioId(null));
        audioRef.current = fallback;
      };
      audio.play().catch((err) => {
        console.error("Audio play failed:", err);
        setPlayingAudioId(null);
      });
      audioRef.current = audio;
      return msgId;
    });
  }, []);

  const fetchMedia = useCallback(async (messageId: string, remoteJid: string, fromMe: boolean, autoPlay?: boolean) => {
    const cached = mediaCacheRef.current[messageId];
    if (cached?.base64 || cached?.loading) return;
    setMediaCache((prev) => ({ ...prev, [messageId]: { base64: "", mimetype: "", loading: true } }));
    try {
      const session = await getSession();
      if (!session) return;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/whatsapp-inbox?action=get-media`,
        { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ messageId, remoteJid, fromMe }) }
      );
      const data = await res.json();
      if (data.success && data.base64) {
        setMediaCache((prev) => ({ ...prev, [messageId]: { base64: data.base64, mimetype: data.mimetype || "", loading: false } }));
        if (autoPlay) {
          playAudio(messageId, data.base64, data.mimetype || "");
        }
      } else {
        console.error("get-media failed:", data);
        setMediaCache((prev) => ({ ...prev, [messageId]: { base64: "", mimetype: "", loading: false } }));
      }
    } catch (err) {
      console.error("fetchMedia error:", err);
      setMediaCache((prev) => ({ ...prev, [messageId]: { base64: "", mimetype: "", loading: false } }));
    }
  }, [getSession, playAudio]);

  const renderMessageContent = (msg: Message) => {
    const meta = msg.meta || {};

    // Audio message - WhatsApp PTT style with playback
    if (msg.type === "audio") {
      const duration = meta.seconds || 0;
      const cached = mediaCache[msg.id];
      const isPlaying = playingAudioId === msg.id;

      // Auto-fetch audio when visible
      if (!cached && selectedChat) {
        fetchMedia(msg.id, selectedChat.remoteJid, msg.fromMe);
      }

      return (
        <div className="flex items-center gap-2 min-w-[220px] py-1">
          <button
            className={`h-11 w-11 rounded-full flex-shrink-0 flex items-center justify-center transition-colors ${
              msg.fromMe ? "bg-[#005c4b]/30 hover:bg-[#005c4b]/50" : (isDark ? "bg-[#2a3942] hover:bg-[#3a4a52]" : "bg-[#e9edef] hover:bg-[#d9dfe1]")
            }`}
            onClick={() => {
              if (cached?.base64) {
                playAudio(msg.id, cached.base64, cached.mimetype);
              } else if (selectedChat) {
                fetchMedia(msg.id, selectedChat.remoteJid, msg.fromMe, true);
              }
            }}
          >
            {cached?.loading ? (
              <Loader2 className={`h-5 w-5 animate-spin ${isDark ? "text-[#8696a0]" : "text-[#54656f]"}`} />
            ) : isPlaying ? (
              <Square className={`h-4 w-4 ${isDark ? "text-[#e9edef]" : "text-[#3b4a54]"} fill-current`} />
            ) : (
              <svg viewBox="0 0 24 24" className={`h-5 w-5 ${isDark ? "text-[#e9edef]" : "text-[#3b4a54]"}`} fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-[2px] h-6">
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-[2.5px] rounded-full transition-colors ${
                    isPlaying && i < 14
                      ? "bg-[#00a884]"
                      : msg.fromMe ? (isDark ? "bg-[#8696a0]/60" : "bg-[#5db889]/60") : (isDark ? "bg-[#8696a0]/60" : "bg-[#a0a0a0]/60")
                  }`}
                  style={{ height: `${3 + Math.abs(Math.sin(i * 0.7 + 1)) * 14}px` }}
                />
              ))}
            </div>
            <span className={`text-[11px] ${isDark ? "text-[#8696a0]" : "text-[#667781]"}`}>
              {formatDuration(duration)}
            </span>
          </div>
        </div>
      );
    }

    // Image message - fetch and show real image
    if (msg.type === "image") {
      const cached = mediaCache[msg.id];

      // Auto-fetch image when visible
      if (!cached && selectedChat) {
        fetchMedia(msg.id, selectedChat.remoteJid, msg.fromMe);
      }

      return (
        <div className="max-w-[280px]">
          {cached?.base64 ? (
            <img
              src={`data:${cached.mimetype || "image/jpeg"};base64,${cached.base64}`}
              alt="Imagem"
              className="rounded-lg w-full object-cover max-h-[300px] cursor-pointer"
            />
          ) : cached?.loading ? (
            <div className={`rounded-lg w-full h-[180px] flex items-center justify-center ${msg.fromMe ? (isDark ? "bg-[#005c4b]/30" : "bg-[#c6efce]") : (isDark ? "bg-[#1d282f]" : "bg-[#f0f0f0]")}`}>
              <Loader2 className={`h-8 w-8 animate-spin ${isDark ? "text-[#8696a0]" : "text-[#a0a0a0]"}`} />
            </div>
          ) : meta.thumbnailBase64 ? (
            <img
              src={`data:image/jpeg;base64,${meta.thumbnailBase64}`}
              alt="Imagem"
              className="rounded-lg w-full object-cover max-h-[300px] opacity-60"
            />
          ) : (
            <div className={`rounded-lg w-full h-[180px] flex flex-col items-center justify-center gap-2 ${msg.fromMe ? (isDark ? "bg-[#005c4b]/30" : "bg-[#c6efce]") : (isDark ? "bg-[#1d282f]" : "bg-[#f0f0f0]")}`}>
              <Image className={`h-10 w-10 ${isDark ? "text-[#8696a0]" : "text-[#a0a0a0]"}`} />
              <span className={`text-[12px] ${isDark ? "text-[#8696a0]" : "text-[#667781]"}`}>Imagem</span>
            </div>
          )}
          {(meta.caption || msg.text) && (
            <p className="mt-1 whitespace-pre-wrap text-[14.2px]">{meta.caption || msg.text}</p>
          )}
        </div>
      );
    }

    // Video message
    if (msg.type === "video") {
      return (
        <div className="max-w-[280px]">
          {meta.thumbnailBase64 ? (
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={`data:image/jpeg;base64,${meta.thumbnailBase64}`}
                alt="Vídeo"
                className="w-full object-cover max-h-[300px]"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="h-12 w-12 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                  <Video className="h-6 w-6 text-white ml-0.5" />
                </div>
              </div>
              {meta.seconds ? (
                <span className="absolute bottom-2 left-2 text-[11px] text-white bg-black/50 rounded px-1.5 py-0.5">
                  {formatDuration(meta.seconds)}
                </span>
              ) : null}
            </div>
          ) : (
            <div className={`rounded-lg w-full h-[180px] flex flex-col items-center justify-center gap-2 ${msg.fromMe ? (isDark ? "bg-[#005c4b]/30" : "bg-[#c6efce]") : (isDark ? "bg-[#1d282f]" : "bg-[#f0f0f0]")}`}>
              <Video className={`h-10 w-10 ${isDark ? "text-[#8696a0]" : "text-[#a0a0a0]"}`} />
              <span className={`text-[12px] ${isDark ? "text-[#8696a0]" : "text-[#667781]"}`}>Vídeo{meta.seconds ? ` · ${formatDuration(meta.seconds)}` : ""}</span>
            </div>
          )}
          {(meta.caption || msg.text) && (
            <p className="mt-1 whitespace-pre-wrap text-[14.2px]">{meta.caption || msg.text}</p>
          )}
        </div>
      );
    }

    // Document message - WhatsApp style card
    if (msg.type === "document") {
      const fileName = meta.fileName || msg.text?.replace("📄 ", "") || "Documento";
      const docInfo = getDocIcon(fileName);
      return (
        <div className={`rounded-lg overflow-hidden min-w-[240px] ${msg.fromMe ? (isDark ? "bg-[#025144]" : "bg-[#c8e6c0]") : (isDark ? "bg-[#1d282f]" : "bg-[#f5f6f6]")}`}>
          <div className="flex items-center gap-3 px-3 py-3">
            <div className={`h-10 w-10 rounded-lg ${docInfo.color} flex items-center justify-center flex-shrink-0`}>
              <span className="text-[10px] font-bold text-white">{docInfo.label}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[13px] truncate font-medium ${isDark ? "text-[#e9edef]" : "text-[#111b21]"}`}>{fileName}</p>
              <p className={`text-[11px] ${isDark ? "text-[#8696a0]" : "text-[#667781]"}`}>
                {[docInfo.label, meta.fileSize ? formatFileSize(meta.fileSize) : "", meta.pageCount ? `${meta.pageCount} pág.` : ""].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Contact message - WhatsApp style
    if (msg.type === "contact") {
      const contactName = meta.contactName || msg.text?.replace("👤 ", "") || "Contato";
      const phone = meta.vcard ? extractPhoneFromVcard(meta.vcard) : "";
      const contacts = meta.contacts;
      if (contacts && contacts.length > 1) {
        return (
          <div className="min-w-[200px]">
            {contacts.map((c, i) => (
              <div key={i} className={`flex items-center gap-3 py-2 ${i > 0 ? `border-t ${isDark ? "border-[#2a3942]" : "border-[#e9edef]"}` : ""}`}>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? "bg-[#2a3942]" : "bg-[#dfe5e7]"}`}>
                  <User className={`h-5 w-5 ${isDark ? "text-[#aebac1]" : "text-[#54656f]"}`} />
                </div>
                <div>
                  <p className={`text-[14px] font-medium ${isDark ? "text-[#e9edef]" : "text-[#111b21]"}`}>{c.name}</p>
                  {c.vcard && <p className={`text-[12px] ${isDark ? "text-[#8696a0]" : "text-[#667781]"}`}>{extractPhoneFromVcard(c.vcard)}</p>}
                </div>
              </div>
            ))}
          </div>
        );
      }
      return (
        <div className="min-w-[200px]">
          <div className="flex items-center gap-3 py-1">
            <div className={`h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? "bg-[#2a3942]" : "bg-[#dfe5e7]"}`}>
              <User className={`h-6 w-6 ${isDark ? "text-[#aebac1]" : "text-[#54656f]"}`} />
            </div>
            <div>
              <p className={`text-[14.2px] font-medium ${isDark ? "text-[#e9edef]" : "text-[#111b21]"}`}>{contactName}</p>
              {phone && <p className={`text-[12px] ${isDark ? "text-[#8696a0]" : "text-[#667781]"}`}>{phone}</p>}
            </div>
          </div>
          <div className={`border-t mt-2 pt-2 text-center ${isDark ? "border-[#2a3942]" : "border-[#e9edef]"}`}>
            <span className="text-[13px] text-[#00a884] font-medium">Conversar</span>
          </div>
        </div>
      );
    }

    // Poll message - WhatsApp style
    if (msg.type === "poll") {
      const pollName = meta.pollName || msg.text?.replace("📊 ", "") || "Enquete";
      const options = meta.pollOptions || [];
      return (
        <div className="min-w-[220px] max-w-[280px]">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className={`h-4 w-4 ${isDark ? "text-[#00a884]" : "text-[#00a884]"}`} />
            <p className={`text-[14.2px] font-medium ${isDark ? "text-[#e9edef]" : "text-[#111b21]"}`}>{pollName}</p>
          </div>
          <p className={`text-[12px] mb-2 ${isDark ? "text-[#8696a0]" : "text-[#667781]"}`}>Selecione uma opção</p>
          <div className="space-y-1.5">
            {options.map((opt, i) => (
              <div
                key={i}
                className={`rounded-lg px-3 py-2 border text-[13px] ${isDark ? "border-[#2a3942] text-[#e9edef]" : "border-[#e9edef] text-[#111b21]"}`}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Location message
    if (msg.type === "location") {
      return (
        <div className="min-w-[200px]">
          <div className={`rounded-lg h-[120px] flex items-center justify-center ${msg.fromMe ? (isDark ? "bg-[#025144]" : "bg-[#c8e6c0]") : (isDark ? "bg-[#1d282f]" : "bg-[#f0f0f0]")}`}>
            <span className="text-3xl">📍</span>
          </div>
          {(meta.locationName || meta.locationAddress) && (
            <div className="mt-1.5">
              {meta.locationName && <p className={`text-[13px] font-medium ${isDark ? "text-[#e9edef]" : "text-[#111b21]"}`}>{meta.locationName}</p>}
              {meta.locationAddress && <p className={`text-[12px] ${isDark ? "text-[#8696a0]" : "text-[#667781]"}`}>{meta.locationAddress}</p>}
            </div>
          )}
        </div>
      );
    }

    // Sticker
    if (msg.type === "sticker") {
      return (
        <div className="w-[120px] h-[120px] flex items-center justify-center">
          <span className="text-5xl">🏷️</span>
        </div>
      );
    }

    // Default text message
    if (msg.text) {
      return <span className="whitespace-pre-wrap">{msg.text}</span>;
    }

    return <span className={`text-[13px] italic ${isDark ? "text-[#8696a0]" : "text-[#667781]"}`}>{mediaLabel(msg.type) || "Mensagem"}</span>;
  };

  // Group messages by date
  const groupedMessages = messages.reduce<{ date: string; msgs: Message[] }[]>((acc, msg) => {
    const d = typeof msg.timestamp === "string" ? new Date(msg.timestamp) : new Date(msg.timestamp * 1000);
    const dateStr = isNaN(d.getTime()) ? "Desconhecido" : (() => {
      const now = new Date();
      if (d.toDateString() === now.toDateString()) return "Hoje";
      const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) return "Ontem";
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    })();
    const last = acc[acc.length - 1];
    if (last && last.date === dateStr) last.msgs.push(msg);
    else acc.push({ date: dateStr, msgs: [msg] });
    return acc;
  }, []);

  return (
    <div className="h-[calc(100dvh-96px)] md:h-[calc(100vh-96px)] flex flex-col gap-2 md:gap-4">
      {/* Tutorial removed */}
      {/* WhatsApp-style layout */}
      <div className={`flex flex-1 min-h-0 rounded-none md:rounded-lg overflow-hidden shadow-xl border ${isDark ? "border-[#2a3942]" : "border-[#d1d7db]"}`}>
        
        {/* Sidebar - Chat List */}
        <div className={`w-full md:w-[380px] flex flex-col border-r ${isDark ? "bg-[#111b21] border-[#2a3942]" : "bg-white border-[#d1d7db]"} ${selectedChat ? "hidden md:flex" : "flex"} min-h-0`}>
          {/* Sidebar Header */}
          <div className={`h-14 flex items-center justify-between px-4 ${isDark ? "bg-[#202c33]" : "bg-[#f0f2f5]"}`}>
             <div className="flex items-center gap-2">
              {myPhoneJid ? (
                <ChatAvatar chat={{ remoteJid: myPhoneJid, isGroup: false }} isDark={isDark} size={10} />
              ) : (
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isDark ? "bg-[#2a3942]" : "bg-[#dfe5e7]"}`}>
                  <User className={`h-5 w-5 ${isDark ? "text-[#aebac1]" : "text-[#54656f]"}`} />
                </div>
              )}
              {newMessageAlert && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25d366] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#25d366]" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Global Bot Toggle */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleToggleAutoReply}
                      disabled={togglingAutoReply}
                      className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                        togglingAutoReply ? "opacity-50" : ""
                      } ${
                        autoReplyAll
                          ? "bg-[#00a884] text-white"
                          : isDark ? "hover:bg-[#2a3942] text-[#aebac1]" : "hover:bg-[#e9edef] text-[#54656f]"
                      }`}
                    >
                      {togglingAutoReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-5 w-5" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{autoReplyAll ? "Desativar Bot IA para todos" : "Ativar Bot IA para todos"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <button
                onClick={() => setPollingEnabled((p) => !p)}
                className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${isDark ? "hover:bg-[#2a3942]" : "hover:bg-[#e9edef]"}`}
                title={pollingEnabled ? "Desativar notificações" : "Ativar notificações"}
              >
                {pollingEnabled ? <Bell className="h-5 w-5 text-[#25d366]" /> : <BellOff className={`h-5 w-5 ${isDark ? "text-[#aebac1]" : "text-[#8696a0]"}`} />}
              </button>
              <button
                onClick={openCreateGroup}
                className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${isDark ? "hover:bg-[#2a3942]" : "hover:bg-[#e9edef]"}`}
                title="Criar grupo"
                disabled={instanceDisconnected}
              >
                <Users className={`h-5 w-5 ${isDark ? "text-[#aebac1]" : "text-[#54656f]"}`} />
              </button>
              <button
                onClick={openLeadSearch}
                className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${isDark ? "hover:bg-[#2a3942]" : "hover:bg-[#e9edef]"}`}
                title="Conversar com um lead"
                disabled={instanceDisconnected}
              >
                <UserPlus className={`h-5 w-5 ${isDark ? "text-[#aebac1]" : "text-[#54656f]"}`} />
              </button>
              <button
                onClick={() => fetchChats()}
                className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${isDark ? "hover:bg-[#2a3942]" : "hover:bg-[#e9edef]"}`}
                disabled={loadingChats}
              >
                <RefreshCw className={`h-5 w-5 ${isDark ? "text-[#aebac1]" : "text-[#54656f]"} ${loadingChats ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className={`px-2 py-1.5 ${isDark ? "bg-[#111b21]" : "bg-white"}`}>
            <div className={`relative rounded-lg flex items-center px-3 ${isDark ? "bg-[#202c33]" : "bg-[#f0f2f5]"}`}>
              <Search className={`h-4 w-4 ${isDark ? "text-[#aebac1]" : "text-[#54656f]"}`} />
              <input
                type="text"
                placeholder="Pesquisar ou começar uma nova conversa"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full bg-transparent border-none outline-none text-[13px] py-2 px-3 ${isDark ? "text-[#e9edef] placeholder-[#8696a0]" : "text-[#111b21] placeholder-[#667781]"}`}
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {loadingChats && !instanceDisconnected ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#00a884]" />
              </div>
            ) : instanceDisconnected ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="h-16 w-16 rounded-full bg-[#fee2e2] flex items-center justify-center mb-4">
                  <WifiOff className="h-8 w-8 text-[#ef4444]" />
                </div>
                <h3 className={`text-[16px] font-medium mb-1 ${isDark ? "text-[#e9edef]" : "text-[#111b21]"}`}>Instância não conectada</h3>
                <p className={`text-[13px] mb-4 ${isDark ? "text-[#8696a0]" : "text-[#667781]"}`}>
                  Conecte sua instância do WhatsApp para acessar suas conversas, enviar mensagens e usar as automações.
                </p>
                <button
                  onClick={() => navigate("/user-dashboard/whatsapp-instance")}
                  className="bg-[#00a884] hover:bg-[#008f72] text-white text-[14px] font-medium px-6 py-2.5 rounded-lg transition-colors"
                >
                  Conectar Instância
                </button>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col">
                {/* Show contacts when no chats */}
                {loadingContacts ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-[#00a884]" />
                  </div>
                ) : contacts.length > 0 ? (
                  <>
                    <div className="px-4 py-2 bg-[#f0f2f5]">
                      <p className="text-[13px] text-[#54656f] font-medium">Seus contatos ({contacts.length})</p>
                    </div>
                    <div className="px-2 py-1.5 bg-white">
                      <div className="relative bg-[#f0f2f5] rounded-lg flex items-center px-3">
                        <Search className="h-4 w-4 text-[#54656f]" />
                        <input
                          type="text"
                          placeholder="Buscar contato..."
                          value={contactSearch}
                          onChange={(e) => setContactSearch(e.target.value)}
                          className="w-full bg-transparent border-none outline-none text-[13px] text-[#111b21] placeholder-[#667781] py-2 px-3"
                        />
                      </div>
                    </div>
                    {(contactSearch.trim() ? filteredContacts : contacts).map((contact) => (
                      <button
                        key={contact.jid}
                        onClick={() => {
                          const chatFromContact: Chat = {
                            remoteJid: contact.jid,
                            name: contact.name,
                            lastMessage: "",
                            lastTimestamp: 0,
                            unreadCount: 0,
                            profilePicUrl: contact.profilePicUrl,
                          };
                          fetchMessages(chatFromContact);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-[#f5f6f6] transition-colors border-b border-[#e9edef]"
                      >
                        <div className="h-12 w-12 rounded-full bg-[#dfe5e7] flex items-center justify-center flex-shrink-0">
                          <User className="h-6 w-6 text-[#54656f]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[16px] text-[#111b21] truncate">{contact.name}</p>
                          <p className="text-[13px] text-[#667781] truncate">{formatPhone(contact.jid)}</p>
                        </div>
                        <MessageCircle className="h-5 w-5 text-[#25d366] flex-shrink-0" />
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <MessageCircle className="h-10 w-10 text-[#8696a0]/30 mb-2" />
                    <p className="text-sm text-[#667781]">Nenhuma conversa ou contato encontrado.</p>
                    <button
                      onClick={() => fetchContacts()}
                      className="mt-3 text-[#00a884] text-sm font-medium hover:underline"
                    >
                      Carregar contatos
                    </button>
                  </div>
                )}
              </div>
            ) : (
              filteredChats.map((chat) => (
                <button
                  key={chat.remoteJid}
                  onClick={() => fetchMessages(chat)}
                  className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors ${
                    isDark
                      ? `hover:bg-[#2a3942] border-b border-[#2a3942] ${selectedChat?.remoteJid === chat.remoteJid ? "bg-[#2a3942]" : ""}`
                      : `hover:bg-[#f5f6f6] border-b border-[#e9edef] ${selectedChat?.remoteJid === chat.remoteJid ? "bg-[#f0f2f5]" : ""}`
                  }`}
                >
                  <ChatAvatar chat={chat} isDark={isDark} size={12} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-[16px] truncate ${isDark ? "text-[#e9edef]" : "text-[#111b21]"}`}>{getDisplayName(chat)}</p>
                      <span className={`text-[12px] flex-shrink-0 ${chat.unreadCount > 0 ? "text-[#25d366]" : isDark ? "text-[#8696a0]" : "text-[#667781]"}`}>
                        {formatTime(chat.lastTimestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className={`text-[13px] truncate flex-1 ${isDark ? "text-[#8696a0]" : "text-[#667781]"}`}>{chat.lastMessage || formatPhone(chat.remoteJid, chat.remoteJidAlt)}</p>
                      {chat.unreadCount > 0 && (
                        <span className="ml-2 bg-[#25d366] text-white text-[11px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Messages Panel */}
        <div className={`flex-1 flex flex-col ${!selectedChat ? "hidden md:flex" : "flex"}`}
          style={{
            backgroundColor: isDark ? "#0b141a" : "#efeae2",
            backgroundImage: isDark
              ? "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5l5 10h10l-8 6 3 10-10-7-10 7 3-10-8-6h10z' fill='%23ffffff' fill-opacity='0.02'/%3E%3C/svg%3E\")"
              : "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5l5 10h10l-8 6 3 10-10-7-10 7 3-10-8-6h10z' fill='%23000000' fill-opacity='0.03'/%3E%3C/svg%3E\")",
          }}
        >
          {!selectedChat ? (
            <div className={`flex-1 flex flex-col items-center justify-center text-center ${isDark ? "bg-[#222e35]" : "bg-[#f0f2f5]"}`}>
              <div className="w-[320px]">
                {instanceDisconnected ? (
                  <>
                    <div className="h-[188px] w-[188px] mx-auto mb-6 rounded-full bg-[#fee2e2] flex items-center justify-center">
                      <WifiOff className="h-20 w-20 text-[#ef4444]" />
                    </div>
                    <h2 className={`text-[28px] font-light mb-3 ${isDark ? "text-[#e9edef]" : "text-[#41525d]"}`}>Instância desconectada</h2>
                    <p className={`text-[14px] leading-5 mb-5 ${isDark ? "text-[#8696a0]" : "text-[#667781]"}`}>
                      Para usar a caixa de entrada, conecte sua instância do WhatsApp primeiro.
                    </p>
                    <button
                      onClick={() => navigate("/user-dashboard/whatsapp-instance")}
                      className="bg-[#00a884] hover:bg-[#008f72] text-white text-[14px] font-medium px-8 py-3 rounded-lg transition-colors"
                    >
                      Conectar Instância
                    </button>
                  </>
                ) : (
                  <>
                    <div className="h-[188px] w-[188px] mx-auto mb-6 rounded-full bg-[#dfe5e7] flex items-center justify-center">
                      <MessageCircle className="h-20 w-20 text-[#8696a0]" />
                    </div>
                    <h2 className={`text-[32px] font-light mb-3 ${isDark ? "text-[#e9edef]" : "text-[#41525d]"}`}>WhatsApp Web</h2>
                    <p className={`text-[14px] leading-5 ${isDark ? "text-[#8696a0]" : "text-[#667781]"}`}>
                      Envie e receba mensagens pelo WhatsApp.<br />
                      Selecione uma conversa para começar.
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className={`h-14 flex items-center gap-3 px-4 flex-shrink-0 border-b ${isDark ? "bg-[#202c33] border-[#2a3942]" : "bg-[#f0f2f5] border-[#d1d7db]"}`}>
                <button
                  className={`h-10 w-10 rounded-full flex items-center justify-center md:hidden transition-colors ${isDark ? "hover:bg-[#2a3942]" : "hover:bg-[#e9edef]"}`}
                  onClick={() => { setSelectedChat(null); selectedChatRef.current = null; }}
                >
                  <ArrowLeft className={`h-5 w-5 ${isDark ? "text-[#aebac1]" : "text-[#54656f]"}`} />
                </button>
                <ChatAvatar chat={selectedChat} isDark={isDark} size={10} />
                <div className="flex-1 min-w-0">
                  {editingName ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={editNameInputRef}
                        type="text"
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveCustomName(selectedChat.remoteJid, editNameValue);
                          if (e.key === "Escape") setEditingName(false);
                        }}
                        onBlur={() => saveCustomName(selectedChat.remoteJid, editNameValue)}
                        className={`text-[16px] bg-transparent border-b outline-none w-full ${isDark ? "text-[#e9edef] border-[#00a884]" : "text-[#111b21] border-[#00a884]"}`}
                        autoFocus
                        maxLength={50}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group/name">
                      <p className={`text-[16px] truncate ${isDark ? "text-[#e9edef]" : "text-[#111b21]"}`}>{getDisplayName(selectedChat)}</p>
                      <button
                        onClick={() => {
                          setEditNameValue(getDisplayName(selectedChat));
                          setEditingName(true);
                          setTimeout(() => editNameInputRef.current?.focus(), 50);
                        }}
                        className={`opacity-0 group-hover/name:opacity-100 transition-opacity h-6 w-6 rounded-full flex items-center justify-center ${isDark ? "hover:bg-[#2a3942] text-[#8696a0]" : "hover:bg-[#e9edef] text-[#54656f]"}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <p className={`text-[13px] truncate ${isDark ? "text-[#8696a0]" : "text-[#667781]"}`}>{formatPhone(selectedChat.remoteJid, selectedChat.remoteJidAlt)}</p>
                </div>
                {/* Lead status badge - always show for individual chats */}
                {!selectedChat.isGroup && !selectedChat.remoteJid.endsWith("@g.us") && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {chatLeadLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#00a884]" />
                    ) : (
                      <LeadStatusBadge
                        status={chatLeadId ? chatLeadStatus : "novo"}
                        onChangeStatus={handleChatLeadStatusChange}
                        size="md"
                      />
                    )}
                  </div>
                )}
                {/* Chatbot toggle button - only for individual chats */}
                {!selectedChat.isGroup && !selectedChat.remoteJid.endsWith("@g.us") && chatbotActive !== null && chatbotConfigId && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleToggleChatbot}
                          disabled={togglingBot}
                          className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${
                            togglingBot ? "opacity-50" : ""
                          } ${
                            chatbotActive
                              ? "bg-[#00a884] text-white shadow-sm"
                              : isDark ? "hover:bg-[#2a3942] text-[#8696a0]" : "hover:bg-[#e9edef] text-[#54656f]"
                          }`}
                        >
                          {togglingBot ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-5 w-5" />}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{chatbotActive ? "Desativar Bot IA" : "Ativar Bot IA"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-2 md:px-[6%] py-2">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-[#00a884]" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-[14px] text-[#667781]">Nenhuma mensagem encontrada.</p>
                  </div>
                ) : (
                  <>
                    {groupedMessages.map((group) => (
                      <div key={group.date}>
                        {/* Date separator */}
                        <div className="flex justify-center my-3">
                          <span className={`text-[12.5px] px-3 py-1 rounded-lg shadow-sm ${isDark ? "bg-[#182229] text-[#8696a0]" : "bg-white text-[#54656f]"}`}>
                            {group.date}
                          </span>
                        </div>
                        {group.msgs.map((msg) => (
                          <div key={msg.id} className={`flex mb-[2px] group/msg relative ${msg.fromMe ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`relative max-w-[85%] md:max-w-[65%] px-2 pt-1.5 pb-1 text-[14.2px] shadow-sm cursor-pointer ${
                                msg.fromMe
                                  ? isDark ? "bg-[#005c4b] text-[#e9edef] rounded-lg rounded-tr-none" : "bg-[#d9fdd3] text-[#111b21] rounded-lg rounded-tr-none"
                                  : isDark ? "bg-[#202c33] text-[#e9edef] rounded-lg rounded-tl-none" : "bg-white text-[#111b21] rounded-lg rounded-tl-none"
                              }`}
                              style={{ wordBreak: "break-word" }}
                              onContextMenu={(e) => { e.preventDefault(); setContextMenu({ msgId: msg.id, fromMe: msg.fromMe, x: e.clientX, y: e.clientY }); }}
                            >
                              {/* WhatsApp tail */}
                              <div className={`absolute top-0 w-3 h-3 ${msg.fromMe ? "-right-2" : "-left-2"}`}>
                                <svg viewBox="0 0 8 13" width="8" height="13" className={
                                  msg.fromMe
                                    ? isDark ? "text-[#005c4b]" : "text-[#d9fdd3]"
                                    : isDark ? "text-[#202c33]" : "text-white"
                                }>
                                  {msg.fromMe ? (
                                    <path fill="currentColor" d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" />
                                  ) : (
                                    <path fill="currentColor" d="M1.533 0h5.188v11.193L.254 2.568C-.805 1.156-.237 0 1.533 0z" />
                                  )}
                                </svg>
                              </div>

                              {/* Sender name for group chats */}
                              {!msg.fromMe && selectedChat?.isGroup && msg.pushName && (
                                <p className="text-[12.5px] font-medium text-[#00a884] mb-0.5">{msg.pushName}</p>
                              )}

                              {renderMessageContent(msg)}
                              <span className="float-right ml-2 mt-1 flex items-center gap-0.5">
                                <span className={`text-[11px] ${isDark ? "text-[#ffffff99]" : "text-[#667781]"}`}>{formatTime(msg.timestamp)}</span>
                                {msg.fromMe && <CheckCheck className="h-[14px] w-[14px] text-[#53bdeb] ml-0.5" />}
                              </span>
                            </div>

                            {/* Hover action buttons */}
                            <div className={`absolute top-0 ${msg.fromMe ? "left-0 -translate-x-full pr-1" : "right-0 translate-x-full pl-1"} flex items-center gap-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity`}>
                              <button
                                onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id); }}
                                className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors ${isDark ? "hover:bg-[#2a3942] bg-[#111b21]/80" : "hover:bg-[#e9edef] bg-white/80"} shadow-sm`}
                                title="Reagir"
                              >
                                <Smile className={`h-3.5 w-3.5 ${isDark ? "text-[#aebac1]" : "text-[#54656f]"}`} />
                              </button>
                              {msg.fromMe && (
                                <button
                                  onClick={() => handleDeleteMessage(msg.id, msg.fromMe)}
                                  className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors ${isDark ? "hover:bg-[#2a3942] bg-[#111b21]/80" : "hover:bg-[#e9edef] bg-white/80"} shadow-sm`}
                                  title="Apagar mensagem"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                </button>
                              )}
                            </div>

                            {/* Emoji picker */}
                            {showEmojiPicker === msg.id && (
                              <div className={`absolute z-50 ${msg.fromMe ? "left-0" : "right-0"} -top-10 flex items-center gap-0.5 rounded-full px-2 py-1 shadow-lg ${isDark ? "bg-[#233138]" : "bg-white"}`}>
                                {EMOJI_REACTIONS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleSendReaction(msg.id, emoji, msg.fromMe)}
                                    className="text-[20px] hover:scale-125 transition-transform px-0.5"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className={`flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-2 flex-shrink-0 ${isDark ? "bg-[#202c33]" : "bg-[#f0f2f5]"}`}>
                {isRecording ? (
                  /* Recording UI */
                  <>
                    <button
                      onClick={cancelRecording}
                      className={`h-[42px] w-[42px] rounded-full flex items-center justify-center transition-colors ${isDark ? "hover:bg-[#2a3942]" : "hover:bg-[#e9edef]"}`}
                      title="Cancelar gravação"
                    >
                      <Trash2 className="h-5 w-5 text-red-400" />
                    </button>
                    <div className={`flex-1 rounded-lg flex items-center justify-center gap-3 px-3 py-2.5 ${isDark ? "bg-[#2a3942]" : "bg-white"}`}>
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                      </span>
                      <span className={`text-[15px] font-mono ${isDark ? "text-[#e9edef]" : "text-[#111b21]"}`}>{formatRecordingTime(recordingTime)}</span>
                    </div>
                    <button
                      onClick={stopRecording}
                      disabled={sendingAudio}
                      className="h-[42px] w-[42px] rounded-full bg-[#00a884] hover:bg-[#008f72] flex items-center justify-center transition-colors"
                      title="Enviar áudio"
                    >
                      {sendingAudio ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Send className="h-5 w-5 text-white" />}
                    </button>
                  </>
                ) : (
                  /* Normal message input */
                  <>
                    <div className={`hidden md:flex h-[42px] w-[42px] rounded-full items-center justify-center transition-colors cursor-pointer ${isDark ? "hover:bg-[#2a3942]" : "hover:bg-[#e9edef]"}`}>
                      <Smile className={`h-6 w-6 ${isDark ? "text-[#aebac1]" : "text-[#54656f]"}`} />
                    </div>

                    {/* Attachment button */}
                    <div className="relative">
                      <button
                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                        className={`h-[42px] w-[42px] rounded-full flex items-center justify-center transition-colors ${showAttachMenu ? (isDark ? "bg-[#2a3942]" : "bg-[#e9edef]") : ""} ${isDark ? "hover:bg-[#2a3942]" : "hover:bg-[#e9edef]"}`}
                        title="Anexar"
                      >
                        <Paperclip className={`h-6 w-6 ${isDark ? "text-[#aebac1]" : "text-[#54656f]"} ${showAttachMenu ? "rotate-45" : ""} transition-transform`} />
                      </button>

                      {showAttachMenu && (
                        <div className={`absolute bottom-14 left-0 rounded-xl shadow-xl py-2 min-w-[180px] z-50 ${isDark ? "bg-[#233138]" : "bg-white"} border ${isDark ? "border-[#2a3942]" : "border-[#e9edef]"}`}>
                          <button
                            onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-[14px] transition-colors ${isDark ? "text-[#e9edef] hover:bg-[#2a3942]" : "text-[#111b21] hover:bg-[#f0f2f5]"}`}
                          >
                            <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center"><Image className="h-4 w-4 text-purple-500" /></div>
                            Imagem / Vídeo
                          </button>
                          <button
                            onClick={() => { docInputRef.current?.click(); setShowAttachMenu(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-[14px] transition-colors ${isDark ? "text-[#e9edef] hover:bg-[#2a3942]" : "text-[#111b21] hover:bg-[#f0f2f5]"}`}
                          >
                            <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center"><File className="h-4 w-4 text-blue-500" /></div>
                            Documento
                          </button>
                          <button
                            onClick={() => { setShowContactDialog(true); setShowAttachMenu(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-[14px] transition-colors ${isDark ? "text-[#e9edef] hover:bg-[#2a3942]" : "text-[#111b21] hover:bg-[#f0f2f5]"}`}
                          >
                            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center"><Contact className="h-4 w-4 text-emerald-500" /></div>
                            Contato
                          </button>
                          <button
                            onClick={() => { setShowPollDialog(true); setShowAttachMenu(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-[14px] transition-colors ${isDark ? "text-[#e9edef] hover:bg-[#2a3942]" : "text-[#111b21] hover:bg-[#f0f2f5]"}`}
                          >
                            <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center"><BarChart3 className="h-4 w-4 text-orange-500" /></div>
                            Enquete
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Hidden file inputs */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const isVideo = file.type.startsWith("video/");
                          handleSendMedia(file, isVideo ? "video" : "image");
                        }
                        e.target.value = "";
                      }}
                    />
                    <input
                      ref={docInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSendDocument(file);
                        e.target.value = "";
                      }}
                    />

                    <div className={`flex-1 rounded-lg flex items-center px-3 border ${isDark ? "bg-[#2a3942] border-transparent" : "bg-white border-[#e9edef]"}`}>
                      <input
                        type="text"
                        placeholder="Digite uma mensagem"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                        disabled={sending || sendingMedia}
                        className={`w-full bg-transparent border-none outline-none text-[15px] py-2.5 ${isDark ? "text-[#e9edef] placeholder-[#8696a0]" : "text-[#3b4a54] placeholder-[#667781]"}`}
                      />
                    </div>
                    {sendingMedia ? (
                      <div className={`h-[42px] w-[42px] rounded-full flex items-center justify-center`}>
                        <Loader2 className={`h-6 w-6 animate-spin ${isDark ? "text-[#aebac1]" : "text-[#54656f]"}`} />
                      </div>
                    ) : newMessage.trim() ? (
                      <button
                        onClick={handleSend}
                        disabled={sending}
                        className={`h-[42px] w-[42px] rounded-full flex items-center justify-center transition-colors disabled:opacity-50 ${isDark ? "hover:bg-[#2a3942]" : "hover:bg-[#e9edef]"}`}
                      >
                        {sending ? <Loader2 className={`h-6 w-6 animate-spin ${isDark ? "text-[#aebac1]" : "text-[#54656f]"}`} /> : <Send className={`h-6 w-6 ${isDark ? "text-[#aebac1]" : "text-[#54656f]"}`} />}
                      </button>
                    ) : (
                      <button
                        onClick={startRecording}
                        className={`h-[42px] w-[42px] rounded-full flex items-center justify-center transition-colors ${isDark ? "hover:bg-[#2a3942]" : "hover:bg-[#e9edef]"}`}
                        title="Gravar áudio"
                      >
                        <Mic className={`h-6 w-6 ${isDark ? "text-[#aebac1]" : "text-[#54656f]"}`} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
    </div>

    {/* Create Group Dialog */}
    <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden" style={{ backgroundColor: "#f0f2f5" }}>
        <DialogHeader className="px-4 py-3 bg-[#00a884] text-white flex-shrink-0">
          <DialogTitle className="text-white text-[17px] font-normal">Novo grupo</DialogTitle>
        </DialogHeader>

        {/* Group Info */}
        <div className="px-4 py-4 bg-white space-y-3 flex-shrink-0">
          <input
            type="text"
            placeholder="Nome do grupo"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full bg-transparent border-b-2 border-[#00a884] outline-none text-[16px] text-[#111b21] placeholder-[#667781] py-2"
          />
          <input
            type="text"
            placeholder="Descrição do grupo (opcional)"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            className="w-full bg-transparent border-b border-[#e9edef] outline-none text-[14px] text-[#111b21] placeholder-[#667781] py-2"
          />
        </div>

        {/* Selected Participants */}
        {selectedParticipants.length > 0 && (
          <div className="px-4 py-2 bg-white border-t border-[#e9edef] flex-shrink-0">
            <p className="text-[12px] text-[#00a884] font-medium mb-2">
              {selectedParticipants.length} participante{selectedParticipants.length > 1 ? "s" : ""} selecionado{selectedParticipants.length > 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {selectedParticipants.map((jid) => {
                const contact = contacts.find((c) => c.jid === jid);
                return (
                  <span
                    key={jid}
                    className="inline-flex items-center gap-1 bg-[#e7f8f0] text-[#111b21] text-[12px] rounded-full pl-2.5 pr-1 py-1 cursor-pointer hover:bg-[#d1f0e2]"
                    onClick={() => toggleParticipant(jid)}
                  >
                    {contact?.name || formatPhone(jid)}
                    <X className="h-3 w-3 text-[#667781]" />
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Search Contacts */}
        <div className="px-4 py-2 bg-white border-t border-[#e9edef] flex-shrink-0">
          <div className="relative bg-[#f0f2f5] rounded-lg flex items-center px-3">
            <Search className="h-4 w-4 text-[#54656f]" />
            <input
              type="text"
              placeholder="Pesquisar contatos"
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-[13px] text-[#111b21] placeholder-[#667781] py-2 px-3"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto bg-white min-h-0">
          {loadingContacts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#00a884]" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <p className="text-sm text-[#667781]">Nenhum contato encontrado.</p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <button
                key={contact.jid}
                onClick={() => toggleParticipant(contact.jid)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#f5f6f6] transition-colors border-b border-[#e9edef] ${
                  selectedParticipants.includes(contact.jid) ? "bg-[#e7f8f0]" : ""
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-[#dfe5e7] flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-[#54656f]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] text-[#111b21] truncate">{contact.name}</p>
                  <p className="text-[12px] text-[#667781] truncate">{formatPhone(contact.jid)}</p>
                </div>
                {selectedParticipants.includes(contact.jid) && (
                  <div className="h-5 w-5 rounded-full bg-[#00a884] flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Create Button */}
        <div className="px-4 py-3 bg-white border-t border-[#e9edef] flex-shrink-0">
          <button
            onClick={handleCreateGroup}
            disabled={creatingGroup || !groupName.trim() || selectedParticipants.length === 0}
            className="w-full bg-[#00a884] hover:bg-[#008f72] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[15px] font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {creatingGroup ? <Loader2 className="h-5 w-5 animate-spin" /> : <Users className="h-5 w-5" />}
            {creatingGroup ? "Criando..." : "Criar Grupo"}
          </button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Lead Search Dialog */}
    <Dialog open={showLeadSearch} onOpenChange={setShowLeadSearch}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden" style={{ backgroundColor: "#f0f2f5" }}>
        <DialogHeader className="px-4 py-3 bg-[#00a884] text-white flex-shrink-0">
          <DialogTitle className="text-white text-[17px] font-normal">Conversar com Lead</DialogTitle>
          <DialogDescription className="text-white/80 text-[13px]">Selecione um lead para iniciar uma conversa</DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="px-4 py-2 bg-white flex-shrink-0">
          <div className="relative bg-[#f0f2f5] rounded-lg flex items-center px-3">
            <Search className="h-4 w-4 text-[#54656f]" />
            <input
              type="text"
              placeholder="Buscar lead por nome ou telefone..."
              value={leadSearchQuery}
              onChange={(e) => setLeadSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-[13px] text-[#111b21] placeholder-[#667781] py-2 px-3"
            />
          </div>
        </div>

        {/* Lead List */}
        <div className="flex-1 overflow-y-auto bg-white min-h-0">
          {loadingLeads ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#00a884]" />
            </div>
          ) : (() => {
            const q = leadSearchQuery.toLowerCase();
            const filtered = leadsWithPhone.filter((l) =>
              l.name.toLowerCase().includes(q) || l.phone.includes(q)
            );
            return filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <UserPlus className="h-10 w-10 text-[#8696a0]/30 mb-2" />
                <p className="text-sm text-[#667781]">
                  {leadsWithPhone.length === 0 ? "Nenhum lead com telefone encontrado." : "Nenhum lead corresponde à busca."}
                </p>
              </div>
            ) : (
              filtered.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => startChatWithLead(lead.phone, lead.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#f5f6f6] transition-colors border-b border-[#e9edef]"
                >
                  <div className="h-11 w-11 rounded-full bg-[#dfe5e7] flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-[#54656f]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] text-[#111b21] truncate">{lead.name}</p>
                    <p className="text-[12px] text-[#667781] truncate">{lead.phone}</p>
                  </div>
                  {lead.category && (
                    <span className="text-[10px] bg-[#e7f8f0] text-[#00a884] rounded-full px-2 py-0.5 flex-shrink-0">{lead.category}</span>
                  )}
                  <MessageCircle className="h-5 w-5 text-[#25d366] flex-shrink-0" />
                </button>
              ))
            );
          })()}
        </div>
      </DialogContent>
    </Dialog>

    {/* Send Contact Dialog */}
    <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden" style={{ backgroundColor: isDark ? "#111b21" : "#f0f2f5" }}>
        <DialogHeader className="px-4 py-3 bg-[#00a884] text-white flex-shrink-0">
          <DialogTitle className="text-white text-[17px] font-normal">Enviar Contato</DialogTitle>
          <DialogDescription className="text-white/80 text-[13px]">Preencha os dados do contato para enviar como vCard</DialogDescription>
        </DialogHeader>
        <div className="px-4 py-4 space-y-3" style={{ backgroundColor: isDark ? "#111b21" : "white" }}>
          <input
            type="text"
            placeholder="Nome do contato"
            value={contactNameToSend}
            onChange={(e) => setContactNameToSend(e.target.value)}
            className={`w-full bg-transparent border-b-2 border-[#00a884] outline-none text-[15px] py-2 ${isDark ? "text-[#e9edef] placeholder-[#8696a0]" : "text-[#111b21] placeholder-[#667781]"}`}
          />
          <input
            type="text"
            placeholder="Telefone (ex: 5527999999999)"
            value={contactPhoneToSend}
            onChange={(e) => setContactPhoneToSend(e.target.value)}
            className={`w-full bg-transparent border-b border-[#e9edef] outline-none text-[15px] py-2 ${isDark ? "text-[#e9edef] placeholder-[#8696a0]" : "text-[#111b21] placeholder-[#667781]"}`}
          />
          <Button
            onClick={handleSendContact}
            disabled={sendingContact || !contactNameToSend.trim() || !contactPhoneToSend.trim()}
            className="w-full bg-[#00a884] hover:bg-[#008f72] text-white"
          >
            {sendingContact ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Contact className="h-4 w-4 mr-2" />}
            Enviar Contato
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Poll Dialog */}
    <Dialog open={showPollDialog} onOpenChange={setShowPollDialog}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden" style={{ backgroundColor: isDark ? "#111b21" : "#f0f2f5" }}>
        <DialogHeader className="px-4 py-3 bg-[#00a884] text-white flex-shrink-0">
          <DialogTitle className="text-white text-[17px] font-normal">Criar Enquete</DialogTitle>
          <DialogDescription className="text-white/80 text-[13px]">Crie uma enquete para enviar no chat</DialogDescription>
        </DialogHeader>
        <div className="px-4 py-4 space-y-3 max-h-[60vh] overflow-y-auto" style={{ backgroundColor: isDark ? "#111b21" : "white" }}>
          <input
            type="text"
            placeholder="Pergunta da enquete"
            value={pollName}
            onChange={(e) => setPollName(e.target.value)}
            className={`w-full bg-transparent border-b-2 border-[#00a884] outline-none text-[15px] py-2 ${isDark ? "text-[#e9edef] placeholder-[#8696a0]" : "text-[#111b21] placeholder-[#667781]"}`}
          />
          <div className="space-y-2">
            <p className={`text-[12px] font-medium ${isDark ? "text-[#8696a0]" : "text-[#667781]"}`}>Opções:</p>
            {pollOptions.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Opção ${idx + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...pollOptions];
                    newOpts[idx] = e.target.value;
                    setPollOptions(newOpts);
                  }}
                  className={`flex-1 bg-transparent border-b outline-none text-[14px] py-1.5 ${isDark ? "text-[#e9edef] placeholder-[#8696a0] border-[#2a3942]" : "text-[#111b21] placeholder-[#667781] border-[#e9edef]"}`}
                />
                {pollOptions.length > 2 && (
                  <button onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {pollOptions.length < 12 && (
              <button
                onClick={() => setPollOptions([...pollOptions, ""])}
                className="flex items-center gap-1 text-[13px] text-[#00a884] hover:text-[#008f72] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar opção
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className={`text-[12px] ${isDark ? "text-[#8696a0]" : "text-[#667781]"}`}>Seleções permitidas:</p>
            <select
              value={pollSelectableCount}
              onChange={(e) => setPollSelectableCount(Number(e.target.value))}
              className={`border rounded px-2 py-1 text-[13px] ${isDark ? "bg-[#2a3942] border-[#2a3942] text-[#e9edef]" : "bg-white border-[#e9edef] text-[#111b21]"}`}
            >
              {Array.from({ length: Math.min(pollOptions.length, 12) }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>
          <Button
            onClick={handleSendPoll}
            disabled={sendingPoll || !pollName.trim() || pollOptions.filter((o) => o.trim()).length < 2}
            className="w-full bg-[#00a884] hover:bg-[#008f72] text-white"
          >
            {sendingPoll ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}
            Enviar Enquete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
  );
};

export default UserWhatsAppInbox;

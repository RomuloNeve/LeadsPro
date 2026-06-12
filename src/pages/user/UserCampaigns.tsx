import { useState, useEffect, useRef } from "react";
import { useUserData } from "@/hooks/useUserData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Megaphone, Plus, Send, Clock, CheckCircle2, FileText, Loader2, Trash2, Users, MessageCircle, ImagePlus, X, Image, Sparkles, Smartphone, AlertTriangle, ShieldAlert, XCircle, ChevronDown, ChevronUp, Pencil, Play, Mic, Volume2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageTutorial } from "@/components/PageTutorial";
import AudioRecorder from "@/components/AudioRecorder";
import { Progress } from "@/components/ui/progress";

interface Campaign {
  id: string;
  license_id: string;
  name: string;
  message_template: string;
  status: string;
  target_filter: Record<string, unknown> | null;
  total_leads: number;
  sent_count: number;
  created_at: string;
  image_url: string | null;
  campaign_type?: string;
  group_ids?: string[] | null;
  group_sent_phones?: string[] | null;
  image_urls?: string[] | null;
  audio_urls?: string[] | null;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  draft: { label: "Rascunho", icon: <FileText className="h-3 w-3" />, color: "bg-muted text-muted-foreground" },
  partial: { label: "Parcial", icon: <Clock className="h-3 w-3" />, color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  scheduled: { label: "Agendado", icon: <Clock className="h-3 w-3" />, color: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400" },
  sent: { label: "Enviado", icon: <CheckCircle2 className="h-3 w-3" />, color: "bg-green-500/15 text-green-600 dark:text-green-400" },
};

const UserCampaigns = () => {
  const { license, leads } = useUserData();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [template, setTemplate] = useState("");
  const [filterMode, setFilterMode] = useState<"category" | "list" | "expired_users">("category");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [withImage, setWithImage] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [improving, setImproving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [withAudio, setWithAudio] = useState(false);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [audioNames, setAudioNames] = useState<string[]>([]);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [failedLeads, setFailedLeads] = useState<Array<{ name: string | null; phone: string | null; reason: string }>>([]);
  const [showFailedDialog, setShowFailedDialog] = useState(false);
  const [batchSize, setBatchSize] = useState("20");
  const cancelRef = useRef(false);

  // Edit campaign state
  const [editOpen, setEditOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editName, setEditName] = useState("");
  const [editTemplate, setEditTemplate] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Group messaging state
  const [groupOpen, setGroupOpen] = useState(false);
  const [groups, setGroups] = useState<Array<{ id: string; subject: string; size: number }>>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [groupMessage, setGroupMessage] = useState("");
  const [groupWithImage, setGroupWithImage] = useState(false);
  const [groupImageFiles, setGroupImageFiles] = useState<File[]>([]);
  const [groupImagePreviews, setGroupImagePreviews] = useState<string[]>([]);
  const groupFileInputRef = useRef<HTMLInputElement>(null);
  const [groupWithAudio, setGroupWithAudio] = useState(false);
  const [groupAudioFiles, setGroupAudioFiles] = useState<File[]>([]);
  const [groupAudioNames, setGroupAudioNames] = useState<string[]>([]);
  const groupAudioInputRef = useRef<HTMLInputElement>(null);
  const [sendingGroups, setSendingGroups] = useState(false);
  const [improvingGroup, setImprovingGroup] = useState(false);
  const [groupBatchSize, setGroupBatchSize] = useState("20");
  const [groupSendingProgress, setGroupSendingProgress] = useState<string | null>(null);
  const [showGroupBatchDialog, setShowGroupBatchDialog] = useState(false);
  const groupCancelRef = useRef(false);
  const [groupSentPhones, setGroupSentPhones] = useState<string[]>([]);
  const [groupFailedList, setGroupFailedList] = useState<Array<{ phone: string; reason: string }>>([]);
  const [showGroupFailedDialog, setShowGroupFailedDialog] = useState(false);

  const categories = Array.from(new Set(leads.map((l) => l.category).filter(Boolean))) as string[];

  // Lead lists state
  const [leadLists, setLeadLists] = useState<Array<{ id: string; name: string; color: string; lead_count: number }>>([]);
  const [listFilter, setListFilter] = useState("all");
  const [listLeadIds, setListLeadIds] = useState<Set<string>>(new Set());
  const [expiredUsersCount, setExpiredUsersCount] = useState(0);

  useEffect(() => {
    const fetchLists = async () => {
      if (!license?.id) return;
      const { data: lists } = await supabase
        .from("lead_lists")
        .select("id, name, color")
        .eq("license_id", license.id);
      if (!lists) return;
      // Get counts for each list
      const listsWithCount = await Promise.all(
        lists.map(async (list) => {
          const { count } = await supabase
            .from("lead_list_items")
            .select("*", { count: "exact", head: true })
            .eq("list_id", list.id);
          return { ...list, lead_count: count || 0 };
        })
      );
      setLeadLists(listsWithCount);
    };
    fetchLists();
  }, [license?.id]);

  // Fetch expired users count (only for Floriano)
  const FLORIANO_ID = "fb82d9ab-3cfb-492d-b96e-32cd0fcfd94b";
  const isFlorianoUser = license?.assigned_to === FLORIANO_ID;
  
  useEffect(() => {
    const fetchExpiredCount = async () => {
      if (!license?.id || !isFlorianoUser) {
        console.log("[ExpiredCount] Skipped - license:", license?.id, "assigned_to:", license?.assigned_to, "isFlorianoUser:", isFlorianoUser);
        return;
      }
      console.log("[ExpiredCount] Fetching expired users count...");
      try {
        const { data, error } = await supabase.functions.invoke("admin-test-send", {
          body: { type: "bulk-whatsapp", planFilter: "expirados", dryRun: true },
        });
        console.log("[ExpiredCount] Response:", JSON.stringify(data), "Error:", error);
        if (!error && data?.totalUsers) {
          setExpiredUsersCount(data.totalUsers);
        }
      } catch (e) { console.error("[ExpiredCount] Exception:", e); }
    };
    fetchExpiredCount();
  }, [license?.id, isFlorianoUser]);

  // Fetch lead IDs when a list is selected
  useEffect(() => {
    const fetchListLeads = async () => {
      if (listFilter === "all") {
        setListLeadIds(new Set());
        return;
      }
      const { data } = await supabase
        .from("lead_list_items")
        .select("lead_id")
        .eq("list_id", listFilter);
      setListLeadIds(new Set((data || []).map((r) => r.lead_id)));
    };
    fetchListLeads();
  }, [listFilter]);

  const fetchCampaigns = async () => {
    if (!license?.id) return;
    const { data } = await supabase
      .from("campaigns")
      .select("*")
      .eq("license_id", license.id)
      .order("created_at", { ascending: false });
    setCampaigns((data as Campaign[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, [license?.id]);

  const uniqueLeads = leads.filter((l) => !l.is_duplicate);
  const targetLeads = filterMode === "expired_users"
    ? [] // expired users are fetched server-side, not from local leads
    : uniqueLeads.filter((l) => {
        if (categoryFilter !== "all" && l.category !== categoryFilter) return false;
        if (listFilter !== "all" && !listLeadIds.has(l.id)) return false;
        return true;
      });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Apenas imagens são permitidas", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem deve ter no máximo 5MB", variant: "destructive" });
      return;
    }
    if (imageFiles.length >= 3) {
      toast({ title: "Máximo de 3 imagens", variant: "destructive" });
      return;
    }
    setImageFiles((prev) => [...prev, file]);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreviews((prev) => [...prev, reader.result as string]);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImageAt = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeAllImages = () => {
    setImageFiles([]);
    setImagePreviews([]);
    setWithImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast({ title: "Apenas áudios são permitidos", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Áudio deve ter no máximo 10MB", variant: "destructive" });
      return;
    }
    if (audioFiles.length >= 3) {
      toast({ title: "Máximo de 3 áudios", variant: "destructive" });
      return;
    }
    setAudioFiles((prev) => [...prev, file]);
    setAudioNames((prev) => [...prev, file.name]);
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  const removeAudioAt = (index: number) => {
    setAudioFiles((prev) => prev.filter((_, i) => i !== index));
    setAudioNames((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAudios = async (): Promise<string[]> => {
    if (audioFiles.length === 0) return [];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const urls: string[] = [];
    for (const file of audioFiles) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/audio-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
      const { error } = await supabase.storage.from("campaign-images").upload(path, file, { upsert: true });
      if (error) {
        toast({ title: "Erro no upload do áudio", description: error.message, variant: "destructive" });
        continue;
      }
      const { data: urlData } = supabase.storage.from("campaign-images").getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return []; }
    const urls: string[] = [];
    for (const file of imageFiles) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
      const { error } = await supabase.storage.from("campaign-images").upload(path, file, { upsert: true });
      if (error) {
        toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
        continue;
      }
      const { data: urlData } = supabase.storage.from("campaign-images").getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    setUploading(false);
    return urls;
  };

  const handleCreate = async () => {
    if (!license?.id || !name.trim() || !template.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setSaving(true);
    const imageUrls = withImage ? await uploadImages() : [];
    const audioUrls = withAudio ? await uploadAudios() : [];
    const filter: Record<string, any> = {};
    if (filterMode === "expired_users") {
      filter.expired_users = true;
    } else {
      if (categoryFilter !== "all") filter.category = categoryFilter;
      if (listFilter !== "all") filter.list_id = listFilter;
    }
    const targetFilter = Object.keys(filter).length > 0 ? filter : null;
    const totalCount = filterMode === "expired_users" ? expiredUsersCount : targetLeads.length;
    const { error } = await supabase.from("campaigns").insert({
      license_id: license.id,
      name: name.trim(),
      message_template: template.trim(),
      target_filter: targetFilter,
      total_leads: totalCount,
      image_url: imageUrls.length > 0 ? imageUrls[0] : null,
      image_urls: imageUrls.length > 0 ? imageUrls : null,
      audio_urls: audioUrls.length > 0 ? audioUrls : null,
    } as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Campanha criada!" });
      setName(""); setTemplate(""); setCategoryFilter("all"); setListFilter("all"); setFilterMode("category"); setWithImage(false); setWithAudio(false);
      removeAllImages();
      setAudioFiles([]); setAudioNames([]);
      setOpen(false);
      fetchCampaigns();
    }
    setSaving(false);
  };

  const openEditDialog = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setEditName(campaign.name);
    setEditTemplate(campaign.message_template);
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingCampaign || !editName.trim() || !editTemplate.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setEditSaving(true);
    const { error } = await supabase.from("campaigns").update({
      name: editName.trim(),
      message_template: editTemplate.trim(),
    }).eq("id", editingCampaign.id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Campanha atualizada!" });
      setEditOpen(false);
      setEditingCampaign(null);
      fetchCampaigns();
    }
    setEditSaving(false);
  };

  const [scheduling, setScheduling] = useState<string | null>(null);
  const [hasEvolutionInstance, setHasEvolutionInstance] = useState(false);
  const [dailySent, setDailySent] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(150);
  const [isWarmup, setIsWarmup] = useState(false);
  const [warmupDay, setWarmupDay] = useState(0);

  useEffect(() => {
    const checkInstance = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/whatsapp-instance?action=status`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await res.json();
        setHasEvolutionInstance(data.status === "connected");

        // Calculate warm-up from instance age
        const { data: inst } = await supabase
          .from("whatsapp_instances")
          .select("created_at")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (inst?.created_at) {
          const created = new Date(inst.created_at);
          const now = new Date();
          const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          setWarmupDay(days);
          let limit = 150;
          if (days <= 3) { limit = 30; setIsWarmup(true); }
          else if (days <= 7) { limit = 60; setIsWarmup(true); }
          else if (days <= 14) { limit = 100; setIsWarmup(true); }
          else { setIsWarmup(false); }
          setDailyLimit(limit);
        }
      } catch { /* ignore */ }
    };
    checkInstance();
  }, []);

  // Fetch how many messages were sent today (daily quota)
  useEffect(() => {
    const fetchDailyCount = async () => {
      if (!license?.id) return;
      try {
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        // Get campaigns of this license
        const { data: camps } = await supabase
          .from("campaigns")
          .select("id")
          .eq("license_id", license.id);
        if (!camps || camps.length === 0) {
          setDailySent(0);
          return;
        }
        const { count } = await supabase
          .from("campaign_sent_leads")
          .select("*", { count: "exact", head: true })
          .eq("status", "sent")
          .gte("created_at", todayStart.toISOString())
          .in("campaign_id", camps.map((c) => c.id));
        setDailySent(count || 0);
      } catch { /* ignore */ }
    };
    fetchDailyCount();
  }, [license?.id]);

  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const openBatchDialog = (id: string) => {
    setSelectedCampaignId(id);
    setBatchSize("20");
    setShowBatchDialog(true);
  };

  const [sendingProgress, setSendingProgress] = useState<string | null>(null);

  const handleSchedule = async (id: string, testMode = false) => {
    setShowBatchDialog(false);
    setScheduling(id);
    cancelRef.current = false;
    const size = batchSize === "all" ? 0 : parseInt(batchSize);
    let totalSentAcrossLoops = 0;
    let totalErrorsAcrossLoops = 0;
    const allFailedLeads: Array<{ name: string | null; phone: string | null; reason: string }> = [];
    let loopCount = 0;

    try {
      while (true) {
        if (cancelRef.current) {
          toast({ title: "🛑 Disparo cancelado", description: `${totalSentAcrossLoops} mensagens foram enviadas antes do cancelamento.` });
          break;
        }

        loopCount++;
        setSendingProgress(`Enviando lote ${loopCount}... (${totalSentAcrossLoops} enviados)`);

        const { data, error } = await supabase.functions.invoke("trigger-campaign", {
          body: { campaign_id: id, test_mode: testMode, batch_size: testMode ? 0 : size },
        });

        // Handle errors - supabase SDK puts non-2xx responses in error
        let responseData = data;
        if (error) {
          // Try to extract JSON body from FunctionsHttpError
          try {
            const ctx = (error as any).context;
            if (ctx && typeof ctx.json === "function") {
              responseData = await ctx.json();
            } else if (error.message) {
              try { responseData = JSON.parse(error.message); } catch {}
            }
          } catch {}

          if (!responseData || !responseData.code) {
            toast({ title: "Erro no envio", description: responseData?.error || error.message, variant: "destructive" });
            break;
          }
        }

        // === Anti-ban error handling ===
        if (responseData?.code === "DAILY_LIMIT_REACHED") {
          toast({
            title: "Limite diário atingido",
            description: responseData.error || `Você já enviou ${responseData.daily_sent} mensagens hoje. Limite: ${responseData.daily_limit}/dia.`,
            variant: "destructive",
          });
          if (typeof responseData.daily_limit === "number") setDailyLimit(responseData.daily_limit);
          break;
        }
        if (responseData?.code === "OUTSIDE_SAFE_HOURS") {
          toast({
            title: "Fora do horário seguro",
            description: responseData.error || "Disparos só são permitidos entre 8h e 21h para proteger seu número.",
            variant: "destructive",
          });
          break;
        }
        if (responseData?.error && !responseData?.success) {
          toast({ title: "Erro no envio", description: responseData.error, variant: "destructive" });
          break;
        }

        totalSentAcrossLoops += responseData.leads_count || 0;
        totalErrorsAcrossLoops += responseData.errors || 0;
        if (responseData.failed_leads?.length > 0) {
          allFailedLeads.push(...responseData.failed_leads);
        }
        // Update daily counter from backend
        if (typeof responseData.daily_sent === "number") {
          setDailySent(responseData.daily_sent);
        }

        // Warn on the FIRST loop that the AI fallback kicked in. Without
        // this, the user thinks anti-ban variation worked when in fact
        // every lead got the same raw template.
        if (responseData.variation_warning && loopCount === 1) {
          toast({
            title: "⚠️ Variação por IA indisponível",
            description: responseData.variation_warning,
            variant: "destructive",
          });
        }

        if (responseData.all_sent || !responseData.has_more || testMode) {
          if (responseData.all_sent) {
            toast({
              title: "✅ Todos os leads foram enviados!",
              description: `${responseData.total_sent} leads enviados com sucesso.${totalErrorsAcrossLoops > 0 ? ` (${totalErrorsAcrossLoops} erros)` : ""}`,
            });
          } else {
            toast({
              title: testMode ? "🧪 Teste enviado!" : "📱 Lote enviado!",
              description: `${totalSentAcrossLoops} enviados. ${responseData.remaining > 0 ? `Restam ${responseData.remaining} leads.` : ""}${totalErrorsAcrossLoops > 0 ? ` (${totalErrorsAcrossLoops} erros)` : ""}`,
            });
          }
          break;
        }

        // Anti-ban: delay between each message (60-180s with 30% chance of extra 10-30s)
        const baseDelay = 60 + Math.floor(Math.random() * 121); // 60-180s
        const extraPause = Math.random() < 0.3 ? (10 + Math.floor(Math.random() * 21)) : 0;
        const pauseSeconds = baseDelay + extraPause;
        for (let s = pauseSeconds; s > 0; s--) {
          if (cancelRef.current) break;
          const mins = Math.floor(s / 60);
          const secs = s % 60;
          setSendingProgress(`⏳ Anti-ban: aguardando ${mins > 0 ? `${mins}m` : ""}${secs}s... (${totalSentAcrossLoops} enviados)`);
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      if (allFailedLeads.length > 0) {
        setFailedLeads(allFailedLeads);
        setShowFailedDialog(true);
      }
      fetchCampaigns();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
    setScheduling(null);
    setSendingProgress(null);
  };

  const handleCancelDispatch = () => {
    cancelRef.current = true;
    setSendingProgress("Cancelando...");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Excluir esta campanha?")) return;
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Campanha excluída!" });
      fetchCampaigns();
    }
  };

  const getProgressPercent = (campaign: Campaign) => {
    if (campaign.total_leads === 0) return 0;
    return Math.min(100, Math.round((campaign.sent_count / campaign.total_leads) * 100));
  };

  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/whatsapp-instance?action=groups`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        setGroups(data);
      } else {
        toast({ title: "Erro ao buscar grupos", description: data?.error || "Erro desconhecido", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
    setLoadingGroups(false);
  };

  const openGroupDialog = () => {
    setGroupOpen(true);
    setSelectedGroups([]);
    setGroupMessage("");
    setGroupWithImage(false);
    setGroupImageFiles([]);
    setGroupImagePreviews([]);
    setGroupWithAudio(false);
    setGroupAudioFiles([]);
    setGroupAudioNames([]);
    setGroupSentPhones([]);
    fetchGroups();
  };

  const handleCreateGroupCampaign = async () => {
    if (!license?.id || !selectedGroups.length || !groupMessage.trim()) {
      toast({ title: "Selecione grupos e escreva uma mensagem", variant: "destructive" });
      return;
    }
    setSaving(true);
    const imageUrls = groupWithImage ? await uploadGroupImages() : [];
    const audioUrls = groupWithAudio ? await uploadGroupAudios() : [];
    const totalParticipants = selectedGroups.reduce((sum, id) => sum + (groups.find(g => g.id === id)?.size || 0), 0);
    const groupNames = selectedGroups.map(id => groups.find(g => g.id === id)?.subject || "Grupo").join(", ");
    // Collect phones already sent in previous campaigns for these same groups
    const { data: prevCampaigns } = await supabase
      .from("campaigns")
      .select("group_sent_phones, group_ids")
      .eq("license_id", license.id)
      .eq("campaign_type", "group");

    const alreadySent = new Set<string>();
    if (prevCampaigns) {
      for (const pc of prevCampaigns) {
        const pcGroupIds = (pc.group_ids as string[]) || [];
        const hasOverlap = pcGroupIds.some((gid: string) => selectedGroups.includes(gid));
        if (hasOverlap && pc.group_sent_phones) {
          for (const phone of (pc.group_sent_phones as string[])) {
            alreadySent.add(phone);
          }
        }
      }
    }

    const { error } = await supabase.from("campaigns").insert({
      license_id: license.id,
      name: groupNames.length > 80 ? groupNames.slice(0, 77) + "..." : groupNames,
      message_template: groupMessage.trim(),
      campaign_type: "group",
      group_ids: selectedGroups,
      total_leads: totalParticipants,
      image_url: imageUrls.length > 0 ? imageUrls[0] : null,
      image_urls: imageUrls.length > 0 ? imageUrls : null,
      audio_urls: audioUrls.length > 0 ? audioUrls : null,
      group_sent_phones: Array.from(alreadySent),
    } as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Campanha de grupo criada!" });
      setGroupOpen(false);
      fetchCampaigns();
    }
    setSaving(false);
  };

  const handleGroupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
    if (groupImageFiles.length >= 3) {
      toast({ title: "Máximo de 3 imagens", variant: "destructive" });
      return;
    }
    setGroupImageFiles((prev) => [...prev, file]);
    const reader = new FileReader();
    reader.onloadend = () => setGroupImagePreviews((prev) => [...prev, reader.result as string]);
    reader.readAsDataURL(file);
    if (groupFileInputRef.current) groupFileInputRef.current.value = "";
  };

  const uploadGroupImages = async (): Promise<string[]> => {
    if (groupImageFiles.length === 0) return [];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const urls: string[] = [];
    for (const file of groupImageFiles) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
      const { error } = await supabase.storage.from("campaign-images").upload(path, file, { upsert: true });
      if (error) continue;
      const { data: urlData } = supabase.storage.from("campaign-images").getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const handleGroupAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("audio/") || file.size > 10 * 1024 * 1024) return;
    if (groupAudioFiles.length >= 3) {
      toast({ title: "Máximo de 3 áudios", variant: "destructive" });
      return;
    }
    setGroupAudioFiles((prev) => [...prev, file]);
    setGroupAudioNames((prev) => [...prev, file.name]);
    if (groupAudioInputRef.current) groupAudioInputRef.current.value = "";
  };

  const uploadGroupAudios = async (): Promise<string[]> => {
    if (groupAudioFiles.length === 0) return [];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const urls: string[] = [];
    for (const file of groupAudioFiles) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/audio-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
      const { error } = await supabase.storage.from("campaign-images").upload(path, file, { upsert: true });
      if (error) continue;
      const { data: urlData } = supabase.storage.from("campaign-images").getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  };


  const handleGroupSchedule = async (campaign: Campaign) => {
    setShowGroupBatchDialog(false);
    setScheduling(campaign.id);
    groupCancelRef.current = false;
    const imageUrls: string[] = campaign.image_urls || (campaign.image_url ? [campaign.image_url] : []);
    const audioUrls: string[] = (campaign as any).audio_urls || [];
    const size = groupBatchSize === "all" ? 0 : parseInt(groupBatchSize);
    let totalSent = 0;
    let totalErrors = 0;
    const allFailed: Array<{ phone: string; reason: string }> = [];
    let sentPhones = [...(campaign.group_sent_phones || [])];
    let loopCount = 0;

    try {
      while (true) {
        if (groupCancelRef.current) {
          toast({ title: "🛑 Disparo cancelado", description: `${totalSent} mensagens enviadas antes do cancelamento.` });
          break;
        }

        loopCount++;
        setSendingProgress(`Enviando lote ${loopCount}... (${totalSent} enviados)`);

        const { data, error } = await supabase.functions.invoke("send-group-message", {
          body: {
            group_ids: campaign.group_ids,
            message: campaign.message_template,
            image_urls: imageUrls,
            audio_urls: audioUrls,
            batch_size: size,
            sent_phones: sentPhones,
          },
        });

        // Handle errors - supabase SDK puts non-2xx responses in error
        let grpData = data;
        if (error) {
          try {
            const ctx = (error as any).context;
            if (ctx && typeof ctx.json === "function") {
              grpData = await ctx.json();
            } else if (error.message) {
              try { grpData = JSON.parse(error.message); } catch {}
            }
          } catch {}

          if (!grpData || !grpData.code) {
            toast({ title: "Erro no envio", description: grpData?.error || error.message, variant: "destructive" });
            break;
          }
        }

        if (grpData?.code === "DAILY_LIMIT_REACHED" || grpData?.code === "OUTSIDE_SAFE_HOURS" || grpData?.code === "INSTANCE_NOT_CONNECTED") {
          toast({ title: "Erro no envio", description: grpData.error, variant: "destructive" });
          break;
        }
        if (grpData?.error && !grpData?.success) {
          toast({ title: "Erro no envio", description: grpData.error, variant: "destructive" });
          break;
        }

        totalSent += grpData.sent_count || 0;
        totalErrors += grpData.errors || 0;
        if (grpData.failed?.length > 0) allFailed.push(...grpData.failed);
        sentPhones = grpData.sent_phones_list || sentPhones;

        // Update campaign in DB
        const newStatus = grpData.all_sent ? "sent" : "partial";
        await supabase.from("campaigns").update({
          group_sent_phones: sentPhones,
          sent_count: sentPhones.length,
          total_leads: grpData.total_participants || campaign.total_leads,
          status: newStatus,
        } as any).eq("id", campaign.id);

        if (grpData.all_sent || !grpData.has_more) {
          toast({
            title: grpData.all_sent ? "✅ Todos os participantes foram enviados!" : "📱 Lote enviado!",
            description: `${grpData.total_sent} enviados de ${grpData.total_participants} participantes.${totalErrors > 0 ? ` (${totalErrors} erros)` : ""}`,
          });
          break;
        }

        // Anti-block: pause between micro-batches (20-60s)
        const pauseSeconds = 20 + Math.floor(Math.random() * 41);
        for (let s = pauseSeconds; s > 0; s--) {
          if (groupCancelRef.current) break;
          setSendingProgress(`Aguardando ${s}s antes do próximo lote... (${totalSent} enviados)`);
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      if (allFailed.length > 0) {
        setGroupFailedList(allFailed);
        setShowGroupFailedDialog(true);
      }
      fetchCampaigns();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
    setScheduling(null);
    setSendingProgress(null);
  };

  const toggleGroup = (id: string) => {
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <PageTutorial
        title="Disparo em Massa"
        description="Envie mensagens em massa pelo WhatsApp para todos os seus leads de uma só vez."
        steps={[
          { emoji: "1️⃣", text: "Clique em 'Nova Campanha' para criar uma campanha." },
          { emoji: "2️⃣", text: "Dê um nome, filtre por categoria e escreva sua mensagem." },
          { emoji: "3️⃣", text: "Use o botão 'Melhorar com IA' para aprimorar o texto automaticamente." },
          { emoji: "4️⃣", text: "Opcionalmente, anexe uma imagem à mensagem." },
          { emoji: "5️⃣", text: "Escolha o tamanho do lote (20, 50 ou todos) e clique em 'Disparar'." },
          { emoji: "💡", text: "O sistema marca os leads já enviados. Dispare novamente para enviar aos restantes." },
        ]}
      />
      {/* Anti-Block Shield Panel — Premium */}
      <div className="rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/[0.03] via-background to-emerald-500/[0.03] overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center ring-1 ring-green-500/20">
                <ShieldAlert className="h-5.5 w-5.5 text-green-500" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 ring-2 ring-background" />
              </span>
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">Sistema Anti-Block</h3>
              <p className="text-[11px] text-muted-foreground">7 camadas de proteção ativas em tempo real</p>
            </div>
          </div>

          {/* Quota Card */}
          <div className="rounded-xl border border-border/80 bg-card/80 backdrop-blur-sm px-4 py-3 min-w-[200px] shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Cota Diária</p>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                dailySent >= dailyLimit
                  ? "bg-destructive/15 text-destructive"
                  : dailySent >= dailyLimit * 0.8
                  ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
                  : "bg-green-500/15 text-green-600 dark:text-green-400"
              }`}>
                {dailySent >= dailyLimit ? "ESGOTADO" : `${Math.max(0, dailyLimit - dailySent)} restantes`}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-bold tabular-nums ${dailySent >= dailyLimit ? "text-destructive" : "text-foreground"}`}>
                {dailySent}
              </span>
              <span className="text-xs text-muted-foreground font-medium">/ {dailyLimit}</span>
            </div>
            <div className="mt-2 h-2 w-full bg-muted/80 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  dailySent >= dailyLimit
                    ? "bg-destructive"
                    : dailySent >= dailyLimit * 0.8
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                    : "bg-gradient-to-r from-green-500 to-emerald-400"
                }`}
                style={{ width: `${Math.min(100, (dailySent / dailyLimit) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Warm-up indicator */}
        {isWarmup && (
          <div className="px-5 pb-3">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.04] px-4 py-3 flex items-start gap-2.5">
              <Clock className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-foreground">
                  Aquecimento automático — Dia {warmupDay + 1}
                </p>
                <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                  Seu número está em período de aquecimento. O limite aumenta gradualmente:
                  <span className={warmupDay <= 3 ? " font-bold text-blue-500" : ""}> 30/dia (dia 1-3)</span> →
                  <span className={warmupDay > 3 && warmupDay <= 7 ? " font-bold text-blue-500" : ""}> 60/dia (dia 4-7)</span> →
                  <span className={warmupDay > 7 && warmupDay <= 14 ? " font-bold text-blue-500" : ""}> 100/dia (dia 8-14)</span> →
                  <span className={warmupDay > 14 ? " font-bold text-blue-500" : ""}> 150/dia (dia 15+)</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Protection Layers Grid */}
        <div className="px-5 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="group rounded-xl border border-purple-500/15 bg-purple-500/[0.03] hover:bg-purple-500/[0.06] p-3 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-6 w-6 rounded-md bg-purple-500/15 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                </div>
                <span className="text-[11px] font-bold text-foreground">Variação por IA</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">Cada mensagem é reescrita com IA. Nenhuma é idêntica — estrutura, sinônimos e formato variam.</p>
            </div>

            <div className="group rounded-xl border border-blue-500/15 bg-blue-500/[0.03] hover:bg-blue-500/[0.06] p-3 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-6 w-6 rounded-md bg-blue-500/15 flex items-center justify-center">
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <span className="text-[11px] font-bold text-foreground">Delays 60-180s</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">Intervalos aleatórios de 1 a 3 minutos entre mensagens + pausas de digitação humanizadas.</p>
            </div>

            <div className="group rounded-xl border border-orange-500/15 bg-orange-500/[0.03] hover:bg-orange-500/[0.06] p-3 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-6 w-6 rounded-md bg-orange-500/15 flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 text-orange-500" />
                </div>
                <span className="text-[11px] font-bold text-foreground">Micro-Lotes</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">Apenas 1-2 leads por execução com pausas de 2-5 min entre cada lote.</p>
            </div>

            <div className="group rounded-xl border border-green-500/15 bg-green-500/[0.03] hover:bg-green-500/[0.06] p-3 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-6 w-6 rounded-md bg-green-500/15 flex items-center justify-center">
                  <Smartphone className="h-3.5 w-3.5 text-green-500" />
                </div>
                <span className="text-[11px] font-bold text-foreground">Horário 8h-21h</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">Envios fora do horário seguro são BLOQUEADOS automaticamente pelo sistema.</p>
            </div>

            <div className="group rounded-xl border border-yellow-500/15 bg-yellow-500/[0.03] hover:bg-yellow-500/[0.06] p-3 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-6 w-6 rounded-md bg-yellow-500/15 flex items-center justify-center">
                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                </div>
                <span className="text-[11px] font-bold text-foreground">Detecção de Risco</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">Links encurtados e palavras sensíveis são detectados antes do envio.</p>
            </div>

            <div className="group rounded-xl border border-red-500/15 bg-red-500/[0.03] hover:bg-red-500/[0.06] p-3 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-6 w-6 rounded-md bg-red-500/15 flex items-center justify-center">
                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                </div>
                <span className="text-[11px] font-bold text-foreground">Lista Negra</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">Números inexistentes são detectados e bloqueados automaticamente em envios futuros.</p>
            </div>

            <div className="group rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06] p-3 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-6 w-6 rounded-md bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <span className="text-[11px] font-bold text-foreground">Limite {dailyLimit}/dia</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {isWarmup
                  ? `Número em aquecimento (dia ${warmupDay + 1}). Limite sobe automaticamente até 150/dia.`
                  : "Sistema bloqueia envios após 150 mensagens diárias para preservar seu número."}
              </p>
            </div>

            <div className="group rounded-xl border border-cyan-500/15 bg-cyan-500/[0.03] hover:bg-cyan-500/[0.06] p-3 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-6 w-6 rounded-md bg-cyan-500/15 flex items-center justify-center">
                  <Smartphone className="h-3.5 w-3.5 text-cyan-500" />
                </div>
                <span className="text-[11px] font-bold text-foreground">Número Dedicado</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">Use sempre um chip separado para disparos. Nunca use seu número pessoal principal.</p>
            </div>
          </div>
        </div>

        {/* Footer Warning */}
        <div className="px-5 pb-4">
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/[0.04] px-4 py-3 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              O uso de disparo em massa é de <strong className="text-foreground">total responsabilidade do usuário</strong>. O LeadsPro oferece múltiplas camadas de proteção, mas nenhum sistema pode garantir 100% de imunidade contra bloqueios do WhatsApp. Siga as boas práticas: use chip dedicado, não envie spam, respeite o limite diário.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold font-display text-foreground flex items-start gap-2 leading-tight">
            <MessageCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <span>Disparo em Massa WhatsApp</span>
          </h1>
          <div className="mt-2 text-sm text-muted-foreground space-y-1">
            {hasEvolutionInstance ? (
              <p>📱 Disparos serão enviados pelo <strong className="text-foreground">seu número pessoal</strong> conectado.</p>
            ) : (
              <p className="text-yellow-600 dark:text-yellow-400">⚠️ Você precisa <a href="/user-dashboard/whatsapp-instance" className="text-primary font-medium hover:underline">conectar via QR Code</a> para disparar campanhas.</p>
            )}
            <p>📎 Seu WhatsApp pessoal é incluído automaticamente como link de contato ao final de cada mensagem.</p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={openGroupDialog} disabled={!hasEvolutionInstance} className="w-full sm:w-auto">
            <Users className="h-4 w-4 mr-2" /> Enviar para Grupos
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-bg w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" /> Nova Campanha
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Campanha</DialogTitle>
              <DialogDescription>Crie uma campanha de disparo em massa via WhatsApp para seus leads.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nome da campanha</Label>
                <Input placeholder="Ex: Promoção de Março" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
              </div>

              <div className="space-y-3">
                <Label>Enviar para</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={filterMode === "category" ? "default" : "outline"}
                    size="sm"
                    className={filterMode === "category" ? "gradient-bg" : ""}
                    onClick={() => { setFilterMode("category"); setListFilter("all"); }}
                  >
                    Por Categoria
                  </Button>
                  <Button
                    type="button"
                    variant={filterMode === "list" ? "default" : "outline"}
                    size="sm"
                    className={filterMode === "list" ? "gradient-bg" : ""}
                    onClick={() => { setFilterMode("list"); setCategoryFilter("all"); }}
                  >
                    Por Lista
                  </Button>
                  {isFlorianoUser && (
                    <Button
                      type="button"
                      variant={filterMode === "expired_users" ? "default" : "outline"}
                      size="sm"
                      className={filterMode === "expired_users" ? "gradient-bg" : ""}
                      onClick={() => { setFilterMode("expired_users"); setCategoryFilter("all"); setListFilter("all"); }}
                    >
                      Testes Expirados
                    </Button>
                  )}
                </div>

                {filterMode === "category" && (
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os leads" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os leads únicos ({uniqueLeads.length})</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {filterMode === "list" && (
                  <Select value={listFilter} onValueChange={setListFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma lista" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as listas</SelectItem>
                      {leadLists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          <span className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: list.color }} />
                            {list.name} ({list.lead_count})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {filterMode === "expired_users" && (
                  <p className="text-sm text-muted-foreground p-3 rounded-lg border border-border bg-muted/30">
                    🎯 Serão enviadas mensagens para <strong>{expiredUsersCount}</strong> usuários da plataforma com teste gratuito expirado.
                  </p>
                )}

                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" /> {filterMode === "expired_users" ? expiredUsersCount : targetLeads.length} leads serão alvo desta campanha
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Mensagem</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={improving || !template.trim()}
                    onClick={async () => {
                      setImproving(true);
                      try {
                        const { data, error } = await supabase.functions.invoke("improve-message", {
                          body: { message: template },
                        });
                        if (error) throw error;
                        if (data?.improved) {
                          setTemplate(data.improved);
                          toast({ title: "✨ Mensagem melhorada!" });
                        }
                      } catch (e: any) {
                        toast({ title: "Erro ao melhorar", description: e.message, variant: "destructive" });
                      }
                      setImproving(false);
                    }}
                    className="gap-1.5 text-xs"
                  >
                    {improving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    Melhorar com IA
                  </Button>
                </div>
                <Textarea
                  placeholder="Olá, temos uma oferta especial para você..."
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  rows={5}
                  maxLength={2000}
                />
              </div>

              {/* Image Toggle */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="with-image"
                    checked={withImage}
                    onCheckedChange={(checked) => {
                      setWithImage(!!checked);
                      if (!checked) removeAllImages();
                    }}
                  />
                  <Label htmlFor="with-image" className="cursor-pointer text-sm">Enviar com imagem</Label>
                </div>

                {withImage && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">Adicione até 3 imagens — o sistema escolhe uma aleatoriamente para cada lead, variando o envio.</p>
                    <div className="grid grid-cols-3 gap-2">
                      {imagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative rounded-lg overflow-hidden border border-border bg-muted/30">
                          <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-24 object-cover" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 rounded-full"
                            onClick={() => removeImageAt(idx)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {imagePreviews.length < 3 && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-border rounded-lg h-24 hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
                        >
                          <ImagePlus className="h-5 w-5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{imagePreviews.length === 0 ? "Adicionar" : `${imagePreviews.length}/3`}</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Audio Toggle */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="with-audio"
                    checked={withAudio}
                    onCheckedChange={(checked) => {
                      setWithAudio(!!checked);
                      if (!checked) { setAudioFiles([]); setAudioNames([]); }
                    }}
                  />
                  <Label htmlFor="with-audio" className="cursor-pointer text-sm">Enviar com áudio</Label>
                </div>

                {withAudio && (
                  <>
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioSelect}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">Adicione até 3 áudios — o sistema escolhe um aleatoriamente para cada lead, variando o envio.</p>
                    <div className="space-y-1.5">
                      {audioNames.map((name, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-md border border-border bg-muted/30">
                          <Volume2 className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-xs text-foreground truncate flex-1">{name}</span>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-6 w-6 rounded-full shrink-0"
                            onClick={() => removeAudioAt(idx)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {audioNames.length < 3 && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => audioInputRef.current?.click()}
                            className="flex items-center justify-center gap-2 flex-1 border-2 border-dashed border-border rounded-lg py-3 hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
                          >
                            <Mic className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{audioNames.length === 0 ? "Upload" : `${audioNames.length}/3`}</span>
                          </button>
                          <div className="flex-1">
                            <AudioRecorder
                              disabled={audioNames.length >= 3}
                              onRecorded={(file) => {
                                if (audioFiles.length >= 3) return;
                                setAudioFiles((prev) => [...prev, file]);
                                setAudioNames((prev) => [...prev, `🎙️ ${file.name}`]);
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={saving || uploading} className="gradient-bg">
                {(saving || uploading) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Criar Campanha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Nenhuma campanha de WhatsApp criada ainda.</p>
            <p className="text-sm text-muted-foreground">Crie sua primeira campanha para disparar mensagens em massa via WhatsApp.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => {
            const st = statusConfig[campaign.status] || statusConfig.draft;
            const progress = getProgressPercent(campaign);
            const canSendMore = campaign.status === "draft" || campaign.status === "partial";
            const isGroup = campaign.campaign_type === "group";

            return (
              <Card key={campaign.id} className={`flex flex-col ${isGroup ? "border-emerald-500/40 dark:border-emerald-500/30" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {isGroup && <Users className="h-4 w-4 text-emerald-500 shrink-0" />}
                      <CardTitle className="text-base truncate">{campaign.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isGroup && (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 gap-1 text-[10px]">
                          <Users className="h-2.5 w-2.5" /> Grupo
                        </Badge>
                      )}
                      <Badge className={`${st.color} gap-1 text-xs`}>
                        {st.icon} {st.label}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="text-xs">
                    {new Date(campaign.created_at).toLocaleDateString("pt-BR")} · {campaign.total_leads} {isGroup ? "participantes" : "leads"}
                    {(campaign.image_url || campaign.image_urls?.length) && (
                      <span className="inline-flex items-center gap-1 ml-2 text-primary">
                        <Image className="h-3 w-3" /> {campaign.image_urls?.length && campaign.image_urls.length > 1 ? `${campaign.image_urls.length} imagens` : "com imagem"}
                      </span>
                    )}
                    {(campaign as any).audio_urls?.length > 0 && (
                      <span className="inline-flex items-center gap-1 ml-2 text-primary">
                        <Volume2 className="h-3 w-3" /> {(campaign as any).audio_urls.length > 1 ? `${(campaign as any).audio_urls.length} áudios` : "com áudio"}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-3">
                  {(campaign.image_urls?.length ? campaign.image_urls : campaign.image_url ? [campaign.image_url] : []).length > 0 && (
                    <div className="flex gap-1.5 overflow-x-auto">
                      {(campaign.image_urls?.length ? campaign.image_urls : [campaign.image_url]).map((url: string, idx: number) => (
                        <img key={idx} src={url!} alt={`Imagem ${idx + 1}`} className="h-20 w-20 object-cover rounded-md border border-border shrink-0" />
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground whitespace-pre-line bg-muted/30 p-2 rounded-md">
                    {campaign.message_template}
                  </p>

                  {/* Progress bar for partial/sent campaigns */}
                  {(campaign.status === "partial" || campaign.status === "sent") && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progresso de envio</span>
                        <span className="font-medium text-foreground">{campaign.sent_count}/{campaign.total_leads}</span>
                      </div>
                      <Progress value={progress} className={`h-2 ${isGroup ? "[&>div]:bg-emerald-500" : ""}`} />
                      {campaign.status === "partial" && (
                        <p className={`text-xs ${isGroup ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}`}>
                          Restam {campaign.total_leads - campaign.sent_count} {isGroup ? "participantes" : "leads"} para enviar
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {canSendMore && (
                      <Button
                        size="sm"
                        onClick={() => {
                          if (isGroup) {
                            setSelectedCampaignId(campaign.id);
                            setGroupBatchSize("20");
                            setShowGroupBatchDialog(true);
                          } else {
                            openBatchDialog(campaign.id);
                          }
                        }}
                        disabled={scheduling === campaign.id || !hasEvolutionInstance}
                        className={`flex-1 ${isGroup ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "gradient-bg"}`}
                      >
                        {scheduling === campaign.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            {sendingProgress ? (
                              <span className="text-xs truncate max-w-[140px]">{sendingProgress}</span>
                            ) : "Enviando..."}
                          </>
                        ) : (
                          <>
                            <Smartphone className="h-3.5 w-3.5 mr-1.5" />
                            {campaign.status === "partial" ? "Enviar próximo lote" : "Disparar"}
                          </>
                        )}
                      </Button>
                    )}
                    {scheduling === campaign.id && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (isGroup) {
                            groupCancelRef.current = true;
                            setSendingProgress("Cancelando...");
                          } else {
                            handleCancelDispatch();
                          }
                        }}
                        className="shrink-0"
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Parar
                      </Button>
                    )}
                    {campaign.status === "sent" && (
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 flex-1">
                        <CheckCircle2 className="h-3 w-3" /> Todos {isGroup ? "participantes" : "leads"} enviados
                      </p>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(campaign)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(campaign.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Batch Size Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" /> Escolher tamanho do lote
            </DialogTitle>
            <DialogDescription>
              Quantos leads deseja enviar neste lote? O sistema pula os que já foram enviados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Select value={batchSize} onValueChange={setBatchSize}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20 leads (recomendado)</SelectItem>
                <SelectItem value="50">50 leads</SelectItem>
                <SelectItem value="100">100 leads</SelectItem>
                <SelectItem value="all">Todos os restantes</SelectItem>
              </SelectContent>
            </Select>

            <Alert className="border-yellow-500/30 bg-yellow-500/5">
              <ShieldAlert className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-xs text-muted-foreground">
                <strong className="text-foreground">Recomendação:</strong> envie no máximo 20-50 por vez. Intervalo entre cada mensagem: 60-180 segundos. Limite diário: 150 mensagens. Apenas entre 8h-21h.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowBatchDialog(false)}>Cancelar</Button>
            <Button
              className="gradient-bg"
              disabled={scheduling !== null}
              onClick={() => selectedCampaignId && handleSchedule(selectedCampaignId)}
            >
              {scheduling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Disparar lote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Failed Leads Dialog */}
      <Dialog open={showFailedDialog} onOpenChange={setShowFailedDialog}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" /> Leads com falha no envio
            </DialogTitle>
            <DialogDescription>
              {failedLeads.length} lead{failedLeads.length !== 1 ? "s" : ""} não receberam a mensagem.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            <div className="space-y-2">
              {failedLeads.map((fl, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                  <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {fl.name || "Sem nome"} {fl.phone ? `· ${fl.phone}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{fl.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFailedDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" /> Editar Campanha
            </DialogTitle>
            <DialogDescription>Altere o nome ou a mensagem da campanha.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nome da campanha</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label>Mensagem</Label>
              <Textarea value={editTemplate} onChange={(e) => setEditTemplate(e.target.value)} rows={6} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditSave} disabled={editSaving} className="gradient-bg">
              {editSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Messaging Dialog */}
      <Dialog open={groupOpen} onOpenChange={(open) => { if (!sendingGroups) setGroupOpen(open); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Enviar para Participantes dos Grupos
            </DialogTitle>
            <DialogDescription>
              Selecione os grupos — o sistema buscará os participantes e enviará mensagens <strong>individuais</strong> para cada um, com variações de IA.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 overflow-y-auto flex-1 -mx-6 px-6">
            {/* Group selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Grupos ({groups.length})</Label>
                {groups.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setSelectedGroups(selectedGroups.length === groups.length ? [] : groups.map((g) => g.id))}
                  >
                    {selectedGroups.length === groups.length ? "Desmarcar todos" : "Selecionar todos"}
                  </Button>
                )}
              </div>
              {loadingGroups ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Carregando grupos...</span>
                </div>
              ) : groups.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhum grupo encontrado.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-border rounded-lg p-2">
                  {groups.map((group) => (
                    <label
                      key={group.id}
                      className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                        selectedGroups.includes(group.id) ? "bg-primary/10" : "hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        checked={selectedGroups.includes(group.id)}
                        onCheckedChange={() => toggleGroup(group.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{group.subject}</p>
                        <p className="text-xs text-muted-foreground">{group.size} participantes</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {selectedGroups.length > 0 && (
                <p className="text-xs text-primary font-medium">
                  {selectedGroups.length} grupo(s) selecionado(s) · ~{selectedGroups.reduce((sum, id) => sum + (groups.find(g => g.id === id)?.size || 0), 0)} participantes (com possíveis duplicados)
                </p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Mensagem</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={improvingGroup || !groupMessage.trim()}
                  onClick={async () => {
                    setImprovingGroup(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("improve-message", {
                        body: { message: groupMessage },
                      });
                      if (error) throw error;
                      if (data?.improved) {
                        setGroupMessage(data.improved);
                        toast({ title: "✨ Mensagem melhorada!" });
                      }
                    } catch (e: any) {
                      toast({ title: "Erro ao melhorar", description: e.message, variant: "destructive" });
                    }
                    setImprovingGroup(false);
                  }}
                  className="gap-1.5 text-xs"
                >
                  {improvingGroup ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Melhorar com IA
                </Button>
              </div>
              <Textarea
                placeholder="Olá, temos uma novidade exclusiva para você..."
                value={groupMessage}
                onChange={(e) => setGroupMessage(e.target.value)}
                rows={4}
                maxLength={2000}
              />
            </div>

            {/* Images */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="group-with-image"
                  checked={groupWithImage}
                  onCheckedChange={(checked) => {
                    setGroupWithImage(!!checked);
                    if (!checked) {
                      setGroupImageFiles([]);
                      setGroupImagePreviews([]);
                    }
                  }}
                />
                <Label htmlFor="group-with-image" className="cursor-pointer text-sm">Enviar com imagem</Label>
              </div>
              {groupWithImage && (
                <>
                  <input ref={groupFileInputRef} type="file" accept="image/*" onChange={handleGroupFileSelect} className="hidden" />
                  <p className="text-xs text-muted-foreground">Até 3 imagens — uma aleatória por participante.</p>
                  <div className="grid grid-cols-3 gap-2">
                    {groupImagePreviews.map((preview, idx) => (
                      <div key={idx} className="relative rounded-lg overflow-hidden border border-border bg-muted/30">
                        <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-20 object-cover" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-5 w-5 rounded-full"
                          onClick={() => {
                            setGroupImageFiles((p) => p.filter((_, i) => i !== idx));
                            setGroupImagePreviews((p) => p.filter((_, i) => i !== idx));
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {groupImagePreviews.length < 3 && (
                      <button
                        type="button"
                        onClick={() => groupFileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-border rounded-lg h-20 hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <ImagePlus className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{groupImagePreviews.length}/3</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Audio for groups */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="group-with-audio"
                  checked={groupWithAudio}
                  onCheckedChange={(checked) => {
                    setGroupWithAudio(!!checked);
                    if (!checked) { setGroupAudioFiles([]); setGroupAudioNames([]); }
                  }}
                />
                <Label htmlFor="group-with-audio" className="cursor-pointer text-sm">Enviar com áudio</Label>
              </div>
              {groupWithAudio && (
                <>
                  <input ref={groupAudioInputRef} type="file" accept="audio/*" onChange={handleGroupAudioSelect} className="hidden" />
                  <p className="text-xs text-muted-foreground">Até 3 áudios — um aleatório por participante.</p>
                  <div className="space-y-1.5">
                    {groupAudioNames.map((audioName, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-md border border-border bg-muted/30">
                        <Volume2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-xs text-foreground truncate flex-1">{audioName}</span>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-5 w-5 rounded-full shrink-0"
                          onClick={() => {
                            setGroupAudioFiles((p) => p.filter((_, i) => i !== idx));
                            setGroupAudioNames((p) => p.filter((_, i) => i !== idx));
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {groupAudioNames.length < 3 && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => groupAudioInputRef.current?.click()}
                          className="flex items-center justify-center gap-2 flex-1 border-2 border-dashed border-border rounded-lg py-3 hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
                        >
                          <Mic className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{groupAudioNames.length === 0 ? "Upload" : `${groupAudioNames.length}/3`}</span>
                        </button>
                        <div className="flex-1">
                          <AudioRecorder
                            disabled={groupAudioNames.length >= 3}
                            onRecorded={(file) => {
                              if (groupAudioFiles.length >= 3) return;
                              setGroupAudioFiles((prev) => [...prev, file]);
                              setGroupAudioNames((prev) => [...prev, `🎙️ ${file.name}`]);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setGroupOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleCreateGroupCampaign}
              disabled={saving || selectedGroups.length === 0 || !groupMessage.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Criar Campanha de Grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Batch Size Dialog */}
      <Dialog open={showGroupBatchDialog} onOpenChange={setShowGroupBatchDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" /> Escolher tamanho do lote
            </DialogTitle>
            <DialogDescription>
              Quantos participantes deseja enviar neste lote? O sistema busca todos os membros dos grupos selecionados, remove duplicados e envia individualmente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Select value={groupBatchSize} onValueChange={setGroupBatchSize}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20 participantes (recomendado)</SelectItem>
                <SelectItem value="50">50 participantes</SelectItem>
                <SelectItem value="100">100 participantes</SelectItem>
                <SelectItem value="all">Todos os participantes</SelectItem>
              </SelectContent>
            </Select>

            <Alert className="border-yellow-500/30 bg-yellow-500/5">
              <ShieldAlert className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-xs text-muted-foreground">
                <strong className="text-foreground">Recomendação:</strong> envie no máximo 20-50 por vez. Mensagens são variadas por IA e enviadas com delays aleatórios.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowGroupBatchDialog(false)}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => {
              const campaign = campaigns.find(c => c.id === selectedCampaignId);
              if (campaign) handleGroupSchedule(campaign);
            }}>
              <Send className="h-4 w-4 mr-2" /> Disparar lote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Failed Dialog */}
      <Dialog open={showGroupFailedDialog} onOpenChange={setShowGroupFailedDialog}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" /> Participantes com falha
            </DialogTitle>
            <DialogDescription>
              {groupFailedList.length} participante(s) não receberam a mensagem.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            <div className="space-y-2">
              {groupFailedList.map((fl, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                  <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{fl.phone}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{fl.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGroupFailedDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserCampaigns;

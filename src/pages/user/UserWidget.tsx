import { useState, useEffect, useRef } from "react";
import { useUserData } from "@/hooks/useUserData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PageTutorial } from "@/components/PageTutorial";
import { Code, Copy, Check, Eye, Palette, Type, AlignLeft, AlignRight, Maximize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoFull from "@/assets/logo-full.png";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const UserWidget = () => {
  const { license } = useUserData();
  const { toast } = useToast();
  const [color, setColor] = useState("#7913c9");
  const [title, setTitle] = useState("Fale Conosco");
  const [position, setPosition] = useState<"right" | "left">("right");
  const [size, setSize] = useState<"small" | "medium" | "large">("medium");
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const publishedUrl = "https://leadspro.app";
  const licenseCode = license?.code || "SEU-CODIGO";

  const snippet = `<script src="${publishedUrl}/widget.js" data-code="${licenseCode}" data-color="${color}" data-title="${title}" data-position="${position}" data-size="${size}"></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast({ title: "Snippet copiado!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const posAlign = position === "left" ? "left:24px" : "right:24px";
  const posMargin = position === "left" ? "margin-right:auto" : "margin-left:auto";

  const sizeConfig = {
    small: { width: 280, btn: 44, icon: 22, titleSize: 15, labelSize: 11, inputPad: "8px 10px", fontSize: 13 },
    medium: { width: 340, btn: 56, icon: 28, titleSize: 18, labelSize: 12, inputPad: "10px 12px", fontSize: 14 },
    large: { width: 400, btn: 64, icon: 32, titleSize: 20, labelSize: 13, inputPad: "12px 14px", fontSize: 15 },
  };
  const sz = sizeConfig[size];

  const previewHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body{margin:0;font-family:sans-serif;background:#f1f5f9;height:100vh;position:relative}
</style></head><body>
  <div style="position:fixed;bottom:24px;${posAlign};z-index:9999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div id="w-form" style="display:none;width:${sz.width}px;background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.18);overflow:hidden;margin-bottom:12px">
    <div style="background:${color};padding:20px 20px 16px;color:#fff">
      <div style="font-size:${sz.titleSize}px;font-weight:700">${title}</div>
      <div style="font-size:${sz.labelSize}px;opacity:.85;margin-top:4px">Preencha para entrarmos em contato</div>
    </div>
    <div style="padding:20px">
      <div style="margin-bottom:12px"><label style="font-size:${sz.labelSize}px;font-weight:600;color:#374151;display:block;margin-bottom:4px">Nome *</label><input style="width:100%;padding:${sz.inputPad};border:1px solid #e5e7eb;border-radius:8px;font-size:${sz.fontSize}px;box-sizing:border-box;outline:none" /></div>
      <div style="margin-bottom:12px"><label style="font-size:${sz.labelSize}px;font-weight:600;color:#374151;display:block;margin-bottom:4px">WhatsApp *</label><input style="width:100%;padding:${sz.inputPad};border:1px solid #e5e7eb;border-radius:8px;font-size:${sz.fontSize}px;box-sizing:border-box;outline:none" /></div>
      <div style="margin-bottom:12px"><label style="font-size:${sz.labelSize}px;font-weight:600;color:#374151;display:block;margin-bottom:4px">E-mail</label><input style="width:100%;padding:${sz.inputPad};border:1px solid #e5e7eb;border-radius:8px;font-size:${sz.fontSize}px;box-sizing:border-box;outline:none" /></div>
      <div style="margin-bottom:16px"><label style="font-size:${sz.labelSize}px;font-weight:600;color:#374151;display:block;margin-bottom:4px">Mensagem</label><textarea style="width:100%;padding:${sz.inputPad};border:1px solid #e5e7eb;border-radius:8px;font-size:${sz.fontSize}px;box-sizing:border-box;outline:none;resize:vertical;min-height:60px"></textarea></div>
      <button style="width:100%;padding:12px;background:${color};color:#fff;border:none;border-radius:8px;font-size:${sz.fontSize}px;font-weight:600;cursor:pointer">Enviar</button>
    </div>
  </div>
  <button id="w-btn" onclick="document.getElementById('w-form').style.display=document.getElementById('w-form').style.display==='none'?'block':'none'" style="width:${sz.btn}px;height:${sz.btn}px;border-radius:14px;background:${color};border:none;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;${posMargin}">
    <svg width="${sz.icon}" height="${sz.icon}" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
  </button>
</div>
<script>document.getElementById('w-btn').click();</script>
</body></html>`;

  useEffect(() => {
    if (previewRef.current) {
      const doc = previewRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(previewHtml);
        doc.close();
      }
    }
  }, [color, title, position, size, licenseCode]);

  return (
    <div className="space-y-6">
      <PageTutorial
        title="Widget de Captura"
        description="Instale o widget no site dos seus clientes para capturar leads direto no CRM."
        steps={[
          { emoji: "1️⃣", text: "Personalize a cor, título e posição do widget abaixo." },
          { emoji: "2️⃣", text: "Copie o snippet e cole antes do </body> do site." },
          { emoji: "3️⃣", text: "Os leads enviados aparecerão no CRM com a categoria 'Widget'." },
          { emoji: "💡", text: "O campo 'Mensagem' do widget será salvo em 'Notas' do lead." },
        ]}
      />

      <div className="flex items-center gap-3">
        <img src={logoFull} alt="LeadsPro" className="h-10" />
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <Code className="h-6 w-6 text-primary" />
            Widget de Captura
          </h1>
          <p className="text-sm text-muted-foreground">
            Instale um formulário flutuante em qualquer site — os leads caem direto no seu CRM.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Config */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personalização</CardTitle>
              <CardDescription>Configure a aparência do widget</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="widgetColor" className="flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5" />
                  Cor principal
                </Label>
                <div className="flex gap-2 items-center">
                  <input
                    id="widgetColor"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-14 rounded border border-input cursor-pointer"
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    maxLength={7}
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="widgetTitle" className="flex items-center gap-1.5">
                  <Type className="h-3.5 w-3.5" />
                  Título do widget
                </Label>
                <Input
                  id="widgetTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={40}
                  placeholder="Fale Conosco"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  {position === "left" ? <AlignLeft className="h-3.5 w-3.5" /> : <AlignRight className="h-3.5 w-3.5" />}
                  Posição do balão
                </Label>
                <Select value={position} onValueChange={(v) => setPosition(v as "left" | "right")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="right">Canto inferior direito</SelectItem>
                    <SelectItem value="left">Canto inferior esquerdo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Maximize2 className="h-3.5 w-3.5" />
                  Tamanho do balão
                </Label>
                <Select value={size} onValueChange={(v) => setSize(v as "small" | "medium" | "large")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeno</SelectItem>
                    <SelectItem value="medium">Médio (padrão)</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Snippet de Instalação</CardTitle>
              <CardDescription>
                Cole este código antes da tag <code className="text-xs bg-muted px-1 py-0.5 rounded">{"</body>"}</code> do site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <div className="p-3 rounded-lg bg-muted/50 border border-border overflow-x-auto">
                  <code className="text-xs font-mono text-foreground whitespace-nowrap select-all block">
                    {snippet}
                  </code>
                </div>
              </div>
              <Button onClick={handleCopy} className="w-full gradient-bg">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copiado!" : "Copiar Snippet"}
              </Button>
            </CardContent>
          </Card>

          {/* Installation Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📖 Como instalar</CardTitle>
              <CardDescription>Passo a passo para colocar o widget no seu site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full gradient-bg text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Personalize o widget</p>
                    <p className="text-xs text-muted-foreground">Escolha a cor, título e posição do balão flutuante na seção acima.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full gradient-bg text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Copie o snippet</p>
                    <p className="text-xs text-muted-foreground">Clique em "Copiar Snippet" para copiar o código gerado automaticamente.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full gradient-bg text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Cole no seu site</p>
                    <p className="text-xs text-muted-foreground">
                      Adicione o snippet <strong>antes da tag <code className="bg-muted px-1 py-0.5 rounded text-[11px]">{"</body>"}</code></strong> no HTML do seu site. Funciona em qualquer plataforma:
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground list-disc list-inside">
                      <li><strong>WordPress:</strong> Aparência → Editor de Temas → footer.php (antes do {"</body>"})</li>
                      <li><strong>Wix:</strong> Configurações → Código Personalizado → Cole no Body (fim)</li>
                      <li><strong>HTML puro:</strong> Abra o arquivo .html e cole antes do {"</body>"}</li>
                      <li><strong>Shopify:</strong> Loja Online → Temas → Editar código → theme.liquid</li>
                    </ul>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full gradient-bg text-primary-foreground flex items-center justify-center text-xs font-bold">4</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Pronto! Receba leads automaticamente</p>
                    <p className="text-xs text-muted-foreground">
                      Quando um visitante preencher o formulário, o lead será enviado direto para o seu CRM com a categoria <strong>"Widget"</strong>. O campo "Mensagem" será salvo nas notas do lead.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Prévia ao Vivo
            </CardTitle>
            <CardDescription>Veja como o widget aparece no site</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden bg-muted/30" style={{ height: 500 }}>
              <iframe
                ref={previewRef}
                title="Widget Preview"
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserWidget;

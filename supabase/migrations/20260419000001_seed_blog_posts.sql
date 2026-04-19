-- Seed blog posts so /blog isn't empty. Idempotent via ON CONFLICT (slug)
-- so re-running the migration just refreshes the text without creating
-- duplicates. One article per cluster + two pillar overviews.

INSERT INTO public.blog_posts
  (slug, title, excerpt, category, cluster, page_type, parent_slug,
   read_time, word_count, meta_description, keywords, content)
VALUES
-- ────────────────────────────────────────────────────────────────────
-- PILLAR MASTER
-- ────────────────────────────────────────────────────────────────────
(
  'guia-prospeccao-whatsapp',
  'Prospecção no WhatsApp em 2026: o guia definitivo (sem ser banido)',
  'Tudo o que você precisa para prospectar no WhatsApp em 2026: captura de leads qualificados, disparo em massa com proteção anti-ban, follow-up automático, CRM integrado e chatbot com IA.',
  'Disparo em Massa',
  'Disparo em Massa',
  'pillar_master',
  NULL,
  '12 min',
  2200,
  'Guia completo de prospecção no WhatsApp em 2026: captura, disparo, follow-up, CRM e chatbot IA sem correr risco de banimento.',
  ARRAY['prospecção whatsapp', 'disparo em massa', 'anti-ban', 'captura de leads', 'crm whatsapp'],
  $md$
Prospectar no WhatsApp virou padrão de mercado no Brasil. Mais de 99% dos brasileiros com internet usam o app todo dia, a taxa de abertura beira 95% e a resposta chega em minutos — números que email e telefone não alcançam nem de longe. Mas junto com a oportunidade vem o risco: números banidos, mensagens ignoradas e leads queimados por abordagens genéricas.

Este guia compila o que funciona em 2026 — do primeiro lead capturado até a venda fechada — sem truques caseiros e sem fórmula mágica.

## Por que o WhatsApp ganhou a prospecção

Email vai pra caixa de promoções. Ligação fria não é atendida. Instagram virou entretenimento. Sobrou o WhatsApp como o único canal onde você ainda tem chance de ser lido em minutos — desde que chegue com a abordagem certa e respeitando o algoritmo do app.

## A pilha completa de prospecção

Uma operação séria combina cinco peças:

1. **Captura de leads qualificados** — Google Maps, Instagram, LinkedIn e diretórios por CNAE. Nada de listas compradas.
2. **Disparo em massa com anti-ban** — variação de mensagens por IA, intervalos randômicos, aquecimento de número e lotes pequenos.
3. **Follow-up automático** — 80% das vendas acontecem do 3º contato pra frente. Sequência automática nos dias 1, 3, 5 e 7.
4. **CRM integrado** — cada conversa registrada, cada lead com histórico, nada se perde no meio do caminho.
5. **Chatbot com IA** — responde 24 horas, qualifica e marca reunião sem você precisar entrar no celular.

## Captura: onde achar leads bons

O Google Maps é a mina mais subutilizada do Brasil. Cada empresa listada tem telefone, site e horário — e a maioria dos concorrentes nem olha pra lá. Busca por CNAE + cidade devolve listas infinitas em segundos. Instagram e LinkedIn completam pra nichos onde a presença digital importa mais que o ponto físico.

## Disparo sem banimento: o que importa de verdade

O erro clássico é mandar a mesma mensagem pra 500 números às 11h da manhã. O WhatsApp lê esse padrão como spam em minutos. A receita que funciona:

- **Variação real de texto** — 10 versões diferentes da mesma mensagem, rotacionadas automaticamente.
- **Intervalo randômico** — 45 a 180 segundos entre envios. Nunca fixo.
- **Lotes pequenos** — 100 a 200 mensagens por dia em número novo; 500 em números aquecidos.
- **Número dedicado** — nunca use seu pessoal. Compre um chip só pra prospecção.

## Follow-up: onde o dinheiro aparece

A maioria dos vendedores desiste no 2º contato. Quem senta um follow-up automático de 7 dias dobra a conversão sem trabalhar mais. A sequência ideal é curta, útil e sem parecer robô: dia 1 é a abordagem, dia 3 é reforço com prova social, dia 5 é uma oferta clara, dia 7 é o "último contato".

## CRM + IA: o que fecha a operação

Com volume alto, manualmente é impossível. Um CRM integrado no WhatsApp centraliza o histórico, o chatbot IA filtra quem não é lead de verdade, e você fica com a parte cara — conversar com quem tem intenção de compra.

## Perguntas Frequentes

### É seguro fazer disparo em massa no WhatsApp?
É seguro se feito com proteção anti-ban adequada: variação de mensagens, intervalos randômicos e lotes controlados. Ferramentas sérias protegem seu número.

### Quantas mensagens posso enviar por dia?
Número novo: 100-200 por dia na primeira semana, subindo gradualmente. Número aquecido (6+ meses de uso normal): 500-1000 por dia.

### Preciso de WhatsApp Business API?
Não. Para volume de até 2-3 mil mensagens por dia com anti-ban, o WhatsApp Business normal atende. API só compensa a partir de 5 mil/dia.
$md$
),

-- ────────────────────────────────────────────────────────────────────
-- PILLAR SECONDARY
-- ────────────────────────────────────────────────────────────────────
(
  'como-capturar-leads-google-maps',
  'Como capturar leads do Google Maps em 2026 (passo a passo)',
  'O Google Maps é a maior base de empresas ativas do Brasil. Veja como extrair telefone, site e Instagram de centenas de negócios por CNAE e cidade em minutos.',
  'Busca de Leads',
  'Busca de Leads',
  'pillar_secondary',
  'guia-prospeccao-whatsapp',
  '8 min',
  1500,
  'Tutorial completo para capturar leads do Google Maps por CNAE e localização. Extraia telefone, email, Instagram e site em minutos.',
  ARRAY['capturar leads google maps', 'scraper google maps', 'prospecção b2b', 'cnae', 'busca de leads'],
  $md$
Cada negócio que existe no Brasil físico está no Google Maps. Oficinas, clínicas, escolas de dança, lojas, restaurantes, imobiliárias — mais de 30 milhões de empresas ativas, com telefone, endereço e muitas vezes site e redes sociais. E a maioria dos seus concorrentes ainda acha que prospecção é comprar lista no Mercado Livre.

Este artigo mostra como virar esse jogo.

## Por que o Google Maps é a melhor base B2B do Brasil

Três coisas fazem do Maps a base mais valiosa pra prospecção:

1. **Dados atualizados** — o Google tem incentivo direto em manter empresas ativas listadas.
2. **Filtro geográfico preciso** — raio de 5km, bairro, cidade, estado.
3. **Filtro por atividade (CNAE)** — você busca "academias" ou "odontologia" e ele devolve só quem é do segmento.

## O método passo a passo

### 1. Defina o cliente ideal
Antes de capturar, responda: que CNAE? qual cidade? porte? Se o foco é "pet shops em Curitiba com até 10 funcionários", a sua busca é cirúrgica desde o começo.

### 2. Faça a busca no LeadsPro
Na aba **Buscar**, selecione a categoria (ou combine várias) e a localização. Em 30 a 60 segundos o sistema devolve nome, telefone, site, Instagram e LinkedIn de cada empresa.

### 3. Organize por lista
Crie uma lista pra cada campanha ("Pet shops Curitiba 2026-04") e salve os leads lá. Isso mantém seu CRM limpo e permite disparos segmentados.

### 4. Valide antes de disparar
Remova duplicados, números sem DDD e leads sem telefone. Qualidade da lista define qualidade da resposta.

## Quanto vale um lead do Google Maps

Em média, leads capturados do Maps convertem **3 a 5x mais** que leads de lista comprada. Por quê? Porque são empresas ativas, com telefone que toca e gente atendendo — não nomes em planilha que circularam por 10 vendedores.

## Erros clássicos de quem captura no Maps

- **Pegar tudo e disparar igual** — sem segmentar por porte ou cidade, você queima o bom junto com o ruim.
- **Não limpar duplicatas** — o mesmo negócio pode aparecer em 2 CNAEs. Dispare uma vez só.
- **Ignorar o site** — se a empresa tem site funcional, você já sabe que investe em digital. Priorize.

## Perguntas Frequentes

### Capturar leads do Google Maps é legal?
Sim. Dados publicamente exibidos podem ser coletados. O que não vale é armazenar dados sensíveis sem base legal (LGPD) ou enviar spam não consentido — abordagem comercial B2B é permitida.

### Posso buscar em cidades do interior?
Sim. O LeadsPro funciona em qualquer cidade do Brasil e também internacionalmente.

### Quantos leads consigo por busca?
Depende do nicho e da cidade. Em capitais, categorias comuns (academias, restaurantes) trazem 200-500 leads. Nichos específicos em cidades pequenas, 20-50.
$md$
),

-- ────────────────────────────────────────────────────────────────────
-- SATELLITE: Disparo em Massa
-- ────────────────────────────────────────────────────────────────────
(
  'disparo-whatsapp-sem-ban',
  'Disparo em massa no WhatsApp sem ser banido: o que funciona em 2026',
  'As 7 práticas que protegem seu número no disparo em massa: variação por IA, intervalo randômico, aquecimento, lotes e o erro fatal que quase todo mundo comete.',
  'Disparo em Massa',
  'Disparo em Massa',
  'satellite',
  'guia-prospeccao-whatsapp',
  '6 min',
  1100,
  'As 7 práticas essenciais para enviar mensagens em massa no WhatsApp sem risco de banimento em 2026.',
  ARRAY['disparo whatsapp', 'anti-ban whatsapp', 'enviar em massa', 'whatsapp marketing', 'não ser banido'],
  $md$
Todo mundo conhece alguém que foi banido mandando disparo. Normalmente a história é a mesma: comprou um software barato, mandou 300 mensagens iguais em 10 minutos, recebeu "Este número está banido" no terceiro lote. Este artigo explica o que esses softwares não fazem — e o que você precisa fazer pra não virar a próxima vítima.

## Como o WhatsApp detecta spam

O algoritmo do app olha 4 coisas principais:

1. **Repetição de conteúdo** — a mesma mensagem enviada pra 100 números em minutos é o sinal mais forte.
2. **Frequência de envio** — disparos em rajada (50 em 5 min) denunciam robô.
3. **Taxa de resposta** — se ninguém responde, o sistema entende que os destinatários não te conhecem.
4. **Denúncias** — 3 ou 4 reclamações e você entra em análise.

A boa notícia: todos esses sinais são contornáveis.

## As 7 práticas que protegem seu número

### 1. Variação real de mensagens
Nunca envie texto idêntico. Use IA para gerar 10 versões da mesma abordagem e rotacione a cada envio. A mensagem base pode ser a mesma — a redação muda.

### 2. Intervalo randômico
Entre cada envio, espere 45 a 180 segundos aleatórios. Nunca fixo em 30s ou 60s — esse padrão é pior que mandar em rajada.

### 3. Lotes pequenos
Primeira semana de um número novo: 100/dia. Segunda semana: 200. Depois de 30 dias: 500/dia. Número com 6+ meses aquecido: até 1000/dia.

### 4. Horário comercial
Dispare entre 9h e 18h, segunda a sexta. Fora desse horário, resposta cai e denúncia sobe.

### 5. Número dedicado
Jamais use seu número pessoal. Compre um chip só para prospecção — se cair, o prejuízo é controlável.

### 6. Aquecimento prévio
Número novo precisa de 7 dias de uso normal (conversas com contatos salvos, envio de mídia, chamadas) antes do primeiro disparo.

### 7. Conteúdo que gera resposta
Mensagem genérica ("Conheça nossos serviços!") gera denúncia. Mensagem personalizada ("Vi seu restaurante no Maps, tenho uma ideia pra aumentar o delivery") gera resposta.

## O erro fatal: comprar número já ban-vulnerável

Muitos softwares vendem "número aquecido" que já foi usado em disparos e está marcado pelo algoritmo. O bloqueio chega no primeiro lote. Compre chip novo em loja, ative, use normalmente por uma semana, depois comece.

## Perguntas Frequentes

### Fui banido, tem volta?
Ban temporário (24-48h) volta sozinho. Ban permanente raramente é revertido — melhor partir pra outro número.

### Posso usar WhatsApp Web?
Sim, desde que respeite os mesmos limites. O Web não é mais seguro que o app — o que importa é o padrão de envio.

### Preciso comprar números todo mês?
Não, se você seguir as práticas acima. Número dedicado bem cuidado dura anos.
$md$
),

-- ────────────────────────────────────────────────────────────────────
-- SATELLITE: Follow Up
-- ────────────────────────────────────────────────────────────────────
(
  'follow-up-automatico-whatsapp',
  'Follow-up automático no WhatsApp: a sequência de 7 dias que fecha 3x mais',
  'A maioria das vendas acontece depois do 3º contato. Veja a sequência de follow-up que dobra conversão sem parecer spam.',
  'Follow Up',
  'Follow Up',
  'satellite',
  'guia-prospeccao-whatsapp',
  '5 min',
  950,
  'Aprenda a montar uma sequência de follow-up automático no WhatsApp que dobra a taxa de conversão em 7 dias.',
  ARRAY['follow-up automático', 'sequência de mensagens', 'whatsapp vendas', 'conversão'],
  $md$
Dado que incomoda: **80% das vendas B2B acontecem entre o 3º e o 7º contato**. Dado que incomoda mais: **60% dos vendedores desistem no 2º**. Esse gap é onde seu concorrente está ganhando dinheiro sem fazer nada — basta um follow-up decente.

Este artigo mostra a sequência de 7 dias que funciona no WhatsApp, palavra por palavra.

## Por que follow-up manual não escala

Com 100 leads na carteira, é fisicamente impossível lembrar quem precisa de contato no dia 3, quem no dia 5 e quem no dia 7. Por isso follow-up automático não é luxo — é o único jeito de executar.

## A sequência de 7 dias

### Dia 1 — Abordagem
> Oi [nome], tudo bem? Vi seu [negócio/perfil] e tenho uma ideia rápida que pode aumentar seu faturamento em [X%]. Posso te mandar em 2 linhas?

O segredo aqui é pedir permissão em vez de despejar pitch. Resposta sobe 40%.

### Dia 3 — Prova social
> Oi [nome], só complementando: ajudei a [empresa parecida] a fazer [resultado específico] em [prazo]. Se fizer sentido, consigo te mostrar como em 10 minutos de call.

### Dia 5 — Oferta clara
> [nome], ainda faz sentido? Posso reservar 10 min amanhã às 15h ou quinta às 10h. Qual funciona melhor?

Ofereça 2 horários específicos. "Quando fica bom pra você?" trava o cérebro do lead.

### Dia 7 — Último contato
> [nome], imagino que não foi prioridade agora — sem problema. Se mudar de ideia, é só chamar aqui. Deixo contigo.

Esse último é o que mais converte. Gera senso de escassez sem pressão.

## Regras que não podem ser quebradas

- **Nunca** mande a mesma mensagem duas vezes pro mesmo lead.
- **Sempre** personalize com o nome e pelo menos um detalhe do negócio.
- **Nunca** mande fora do horário comercial.
- **Sempre** pare a sequência se o lead responder.

## Quantos leads aguentam follow-up manual?

A conta é simples: 5 minutos por follow-up, 100 leads ativos → 500 minutos por dia só nisso. Não tem vendedor humano que sustente. Follow-up automatizado entrega isso em segundo plano.

## Perguntas Frequentes

### A sequência pode ter quantos passos?
3 a 7 é o sweet spot. Menos que 3, você desiste cedo. Mais que 7, vira spam.

### Dá pra fazer sem ferramenta?
Dá, com planilha e alarme — mas só escala até uns 30 leads/mês. Acima disso, automação é obrigatória.

### E se o lead responder no dia 2?
Para a sequência e entra conversa humana. Qualquer ferramenta séria detecta isso automaticamente.
$md$
),

-- ────────────────────────────────────────────────────────────────────
-- SATELLITE: Busca de Leads
-- ────────────────────────────────────────────────────────────────────
(
  'busca-leads-por-cnae',
  'Busca de leads por CNAE: como encontrar clientes do seu nicho',
  'CNAE é o filtro mais poderoso da prospecção B2B brasileira. Veja como usar os códigos certos para achar só os leads que importam.',
  'Busca de Leads',
  'Busca de Leads',
  'satellite',
  'como-capturar-leads-google-maps',
  '5 min',
  900,
  'Como usar códigos CNAE para filtrar leads B2B com precisão e aumentar a taxa de conversão em prospecção.',
  ARRAY['cnae', 'busca por cnae', 'leads b2b', 'prospecção nicho', 'segmentação'],
  $md$
CNAE é a Classificação Nacional de Atividades Econômicas — o código que diz exatamente o que cada empresa faz. Saber usar CNAE em prospecção é a diferença entre mandar 1000 mensagens pra público errado ou 200 pra público certo e vender 10x mais.

## Por que CNAE é o melhor filtro B2B

Três motivos:

1. **Precisão** — CNAE 4644-3/01 é "comércio atacadista de medicamentos". Nada mais. Você não pega farmácia de bairro misturada.
2. **Base oficial** — dados vem da Receita Federal, sem erro de cadastro.
3. **Tamanho e localização** — combinado com porte e cidade, você gera listas altamente qualificadas.

## Como encontrar o CNAE certo

O CNAE tem 7 dígitos no formato XXXX-X/XX. Os primeiros 4 dizem o setor, o 5º é o subsetor e os 2 últimos refinam. Exemplos úteis:

- **4711-3/01** — Hipermercados
- **5611-2/01** — Restaurantes e similares
- **8512-1/00** — Atividade médica ambulatorial
- **9602-5/01** — Cabeleireiros, manicure e pedicure
- **4520-0/01** — Oficinas de automóveis

Consulta completa está no [concla.ibge.gov.br](https://concla.ibge.gov.br). Mas você não precisa decorar — no LeadsPro digite "restaurante" e ele sugere o código.

## Dica: combine 2 ou 3 CNAEs

Nicho puro fica pequeno. Se você vende ERP pra food service, não buque só restaurante — combine:

- 5611-2/01 (Restaurantes)
- 5611-2/03 (Lanchonetes)
- 5620-1/04 (Fornecimento de alimentos preparados)

Isso triplica sua lista sem perder qualificação.

## Erros comuns

- **Usar CNAE muito genérico** — "comércio varejista" devolve tudo do mundo. Refina.
- **Ignorar porte** — vender pra MEI é diferente de vender pra médio. Filtre por funcionários também.
- **Esquecer a geografia** — CNAE certo + cidade errada = logística quebrada.

## Perguntas Frequentes

### Onde consulto todos os CNAEs?
No site do IBGE (concla.ibge.gov.br) ou diretamente no LeadsPro, que já tem a lista embutida.

### Posso filtrar por CNAE secundário?
O LeadsPro cruza principal + secundário automaticamente.

### CNAE funciona pra MEI?
Sim. MEI tem CNAE igual empresa normal, só com a classificação restrita ao Anexo I da LC 128.
$md$
),

-- ────────────────────────────────────────────────────────────────────
-- SATELLITE: WhatsApp Nichos
-- ────────────────────────────────────────────────────────────────────
(
  'prospeccao-whatsapp-nichos',
  '7 nichos onde o WhatsApp converte mais que qualquer canal',
  'Nem todo negócio vende bem por WhatsApp. Mas esses 7 segmentos fecham 2 a 5x mais por lá do que por email ou telefone.',
  'WhatsApp Nichos',
  'WhatsApp Nichos',
  'niche',
  'guia-prospeccao-whatsapp',
  '5 min',
  900,
  'Os 7 nichos onde o WhatsApp supera todos os outros canais de prospecção em taxa de conversão.',
  ARRAY['whatsapp nichos', 'conversão whatsapp', 'prospecção setor', 'vendas b2b'],
  $md$
Todo canal tem vocação. Email converte bem em SaaS corporativo. LinkedIn em venda técnica. Telefone em imóvel de alto padrão. E WhatsApp? WhatsApp ganha fácil em qualquer mercado onde o decisor é o dono, o ciclo é curto e a decisão passa por confiança pessoal — que no Brasil é basicamente todo o SMB.

Estes são os 7 que mais se destacam.

## 1. Clínicas e consultórios
Médicos, dentistas, psicólogos, fisioterapeutas. Agenda é o que manda, e WhatsApp é onde secretárias vivem. Marcação, lembrete e upsell de retorno — tudo acontece por lá.

## 2. Food service
Restaurantes, lanchonetes, dark kitchens. Dono pega o celular no balcão. Email não é aberto, ligação atrapalha o serviço. WhatsApp é o único canal prático.

## 3. Beleza e estética
Salões, barbearias, clínicas de estética, esmalterias. 95% dos agendamentos já acontecem por WhatsApp — prospectar por lá é falar a língua deles.

## 4. Imobiliárias e corretores
Cliente não responde email de corretor. Mas responde WhatsApp com foto da casa em 2 minutos. Velocidade é a moeda desse mercado.

## 5. Oficinas e autopeças
Dono raramente senta no computador. Mecânico menos ainda. WhatsApp com foto da peça ou orçamento é o fluxo natural de compra.

## 6. E-commerce pequeno e médio
Abandono de carrinho no WhatsApp converte 3x mais que por email. Remarketing por lá é subestimado.

## 7. Serviços locais (pintor, jardinagem, limpeza)
Mesmo racional: decisor é o dono/prestador, agenda é o WhatsApp, confiança vem de responder rápido.

## O que esses nichos têm em comum

Três coisas:

1. **Decisor acessível** — sem camada de secretária filtrando.
2. **Decisão rápida** — não precisa aprovação de comitê.
3. **Ticket médio** — nem tão baixo que não valha o atendimento, nem tão alto que peça processo formal.

## Como adaptar a abordagem por nicho

Nicho técnico (clínica, oficina) pede linguagem específica — mostre que você entende o vocabulário. Nicho de varejo (food, beleza) pede velocidade — resposta em minutos vale mais que apresentação bonita. Imobiliária pede foto/vídeo desde a primeira mensagem.

## Perguntas Frequentes

### WhatsApp funciona pra B2B grande?
Funciona pra agendar reunião, mas raramente fecha venda ali. Para ticket alto, WhatsApp é ponte pra call.

### Vale a pena pra SaaS?
Vale se o público for SMB. Para enterprise, o canal é email + LinkedIn.
$md$
),

-- ────────────────────────────────────────────────────────────────────
-- SATELLITE: Caixa de Entrada
-- ────────────────────────────────────────────────────────────────────
(
  'caixa-entrada-whatsapp-unica',
  'Caixa de entrada única: como atender 5 números de WhatsApp em um só lugar',
  'Operação com vários números vira caos em horas. Veja como centralizar tudo numa inbox só, sem perder mensagem nem contexto.',
  'Caixa de Entrada',
  'Caixa de Entrada',
  'satellite',
  NULL,
  '4 min',
  750,
  'Organize o atendimento de múltiplos números de WhatsApp em uma única caixa de entrada unificada.',
  ARRAY['caixa entrada whatsapp', 'inbox whatsapp', 'multiatendimento', 'time de vendas'],
  $md$
Quando você tem 1 vendedor, WhatsApp Business resolve. Quando tem 3, começa a virar problema. Quando tem 5, a operação está em chamas: cliente respondendo no celular A, vendedor B sem contexto, gerente sem ideia de quem falou com quem.

A solução é a **caixa de entrada unificada** — todos os números da empresa numa única tela, com histórico, atribuição e tags.

## O que uma inbox unificada resolve

- **Histórico centralizado** — qualquer vendedor abre a conversa e vê o passado completo.
- **Atribuição** — o lead que chegou pelo número da matriz pode ser roteado pro SDR certo.
- **Tags e filtros** — "aguardando resposta", "proposta enviada", "frio", "quente".
- **Métricas** — quantas mensagens foram respondidas em menos de 5 minutos? Quem demorou mais? Onde está o gargalo?

## Sem inbox unificada, o que quebra

1. **Lead esperando resposta** — a mensagem chegou no número que não tá aberto.
2. **Mensagens em duplicata** — 2 vendedores respondem o mesmo cliente sem saber.
3. **Histórico perdido** — vendedor sai da empresa e leva o celular.
4. **Impossível medir** — ninguém sabe quanto tempo a equipe leva pra responder.

## Como começar

### 1. Liste seus números
Matriz, filial, vendedor 1, vendedor 2, SDR. Tudo o que tem WhatsApp ativo.

### 2. Conecte à plataforma
Via QR Code, igual WhatsApp Web. Cada número vira uma "caixa" dentro da inbox única.

### 3. Defina atribuição
Regras simples: lead do número A vai pro vendedor A. Lead sem resposta em 30 min entra na fila geral.

### 4. Padronize tags
Máximo 8 tags. Mais que isso ninguém usa.

## Perguntas Frequentes

### Preciso da API oficial do WhatsApp?
Não. Inbox unificada funciona via integração por QR Code (gratuita) ou API (paga, recomendada acima de 10k mensagens/mês).

### Dá pra responder pelo celular normal?
Sim. O que você faz na inbox sincroniza com o celular e vice-versa.
$md$
),

-- ────────────────────────────────────────────────────────────────────
-- SATELLITE: IA WhatsApp
-- ────────────────────────────────────────────────────────────────────
(
  'chatbot-ia-whatsapp-qualifica-leads',
  'Chatbot com IA no WhatsApp: como qualificar leads enquanto você dorme',
  'Não é o chatbot engessado de 2015. Chatbot com IA entende contexto, responde como humano e entrega o lead pronto pra call.',
  'IA WhatsApp',
  'IA WhatsApp',
  'satellite',
  NULL,
  '5 min',
  1000,
  'Como implantar um chatbot com IA no WhatsApp que qualifica leads 24h por dia e agenda reuniões automaticamente.',
  ARRAY['chatbot ia whatsapp', 'gpt whatsapp', 'qualificação automática', 'bot vendas'],
  $md$
O chatbot que você conheceu em 2017 morreu. Aquele menu de opções ("Digite 1 para..."), script travado e cliente abandonando na terceira pergunta — tudo isso ficou na era pré-GPT. Em 2026, chatbot com IA **entende frase livre, respeita contexto e fecha reunião** sem o cliente perceber que era bot.

Este artigo explica o que mudou e como implementar.

## O que o bot moderno faz

- **Responde em linguagem natural** — sem menu, sem "digite 1".
- **Entende intenção** — "ainda tá rolando desconto?" é reconhecido como pedido de oferta.
- **Extrai dados na conversa** — nome, empresa, segmento, tamanho, dor — tudo capturado sem questionário.
- **Qualifica** — separa lead quente de lead frio baseado no que foi dito.
- **Agenda** — se o lead tá pronto, marca horário direto no calendário.
- **Entrega humano** — quando o lead pede pessoa, transfere com resumo do contexto pro vendedor certo.

## Onde o bot com IA brilha

### Fora do horário comercial
Lead chega 22h de sábado. Bot responde em 10 segundos com tom humano. Segunda-feira seu vendedor pega a conversa já com dados e disposição.

### Triagem de volume alto
1000 leads/dia é impossível atender no olho. Bot filtra os 800 que ainda não estão prontos, deixa os 200 quentes pra humano.

### FAQs repetitivas
"Quanto custa?", "Tem desconto?", "Funciona em Mac?" — perguntas que seu time responde 50x por dia viram 0.

## O que o bot NÃO faz (e tá tudo bem)

- **Fechar venda complexa** — venda técnica ou de alto ticket pede humano.
- **Negociar** — desconto além do padrão precisa de aprovação humana.
- **Entender gírias regionais muito específicas** — ainda escorrega em contextos muito locais.

## Como configurar

### 1. Defina o escopo
Liste o que o bot DEVE fazer: responder preço, capturar nome/email, marcar reunião. E o que NÃO deve: prometer desconto, discutir termos técnicos profundos, dar suporte.

### 2. Dê contexto de produto
Preço, benefícios, diferenciais, casos de uso, FAQ. Quanto mais detalhado, melhor responde.

### 3. Configure o "handoff"
Regra clara: quando cliente pede humano, quando bot não sabe, quando lead vira "hot" — transferir pro time.

### 4. Teste com casos reais
Use conversas antigas como teste. Se o bot responde igual ou melhor, pode soltar.

## Perguntas Frequentes

### Cliente percebe que é bot?
Bem configurado, não. Mas o mais importante é que ele seja útil — muita gente prefere bot rápido a humano demorado.

### E se o bot errar?
O handoff pra humano cobre. A regra é: dúvida, passa pra pessoa.

### Custo?
Bot roda em API OpenAI. Custo médio R$0,01–0,05 por conversa. Para 1000 conversas/mês, R$10–50.
$md$
),

-- ────────────────────────────────────────────────────────────────────
-- SATELLITE: Transacional
-- ────────────────────────────────────────────────────────────────────
(
  'comparativo-leadspro-vs-concorrentes',
  'LeadsPro vs outras ferramentas de prospecção: comparativo honesto em 2026',
  'Captura, disparo, CRM, follow-up, IA. Veja o que o LeadsPro faz diferente das alternativas populares do mercado.',
  'Transacional',
  'Transacional',
  'transactional',
  NULL,
  '6 min',
  1100,
  'Comparativo entre LeadsPro e as principais ferramentas de prospecção do mercado brasileiro em 2026.',
  ARRAY['comparativo ferramentas', 'leadspro vs', 'melhor ferramenta prospecção', 'alternativa'],
  $md$
Escolher ferramenta de prospecção em 2026 é uma dor. Tem ferramenta só de captura, só de disparo, só de CRM, só de chatbot — e você acaba pagando 4 assinaturas que não conversam entre si. Este artigo compara o LeadsPro com os 3 perfis de concorrente mais comuns e mostra onde cada um ganha ou perde.

## Perfil 1 — Extensões só de captura (tipo Hunter, Snov)

**Bom em:** captura de email B2B em massa, integração com CRMs americanos.

**Ruim em:** dados brasileiros (pobres), sem disparo, sem follow-up, sem CRM. Você captura e depois não tem pra onde levar.

**LeadsPro faz:** captura por CNAE no Google Maps + dispara + faz follow-up + guarda no CRM. Operação fecha num lugar só.

## Perfil 2 — Disparadores de WhatsApp avulsos

**Bom em:** mandar mensagem em massa. Ponto.

**Ruim em:** sem anti-ban real (variação falsa), sem base de leads (você precisa subir planilha), sem CRM, sem inbox. Quebra número em dias.

**LeadsPro faz:** variação de mensagem por IA real, intervalos randômicos, aquecimento automático. Mais a base, o CRM e a inbox juntos.

## Perfil 3 — CRMs genéricos (Pipedrive, RD, HubSpot)

**Bom em:** organização de funil, relatórios, integração de ferramentas.

**Ruim em:** não capturam leads, não disparam WhatsApp, não têm chatbot IA. Viram caro rápido — plano sério começa em R$300-500/mês sem incluir prospecção.

**LeadsPro faz:** CRM embutido, menos sofisticado que HubSpot, mas suficiente pra 95% das operações SMB — e não cobra separado.

## Tabela-resumo

| Feature | LeadsPro | Extensões captura | Disparadores | CRMs |
|---|---|---|---|---|
| Captura Google Maps | ✅ | ⚠️ limitado | ❌ | ❌ |
| Disparo em massa WhatsApp | ✅ com anti-ban | ❌ | ⚠️ sem anti-ban real | ❌ |
| Follow-up automático | ✅ | ❌ | ⚠️ básico | ⚠️ via integração |
| CRM integrado | ✅ | ❌ | ❌ | ✅ |
| Chatbot IA | ✅ | ❌ | ❌ | ⚠️ add-on |
| Email marketing | ✅ | ❌ | ❌ | ⚠️ add-on |
| Preço (SMB) | R$97–397 | US$49–99 | R$197+ | R$300–500+ |

## Quando NÃO é LeadsPro

Se você opera B2B enterprise ticket alto, com ciclo de venda de 6 meses e comitê de compra — provavelmente o fit é HubSpot/Salesforce, não o LeadsPro. LeadsPro é desenhado pra velocidade e volume de SMB, não pra venda técnica longa.

## Perguntas Frequentes

### LeadsPro tem integração com outros CRMs?
Exportação CSV sim. Integração nativa com HubSpot/Pipedrive está no roadmap.

### Dá pra testar antes?
Sim, 2 horas de acesso gratuito a tudo, sem cartão.
$md$
),

-- ────────────────────────────────────────────────────────────────────
-- SATELLITE: Internacional
-- ────────────────────────────────────────────────────────────────────
(
  'prospeccao-whatsapp-internacional',
  'Prospecção internacional pelo WhatsApp: o que muda fora do Brasil',
  'WhatsApp é global, mas cada mercado tem regras próprias. Veja o que muda em Portugal, México, Argentina e Estados Unidos.',
  'Internacional',
  'Internacional',
  'international',
  NULL,
  '5 min',
  900,
  'Como adaptar sua prospecção por WhatsApp para Portugal, México, Argentina e Estados Unidos em 2026.',
  ARRAY['prospecção internacional', 'whatsapp portugal', 'whatsapp mexico', 'whatsapp eua', 'b2b global'],
  $md$
O WhatsApp tem 2 bilhões de usuários em 180 países, mas a intensidade de uso — e o que é aceito em abordagem fria — muda radicalmente de mercado pra mercado. Este artigo sintetiza o que você precisa saber antes de disparar pra fora do Brasil.

## Portugal

**Adoção:** alta, próxima à brasileira. Empresas usam WhatsApp Business.

**O que muda:** linguagem mais formal no primeiro contato. "Bom dia, espero que se encontre bem" soa natural. "E aí, beleza?" soa invasivo.

**Regulação:** RGPD (LGPD europeia) é rigorosa. Para B2B é permitido desde que haja legítimo interesse e opt-out claro.

## México

**Adoção:** enorme, maior que a brasileira em alguns segmentos. É o canal #1 pra SMB.

**O que muda:** tom caloroso e pessoal funciona bem. Espanhol neutro com toque mexicano ("platiquemos", "¿me platicas?") gera mais resposta que espanhol formal da Espanha.

**Regulação:** lei federal de proteção de dados é moderada. Menos restritiva que RGPD.

## Argentina

**Adoção:** alta, mas com particularidades. Telegram é forte também.

**O que muda:** vocabulário local ("che", "¿cómo andás?", "bárbaro") aproxima. Usar espanhol neutro passa como estrangeiro vendendo.

**Regulação:** Ley 25.326. Opt-out obrigatório.

## Estados Unidos

**Adoção:** baixa para B2B comparado à América Latina. Executivos usam iMessage, SMS e LinkedIn.

**O que muda:** não use WhatsApp como canal primário. Use LinkedIn ou email primeiro; WhatsApp só depois de relacionamento estabelecido, e apenas com consentimento explícito.

**Regulação:** TCPA proíbe mensagens comerciais sem opt-in expresso. Multas altíssimas (US$500-1500 por mensagem). Evite prospecção fria por WhatsApp nos EUA.

## Regra geral para qualquer país

1. **Sempre respeite fuso horário** — nunca envia fora de horário comercial local.
2. **Use idioma e vocabulário local** — tradução automática vaza, parece spam.
3. **Declare de onde veio o contato** — "encontrei seu perfil em...". Transparência reduz denúncia.
4. **Tenha opt-out explícito** — uma linha: "responda SAIR pra não receber mais".

## Perguntas Frequentes

### Preciso de número local?
Idealmente sim. Número brasileiro mandando pra Portugal cai em spam mais rápido. Chip local ou API com DDI local é o caminho.

### WhatsApp Business funciona em qualquer país?
Sim, o app é o mesmo. Só a API tem restrições por mercado.

### E idiomas não-latinos (inglês, francês, alemão)?
Funciona tecnicamente, mas culturalmente WhatsApp é canal comercial marginal em mercados anglófonos e da Europa Ocidental. Priorize email/LinkedIn.
$md$
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  category = EXCLUDED.category,
  cluster = EXCLUDED.cluster,
  page_type = EXCLUDED.page_type,
  parent_slug = EXCLUDED.parent_slug,
  read_time = EXCLUDED.read_time,
  word_count = EXCLUDED.word_count,
  meta_description = EXCLUDED.meta_description,
  keywords = EXCLUDED.keywords,
  content = EXCLUDED.content;

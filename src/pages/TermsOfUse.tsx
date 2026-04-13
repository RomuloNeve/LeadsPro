import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsOfUse = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8 text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>

        <h1 className="text-3xl font-bold font-display text-foreground mb-2">Termos de Uso e Política de Reembolso</h1>
        <p className="text-sm text-muted-foreground mb-10">Última atualização: 01 de março de 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Objeto</h2>
            <p>
               Os presentes Termos regulam a aquisição e o uso da plataforma digital <strong>LeadsPro</strong>, 
               incluindo a extensão para Google Chrome, o painel de controle (dashboard) e todas as funcionalidades 
               associadas (captura de leads, disparo em massa, follow-ups automáticos, exportação de dados, entre outras).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Natureza do Produto</h2>
            <p>
              O LeadsPro é um <strong>produto digital de entrega imediata</strong>. Ao concluir o pagamento, 
              o acesso à plataforma, à extensão e a todas as funcionalidades é disponibilizado <strong>instantaneamente</strong>, 
              sem necessidade de envio físico ou prazo de entrega.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Política de Reembolso — Fundamentação Legal</h2>
            <p>
              De acordo com o <strong>Art. 49 do Código de Defesa do Consumidor (Lei nº 8.078/1990)</strong>, o consumidor 
              pode exercer o direito de arrependimento no prazo de 7 (sete) dias a contar da contratação ou do recebimento 
              do produto, quando a compra ocorrer fora do estabelecimento comercial (incluindo compras pela internet).
            </p>
            <p>
              No entanto, conforme entendimento consolidado pela jurisprudência brasileira e pelo <strong>Art. 49, parágrafo único, 
              do CDC</strong>, combinado com o <strong>Art. 16, inciso I, do Decreto nº 7.962/2013</strong> (que regulamenta o 
              comércio eletrônico), o direito de arrependimento <strong>não se aplica</strong> quando:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                O produto ou serviço digital foi <strong>integralmente entregue e acessado</strong> de forma imediata após a 
                confirmação do pagamento;
              </li>
              <li>
                O consumidor foi <strong>previamente informado</strong>, de forma clara e ostensiva, sobre a natureza digital 
                do produto e a entrega imediata;
              </li>
              <li>
                O consumidor <strong>manifestou expressamente seu consentimento</strong> com a disponibilização imediata, 
                ciente de que isso implica na perda do direito de arrependimento.
              </li>
            </ul>
            <p className="mt-4">
              Essa interpretação é corroborada pela <strong>Diretiva 2011/83/UE do Parlamento Europeu</strong> (Art. 16, alínea "m"), 
              amplamente utilizada como referência pela doutrina brasileira, que expressamente exclui o direito de arrependimento 
              para conteúdos digitais cuja execução tenha sido iniciada com o consentimento prévio do consumidor.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Consentimento do Consumidor</h2>
            <p>
              Ao marcar a caixa <strong>"Li e aceito os Termos de Uso e Política de Reembolso"</strong> na página de 
              pagamento, o consumidor declara expressamente que:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Está ciente de que o LeadsPro é um produto digital de entrega imediata;</li>
              <li>Concorda com a disponibilização instantânea do acesso após a confirmação do pagamento;</li>
              <li>
                Compreende que, ao acessar o produto, estará <strong>renunciando ao direito de arrependimento</strong> previsto 
                no Art. 49 do CDC, nos termos da legislação vigente;
              </li>
              <li>
                Leu, compreendeu e aceita integralmente os presentes Termos de Uso e Política de Reembolso.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Exceções</h2>
            <p>
              O reembolso poderá ser concedido <strong>excepcionalmente</strong> nos seguintes casos:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Falha técnica comprovada que impeça o acesso ao produto por mais de 48 horas consecutivas, sem solução pela equipe de suporte;</li>
              <li>Cobrança indevida ou duplicada, devidamente comprovada;</li>
              <li>Produto substancialmente diferente do descrito na página de venda.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Uso da Plataforma</h2>
            <p>
              O usuário compromete-se a utilizar o LeadsPro em conformidade com a legislação brasileira, 
              incluindo, mas não se limitando à <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD)</strong>. 
              O uso da ferramenta para fins ilícitos, envio de spam ou qualquer atividade que viole direitos de terceiros 
              poderá resultar na suspensão ou cancelamento do acesso, sem direito a reembolso.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo, código-fonte, design, marca e funcionalidades do LeadsPro são protegidos 
              pela <strong>Lei nº 9.610/1998 (Direitos Autorais)</strong> e pela <strong>Lei nº 9.609/1998 (Software)</strong>. 
              É vedada a reprodução, engenharia reversa, distribuição ou comercialização sem autorização expressa.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Foro</h2>
            <p>
              Fica eleito o foro da comarca do domicílio do consumidor para dirimir quaisquer controvérsias 
              decorrentes destes Termos, conforme previsto no <strong>Art. 101, inciso I, do Código de Defesa do Consumidor</strong>.
            </p>
          </section>

          <section className="border-t border-border pt-6">
            <p className="text-xs text-muted-foreground">
              Ao prosseguir com a compra, o consumidor declara ter lido e compreendido integralmente os presentes 
              Termos de Uso e Política de Reembolso, manifestando seu consentimento livre, informado e inequívoco.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;

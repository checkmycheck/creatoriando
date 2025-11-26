import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Termos de Uso</CardTitle>
            <CardDescription>Última atualização: {new Date().toLocaleDateString('pt-BR')}</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-4">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground">
                Ao acessar e usar o Creator IA, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
                Se você não concordar com qualquer parte destes termos, não deve usar nossos serviços.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Descrição do Serviço</h2>
              <p className="text-muted-foreground">
                O Creator IA é uma plataforma de criação de personagens para vídeos usando inteligência artificial. 
                Oferecemos ferramentas para gerar prompts detalhados para criação de conteúdo em vídeo.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Contas de Usuário</h2>
              <p className="text-muted-foreground">
                Para usar nossos serviços, você deve criar uma conta fornecendo informações precisas e completas. 
                Você é responsável por manter a confidencialidade de sua conta e senha.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
                <li>Cada usuário pode criar apenas uma conta</li>
                <li>Contas não podem ser compartilhadas ou transferidas</li>
                <li>Você deve ter pelo menos 18 anos para criar uma conta</li>
                <li>É proibido criar contas com informações falsas</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Sistema de Créditos</h2>
              <p className="text-muted-foreground">
                O Creator IA utiliza um sistema de créditos para criação de personagens:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
                <li>Novos usuários recebem 1 crédito gratuito ao se cadastrar</li>
                <li>Cada indicação bem-sucedida concede 3 créditos para o indicador e 3 para o indicado</li>
                <li>Créditos podem ser adquiridos através de pacotes pagos</li>
                <li>Créditos não são reembolsáveis</li>
                <li>Créditos não possuem data de validade</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Período de Acesso</h2>
              <p className="text-muted-foreground">
                As contas de usuário têm um período de acesso de 1 ano a partir da data de cadastro. 
                Após esse período, o acesso será bloqueado. Para renovar o acesso, entre em contato com nosso suporte.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Uso Aceitável</h2>
              <p className="text-muted-foreground">
                Você concorda em usar o Creator IA apenas para fins legais e de acordo com estes Termos. É proibido:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
                <li>Criar conteúdo ofensivo, difamatório ou ilegal</li>
                <li>Violar direitos de propriedade intelectual de terceiros</li>
                <li>Tentar obter acesso não autorizado aos nossos sistemas</li>
                <li>Usar o serviço para spam ou atividades fraudulentas</li>
                <li>Revender ou redistribuir nossos serviços sem autorização</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Propriedade Intelectual</h2>
              <p className="text-muted-foreground">
                Os personagens e prompts criados através do Creator IA são de propriedade do usuário que os criou. 
                O Creator IA mantém os direitos sobre a plataforma, tecnologia e marca.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Modificações do Serviço</h2>
              <p className="text-muted-foreground">
                Reservamo-nos o direito de modificar ou descontinuar, temporária ou permanentemente, o serviço 
                (ou qualquer parte dele) com ou sem aviso prévio.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Limitação de Responsabilidade</h2>
              <p className="text-muted-foreground">
                O Creator IA é fornecido "como está". Não garantimos que o serviço será ininterrupto ou livre de erros. 
                Não nos responsabilizamos por danos indiretos, incidentais ou consequenciais.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Contato</h2>
              <p className="text-muted-foreground">
                Para dúvidas sobre estes Termos de Uso, entre em contato através do email: suporte@creatoria.com.br
              </p>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Política de Privacidade</CardTitle>
            <CardDescription>Última atualização: {new Date().toLocaleDateString('pt-BR')}</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-4">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Informações Coletadas</h2>
              <p className="text-muted-foreground">
                Coletamos as seguintes informações quando você usa o Creator IA:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
                <li><strong>Informações de Cadastro:</strong> Nome completo, email, CPF</li>
                <li><strong>Dados de Uso:</strong> Personagens criados, prompts gerados, histórico de créditos</li>
                <li><strong>Informações Técnicas:</strong> Endereço IP, navegador, dispositivo</li>
                <li><strong>Dados de Pagamento:</strong> Processados através do Mercado Pago (não armazenamos dados de cartão)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Como Usamos Suas Informações</h2>
              <p className="text-muted-foreground">
                Utilizamos suas informações para:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
                <li>Fornecer e melhorar nossos serviços</li>
                <li>Processar transações e gerenciar créditos</li>
                <li>Comunicar atualizações e novidades</li>
                <li>Prevenir fraudes e garantir segurança</li>
                <li>Cumprir obrigações legais</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Compartilhamento de Dados</h2>
              <p className="text-muted-foreground">
                Não vendemos suas informações pessoais. Podemos compartilhar dados apenas com:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
                <li>Provedores de serviços (hospedagem, pagamentos)</li>
                <li>Autoridades legais quando exigido por lei</li>
                <li>Parceiros autorizados com seu consentimento explícito</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Segurança dos Dados</h2>
              <p className="text-muted-foreground">
                Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações, incluindo:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
                <li>Criptografia de dados em trânsito e em repouso</li>
                <li>Controles de acesso restrito</li>
                <li>Monitoramento contínuo de segurança</li>
                <li>Backups regulares</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Seus Direitos (LGPD)</h2>
              <p className="text-muted-foreground">
                De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
                <li>Confirmar a existência de tratamento de dados</li>
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li>Solicitar a anonimização, bloqueio ou eliminação de dados</li>
                <li>Revogar consentimento a qualquer momento</li>
                <li>Obter informações sobre compartilhamento de dados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Retenção de Dados</h2>
              <p className="text-muted-foreground">
                Mantemos suas informações pelo período necessário para fornecer nossos serviços e cumprir obrigações legais. 
                Após 1 ano de inatividade ou solicitação de exclusão, seus dados serão removidos ou anonimizados.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Cookies</h2>
              <p className="text-muted-foreground">
                Utilizamos cookies essenciais para funcionamento da plataforma. Você pode gerenciar preferências de cookies 
                nas configurações do seu navegador.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Alterações na Política</h2>
              <p className="text-muted-foreground">
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre mudanças significativas 
                por email ou através da plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Contato do Encarregado de Dados</h2>
              <p className="text-muted-foreground">
                Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato com nosso 
                Encarregado de Proteção de Dados (DPO) através do email: dpo@creatoria.com.br
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState, useEffect } from "react";
import { useLandingContent } from "@/hooks/useLandingContent";

const defaultFaqs = [
  {
    question: "Como funciona o Creator IA?",
    answer: "O Creator IA é um wizard guiado que te ajuda a configurar cada detalhe do seu personagem de vídeo em 13 etapas. Você escolhe gênero, idade, visual, ambiente, postura e muito mais. No final, geramos um prompt profissional otimizado para plataformas de IA de vídeo.",
  },
  {
    question: "Preciso ter conhecimento técnico para usar?",
    answer: "Não! O Creator IA foi desenvolvido para ser super intuitivo. Nosso wizard guia você passo a passo, e você só precisa fazer escolhas simples. Não é necessário nenhum conhecimento técnico ou de prompts de IA.",
  },
  {
    question: "Posso salvar meus personagens?",
    answer: "Sim! Ao criar uma conta gratuita, você pode salvar quantos personagens quiser e acessá-los a qualquer momento. Você também pode favoritar os personagens mais importantes para acesso rápido.",
  },
  {
    question: "O prompt funciona em qual plataforma?",
    answer: "Os prompts gerados são otimizados para o Google Flow e outras plataformas de geração de vídeo com IA. O formato XML segue o padrão Veo3 para garantir compatibilidade máxima.",
  },
  {
    question: "Quanto custa usar o Creator IA?",
    answer: "Oferecemos um plano gratuito com funcionalidades básicas e planos pagos com recursos avançados como geração ilimitada de personagens, suporte prioritário e acesso antecipado a novas funcionalidades.",
  },
  {
    question: "Posso editar um personagem depois de criado?",
    answer: "Sim! Você pode acessar seus personagens salvos e visualizar todos os detalhes configurados. Em breve, adicionaremos a funcionalidade de edição completa.",
  },
];

export const FAQ = () => {
  const { content, loading } = useLandingContent("faq");
  const [faqs, setFaqs] = useState(defaultFaqs);

  useEffect(() => {
    if (content.length > 0 && content[0].content?.items) {
      setFaqs(content[0].content.items);
    }
  }, [content]);

  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-muted-foreground text-lg">
            Tire suas dúvidas sobre o Creator IA
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-card border border-border rounded-lg px-6"
            >
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-semibold text-foreground">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";

const testimonials = [
  {
    name: "Maria Silva",
    role: "Criadora de Conteúdo",
    avatar: "MS",
    rating: 5,
    text: "O Creator IA revolucionou meu trabalho! Consigo criar personagens profissionais em minutos. Meus clientes adoram a qualidade dos vídeos.",
  },
  {
    name: "João Santos",
    role: "Social Media Manager",
    avatar: "JS",
    rating: 5,
    text: "Ferramenta incrível! A facilidade de configurar cada detalhe do personagem economiza horas de trabalho. Super recomendo!",
  },
  {
    name: "Ana Oliveira",
    role: "Influenciadora Digital",
    avatar: "AO",
    rating: 5,
    text: "Uso o Creator IA para todos os meus vídeos de UGC. A qualidade dos prompts é profissional e os resultados são impressionantes!",
  },
];

export const Testimonials = () => {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            O que nossos usuários dizem
          </h2>
          <p className="text-muted-foreground text-lg">
            Junte-se a centenas de criadores que já transformaram seu conteúdo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-1 text-lime">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>

              <p className="text-foreground leading-relaxed">
                "{testimonial.text}"
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-12 h-12 rounded-full bg-lime/10 flex items-center justify-center text-lime font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

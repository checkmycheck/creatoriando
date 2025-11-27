-- Create landing_content table for CMS
CREATE TABLE IF NOT EXISTS public.landing_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL, -- 'hero', 'features', 'testimonials', 'faq', 'video'
  content JSONB NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_content ENABLE ROW LEVEL SECURITY;

-- Anyone can view active content
CREATE POLICY "Anyone can view active landing content"
  ON public.landing_content
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage landing content
CREATE POLICY "Only admins can manage landing content"
  ON public.landing_content
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_landing_content_updated_at
  BEFORE UPDATE ON public.landing_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default content for hero section
INSERT INTO public.landing_content (section, content, display_order) VALUES
('hero', '{
  "badge": "✨ IA para Criadores de Conteúdo",
  "title": "Crie personagens de vídeo perfeitos com IA",
  "subtitle": "Configure todos os detalhes do seu personagem em minutos e gere prompts profissionais otimizados para Google Flow",
  "primaryButton": "Criar Personagem",
  "secondaryButton": "Ver Exemplos"
}'::jsonb, 0),

('features', '{
  "title": "Por que escolher Creator IA?",
  "subtitle": "Tudo que você precisa para criar vídeos profissionais",
  "items": [
    {
      "icon": "Zap",
      "title": "Rápido e Intuitivo",
      "description": "Wizard guiado com 13 etapas simples para configurar cada detalhe"
    },
    {
      "icon": "Settings",
      "title": "13 Configurações",
      "description": "Controle completo: gênero, idade, ambiente, iluminação, voz e muito mais"
    },
    {
      "icon": "Sparkles",
      "title": "Prompts Profissionais",
      "description": "Prompts XML otimizados para Veo3 e Google Flow, prontos para usar"
    }
  ]
}'::jsonb, 0),

('video', '{
  "title": "Veja o Creator IA em ação",
  "subtitle": "Assista como é fácil criar personagens profissionais",
  "videoUrl": "",
  "duration": "3:24",
  "tip": "💡 Dica: O vídeo mostra todas as 13 etapas do wizard de criação"
}'::jsonb, 0);
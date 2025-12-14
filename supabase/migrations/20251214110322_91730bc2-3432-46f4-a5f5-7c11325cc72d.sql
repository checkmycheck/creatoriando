-- Create storage bucket for generator reference images
INSERT INTO storage.buckets (id, name, public) VALUES ('generator-references', 'generator-references', true);

-- Storage policies for generator references
CREATE POLICY "Users can upload their own generator references"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'generator-references' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own generator references"
ON storage.objects FOR SELECT
USING (bucket_id = 'generator-references' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own generator references"
ON storage.objects FOR DELETE
USING (bucket_id = 'generator-references' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create custom_generators table
CREATE TABLE public.custom_generators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  scenario_image_url TEXT,
  scenario_description TEXT,
  character_image_url TEXT,
  character_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_generators ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own generators"
ON public.custom_generators FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generators"
ON public.custom_generators FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generators"
ON public.custom_generators FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generators"
ON public.custom_generators FOR DELETE
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_custom_generators_updated_at
BEFORE UPDATE ON public.custom_generators
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add generator_id to characters table to track which generator created them
ALTER TABLE public.characters ADD COLUMN generator_id UUID REFERENCES public.custom_generators(id) ON DELETE SET NULL;
-- Create credit packages table
CREATE TABLE public.credit_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credits integer NOT NULL,
  price_brl numeric(10,2) NOT NULL,
  is_popular boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

-- Everyone can view active packages
CREATE POLICY "Anyone can view active credit packages"
ON public.credit_packages
FOR SELECT
USING (is_active = true);

-- Only admins can modify packages
CREATE POLICY "Only admins can manage credit packages"
ON public.credit_packages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_credit_packages_updated_at
BEFORE UPDATE ON public.credit_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default packages
INSERT INTO public.credit_packages (credits, price_brl, is_popular, display_order) VALUES
  (10, 2.00, false, 1),
  (20, 5.00, false, 2),
  (50, 10.00, true, 3),
  (200, 20.00, false, 4);
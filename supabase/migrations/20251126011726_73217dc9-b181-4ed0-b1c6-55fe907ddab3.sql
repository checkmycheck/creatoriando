-- Add is_favorite column to characters table
ALTER TABLE public.characters 
ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster filtering of favorite characters
CREATE INDEX idx_characters_is_favorite ON public.characters(user_id, is_favorite) WHERE is_favorite = true;

-- Add comment for documentation
COMMENT ON COLUMN public.characters.is_favorite IS 'Indicates if the character is marked as favorite by the user';
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'KZT';

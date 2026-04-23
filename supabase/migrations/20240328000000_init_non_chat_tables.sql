-- 1. Profiles table to store user metadata
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Trigger to automatically create a profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Content table (Existing)
CREATE TABLE IF NOT EXISTS public.app_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.app_content ENABLE ROW LEVEL SECURITY;

-- Policy (Update)
DROP POLICY IF EXISTS "Allow public read access to app_content" ON public.app_content;
CREATE POLICY "Allow public read access to app_content"
ON public.app_content FOR SELECT USING (true);

-- 4. Initial content
INSERT INTO public.app_content (category, title, description)
VALUES 
('therapy', 'Deep Emotional Cleansing', 'Guided sessions designed to help you identify, acknowledge, and gently release suppressed feelings in a safe environment.'),
('service', 'Guided Care', '1-on-1 support for complex transitions.'),
('service', 'The Sanctuary', '24/7 access to meditative soundscapes.')
ON CONFLICT DO NOTHING;

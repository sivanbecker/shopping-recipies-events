-- Migration 018: Create tools table

CREATE TABLE public.tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label_he text NOT NULL,
  label_en text NOT NULL,
  created_at timestamptz DEFAULT now()
);

INSERT INTO public.tools (key, label_he, label_en) VALUES
  ('oven',       'תנור',   'Oven'),
  ('stovetop',   'כיריים', 'Stovetop'),
  ('pot',        'סיר',    'Pot'),
  ('pan',        'מחבת',   'Pan'),
  ('bakingTray', 'תבנית',  'Baking tray'),
  ('blender',    'בלנדר',  'Blender'),
  ('mixer',      'מיקסר',  'Mixer');

ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tools are readable by everyone"
  ON public.tools FOR SELECT USING (true);

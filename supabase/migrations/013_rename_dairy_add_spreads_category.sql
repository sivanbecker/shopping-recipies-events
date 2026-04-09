-- Migration 013: Rename dairy category and add spreads category

-- Rename מוצרי חלב → ביצים ומוצרי חלב (existing products stay linked via same id)
UPDATE public.categories
SET
  name_he = 'ביצים ומוצרי חלב',
  name_en = 'Eggs & Dairy'
WHERE name_he = 'מוצרי חלב';

-- Add new spreads category
INSERT INTO public.categories (name_he, name_en, icon, color, sort_order) VALUES
  ('ממרחים', 'Spreads', '🫙', '#a16207', 15);

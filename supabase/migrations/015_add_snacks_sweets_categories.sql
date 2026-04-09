-- Migration 015: Add חטיפים and מתוקים categories

INSERT INTO public.categories (name_he, name_en, icon, color, sort_order) VALUES
  ('חטיפים', 'Snacks', '🍿', '#f97316', 17),
  ('מתוקים', 'Sweets', '🍬', '#ec4899', 18);

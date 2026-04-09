-- Migration 016: Add נייר ומוצרים לבית category

INSERT INTO public.categories (name_he, name_en, icon, color, sort_order) VALUES
  ('נייר ומוצרים לבית', 'Paper & Household', '🧻', '#0891b2', 19);

-- Migration 010: Add baking category

INSERT INTO public.categories (name_he, name_en, icon, color, sort_order) VALUES
  ('אפיה', 'Baking', '🍰', '#f59e0b', 13);

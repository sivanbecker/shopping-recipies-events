-- Migration 014: Add פארם (Farm) category

INSERT INTO public.categories (name_he, name_en, icon, color, sort_order) VALUES
  ('פארם', 'Pharm', '🌾', '#15803d', 16);

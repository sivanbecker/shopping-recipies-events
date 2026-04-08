-- Migration 011: Add basic products category

INSERT INTO public.categories (name_he, name_en, icon, color, sort_order) VALUES
  ('מוצרי יסוד', 'Basic Products', '📦', '#8b5cf6', 14);

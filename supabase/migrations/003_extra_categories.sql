-- Migration 003: Extra categories

insert into public.categories (name_he, name_en, icon, color, sort_order) values
  ('בריאות ותרופות', 'Health & Pharmacy', '💊', '#ec4899', 11),
  ('מתכלים',         'Perishables',        '🕐', '#f43f5e', 12);

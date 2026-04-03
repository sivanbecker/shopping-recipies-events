-- =====================================================
-- Migration 002: Seed — Categories & Unit Types
-- =====================================================

-- Categories
insert into public.categories (name_he, name_en, icon, color, sort_order) values
  ('פירות וירקות',  'Fruits & Vegetables', '🥦', '#22c55e', 1),
  ('בשר ודגים',     'Meat & Fish',          '🥩', '#ef4444', 2),
  ('מוצרי חלב',    'Dairy',                '🥛', '#3b82f6', 3),
  ('לחם ומאפים',   'Bread & Bakery',        '🍞', '#f59e0b', 4),
  ('תבלינים ורטבים', 'Spices & Sauces',    '🧂', '#f97316', 5),
  ('שימורים ויבשים', 'Canned & Dry Goods', '🥫', '#a78bfa', 6),
  ('שתייה',         'Beverages',            '🥤', '#06b6d4', 7),
  ('קפואים',        'Frozen',               '🧊', '#60a5fa', 8),
  ('ניקיון',        'Cleaning',             '🧹', '#10b981', 9),
  ('אחר',           'Other',                '🛒', '#6b7280', 10);

-- Unit Types
insert into public.unit_types (code, label_he, label_en, type) values
  -- Count
  ('unit',       'יחידות',         'units',       'count'),
  ('container',  'גביע/אריז',      'container',   'count'),
  ('pack',       'חבילה',          'pack',        'count'),
  -- Weight
  ('gram',       'גרם',            'g',           'weight'),
  ('kg',         'ק"ג',            'kg',          'weight'),
  -- Volume
  ('ml',         'מ"ל',            'ml',          'volume'),
  ('liter',      'ליטר',           'liter',       'volume'),
  -- Cooking measures
  ('tsp',        'כפית',           'tsp',         'cooking'),
  ('half_tsp',   'חצי כפית',       '½ tsp',       'cooking'),
  ('quarter_tsp','רבע כפית',       '¼ tsp',       'cooking'),
  ('tbsp',       'כף',             'tbsp',        'cooking'),
  ('two_tbsp',   'שתי כפות',       '2 tbsp',      'cooking'),
  ('cup',        'כוס',            'cup',         'cooking'),
  ('half_cup',   'חצי כוס',        '½ cup',       'cooking'),
  ('third_cup',  'שליש כוס',       '⅓ cup',       'cooking'),
  ('quarter_cup','רבע כוס',        '¼ cup',       'cooking');

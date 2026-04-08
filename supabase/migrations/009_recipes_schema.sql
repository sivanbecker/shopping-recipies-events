-- Create recipes table
CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  servings int NOT NULL DEFAULT 4,
  prep_time_minutes int,
  tools text[] NOT NULL DEFAULT '{}',
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create recipe_ingredients table
CREATE TABLE recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity decimal NOT NULL DEFAULT 1,
  unit_id uuid REFERENCES unit_types(id),
  note text,
  substitute_group_id int,
  sort_order int NOT NULL DEFAULT 0
);

-- Create recipe_steps table
CREATE TABLE recipe_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number int NOT NULL,
  description text NOT NULL
);

-- Add actual FK for shopping_items.recipe_id (was a stub in migration 001)
ALTER TABLE shopping_items
  ADD CONSTRAINT shopping_items_recipe_id_fkey
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recipes table
CREATE POLICY "recipes_select" ON recipes FOR SELECT TO authenticated
  USING (is_shared = true OR owner_id = auth.uid());

CREATE POLICY "recipes_insert" ON recipes FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "recipes_update" ON recipes FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "recipes_delete" ON recipes FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- RLS Policies for recipe_ingredients table
CREATE POLICY "recipe_ingredients_select" ON recipe_ingredients FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND (r.is_shared = true OR r.owner_id = auth.uid())));

CREATE POLICY "recipe_ingredients_write" ON recipe_ingredients FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.owner_id = auth.uid()));

-- RLS Policies for recipe_steps table
CREATE POLICY "recipe_steps_select" ON recipe_steps FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND (r.is_shared = true OR r.owner_id = auth.uid())));

CREATE POLICY "recipe_steps_write" ON recipe_steps FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.owner_id = auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_recipes_owner_id ON recipes(owner_id);
CREATE INDEX idx_recipes_is_shared ON recipes(is_shared);
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_product_id ON recipe_ingredients(product_id);
CREATE INDEX idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);

-- Add shopping unit conversion fields to recipe_ingredients
-- Allows recipes to use precise cooking measurements while converting to shopping units

ALTER TABLE recipe_ingredients
  ADD COLUMN shopping_unit_id uuid REFERENCES unit_types(id),
  ADD COLUMN shopping_quantity_multiplier decimal NOT NULL DEFAULT 1.0;

-- Create index on shopping_unit_id for performance
CREATE INDEX idx_recipe_ingredients_shopping_unit_id ON recipe_ingredients(shopping_unit_id);

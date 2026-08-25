CREATE INDEX cosing_ingredients_lower_name_idx ON ingredient_ref.cosing_ingredients (lower(name));
CREATE INDEX cosing_ingredients_cas_no_idx ON ingredient_ref.cosing_ingredients (cas_no) WHERE cas_no IS NOT NULL;

ALTER TABLE ingredient_ref.cosing_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cosing_ingredients_public_read" ON ingredient_ref.cosing_ingredients FOR SELECT USING (true);

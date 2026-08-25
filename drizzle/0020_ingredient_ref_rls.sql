CREATE INDEX cosing_ingredients_lower_inci_name_idx ON ingredient_ref.cosing_ingredients (lower(inci_name));
CREATE INDEX cosing_ingredients_cas_no_idx ON ingredient_ref.cosing_ingredients (cas_no) WHERE cas_no IS NOT NULL;
CREATE INDEX cosing_ingredients_functions_gin_idx ON ingredient_ref.cosing_ingredients USING gin (functions);

ALTER TABLE ingredient_ref.cosing_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cosing_ingredients_public_read" ON ingredient_ref.cosing_ingredients FOR SELECT USING (true);

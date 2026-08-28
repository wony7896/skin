import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const productId = "9d4ef720-be30-44f4-96cf-e20a24a8ca7e";

async function insertDirect(inciName, casNumber) {
  const created = await sql`
    INSERT INTO ingredients (inci_name, cas_number, restriction, is_eu_prohibited, is_restricted_fragrance,
       is_known_fragrance_allergen, is_uv_filter, is_approved_preservative)
    VALUES (${inciName}, ${casNumber}, NULL, false, false, false, false, false)
    ON CONFLICT (inci_name) DO NOTHING
    RETURNING id
  `;
  if (created[0]) return created[0].id;
  const race = await sql`SELECT id FROM ingredients WHERE inci_name = ${inciName} LIMIT 1`;
  return race[0]?.id ?? null;
}

async function addAliasAndLink(koreanName, ingredientId, position) {
  const existing = await sql`SELECT id FROM ingredient_aliases WHERE alias = ${koreanName}`;
  if (existing.length === 0) {
    await sql`INSERT INTO ingredient_aliases (ingredient_id, alias) VALUES (${ingredientId}, ${koreanName})`;
  }
  const existingRow = await sql`
    SELECT 1 FROM product_ingredients WHERE product_id = ${productId} AND position = ${position}
  `;
  if (existingRow.length === 0) {
    await sql`
      INSERT INTO product_ingredients (product_id, ingredient_id, position)
      VALUES (${productId}, ${ingredientId}, ${position})
    `;
  }
}

const results = {};

// 타라열매추출물 (Caesalpinia Spinosa Fruit Extract) — KCIA-only entry, no CosIng match, no CAS on file.
{
  const id = await insertDirect("Caesalpinia Spinosa Fruit Extract", null);
  await addAliasAndLink("타라열매추출물", id, 27);
  results["타라열매추출물"] = id;
}

// 밀몽화꽃추출물 (Buddleja Officinalis Flower Extract) — KCIA CAS 2072850-95-2, no CosIng match.
{
  const id = await insertDirect("Buddleja Officinalis Flower Extract", "2072850-95-2");
  await addAliasAndLink("밀몽화꽃추출물", id, 33);
  results["밀몽화꽃추출물"] = id;
}

console.log(JSON.stringify(results, null, 2));
await sql.end();

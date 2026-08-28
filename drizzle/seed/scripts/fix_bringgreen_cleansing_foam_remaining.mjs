import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const productId = "5ff24edf-5f23-4ae3-8e11-36d5ea9c132b";

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

// 왕대수액 (Phyllostachys Bambusoides Juice) — KCIA-only entry, no CosIng match, no CAS on file.
{
  const id = await insertDirect("Phyllostachys Bambusoides Juice", null);
  await addAliasAndLink("왕대수액", id, 19);
  results["왕대수액"] = id;
}

// 왕대추출물 (Phyllostachys Bambusoides Extract) — KCIA-only entry, no CosIng match, no CAS on file.
{
  const id = await insertDirect("Phyllostachys Bambusoides Extract", null);
  await addAliasAndLink("왕대추출물", id, 29);
  results["왕대추출물"] = id;
}

console.log(JSON.stringify(results, null, 2));
await sql.end();

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const productId = "e0191834-a019-4c99-9899-dac66cb14dd4";

async function resolveViaCosing(englishName) {
  const lower = englishName.toLowerCase();
  const fromRef = await sql`
    SELECT inci_name, cas_no, restriction, functions
    FROM ingredient_ref.cosing_ingredients WHERE lower(inci_name) = ${lower} LIMIT 1
  `;
  if (!fromRef[0]) return null;
  const r = fromRef[0];
  const isEuProhibited = !!r.restriction && /\bII\b\s*\//.test(r.restriction);
  const isRestrictedFragrance =
    !!r.functions && r.functions.includes("PERFUMING") && !!r.restriction && /\bIII\b\s*\//.test(r.restriction);
  const allergenPattern =
    /\bIII\b\s*\/\s*(45|6[7-9]|[7-8][0-9]|9[0-2]|46|109|114|122|124|131|133|154|157|175|324|353|359|3(?:2[7-9]|[3-6][0-9]|7[01]))\b/;
  const isKnownFragranceAllergen = !!r.restriction && allergenPattern.test(r.restriction);
  const isUvFilter = !!r.functions && (r.functions.includes("UV FILTER") || r.functions.includes("UV ABSORBER"));
  const isApprovedPreservative = !!r.functions && r.functions.includes("PRESERVATIVE");

  const created = await sql`
    INSERT INTO ingredients
      (inci_name, cas_number, restriction, is_eu_prohibited, is_restricted_fragrance,
       is_known_fragrance_allergen, is_uv_filter, is_approved_preservative)
    VALUES
      (${r.inci_name}, ${r.cas_no}, ${r.restriction}, ${isEuProhibited}, ${isRestrictedFragrance},
       ${isKnownFragranceAllergen}, ${isUvFilter}, ${isApprovedPreservative})
    ON CONFLICT (inci_name) DO NOTHING
    RETURNING id
  `;
  if (created[0]) return created[0].id;
  const race = await sql`SELECT id FROM ingredients WHERE inci_name = ${r.inci_name} LIMIT 1`;
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
{
  const id = await resolveViaCosing("Malpighia Glabra Fruit Extract");
  await addAliasAndLink("아세로라추출물", id, 10);
  results["아세로라추출물"] = id;
}
{
  const id = await resolveViaCosing("Vaccinium Macrocarpon Fruit Extract");
  await addAliasAndLink("크랜베리추출물", id, 16);
  results["크랜베리추출물"] = id;
}

console.log(JSON.stringify(results, null, 2));
await sql.end();

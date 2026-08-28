import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const productId = "b1c53d3e-ed1e-41e6-9a13-fb8ba908b739";

async function resolveViaCosing(koreanName, englishName) {
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

// 1. 흰서양송로수 (Tuber Magnatum Water) — CosIng only has "TUBER MAGNATUM EXTRACT" (no water form).
//    No exact CosIng match for the water form; insert directly with KCIA-provided name, no CAS on file.
{
  const id = await insertDirect("Tuber Magnatum Water", null);
  await addAliasAndLink("흰서양송로수", id, 8);
  results["흰서양송로수"] = id;
}

// 2. 아보카도오일 -> CosIng "PERSEA GRATISSIMA OIL" (no "(Avocado)" parenthetical).
{
  const id = await resolveViaCosing("아보카도오일", "Persea Gratissima Oil");
  await addAliasAndLink("아보카도오일", id, 13);
  results["아보카도오일"] = id;
}

// 3. 바질꽃/잎/줄기추출물 -> CosIng "OCIMUM BASILICUM FLOWER/LEAF/STEM EXTRACT" (no "(Basil)").
{
  const id = await resolveViaCosing("바질꽃/잎/줄기추출물", "Ocimum Basilicum Flower/Leaf/Stem Extract");
  await addAliasAndLink("바질꽃/잎/줄기추출물", id, 14);
  results["바질꽃/잎/줄기추출물"] = id;
}

// 4. 데이지꽃추출물 -> CosIng "BELLIS PERENNIS FLOWER EXTRACT" (no "(Daisy)").
{
  const id = await resolveViaCosing("데이지꽃추출물", "Bellis Perennis Flower Extract");
  await addAliasAndLink("데이지꽃추출물", id, 30);
  results["데이지꽃추출물"] = id;
}

// 5. 연꽃추출물 (Nelumbo Nucifera Extract) — no plain CosIng match exists (only compound
//    rhizome/germ/sprout variants). Insert directly with KCIA name + CAS (85085-51-4, generic).
{
  const id = await insertDirect("Nelumbo Nucifera Extract", "85085-51-4");
  await addAliasAndLink("연꽃추출물", id, 36);
  results["연꽃추출물"] = id;
}

console.log(JSON.stringify(results, null, 2));
await sql.end();

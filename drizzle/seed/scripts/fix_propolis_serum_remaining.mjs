import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

// CosIng strips the descriptor KCIA keeps in a couple of cases here:
// - KCIA "카카오추출물" = "Theobroma Cacao (Cocoa) Extract" -> CosIng "THEOBROMA CACAO EXTRACT"
// - KCIA "티트리추출물" = "Melaleuca Alternifolia (Tea Tree) Extract" -> CosIng only lists the
//   leaf-part-specific "MELALEUCA ALTERNIFOLIA LEAF EXTRACT" (tea tree extract is leaf-derived
//   in practice; no bare whole-plant entry exists in the CosIng snapshot).
const remaining = [
  ["카카오추출물", "Theobroma Cacao Extract"],
  ["티트리추출물", "Melaleuca Alternifolia Leaf Extract"],
];

async function resolveIngredientId(englishName) {
  const lower = englishName.toLowerCase();
  const exact = await sql`SELECT id FROM ingredients WHERE lower(inci_name) = ${lower} LIMIT 1`;
  if (exact[0]) return exact[0].id;

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

const PRODUCT_ID = "9c7a293c-6a7c-4bc2-8272-898e31363531";
const POSITIONS = { 카카오추출물: 22, 티트리추출물: 24 };

let resolved = 0;
const stillUnmatched = [];
for (const [ko, en] of remaining) {
  const id = await resolveIngredientId(en);
  if (!id) {
    stillUnmatched.push(ko);
    continue;
  }
  const existingAlias = await sql`SELECT id FROM ingredient_aliases WHERE alias = ${ko}`;
  if (existingAlias.length === 0) {
    await sql`INSERT INTO ingredient_aliases (ingredient_id, alias) VALUES (${id}, ${ko})`;
  }
  await sql`
    INSERT INTO product_ingredients (product_id, ingredient_id, position)
    VALUES (${PRODUCT_ID}, ${id}, ${POSITIONS[ko]})
    ON CONFLICT DO NOTHING
  `;
  resolved++;
}

console.log(JSON.stringify({ resolved, stillUnmatched }, null, 2));
await sql.end();

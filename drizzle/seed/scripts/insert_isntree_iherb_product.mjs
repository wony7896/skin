import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

// Korean ingredient name -> verified English INCI name via kcia.or.kr/cid, 2026-08-26.
// Source: ISNtree Hyaluronic Acid Toner, listed on iherb.com (international K-beauty
// reseller) with the manufacturer's structured ingredient panel (.prodOverviewIngred),
// not iHerb's own machine-translated marketing copy (which carries an explicit translation-
// quality disclaimer and was NOT used as a data source).
// Note: "자작나무수액" alone resolved to the WRONG species (Betula Platyphylla Japonica,
// a different KCIA entry) - the label specifies "백자작나무(Betula alba)", so re-searched
// "만주자작나무수액" (Betula Alba's official KCIA name) to get the correct match. Caught
// before insert, not after.
const koreanToEnglish = [
  ["정제수", "Water"],
  ["프로판다이올", "Propanediol"],
  ["펜틸렌글라이콜", "Pentylene Glycol"],
  ["1,2-헥산다이올", "1,2-Hexanediol"],
  ["소듐하이알루로네이트", "Sodium Hyaluronate"],
  ["트레할로오스", "Trehalose"],
  ["카프릴릴글라이콜", "Caprylyl Glycol"],
  ["판테놀", "Panthenol"],
  ["소듐PCA", "Sodium PCA"],
  ["부틸렌글라이콜", "Butylene Glycol"],
  ["백자작나무(Betula alba)수액", "Betula Alba Juice"],
  ["쇠비름(Portulaca oleracea)추출물", "Portulaca Oleracea Extract"],
  ["글리세린", "Glycerin"],
  ["히알루론산", "Hyaluronic Acid"],
  ["접시꽃(Althaea rosea)뿌리추출물", "Althaea Rosea Root Extract"],
  ["알로에베라(Aloe barbadensis)잎추출물", "Aloe Barbadensis Leaf Extract"],
  ["베타글루칸", "Beta-Glucan"],
  ["가수분해소듐하이알루로네이트", "Hydrolyzed Sodium Hyaluronate"],
  ["하이드롤라이즈드히알루론산", "Hydrolyzed Hyaluronic Acid"],
  ["소듐하이알루로네이트크로스폴리머", "Sodium Hyaluronate Crosspolymer"],
];

async function resolveIngredientId(rawName) {
  const name = rawName.replace(/\(\s*\d+(\.\d+)?\s*%\s*\)\s*$/, "").trim();
  if (!name) return null;
  const lower = name.toLowerCase();

  const exact = await sql`SELECT id FROM ingredients WHERE lower(inci_name) = ${lower} LIMIT 1`;
  if (exact[0]) return exact[0].id;

  const aliased = await sql`SELECT ingredient_id AS id FROM ingredient_aliases WHERE lower(alias) = ${lower} LIMIT 1`;
  if (aliased[0]) return aliased[0].id;

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

let aliasesAdded = 0;
const koreanNameToId = {};
for (const [ko, en] of koreanToEnglish) {
  const id = await resolveIngredientId(en);
  if (!id) {
    console.log("WARNING: could not resolve English name:", en);
    continue;
  }
  koreanNameToId[ko] = id;
  const existing = await sql`SELECT id FROM ingredient_aliases WHERE alias = ${ko}`;
  if (existing.length === 0) {
    await sql`INSERT INTO ingredient_aliases (ingredient_id, alias) VALUES (${id}, ${ko})`;
    aliasesAdded++;
  }
}
console.log("Korean aliases added:", aliasesAdded, "/", koreanToEnglish.length);

const [product] = await sql`
  INSERT INTO products (name, brand, category, retailer, country, external_url, image_url, fragrance_level, texture, color_free)
  VALUES (
    'ISNtree 히알루론산 토너',
    'ISNtree',
    'toner',
    'iHerb',
    'US',
    'https://www.iherb.com/pr/isntree-hyaluronic-acid-toner-6-76-fl-oz-200-ml/99428',
    'https://cloudinary.images-iherb.com/image/upload/f_auto,q_auto:eco/images/isn/isn51753/v/48.jpg',
    'none', 'light', true
  )
  RETURNING id
`;

let matched = 0;
const unmatched = [];
for (let i = 0; i < koreanToEnglish.length; i++) {
  const [ko] = koreanToEnglish[i];
  const id = koreanNameToId[ko];
  if (id) {
    await sql`INSERT INTO product_ingredients (product_id, ingredient_id, position) VALUES (${product.id}, ${id}, ${i + 1})`;
    matched++;
  } else {
    unmatched.push(ko);
  }
}

console.log(JSON.stringify({ productId: product.id, total: koreanToEnglish.length, matched, unmatched }, null, 2));

await sql.end();

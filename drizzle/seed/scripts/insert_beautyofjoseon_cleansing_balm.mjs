import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

// Korean ingredient name (as printed on Olive Young's mandatory 상품정보 제공고시 for this
// product) -> verified English INCI name, confirmed via live query against kcia.or.kr/cid
// (Korea Cosmetic Industry Association's official ingredient dictionary) returning an EXACT
// 성분명 match. Verified 2026-08-26.
const koreanToEnglish = [
  ["세틸에틸헥사노에이트", "Cetyl Ethylhexanoate"],
  ["카프릴릭/카프릭트라이글리세라이드", "Caprylic/Capric Triglyceride"],
  ["피이지-20글리세릴트라이아이소스테아레이트", "PEG-20 Glyceryl Triisostearate"],
  ["합성왁스", "Synthetic Wax"],
  ["피이지-10아이소스테아레이트", "PEG-10 Isostearate"],
  ["솔비탄세스퀴올리에이트", "Sorbitan Sesquioleate"],
  ["비타민나무오일", "Hippophae Rhamnoides Oil"],
  ["쌀겨오일", "Oryza Sativa (Rice) Bran Oil"],
  ["정제수", "Water"],
  ["쌀수", "Oryza Sativa (Rice) Seed Water"],
  ["글리세린", "Glycerin"],
  ["프로판다이올", "Propanediol"],
  ["1,2-헥산다이올", "1,2-Hexanediol"],
  ["락토바실러스/콩발효추출물", "Lactobacillus/Soybean Ferment Extract"],
  ["부틸렌글라이콜", "Butylene Glycol"],
  ["율무씨추출물", "Coix Lacryma-Jobi Ma-yuen Seed Extract"],
  ["쌀추출물", "Oryza Sativa Extract"],
  ["귀리가루추출물", "Avena Sativa (Oat) Meal Extract"],
  ["에틸헥실글리세린", "Ethylhexylglycerin"],
  ["카프릴릴글라이콜", "Caprylyl Glycol"],
];

async function resolveIngredientId(koreanName, englishName) {
  const aliasHit = await sql`SELECT ingredient_id AS id FROM ingredient_aliases WHERE alias = ${koreanName} LIMIT 1`;
  if (aliasHit[0]) return aliasHit[0].id;

  const lower = englishName.toLowerCase();
  const exact = await sql`SELECT id FROM ingredients WHERE lower(inci_name) = ${lower} LIMIT 1`;
  if (exact[0]) return exact[0].id;

  const aliasByEnglish = await sql`SELECT ingredient_id AS id FROM ingredient_aliases WHERE lower(alias) = ${lower} LIMIT 1`;
  if (aliasByEnglish[0]) return aliasByEnglish[0].id;

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
  const id = await resolveIngredientId(ko, en);
  if (!id) {
    console.log("WARNING: could not resolve:", ko, "/", en);
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

// 조선미녀 미감클렌징밤 100ml, 올리브영(oliveyoung.co.kr) 국내 판매, country='KR'.
// 전성분: 올리브영 "상품정보 제공고시" 법정고시란(텍스트) 20개 성분, 표기 순서 그대로.
// 향료(Parfum/Fragrance) 미포함 -> fragranceLevel: none. 착색료 미포함 -> colorFree: true.
// 밤(balm) 제형 -> texture: rich.
const [product] = await sql`
  INSERT INTO products (name, brand, category, retailer, country, external_url, image_url, fragrance_level, texture, color_free)
  VALUES (
    '조선미녀 미감클렌징밤 100ml',
    '조선미녀',
    'cleansing',
    '올리브영',
    'KR',
    'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000188562',
    'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0018/A00000018856206ko.jpg?l=ko',
    'none', 'rich', true
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

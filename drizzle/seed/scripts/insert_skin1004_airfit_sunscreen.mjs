import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

// Korean ingredient name (Olive Young "상품정보 제공고시" legal disclosure, printed order) ->
// verified English INCI name, confirmed via live query against kcia.or.kr/cid returning an
// EXACT 성분명 match. Verified 2026-08-28.
const koreanToEnglish = [
  ["정제수", "Water"],
  ["징크옥사이드", "Zinc Oxide"],
  ["프로판다이올", "Propanediol"],
  ["부틸렌글라이콜", "Butylene Glycol"],
  ["다이카프릴릴카보네이트", "Dicaprylyl Carbonate"],
  ["카프릴릭/카프릭트라이글리세라이드", "Caprylic/Capric Triglyceride"],
  ["벤조트라이아졸릴도데실p-크레솔", "Benzotriazolyl Dodecyl p-Cresol"],
  ["폴리글리세릴-3다이스테아레이트", "Polyglyceryl-3 Distearate"],
  ["나이아신아마이드", "Niacinamide"],
  ["카프릴릴메티콘", "Caprylyl Methicone"],
  ["C12-15알킬벤조에이트", "C12-15 Alkyl Benzoate"],
  ["1,2-헥산다이올", "1,2-Hexanediol"],
  ["펜틸렌글라이콜", "Pentylene Glycol"],
  ["세테아릴알코올", "Cetearyl Alcohol"],
  ["폴리하이드록시스테아릭애씨드", "Polyhydroxystearic Acid"],
  ["글리세릴스테아레이트", "Glyceryl Stearate"],
  ["소듐폴리아크릴로일다이메틸타우레이트", "Sodium Polyacryloyldimethyl Taurate"],
  ["하이드롤라이즈드호호바에스터", "Hydrolyzed Jojoba Esters"],
  ["트라이에톡시카프릴릴실레인", "Triethoxycaprylylsilane"],
  ["글리세릴스테아레이트시트레이트", "Glyceryl Stearate Citrate"],
  ["폴리아크릴레이트크로스폴리머-6", "Polyacrylate Crosspolymer-6"],
  ["메틸프로판다이올", "Methylpropanediol"],
  ["잔탄검", "Xanthan Gum"],
  ["에틸헥실글리세린", "Ethylhexylglycerin"],
  ["아데노신", "Adenosine"],
  ["병풀추출물", "Centella Asiatica Extract"], // label shows "(301ppm)" — concentration note, stripped
  ["폴리에터-1", "Polyether-1"],
  ["t-부틸알코올", "t-Butyl Alcohol"],
  ["토코페롤", "Tocopherol"],
  ["쇠비름추출물", "Portulaca Oleracea Extract"],
  ["약모밀추출물", "Houttuynia Cordata Extract"],
  ["바이오사카라이드검-1", "Biosaccharide Gum-1"],
  ["아시아티코사이드", "Asiaticoside"],
  ["마데카식애씨드", "Madecassic Acid"],
  ["아시아틱애씨드", "Asiatic Acid"],
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

// [무기자차]스킨1004 마다가스카르 센텔라 에어핏 선크림 라이트 50ml, 올리브영(oliveyoung.co.kr) 국내 판매, country='KR'.
// 향료 성분 미기재 -> fragranceLevel: none. 착색료 미포함 -> colorFree: true.
// 무기자차 선크림(로션 타입) 제형 -> texture: light.
const [product] = await sql`
  INSERT INTO products (name, brand, category, retailer, country, external_url, image_url, fragrance_level, texture, color_free)
  VALUES (
    '스킨1004 마다가스카르 센텔라 에어핏 선크림 라이트 50ml',
    '스킨1004',
    'sunscreen_spot',
    '올리브영',
    'KR',
    'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000169506',
    'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0016/A00000016950644ko.jpg?l=ko',
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

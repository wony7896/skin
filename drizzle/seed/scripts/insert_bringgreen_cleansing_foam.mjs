import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

// Korean ingredient name (Olive Young "상품정보 제공고시" legal disclosure, printed order) ->
// verified English INCI name, confirmed via live query against kcia.or.kr/cid returning an
// EXACT 성분명 match. Verified 2026-08-27.
const koreanToEnglish = [
  ["정제수", "Water"],
  ["글리세린", "Glycerin"],
  ["미리스틱애씨드", "Myristic Acid"],
  ["포타슘하이드록사이드", "Potassium Hydroxide"],
  ["스테아릭애씨드", "Stearic Acid"],
  ["소듐C14-16올레핀설포네이트", "Sodium C14-16 Olefin Sulfonate"],
  ["코카미도프로필베타인", "Cocamidopropyl Betaine"],
  ["글리세릴스테아레이트", "Glyceryl Stearate"],
  ["라우릭애씨드", "Lauric Acid"],
  ["팔미틱애씨드", "Palmitic Acid"],
  ["하이드록시프로필스타치포스페이트", "Hydroxypropyl Starch Phosphate"],
  ["소듐클로라이드", "Sodium Chloride"],
  ["솔비톨", "Sorbitol"],
  ["부틸렌글라이콜", "Butylene Glycol"],
  ["아크릴레이트/C10-30알킬아크릴레이트크로스폴리머", "Acrylates/C10-30 Alkyl Acrylate Crosspolymer"],
  ["카프릴릴글라이콜", "Caprylyl Glycol"],
  ["에틸헥실글리세린", "Ethylhexylglycerin"],
  ["향료", "Parfum"],
  ["왕대수액", "Phyllostachys Bambusoides Juice"], // label shows "(980ppm)" — concentration note, stripped
  ["덱스트린", "Dextrin"],
  ["헥사데센", "Hexadecene"],
  ["소듐하이드록사이드", "Sodium Hydroxide"],
  ["소듐설페이트", "Sodium Sulfate"],
  ["테트라데센", "Tetradecene"],
  ["트라이소듐에틸렌다이아민다이석시네이트", "Trisodium Ethylenediamine Disuccinate"],
  ["치자추출물", "Gardenia Florida Fruit Extract"],
  ["1,2-헥산다이올", "1,2-Hexanediol"],
  ["하이드롤라이즈드소듐하이알루로네이트", "Hydrolyzed Sodium Hyaluronate"], // "(1ppm)"
  ["왕대추출물", "Phyllostachys Bambusoides Extract"], // "(1ppm)"
  ["흰버드나무껍질추출물", "Salix Alba (Willow) Bark Extract"],
  ["소듐하이알루로네이트", "Sodium Hyaluronate"], // "(0.095ppm)"
  ["소듐아세틸레이티드하이알루로네이트", "Sodium Acetylated Hyaluronate"], // "(0.005ppm)"
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

// 브링그린 대나무 히알루 수분 클렌징폼 120mL, 올리브영(oliveyoung.co.kr) 국내 판매, country='KR'.
// 향료(Parfum) 명시 포함 -> fragranceLevel: light. 착색료 미포함 -> colorFree: true.
// 클렌징폼 제형 -> texture: medium.
const [product] = await sql`
  INSERT INTO products (name, brand, category, retailer, country, external_url, image_url, fragrance_level, texture, color_free)
  VALUES (
    '브링그린 대나무 히알루 수분 클렌징폼 120mL',
    '브링그린',
    'cleansing',
    '올리브영',
    'KR',
    'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000214813',
    'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0021/A00000021481308ko.jpg?l=ko',
    'light', 'medium', true
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

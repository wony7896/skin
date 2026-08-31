import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

// Korean ingredient name (Olive Young "상품정보 제공고시" legal disclosure, printed order) ->
// verified English INCI name, confirmed via live query against kcia.or.kr/cid returning an
// EXACT 성분명 match. Verified 2026-08-26.
const koreanToEnglish = [
  ["정제수", "Water"],
  ["다이프로필렌글라이콜", "Dipropylene Glycol"],
  ["글리세린", "Glycerin"],
  ["부틸렌글라이콜", "Butylene Glycol"],
  ["프로폴리스추출물", "Propolis Extract"], // label shows "(7.05%)" — concentration note, stripped
  ["나이아신아마이드", "Niacinamide"],
  ["1,2-헥산다이올", "1,2-Hexanediol"],
  ["베타인살리실레이트", "Betaine Salicylate"],
  ["소듐폴리아크릴로일다이메틸타우레이트", "Sodium Polyacryloyldimethyl Taurate"],
  ["트로메타민", "Tromethamine"],
  ["폴리글리세릴-10라우레이트", "Polyglyceryl-10 Laurate"],
  ["잔탄검", "Xanthan Gum"],
  ["카프릴릴글라이콜", "Caprylyl Glycol"],
  ["카보머", "Carbomer"],
  ["에틸헥실글리세린", "Ethylhexylglycerin"],
  ["인도멀구슬나무꽃추출물", "Melia Azadirachta Flower Extract"],
  ["홀리바질잎추출물", "Ocimum Sanctum Leaf Extract"],
  ["인도멀구슬나무잎추출물", "Melia Azadirachta Leaf Extract"],
  ["소듐하이알루로네이트", "Sodium Hyaluronate"],
  ["울금뿌리추출물", "Curcuma Longa Root Extract"],
  ["덱스트린", "Dextrin"],
  ["카카오추출물", "Theobroma Cacao (Cocoa) Extract"],
  ["참산호말추출물", "Corallina Officinalis Extract"],
  ["티트리추출물", "Melaleuca Alternifolia (Tea Tree) Extract"],
  ["병풀추출물", "Centella Asiatica Extract"],
  ["메틸프로판다이올", "Methylpropanediol"],
  ["서양벌노랑이씨추출물", "Lotus Corniculatus Seed Extract"],
  ["펜틸렌글라이콜", "Pentylene Glycol"],
  ["옥탄다이올", "Octanediol"],
  ["호동씨오일", "Calophyllum Inophyllum Seed Oil"],
  ["토코페롤", "Tocopherol"],
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

// 조선미녀 광채프로폴리스세럼 30ml, 올리브영(oliveyoung.co.kr) 국내 판매, country='KR'.
// 전성분: 올리브영 "상품정보 제공고시" 법정고시란(텍스트) 31개 성분, 표기 순서 그대로.
// 향료(Parfum/Fragrance) 미포함 -> fragranceLevel: none. 착색료 미포함 -> colorFree: true.
// 세럼(액상) 제형 -> texture: light.
const [product] = await sql`
  INSERT INTO products (name, brand, category, retailer, country, external_url, image_url, fragrance_level, texture, color_free)
  VALUES (
    '조선미녀 광채프로폴리스세럼 30ml',
    '조선미녀',
    'essence_serum',
    '올리브영',
    'KR',
    'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000188711',
    'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0018/A00000018871122ko.jpg?l=ko',
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

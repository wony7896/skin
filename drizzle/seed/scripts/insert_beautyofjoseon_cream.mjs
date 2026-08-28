import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

// Korean ingredient name (Olive Young "상품정보 제공고시" legal disclosure, printed order) ->
// verified English INCI name, confirmed via live query against kcia.or.kr/cid returning an
// EXACT 성분명 match. Verified 2026-08-26.
const koreanToEnglish = [
  ["정제수", "Water"],
  ["글리세린", "Glycerin"],
  ["하이드로제네이티드폴리데센", "Hydrogenated Polydecene"],
  ["1,2-헥산다이올", "1,2-Hexanediol"],
  ["나이아신아마이드", "Niacinamide"],
  ["스쿠알란", "Squalane"],
  ["부틸렌글라이콜", "Butylene Glycol"],
  ["프로판다이올", "Propanediol"],
  ["부틸렌글라이콜다이카프릴레이트/다이카프레이트", "Butylene Glycol Dicaprylate/Dicaprate"],
  ["세테아릴올리베이트", "Cetearyl Olivate"],
  ["솔비탄올리베이트", "Sorbitan Olivate"],
  ["암모늄아크릴로일다이메틸타우레이트/브이피코폴리머", "Ammonium Acryloyldimethyltaurate/VP Copolymer"],
  ["잔탄검", "Xanthan Gum"],
  ["인삼수", "Panax Ginseng Root Water"],
  ["아크릴레이트/C10-30알킬아크릴레이트크로스폴리머", "Acrylates/C10-30 Alkyl Acrylate Crosspolymer"],
  ["트로메타민", "Tromethamine"],
  ["잇꽃씨오일", "Carthamus Tinctorius (Safflower) Seed Oil"],
  ["하이드로제네이티드코코넛오일", "Hydrogenated Coconut Oil"],
  ["글리세릴아크릴레이트/아크릴릭애씨드코폴리머", "Glyceryl Acrylate/Acrylic Acid Copolymer"],
  ["쌀겨수", "Oryza Sativa (Rice) Bran Water"],
  ["에틸헥실글리세린", "Ethylhexylglycerin"],
  ["아데노신", "Adenosine"],
  ["카프릴릭/카프릭트라이글리세라이드", "Caprylic/Capric Triglyceride"],
  ["다이소듐이디티에이", "Disodium EDTA"],
  ["하이알루로닉애씨드", "Hyaluronic Acid"],
  ["하이드롤라이즈드하이알루로닉애씨드", "Hydrolyzed Hyaluronic Acid"],
  ["소듐하이알루로네이트", "Sodium Hyaluronate"],
  ["꿀추출물", "Honey Extract"],
  ["세라마이드엔피", "Ceramide NP"],
  ["하이드로제네이티드레시틴", "Hydrogenated Lecithin"],
  ["황련뿌리추출물", "Coptis Japonica Root Extract"],
  ["무씨추출물", "Raphanus Sativus (Radish) Seed Extract"],
  ["카카오씨추출물", "Theobroma Cacao Seed Extract"],
  ["구기자추출물", "Lycium Chinense Fruit Extract"],
  ["덱스트린", "Dextrin"],
  ["진흙버섯추출물", "Phellinus Linteus Extract"],
  ["황금추출물", "Scutellaria Baicalensis Root Extract"],
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

// 조선미녀 조선미녀크림 50ml, 올리브영(oliveyoung.co.kr) 국내 판매, country='KR'.
// 향료(Parfum/Fragrance) 미포함 -> fragranceLevel: none. 착색료 미포함 -> colorFree: true.
// 크림 제형 -> texture: rich.
const [product] = await sql`
  INSERT INTO products (name, brand, category, retailer, country, external_url, image_url, fragrance_level, texture, color_free)
  VALUES (
    '조선미녀 조선미녀크림 50ml',
    '조선미녀',
    'cream_lotion',
    '올리브영',
    'KR',
    'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000188831',
    'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0018/A00000018883107ko.jpg?l=ko',
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

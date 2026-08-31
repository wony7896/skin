import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

// Korean ingredient name (Olive Young "상품정보 제공고시" legal disclosure, printed order) ->
// verified English INCI name, confirmed via live query against kcia.or.kr/cid returning an
// EXACT 성분명 match (or, where noted, CosIng fallback). Verified 2026-08-27.
const koreanToEnglish = [
  ["정제수", "Water"],
  ["징크옥사이드", "Zinc Oxide"],
  ["프로판다이올", "Propanediol"],
  ["부틸옥틸살리실레이트", "Butyloctyl Salicylate"],
  ["프로필헵틸카프릴레이트", "Propylheptyl Caprylate"],
  ["코코-카프릴레이트/카프레이트", "Coco-Caprylate/Caprate"],
  ["사이클로헥사실록세인", "Cyclohexasiloxane"],
  ["카프릴릴메티콘", "Caprylyl Methicone"],
  ["아이소도데케인", "Isododecane"],
  ["폴리글리세릴-3폴리다이메틸실록시에틸다이메티콘", "Polyglyceryl-3 Polydimethylsiloxyethyl Dimethicone"],
  ["메틸트라이메티콘", "Methyl Trimethicone"],
  ["메틸메타크릴레이트크로스폴리머", "Methyl Methacrylate Crosspolymer"],
  ["다이스테아다이모늄헥토라이트", "Disteardimonium Hectorite"],
  ["마그네슘설페이트", "Magnesium Sulfate"],
  ["트라이에톡시카프릴릴실레인", "Triethoxycaprylylsilane"],
  ["1,2-헥산다이올", "1,2-Hexanediol"],
  ["폴리글리세릴-2다이폴리하이드록시스테아레이트", "Polyglyceryl-2 Dipolyhydroxystearate"],
  ["라우릴폴리글리세릴-3폴리다이메틸실록시에틸다이메티콘", "Lauryl Polyglyceryl-3 Polydimethylsiloxyethyl Dimethicone"],
  ["폴리메틸실세스퀴옥세인", "Polymethylsilsesquioxane"],
  ["글리세릴카프릴레이트", "Glyceryl Caprylate"],
  ["카프릴릴글라이콜", "Caprylyl Glycol"],
  ["에틸헥실글리세린", "Ethylhexylglycerin"],
  ["소듐하이알루로네이트", "Sodium Hyaluronate"],
  ["부틸렌글라이콜", "Butylene Glycol"],
  ["토코페롤", "Tocopherol"],
  ["병풀추출물", "Centella Asiatica Extract"],
  ["타라열매추출물", "Caesalpinia Spinosa Fruit Extract"],
  ["프랑스해안송껍질추출물", "Pinus Pinaster Bark Extract"],
  ["코토니추출물", "Kappaphycus Alvarezii Extract"],
  ["7-데하이드로콜레스테롤", "7-Dehydrocholesterol"],
  ["약모밀추출물", "Houttuynia Cordata Extract"],
  ["엑토인", "Ectoin"],
  ["밀몽화꽃추출물", "Buddleja Officinalis Flower Extract"],
  ["락토바실러스발효물", "Lactobacillus Ferment"],
  ["하이드록시신나믹애씨드", "Hydroxycinnamic Acid"],
  ["루틴", "Rutin"],
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

// [무기자차] 닥터지 그린 마일드 업 선 플러스 50ml, 올리브영(oliveyoung.co.kr) 국내 판매, country='KR'.
// 향료 성분 미기재 -> fragranceLevel: none. 착색료 미포함 -> colorFree: true.
// 무기자차 선크림(로션 타입) 제형 -> texture: medium.
const [product] = await sql`
  INSERT INTO products (name, brand, category, retailer, country, external_url, image_url, fragrance_level, texture, color_free)
  VALUES (
    '닥터지 그린 마일드 업 선 플러스 50ml',
    '닥터지',
    'sunscreen_spot',
    '올리브영',
    'KR',
    'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000180162',
    'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0018/A00000018016249ko.jpg?l=ko',
    'none', 'medium', true
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

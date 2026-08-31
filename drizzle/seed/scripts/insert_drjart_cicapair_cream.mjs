import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

// Korean ingredient name (Olive Young "상품정보 제공고시" legal disclosure, printed order) ->
// verified English INCI name, confirmed via live query against kcia.or.kr/cid returning an
// EXACT 성분명 match (or, where noted, CosIng fallback). Verified 2026-08-27.
const koreanToEnglish = [
  ["정제수", "Water"],
  ["다이프로필렌글라이콜", "Dipropylene Glycol"],
  ["세테아릴알코올", "Cetearyl Alcohol"],
  ["프로판다이올", "Propanediol"],
  ["폴리글리세릴-3메틸글루코오스다이스테아레이트", "Polyglyceryl-3 Methylglucose Distearate"],
  ["피토스테릴이소스테아릴다이머디리놀리에이트", "Phytosteryl Isostearyl Dimer Dilinoleate"],
  ["부틸렌글라이콜", "Butylene Glycol"],
  ["카프릴릭/카프릭트라이글리세라이드", "Caprylic/Capric Triglyceride"],
  ["시어버터", "Butyrospermum Parkii (Shea) Butter"],
  ["다이카프릴릴에터", "Dicaprylyl Ether"],
  ["나이아신아마이드", "Niacinamide"],
  ["글리세릴스테아레이트에스이", "Glyceryl Stearate SE"],
  ["펜틸렌글라이콜", "Pentylene Glycol"],
  ["합성비즈왁스", "Synthetic Beeswax"],
  ["퀸즈랜드넛오일", "Macadamia Integrifolia Seed Oil"],
  ["카카오추출물", "Theobroma Cacao (Cocoa) Extract"],
  ["병풀잎추출물", "Centella Asiatica Leaf Extract"],
  ["1,2-헥산다이올", "1,2-Hexanediol"],
  ["세틸에틸헥사노에이트", "Cetyl Ethylhexanoate"],
  ["다이글리세린", "Diglycerin"],
  ["비닐다이메티콘", "Vinyl Dimethicone"],
  ["세테아릴올리베이트", "Cetearyl Olivate"],
  ["솔비탄올리베이트", "Sorbitan Olivate"],
  ["하이드록시에틸아크릴레이트/소듐아크릴로일다이메틸타우레이트코폴리머", "Hydroxyethyl Acrylate/Sodium Acryloyldimethyl Taurate Copolymer"],
  ["글리세린", "Glycerin"],
  ["알란토인", "Allantoin"],
  ["아시아티코사이드", "Asiaticoside"],
  ["트로메타민", "Tromethamine"],
  ["마데카식애씨드", "Madecassic Acid"],
  ["아시아틱애씨드", "Asiatic Acid"],
  ["아데노신", "Adenosine"],
  ["아이소펜틸다이올", "Isopentyldiol"],
  ["덱스트린", "Dextrin"],
  ["솔비탄아이소스테아레이트", "Sorbitan Isostearate"],
  ["트라이소듐에틸렌다이아민다이석시네이트", "Trisodium Ethylenediamine Disuccinate"],
  ["폴리글리세릴-4올리에이트", "Polyglyceryl-4 Oleate"],
  ["소듐스테아로일글루타메이트", "Sodium Stearoyl Glutamate"],
  ["소듐서팩틴", "Sodium Surfactin"],
  ["토코페롤", "Tocopherol"],
  ["덱스트란", "Dextran"],
  ["팔미토일트라이펩타이드-8", "Palmitoyl Tripeptide-8"],
  ["카보머", "Carbomer"],
  ["잔탄검", "Xanthan Gum"],
  ["페녹시에탄올", "Phenoxyethanol"],
  ["황색4호", "Tartrazine"], // label shows "(CI 19140)" — color index note, stripped
  ["청색1호", "Brilliant Blue FCF"], // "(CI 42090)"
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

// [강력진정] 닥터자르트 시카페어 인텐시브 수딩 리페어 크림 50ml, 올리브영(oliveyoung.co.kr) 국내 판매, country='KR'.
// 향료 성분 미기재 -> fragranceLevel: none. 황색4호/청색1호 착색료 포함 -> colorFree: false.
// 크림 제형 -> texture: rich.
const [product] = await sql`
  INSERT INTO products (name, brand, category, retailer, country, external_url, image_url, fragrance_level, texture, color_free)
  VALUES (
    '닥터자르트 시카페어 인텐시브 수딩 리페어 크림 50ml',
    '닥터자르트',
    'cream_lotion',
    '올리브영',
    'KR',
    'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000181191',
    'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0018/A00000018119107ko.jpg?l=ko',
    'none', 'rich', false
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

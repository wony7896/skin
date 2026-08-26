import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

// Korean ingredient name -> verified English INCI name, looked up live against the Korea
// Cosmetic Association's official 성분사전 (kcia.or.kr/cid) - the government-recognized
// standardization body for Korean cosmetic ingredient names. Each entry below was confirmed
// via a live query returning an EXACT 성분명 match (not a fuzzy/partial result), 2026-08-26.
const koreanToEnglish = [
  ["정제수", "Water"],
  ["다이부틸아디페이트", "Dibutyl Adipate"],
  ["프로판다이올", "Propanediol"],
  ["폴리메틸실세스퀴옥세인", "Polymethylsilsesquioxane"],
  ["다이아이소프로필세바케이트", "Diisopropyl Sebacate"],
  ["디에칠아미노하이드록시벤조일헥실벤조에이트", "Diethylamino Hydroxybenzoyl Hexyl Benzoate"],
  ["에칠헥실트리아존", "Ethylhexyl Triazone"],
  ["메칠렌비스-벤조트리아졸릴테트라메칠부틸페놀", "Methylene Bis-Benzotriazolyl Tetramethylbutylphenol"],
  ["코코-카프릴레이트/카프레이트", "Coco-Caprylate/Caprate"],
  ["디에칠헥실부타미도트리아존", "Diethylhexyl Butamido Triazone"],
  ["부틸렌글라이콜", "Butylene Glycol"],
  ["글리세린", "Glycerin"],
  ["1,2-헥산다이올", "1,2-Hexanediol"],
  ["카프릴릴메티콘", "Caprylyl Methicone"],
  ["약모밀추출물", "Houttuynia Cordata Extract"],
  ["펜틸렌글라이콜", "Pentylene Glycol"],
  ["베헤닐알코올", "Behenyl Alcohol"],
  ["폴리C10-30알킬아크릴레이트", "Poly C10-30 Alkyl Acrylate"],
  ["폴리글리세릴-3메틸글루코오스다이스테아레이트", "Polyglyceryl-3 Methylglucose Distearate"],
  ["데실글루코사이드", "Decyl Glucoside"],
  ["트로메타민", "Tromethamine"],
  ["카보머", "Carbomer"],
  ["아크릴레이트/C10-30알킬아크릴레이트크로스폴리머", "Acrylates/C10-30 Alkyl Acrylate Crosspolymer"],
  ["소듐스테아로일글루타메이트", "Sodium Stearoyl Glutamate"],
  ["폴리아크릴레이트크로스폴리머-6", "Polyacrylate Crosspolymer-6"],
  ["에틸헥실글리세린", "Ethylhexylglycerin"],
  ["잔탄검", "Xanthan Gum"],
  ["t-부틸알코올", "t-Butyl Alcohol"],
  ["토코페롤", "Tocopherol"],
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

// Step 1: resolve each English INCI name to a canonical ingredient id, then register the
// Korean name as a permanent alias - this is what makes every FUTURE Korean-sourced product
// resolve automatically without re-querying KCIA.
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

// Step 2: insert the real product, in the Korean ingredient order as printed on the
// mandatory disclosure (화장품법에 따라 기재해야 하는 모든 성분), country='KR' since this
// really is oliveyoung.co.kr, Korea's domestic retailer.
const [product] = await sql`
  INSERT INTO products (name, brand, category, retailer, country, external_url, image_url, fragrance_level, texture, color_free)
  VALUES (
    '구달 맑은 어성초 진정 수분 선크림 50ml',
    '구달',
    'sunscreen_spot',
    '올리브영',
    'KR',
    'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000219553',
    'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0021/A00000021955351ko.jpg?l=ko&QT=85&SF=webp&sharpen=1x0.5',
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

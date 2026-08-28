import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

// Korean ingredient name (Olive Young "상품정보 제공고시" legal disclosure, printed order) ->
// verified English INCI name, confirmed via live query against kcia.or.kr/cid returning an
// EXACT 성분명 match. Verified 2026-08-26.
// Note: 귀리커널추출물 has no KCIA entry (confirmed via broad search); resolved via CosIng
// English-name fallback ("Avena Sativa Kernel Extract", confirmed present in ingredient_ref.cosing_ingredients).
const koreanToEnglish = [
  ["정제수", "Water"],
  ["부틸렌글라이콜", "Butylene Glycol"],
  ["글리세레스-26", "Glycereth-26"],
  ["에톡시다이글라이콜", "Ethoxydiglycol"],
  ["나이아신아마이드", "Niacinamide"],
  ["폴리프로필실세스퀴옥세인", "Polypropylsilsesquioxane"],
  ["해바라기씨오일", "Helianthus Annuus Seed Oil"],
  ["흰서양송로수", "Tuber Magnatum Water"],
  ["다이프로필렌글라이콜", "Dipropylene Glycol"],
  ["1,2-헥산다이올", "1,2-Hexanediol"],
  ["솔비톨", "Sorbitol"],
  ["하이드록시에틸우레아", "Hydroxyethyl Urea"],
  ["아보카도오일", "Persea Gratissima (Avocado) Oil"],
  ["바질꽃/잎/줄기추출물", "Ocimum Basilicum (Basil) Flower/Leaf/Stem Extract"],
  ["멕시칸치아씨추출물", "Salvia Hispanica Seed Extract"],
  ["다이펩타이드-15", "Dipeptide-15"],
  ["흰서양송로추출물", "Tuber Magnatum Extract"],
  ["베타인", "Betaine"],
  ["귀리커널추출물", "Avena Sativa Kernel Extract"],
  ["다이소듐이디티에이", "Disodium EDTA"],
  ["아데노신", "Adenosine"],
  ["돌콩오일", "Glycine Soja Oil"],
  ["알지닌", "Arginine"],
  ["카보머", "Carbomer"],
  ["다이포타슘글리시리제이트", "Dipotassium Glycyrrhizate"],
  ["하이드롤라이즈드하이알루로닉애씨드", "Hydrolyzed Hyaluronic Acid"],
  ["아나토씨오일", "Bixa Orellana Seed Oil"],
  ["글리세린", "Glycerin"],
  ["소듐팔미토일프롤린", "Sodium Palmitoyl Proline"],
  ["데이지꽃추출물", "Bellis Perennis (Daisy) Flower Extract"],
  ["프리지아추출물", "Freesia Refracta Extract"],
  ["약모밀추출물", "Houttuynia Cordata Extract"],
  ["에델바이스추출물", "Leontopodium Alpinum Extract"],
  ["마돈나백합꽃추출물", "Lilium Candidum Flower Extract"],
  ["뽕나무껍질추출물", "Morus Alba Bark Extract"],
  ["연꽃추출물", "Nelumbo Nucifera Extract"],
  ["인삼추출물", "Panax Ginseng Root Extract"],
  ["스노우로투스추출물", "Saussurea Involucrata Extract"],
  ["비피다발효용해물", "Bifida Ferment Lysate"],
  ["포타슘솔비테이트", "Potassium Sorbate"],
  ["알바수련꽃추출물", "Nymphaea Alba Flower Extract"],
  ["하이드록시아세토페논", "Hydroxyacetophenone"],
  ["카프릴릴글라이콜", "Caprylyl Glycol"],
  ["토코페릴아세테이트", "Tocopheryl Acetate"],
  ["향료", "Parfum"],
  ["리날룰", "Linalool"],
  ["헥실신남알", "Hexyl Cinnamal"],
  ["리모넨", "Limonene"],
  ["시트로넬올", "Citronellol"],
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

// 달바 퍼스트 스프레이 세럼 펩타이드 100ml, 올리브영(oliveyoung.co.kr) 국내 판매, country='KR'.
// 향료(Parfum) + 리날룰/헥실신남알/리모넨/시트로넬올 등 향료 알러젠 클러스터 명시 포함 ->
// fragranceLevel: light. 착색료 미포함 -> colorFree: true. 스프레이 세럼(액상) 제형 -> texture: light.
const [product] = await sql`
  INSERT INTO products (name, brand, category, retailer, country, external_url, image_url, fragrance_level, texture, color_free)
  VALUES (
    '달바 퍼스트 스프레이 세럼 펩타이드 100ml',
    '달바',
    'essence_serum',
    '올리브영',
    'KR',
    'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000259554',
    'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0025/A00000025955440ko.png?l=ko',
    'light', 'light', true
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

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

// Korean ingredient name (Olive Young "상품정보 제공고시" legal disclosure, printed order) ->
// verified English INCI name, confirmed via live query against kcia.or.kr/cid returning an
// EXACT 성분명 match. Verified 2026-08-26.
const koreanToEnglish = [
  ["정제수", "Water"],
  ["부틸렌글라이콜", "Butylene Glycol"],
  ["나이아신아마이드", "Niacinamide"],
  ["글리세린", "Glycerin"],
  ["다이프로필렌글라이콜", "Dipropylene Glycol"],
  ["1,2-헥산다이올", "1,2-Hexanediol"],
  ["판테놀", "Panthenol"],
  ["도둑놈의지팡이뿌리추출물", "Sophora Angustifolia Root Extract"],
  ["아크릴레이트/C10-30알킬아크릴레이트크로스폴리머", "Acrylates/C10-30 Alkyl Acrylate Crosspolymer"],
  ["프로판다이올", "Propanediol"],
  ["다이에톡시에틸석시네이트", "Diethoxyethyl Succinate"],
  ["트로메타민", "Tromethamine"],
  ["하이드로제네이티드레시틴", "Hydrogenated Lecithin"],
  ["암모늄아크릴로일다이메틸타우레이트/브이피코폴리머", "Ammonium Acryloyldimethyltaurate/VP Copolymer"],
  ["베타인", "Betaine"],
  ["판토테닉애씨드", "Pantothenic Acid"],
  ["트레할로오스", "Trehalose"],
  ["에틸헥실글리세린", "Ethylhexylglycerin"],
  ["글리세릴올리에이트", "Glyceryl Oleate"],
  ["소듐파이테이트", "Sodium Phytate"],
  ["알란토인", "Allantoin"],
  ["알파-알부틴", "Alpha-Arbutin"],
  ["약모밀추출물", "Houttuynia Cordata Extract"],
  ["라우릴글루코사이드", "Lauryl Glucoside"],
  ["미리스틸글루코사이드", "Myristyl Glucoside"],
  ["폴리글리세릴-6라우레이트", "Polyglyceryl-6 Laurate"],
  ["징크피씨에이", "Zinc PCA"],
  ["인도멀구슬나무잎추출물", "Melia Azadirachta Leaf Extract"],
  ["토코페롤", "Tocopherol"],
  ["감초뿌리추출물", "Glycyrrhiza Uralensis (Licorice) Root Extract"],
  ["인도멀구슬나무꽃추출물", "Melia Azadirachta Flower Extract"],
  ["아이비고드열매추출물", "Coccinia Indica Fruit Extract"],
  ["병풀추출물", "Centella Asiatica Extract"],
  ["소듐하이알루로네이트", "Sodium Hyaluronate"],
  ["시트릭애씨드", "Citric Acid"],
  ["가지열매추출물", "Solanum Melongena Fruit Extract"],
  ["베타-글루칸", "Beta-Glucan"],
  ["홀리바질잎추출물", "Ocimum Sanctum Leaf Extract"],
  ["하이알루로닉애씨드", "Hyaluronic Acid"],
  ["데실글루코사이드", "Decyl Glucoside"],
  ["울금뿌리추출물", "Curcuma Longa Root Extract"],
  ["참산호말추출물", "Corallina Officinalis Extract"],
  ["다이포타슘글리시리제이트", "Dipotassium Glycyrrhizate"],
  ["하이드롤라이즈드하이알루로닉애씨드", "Hydrolyzed Hyaluronic Acid"],
  ["호호바씨오일", "Simmondsia Chinensis Seed Oil"],
  ["녹차추출물", "Camellia Sinensis Leaf Extract"],
  ["병풀잎추출물", "Centella Asiatica Leaf Extract"],
  ["오카무라큰실말추출물", "Cladosiphon Okamuranus Extract"],
  ["흰버드나무껍질추출물", "Salix Alba (Willow) Bark Extract"],
  ["소듐아세틸레이티드하이알루로네이트", "Sodium Acetylated Hyaluronate"],
  ["커피콩추출물", "Coffea Arabica (Coffee) Seed Extract"],
  ["베타-시토스테롤", "Beta-Sitosterol"],
  ["폴리글리세릴-10스테아레이트", "Polyglyceryl-10 Stearate"],
  ["베르가모트잎추출물", "Citrus Aurantium Bergamia (Bergamot) Leaf Extract"],
  ["소나무잎추출물", "Pinus Densiflora Leaf Extract"],
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

// 넘버즈인 1번 판토텐산 액티브업 수딩세럼 50ml, 올리브영(oliveyoung.co.kr) 국내 판매, country='KR'.
// 향료(Parfum/Fragrance) 미포함 -> fragranceLevel: none. 착색료 미포함 -> colorFree: true.
// 세럼(액상) 제형 -> texture: light.
const [product] = await sql`
  INSERT INTO products (name, brand, category, retailer, country, external_url, image_url, fragrance_level, texture, color_free)
  VALUES (
    '넘버즈인 1번 판토텐산 액티브업 수딩세럼 50ml',
    '넘버즈인',
    'essence_serum',
    '올리브영',
    'KR',
    'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000204306',
    'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0020/A00000020430624ko.jpg?l=ko',
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

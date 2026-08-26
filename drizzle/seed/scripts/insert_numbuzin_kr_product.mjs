import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

// Korean ingredient name -> verified English INCI name, looked up live against kcia.or.kr/cid
// (Korea Cosmetic Association 성분사전), 2026-08-26. Source product: Numbuzin (넘버즈인) 3번
// 모공제로 화잘먹 패드 (toner pad), from oliveyoung.co.kr's mandatory ingredient disclosure.
const koreanToEnglish = [
  ["정제수", "Water"],
  ["메틸프로판다이올", "Methylpropanediol"],
  ["비피다발효용해물", "Bifida Ferment Lysate"],
  ["부틸렌글라이콜", "Butylene Glycol"],
  ["변성알코올", "Alcohol Denat."],
  ["갈락토미세스발효여과물", "Galactomyces Ferment Filtrate"],
  ["1,2-헥산다이올", "1,2-Hexanediol"],
  ["글리세린", "Glycerin"],
  ["베타인", "Betaine"],
  ["트레할로오스", "Trehalose"],
  ["판테놀", "Panthenol"],
  ["글리세레스-26", "Glycereth-26"],
  ["코직애씨드", "Kojic Acid"],
  ["폴리글리세릴-10라우레이트", "Polyglyceryl-10 Laurate"],
  ["암모늄아크릴로일다이메틸타우레이트/브이피코폴리머", "Ammonium Acryloyldimethyltaurate/VP Copolymer"],
  ["글루코노락톤", "Gluconolactone"],
  ["소듐시트레이트", "Sodium Citrate"],
  ["알란토인", "Allantoin"],
  ["소듐하이알루로네이트", "Sodium Hyaluronate"],
  ["카프릴릴글라이콜", "Caprylyl Glycol"],
  ["다이소듐이디티에이", "Disodium EDTA"],
  ["카프릴로일살리실릭애씨드", "Capryloyl Salicylic Acid"],
  ["대왕소나무잎추출물", "Pinus Palustris Leaf Extract"],
  ["당느릅나무뿌리추출물", "Ulmus Davidiana Root Extract"],
  ["달맞이꽃꽃추출물", "Oenothera Biennis (Evening Primrose) Flower Extract"],
  ["칡뿌리추출물", "Pueraria Lobata Root Extract"],
  ["락토바실러스발효용해물", "Lactobacillus Ferment Lysate"],
  ["트로폴론", "Tropolone"],
  ["하이드로제네이티드레시틴", "Hydrogenated Lecithin"],
  ["바쿠치올", "Bakuchiol"],
  ["향료", "Fragrance"],
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

const [product] = await sql`
  INSERT INTO products (name, brand, category, retailer, country, external_url, image_url, fragrance_level, texture, color_free)
  VALUES (
    '넘버즈인 3번 모공제로 화잘먹 패드',
    '넘버즈인',
    'toner',
    '올리브영',
    'KR',
    'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000257095',
    'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0025/A00000025709520ko.jpg?l=ko&QT=85&SF=webp&sharpen=1x0.5',
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

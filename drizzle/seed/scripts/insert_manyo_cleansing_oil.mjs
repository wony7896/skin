import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

// Korean ingredient name (Olive Young "상품정보 제공고시" legal disclosure, printed order) ->
// verified English INCI name, confirmed via live query against kcia.or.kr/cid returning an
// EXACT 성분명 match. Verified 2026-08-26.
// Note: "식물성스쿠알란" has no separate English registration in KCIA (Function/CAS blank) —
// INCI treats plant- and non-plant-sourced squalane identically as "Squalane"; resolved
// directly to the existing "Squalane" ingredient row rather than via CosIng lookup.
const koreanToEnglish = [
  ["돌콩오일", "Glycine Soja (Soybean) Oil"],
  ["유럽개암씨오일", "Corylus Avellana (Hazelnut) Seed Oil"],
  ["솔베스-30테트라올리에이트", "Sorbeth-30 Tetraoleate"],
  ["포도씨오일", "Vitis Vinifera (Grape) Seed Oil"],
  ["식물성오일", "Vegetable Oil"],
  ["올리브오일", "Olea Europaea (Olive) Fruit Oil"],
  ["카프릴릭/카프릭트라이글리세라이드", "Caprylic/Capric Triglyceride"],
  ["오렌지껍질오일", "Citrus Aurantium Dulcis (Orange) Peel Oil"],
  ["올리브껍질오일", "Olea Europaea (Olive) Husk Oil"],
  ["호호바씨오일", "Simmondsia Chinensis (Jojoba) Seed Oil"],
  ["라벤더오일", "Lavandula Angustifolia (Lavender) Oil"],
  ["식물성스쿠알란", "Squalane"],
  ["티트리잎오일", "Melaleuca Alternifolia (Tea Tree) Leaf Oil"],
  ["정제수", "Water"],
  ["부틸렌글라이콜", "Butylene Glycol"],
  ["토코페롤", "Tocopherol"],
  ["해바라기씨오일", "Helianthus Annuus (Sunflower) Seed Oil"],
  ["달맞이꽃오일", "Oenothera Biennis (Evening Primrose) Oil"],
  ["동백나무씨오일", "Camellia Japonica Seed Oil"],
  ["바바수씨오일", "Orbignya Oleifera Seed Oil"],
  ["쌀겨오일", "Oryza Sativa Bran Oil"],
  ["아르간커넬오일", "Argania Spinosa Kernel Oil"],
  ["아이소아밀라우레이트", "Isoamyl Laurate"],
  ["알로에베라잎추출물", "Aloe Barbadensis Leaf Extract"],
  ["글리세린", "Glycerin"],
  ["데실글루코사이드", "Decyl Glucoside"],
  ["은행나무잎추출물", "Ginkgo Biloba Leaf Extract"],
  ["비누풀잎추출물", "Saponaria Officinalis Leaf Extract"],
  ["말토덱스트린", "Maltodextrin"],
  ["녹차추출물", "Camellia Sinensis Leaf Extract"],
  ["1,2-헥산다이올", "1,2-Hexanediol"],
  ["쌀발효여과물", "Rice Ferment Filtrate (Sake)"],
  ["리모넨", "Limonene"],
  ["리날룰", "Linalool"],
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

// 마녀공장 퓨어 소이빈 클렌징 오일 200ml, 올리브영(oliveyoung.co.kr) 국내 판매, country='KR'.
// 라벤더오일/오렌지껍질오일/티트리잎오일 등 에센셜오일 유래 향 성분(리모넨/리날룰 포함) 존재 ->
// fragranceLevel: light. 착색료 미포함 -> colorFree: true. 오일 제형 -> texture: light.
const [product] = await sql`
  INSERT INTO products (name, brand, category, retailer, country, external_url, image_url, fragrance_level, texture, color_free)
  VALUES (
    '마녀공장 퓨어 소이빈 클렌징 오일 200ml',
    '마녀공장',
    'cleansing',
    '올리브영',
    'KR',
    'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000107679',
    'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0010/A00000010767956ko.jpg?l=ko',
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

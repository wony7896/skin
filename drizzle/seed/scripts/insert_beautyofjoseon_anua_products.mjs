import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

// All ingredient lists sourced from oliveyoung.co.kr's mandatory disclosure ("상품정보
// 제공고시"), Korean names verified via kcia.or.kr/cid, 2026-08-26.
// Note: CosIng's registered INCI strings for rice/fig/cocoa/eggplant/turmeric extracts do
// NOT include the common-name parenthetical (e.g. "Oryza Sativa Extract", not "Oryza Sativa
// (Rice) Extract") - verified against actual ingredient_ref.cosing_ingredients rows, not
// guessed. "C12-13알케스-9" (Anua cream) has no CosIng match at all - it is a distinct
// substance from the similarly-named C12-13 Pareth-9, so it is intentionally left unlinked
// rather than guess-substituted.
const products = [
  {
    name: "조선미녀 맑은쌀채운 토너",
    brand: "조선미녀",
    category: "toner",
    externalUrl: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000213097",
    imageUrl: "https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0021/A00000021309706ko.jpg?l=ko&QT=85&SF=webp&sharpen=1x0.5",
    fragranceLevel: "none",
    texture: "light",
    colorFree: true,
    koreanToEnglish: [
      ["정제수", "Water"], ["메틸프로판다이올", "Methylpropanediol"], ["프로판다이올", "Propanediol"],
      ["1,2-헥산다이올", "1,2-Hexanediol"], ["글리세린", "Glycerin"], ["글리세레스-26", "Glycereth-26"],
      ["폴리메틸메타크릴레이트", "Polymethyl Methacrylate"], ["쌀추출물", "Oryza Sativa Extract"],
      ["황련뿌리추출물", "Coptis Japonica Root Extract"], ["당느릅나무뿌리추출물", "Ulmus Davidiana Root Extract"],
      ["줄맨드라미씨추출물", "Amaranthus Caudatus Seed Extract"], ["무화과추출물", "Ficus Carica Fruit Extract"],
      ["병풀추출물", "Centella Asiatica Extract"], ["카카오씨추출물", "Theobroma Cacao Seed Extract"],
      ["하이드로제네이티드레시틴", "Hydrogenated Lecithin"], ["소듐하이알루로네이트", "Sodium Hyaluronate"],
      ["판테놀", "Panthenol"], ["하이드록시에틸우레아", "Hydroxyethyl Urea"],
      ["알루미늄클로로하이드레이트", "Aluminum Chlorohydrate"], ["부틸렌글라이콜", "Butylene Glycol"],
      ["마이크로크리스탈린셀룰로오스", "Microcrystalline Cellulose"], ["소듐시트레이트", "Sodium Citrate"],
      ["카올린", "Kaolin"], ["에틸헥실글리세린", "Ethylhexylglycerin"],
      ["다이포타슘글리시리제이트", "Dipotassium Glycyrrhizate"], ["시트릭애씨드", "Citric Acid"],
      ["덱스트린", "Dextrin"], ["세라마이드엔피", "Ceramide NP"], ["토코페롤", "Tocopherol"],
      ["쌀아미노산", "Rice Amino Acids"],
    ],
  },
  {
    name: "아누아 PDRN 히알루론산 100 수분 크림",
    brand: "아누아",
    category: "cream_lotion",
    externalUrl: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000231892",
    imageUrl: "https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0023/A00000023189207ko.jpg?l=ko&QT=85&SF=webp&sharpen=1x0.5",
    fragranceLevel: "none",
    texture: "medium",
    colorFree: true,
    koreanToEnglish: [
      ["정제수", "Water"], ["스쿠알란", "Squalane"], ["글리세린", "Glycerin"], ["나이아신아마이드", "Niacinamide"],
      ["펜틸렌글라이콜", "Pentylene Glycol"], ["1,2-헥산다이올", "1,2-Hexanediol"], ["소듐디엔에이", "Sodium DNA"],
      ["하이드롤라이즈드콜라겐", "Hydrolyzed Collagen"], ["소듐하이알루로네이트", "Sodium Hyaluronate"],
      ["인도멀구슬나무잎추출물", "Melia Azadirachta Leaf Extract"],
      ["하이드롤라이즈드하이알루로닉애씨드", "Hydrolyzed Hyaluronic Acid"],
      ["인도멀구슬나무꽃추출물", "Melia Azadirachta Flower Extract"],
      ["아이비고드열매추출물", "Coccinia Indica Fruit Extract"], ["하이알루로닉애씨드", "Hyaluronic Acid"],
      ["알로에베라꽃추출물", "Aloe Barbadensis Flower Extract"],
      ["가지열매추출물", "Solanum Melongena Fruit Extract"],
      ["홀리바질잎추출물", "Ocimum Sanctum Leaf Extract"], ["참산호말추출물", "Corallina Officinalis Extract"],
      ["울금뿌리추출물", "Curcuma Longa Root Extract"],
      ["병풀잎추출물", "Centella Asiatica Leaf Extract"],
      ["다이페닐실록시페닐트라이메티콘", "Diphenylsiloxy Phenyl Trimethicone"],
      ["피씨에이다이메티콘", "PCA Dimethicone"], ["부틸렌글라이콜", "Butylene Glycol"],
      ["프로판다이올", "Propanediol"],
      ["암모늄아크릴로일다이메틸타우레이트/브이피코폴리머", "Ammonium Acryloyldimethyltaurate/VP Copolymer"],
      ["다이글리세린", "Diglycerin"],
      ["하이드록시에틸아크릴레이트/소듐아크릴로일다이메틸타우레이트코폴리머", "Hydroxyethyl Acrylate/Sodium Acryloyldimethyl Taurate Copolymer"],
      ["아크릴레이트/C10-30알킬아크릴레이트크로스폴리머", "Acrylates/C10-30 Alkyl Acrylate Crosspolymer"],
      ["C12-20알킬글루코사이드", "C12-20 Alkyl Glucoside"], ["메틸프로판다이올", "Methylpropanediol"],
      ["에틸헥실글리세린", "Ethylhexylglycerin"], ["아데노신", "Adenosine"], ["소듐파이테이트", "Sodium Phytate"],
      ["아미노메틸프로판다이올", "Aminomethyl Propanediol"], ["피브이엠/엠에이코폴리머", "PVM/MA Copolymer"],
      ["마데카소사이드", "Madecassoside"], ["C12-13알케스-9", "C12-13 Alketh-9"],
      ["다이메틸실란올하이알루로네이트", "Dimethylsilanol Hyaluronate"],
      ["하이드롤라이즈드소듐하이알루로네이트", "Hydrolyzed Sodium Hyaluronate"],
      ["아시아티코사이드", "Asiaticoside"], ["포타슘하이알루로네이트", "Potassium Hyaluronate"],
      ["하이드록시프로필트라이모늄하이알루로네이트", "Hydroxypropyltrimonium Hyaluronate"],
      ["소듐하이알루로네이트크로스폴리머", "Sodium Hyaluronate Crosspolymer"],
      ["소듐하이알루로네이트다이메틸실란올", "Sodium Hyaluronate Dimethylsilanol"],
      ["소듐아세틸레이티드하이알루로네이트", "Sodium Acetylated Hyaluronate"],
    ],
  },
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

const summary = [];
for (const p of products) {
  let aliasesAdded = 0;
  const koreanNameToId = {};
  for (const [ko, en] of p.koreanToEnglish) {
    const id = await resolveIngredientId(en);
    if (!id) {
      console.log("WARNING: could not resolve English name:", en, "for", p.name);
      continue;
    }
    koreanNameToId[ko] = id;
    const existing = await sql`SELECT id FROM ingredient_aliases WHERE alias = ${ko}`;
    if (existing.length === 0) {
      await sql`INSERT INTO ingredient_aliases (ingredient_id, alias) VALUES (${id}, ${ko})`;
      aliasesAdded++;
    }
  }

  const [product] = await sql`
    INSERT INTO products (name, brand, category, retailer, country, external_url, image_url, fragrance_level, texture, color_free)
    VALUES (${p.name}, ${p.brand}, ${p.category}, '올리브영', 'KR', ${p.externalUrl}, ${p.imageUrl}, ${p.fragranceLevel}, ${p.texture}, ${p.colorFree})
    RETURNING id
  `;

  let matched = 0;
  const unmatched = [];
  for (let i = 0; i < p.koreanToEnglish.length; i++) {
    const [ko] = p.koreanToEnglish[i];
    const id = koreanNameToId[ko];
    if (id) {
      await sql`INSERT INTO product_ingredients (product_id, ingredient_id, position) VALUES (${product.id}, ${id}, ${i + 1})`;
      matched++;
    } else {
      unmatched.push(ko);
    }
  }
  summary.push({ name: p.name, productId: product.id, aliasesAdded, total: p.koreanToEnglish.length, matched, unmatched });
}

console.log(JSON.stringify(summary, null, 2));
await sql.end();

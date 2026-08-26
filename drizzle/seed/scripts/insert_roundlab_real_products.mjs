import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

// Sourced live from roundlab.com's public product pages (no login required), 2026-08-26.
// Ingredient lists copied verbatim from each page's "Full Ingredients" section.
const products = [
  {
    name: "Round Lab 1025 Dokdo Toner",
    category: "toner",
    externalUrl: "https://roundlab.com/products/1025-dokdo-toner",
    imageUrl: "https://cdn.shopify.com/s/files/1/0651/7656/8022/files/1025-dokdo-toner-round-lab-3.jpg?v=1774657694",
    ingredientsRaw: "Water, Butylene Glycol, Glycerin, Pentylene Glycol, Propanediol, Chondrus Crispus Extract, Saccharum Officinarum (Sugarcane) Extract, Sea Water, 1,2-Hexanediol, Protease, Betaine, Panthenol, Ethylhexylglycerin, Allantoin, Xanthan Gum, Disodium EDTA",
    fragranceLevel: "none",
    texture: "light",
    colorFree: true,
  },
  {
    name: "Round Lab 1025 Dokdo Cleanser",
    category: "cleansing",
    externalUrl: "https://roundlab.com/products/1025-dokdo-cleanser",
    imageUrl: "https://cdn.shopify.com/s/files/1/0651/7656/8022/files/Dokdo_cleanser_renewed.webp?v=1772852868",
    ingredientsRaw: "Water, Sodium Cocoyl Isethionate, Glycerin, Sodium Methyl Cocoyl Taurate, Coco-Betaine, Potassium Cocoyl Glycinate, Potassium Benzoate, Sodium Chloride, Polyquaternium-67, Potassium Cocoate, Citric Acid, Fructooligosaccharides, Saccharide Hydrolysate, Disodium EDTA, Pullulan, 1,2-Hexanediol, Allantoin, Panthenol, Sea Water, Sodium Acetate, Butylene Glycol, Chamomilla Recutita (Matricaria) Flower Oil, Caprylic/Capric Triglyceride, Beta-Glucan, Phosphatidylcholine, Hyaluronic Acid, Ethylhexylglycerin, Ceramide NP, Glycine, Hydrolyzed Hyaluronic Acid, Glutamic Acid, Serine, Sodium Hyaluronate, Lysine, Alanine, Arginine, Threonine, Proline",
    fragranceLevel: "none",
    texture: "light",
    colorFree: true,
  },
  {
    name: "Round Lab Birch Moisturizing Serum",
    category: "essence_serum",
    externalUrl: "https://roundlab.com/products/birch-moisturizing-serum",
    imageUrl: "https://roundlab.com/cdn/shop/files/birch-moisturizing-serum-round-lab-1.png?v=1776123015&width=1946",
    ingredientsRaw: "Water, Methylpropanediol, Glycerin, 1,2-Hexanediol, Polyglycerin-3, Caprylic/Capric Triglyceride, Betula Platyphylla Japonica Juice, Sodium Hyaluronate, Glyceryl Glucoside, Hydrolyzed Hyaluronic Acid, Butylene Glycol, Hyaluronic Acid, Ascorbic Acid, Beta-Glucan, Dipotassium Glycyrrhizate, Hydrogenated Lecithin, Ethylhexylglycerin, Eclipta Prostrata Leaf Extract, Laminaria Japonica Extract, Avena Sativa (Oat) Kernel Extract, Cynara Scolymus (Artichoke) Leaf Extract, Pteris Multifida Extract, Melia Azadirachta Leaf Extract, Melia Azadirachta Flower Extract, Coccinia Indica Fruit Extract, Aloe Barbadensis Flower Extract, Solanum Melongena (Eggplant) Fruit Extract, Ocimum Sanctum Leaf Extract, Corallina Officinalis Extract, Curcuma Longa (Turmeric) Root Extract, Cyclohexasiloxane, Dipropylene Glycol, Ammonium Acryloyldimethyltaurate/VP Copolymer, Xanthan Gum, Fructooligosaccharides, Carbomer, Disodium EDTA, Polyquaternium-51, Tromethamine, Tocopherol",
    fragranceLevel: "none",
    texture: "light",
    colorFree: true,
  },
  {
    name: "Round Lab 1025 Dokdo Cream",
    category: "cream_lotion",
    externalUrl: "https://roundlab.com/products/1025-dokdo-cream",
    imageUrl: "https://cdn.shopify.com/s/files/1/0651/7656/8022/files/1025-dokdo-cream-round-lab-1_66b8271b-613f-4510-82e8-b15abb0f1e37.jpg?v=1772849283",
    ingredientsRaw: "Water, Glycerin, Caprylic/Capric Triglyceride, Dipropylene Glycol, Hydrogenated Poly(C6-14 Olefin), Cetearyl Alcohol, Methyl Trimethicone, 1,2-Hexanediol, Caprylyl Methicone, Phenyl Trimethicone, C12-16 Alcohols, Butyrospermum Parkii (Shea) Butter, Sea Water, Chondrus Crispus Extract, Saccharum Officinarum (Sugarcane) Extract, Hyaluronic Acid, Hydrolyzed Hyaluronic Acid, Sodium Hyaluronate, Glyceryl Stearate SE, Ceramide AP, Ceramide AS, Ceramide EOP, Ceramide NP, Ceramide NS, Polymethylsilsesquioxane, Palmitic Acid, Cetearyl Glucoside, Cetearyl Olivate, Sorbitan Olivate, Hydrogenated Lecithin, Copernicia Cerifera (Carnauba) Wax, Stearic Acid, Ammonium Acryloyldimethyltaurate/VP Copolymer, Ethylhexylglycerin, Glyceryl Caprylate, Allantoin, Panthenol, Butylene Glycol, Beta-Glucan, Cholesterol, Phytosphingosine, Disodium EDTA",
    fragranceLevel: "none",
    texture: "rich",
    colorFree: true,
  },
  {
    name: "Round Lab Birch Juice Moisturizing Sun Serum SPF50",
    category: "sunscreen_spot",
    externalUrl: "https://roundlab.com/products/birch-juice-moisturizing-sun-serum-spf50",
    imageUrl: "https://roundlab.com/cdn/shop/files/Birch_Sun_Serum_6.jpg?v=1782887683&width=1946",
    ingredientsRaw: "Water, Butyloctyl Salicylate, Dipropylene Glycol, Benzotriazolyl Dodecyl p-Cresol, Ethylhexyl Methoxycrylene, Vinyl Dimethicone, Tripropylene Glycol, Sorbitol, 1,2-Hexanediol, Silica, Diethylhexyl 2,6-Naphthalate, Aminomethyl Propanol, Betula Platyphylla Japonica Juice, Diglycerin, Behenyl Alcohol, Pentylene Glycol, Polyglyceryl-3 Methylglucose Distearate, Panthenol, Butylene Glycol, Poly C10-30 Alkyl Acrylate, Dimethiconol, Polyphenylsilsesquioxane, Dimethicone/Vinyl Dimethicone Crosspolymer, Tromethamine, Hydroxyacetophenone, Polyacrylic Acid, Palmitic Acid, Stearic Acid, Artemisia Annua Extract, Methylpropanediol, Polyether-1, Sphingomonas Ferment Extract, Sodium Stearoyl Glutamate, Polyacrylate Crosspolymer-6, Bacillus Ferment, Sodium Hyaluronate, Glycerin, Anthemis Nobilis Flower Oil, Pinus Sylvestris Leaf Oil, Aloe Barbadensis Leaf Extract, Dioscorea Japonica Root Extract, Ethylhexylglycerin, Laminaria Japonica Extract, Ulmus Davidiana Root Extract, Viola Mandshurica Flower Extract, Glyceryl Glucoside, Arginine, Caprylic Acid, Cetearyl Alcohol, Cetearyl Olivate, Sorbitan Olivate, Hydrogenated Lecithin, Betulin, Carbomer, Hydroxypropyltrimonium Hyaluronate, Hydrolyzed Hyaluronic Acid, Sodium Acetylated Hyaluronate, Sodium DNA, Hyaluronic Acid, Glycine, Glutamic Acid, Hydrolyzed Sodium Hyaluronate, Sodium Hyaluronate Crosspolymer, Potassium Hyaluronate",
    fragranceLevel: "none",
    texture: "medium",
    colorFree: true,
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
  const [row] = await sql`
    INSERT INTO products (name, brand, category, retailer, country, external_url, image_url, fragrance_level, texture, color_free)
    VALUES (${p.name}, 'Round Lab', ${p.category}, 'Round Lab 공식몰', 'US', ${p.externalUrl}, ${p.imageUrl}, ${p.fragranceLevel}, ${p.texture}, ${p.colorFree})
    RETURNING id
  `;
  const names = p.ingredientsRaw.split(/,\s+/).map((s) => s.trim()).filter(Boolean);
  let matched = 0;
  let unmatched = [];
  for (let i = 0; i < names.length; i++) {
    const ingId = await resolveIngredientId(names[i]);
    if (ingId) {
      await sql`INSERT INTO product_ingredients (product_id, ingredient_id, position) VALUES (${row.id}, ${ingId}, ${i + 1})`;
      matched++;
    } else {
      unmatched.push(names[i]);
    }
  }
  summary.push({ name: p.name, productId: row.id, total: names.length, matched, unmatched });
}

console.log(JSON.stringify(summary, null, 2));
await sql.end();

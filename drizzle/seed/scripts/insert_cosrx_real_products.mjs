import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

// Sourced live from cosrx.com's public product pages (no login required), 2026-08-26.
// Ingredient lists copied verbatim from each page's "Full Ingredients"/"Ingredient List"
// section (DOM text extraction, not retyped from memory). Image URLs are the site's own
// real product photos (Shopify CDN, {width} template resolved to 800px).
// Thumbnail selection criteria (2026-08-26 revision): single product only, no people/body
// parts, not a multi-pack/bundle shot, minimal promotional text overlay. Pulled candidates
// from each product's Shopify .json endpoint (product.images[].src/alt) rather than
// guessing from filenames - most of COSRX's default gallery images are marketing
// infographics or before/after photos, not plain packshots.
const products = [
  {
    name: "COSRX Low pH Good Morning Gel Cleanser",
    category: "cleansing",
    externalUrl: "https://www.cosrx.com/collections/cleansers/products/low-ph-good-morning-gel-cleanser",
    imageUrl: "https://www.cosrx.com/cdn/shop/files/low-ph-good-morning-gel-cleanser-cosrx-official-12_800x.jpg?v=1768785801",
    ingredientsRaw: "Water, Cocamidopropyl Betaine, Sodium Lauroyl Methyl Isethionate, Sodium Chloride, Polysorbate 20, Styrax Japonicus Branch/Fruit/Leaf Extract, Butylene Glycol, Saccharomyces Ferment, Cryptomeria Japonica Leaf Extract, Nelumbo Nucifera Leaf Extract, Pinus Palustris Leaf Extract, Ulmus Davidiana Root Extract, Oenothera Biennis (Evening Primrose) Flower Extract, Pueraria Lobata Root Extract, Melaleuca Alternifolia (Tea Tree) Leaf Oil, Allantoin, Caprylyl Glycol, Ethylhexylglycerin, Betaine Salicylate, Citric Acid, Ethyl Hexanediol, 1,2-Hexanediol, Trisodium Ethylenediamine Disuccinate, Sodium Benzoate, Disodium EDTA",
    fragranceLevel: "none",
    texture: "light",
    colorFree: true,
  },
  {
    name: "COSRX AHA/BHA Clarifying Treatment Toner",
    category: "toner",
    externalUrl: "https://www.cosrx.com/collections/toners/products/aha-bha-clarifying-treatment-toner",
    imageUrl: "https://www.cosrx.com/cdn/shop/files/ahabha-clarifying-treatment-toner-cosrx-official-1_800x.jpg?v=1724835581",
    ingredientsRaw: "Water, Salix Alba (Willow) Bark Water, Pyrus Malus (Apple) Fruit Water, Butylene Glycol, 1,2-Hexanediol, Sodium Lactate, Glycolic Acid, Betaine Salicylate, Allantoin, Panthenol, Ethyl Hexanediol",
    fragranceLevel: "none",
    texture: "light",
    colorFree: true,
  },
  {
    name: "COSRX Advanced Snail 96 Mucin Power Essence",
    category: "essence_serum",
    externalUrl: "https://www.cosrx.com/collections/serums-essences/products/advanced-snail-96-mucin-power-essence",
    imageUrl: "https://cdn.shopify.com/s/files/1/0513/3775/6828/files/advanced-snail-96-mucin-power-essence-cosrx-official-10.jpg?v=1763111577",
    ingredientsRaw: "Snail Secretion Filtrate, Betaine, Butylene Glycol, 1,2-Hexanediol, Sodium Polyacrylate, Phenoxyethanol, Sodium Hyaluronate, Allantoin, Ethyl Hexanediol, Carbomer, Panthenol, Arginine, Aqua/Water",
    fragranceLevel: "none",
    texture: "light",
    colorFree: true,
  },
  {
    name: "COSRX The Niacinamide 15 Serum",
    category: "essence_serum",
    externalUrl: "https://www.cosrx.com/collections/serums-essences/products/the-niacinamide-15-serum",
    imageUrl: "https://cdn.shopify.com/s/files/1/0513/3775/6828/files/niacin.png?v=1748420816",
    ingredientsRaw: "Water, Pentylene Glycol, Niacinamide(15%), Butylene Glycol, Acetyl Glucosamine, 1,2-Hexanediol, Zinc PCA, Trehalose, Xanthan Gum, Pullulan, Allantoin, Ethylhexylglycerin, Sodium Phytate, Citric Acid, Tocopherol",
    fragranceLevel: "none",
    texture: "light",
    colorFree: true,
  },
  {
    name: "COSRX Advanced Snail 92 All In One Cream",
    category: "cream_lotion",
    externalUrl: "https://www.cosrx.com/collections/moisturizer-cream/products/advanced-snail-92-all-in-one-cream",
    imageUrl: "https://cdn.shopify.com/s/files/1/0513/3775/6828/files/5_bc6986a1-1b85-42ce-b761-6bc4acbb07a3.png?v=1757571879",
    ingredientsRaw: "Snail Secretion Filtrate, Betaine, Caprylic/Capric Triglyceride, Butylene Glycol, Cetearyl Olivate, Sorbitan Olivate, Cetearyl Alcohol, Carbomer, Ethyl Hexanediol, Phenoxyethanol, Arginine, Dimethicone, Sodium Polyacrylate, Sodium Hyaluronate, Allantoin, Palmitic Acid, Panthenol, Xanthan Gum, Stearic acid, Adenosine, Water, Myristic Acid",
    fragranceLevel: "none",
    texture: "rich",
    colorFree: true,
  },
  {
    name: "COSRX The Retinol 0.3 Cream",
    category: "cream_lotion",
    externalUrl: "https://www.cosrx.com/collections/moisturizer-cream/products/the-retinol-0-3-cream",
    imageUrl: "https://cdn.shopify.com/s/files/1/0513/3775/6828/files/Retinol03Cream_800x1067_c88d3441-5851-4a65-8438-a93bbfb4f86b.webp?v=1724837060",
    ingredientsRaw: "Water, Caprylic/Capric Triglyceride, Butylene Glycol, Glycerin, Glycine Soja (Soybean) Oil, Tocopherol, Tocopheryl Acetate, Cetearyl Alcohol, Trehalose, Panthenol, Butyrospermum Parkii (Shea) Butter, Ammonium Acryloyldimethyltaurate/VP Copolymer, Dimethicone, Glyceryl Polymethacrylate, Polyglyceryl-10 Stearate, Hydrogenated Lecithin, Helianthus Annuus (Sunflower) Seed Oil, Hydroxyethyl Acrylate/Sodium Acryloyldimethyl Taurate Copolymer, Carbomer, Retinol(0.3%), Tromethamine, Glyceryl Stearate, Polysilicone-11, Sodium Sulfite, Daucus Carota Sativa (Carrot) Root Extract, Allantoin, Glyceryl Caprylate, Propanediol, Oryza Sativa (Rice) Bran Wax, Tocotrienols, Stearic Acid, Polyglyceryl-3 Methylglucose Distearate, Palmitic Acid, Ethylhexylglycerin, Disodium EDTA, Adenosine, Sodium Hyaluronate, Sorbitan Isostearate, 1,2-Hexanediol, Elaeis Guineensis (Palm) Oil, Hydrolyzed Hyaluronic Acid, Beta-Carotene, Sodium Hyaluronate Crosspolymer, Myristic Acid, Hyaluronic Acid, Lauric Acid, Sodium Acetylated Hyaluronate, Ascorbic Acid, Limnanthes Alba (Meadowfoam) Seed Oil, 3-O-Ethyl Ascorbic Acid, Glutathione",
    fragranceLevel: "none",
    texture: "rich",
    colorFree: true,
  },
  {
    name: "COSRX Aloe Soothing Sun Cream SPF50 PA+++",
    category: "sunscreen_spot",
    externalUrl: "https://www.cosrx.com/collections/sun-protection/products/aloe-soothing-sun-cream-spf50-pa",
    imageUrl: "https://cdn.shopify.com/s/files/1/0513/3775/6828/files/aloe-soothing-sun-cream-spf50-pa-cosrx-official-1.jpg?v=1724835559",
    ingredientsRaw: "WATER, ETHYLHEXYL METHOXYCINNAMATE, GLYCERIN, PROPYLENE GLYCOL, CYCLOPENTASILOXANE, PHENYLBENZIMIDAZOLE SULFONIC ACID, BIS-ETHYLHEXYLOXYPHENOL METHOXYPHENYL TRIAZINE, DICAPRYLYL CARBONATE, ISOAMYL P-METHOXYCINNAMATE, POTASSIUM CETYL PHOSPHATE, ALCOHOL, DIMETHICONE, BUTYLENE GLYCOL, GLYCERYL STEARATE, TITANIUM DIOXIDE, C14-22 ALCOHOLS, POLYMETHYL METHACRYLATE, CETEARYL ALCOHOL, PEG-100 STEARATE, TRIETHANOLAMINE, SILICA, SODIUM HYDROXIDE, DIMETHICONE/VINYL DIMETHICONE CROSSPOLYMER, C12-20 ALKYL GLUCOSIDE, ALUMINUM HYDROXIDE, STEARIC ACID, FRAGRANCE, CAPRYLYL GLYCOL, PHENOXYETHANOL, ACRYLATES/C10-30 ALKYL ACRYLATE CROSSPOLYMER, ALOE ARBORESCENS LEAF EXTRACT, DIPOTASSIUM GLYCYRRHIZATE, CARBOMER, XANTHAN GUM, LIMONENE, TOCOPHERYL ACETATE, DISODIUM EDTA, HEXYL CINNAMAL, LINALOOL, BENZYL SALICYLATE, GERANIOL, BENZYL ALCOHOL, CITRONELLOL, BENZYL BENZOATE, CITRAL",
    fragranceLevel: "strong",
    texture: "medium",
    colorFree: true,
  },
];

// Mirrors src/lib/ingredients.ts resolveIngredientId (case-insensitive, alias-aware,
// materializes from ingredient_ref when needed).
async function resolveIngredientId(rawName) {
  // Strip concentration suffixes like "(0.3%)" / "(15%)" - not part of the INCI name.
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

// "Water" is not the formal INCI name (that's "Aqua"); our reference data only has "Aqua".
// Materialize Aqua into the operational table once, then register "Water"/"Aqua/Water" as
// aliases so every future product listing "Water" (the common US-label form) resolves too.
const aquaId = await resolveIngredientId("Aqua");
if (aquaId) {
  await sql`
    INSERT INTO ingredient_aliases (ingredient_id, alias) VALUES (${aquaId}, 'Water')
    ON CONFLICT (alias) DO NOTHING
  `;
  await sql`
    INSERT INTO ingredient_aliases (ingredient_id, alias) VALUES (${aquaId}, 'Aqua/Water')
    ON CONFLICT (alias) DO NOTHING
  `;
}

const summary = [];
for (const p of products) {
  const [row] = await sql`
    INSERT INTO products (name, brand, category, retailer, country, external_url, image_url, fragrance_level, texture, color_free)
    VALUES (${p.name}, 'COSRX', ${p.category}, 'COSRX 공식몰', 'US', ${p.externalUrl}, ${p.imageUrl}, ${p.fragranceLevel}, ${p.texture}, ${p.colorFree})
    RETURNING id
  `;
  // Split on ", " (comma+space), not bare ",": real INCI names can carry an internal comma
  // with no following space (e.g. "1,2-Hexanediol"), which a naive split(",") would shred
  // into "1" and "2-Hexanediol". The source list's actual item separators are all ", ".
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

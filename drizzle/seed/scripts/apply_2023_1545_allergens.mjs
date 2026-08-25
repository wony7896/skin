import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

// [inciName, cas, entryNumber] - from Commission Regulation (EU) 2023/1545, Annex, point (3)
// "the following entries are added" (entries 327-371). Names = "Name of Common Ingredients
// Glossary" column; CAS = "CAS number" column values joined with " / " as printed.
// Entries 359 (Laurus Nobilis Leaf Oil) and the Citrus Limon Peel Oil case (entry 353) are
// deliberately EXCLUDED here - both names already carry an unrelated pre-existing Annex II
// (fully prohibited) restriction in our reference data for a specific extraction-method
// variant, and appending/touching that field risks disturbing the more safety-critical
// prohibition flag. Skipped rather than risk it; see conversation notes.
const rows = [
  ["Acetyl Cedrene", "32388-55-9", "327"],
  ["Amyl Salicylate", "2050-08-0", "328"],
  ["Anethole", "104-46-1 / 4180-23-8", "329"],
  ["Benzaldehyde", "100-52-7", "330"],
  ["Camphor", "76-22-2 / 21368-68-3 / 464-49-3 / 464-48-2", "331"],
  ["Beta-Caryophyllene", "87-44-5", "332"],
  ["Carvone", "99-49-0 / 6485-40-1 / 2244-16-8", "333"],
  ["Dimethyl Phenethyl Acetate", "151-05-3", "334"],
  ["Hexadecanolactone", "109-29-5", "335"],
  ["Hexamethylindanopyran", "1222-05-5", "336"],
  ["Linalyl Acetate", "115-95-7", "337"],
  ["Menthol", "89-78-1 / 1490-04-6 / 2216-51-5 / 15356-60-2", "338"],
  ["Trimethylcyclopentenyl Methylisopentenol", "67801-20-1", "339"],
  ["Salicylaldehyde", "90-02-8", "340"],
  ["Santalol", "11031-45-1 / 115-71-9 / 77-42-9", "341"],
  ["Sclareol", "515-03-7", "342"],
  ["Terpineol", "8000-41-7 / 98-55-5 / 138-87-4 / 586-81-2", "343"],
  ["Tetramethyl Acetyloctahydronaphthalenes", "54464-57-2 / 54464-59-4 / 68155-66-8 / 68155-67-9", "344"],
  ["Trimethylbenzenepropanol", "103694-68-4", "345"],
  ["Vanillin", "121-33-5", "346"],
  ["Cananga Odorata Flower Extract", "83863-30-3 / 8006-81-3 / 68606-83-7 / 93686-30-7", "347"],
  ["Cananga Odorata Flower Oil", "83863-30-3 / 8006-81-3 / 68606-83-7 / 93686-30-7", "347"],
  ["Cinnamomum Cassia Leaf Oil", "8007-80-5 / 84961-46-6", "348"],
  ["Cinnamomum Zeylanicum Bark Oil", "8015-91-6 / 84649-98-9", "349"],
  ["Citrus Aurantium Amara Flower Oil", "72968-50-4", "350"],
  ["Citrus Aurantium Dulcis Flower Oil", "8028-48-6 / 8016-38-4", "350"],
  ["Citrus Aurantium Amara Peel Oil", "68916-04-1 / 72968-50-4", "351"],
  ["Citrus Aurantium Dulcis Peel Oil", "97766-30-8 / 8028-48-6", "351"],
  ["Citrus Sinensis Peel Oil", "8008-57-9", "351"],
  ["Citrus Aurantium Bergamia Peel Oil", "8007-75-8 / 89957-91-5 / 68648-33-9 / 85049-52-1", "352"],
  ["Cymbopogon Schoenanthus Oil", "8007-02-1 / 89998-16-3", "354"],
  ["Cymbopogon Flexuosus Oil", "91844-92-7", "354"],
  ["Cymbopogon Citratus Leaf Oil", "8007-02-1 / 91844-92-7", "354"],
  ["Eucalyptus Globulus Leaf Oil", "97926-40-4 / 8000-48-4", "355"],
  ["Eucalyptus Globulus Leaf/Twig Oil", "8000-48-4", "355"],
  ["Eugenia Caryophyllus Leaf Oil", "8000-34-8 / 8015-97-2 / 84961-50-2", "356"],
  ["Eugenia Caryophyllus Flower Oil", "84961-50-2", "356"],
  ["Eugenia Caryophyllus Stem Oil", "84961-50-2", "356"],
  ["Eugenia Caryophyllus Bud Oil", "84961-50-2", "356"],
  ["Jasminum Grandiflorum Flower Extract", "84776-64-7 / 90045-94-6 / 8022-96-6 / 8024-43-9", "357"],
  ["Jasminum Officinale Oil", "84776-64-7 / 90045-94-6 / 8022-96-6 / 8024-43-9", "357"],
  ["Jasminum Officinale Flower Extract", "90045-94-6", "357"],
  ["Juniperus Virginiana Oil", "8000-27-9 / 85085-41-2", "358"],
  ["Juniperus Virginiana Wood Oil", "8000-27-9 / 85085-41-2", "358"],
  ["Lavandula Hybrida Oil", "91722-69-9 / 8022-15-9 / 93455-96-0 / 93455-97-1 / 92623-76-2", "360"],
  ["Lavandula Hybrida Extract", "91722-69-9 / 8022-15-9 / 93455-96-0 / 93455-97-1 / 92623-76-2", "360"],
  ["Lavandula Hybrida Flower Extract", "91722-69-9 / 8022-15-9 / 93455-96-0 / 93455-97-1 / 92623-76-2", "360"],
  ["Lavandula Intermedia Flower/Leaf/Stem Extract", "84776-65-8 / 8000-28-0 / 90063-37-9", "360"],
  ["Lavandula Intermedia Flower/Leaf/Stem Oil", "84776-65-8 / 8000-28-0 / 90063-37-9", "360"],
  ["Lavandula Intermedia Oil", "84776-65-8 / 8000-28-0 / 90063-37-9", "360"],
  ["Lavandula Angustifolia Oil", "84776-65-8 / 8000-28-0 / 90063-37-9", "360"],
  ["Lavandula Angustifolia Flower/Leaf/Stem Extract", "84776-65-8 / 8000-28-0 / 90063-37-9", "360"],
  ["Mentha Piperita Oil", "8006-90-4 / 84082-70-2", "361"],
  ["Mentha Viridis Leaf Oil", "8008-79-5 / 84696-51-5", "362"],
  ["Narcissus Poeticus Extract", "90064-26-9 / 68917-12-4", "363"],
  ["Narcissus Pseudonarcissus Flower Extract", "90064-27-0", "363"],
  ["Narcissus Jonquilla Extract", "90064-25-8", "363"],
  ["Narcissus Tazetta Extract", "90064-25-8", "363"],
  ["Pelargonium Graveolens Flower Oil", "90082-51-2 / 8000-46-2", "364"],
  ["Pogostemon Cablin Oil", "8014-09-3 / 84238-39-1", "365"],
  ["Rosa Damascena Flower Oil", "8007-01-0 / 90106-38-0", "366"],
  ["Rosa Damascena Flower Extract", "8007-01-0 / 90106-38-0", "366"],
  ["Rosa Alba Flower Oil", "93334-48-6", "366"],
  ["Rosa Alba Flower Extract", "93334-48-6", "366"],
  ["Rosa Canina Flower Oil", "84696-47-9", "366"],
  ["Rosa Centifolia Flower Oil", "84604-12-6", "366"],
  ["Rosa Centifolia Flower Extract", "84604-12-6", "366"],
  ["Rosa Gallica Flower Oil", "84604-13-7", "366"],
  ["Rosa Moschata Flower Oil", null, "366"],
  ["Rosa Rugosa Flower Oil", "92347-25-6", "366"],
  ["Santalum Album Oil", "8006-87-9 / 84787-70-2", "367"],
  ["Eugenyl Acetate", "93-28-7", "368"],
  ["Geranyl Acetate", "105-87-3", "369"],
  ["Isoeugenyl Acetate", "93-29-8", "370"],
  ["Pinene", "80-56-8 / 7785-70-8 / 127-91-3 / 18172-67-3", "371"],
];

let updated = 0, inserted = 0, skipped = 0;
const skippedNames = [];

for (const [name, cas, entry] of rows) {
  const existing = await sql`
    SELECT id, restriction, functions FROM ingredient_ref.cosing_ingredients
    WHERE lower(inci_name) = ${name.toLowerCase()}
  `;

  if (existing.length === 0) {
    await sql`
      INSERT INTO ingredient_ref.cosing_ingredients (inci_name, cas_no, restriction, function_raw, functions)
      VALUES (${name}, ${cas}, ${"III/" + entry}, 'PERFUMING', ARRAY['PERFUMING'])
    `;
    inserted++;
    continue;
  }

  const row = existing[0];
  if (row.restriction && row.restriction.trim() !== "") {
    // Existing row already carries a restriction we didn't set (e.g. an unrelated Annex II
    // prohibition) - don't touch it, log for manual review instead of guessing.
    skipped++;
    skippedNames.push({ name, existingRestriction: row.restriction });
    continue;
  }

  const hasPerfuming = row.functions && row.functions.includes("PERFUMING");
  const newFunctions = row.functions
    ? (hasPerfuming ? row.functions : [...row.functions, "PERFUMING"])
    : ["PERFUMING"];

  await sql`
    UPDATE ingredient_ref.cosing_ingredients
    SET restriction = ${"III/" + entry}, functions = ${newFunctions}
    WHERE id = ${row.id}
  `;
  updated++;
}

console.log("inserted:", inserted, "updated:", updated, "skipped:", skipped);
if (skippedNames.length > 0) {
  console.log("SKIPPED (manual review needed):", JSON.stringify(skippedNames, null, 2));
}

await sql.end();

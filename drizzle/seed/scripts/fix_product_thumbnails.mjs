import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, { max: 1 });

// Replacements found by pulling each product's own image gallery (Shopify .json product
// endpoint for COSRX/Round Lab, DOM scrape for Olive Young, brand's own cafe24 site for
// numbuzin) and screenshotting each candidate to verify: single product, no people/body
// parts, not a multi-pack, minimal/no promotional text overlay. 2026-08-26.
const updates = [
  {
    id: "76a09341-6ed4-4566-897f-6aba1262ed94",
    name: "COSRX Advanced Snail 96 Mucin Power Essence",
    url: "https://cdn.shopify.com/s/files/1/0513/3775/6828/files/advanced-snail-96-mucin-power-essence-cosrx-official-10.jpg?v=1763111577",
    note: "30mL travel-size bottle (same label design as the 100mL SKU we sell) - no clean solo shot of the 100mL exists in the gallery",
  },
  {
    id: "a64cc37c-09cc-4d33-a643-8cb0edeb55cb",
    name: "COSRX The Niacinamide 15 Serum",
    url: "https://cdn.shopify.com/s/files/1/0513/3775/6828/files/niacin.png?v=1748420816",
  },
  {
    id: "7330f9d4-bc05-4b5b-a75c-96d6472b610e",
    name: "COSRX Advanced Snail 92 All In One Cream",
    url: "https://cdn.shopify.com/s/files/1/0513/3775/6828/files/5_bc6986a1-1b85-42ce-b761-6bc4acbb07a3.png?v=1757571879",
  },
  {
    id: "be231e82-4473-4a77-9ec1-7d96bad86d99",
    name: "COSRX The Retinol 0.3 Cream",
    url: "https://cdn.shopify.com/s/files/1/0513/3775/6828/files/Retinol03Cream_800x1067_c88d3441-5851-4a65-8438-a93bbfb4f86b.webp?v=1724837060",
  },
  {
    id: "aa55e627-f508-4355-9940-1424c51a83fa",
    name: "COSRX Aloe Soothing Sun Cream SPF50 PA+++",
    url: "https://cdn.shopify.com/s/files/1/0513/3775/6828/files/aloe-soothing-sun-cream-spf50-pa-cosrx-official-1.jpg?v=1724835559",
  },
  {
    id: "9b6321a4-42bd-4769-b67a-a19ab2b62f43",
    name: "Round Lab 1025 Dokdo Cleanser",
    url: "https://cdn.shopify.com/s/files/1/0651/7656/8022/files/Dokdo_cleanser_renewed.webp?v=1772852868",
    note: "previously used the WRONG image entirely (a hand-with-foam shot that was also duplicated onto the Toner row) - real bug, not just a criteria violation",
  },
  {
    id: "a5d68ac8-ec72-4619-8246-56d28ec5712a",
    name: "Round Lab 1025 Dokdo Toner",
    url: "https://cdn.shopify.com/s/files/1/0651/7656/8022/files/1025-dokdo-toner-round-lab-3.jpg?v=1774657694",
    note: "was pointing at the Cleanser's image (copy-paste bug from the original insert script)",
  },
  {
    id: "debb1b5a-1465-489b-bc92-7ebc17bc8823",
    name: "Round Lab 1025 Dokdo Cream",
    url: "https://cdn.shopify.com/s/files/1/0651/7656/8022/files/1025-dokdo-cream-round-lab-1_66b8271b-613f-4510-82e8-b15abb0f1e37.jpg?v=1772849283",
  },
  {
    id: "05dbc4b2-3a61-4680-b530-22ededd7dbd4",
    name: "구달 맑은 어성초 진정 수분 선크림 50ml",
    url: "https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0021/A00000021955351ko.jpg?l=ko&QT=85&SF=webp&sharpen=1x0.5",
  },
  {
    id: "af1557d7-f247-4756-ace9-aeab9869cb71",
    name: "넘버즈인 3번 모공제로 화잘먹 패드",
    url: "https://ecimg.cafe24img.com/pg1613b12558170092/numbuzin0828/web/product/big/20260713/9317c9c7996073e90b9a2f013d878389.jpg",
    note: "every current Olive Young listing for this product is a promo bundle (idol photocards, dates, badges) - switched source to numbuzin.com's own product page instead; still has 2 small round badge labels ('각질케어'/'화잘먹') printed on the packshot, which is the cleanest available",
  },
  {
    id: "e04761f3-c98b-4e19-bbfd-38d72cd26859",
    name: "조선미녀 맑은쌀채운 토너",
    url: "https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0021/A00000021309706ko.jpg?l=ko&QT=85&SF=webp&sharpen=1x0.5",
  },
  {
    id: "beb62da8-c6b8-4e8e-921a-b899ad690aaa",
    name: "아누아 PDRN 히알루론산 100 수분 크림",
    url: "https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/0023/A00000023189207ko.jpg?l=ko&QT=85&SF=webp&sharpen=1x0.5",
    note: "original had a model's face/hand holding the product - most severe violation, replaced with plain packshot",
  },
];

for (const u of updates) {
  await sql`UPDATE products SET image_url = ${u.url} WHERE id = ${u.id}`;
  console.log("updated:", u.name);
}

const check = await sql`SELECT id, name, image_url FROM products WHERE id = ANY(${updates.map((u) => u.id)})`;
console.log(JSON.stringify(check, null, 1));

await sql.end();

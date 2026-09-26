import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "맞춤 스킨케어 추천",
    short_name: "스킨케어",
    description:
      "피부 상태·목표·알레르기 이력 기반으로 제외 성분을 거르고 목표에 맞는 제품을 추천합니다.",
    lang: "ko",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      // 아이콘 여백이 마스커블 안전영역을 만족하므로 같은 파일을 재사용한다
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

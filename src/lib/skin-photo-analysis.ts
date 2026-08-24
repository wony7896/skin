import sharp from "sharp";

// 색상 기반 홍조(붉은기) 추정 — 임상적으로 검증된 지표가 아니다.
//
// 절대 임계값 방식은 폐기했다: 피부의 R(적색) 채널은 멜라닌·헤모글로빈 흡수 특성상
// 모든 피부톤에서 자연히 G/B보다 높고, 그 정도는 피부톤 자체에 따라 크게 달라진다
// (실측 결과 일반적인 밝은 피부도 R/G 1.3 이상이 흔했다). 그래서 고정 임계값을 쓰면
// 피부톤이 어두울수록 항상 "더 붉다"고 오판하는 구조적 편향이 생긴다.
//
// 대신 같은 사용자의 이전 체크인 사진과 R/G 비율을 상대 비교한다 — 조명 조건이
// 비슷한 셀피끼리 비교하는 편이 절대값보다 훨씬 defensible하다.
export async function estimateRednessRatio(buffer: Buffer): Promise<number> {
  const { data, info } = await sharp(buffer)
    .resize(64, 64, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels; // 3 (RGB)
  let sumR = 0;
  let sumG = 0;
  const pixelCount = data.length / channels;

  for (let i = 0; i < data.length; i += channels) {
    sumR += data[i];
    sumG += data[i + 1];
  }

  const meanR = sumR / pixelCount;
  const meanG = sumG / pixelCount;
  return meanG === 0 ? 1 : meanR / meanG;
}

const RELATIVE_CHANGE_THRESHOLD = 0.08; // ±8% 미만은 "비슷함"으로 취급

export function compareRednessRatios(
  current: number,
  baseline: number,
): "increased" | "decreased" | "similar" {
  const relativeChange = (current - baseline) / baseline;
  if (relativeChange > RELATIVE_CHANGE_THRESHOLD) return "increased";
  if (relativeChange < -RELATIVE_CHANGE_THRESHOLD) return "decreased";
  return "similar";
}

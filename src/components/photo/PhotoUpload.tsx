"use client";

import { useState } from "react";
import { analyzeSkinPhoto } from "@/app/photo/actions";
import { grantConsent } from "@/app/consent/actions";
import { createClient } from "@/lib/supabase/client";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function PhotoUpload({
  path,
  onChange,
  onAnalyzed,
  hasPhotoConsent,
}: {
  path: string | null;
  onChange: (path: string | null) => void;
  /** 제공하면 업로드 직후 이전 체크인 사진과 홍조를 상대 비교해 결과를 전달한다 (색상 기반 휴리스틱, 참고용) */
  onAnalyzed?: (comparison: "increased" | "decreased" | "similar" | null) => void;
  /** 얼굴 사진(생체정보) 처리 동의 여부 — false면 업로드 UI 대신 별도 동의 체크박스를 먼저 보여준다 (PRD 섹션 6) */
  hasPhotoConsent: boolean;
}) {
  const [consented, setConsented] = useState(hasPhotoConsent);
  const [isConsenting, setIsConsenting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConsent() {
    setIsConsenting(true);
    const res = await grantConsent("biometric_photo");
    setIsConsenting(false);
    if (res.success) {
      setConsented(true);
    } else {
      setError(res.error);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("JPG, PNG, WEBP 파일만 업로드할 수 있어요.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("파일 크기는 10MB 이하만 가능해요.");
      return;
    }

    setError(null);
    setIsUploading(true);
    setPreviewUrl(URL.createObjectURL(file));

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("로그인이 필요합니다.");
      setIsUploading(false);
      return;
    }

    const ext = file.name.split(".").pop();
    const objectPath = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("skin-photos")
      .upload(objectPath, file);

    setIsUploading(false);

    if (uploadError) {
      setError("업로드에 실패했어요. 다시 시도해주세요.");
      return;
    }

    onChange(objectPath);

    if (onAnalyzed) {
      setIsAnalyzing(true);
      const result = await analyzeSkinPhoto(objectPath);
      setIsAnalyzing(false);
      if (result.success) {
        onAnalyzed(result.comparison);
      }
    }
  }

  function handleRemove() {
    setPreviewUrl(null);
    onChange(null);
  }

  if (!consented) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <p className="mb-2 text-xs text-neutral-600">
          얼굴이 담긴 피부 사진은 생체정보로 분류될 수 있어 별도 동의가
          필요해요. 동의하지 않아도 사진 없이 계속 진행할 수 있어요.
        </p>
        <button
          type="button"
          onClick={handleConsent}
          disabled={isConsenting}
          className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs text-neutral-700 hover:border-neutral-400 disabled:opacity-50"
        >
          {isConsenting ? "처리 중..." : "동의하고 사진 첨부하기"}
        </button>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      {previewUrl ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="업로드한 피부 사진 미리보기"
            className="h-20 w-20 rounded-lg object-cover"
          />
          <div className="text-sm">
            {isUploading ? (
              <span className="text-neutral-500">업로드 중...</span>
            ) : isAnalyzing ? (
              <span className="text-neutral-500">사진 분석 중...</span>
            ) : path ? (
              <span className="text-neutral-600">업로드 완료</span>
            ) : null}
            <button
              type="button"
              onClick={handleRemove}
              className="ml-2 text-neutral-400 underline"
            >
              제거
            </button>
          </div>
        </div>
      ) : (
        <label className="inline-block cursor-pointer rounded-lg border border-dashed border-neutral-300 px-3 py-2 text-sm text-neutral-500 hover:border-neutral-400">
          사진 선택 (선택 사항)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

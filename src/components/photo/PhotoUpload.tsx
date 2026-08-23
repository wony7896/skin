"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function PhotoUpload({
  path,
  onChange,
}: {
  path: string | null;
  onChange: (path: string | null) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  }

  function handleRemove() {
    setPreviewUrl(null);
    onChange(null);
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

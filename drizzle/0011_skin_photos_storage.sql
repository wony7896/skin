-- 피부 사진 업로드용 비공개 버킷. 체크인(섹션 1-②)과 이벤트 리포트(섹션 1-③)의
-- "사진 업로드(선택)" 항목을 지원한다. public=false이며, 서명된 URL로만 조회 가능.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('skin-photos', 'skin-photos', false, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 본인 폴더(userId/...)에만 업로드·조회·삭제 가능
CREATE POLICY "skin_photos_owner_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'skin-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "skin_photos_owner_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'skin-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "skin_photos_owner_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'skin-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

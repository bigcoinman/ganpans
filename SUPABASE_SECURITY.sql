-- ========================================================
-- 간판지원단(ganpans) Supabase 보안 강화 SQL (Production RLS)
-- ========================================================

-- 1. 모든 테이블에 Row Level Security (RLS) 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 정리 (중복 방지)
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can insert applications" ON public.applications;
DROP POLICY IF EXISTS "Users can read own applications" ON public.applications;
DROP POLICY IF EXISTS "Anyone can register user" ON public.users;
DROP POLICY IF EXISTS "Users can read own data" ON public.users;

-- 3. 후기(reviews) 테이블 보안 정책
-- 누구나 후기를 읽을 수 있음
CREATE POLICY "Anyone can read reviews" 
ON public.reviews FOR SELECT 
USING (true);

-- 익명/인증 사용자 모두 후기 등록 가능
CREATE POLICY "Anyone can insert reviews" 
ON public.reviews FOR INSERT 
WITH CHECK (length(content) <= 150 AND length(shop_name) <= 50);

-- 4. 지원금 신청서(applications) 테이블 보안 정책
-- 신청서는 누구나 작성 가능
CREATE POLICY "Anyone can insert applications" 
ON public.applications FOR INSERT 
WITH CHECK (length(owner_name) > 0 AND length(phone) > 0);

-- 신청서 조회: 본인이 신청한 데이터 또는 전체 조회(익명 키 처리 지원)
CREATE POLICY "Anyone can read applications" 
ON public.applications FOR SELECT 
USING (true);

-- 신청서 임의 삭제/수정 금지 (관리자 전용 권한 보호)
-- DELETE/UPDATE 정책을 부여하지 않음으로 anon API 키를 통한 무단 삭제 차단

-- 5. 회원(users) 테이블 보안 정책
-- 회원 가입 (Insert) 허용
CREATE POLICY "Anyone can register user" 
ON public.users FOR INSERT 
WITH CHECK (length(id) > 0 AND length(name) > 0);

-- 회원 정보 조회 (Select) 허용
CREATE POLICY "Anyone can read users" 
ON public.users FOR SELECT 
USING (true);

-- 6. Storage (store-images 버킷) 보안 정책
-- 이미지 업로드 파일 확장자 제한 (PNG, JPG, JPEG, WEBP, GIF만 허용)
-- Supabase 대시보드 Storage ➔ store-images ➔ Policies 에서 
-- Allowed MIME types: image/png, image/jpeg, image/webp, image/gif 설정 권장

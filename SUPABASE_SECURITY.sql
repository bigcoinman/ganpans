-- ========================================================
-- 간판지원단(ganpans) Supabase 통합 생성 & 보안 강화 SQL
-- ========================================================

-- 1. 회원 테이블 (users) 생성
CREATE TABLE IF NOT EXISTS public.users (
    id VARCHAR(50) PRIMARY KEY,                   -- 사용자 아이디
    name VARCHAR(50) NOT NULL,                    -- 실명
    email VARCHAR(100),                           -- 이메일 주소
    phone VARCHAR(20) NOT NULL,                   -- 휴대폰 번호
    role VARCHAR(20) DEFAULT 'normal',            -- 역할 (normal, business, constructor, admin)
    biz_code VARCHAR(20),                         -- 영업자 승인 코드
    const_code VARCHAR(20),                       -- 시공업체 승인 코드
    conversion_status VARCHAR(20) DEFAULT 'none',  -- 승인 상태
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. 지원금 신청서 테이블 (applications) 생성
CREATE TABLE IF NOT EXISTS public.applications (
    id VARCHAR(50) PRIMARY KEY,                   -- 접수 번호
    user_id VARCHAR(50) REFERENCES public.users(id) ON DELETE SET NULL, -- 신청자 아이디
    owner_name VARCHAR(50) NOT NULL,              -- 대표자 성명
    phone VARCHAR(20) NOT NULL,                   -- 연락처
    store_name VARCHAR(100) NOT NULL,             -- 상호명
    store_address TEXT NOT NULL,                  -- 사업장 주소
    sign_type VARCHAR(50) NOT NULL,               -- 신청 간판 종류
    image_url TEXT,                               -- 첨부 사진 URL
    referrer_code VARCHAR(20),                    -- 추천인 코드
    status VARCHAR(20) DEFAULT 'pending',         -- 상태 (pending, approved, rejected)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. 교체 후기 테이블 (reviews) 생성
CREATE TABLE IF NOT EXISTS public.reviews (
    id BIGSERIAL PRIMARY KEY,
    author_id VARCHAR(50) REFERENCES public.users(id) ON DELETE SET NULL, -- 작성자 아이디
    author_name VARCHAR(50) NOT NULL,             -- 작성자 노출명
    shop_name VARCHAR(50) NOT NULL,               -- 지역 및 상호명
    content VARCHAR(150) NOT NULL,                -- 상세경험담
    rating INT DEFAULT 5,                         -- 평점
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Row Level Security (RLS) 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 5. 기존 보안 정책 정리 (중복 방지)
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can insert applications" ON public.applications;
DROP POLICY IF EXISTS "Anyone can read applications" ON public.applications;
DROP POLICY IF EXISTS "Anyone can register user" ON public.users;
DROP POLICY IF EXISTS "Anyone can read users" ON public.users;

-- 6. 보안 정책 적용
CREATE POLICY "Anyone can read reviews" 
ON public.reviews FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert reviews" 
ON public.reviews FOR INSERT 
WITH CHECK (length(content) <= 150 AND length(shop_name) <= 50);

CREATE POLICY "Anyone can insert applications" 
ON public.applications FOR INSERT 
WITH CHECK (length(owner_name) > 0 AND length(phone) > 0);

CREATE POLICY "Anyone can read applications" 
ON public.applications FOR SELECT 
USING (true);

CREATE POLICY "Anyone can register user" 
ON public.users FOR INSERT 
WITH CHECK (length(id) > 0 AND length(name) > 0);

CREATE POLICY "Anyone can read users" 
ON public.users FOR SELECT 
USING (true);

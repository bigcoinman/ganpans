-- ========================================================
-- 간판지원단(ganpans) Supabase 통합 테이블 & 실시간 동기화 보안 SQL
-- PC 웹과 모바일 앱 간의 완벽한 100% 실시간 양방향 데이터 연동 지원
-- ========================================================
-- [실행 방법]:
-- 1. https://supabase.com 접속 -> 로그인 -> 해당 프로젝트 선택
-- 2. 좌측 메뉴에서 [SQL Editor] 클릭 -> [+ New query] 클릭
-- 3. 이 파일의 전체 내용을 복사하여 붙여넣고 우측 하단 [Run] 버튼(Ctrl+Enter) 클릭
-- ========================================================

-- 1. 회원 테이블 (users) 생성 및 컬럼 보강
CREATE TABLE IF NOT EXISTS public.users (
    id VARCHAR(50) PRIMARY KEY,                   -- 사용자 아이디
    name VARCHAR(50) NOT NULL,                    -- 실명
    email VARCHAR(100),                           -- 이메일 주소
    phone VARCHAR(20) NOT NULL,                   -- 휴대폰 번호
    address TEXT,                                 -- 주소
    role VARCHAR(20) DEFAULT 'normal',            -- 역할 (normal, business, constructor, admin)
    biz_code VARCHAR(20),                         -- 영업자 승인 코드
    const_code VARCHAR(20),                       -- 시공업체 승인 코드
    conversion_status VARCHAR(30) DEFAULT 'none', -- 승인 상태 (none, pending, pending_constructor, approved)
    pending_business_name VARCHAR(100),           -- 시공업체 전환 신청 상호명
    pending_license_number VARCHAR(50),           -- 시공업체 전환 신청 사업자번호
    password_hash TEXT,                           -- 암호화된 비밀번호 해시
    items JSONB DEFAULT '[]'::jsonb,              -- 영업자 전용 물건 목록
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 기존 테이블이 이미 존재하는 경우 누락된 컬럼 자동 추가 (ALTER TABLE)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'normal';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS biz_code VARCHAR(20);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS const_code VARCHAR(20);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS conversion_status VARCHAR(30) DEFAULT 'none';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pending_business_name VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pending_license_number VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- 2. 지원금 신청서 테이블 (applications) 생성 및 컬럼 보강
CREATE TABLE IF NOT EXISTS public.applications (
    id VARCHAR(50) PRIMARY KEY,                   -- 접수 번호
    user_id VARCHAR(50) REFERENCES public.users(id) ON DELETE SET NULL, -- 신청자 아이디
    owner_name VARCHAR(50) NOT NULL,              -- 대표자 성명
    phone VARCHAR(20) NOT NULL,                   -- 연락처
    store_name VARCHAR(100) NOT NULL,             -- 상호명
    store_address TEXT NOT NULL,                  -- 사업장 주소
    sign_type VARCHAR(50) NOT NULL,               -- 신청 간판 종류
    image_url TEXT,                               -- 첨부 사진 URL
    referrer_code VARCHAR(20),                    -- 추천인 / 영업자 코드
    status VARCHAR(20) DEFAULT 'pending',         -- 상태 (pending, approved, rejected)
    assigned_constructor_id VARCHAR(50),          -- 배정된 시공사 ID
    assigned_constructor_name VARCHAR(100),       -- 배정된 시공사 상호명
    construction_status VARCHAR(50) DEFAULT 'none', -- 시공 진행 상태
    construction_photos JSONB DEFAULT '[]'::jsonb,-- 시공 완료 현장 사진
    construction_invoice TEXT,                    -- 세금계산서 첨부 URL/Base64
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 기존 applications 테이블 컬럼 보강
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS assigned_constructor_id VARCHAR(50);
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS assigned_constructor_name VARCHAR(100);
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS construction_status VARCHAR(50) DEFAULT 'none';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS construction_photos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS construction_invoice TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS applied_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS memo TEXT;

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

-- 4. 간편 문의 테이블 (inquiries) 생성 및 컬럼 보강
CREATE TABLE IF NOT EXISTS public.inquiries (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    region TEXT,
    category VARCHAR(50),
    type VARCHAR(50),
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- 5. 사이트 통계 및 방문자수 테이블 (site_stats) 생성
CREATE TABLE IF NOT EXISTS public.site_stats (
    id VARCHAR(50) PRIMARY KEY,                   -- 'visitor_counter'
    today_date VARCHAR(20) NOT NULL,              -- YYYY-MM-DD
    today_count INT DEFAULT 0,                    -- 오늘 방문자 수
    total_count INT DEFAULT 0,                    -- 총 방문자 수
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Row Level Security (RLS) 및 모든 권한 부여 (최고관리자 명령 무조건 복종 보장)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;

-- 7. 기존 구버전 정책 완전 정리 (중복 및 충돌 방지)
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can delete reviews" ON public.reviews;
DROP POLICY IF EXISTS "Enable all access for reviews" ON public.reviews;

DROP POLICY IF EXISTS "Anyone can insert applications" ON public.applications;
DROP POLICY IF EXISTS "Anyone can read applications" ON public.applications;
DROP POLICY IF EXISTS "Anyone can update applications" ON public.applications;
DROP POLICY IF EXISTS "Anyone can delete applications" ON public.applications;
DROP POLICY IF EXISTS "Enable all access for applications" ON public.applications;

DROP POLICY IF EXISTS "Anyone can register user" ON public.users;
DROP POLICY IF EXISTS "Anyone can read users" ON public.users;
DROP POLICY IF EXISTS "Anyone can update users" ON public.users;
DROP POLICY IF EXISTS "Anyone can delete users" ON public.users;
DROP POLICY IF EXISTS "Enable all access for users" ON public.users;

DROP POLICY IF EXISTS "Enable all access for inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Enable all access for site_stats" ON public.site_stats;

-- 8. 통합 무제한 접근 RLS 정책 설정 (SELECT, INSERT, UPDATE, DELETE 100% 무조건 허용)
CREATE POLICY "Enable all access for users" 
ON public.users FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable all access for applications" 
ON public.applications FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable all access for reviews" 
ON public.reviews FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable all access for inquiries" 
ON public.inquiries FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable all access for site_stats" 
ON public.site_stats FOR ALL 
USING (true) 
WITH CHECK (true);

-- 9. PostgreSQL 역할(anon, authenticated, service_role)에 대한 전권 부여 (DB 거부 원천 차단)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;



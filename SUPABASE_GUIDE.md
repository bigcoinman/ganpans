# ⚡ Supabase 데이터베이스 구축 및 연동 개발 가이드

> **간판지원단 프로젝트의 사전 신청 데이터 보관, 회원 세션 관리, 점포 이미지 파일 보관을 위해 Supabase 백엔드를 연동하는 실무 가이드라인입니다.**

---

## 1. ⚙️ Supabase 초기 설정 방법

1. **Supabase 회원가입 및 로그인**: [Supabase 공식 홈페이지](https://supabase.com)에 접속하여 GitHub 계정 등으로 가입합니다.
2. **새 프로젝트(New Project) 생성**:
   * **Project Name**: `ganpan-support`
   * **Database Password**: 안전한 비밀번호 입력 (반드시 메모)
   * **Region**: `ap-northeast-2` (Seoul) 선택 후 생성 (생성까지 약 1~2분 소요)
3. **API Key 및 URL 확인**:
   * 프로젝트 대시보드의 **Project Settings** ➔ **API** 메뉴에서 아래 두 가지 값을 복사해 둡니다.
     * `Project URL` (예: `https://xxxxxx.supabase.co`)
     * `API Key` (`anon public` key)

---

## 2. 🗄️ 데이터베이스 테이블 스키마 설계 (SQL DDL)

Supabase 대시보드 좌측 메뉴의 **SQL Editor** ➔ **New Query**를 선택하고 아래 SQL 코드를 붙여넣어 실행(`Run`)하면, 간판지원단에 필요한 핵심 테이블 3종이 즉시 생성됩니다.

```sql
-- 1. 회원 테이블 (users)
CREATE TABLE public.users (
    id VARCHAR(50) PRIMARY KEY,                   -- 사용자 아이디 (또는 sns 로그인 고유 ID)
    name VARCHAR(50) NOT NULL,                    -- 실명
    email VARCHAR(100),                           -- 이메일 주소
    phone VARCHAR(20) NOT NULL,                   -- 휴대폰 번호
    role VARCHAR(20) DEFAULT 'normal',            -- 역할 (normal: 일반소상공인, business: 영업자, constructor: 시공사, admin: 관리자)
    biz_code VARCHAR(20),                         -- 영업자 승인 코드
    const_code VARCHAR(20),                       -- 시공업체 승인 코드
    conversion_status VARCHAR(20) DEFAULT 'none',  -- 전환 승인 상태 (none, pending, approved)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. 지원금 신청서 테이블 (applications)
CREATE TABLE public.applications (
    id VARCHAR(50) PRIMARY KEY,                   -- 접수 번호 (예: GP-20260804-0001)
    user_id VARCHAR(50) REFERENCES public.users(id) ON DELETE SET NULL, -- 신청자 아이디
    owner_name VARCHAR(50) NOT NULL,              -- 대표자 성명
    phone VARCHAR(20) NOT NULL,                   -- 연락처
    store_name VARCHAR(100) NOT NULL,             -- 상호명
    store_address TEXT NOT NULL,                  -- 사업장 주소
    sign_type VARCHAR(50) NOT NULL,               -- 신청 간판 종류 (간판, 썬팅, 투광기 등)
    image_url TEXT,                               -- 첨부한 점포 전면 사진 스토리지 URL
    referrer_code VARCHAR(20),                    -- 추천인(영업자) 코드
    status VARCHAR(20) DEFAULT 'pending',         -- 진행 상태 (pending: 대기, approved: 승인, rejected: 반려)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. 교체 후기 테이블 (reviews)
CREATE TABLE public.reviews (
    id BIGSERIAL PRIMARY KEY,
    author_id VARCHAR(50) REFERENCES public.users(id) ON DELETE SET NULL, -- 작성자 아이디
    author_name VARCHAR(50) NOT NULL,             -- 작성자 노출명 (예: 김*수)
    shop_name VARCHAR(50) NOT NULL,               -- 지역 및 상호명 (최대 25자)
    content VARCHAR(150) NOT NULL,                -- 상세경험담 (최대 150자)
    rating INT DEFAULT 5,                         -- 평점 (1~5)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. 보안 정책 (Row Level Security - RLS) 적용
-- 상세한 보안 정책 및 권한 제어는 SUPABASE_SECURITY.sql 을 참조하세요.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
```

---

## 3. 📁 파일 스토리지 (Storage) 생성

사용자가 업로드한 점포 사진을 저장하기 위한 미디어 저장 공간을 만듭니다.
1. Supabase 메뉴에서 **Storage** 선택 ➔ **Create a new bucket** 클릭.
2. Bucket Name을 `store-images`로 입력합니다.
3. 외부에서 이미지 링크(URL)로 직접 사진을 볼 수 있도록 **Public** 토글을 켜줍니다(활성화).
4. 생성 완료.

---

## 💻 4. 프론트엔드 JavaScript 연동 예시 코드

프로젝트의 HTML 파일들의 `<head>` 영역에 Supabase 클라이언트 SDK 스크립트를 로드하고 연동하는 기초 가이드입니다.

### ① SDK 로드 (HTML 파일에 추가)
```html
<!-- Supabase JS Client library -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### ② Supabase 클라이언트 초기화 (JS 파일에 추가)
```javascript
const SUPABASE_URL = "https://xxxxxx.supabase.co"; // 본인의 URL로 교체
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // 본인의 Anon Key로 교체

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### ③ 신청서 데이터 & 사진 저장 프로세스 구현 예시
```javascript
// 점포 사진 파일 업로드 및 데이터 저장 함수
async function submitApplicationForm(event) {
  event.preventDefault();
  
  const fileInput = document.getElementById('store-photo-upload');
  const file = fileInput.files[0];
  let imageUrl = '';

  // 1. 파일이 존재하는 경우 Supabase 스토리지에 먼저 업로드
  if (file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('store-images')
      .upload(filePath, file);

    if (uploadError) {
      alert('이미지 업로드 실패: ' + uploadError.message);
      return;
    }

    // 업로드된 파일의 공개 URL 획득
    const { data: publicUrlData } = supabase.storage
      .from('store-images')
      .getPublicUrl(filePath);
      
    imageUrl = publicUrlData.publicUrl;
  }

  // 2. DB 테이블(applications)에 신청 데이터 저장
  const applicationData = {
    id: "GP-" + Date.now(),
    user_id: getActiveUser()?.id || 'guest',
    owner_name: document.getElementById('owner-name').value.trim(),
    phone: document.getElementById('store-phone').value.trim(),
    store_name: document.getElementById('store-name').value.trim(),
    store_address: document.getElementById('store-address').value.trim(),
    sign_type: document.getElementById('app-sign-type').value,
    image_url: imageUrl,
    referrer_code: document.getElementById('referrer-code').value.trim()
  };

  const { error: dbError } = await supabase
    .from('applications')
    .insert([applicationData]);

  if (dbError) {
    alert('신청서 제출 실패: ' + dbError.message);
  } else {
    alert('신청이 성공적으로 저장되었습니다! 접수 기간에 순차 대행 접수됩니다.');
  }
}
```

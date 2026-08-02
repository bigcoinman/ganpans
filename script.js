// script.js - Signboard Support Portal Interactive Features

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Fictional Building Gallery ---
  initBuildingGallery();

  // --- 2. Signboard Simulator ---
  initSimulator();

  // --- 3. FAQ Accordion ---
  initFAQ();

  // --- 3.5. Owner Reviews ---
  initReviews();

  // --- 4. Application Wizard ---
  initWizard();

  // --- 5. Eligibility Checklist ---
  initChecklist();

  // --- 6. User Auth & Dashboard ---
  initAuthAndDashboard();

  // --- 7. Real-time Popups ---
  initPopups();

  // --- 8. Visitor Tracking ---
  initVisitorTracking();

  // --- 9. Mobile Bottom Navigation ---
  initMobileBottomNav();

  // --- 10. PWA Initialization ---
  initPWA();
});

// ==========================================
// 1. Fictional Building Gallery Logic
// ==========================================
function initBuildingGallery() {
  const scrollViewport = document.querySelector('.building-scroll-viewport');
  const lightToggle = document.getElementById('gallery-light-toggle');
  const shopSlots = document.querySelectorAll('.shop-slot');
  const detailsCard = document.getElementById('gallery-shop-details');

  if (!scrollViewport || !shopSlots.length || !detailsCard) return;

  const placeholder = detailsCard.querySelector('.details-placeholder');
  const content = detailsCard.querySelector('.details-content');

  // 동적으로 모든 shop-slot에 3구 핀조명 구조 주입 및 기존 wall-lamp 제거
  shopSlots.forEach(slot => {
    const oldLamp = slot.querySelector('.wall-lamp');
    if (oldLamp) {
      oldLamp.remove();
    }
    const signboardArea = slot.querySelector('.signboard-area');
    if (signboardArea) {
      const lightsContainer = document.createElement('div');
      lightsContainer.className = 'gallery-sign-lights';
      lightsContainer.innerHTML = `
        <div class="gallery-sign-light">
          <div class="gallery-light-fixture"></div>
          <div class="gallery-light-glow"></div>
        </div>
        <div class="gallery-sign-light">
          <div class="gallery-light-fixture"></div>
          <div class="gallery-light-glow"></div>
        </div>
        <div class="gallery-sign-light">
          <div class="gallery-light-fixture"></div>
          <div class="gallery-light-glow"></div>
        </div>
      `;
      slot.insertBefore(lightsContainer, signboardArea);
    }
  });

  // Merchant Data Map (11 Shops: 6 in Main, 5 in More)
  const merchantData = {
    cafe: {
      title: '겨르메기카페',
      category: '카페 / 식음료',
      support: '노후 전면 간판 철거 및 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 7월 08일',
      satisfaction: '★★★★★ 100%',
      desc: '기존 간판이 낡고 빛이 바랬었는데, 보조금 지원사업을 통해 깔끔한 조명용 플렉스 간판으로 탈바꿈했습니다. 야간 조명 켜졌을 때 시인성이 정말 뛰어납니다.'
    },
    lg: {
      title: 'LG공인중개사 (LG부동산)',
      category: '부동산 중개업',
      support: '노후 전면 간판 철거 및 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 7월 10일',
      satisfaction: '★★★★★ 99%',
      desc: '17년 넘게 한 자리에서 중개업을 해오다 보니 간판이 낡고 흉물스러웠습니다. 시원한 블루/옐로우 배색의 조명용 플렉스 간판으로 변경하니 방문객들의 신뢰도가 훨씬 높아졌습니다.'
    },
    daol: {
      title: '뉴다올부동산',
      category: '부동산 중개업',
      support: '노후 전면 간판 철거 및 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 7월 11일',
      satisfaction: '★★★★★ 100%',
      desc: '기존의 낡은 천막형 간판을 철거하고, 눈에 띄는 핫핑크와 화이트 대비의 신규 LED 조명 간판을 달았습니다. 대표자 명과 전화번호 가독성을 극대화하여 신규 내방객 예약 문의가 늘어났습니다.'
    },
    eyewear: {
      title: '가래비안경사랑·콘택트',
      category: '안경전문점',
      support: '노후 전면 간판 철거 및 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 6월 27일',
      satisfaction: '★★★★★ 100%',
      desc: '안경 모양 심볼 마크와 강렬한 레드 그라데이션 컬러가 깔끔하게 마감되어 만족스럽습니다. 조명용 플렉스 간판 시공 덕분에 어두웠던 골목길 전체가 환하게 살아났습니다.'
    },
    butcher: {
      title: '갑오정육점식당',
      category: '정육 식당',
      support: '노후 전면 간판 철거 및 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 7월 10일',
      satisfaction: '★★★★★ 99%',
      desc: '간판지원단 추천으로 지원을 받았습니다. 친근한 한우 일러스트와 붓글씨 느낌의 서체가 정갈한 맛집 이미지를 극대화해줍니다. 간판 정비 후에 매출도 함께 오르고 있습니다.'
    },
    sink: {
      title: '나라씽크 (나라시스템)',
      category: '인테리어 / 가구',
      support: '노후 전면 간판 철거 및 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 7월 04일',
      satisfaction: '★★★★★ 99%',
      desc: '오랫동안 방치되었던 낡은 간판을 뜯어내고 밝은 파란색 고효율 조명용 플렉스 간판으로 교체했습니다. 간판 시공사분들이 윈도우 시트지 작업까지 꼼꼼히 챙겨주셨습니다.'
    },
    nail: {
      title: '네일을부탁해',
      category: '뷰티 / 네일숍',
      support: '노후 전면 간판 철거 및 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 6월 15일',
      satisfaction: '★★★★★ 98%',
      desc: '하얗고 모던한 매장 외벽에 어울리는 심플하고 고급스러운 블랙 아크릴 채널 간판으로 교체했습니다. 시공 후 세련된 디자인 덕분에 인스타그램을 보고 찾아오는 손님이 대폭 늘어났습니다.'
    },
    cas: {
      title: '카스전자저울 경기북부점',
      category: '기타도소매 / 전자저울전문점',
      support: '노후 전면 간판 철거 및 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 5월 10일',
      satisfaction: '★★★★★ 100%',
      desc: '낡고 어두웠던 상호명 부분을 파란색 시인성 높은 컬러로 천갈이하고 LED 등을 교체했습니다. 도로변에 인접해 있어 차를 타고 지나가는 운전자분들도 쉽게 매장을 찾을 수 있게 되었습니다.'
    },
    imone: {
      title: '이모네식당',
      category: '한식 / 백반전문점',
      support: '노후 전면 간판 철거 및 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 4월 20일',
      satisfaction: '★★★★★ 99%',
      desc: '이모네식당 전용 친근한 요리사 캐릭터와 깔끔한 손글씨 서체가 조화를 이루는 조명 간판으로 교체했습니다. 동네 주민분들뿐 아니라 인근 공사현장 직장인 고객들의 방문이 훨씬 늘었습니다.'
    },
    music: {
      title: '록씨티뮤직실용음악학원',
      category: '교육 / 실용음악학원',
      support: '노후 전면 간판 철거 및 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 4월 10일',
      satisfaction: '★★★★☆ 95%',
      desc: '블랙 바탕에 강렬한 레드 채널 폰트와 일렉기타 그래픽을 살린 간판으로 전면 리뉴얼했습니다. 트렌디한 디자인 덕분에 중고등학생 및 성인 취미반 문의가 활성화되었습니다.'
    },
    fishing: {
      title: '양지낚시',
      category: '레저스포츠 / 낚시용품점',
      support: '노후 전면 간판 철거 및 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 3월 05일',
      satisfaction: '★★★★★ 100%',
      desc: '푸른 파도 그래픽과 대형 참돔 일러스트를 삽입하여 멀리서도 낚시점임을 단번에 알아볼 수 있는 플렉스 간판으로 교체했습니다. 야간 시인성이 극대화되어 이른 새벽 출조하시는 고객분들의 길잡이가 되고 있습니다.'
    },
    woojin: {
      title: '우진가구갤러리',
      category: '도소매 / 가구점',
      support: '노후 전면 간판 철거 및 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 2월 28일',
      satisfaction: '★★★★★ 97%',
      desc: '대형 간판의 노후 프레임을 튼튼하게 보강하고 친환경 LED 투광등을 매립 시공하여 야간에도 전시된 가구들이 고급스럽게 부각되도록 정비했습니다.'
    },
    sewon: {
      title: '세원정밀',
      category: '제조업 / 금형 및 프레스',
      support: '노후 전면 간판 철거 및 고효율 LED 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 6월 12일',
      satisfaction: '★★★★★ 99%',
      desc: '금형제작 전문 업종의 성격에 맞게 깔끔하고 강직한 서체를 사용했으며, 좌측에 영문 로고 심볼을 깔끔하게 살렸습니다. 시공 후 주야간 시인성이 크게 높아져 공장 방문 거래처 신뢰도가 높아졌습니다.'
    },
    sinsegi: {
      title: '신세기포장',
      category: '제조업 / 포장용기 및 인쇄',
      support: '노후 전면 간판 철거 및 친환경 LED 조명용 플렉스 간판 시공',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 6월 10일',
      satisfaction: '★★★★★ 100%',
      desc: '심플한 영문 블록 로고와 세련된 한글 서체가 화이트 앤 블루 컬러로 어우러져 깔끔한 마감을 선사합니다. 하단에 연락처를 크게 배치하여 전화 문의 및 신규 납품 계약 문의가 늘었습니다.'
    },
    shinjin_bolt: {
      title: '신진철물',
      category: '도소매 / 철물 및 공구',
      support: '노후 전면 천막 간판 철거 및 LED 조명용 플렉스 간판 시공',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 6월 08일',
      satisfaction: '★★★★★ 98%',
      desc: '"신진 철물 · 공구 · 유압" 상호를 시각성이 뛰어난 블루 바탕과 옐로우/화이트 배색으로 신규 단장했습니다. 매장 입구가 어두웠으나 간판을 새로 달며 길거리 전체가 밝아져 야간에도 영업 여부를 쉽게 알아볼 수 있습니다.'
    },
    shinjin_bearing: {
      title: '신진베어링',
      category: '도소매 / 베어링 및 볼트',
      support: '노후 간판 정비 및 조명용 플렉스 간판 교체',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 6월 09일',
      satisfaction: '★★★★★ 99%',
      desc: '산뜻한 옐로우 바탕에 레드와 네이비 계열의 조화로 시인성을 극대화한 간판을 설치했습니다. 매장 전면 노후 썬팅지와 함께 간판을 깔끔하게 바꾸어 한결 깨끗해진 이미지를 전해줍니다.'
    },
    seojeong: {
      title: '서정정밀',
      category: '제조업 / 선반 및 밀링 가공',
      support: '노후 철제 간판 철거 및 고조도 LED 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 6월 05일',
      satisfaction: '★★★★☆ 96%',
      desc: '"서정정밀" 브랜드의 기술력을 강조하는 기어 모양 심볼 마크와 가공 분야(선반, 밀링, 슬로타, 용접 등)를 간판 우측에 보기 쉽게 정렬했습니다. 야간 조명 설치 덕분에 멀리서도 상호와 전문 분야가 또렷하게 드러납니다.'
    },
    hyundai: {
      title: '현대종합인테리어',
      category: '건설업 / 리모델링 및 인테리어',
      support: '노후 전면 간판 철거 및 LED 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 6월 01일',
      satisfaction: '★★★★★ 98%',
      desc: '강렬한 빨간색 배경에 깔끔한 흰색 글씨체로 가시성을 높였으며, 연락처와 전문 분야(벽지, 장판, 리모델링)를 하단에 알기 쉽게 표시했습니다. 깔끔해진 간판 덕분에 신뢰도가 올라 인근 아파트 단지 리모델링 문의가 많이 들어옵니다.'
    },
    chowon: {
      title: '초원식당',
      category: '한식 / 고기구이 전문점',
      support: '노후 전면 간판 철거 및 고화질 LED 조명용 플렉스 간판 시공',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 5월 28일',
      satisfaction: '★★★★★ 100%',
      desc: '풍성하고 맛있어 보이는 고기구이 일러스트와 정겨운 전통 서체가 어우러진 옥외 간판입니다. 저녁 시간대에 주황색과 노란색 그라데이션 조명이 켜지면 손님들의 입맛을 돋우는 시각적 효과가 우수하여 동네 명소가 되었습니다.'
    },
    shinwoo: {
      title: '신우카센터',
      category: '서비스업 / 자동차 경정비',
      support: '노후 간판 교체 및 조명용 플렉스 간판 시공',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 5월 20일',
      satisfaction: '★★★★★ 99%',
      desc: '자동차 수리 서비스 엠블럼과 눈에 띄는 "신우카센터" 브랜드 서체를 조화롭게 매칭했습니다. 도로변에서 매장으로 접근하는 차량 운전자분들이 직관적으로 경정비 업소임을 인지할 수 있어 차량 정비 대수가 대폭 증가했습니다.'
    },
    samdong: {
      title: '삼동콩나물국밥',
      category: '한식 / 국밥 전문점',
      support: '노후 간판 철거 및 친환경 LED 조명용 플렉스 간판 시공',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 5월 15일',
      satisfaction: '★★★★★ 100%',
      desc: '따뜻한 국밥 일러스트와 콩나물 시루 이미지를 양 옆에 배치하고 노란색 포인트 폰트로 주목성을 극대화한 간판입니다. 이른 아침이나 늦은 밤 해장하러 오시는 고객분들이 멀리서도 콩나물국밥 상호를 쉽게 찾을 수 있어 시공 만족도가 매우 높습니다.'
    },
    haengun: {
      title: '행운열쇠',
      category: '서비스업 / 열쇠 및 보안장치',
      support: '노후 전면 간판 철거 및 에너지절약형 LED 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 5월 12일',
      satisfaction: '★★★★★ 97%',
      desc: '푸른색 상호 글꼴과 화이트/그린 그라데이션 바탕으로 깨끗하고 믿을 수 있는 보안 전문점 느낌을 강조했습니다. 간판 좌측에 취급 품목(번호키, 인터폰, 비디오폰, CCTV 등)을 일목요연하게 표시하여 출장 시공 및 키 복사 관련 방문 고객 문의가 눈에 띄게 늘어났습니다.'
    },
    hangyeol: {
      title: '한결종합배관',
      category: '도소매 / 배관자재 및 밸브',
      support: '노후 전면 간판 철거 및 LED 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 5월 10일',
      satisfaction: '★★★★★ 99%',
      desc: '강렬한 레드 톤 배경에 선명한 흰색 폰트를 매칭하고, 양측 흰색 원형 영역 안에 취급하는 종합 배관 자재 품목(안전면, 감압변, 용접부속, 주철밸브, 분배기 등)을 알기 쉽게 정돈했습니다. 대형 도로변에서의 시인성이 매우 뛰어납니다.'
    },
    hwangdoyaji: {
      title: '황도야지',
      category: '한식 / 삼겹살 및 찌개전문점',
      support: '노후 전면 간판 철거 및 고효율 LED 조명용 플렉스 간판 시공',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 5월 05일',
      satisfaction: '★★★★★ 100%',
      desc: '노란색 배경에 시선을 사로잡는 붉은색 서체의 "황도야지 얼큰집" 상호와 한자 마크를 조화롭게 구성했습니다. 하단에는 주력 메뉴(삼겹살, 동태찌개, 부대찌개, 김치찌개 등)를 표기하여 저녁 외식을 찾는 주민 및 직장인들의 내방이 크게 늘었습니다.'
    }
  };

  // Update details panel
  function showDetails(shopId) {
    const data = merchantData[shopId];
    if (!data) return;

    // Highlight active slot
    shopSlots.forEach(slot => {
      if (slot.dataset.shop === shopId) {
        slot.classList.add('active-shop');
      } else {
        slot.classList.remove('active-shop');
      }
    });

    // Fill details
    document.getElementById('detail-title').textContent = data.title;
    document.getElementById('detail-category').textContent = data.category;
    document.getElementById('detail-support').textContent = data.support;
    document.getElementById('detail-subsidy').textContent = data.subsidy;
    document.getElementById('detail-date').textContent = data.date;
    document.getElementById('detail-satisfaction').textContent = data.satisfaction;
    document.getElementById('detail-desc').textContent = data.desc;

    // Fade animation transition
    placeholder.style.display = 'none';
    content.style.display = 'block';
    content.style.opacity = 0;

    setTimeout(() => {
      content.style.transition = 'opacity 0.3s ease';
      content.style.opacity = 1;
    }, 50);
  }

  // Hook event listeners
  shopSlots.forEach(slot => {
    const shopId = slot.dataset.shop;

    // Hover event
    slot.addEventListener('mouseenter', () => {
      showDetails(shopId);
    });

    // Click/Touch event
    slot.addEventListener('click', (e) => {
      e.stopPropagation();
      showDetails(shopId);
    });
  });

  // Light toggle listener (controls scroll viewport background)
  if (lightToggle) {
    lightToggle.addEventListener('change', (e) => {
      const isNight = e.target.checked;
      if (isNight) {
        scrollViewport.classList.add('night');
      } else {
        scrollViewport.classList.remove('night');
      }
    });
  }

}

// ==========================================
// 2. Signboard Simulator Logic
// ==========================================
function initSimulator() {
  // Elements
  const textInput = document.getElementById('shop-name-input');
  const fontSelect = document.getElementById('font-select');
  const sizeInput = document.getElementById('text-size-input');
  const sizeVal = document.getElementById('text-size-val');
  const signTypeSelect = document.getElementById('sign-type-select');
  const nightToggle = document.getElementById('day-night-toggle');

  const simScreen = document.getElementById('sim-screen');
  const liveSignboard = document.getElementById('live-signboard');
  const liveSignText = document.getElementById('live-sign-text');

  const colorBtns = document.querySelectorAll('.color-btn');
  const presetCards = document.querySelectorAll('.preset-card');

  if (!liveSignText) return;

  // Simulator State
  let state = {
    shopName: '청춘카페',
    fontFamily: "'Nanum Pen Script', sans-serif",
    fontSize: 2.2, // rem
    signType: 'neon', // neon, led, wood, metal
    textColor: '#ec4899', // Default pink neon
    bgColor: '#1e293b', // Dark background
    isNight: false
  };

  // Preset Configurations
  const presets = {
    cafe: {
      shopName: '청춘카페',
      fontFamily: "'Nanum Pen Script', sans-serif",
      fontSize: 2.5,
      signType: 'neon',
      textColor: '#a855f7', // Purple neon
      bgColor: '#0f172a'
    },
    bakery: {
      shopName: '바른 베이커리',
      fontFamily: "'Black Han Sans', sans-serif",
      fontSize: 1.8,
      signType: 'neon',
      textColor: '#f59e0b', // Amber/orange neon
      bgColor: '#0f172a'
    },
    flower: {
      shopName: '도담 꽃집',
      fontFamily: "'East Sea Dokdo', sans-serif",
      fontSize: 2.8,
      signType: 'neon',
      textColor: '#10b981', // Emerald green neon
      bgColor: '#0f172a'
    },
    salon: {
      shopName: 'M&H HAIR',
      fontFamily: "'Montserrat', sans-serif",
      fontSize: 1.6,
      signType: 'neon',
      textColor: '#3b82f6', // Blue neon
      bgColor: '#0f172a'
    }
  };

  // Sync Input Elements with initial state
  const syncInputs = () => {
    textInput.value = state.shopName;
    fontSelect.value = state.fontFamily;
    sizeInput.value = state.fontSize;
    sizeVal.textContent = `${state.fontSize}x`;
    signTypeSelect.value = state.signType;
    nightToggle.checked = state.isNight;

    // Sync active color button
    colorBtns.forEach(btn => {
      if (btn.dataset.color === state.textColor) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  };

  // Render Simulator UI changes
  const render = () => {
    // 1. Text Content & Font Family
    liveSignText.textContent = state.shopName;
    liveSignText.style.fontFamily = state.fontFamily;
    liveSignText.style.fontSize = `${state.fontSize}rem`;

    // Set variables for glows
    liveSignboard.style.setProperty('--glow-color', state.textColor);
    liveSignText.style.setProperty('--glow-color', state.textColor);

    // 2. Signboard Background Style & Border based on Sign Type
    liveSignboard.className = 'live-signboard'; // Reset

    if (state.signType === 'neon') {
      liveSignboard.style.backgroundColor = state.bgColor;
      liveSignboard.style.backgroundImage = 'none';
      liveSignboard.style.border = `2px solid ${state.textColor}`;
      liveSignText.style.color = state.textColor;

      if (state.isNight) {
        liveSignboard.classList.add('glow-border-active');
        liveSignText.classList.add('glow-text-active');
      } else {
        liveSignboard.classList.remove('glow-border-active');
        liveSignText.classList.remove('glow-text-active');
      }
    }
    else if (state.signType === 'led') {
      liveSignboard.style.backgroundColor = state.bgColor;
      liveSignboard.style.backgroundImage = 'none';
      liveSignboard.style.border = '3px solid #64748b'; // metal frame
      liveSignText.style.color = state.textColor;

      if (state.isNight) {
        liveSignboard.style.borderColor = '#94a3b8';
        liveSignText.classList.add('glow-text-active');
      } else {
        liveSignText.classList.remove('glow-text-active');
      }
    }
    else if (state.signType === 'wood') {
      // Wood gradient
      liveSignboard.style.backgroundImage = 'linear-gradient(90deg, #b45309 0%, #78350f 100%)';
      liveSignboard.style.border = '2px solid #451a03';
      liveSignText.style.color = state.textColor;
      liveSignText.classList.remove('glow-text-active');
      liveSignboard.classList.remove('glow-border-active');
    }
    else if (state.signType === 'metal') {
      // Brushed metal gradient
      liveSignboard.style.backgroundImage = 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%)';
      liveSignboard.style.border = '2px solid #475569';
      liveSignText.style.color = state.textColor;

      if (state.isNight) {
        // Backlit effect (halo glow behind signboard)
        liveSignboard.classList.add('glow-border-active');
        liveSignText.classList.remove('glow-text-active');
      } else {
        liveSignboard.classList.remove('glow-border-active');
        liveSignText.classList.remove('glow-text-active');
      }
    }

    // 3. Environment Lighting (Day / Night)
    if (state.isNight) {
      simScreen.classList.add('night');
    } else {
      simScreen.classList.remove('night');
    }
  };

  // Event Listeners
  textInput.addEventListener('input', (e) => {
    state.shopName = e.target.value || '간판지원단';
    render();
  });

  fontSelect.addEventListener('change', (e) => {
    state.fontFamily = e.target.value;
    render();
  });

  sizeInput.addEventListener('input', (e) => {
    state.fontSize = parseFloat(e.target.value);
    sizeVal.textContent = `${state.fontSize}x`;
    render();
  });

  signTypeSelect.addEventListener('change', (e) => {
    state.signType = e.target.value;
    // Set sensible default backgrounds
    if (state.signType === 'wood') {
      state.textColor = '#3f200c';
    } else if (state.signType === 'metal') {
      state.textColor = '#0f172a';
    } else if (state.textColor === '#3f200c' || state.textColor === '#0f172a') {
      state.textColor = '#ec4899'; // reset to neon pink if changing back
    }
    syncInputs();
    render();
  });

  nightToggle.addEventListener('change', (e) => {
    state.isNight = e.target.checked;
    render();
  });

  colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      colorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.textColor = btn.dataset.color;
      render();
    });
  });

  presetCards.forEach(card => {
    card.addEventListener('click', () => {
      presetCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const type = card.dataset.preset;
      if (presets[type]) {
        state = { ...state, ...presets[type] };
        syncInputs();
        render();
      }
    });
  });

  // Apply to design form on simulator save/apply
  const useSimulatedDesignBtn = document.getElementById('apply-design-btn');
  if (useSimulatedDesignBtn) {
    useSimulatedDesignBtn.addEventListener('click', () => {
      // Prefill Application Form fields
      const shopNameField = document.getElementById('app-shop-name');
      const signTypeField = document.getElementById('app-sign-type');

      if (shopNameField) shopNameField.value = state.shopName;
      if (signTypeField) signTypeField.value = state.signType.toUpperCase();

      // Scroll to application wizard
      const appSection = document.getElementById('apply-section');
      if (appSection) {
        appSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Initial Sync and Render
  syncInputs();
  render();
}

// ==========================================
// 3. FAQ Accordion Logic
// ==========================================
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');

    trigger.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all other items
      faqItems.forEach(i => i.classList.remove('active'));

      // Open clicked item if it wasn't open
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

// ==========================================
// 3.5. Owner Reviews Logic
// ==========================================
function initReviews() {
  const reviewsGrid = document.getElementById('reviews-grid');
  const moreBtn = document.getElementById('btn-more-reviews');
  const writeBtn = document.getElementById('btn-write-review');
  const reviewModal = document.getElementById('review-modal');
  const reviewCloseBtn = document.getElementById('review-close-btn');
  const reviewForm = document.getElementById('review-form');
  const ratingStarsSelect = document.getElementById('rating-stars-select');
  const ratingValInput = document.getElementById('review-rating-val');

  if (!reviewsGrid || !moreBtn) return;

  // 1. Initial Reviews Data setup in localStorage
  const existingReviews = localStorage.getItem('reviews');
  if (existingReviews) {
    const list = JSON.parse(existingReviews);
    // 한글 실명이 남아있는 구버전 데이터라면 로컬스토리지에서 삭제하고 갱신을 진행합니다.
    if (list.length > 0 && list.some(r => r.name && r.name.includes('김성우'))) {
      localStorage.removeItem('reviews');
    }
  }

  if (!localStorage.getItem('reviews')) {
    const initialReviews = [
      {
        stars: 5,
        date: '2026.06',
        text: '12년 넘게 쓴 낡은 천막 간판을 이번 사업으로 교체했습니다. LED 입체 채널로 바꿨더니 멀리서도 가게가 환하게 잘 보여요. 저녁 영업 때 손님이 평균 25% 늘었고 전기세도 확 줄었습니다!',
        avatar: 'fa-store',
        name: 'ksw99*** 사장님',
        shop: '수원시 · 늘봄분식 운영'
      },
      {
        stars: 5,
        date: '2026.05',
        text: '낡고 한자가 섞인 칙칙한 나무 간판이었는데 트렌디한 LED 일러스트 간판으로 전면 변경했습니다. 골목 전체가 밝아진 느낌이에요. 젊은 직장인 점심 고객들이 확실히 많이 찾아옵니다.',
        avatar: 'fa-bowl-food',
        name: 'lhy88*** 사장님',
        shop: '성남시 · 온가 가마솥국밥 운영'
      },
      {
        stars: 5,
        date: '2026.05',
        text: '가게가 2층 구석이라 지나치는 분들이 많았습니다. 골드 메탈 프레임 돌출 간판과 세련된 전면 LED 간판으로 함께 교체한 뒤로 예약 없이 직접 방문하시는 신규 손님이 매달 눈에 띄게 늘었어요.',
        avatar: 'fa-scissors',
        name: 'pjh77*** 사장님',
        shop: '안양시 · 헤어살롱 秀 운영'
      },
      {
        stars: 5,
        date: '2026.04',
        text: '카페 이름이 작아서 손님들이 길을 헤맸었는데 아크릴 면발광 LED 간판으로 교체하고 나서 해결됐습니다. 인스타그램에서 입소문을 타고 골목의 예쁜 카페로 입소문 나며 주말 매출이 부쩍 늘었습니다.',
        avatar: 'fa-mug-hot',
        name: 'cej66*** 사장님',
        shop: '고양시 · 카페 드 솔 운영'
      },
      {
        stars: 5,
        date: '2026.03',
        text: '고급 정장을 파는데 녹슨 철제 프레임 간판이 어울리지 않아 고민이었습니다. 사업비 지원으로 티타늄 역광 간판으로 교체했는데 점포 품격이 살아나며 단골 손님들이 칭찬을 아끼지 않습니다.',
        avatar: 'fa-shirt',
        name: 'jts55*** 사장님',
        shop: '부천시 · 클래식 옴므 운영'
      },
      {
        stars: 5,
        date: '2026.02',
        text: '초등학교 앞 골목 구석이라 눈에 띄지 않았는데 귀여운 식빵 캐릭터가 들어간 포인트 조명 간판을 달았습니다. 등하굣길 아이들과 학부모님들이 멀리서 보고 빵 사러 많이 들어옵니다.',
        avatar: 'fa-bread-slice',
        name: 'kmj44*** 사장님',
        shop: '용인시 · 도란도란 베이커리 운영'
      },
      {
        stars: 5,
        date: '2026.02',
        text: '붉은 색 네온사인 간판이 너무 무서워 보인다는 피드백이 있었는데 친환경 느낌의 화이트&그린 LED 간판으로 바꿨습니다. 청결하고 정돈된 분위기가 나서 젊은 주부 고객층의 단골 등록율이 크게 상승했어요.',
        avatar: 'fa-cow',
        name: 'ysm33*** 사장님',
        shop: '의정부시 · 바른정육점 운영'
      },
      {
        stars: 5,
        date: '2026.01',
        text: '이전 학원 간판을 떼지 못하고 영업하다가 이번 철거 지원과 아크릴 입체 문자 간판 교체를 묶어 100% 무상으로 해결했습니다. 학원가가 몰린 골목에서 확실하게 저희 독서실 존재감을 드러내고 있어요.',
        avatar: 'fa-book-open',
        name: 'hjm22*** 사장님',
        shop: '안산시 · 스터디프렌드 독서실 운영'
      },
      {
        stars: 5,
        date: '2025.12',
        text: '야간 응급 진료를 함께 운영 중인데 외부 간판 불이 약해 보호자분들이 당황하는 일이 잦았습니다. 밤에도 시인성이 탁월한 고휘도 LED 채널 및 외벽 경관바를 설치하여 안전하고 편하게 찾아오십니다.',
        avatar: 'fa-paw',
        name: 'och11*** 사장님',
        shop: '화성시 · 튼튼동물병원 운영'
      },
      {
        stars: 5,
        date: '2025.11',
        text: '산뜻한 파스텔톤 플라워 샵 전용 입체 조명 간판으로 교체했습니다. 매장 앞을 포토존처럼 꾸밀 수 있게 조명 설계까지 도와주셔서 꽃 다발 주문은 물론 원데이 클래스 정원도 항상 꽉 차요.',
        avatar: 'fa-fan',
        name: 'byj00*** 사장님',
        shop: '평택시 · 플라워 가든 운영'
      }
    ];
    localStorage.setItem('reviews', JSON.stringify(initialReviews));
  }

  let reviewsList = JSON.parse(localStorage.getItem('reviews'));
  let isExpanded = false;

  // 2. Render reviews from database
  function renderReviews() {
    reviewsGrid.innerHTML = '';

    reviewsList.forEach((review, index) => {
      const isHidden = index >= 5;
      const card = document.createElement('div');
      card.className = `review-card glass-panel ${isHidden ? 'hidden-review' : ''}`;

      // Star HTML builder
      let starsHTML = '';
      for (let i = 1; i <= 5; i++) {
        if (i <= review.stars) {
          starsHTML += '<i class="fa-solid fa-star"></i>';
        } else {
          starsHTML += '<i class="fa-regular fa-star" style="color: #cbd5e1;"></i>';
        }
      }

      // Default avatar icon if none specified
      const avatarIcon = review.avatar || 'fa-store';

      card.innerHTML = `
        <div class="review-card-header">
            <span class="review-stars">${starsHTML}</span>
            <span class="review-date">${escapeHtml(review.date)}</span>
        </div>
        <p class="review-text">"${escapeHtml(review.text)}"</p>
        <div class="review-author">
            <div class="review-avatar"><i class="fa-solid ${avatarIcon}"></i></div>
            <div class="review-info">
                <div class="review-name">${escapeHtml(review.name)}</div>
                <div class="review-shop">${escapeHtml(review.shop)}</div>
            </div>
        </div>
      `;

      reviewsGrid.appendChild(card);
    });

    // Reset expand state
    isExpanded = false;
    const btnText = moreBtn.querySelector('span');
    const btnIcon = moreBtn.querySelector('i');
    if (btnText) btnText.textContent = '후기 더보기';
    if (btnIcon) btnIcon.className = 'fa-solid fa-chevron-down';
  }

  renderReviews();

  // 3. More Reviews Button Click handler
  moreBtn.addEventListener('click', () => {
    isExpanded = !isExpanded;
    const hiddenReviews = reviewsGrid.querySelectorAll('.review-card.hidden-review');

    hiddenReviews.forEach(card => {
      if (isExpanded) {
        card.classList.add('show');
      } else {
        card.classList.remove('show');
      }
    });

    const btnText = moreBtn.querySelector('span');
    const btnIcon = moreBtn.querySelector('i');

    if (isExpanded) {
      if (btnText) btnText.textContent = '후기 접기';
      if (btnIcon) btnIcon.className = 'fa-solid fa-chevron-up';
    } else {
      if (btnText) btnText.textContent = '후기 더보기';
      if (btnIcon) btnIcon.className = 'fa-solid fa-chevron-down';

      const reviewsSection = document.getElementById('reviews');
      if (reviewsSection) {
        reviewsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  // 4. Write Review Modal open handler
  if (writeBtn && reviewModal) {
    writeBtn.addEventListener('click', () => {
      // Pre-fill user data if logged in
      const activeUser = JSON.parse(localStorage.getItem('activeUser'));
      const authorNameInput = document.getElementById('review-author-name');
      const shopNameInput = document.getElementById('review-shop-name');
      const contentInput = document.getElementById('review-content');

      // 로그인 안되어있으면 로그인 모달 오픈 유도
      if (!activeUser) {
        if (confirm('후기 작성을 위해서는 로그인이 필요합니다. 로그인 화면으로 이동하시겠습니까?')) {
          const authModal = document.getElementById('auth-modal');
          if (authModal) authModal.classList.add('active');
        }
        return;
      }

      // 로그인된 사용자 아이디 적용 및 수정 불가 설정
      authorNameInput.value = activeUser.id;
      authorNameInput.readOnly = true;
      authorNameInput.style.backgroundColor = '#f1f5f9';
      authorNameInput.style.cursor = 'not-allowed';

      // Find store name from activeUser's application if available
      let storeInfo = '';
      if (activeUser.items && activeUser.items.length > 0) {
        const appItem = activeUser.items[0];
        const city = activeUser.address ? activeUser.address.split(' ')[1] : '경기도';
        storeInfo = `${city} · ${appItem.name} 운영`;
      } else {
        const city = activeUser.address ? activeUser.address.split(' ')[1] : '경기도';
        storeInfo = `${city} · 소상공인`;
      }
      shopNameInput.value = storeInfo;

      // Reset fields
      contentInput.value = '';
      resetStarRating();

      // Show modal
      reviewModal.classList.add('active');
    });
  }

  // 5. Close Review Modal
  if (reviewCloseBtn && reviewModal) {
    reviewCloseBtn.addEventListener('click', () => {
      reviewModal.classList.remove('active');
    });

    // Close modal on background click
    reviewModal.addEventListener('click', (e) => {
      if (e.target === reviewModal) {
        reviewModal.classList.remove('active');
      }
    });
  }

  // 6. Interactive Star Rating selector
  if (ratingStarsSelect) {
    const starItems = ratingStarsSelect.querySelectorAll('.star-select-item');
    starItems.forEach(star => {
      star.addEventListener('click', () => {
        const rating = parseInt(star.getAttribute('data-value'));
        ratingValInput.value = rating;

        starItems.forEach(s => {
          const val = parseInt(s.getAttribute('data-value'));
          if (val <= rating) {
            s.style.color = '#fbbf24';
            s.classList.add('active');
          } else {
            s.style.color = '#cbd5e1';
            s.classList.remove('active');
          }
        });
      });

      // Star hover effects
      star.addEventListener('mouseenter', () => {
        const rating = parseInt(star.getAttribute('data-value'));
        starItems.forEach(s => {
          const val = parseInt(s.getAttribute('data-value'));
          if (val <= rating) {
            s.style.color = '#fbbf24';
          } else {
            s.style.color = '#cbd5e1';
          }
        });
      });
    });

    ratingStarsSelect.addEventListener('mouseleave', () => {
      const currentRating = parseInt(ratingValInput.value);
      starItems.forEach(s => {
        const val = parseInt(s.getAttribute('data-value'));
        if (val <= currentRating) {
          s.style.color = '#fbbf24';
        } else {
          s.style.color = '#cbd5e1';
        }
      });
    });
  }

  function resetStarRating() {
    ratingValInput.value = 5;
    const starItems = ratingStarsSelect.querySelectorAll('.star-select-item');
    starItems.forEach(s => {
      s.style.color = '#fbbf24';
      s.classList.add('active');
    });
  }

  // 7. Submit Review form
  if (reviewForm) {
    // ID 마스킹 헬퍼 함수
    const maskId = (id) => {
      if (!id) return '';
      if (id.length <= 3) return id.substring(0, 1) + '*'.repeat(id.length - 1);
      return id.substring(0, 3) + '*'.repeat(id.length - 3);
    };

    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const rating = parseInt(ratingValInput.value);
      const name = document.getElementById('review-author-name').value.trim();
      const shop = document.getElementById('review-shop-name').value.trim();
      const text = document.getElementById('review-content').value.trim();

      if (!name || !shop || !text) {
        alert('모든 항목을 입력해주세요.');
        return;
      }

      // Generate date format (YYYY.MM)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const dateStr = `${year}.${month}`;

      // Pick avatar class based on shop name keyword
      let avatar = 'fa-store';
      if (shop.includes('카페') || shop.includes('커피') || shop.includes('디저트')) avatar = 'fa-mug-hot';
      else if (shop.includes('헤어') || shop.includes('미용')) avatar = 'fa-scissors';
      else if (shop.includes('국밥') || shop.includes('음식') || shop.includes('식당') || shop.includes('식사')) avatar = 'fa-bowl-food';
      else if (shop.includes('옷') || shop.includes('의류') || shop.includes('패션')) avatar = 'fa-shirt';
      else if (shop.includes('학원') || shop.includes('독서') || shop.includes('스터디')) avatar = 'fa-book-open';
      else if (shop.includes('동물') || shop.includes('펫')) avatar = 'fa-paw';
      else if (shop.includes('꽃') || shop.includes('플라워')) avatar = 'fa-fan';
      else if (shop.includes('빵') || shop.includes('베이커리')) avatar = 'fa-bread-slice';
      else if (shop.includes('정육') || shop.includes('고기')) avatar = 'fa-cow';

      // 로그인된 ID면 마스킹 처리하여 "ooo*** 사장님" 형식으로 저장
      const maskedName = maskId(name) + ' 사장님';

      const newReview = {
        stars: rating,
        date: dateStr,
        text: text,
        avatar: avatar,
        name: maskedName,
        shop: shop
      };

      // Add to beginning of database
      reviewsList = JSON.parse(localStorage.getItem('reviews')) || [];
      reviewsList.unshift(newReview);
      localStorage.setItem('reviews', JSON.stringify(reviewsList));

      // Close modal & Render
      reviewModal.classList.remove('active');
      renderReviews();

      // Show success alert
      alert('후기가 성공적으로 등록되었습니다. 감사합니다!');

      // Scroll to reviews section to see the new review
      const reviewsSection = document.getElementById('reviews');
      if (reviewsSection) {
        reviewsSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}

// ==========================================
// 4. Application Wizard Logic
// ==========================================
function initWizard() {
  const steps = document.querySelectorAll('.step-pane');
  const stepNodes = document.querySelectorAll('.step-node');
  const progressBar = document.querySelector('.wizard-progress');
  const prevBtn = document.getElementById('prev-step');
  const nextBtn = document.getElementById('next-step');
  const successModal = document.getElementById('success-modal');
  const successCloseBtn = document.getElementById('success-confirm');

  const uploadArea = document.getElementById('file-upload-area');
  const uploadInput = document.getElementById('store-photo');
  const fileNameDisplay = document.getElementById('uploaded-file-name');

  if (steps.length === 0) return;

  // URL ref param parsing (auto referrer code fill)
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  const referrerInput = document.getElementById('referrer-code');
  if (refCode && referrerInput) {
    referrerInput.value = refCode.trim();
  }

  let currentStep = 0;
  let uploadedFileBase64 = '';

  // File Upload Handlers
  if (uploadArea && uploadInput) {
    ['dragenter', 'dragover'].forEach(eventName => {
      uploadArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
      }, false);
    });

    uploadArea.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length) {
        uploadInput.files = files;
        showFileName(files[0].name);
      }
    });

    uploadInput.addEventListener('change', (e) => {
      if (e.target.files.length) {
        showFileName(e.target.files[0].name);
      }
    });
  }

  function showFileName(name) {
    if (fileNameDisplay) {
      fileNameDisplay.textContent = `✓ 업로드됨: ${name}`;
      fileNameDisplay.style.display = 'block';
    }
    
    // Read file and convert to base64
    if (uploadInput && uploadInput.files.length > 0) {
      const file = uploadInput.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        uploadedFileBase64 = event.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      uploadedFileBase64 = '';
    }
  }

  // Render Wizard Progress and Current Pane
  function renderWizard() {
    steps.forEach((pane, idx) => {
      if (idx === currentStep) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    stepNodes.forEach((node, idx) => {
      if (idx < currentStep) {
        node.className = 'step-node complete';
        node.innerHTML = '<i class="fas fa-check"></i>';
      } else if (idx === currentStep) {
        node.className = 'step-node active';
        node.textContent = idx + 1;
      } else {
        node.className = 'step-node';
        node.textContent = idx + 1;
      }
    });

    // Progress bar width percentage
    const percent = (currentStep / (steps.length - 1)) * 100;
    if (progressBar) {
      progressBar.style.width = `${percent}%`;
    }

    // Toggle button texts/visibility
    if (currentStep === 0) {
      prevBtn.style.visibility = 'hidden';
    } else {
      prevBtn.style.visibility = 'visible';
    }

    if (currentStep === steps.length - 1) {
      nextBtn.textContent = '신청서 제출';
      nextBtn.className = 'btn btn-primary btn-success';
    } else {
      nextBtn.textContent = '다음 단계';
      nextBtn.className = 'btn btn-primary';
    }

    // If step is Summary (Step 3 / Index 2), compile input values
    if (currentStep === 2) {
      compileSummary();
    }
  }

  function compileSummary() {
    // Read input values
    const ownerName = document.getElementById('owner-name')?.value || '-';
    const ownerPhone = document.getElementById('owner-phone')?.value || '-';
    const storeName = document.getElementById('app-shop-name')?.value || '-';
    const storeAddress = document.getElementById('store-address')?.value || '-';
    const signType = document.getElementById('app-sign-type')?.value || '-';
    const fileUploaded = uploadInput.files.length > 0 ? uploadInput.files[0].name : '업로드 파일 없음';
    const referrerVal = document.getElementById('referrer-code')?.value.trim() || '-';

    // Set preview values
    document.getElementById('sum-owner-name').textContent = ownerName;
    document.getElementById('sum-owner-phone').textContent = ownerPhone;
    document.getElementById('sum-store-name').textContent = storeName;
    document.getElementById('sum-store-address').textContent = storeAddress;
    document.getElementById('sum-sign-type').textContent = signType;
    document.getElementById('sum-file-name').textContent = fileUploaded;
    document.getElementById('sum-referrer-code').textContent = referrerVal;
  }

  function validateStep(step) {
    if (step === 0) {
      const name = document.getElementById('owner-name')?.value.trim();
      const phone = document.getElementById('owner-phone')?.value.trim();
      if (!name || !phone) {
        alert('신청자 이름과 연락처를 모두 입력해 주세요.');
        return false;
      }
    } else if (step === 1) {
      const storeName = document.getElementById('app-shop-name')?.value.trim();
      const address = document.getElementById('store-address')?.value.trim();
      if (!storeName || !address) {
        alert('상호명과 설치 주소를 모두 입력해 주세요.');
        return false;
      }
    }
    return true;
  }

  prevBtn.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep--;
      renderWizard();
    }
  });

  nextBtn.addEventListener('click', () => {
    // If last step, handle submit
    if (currentStep === steps.length - 1) {
      submitApplication();
      return;
    }

    if (validateStep(currentStep)) {
      currentStep++;
      renderWizard();
    }
  });

  function submitApplication() {
    // Save application to localStorage
    const ownerName = document.getElementById('owner-name')?.value.trim() || '';
    const ownerPhone = document.getElementById('owner-phone')?.value.trim() || '';
    const storeName = document.getElementById('app-shop-name')?.value.trim() || '';
    const storeAddress = document.getElementById('store-address')?.value.trim() || '';
    const signType = document.getElementById('app-sign-type')?.value || '';
    const fileName = uploadInput && uploadInput.files.length > 0 ? uploadInput.files[0].name : '업로드 파일 없음';
    const referrerCode = document.getElementById('referrer-code')?.value.trim() || '';

    const activeUser = JSON.parse(localStorage.getItem('activeUser')) || null;
    const userId = activeUser ? activeUser.id : 'guest';

    // 고유 접수 번호 생성 (GP-YYYYMMDD-XXXX)
    const padZero = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const dateStr = `${now.getFullYear()}${padZero(now.getMonth() + 1)}${padZero(now.getDate())}`;
    const randVal = Math.floor(1000 + Math.random() * 9000);
    const customId = `GP-${dateStr}-${randVal}`;

    const apps = JSON.parse(localStorage.getItem('applications')) || [];
    const newApp = {
      id: customId,
      userId,
      ownerName,
      ownerPhone,
      storeName,
      storeAddress,
      signType,
      fileName,
      fileData: uploadedFileBase64, // Save base64 string
      appliedAt: now.toISOString(),
      status: 'pending', // pending, approved, rejected
      referrerCode
    };

    apps.push(newApp);
    localStorage.setItem('applications', JSON.stringify(apps));

    // 추천 코드 자동 연동 (방안 A)
    if (referrerCode) {
      let users = JSON.parse(localStorage.getItem('users')) || [];
      let bizUserFound = false;

      const newBizItem = {
        id: customId, // 접수 번호와 동일하게 맞추어 동기화가 용이하도록 구성
        name: storeName,
        address: storeAddress,
        photosCount: uploadInput.files.length > 0 ? 1 : 0,
        receiptStatus: '접수 완료 (간판지원단)',
        progressStatus: '심사 대기',
        photos: uploadedFileBase64 ? [uploadedFileBase64] : []
      };

      users = users.map(u => {
        if (u.role === 'business' && u.bizCode === referrerCode) {
          u.items = u.items || [];
          if (!u.items.some(item => item.id === customId)) {
            u.items.push(newBizItem);
            bizUserFound = true;
          }
        }
        return u;
      });

      if (bizUserFound) {
        localStorage.setItem('users', JSON.stringify(users));
        
        // 현재 로그인한 사용자가 추천 코드를 발급한 영업자 본인일 경우 세션 정보도 실시간 업데이트
        if (activeUser && activeUser.role === 'business' && activeUser.bizCode === referrerCode) {
          activeUser.items = activeUser.items || [];
          if (!activeUser.items.some(item => item.id === customId)) {
            activeUser.items.push(newBizItem);
            localStorage.setItem('activeUser', JSON.stringify(activeUser));
          }
        }
      }
    }

    // 성공 팝업에 고유 접수 번호 삽입
    const appIdContainer = document.getElementById('success-app-id-container');
    if (appIdContainer) {
      appIdContainer.textContent = customId;
    }

    // Show success dialog
    if (successModal) {
      successModal.classList.add('active');
    }
  }

  if (successCloseBtn) {
    successCloseBtn.addEventListener('click', () => {
      if (successModal) {
        successModal.classList.remove('active');
      }

      // Reset Wizard and fields
      currentStep = 0;
      document.getElementById('owner-name').value = '';
      document.getElementById('owner-phone').value = '';
      document.getElementById('app-shop-name').value = '';
      document.getElementById('store-address').value = '';
      if (document.getElementById('referrer-code')) {
        document.getElementById('referrer-code').value = '';
      }
      uploadInput.value = '';
      uploadedFileBase64 = '';
      if (fileNameDisplay) {
        fileNameDisplay.style.display = 'none';
      }

      renderWizard();

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Initialize
  renderWizard();
}

// ==========================================
// 5. Eligibility Checklist Logic
// ==========================================
function initChecklist() {
  const checkCards = document.querySelectorAll('.check-card');
  const statusBox = document.getElementById('eligibility-status');

  if (checkCards.length === 0 || !statusBox) return;

  const updateStatus = () => {
    const checkedCount = document.querySelectorAll('.check-card input[type="checkbox"]:checked').length;
    if (checkedCount === checkCards.length) {
      statusBox.className = 'eligibility-status-box passed';
      statusBox.innerHTML = '<i class="fa-solid fa-circle-check"></i> 모든 자격 요건을 충족하여 경기도 경영환경개선사업 지원 대상에 해당합니다!';
    } else {
      statusBox.className = 'eligibility-status-box locked';
      statusBox.innerHTML = `<i class="fa-solid fa-lock"></i> 자격 요건 확인 중 (${checkedCount}/${checkCards.length} 체크됨)`;
    }
  };

  checkCards.forEach(card => {
    const checkbox = card.querySelector('input[type="checkbox"]');
    if (!checkbox) return;

    // Set class depending on initial checkbox state
    if (checkbox.checked) {
      card.classList.add('checked');
    } else {
      card.classList.remove('checked');
    }

    // Toggle on card click
    card.addEventListener('click', (e) => {
      // Prevent double trigger when clicking the input itself
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
      }

      if (checkbox.checked) {
        card.classList.add('checked');
      } else {
        card.classList.remove('checked');
      }
      updateStatus();
    });
  });

  updateStatus();
}

// ==========================================
// 6. User Auth & Dashboard Logic
// ==========================================
function initAuthAndDashboard() {
  // Migrate existing plaintext passwords in localStorage to SHA-256 hashes
  const storedUsersStr = localStorage.getItem('users');
  if (storedUsersStr) {
    try {
      const parsedUsers = JSON.parse(storedUsersStr);
      let updated = false;
      parsedUsers.forEach(u => {
        if (u.pw && u.pw.length !== 64 && !u.isSNS) {
          u.pw = sha256(u.pw);
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem('users', JSON.stringify(parsedUsers));
      }
    } catch (e) {
      console.error('Failed to migrate users passwords:', e);
    }
  }

  // Initialize Local Storage Databases
  if (!localStorage.getItem('users')) {
    const defaultUsers = [
      {
        id: 'testuser',
        pw: 'e1dddc844ca8ad19718295dbf2f0ed6746b459c2e3582ef8bf909812a24d9fe7', // test123!
        name: '홍길동',
        address: '경기도 수원시 영통구 청명남로 10',
        email: 'hong@naver.com',
        phone: '010-1234-5678',
        role: 'normal',
        isSNS: false,
        bizCode: null,
        conversionStatus: 'none',
        items: []
      },
      {
        id: 'bizuser',
        pw: 'ba92d00dc62e58f05eeefc94e20846bdce6aa6490c18cf3cb72c55ea84f40756', // biz123!
        name: '김영업',
        address: '경기도 성남시 분당구 판교역로 235',
        email: 'kim@naver.com',
        phone: '010-9876-5432',
        role: 'business',
        isSNS: false,
        bizCode: 'BIZ-2026-8842',
        conversionStatus: 'approved',
        items: [
          {
            id: 1,
            name: '삼동콩나물국밥',
            address: '경기도 수원시 장안구 경수대로 990',
            photosCount: 3,
            receiptStatus: '접수 완료 (경기도시장상권진흥원)',
            progressStatus: '현장 실사 중',
            photos: ['placeholder1.jpg', 'placeholder2.jpg', 'placeholder3.jpg']
          }
        ]
      },
      {
        id: 'admin',
        pw: '5c06eb3d5a05a19f49476d694ca81a36344660e9d5b98e3d6a6630f31c2422e7', // admin123!
        name: '최고관리자',
        address: '경기도 수원시 영통구 청명남로 10',
        email: 'admin@ganpan.go.kr',
        phone: '010-0000-0000',
        role: 'admin',
        isSNS: false,
        bizCode: null,
        conversionStatus: 'none',
        items: []
      },
      {
        id: 'constuser',
        pw: 'const123!', // Will be auto-hashed by migration script below
        name: '박시공',
        address: '경기도 수원시 권선구 권선로 301',
        email: 'park@naver.com',
        phone: '010-5555-4444',
        role: 'constructor',
        isSNS: false,
        bizCode: null,
        constCode: 'CO-2026-9090',
        businessName: '(주)경기가온시공',
        licenseNumber: '120-81-12345',
        conversionStatus: 'approved',
        items: []
      }
    ];
    localStorage.setItem('users', JSON.stringify(defaultUsers));
  }

  // State Management
  let users = JSON.parse(localStorage.getItem('users'));

  // Ensure admin user exists in existing localStorage users database
  if (users && !users.some(u => u.id === 'admin')) {
    users.push({
      id: 'admin',
      pw: '5c06eb3d5a05a19f49476d694ca81a36344660e9d5b98e3d6a6630f31c2422e7', // admin123!
      name: '최고관리자',
      address: '경기도 수원시 영통구 청명남로 10',
      email: 'admin@ganpan.go.kr',
      phone: '010-0000-0000',
      role: 'admin',
      isSNS: false,
      bizCode: null,
      conversionStatus: 'none',
      items: []
    });
    localStorage.setItem('users', JSON.stringify(users));
  }

  // Ensure constructor user exists in existing localStorage users database
  if (users && !users.some(u => u.id === 'constuser')) {
    users.push({
      id: 'constuser',
      pw: sha256('const123!'),
      name: '박시공',
      address: '경기도 수원시 권선구 권선로 301',
      email: 'park@naver.com',
      phone: '010-5555-4444',
      role: 'constructor',
      isSNS: false,
      bizCode: null,
      constCode: 'CO-2026-9090',
      businessName: '(주)경기가온시공',
      licenseNumber: '120-81-12345',
      conversionStatus: 'approved',
      items: []
    });
    localStorage.setItem('users', JSON.stringify(users));
  }

  let activeUser = JSON.parse(localStorage.getItem('activeUser')) || null;

  // DOM Elements
  const authBtn = document.getElementById('auth-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userInfoArea = document.getElementById('user-info-area');
  const headerUserName = document.getElementById('header-user-name');
  const navDashboard = document.getElementById('nav-dashboard');
  const dashboardSection = document.getElementById('dashboard-section');

  const authModal = document.getElementById('auth-modal');
  const authCloseBtn = document.getElementById('auth-close-btn');
  const tabLoginBtn = document.getElementById('tab-login-btn');
  const tabSignupBtn = document.getElementById('tab-signup-btn');
  const loginPane = document.getElementById('login-pane');
  const signupPane = document.getElementById('signup-pane');

  // Forms
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  // Signup fields
  const signupIdInput = document.getElementById('signup-id');
  const signupPwInput = document.getElementById('signup-pw');
  const signupPwConfirmInput = document.getElementById('signup-pw-confirm');
  const signupNameInput = document.getElementById('signup-name');
  const signupAddressInput = document.getElementById('signup-address');
  const signupEmailInput = document.getElementById('signup-email');
  const signupPhoneInput = document.getElementById('signup-phone');

  // Signup Helpers & Validation Status
  let isIdChecked = false;
  let isIdAvailable = false;
  let isPhoneVerified = false;
  let simulatedSmsCode = '';
  let smsTimerInterval = null;

  const idCheckMsg = document.getElementById('id-check-msg');
  const pwCheckMsg = document.getElementById('pw-check-msg');
  const pwConfirmMsg = document.getElementById('pw-confirm-msg');
  const phoneCheckMsg = document.getElementById('phone-check-msg');
  const btnCheckId = document.getElementById('btn-check-id');
  const btnSmsAuth = document.getElementById('btn-sms-auth');
  const smsAuthGroup = document.getElementById('sms-auth-group');
  const smsAuthCode = document.getElementById('sms-auth-code');
  const btnVerifySms = document.getElementById('btn-verify-sms');
  const smsTimer = document.getElementById('sms-timer');

  // SNS Buttons
  const btnGoogleLogin = document.getElementById('btn-google-login');
  const btnKakaoLogin = document.getElementById('btn-kakao-login');
  const btnGoogleSignup = document.getElementById('btn-google-signup');
  const btnKakaoSignup = document.getElementById('btn-kakao-signup');

  // --- Password Visibility Toggle ---
  document.querySelectorAll('.pw-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const icon = btn.querySelector('i');
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        input.type = 'password';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  });

  // --- Find ID / Find Password Logic ---
  const findIdPane = document.getElementById('find-id-pane');
  const findPwPane = document.getElementById('find-pw-pane');
  const authTabs = document.querySelector('.auth-tabs');

  const allPanes = () => document.querySelectorAll('.auth-pane');

  const showPane = (paneId, hideTabsBar = false) => {
    allPanes().forEach(p => p.classList.remove('active'));
    document.getElementById(paneId).classList.add('active');
    authTabs.style.display = hideTabsBar ? 'none' : '';
  };

  const backToLogin = () => {
    authTabs.style.display = '';
    allPanes().forEach(p => p.classList.remove('active'));
    loginPane.classList.add('active');
    tabLoginBtn.classList.add('active');
    tabSignupBtn.classList.remove('active');
    // reset find forms
    document.getElementById('find-id-form').reset();
    document.getElementById('find-id-result').style.display = 'none';
    document.getElementById('find-pw-form').reset();
    document.getElementById('find-pw-reset-group').style.display = 'none';
    document.getElementById('find-pw-result').style.display = 'none';
    document.getElementById('find-pw-new-msg').textContent = '';
  };

  document.getElementById('btn-find-id').addEventListener('click', () => showPane('find-id-pane', true));
  document.getElementById('btn-find-pw').addEventListener('click', () => showPane('find-pw-pane', true));
  document.getElementById('btn-back-from-find-id').addEventListener('click', backToLogin);
  document.getElementById('btn-back-from-find-pw').addEventListener('click', backToLogin);

  // 아이디 찾기 — 이름 + 전화번호
  document.getElementById('find-id-form').addEventListener('submit', () => {
    const name = document.getElementById('find-id-name').value.trim();
    const phone = document.getElementById('find-id-phone').value.trim();
    const result = document.getElementById('find-id-result');

    const found = users.find(u => u.name === name && u.phone === phone && !u.isSNS);
    result.style.display = 'block';
    if (found) {
      // 아이디 마스킹: 앞 3자만 표시, 나머지 *
      const masked = found.id.length <= 3
        ? found.id + '***'
        : found.id.slice(0, 3) + '*'.repeat(found.id.length - 3);
      result.className = 'find-result-box success';
      result.innerHTML = `<i class="fa-solid fa-circle-check"></i> 고객님의 아이디는<br><strong style="font-size:1.1rem; letter-spacing:1px;">${masked}</strong> 입니다.`;
    } else {
      result.className = 'find-result-box error';
      result.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 입력하신 정보와 일치하는 계정을 찾을 수 없습니다.';
    }
  });

  // 비밀번호 찾기 — 아이디 + 전화번호 → 계정 확인
  let foundPwUser = null;
  document.getElementById('find-pw-form').addEventListener('submit', () => {
    const id = document.getElementById('find-pw-id').value.trim();
    const phone = document.getElementById('find-pw-phone').value.trim();
    const result = document.getElementById('find-pw-result');
    const resetGroup = document.getElementById('find-pw-reset-group');

    foundPwUser = users.find(u => u.id === id && u.phone === phone && !u.isSNS);
    result.style.display = 'block';
    resetGroup.style.display = 'none';
    document.getElementById('find-pw-new').value = '';
    document.getElementById('find-pw-new-msg').textContent = '';

    if (foundPwUser) {
      result.className = 'find-result-box success';
      result.innerHTML = `<i class="fa-solid fa-circle-check"></i> 계정이 확인되었습니다. 아래에서 새 비밀번호를 설정해 주세요.`;
      resetGroup.style.display = 'block';
      // 새 비밀번호 toggle 버튼 초기화
      const newPwToggle = document.querySelector('[data-target="find-pw-new"]');
      if (newPwToggle) {
        newPwToggle.addEventListener('click', () => {
          const inp = document.getElementById('find-pw-new');
          const icon = newPwToggle.querySelector('i');
          if (inp.type === 'password') {
            inp.type = 'text';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
          } else {
            inp.type = 'password';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
          }
        }, { once: true });
      }
    } else {
      result.className = 'find-result-box error';
      result.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 입력하신 정보와 일치하는 계정을 찾을 수 없습니다.';
    }
  });

  // 새 비밀번호 실시간 유효성 검사
  document.getElementById('find-pw-new').addEventListener('input', () => {
    const val = document.getElementById('find-pw-new').value;
    const msg = document.getElementById('find-pw-new-msg');
    const pwRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!val) { msg.textContent = ''; return; }
    if (pwRegex.test(val)) {
      msg.className = 'form-helper success';
      msg.innerHTML = '<i class="fa-solid fa-circle-check"></i> 사용 가능한 비밀번호입니다.';
    } else {
      msg.className = 'form-helper error';
      msg.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 영문, 숫자, 특수문자 조합 8자 이상이어야 합니다.';
    }
  });

  // 비밀번호 변경 완료
  document.getElementById('btn-reset-pw').addEventListener('click', () => {
    if (!foundPwUser) return;
    const newPw = document.getElementById('find-pw-new').value;
    const pwRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!pwRegex.test(newPw)) {
      alert('비밀번호는 영문, 숫자, 특수문자 조합 8자 이상이어야 합니다.');
      return;
    }
    // localStorage 반영
    users = JSON.parse(localStorage.getItem('users'));
    const idx = users.findIndex(u => u.id === foundPwUser.id);
    if (idx !== -1) {
      users[idx].pw = sha256(newPw);
      localStorage.setItem('users', JSON.stringify(users));
    }
    const result = document.getElementById('find-pw-result');
    result.className = 'find-result-box success';
    result.innerHTML = '<i class="fa-solid fa-circle-check"></i> 비밀번호가 성공적으로 변경되었습니다.<br>새 비밀번호로 로그인해 주세요.';
    document.getElementById('find-pw-reset-group').style.display = 'none';
    foundPwUser = null;
    setTimeout(backToLogin, 2200);
  });

  // --- Session Management & Login UI ---
  const updateSessionUI = () => {
    users = JSON.parse(localStorage.getItem('users'));
    activeUser = JSON.parse(localStorage.getItem('activeUser'));

    if (activeUser) {
      // Find latest status of active user from DB
      const currentDbUser = users.find(u => u.id === activeUser.id);
      if (currentDbUser) {
        activeUser = sanitizeUser(currentDbUser);
        localStorage.setItem('activeUser', JSON.stringify(activeUser));
      }

      if (authBtn) authBtn.style.display = 'none';
      if (userInfoArea) userInfoArea.style.display = 'flex';
      let roleText = '일반';
      if (activeUser.role === 'business') {
        roleText = '영업자';
      } else if (activeUser.role === 'constructor') {
        roleText = '시공업체';
      } else if (activeUser.role === 'admin') {
        roleText = '관리자';
      }
      if (headerUserName) headerUserName.textContent = `${activeUser.name}님 (${roleText})`;
      if (navDashboard) {
        if (activeUser.role === 'admin') {
          navDashboard.textContent = '관리자 대시보드';
        } else {
          navDashboard.textContent = '마이페이지';
        }
        navDashboard.style.display = 'block';
      }
    } else {
      if (authBtn) authBtn.style.display = 'inline-flex';
      if (userInfoArea) userInfoArea.style.display = 'none';
      if (navDashboard) navDashboard.style.display = 'none';
    }
  };

  // --- Modal Open/Close & Tab Switch ---
  if (authBtn) {
    authBtn.addEventListener('click', () => {
      authModal.classList.add('active');
      switchTab('login');
    });
  }

  if (authCloseBtn) {
    authCloseBtn.addEventListener('click', () => {
      authModal.classList.remove('active');
      resetSignupState();
    });
  }

  const switchTab = (tab) => {
    if (tab === 'login') {
      tabLoginBtn.classList.add('active');
      tabSignupBtn.classList.remove('active');
      loginPane.classList.add('active');
      signupPane.classList.remove('active');
    } else {
      tabLoginBtn.classList.remove('active');
      tabSignupBtn.classList.add('active');
      loginPane.classList.remove('active');
      signupPane.classList.add('active');
    }
  };

  tabLoginBtn.addEventListener('click', () => switchTab('login'));
  tabSignupBtn.addEventListener('click', () => switchTab('signup'));

  // --- Signup Logic ---

  // ID Check
  signupIdInput.addEventListener('input', () => {
    isIdChecked = false;
    idCheckMsg.textContent = '';
  });

  btnCheckId.addEventListener('click', () => {
    const idVal = signupIdInput.value.trim();
    if (!idVal) {
      alert('아이디를 입력해 주세요.');
      return;
    }

    const exists = users.some(u => u.id === idVal);
    isIdChecked = true;
    if (exists) {
      isIdAvailable = false;
      idCheckMsg.className = 'form-helper error';
      idCheckMsg.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 이미 사용 중인 아이디입니다.';
    } else {
      isIdAvailable = true;
      idCheckMsg.className = 'form-helper success';
      idCheckMsg.innerHTML = '<i class="fa-solid fa-circle-check"></i> 사용 가능한 아이디입니다.';
    }
  });

  // Password Complexity Check
  signupPwInput.addEventListener('input', () => {
    const pwVal = signupPwInput.value;
    // English letters, numbers, special characters combination, minimum 8 characters
    const pwRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!pwVal) {
      pwCheckMsg.textContent = '';
      return;
    }

    if (pwRegex.test(pwVal)) {
      pwCheckMsg.className = 'form-helper success';
      pwCheckMsg.innerHTML = '<i class="fa-solid fa-circle-check"></i> 사용 가능한 비밀번호입니다.';
    } else {
      pwCheckMsg.className = 'form-helper error';
      pwCheckMsg.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 영문, 숫자, 특수문자 조합 8자 이상이어야 합니다.';
    }
  });

  // Password Confirm Check
  const checkPwConfirm = () => {
    const pwVal = signupPwInput.value;
    const confirmVal = signupPwConfirmInput.value;
    if (!confirmVal) {
      pwConfirmMsg.textContent = '';
      return;
    }
    if (pwVal === confirmVal) {
      pwConfirmMsg.className = 'form-helper success';
      pwConfirmMsg.innerHTML = '<i class="fa-solid fa-circle-check"></i> 비밀번호가 일치합니다.';
    } else {
      pwConfirmMsg.className = 'form-helper error';
      pwConfirmMsg.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 비밀번호가 일치하지 않습니다.';
    }
  };

  signupPwConfirmInput.addEventListener('input', checkPwConfirm);
  signupPwInput.addEventListener('input', () => {
    if (signupPwConfirmInput.value) checkPwConfirm();
  });

  // SMS Authentication
  btnSmsAuth.addEventListener('click', () => {
    const phoneVal = signupPhoneInput.value.trim();
    if (!phoneVal) {
      alert('휴대폰 번호를 입력해 주세요.');
      return;
    }

    // Generate 6-digit random code
    simulatedSmsCode = Math.floor(100000 + Math.random() * 900000).toString();
    alert(`[인증 문자 발송 시뮬레이션]\n\n입력하신 번호(${phoneVal})로 인증번호 [${simulatedSmsCode}]가 발송되었습니다.`);

    // Show verification UI and start timer
    smsAuthGroup.style.display = 'block';
    smsAuthCode.value = '';
    smsAuthCode.focus();

    let timeLeft = 180; // 3 minutes
    if (smsTimerInterval) clearInterval(smsTimerInterval);

    const updateTimerText = () => {
      const min = Math.floor(timeLeft / 60);
      const sec = timeLeft % 60;
      smsTimer.textContent = `남은 시간 ${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    updateTimerText();

    smsTimerInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(smsTimerInterval);
        smsAuthGroup.style.display = 'none';
        alert('인증 시간이 초과되었습니다. 다시 인증해 주세요.');
      } else {
        updateTimerText();
      }
    }, 1000);
  });

  btnVerifySms.addEventListener('click', () => {
    const entered = smsAuthCode.value.trim();
    if (entered === simulatedSmsCode) {
      clearInterval(smsTimerInterval);
      isPhoneVerified = true;
      smsAuthGroup.style.display = 'none';
      signupPhoneInput.disabled = true;
      btnSmsAuth.disabled = true;
      phoneCheckMsg.className = 'form-helper success';
      phoneCheckMsg.innerHTML = '<i class="fa-solid fa-circle-check"></i> 휴대폰 본인인증이 완료되었습니다.';
    } else {
      alert('인증번호가 일치하지 않습니다. 다시 확인해 주세요.');
    }
  });

  const resetSignupState = () => {
    signupForm.reset();
    isIdChecked = false;
    isIdAvailable = false;
    isPhoneVerified = false;
    signupPhoneInput.disabled = false;
    btnSmsAuth.disabled = false;
    idCheckMsg.textContent = '';
    pwCheckMsg.textContent = '';
    pwConfirmMsg.textContent = '';
    phoneCheckMsg.textContent = '';
    smsAuthGroup.style.display = 'none';
    if (smsTimerInterval) clearInterval(smsTimerInterval);
  };

  // Signup Submit
  signupForm.addEventListener('submit', () => {
    const idVal = signupIdInput.value.trim();
    const pwVal = signupPwInput.value;
    const nameVal = escapeHtml(signupNameInput.value.trim());
    const addressVal = escapeHtml(signupAddressInput.value.trim());
    const emailVal = escapeHtml(signupEmailInput.value.trim());
    const phoneVal = escapeHtml(signupPhoneInput.value.trim());

    if (!isIdChecked || !isIdAvailable) {
      alert('아이디 중복 확인(사용 가능 검색)을 완료해 주세요.');
      return;
    }

    // 이름 유효성 검사 (최소 2자 ~ 최대 20자)
    if (nameVal.length < 2 || nameVal.length > 20) {
      alert('이름은 최소 2자에서 최대 20자까지 입력해 주세요.');
      return;
    }

    // 휴대폰 번호 유효성 검사 (최소 9자 ~ 최대 15자)
    if (phoneVal.length < 9 || phoneVal.length > 15) {
      alert('휴대폰 번호는 최소 9자에서 최대 15자까지 입력해 주세요.');
      return;
    }

    // 휴대폰 번호 형식 정규식 검증
    const phoneRegex = /^[0-9+\s-]+$/;
    if (!phoneRegex.test(phoneVal)) {
      alert('휴대폰 번호에는 숫자, 대시(-), 플러스(+) 및 공백만 입력할 수 있습니다.');
      return;
    }

    const pwRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!pwRegex.test(pwVal)) {
      alert('비밀번호는 영문, 숫자, 특수문자 조합 8자 이상이어야 합니다.');
      return;
    }

    const pwConfirmVal = signupPwConfirmInput.value;
    if (pwVal !== pwConfirmVal) {
      alert('비밀번호 확인이 일치하지 않습니다. 다시 확인해 주세요.');
      signupPwConfirmInput.focus();
      return;
    }

    if (!isPhoneVerified) {
      alert('휴대폰 본인인증을 완료해 주세요.');
      return;
    }

    // Save New User
    const newUser = {
      id: idVal,
      pw: sha256(pwVal),
      name: nameVal,
      address: addressVal,
      email: emailVal,
      phone: phoneVal,
      role: 'normal',
      isSNS: false,
      bizCode: null,
      conversionStatus: 'none',
      items: []
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // Auto Login
    localStorage.setItem('activeUser', JSON.stringify(sanitizeUser(newUser)));

    alert('회원가입이 완료되었습니다! 자동 로그인됩니다.');
    authModal.classList.remove('active');
    resetSignupState();
    updateSessionUI();
  });

  // --- Login Logic ---
  loginForm.addEventListener('submit', () => {
    const idVal = document.getElementById('login-id').value.trim();
    const pwVal = document.getElementById('login-pw').value;

    const hashedPassword = sha256(pwVal);
    const user = users.find(u => u.id === idVal && u.pw === hashedPassword);
    if (user) {
      localStorage.setItem('activeUser', JSON.stringify(sanitizeUser(user)));
      alert(`${user.name}님, 반갑습니다!`);
      authModal.classList.remove('active');
      loginForm.reset();
      updateSessionUI();
    } else {
      alert('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  });

  // --- SNS Login / Signup Simulations (Auto Login) ---
  const handleSNSLogin = (snsProvider) => {
    const snsId = `sns_${snsProvider}_${Math.floor(1000 + Math.random() * 9000)}`;
    let snsUser = users.find(u => u.id.startsWith(`sns_${snsProvider}_`));

    if (!snsUser) {
      snsUser = {
        id: snsId,
        pw: '',
        name: `${snsProvider === 'google' ? '구글' : '카카오'} 사용자`,
        address: '경기도 수원시 권선구 효원로 1',
        email: `${snsProvider}@sns-login.com`,
        phone: '010-9999-8888',
        role: 'normal',
        isSNS: true,
        bizCode: null,
        conversionStatus: 'none',
        items: []
      };
      users.push(snsUser);
      localStorage.setItem('users', JSON.stringify(users));
    }

    localStorage.setItem('activeUser', JSON.stringify(sanitizeUser(snsUser)));
    alert(`${snsUser.name} 계정으로 로그인 완료(자동 로그인 적용).`);
    authModal.classList.remove('active');
    updateSessionUI();
  };

  btnGoogleLogin.addEventListener('click', () => handleSNSLogin('google'));
  btnKakaoLogin.addEventListener('click', () => handleSNSLogin('kakao'));
  btnGoogleSignup.addEventListener('click', () => handleSNSLogin('google'));
  btnKakaoSignup.addEventListener('click', () => handleSNSLogin('kakao'));

  // --- Logout Logic ---
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('activeUser');
      alert('로그아웃 되었습니다.');
      updateSessionUI();
    });
  }

  // Sync state initially
  updateSessionUI();
}

// ==========================================
// 7. Real-time Popups Logic
// ==========================================
function initPopups() {
  let popups = JSON.parse(localStorage.getItem('popups'));
  
  if (!popups) {
    popups = [
      {
        id: 1718000000000,
        title: "2026 경기도 노후간판 교체사업 2차 모집 공고",
        content: "경기도 소상공인 여러분!\n2026년도 노후 간판 교체 및 정비 지원 사업 2차 모집이 시작되었습니다.\n\n■ 지원 대상: 경기도 내 소상공인\n■ 지원 내용: 노후 간판 철거 및 교체 비용 최대 200만원 지원\n■ 신청 기간: ~ 2026. 08. 31까지\n\n자세한 안내는 아래 '간편 신청하기' 또는 FAQ를 참고해 주세요.",
        imageUrl: "https://picsum.photos/id/101/400/200",
        linkUrl: "#apply-section",
        startDate: "2026-07-01",
        endDate: "2026-08-31",
        width: 380,
        height: 480,
        positionTop: 120,
        positionLeft: 100,
        isActive: true
      }
    ];
    localStorage.setItem('popups', JSON.stringify(popups));
  }
  
  // Find active popups matching the posting period
  const todayStr = new Date().toISOString().split('T')[0];
  const activePopups = popups.filter(p => {
    if (!p.isActive) return false;
    
    // Check if within period
    if (p.startDate && todayStr < p.startDate) return false;
    if (p.endDate && todayStr > p.endDate) return false;
    
    return true;
  });
  
  activePopups.forEach(popup => {
    // Check if the user selected "do not show for 24 hours"
    const hideTime = localStorage.getItem(`hide_popup_${popup.id}`);
    if (hideTime) {
      const diff = Date.now() - parseInt(hideTime);
      if (diff < 24 * 60 * 60 * 1000) {
        // Still within 24 hours, do not show
        return;
      } else {
        // Expired, remove from localStorage
        localStorage.removeItem(`hide_popup_${popup.id}`);
      }
    }
    
    // Create popup window DOM element
    const popupEl = document.createElement('div');
    popupEl.className = 'popup-window';
    popupEl.id = `popup-window-${popup.id}`;
    
    // Apply width, height, position styles
    popupEl.style.width = `${popup.width}px`;
    popupEl.style.height = `${popup.height}px`;
    popupEl.style.top = `${popup.positionTop}px`;
    popupEl.style.left = `${popup.positionLeft}px`;
    
    // Build popup content
    let imageHtml = '';
    if (popup.imageUrl) {
      const safeImgUrl = sanitizeUrl(popup.imageUrl);
      const safeLinkUrl = sanitizeUrl(popup.linkUrl);
      if (popup.linkUrl) {
        imageHtml = `<a href="${safeLinkUrl}"><img src="${safeImgUrl}" class="popup-img" alt="팝업 이미지"></a>`;
      } else {
        imageHtml = `<img src="${safeImgUrl}" class="popup-img" alt="팝업 이미지">`;
      }
    }
    
    let contentHtml = '';
    const safeContentText = escapeHtml(popup.content).replace(/\n/g, '<br>');
    if (popup.linkUrl) {
      const safeLinkUrl = sanitizeUrl(popup.linkUrl);
      contentHtml = `<a href="${safeLinkUrl}" style="text-decoration: none; color: inherit;"><div class="popup-content">${safeContentText}</div></a>`;
    } else {
      contentHtml = `<div class="popup-content">${safeContentText}</div>`;
    }
    
    popupEl.innerHTML = `
      <div class="popup-header">
        <h5 class="popup-title">${escapeHtml(popup.title)}</h5>
        <button class="popup-close-x" aria-label="닫기"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="popup-body">
        ${imageHtml}
        ${contentHtml}
      </div>
      <div class="popup-footer">
        <label class="popup-footer-left">
          <input type="checkbox" class="popup-hide-today"> 오늘 하루 보지 않기
        </label>
        <button class="popup-close-btn">닫기</button>
      </div>
    `;
    
    document.body.appendChild(popupEl);
    
    // Make popups draggable
    makeDraggable(popupEl);
    
    // Attach close events
    const closeX = popupEl.querySelector('.popup-close-x');
    const closeBtn = popupEl.querySelector('.popup-close-btn');
    const hideTodayCheckbox = popupEl.querySelector('.popup-hide-today');
    
    const closePopup = () => {
      if (hideTodayCheckbox.checked) {
        localStorage.setItem(`hide_popup_${popup.id}`, Date.now().toString());
      }
      popupEl.style.opacity = '0';
      popupEl.style.transform = 'scale(0.95)';
      setTimeout(() => {
        popupEl.remove();
      }, 300);
    };
    
    closeX.addEventListener('click', closePopup);
    closeBtn.addEventListener('click', closePopup);
  });
}

// Simple drag functionality for popups
function makeDraggable(el) {
  const header = el.querySelector('.popup-header');
  if (!header) return;
  
  header.style.cursor = 'move';
  
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  header.onmousedown = dragMouseDown;
  
  function dragMouseDown(e) {
    e = e || window.event;
    // Don't drag if clicking the close 'X' button or checkbox or footer button
    if (e.target.closest('.popup-close-x') || e.target.closest('.popup-footer')) return;
    
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }
  
  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    let newTop = el.offsetTop - pos2;
    let newLeft = el.offsetLeft - pos1;
    
    // Prevent dragging completely off-screen
    if (newTop < 0) newTop = 0;
    if (newLeft < 0) newLeft = 0;
    
    el.style.top = newTop + "px";
    el.style.left = newLeft + "px";
  }
  
  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// ==========================================
// 8. PWA & Mobile App Installation Logic
// ==========================================
function initPWA() {
  // Service Worker Registration
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
      .catch((err) => console.warn('Service Worker registration failed:', err));
  }

  // UI Elements
  const installModal = document.getElementById('install-modal');
  const btnClose = document.getElementById('install-modal-close');
  const btnNav = document.getElementById('nav-install-app');
  const btnFooter = document.getElementById('footer-install-app');
  const qrImg = document.getElementById('install-qr-img');
  const qrSection = document.getElementById('install-qr-section');
  const btnTabAndroid = document.getElementById('btn-tab-android');
  const btnTabIos = document.getElementById('btn-tab-ios');
  const guideAndroid = document.getElementById('install-guide-android');
  const guideIos = document.getElementById('install-guide-ios');
  const pwaInstallBtn = document.getElementById('pwa-install-btn');
  const pwaShareBtn = document.getElementById('pwa-share-btn');

  if (!installModal) return;

  // Open Modal Logic
  const openModal = (e) => {
    e.preventDefault();
    
    // Set QR code URL dynamically based on the current domain/IP
    if (qrImg) {
      const currentUrl = window.location.href;
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentUrl)}`;
    }

    // Hide QR section on mobile devices
    if (qrSection) {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        qrSection.style.display = 'none';
      } else {
        qrSection.style.display = 'flex';
      }
    }

    installModal.classList.add('active');
  };

  if (btnNav) btnNav.addEventListener('click', openModal);
  if (btnFooter) btnFooter.addEventListener('click', openModal);

  // Close Modal Logic
  const closeModal = () => {
    installModal.classList.remove('active');
  };

  if (btnClose) btnClose.addEventListener('click', closeModal);
  installModal.addEventListener('click', (e) => {
    if (e.target === installModal) closeModal();
  });

  // Tab Switching Logic
  if (btnTabAndroid && btnTabIos && guideAndroid && guideIos) {
    btnTabAndroid.addEventListener('click', () => {
      btnTabAndroid.classList.add('active');
      btnTabIos.classList.remove('active');
      guideAndroid.classList.add('active');
      guideIos.classList.remove('active');
    });

    btnTabIos.addEventListener('click', () => {
      btnTabIos.classList.add('active');
      btnTabAndroid.classList.remove('active');
      guideIos.classList.add('active');
      guideAndroid.classList.remove('active');
    });
  }

  // PWA Install Prompt handling
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (pwaInstallBtn) {
      pwaInstallBtn.style.display = 'flex';
    }
  });

  if (pwaInstallBtn) {
    pwaInstallBtn.addEventListener('click', () => {
      if (!deferredPrompt) return;
      pwaInstallBtn.disabled = true;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('PWA installation accepted by user');
        } else {
          console.log('PWA installation dismissed by user');
        }
        deferredPrompt = null;
        pwaInstallBtn.style.display = 'none';
        pwaInstallBtn.disabled = false;
      });
    });
  }

  // PWA Share handling
  if (pwaShareBtn) {
    pwaShareBtn.addEventListener('click', () => {
      const shareData = {
        title: '간판지원단 모바일 앱',
        text: '경기도 소상공인 경영환경개선사업 간판지원단 모바일 앱 설치 링크입니다. 스마트폰에 홈 화면 앱으로 설치해 간편하게 이용하세요!',
        url: window.location.href.replace('dashboard.html', 'index.html')
      };

      if (navigator.share) {
        navigator.share(shareData)
          .then(() => console.log('PWA link shared successfully'))
          .catch((err) => console.log('Error sharing PWA link:', err));
      } else {
        // Fallback: Copy to clipboard
        const shareUrl = shareData.url;
        navigator.clipboard.writeText(shareUrl)
          .then(() => {
            alert('모바일 앱 설치 링크가 클립보드에 복사되었습니다.\n카카오톡이나 문자메시지 등에 붙여넣어 공유해보세요!');
          })
          .catch((err) => {
            console.error('Failed to copy share link:', err);
            alert('공유 링크: ' + shareUrl);
          });
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initPWA);

// --- 8. Visitor Tracking Logic ---
function initVisitorTracking() {
  if (localStorage.getItem('visitor_total') === null) {
    localStorage.setItem('visitor_total', '1420');
  }
  if (localStorage.getItem('visitor_today') === null) {
    localStorage.setItem('visitor_today', '34');
  }
  if (localStorage.getItem('visitor_last_date') === null) {
    localStorage.setItem('visitor_last_date', new Date().toISOString().split('T')[0]);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  let totalCount = parseInt(localStorage.getItem('visitor_total')) || 1420;
  let todayCount = parseInt(localStorage.getItem('visitor_today')) || 34;
  const lastDate = localStorage.getItem('visitor_last_date');

  if (!sessionStorage.getItem('visitor_session_counted')) {
    sessionStorage.setItem('visitor_session_counted', 'true');
    totalCount++;
    if (lastDate === todayStr) {
      todayCount++;
    } else {
      todayCount = 1;
      localStorage.setItem('visitor_last_date', todayStr);
    }
    localStorage.setItem('visitor_total', totalCount.toString());
    localStorage.setItem('visitor_today', todayCount.toString());
  }
}

// --- 9. Mobile Bottom Navigation spy & actions ---
function initMobileBottomNav() {
  const mNavItems = {
    home: document.getElementById('m-nav-home'),
    simulator: document.getElementById('m-nav-simulator'),
    apply: document.getElementById('m-nav-apply'),
    dashboard: document.getElementById('m-nav-dashboard')
  };

  const sections = {
    home: document.getElementById('home'),
    simulator: document.getElementById('simulator'),
    apply: document.getElementById('apply-section')
  };

  // 1. Scrollspy to highlight active tab
  if (mNavItems.home && mNavItems.simulator && mNavItems.apply) {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 180;
      let activeSection = 'home';
      
      if (sections.apply && scrollPos >= sections.apply.offsetTop) {
        activeSection = 'apply';
      } else if (sections.simulator && scrollPos >= sections.simulator.offsetTop) {
        activeSection = 'simulator';
      }

      Object.keys(mNavItems).forEach(key => {
        if (mNavItems[key]) {
          if (key === activeSection) {
            mNavItems[key].classList.add('active');
          } else if (key !== 'dashboard') {
            mNavItems[key].classList.remove('active');
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
  }

  // 2. Click behaviors to check auth for dashboard/mypage tab
  if (mNavItems.dashboard) {
    mNavItems.dashboard.addEventListener('click', (e) => {
      const activeUser = JSON.parse(localStorage.getItem('activeUser')) || null;
      if (!activeUser) {
        e.preventDefault();
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
          authModal.classList.add('active');
          alert('로그인이 필요한 페이지입니다. 로그인 화면으로 이동합니다.');
        }
      }
    });
  }

  // --- Initialize AI Assistant ---
  initAIAssistant();

  function initAIAssistant() {
    const trigger = document.getElementById('ai-assistant-trigger');
    const chatWindow = document.getElementById('ai-chat-window');
    const closeBtn = document.getElementById('ai-chat-close');
    const sendBtn = document.getElementById('ai-chat-send');
    const chatInput = document.getElementById('ai-chat-input');
    const chatMessages = document.getElementById('ai-chat-messages');

    if (!trigger || !chatWindow) return;

    // Toggle Chat Window
    trigger.addEventListener('click', () => {
      chatWindow.classList.add('active');
      trigger.style.display = 'none';
      chatInput.focus();
    });

    closeBtn.addEventListener('click', () => {
      chatWindow.classList.remove('active');
      trigger.style.display = 'flex';
    });

    // Handle Quick Reply Clicks
    chatMessages.addEventListener('click', (e) => {
      const btn = e.target.closest('.quick-reply-btn');
      if (btn) {
        const faqType = btn.getAttribute('data-faq');
        const question = btn.innerText;
        handleUserMessage(question, faqType);
      }
    });

    // Send Message
    function sendMessage() {
      const text = chatInput.value.trim();
      if (!text) return;
      chatInput.value = '';
      handleUserMessage(text);
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });

    const faqDatabase = {
      target: "💡 <strong>지원 대상 기준 안내</strong><br><br>경기도 내에 사업장을 두고 영업 중인 소상공인(영업 정지 상태 제외)을 대상으로 합니다.<br>단, 대기업 프랜차이즈 직영점 및 불법 사행성 업종 등은 제외될 수 있으니 사전에 상세 자격 검토를 신청하시는 것이 좋습니다.",
      documents: "📄 <strong>신청 필수 서류 안내</strong><br><br>1. 사업자등록증 사본 1부<br>2. 부가가치세과세표준증명원(최근 1년)<br>3. 임대차계약서 사본(임차 매장인 경우)<br>4. 기존 간판 현장 사진 및 설치할 정면 벽면 사진",
      simulator: "🎨 <strong>간판 시뮬레이터 사용법</strong><br><br>1. 메인 홈페이지의 [시뮬레이터] 메뉴로 이동합니다.<br>2. 제공되는 건물 facade 이미지 혹은 직접 촬영한 점포 사진을 로드합니다.<br>3. 원하는 간판 디자인 형태와 조명 타입을 선택하여 가상으로 간판을 얹어 확인하실 수 있습니다.",
      contact: "📞 <strong>고객센터 안내</strong><br><br>• 대표전화: 1588-0000<br>• 이메일: support@ganpan.go.kr<br>• 운영시간: 평일 09:00 - 18:00 (토/일요일 및 공휴일 휴무)<br>• 점심시간: 12:00 - 13:00"
    };

    function handleUserMessage(messageText, faqType = null) {
      // 1. Add User Message
      appendMessage(messageText, 'user');

      // Remove quick replies section if present to avoid screen cluttering
      const quickReplies = chatMessages.querySelector('.ai-quick-replies');
      if (quickReplies) {
        quickReplies.remove();
      }

      // 2. Add Loading Indicator
      const loadingId = appendLoading();

      // 3. Simulate Thinking & Respond
      setTimeout(() => {
        removeLoading(loadingId);
        
        let response = "";
        if (faqType && faqDatabase[faqType]) {
          response = faqDatabase[faqType];
        } else {
          // Keyword match logic
          const cleaned = messageText.toLowerCase();
          if (cleaned.includes('대상') || cleaned.includes('조건') || cleaned.includes('자격')) {
            response = faqDatabase.target;
          } else if (cleaned.includes('서류') || cleaned.includes('준비') || cleaned.includes('증명원')) {
            response = faqDatabase.documents;
          } else if (cleaned.includes('시뮬') || cleaned.includes('사용') || cleaned.includes('디자인')) {
            response = faqDatabase.simulator;
          } else if (cleaned.includes('센터') || cleaned.includes('전화') || cleaned.includes('운영') || cleaned.includes('번호')) {
            response = faqDatabase.contact;
          } else if (cleaned.includes('안녕')) {
            response = "안녕하세요! 무엇이든 물어보세요. 😊<br>예: '지원 대상', '필수 서류', '시뮬레이터 사용법' 등";
          } else {
            response = "죄송합니다. 1단계 간이 AI 비서 모델에서는 인식하지 못하는 질문입니다. 😢<br><br>아래 핵심 키워드를 참고해 질문해 주세요!<br>• <strong>'지원 대상'</strong><br>• <strong>'필수 서류'</strong><br>• <strong>'시뮬레이터 사용법'</strong><br>• <strong>'고객센터'</strong>";
          }
        }

        appendMessage(response, 'bot');
        
        // Re-append quick replies at the bottom so user can click other options
        appendQuickReplies();
        
      }, 800);
    }

    function appendMessage(text, sender) {
      const bubble = document.createElement('div');
      bubble.className = `chat-bubble ${sender}-message`;
      bubble.innerHTML = text;
      chatMessages.appendChild(bubble);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function appendLoading() {
      const loading = document.createElement('div');
      const id = 'loading-' + Date.now();
      loading.id = id;
      loading.className = 'chat-bubble bot-message chat-loading';
      loading.innerHTML = '<span></span><span></span><span></span>';
      chatMessages.appendChild(loading);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return id;
    }

    function removeLoading(id) {
      const elem = document.getElementById(id);
      if (elem) elem.remove();
    }

    function appendQuickReplies() {
      const div = document.createElement('div');
      div.className = 'ai-quick-replies';
      div.innerHTML = `
        <button class="quick-reply-btn" data-faq="target">💡 지원 대상 기준</button>
        <button class="quick-reply-btn" data-faq="documents">📄 신청 필수 서류</button>
        <button class="quick-reply-btn" data-faq="simulator">🎨 시뮬레이터 사용법</button>
        <button class="quick-reply-btn" data-faq="contact">📞 고객센터 운영시간</button>
      `;
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  // --- 비회원 간편 문의 모달 연동 ---
  const inquiryModal = document.getElementById('inquiry-modal');
  const inquiryModalClose = document.getElementById('inquiry-modal-close');
  const inquiryForm = document.getElementById('inquiry-form');

  function closeInquiryModal() {
    if (inquiryModal) {
      inquiryModal.classList.remove('active');
      if (inquiryForm) inquiryForm.reset();
      const cnt = document.getElementById('inquiry-char-count');
      if (cnt) cnt.textContent = '0';
    }
  }

  window.openInquiryModal = function(e) {
    if (e) e.preventDefault();
    if (inquiryModal) {
      inquiryModal.classList.add('active');
    }
  };

  if (inquiryModalClose) {
    inquiryModalClose.addEventListener('click', closeInquiryModal);
  }

  if (inquiryModal) {
    inquiryModal.addEventListener('click', (e) => {
      if (e.target === inquiryModal) {
        closeInquiryModal();
      }
    });
  }

  if (inquiryForm) {
    inquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = escapeHtml(document.getElementById('inquiry-name').value.trim());
      const phone = escapeHtml(document.getElementById('inquiry-phone').value.trim());
      const type = document.getElementById('inquiry-type').value;
      const message = escapeHtml(document.getElementById('inquiry-message').value.trim());

      if (!name || !phone || !type || !message) {
        alert('필수 입력 항목을 모두 작성해 주세요.');
        return;
      }

      // 성함 유효성 검사 (최소 2자 ~ 최대 20자)
      if (name.length < 2 || name.length > 20) {
        alert('성함은 최소 2자에서 최대 20자까지 입력해 주세요.');
        return;
      }

      // 연락처 유효성 검사 (최소 9자 ~ 최대 15자)
      if (phone.length < 9 || phone.length > 15) {
        alert('연락처는 최소 9자에서 최대 15자까지 입력해 주세요.');
        return;
      }

      // 연락처 형식 정규식 검증
      const phoneRegex = /^[0-9+\s-]+$/;
      if (!phoneRegex.test(phone)) {
        alert('연락처에는 숫자, 대시(-), 플러스(+) 및 공백만 입력할 수 있습니다.');
        return;
      }

      // 문의내용 글자수 유효성 검사 (최대 300자)
      if (message.length > 300) {
        alert('문의 내용은 최대 300자까지 입력해 주세요.');
        return;
      }

      const inquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
      const newInquiry = {
        id: 'INQ-' + Date.now(),
        name,
        phone,
        type,
        message,
        submittedAt: new Date().toISOString()
      };
      inquiries.push(newInquiry);
      localStorage.setItem('inquiries', JSON.stringify(inquiries));

      alert('간편 문의 접수가 정상 완료되었습니다.\n담당자가 확인 후 연락처로 신속히 연락드리겠습니다.');
      closeInquiryModal();
    });
  }

  // 실시간 글자수 계산 및 동적 카운터 업데이트
  const inquiryMessage = document.getElementById('inquiry-message');
  const inquiryCharCount = document.getElementById('inquiry-char-count');
  if (inquiryMessage && inquiryCharCount) {
    inquiryMessage.addEventListener('input', function() {
      const len = this.value.length;
      inquiryCharCount.textContent = len;
      if (len >= 300) {
        inquiryCharCount.style.color = '#ef4444';
      } else {
        inquiryCharCount.style.color = '#64748b';
      }
    });
  }

  const pcFooterInquiryBtn = document.getElementById('pc-footer-btn-inquiry');
  if (pcFooterInquiryBtn) {
    pcFooterInquiryBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.openInquiryModal();
    });
  }

  // --- 약관 전문 데이터 정의 및 모달 제어 ---
  const LEGAL_POLICIES = {
    terms: `제1조 (목적)
본 약관은 경기도 소상공인 간판지원단(이하 "지원단")과 지원단의 위탁운영사 주식회사 가야애드(이하 "회사")가 공동으로 제공하는 온라인 서비스(이하 "서비스")의 이용조건, 절차 및 회원과 회사 간의 권리와 의무 등 필요한 사항을 규정함을 목적으로 합니다.

제2조 (용어의 정의)
1. "서비스"란 회사가 자체 웹/앱 플랫폼을 통해 제공하는 간판 디자인 시뮬레이터 툴, 경영환경개선 간판지원사업 간편 대행 접수 시스템 및 관련 부가 서비스를 의미합니다.
2. "회원"이란 본 약관에 동의하고 서비스에 회원등록을 완료하여 계정을 부여받은 자를 뜻하며, 이용 권한에 따라 '일반고객 회원', '영업자 회원', '시공업체 회원', '관리자'로 구분됩니다.

제3조 (약관의 효력 및 개정)
1. 본 약관은 서비스를 이용하고자 하는 모든 회원에 대하여 효력을 발생합니다.
2. 회사는 관계법령을 위배하지 않는 범위 내에서 본 약관을 개정할 수 있으며, 개정 시 서비스 화면에 최소 7일 전부터 공지합니다.

제4조 (회원가입 및 회원등급 승인)
1. 이용자는 회사가 제시한 가입 양식에 실명 정보를 기입하고 본 약관에 동의함으로써 회원가입을 신청합니다.
2. '영업자 회원' 및 '시공업체 회원' 등 특수 등급은 가입 후 마이페이지를 통해 사업자등록증 등 증빙 서류를 제출하여 관리자의 검토 및 승인을 거쳐 최종 전환 완료됩니다.

제5조 (서비스의 제공 및 제한)
1. 회사는 회원에게 간판 디자인 시뮬레이션 및 간편 간판교체 대행 신청 서비스를 제공합니다.
2. 회사는 설비 점검, 통신 장애 또는 천재지변 발생 시 서비스의 전부 또는 일부를 일시 중지할 수 있습니다.

제6조 (회원의 의무 및 면책)
1. 회원은 타인의 명의를 도용하거나 허위 사실을 기재하여 서비스를 이용하여서는 안 됩니다.
2. 회사는 시뮬레이터를 통해 시각화된 시안과 실제 시공 결과물 간의 물리적 오차 및 시공 과정에서의 분쟁에 대해 책임을 지지 않습니다.`,

    privacy: `주식회사 가야애드(이하 "회사")는 경기도 소상공인 간판지원단 플랫폼을 운영함에 있어 정보주체의 개인정보를 보호하고 이와 관련된 고충을 신속하게 처리할 수 있도록 다음과 같이 개인정보 처리방침을 수립·공개합니다.

제1조 (개인정보의 수집 및 이용 목적)
회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
1. 회원 가입 및 관리: 회원 식별, 가입 의사 확인, 회원자격 유지·관리, 부정이용 방지
2. 서비스 제공 및 민원 처리: 간판 디자인 시뮬레이터 이용, 비회원 3초 간편 접수 상담 서비스 제공, 경영환경개선사업 대행 접수, 각종 고충 처리

제2조 (수집하는 개인정보의 항목)
회사는 서비스 제공을 위해 아래와 같은 필수 개인정보를 수집하고 있습니다.
1. 회원가입 시: 아이디, 비밀번호, 성명, 주소, 이메일, 휴대폰 번호, (영업자/시공사 전환 신청 시) 상호명, 사업자등록번호
2. 비회원 간편 문의 시: 성명, 연락처, 문의 유형, 문의 내용

제3조 (개인정보의 보유 및 이용 기간)
1. 회사는 회원 탈퇴 시 혹은 동의 철회 시까지 정보주체의 개인정보를 보유 및 이용합니다.
2. 단, 관계 법령(전자상거래 등에서의 소비자보호에 관한 법령 등)의 규정에 의하여 보존할 필요가 있는 경우, 해당 법령에서 정한 일정 기간(예: 소비자의 불만 또는 분쟁처리에 관한 기록 3년) 동안 보존합니다.

제4조 (개인정보의 파기절차 및 방법)
회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다. 전자적 파일 형태는 기록을 재생할 수 없는 기술적 방법을 사용하며, 종이 문서는 분쇄기로 분쇄하여 파기합니다.

제5조 (개인정보 보호책임자 및 고충 처리)
* 개인정보 보호책임자: 주식회사 가야애드 대표이사
* 연락처: 010-7266-2499 / nubine22@naver.com`,

    consent: `주식회사 가야애드(이하 "회사")는 경기도 소상공인 간판지원단 플랫폼의 비회원 간편 문의 및 서비스 회원가입 단계에서 개인정보보호법에 의거하여 다음과 같이 개인정보를 수집·이용하고자 합니다.

1. 개인정보를 수집하는 자: 주식회사 가야애드
2. 수집 및 이용 목적:
   - 비회원 3초 간편 문의 서비스 접수 및 본인 확인
   - 문의 사항에 대한 상담 및 답변(해피콜 연락) 제공
   - 환경개선 지원사업 신청 안내
3. 수집하는 개인정보의 항목:
   - 필수 항목: 성명(성함/이름), 연락처(휴대폰 번호/전화번호)
4. 개인정보의 보유 및 이용 기간:
   - 문의 접수 및 상담 처리가 완료된 날로부터 1년 보관 후 파기 (정보주체의 파기 요청 시 지체 없이 파기)
5. 동의 거부 권리 및 불이익 고지:
   - 귀하는 개인정보 수집 및 이용 동의를 거부할 권리가 있습니다.
   - 단, 필수 항목 동의를 거부하실 경우 3초 간편 문의 접수 서비스 이용이 제한됩니다.`
  };

  const policyModal = document.getElementById('policy-modal');
  const policyModalClose = document.getElementById('policy-modal-close');
  const btnPolicyConfirm = document.getElementById('btn-policy-confirm');
  const policyModalTitle = document.getElementById('policy-modal-title');
  const policyModalBody = document.getElementById('policy-modal-body');

  function closePolicyModal() {
    if (policyModal) {
      policyModal.classList.remove('active');
    }
  }

  window.openPolicyModal = function(type) {
    if (!policyModal || !policyModalTitle || !policyModalBody) return;
    
    let title = '';
    let content = '';

    if (type === 'privacy') {
      title = '개인정보 처리방침';
      content = LEGAL_POLICIES.privacy;
    } else if (type === 'terms') {
      title = '서비스 이용약관';
      content = LEGAL_POLICIES.terms;
    } else if (type === 'consent') {
      title = '개인정보 수집 및 이용 동의';
      content = LEGAL_POLICIES.consent;
    }

    policyModalTitle.innerHTML = `<i class="fa-solid fa-file-shield"></i> ${title}`;
    policyModalBody.textContent = content;
    policyModal.classList.add('active');
  };

  if (policyModalClose) {
    policyModalClose.addEventListener('click', closePolicyModal);
  }
  if (btnPolicyConfirm) {
    btnPolicyConfirm.addEventListener('click', closePolicyModal);
  }
  if (policyModal) {
    policyModal.addEventListener('click', (e) => {
      if (e.target === policyModal) {
        closePolicyModal();
      }
    });
  }

  // 푸터 약관 링크 클릭 리스너 연결
  const linkPrivacy = document.getElementById('link-policy-privacy');
  const linkTerms = document.getElementById('link-policy-terms');
  const linkConsent = document.getElementById('link-policy-consent');

  if (linkPrivacy) {
    linkPrivacy.addEventListener('click', (e) => {
      e.preventDefault();
      window.openPolicyModal('privacy');
    });
  }
  if (linkTerms) {
    linkTerms.addEventListener('click', (e) => {
      e.preventDefault();
      window.openPolicyModal('terms');
    });
  }
  if (linkConsent) {
    linkConsent.addEventListener('click', (e) => {
      e.preventDefault();
      window.openPolicyModal('consent');
    });
  }
}


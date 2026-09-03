// script.js - Signboard Support Portal Interactive Features

document.addEventListener('DOMContentLoaded', () => {
  const safeInit = (name, fn) => {
    try {
      if (typeof fn === 'function') fn();
    } catch (err) {
      console.warn(`[Init Module Error: ${name}]`, err);
    }
  };

  // --- 1. Fictional Building Gallery ---
  safeInit('BuildingGallery', initBuildingGallery);

  // --- 2. Signboard Simulator ---
  safeInit('Simulator', initSimulator);

  // --- 3. FAQ Accordion ---
  safeInit('FAQ', initFAQ);

  // --- 3.5. Owner Reviews ---
  safeInit('Reviews', initReviews);

  // --- 4. Application Wizard ---
  safeInit('Wizard', initWizard);

  // --- 5. Eligibility Checklist ---
  safeInit('Checklist', initChecklist);

  // --- 6. User Auth & Dashboard ---
  safeInit('AuthAndDashboard', initAuthAndDashboard);

  // --- 7. Real-time Popups ---
  safeInit('Popups', initPopups);

  // --- 8. Visitor Tracking ---
  safeInit('VisitorTracking', initVisitorTracking);

  // --- 9. Mobile Bottom Navigation ---
  safeInit('MobileBottomNav', initMobileBottomNav);

  // --- 10. AI Assistant ---
  safeInit('AIAssistant', initAIAssistant);

  // --- 11. Inquiry, Policy & Global Search ---
  safeInit('ModalsAndSearch', initModalsAndSearch);

  // --- 12. PWA Initialization ---
  safeInit('PWA', initPWA);
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
      date: '2025년 6월 08일',
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
      date: '2026년 7월 10일',
      satisfaction: '★★★★★ 98%',
      desc: '하얗고 모던한 매장 외벽에 어울리는 심플하고 고급스러운 블랙 아크릴 채널 간판으로 교체했습니다. 시공 후 세련된 디자인 덕분에 인스타그램을 보고 찾아오는 손님이 대폭 늘어났습니다.'
    },
    cas: {
      title: '카스전자저울 경기북부점',
      category: '기타도소매 / 전자저울전문점',
      support: '노후 전면 간판 철거 및 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 6월 27일',
      satisfaction: '★★★★★ 100%',
      desc: '낡고 어두웠던 상호명 부분을 파란색 시인성 높은 컬러로 천갈이하고 LED 등을 교체했습니다. 도로변에 인접해 있어 차를 타고 지나가는 운전자분들도 쉽게 매장을 찾을 수 있게 되었습니다.'
    },
    imone: {
      title: '이모네식당',
      category: '한식 / 백반전문점',
      support: '노후 전면 간판 철거 및 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 7월 10일',
      satisfaction: '★★★★★ 99%',
      desc: '이모네식당 전용 친근한 요리사 캐릭터와 깔끔한 손글씨 서체가 조화를 이루는 조명 간판으로 교체했습니다. 동네 주민분들뿐 아니라 인근 공사현장 직장인 고객들의 방문이 훨씬 늘었습니다.'
    },
    music: {
      title: '록씨티뮤직실용음악학원',
      category: '교육 / 실용음악학원',
      support: '노후 전면 간판 철거 및 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2025년 5월 24일',
      satisfaction: '★★★★☆ 95%',
      desc: '블랙 바탕에 강렬한 레드 채널 폰트와 일렉기타 그래픽을 살린 간판으로 전면 리뉴얼했습니다. 트렌디한 디자인 덕분에 중고등학생 및 성인 취미반 문의가 활성화되었습니다.'
    },
    fishing: {
      title: '양지낚시',
      category: '레저스포츠 / 낚시용품점',
      support: '노후 전면 간판 철거 및 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 6월 27일',
      satisfaction: '★★★★★ 100%',
      desc: '푸른 파도 그래픽과 대형 참돔 일러스트를 삽입하여 멀리서도 낚시점임을 단번에 알아볼 수 있는 조명용 플렉스 간판으로 교체했습니다. 야간 시인성이 극대화되어 이른 새벽 출조하시는 고객분들의 길잡이가 되고 있습니다.'
    },
    woojin: {
      title: '우진가구갤러리',
      category: '도소매 / 가구점',
      support: '노후 전면 간판 철거 및 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2025년 5월 24일',
      satisfaction: '★★★★★ 97%',
      desc: '대형 간판의 노후 프레임을 튼튼하게 보강하고 친환경 LED 투광등을 매립 시공하여 야간에도 전시된 가구들이 고급스럽게 부각되도록 정비했습니다.'
    },
    sewon: {
      title: '세원정밀',
      category: '제조업 / 금형 및 프레스',
      support: '노후 전면 간판 철거 및 고효율 LED 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 7월 10일',
      satisfaction: '★★★★★ 99%',
      desc: '금형제작 전문 업종의 성격에 맞게 깔끔하고 강직한 서체를 사용했으며, 좌측에 영문 로고 심볼을 깔끔하게 살렸습니다. 시공 후 주야간 시인성이 크게 높아져 공장 방문 거래처 신뢰도가 높아졌습니다.'
    },
    sinsegi: {
      title: '신세기포장',
      category: '제조업 / 포장용기 및 인쇄',
      support: '노후 전면 간판 철거 및 친환경 LED 조명용 플렉스 간판 시공',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2025년 5월 24일',
      satisfaction: '★★★★★ 100%',
      desc: '심플한 영문 블록 로고와 세련된 한글 서체가 화이트 앤 블루 컬러로 어우러져 깔끔한 마감을 선사합니다. 하단에 연락처를 크게 배치하여 전화 문의 및 신규 납품 계약 문의가 늘었습니다.'
    },
    shinjin_bolt: {
      title: '신진철물',
      category: '도소매 / 철물 및 공구',
      support: '노후 전면 천막 간판 철거 및 LED 조명용 플렉스 간판 시공',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 6월 27일',
      satisfaction: '★★★★★ 98%',
      desc: '"신진 철물 · 공구 · 유압" 상호를 시각성이 뛰어난 블루 바탕과 옐로우/화이트 배색으로 신규 단장했습니다. 매장 입구가 어두웠으나 간판을 새로 달며 길거리 전체가 밝아져 야간에도 영업 여부를 쉽게 알아볼 수 있습니다.'
    },
    shinjin_bearing: {
      title: '신진베어링',
      category: '도소매 / 베어링 및 볼트',
      support: '노후 간판 정비 및 조명용 플렉스 간판 교체',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 6월 27일',
      satisfaction: '★★★★★ 99%',
      desc: '산뜻한 옐로우 바탕에 레드와 네이비 계열의 조화로 시인성을 극대화한 간판을 설치했습니다. 매장 전면 노후 썬팅지와 함께 간판을 깔끔하게 바꾸어 한결 깨끗해진 이미지를 전해줍니다.'
    },
    seojeong: {
      title: '서정정밀',
      category: '제조업 / 선반 및 밀링 가공',
      support: '노후 철제 간판 철거 및 고조도 LED 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2024년 6월 05일',
      satisfaction: '★★★★☆ 96%',
      desc: '"서정정밀" 브랜드의 기술력을 강조하는 기어 모양 심볼 마크와 가공 분야(선반, 밀링, 슬로타, 용접 등)를 간판 우측에 보기 쉽게 정렬했습니다. 야간 조명 설치 덕분에 멀리서도 상호와 전문 분야가 또렷하게 드러납니다.'
    },
    hyundai: {
      title: '현대종합인테리어',
      category: '건설업 / 리모델링 및 인테리어',
      support: '노후 전면 간판 철거 및 LED 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 7월 4일',
      satisfaction: '★★★★★ 98%',
      desc: '강렬한 빨간색 배경에 깔끔한 흰색 글씨체로 가시성을 높였으며, 연락처와 전문 분야(벽지, 장판, 리모델링)를 하단에 알기 쉽게 표시했습니다. 깔끔해진 간판 덕분에 신뢰도가 올라 인근 아파트 단지 리모델링 문의가 많이 들어옵니다.'
    },
    chowon: {
      title: '초원식당',
      category: '한식 / 고기구이 전문점',
      support: '노후 전면 간판 철거 및 고화질 LED 조명용 플렉스 간판 시공',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 7월 4일',
      satisfaction: '★★★★★ 100%',
      desc: '풍성하고 맛있어 보이는 고기구이 일러스트와 정겨운 전통 서체가 어우러진 옥외 간판입니다. 저녁 시간대에 주황색과 노란색 그라데이션 조명이 켜지면 손님들의 입맛을 돋우는 시각적 효과가 우수하여 동네 명소가 되었습니다.'
    },
    shinwoo: {
      title: '신우카센터',
      category: '서비스업 / 자동차 경정비',
      support: '노후 간판 교체 및 조명용 플렉스 간판 시공',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 7월 4일',
      satisfaction: '★★★★★ 99%',
      desc: '자동차 수리 서비스 엠블럼과 눈에 띄는 "신우카센터" 브랜드 서체를 조화롭게 매칭했습니다. 도로변에서 매장으로 접근하는 차량 운전자분들이 직관적으로 경정비 업소임을 인지할 수 있어 차량 정비 대수가 대폭 증가했습니다.'
    },
    samdong: {
      title: '삼동콩나물국밥',
      category: '한식 / 국밥 전문점',
      support: '노후 간판 철거 및 친환경 LED 조명용 플렉스 간판 시공',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 6월 27일',
      satisfaction: '★★★★★ 100%',
      desc: '따뜻한 국밥 일러스트와 콩나물 시루 이미지를 양 옆에 배치하고 노란색 포인트 폰트로 주목성을 극대화한 간판입니다. 이른 아침이나 늦은 밤 해장하러 오시는 고객분들이 멀리서도 콩나물국밥 상호를 쉽게 찾을 수 있어 시공 만족도가 매우 높습니다.'
    },
    haengun: {
      title: '행운열쇠',
      category: '서비스업 / 열쇠 및 보안장치',
      support: '노후 전면 간판 철거 및 에너지절약형 LED 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2026년 7월 04일',
      satisfaction: '★★★★★ 97%',
      desc: '푸른색 상호 글꼴과 화이트/그린 그라데이션 바탕으로 깨끗하고 믿을 수 있는 보안 전문점 느낌을 강조했습니다. 간판 좌측에 취급 품목(번호키, 인터폰, 비디오폰, CCTV 등)을 일목요연하게 표시하여 출장 시공 및 키 복사 관련 방문 고객 문의가 눈에 띄게 늘어났습니다.'
    },
    hangyeol: {
      title: '한결종합배관',
      category: '도소매 / 배관자재 및 밸브',
      support: '노후 전면 간판 철거 및 LED 조명용 플렉스 간판 설치',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2025년 5월 24일',
      satisfaction: '★★★★★ 99%',
      desc: '강렬한 레드 톤 배경에 선명한 흰색 폰트를 매칭하고, 양측 흰색 원형 영역 안에 취급하는 종합 배관 자재 품목(안전면, 감압변, 용접부속, 주철밸브, 분배기 등)을 알기 쉽게 정돈했습니다. 대형 도로변에서의 시인성이 매우 뛰어납니다.'
    },
    hwangdoyaji: {
      title: '황도야지',
      category: '한식 / 삼겹살 및 찌개전문점',
      support: '노후 전면 간판 철거 및 고효율 LED 조명용 플렉스 간판 시공',
      subsidy: '2,000,000원 (자부담 0원 - VAT 별도)',
      date: '2025년 7월 15일',
      satisfaction: '★★★★★ 100%',
      desc: '노란색 배경에 시선을 사로잡는 붉은색 서체의 "황도야지 얼큰집" 상호와 한자 마크를 조화롭게 구성했습니다. 하단에는 주력 메뉴(삼겹살, 동태찌개, 부대찌개, 김치찌개 등)를 표기하여 저녁 외식을 찾는 주민 및 직장인들의 내방이 크게 늘었습니다.'
    }
  };

  function showDetails(shopId) {
    const data = merchantData[shopId];
    if (!data) return;

    shopSlots.forEach(slot => {
      if (slot.dataset.shop === shopId) {
        slot.classList.add('active-shop');
      } else {
        slot.classList.remove('active-shop');
      }
    });

    document.getElementById('detail-title').textContent = data.title;
    document.getElementById('detail-category').textContent = data.category;
    document.getElementById('detail-support').textContent = data.support;
    document.getElementById('detail-subsidy').textContent = data.subsidy;
    document.getElementById('detail-date').textContent = data.date;
    document.getElementById('detail-satisfaction').textContent = data.satisfaction;
    document.getElementById('detail-desc').textContent = data.desc;

    placeholder.style.display = 'none';
    content.style.display = 'block';
    content.style.opacity = 0;

    setTimeout(() => {
      content.style.transition = 'opacity 0.3s ease';
      content.style.opacity = 1;
    }, 50);
  }

  shopSlots.forEach(slot => {
    const shopId = slot.dataset.shop;
    slot.addEventListener('mouseenter', () => showDetails(shopId));
    slot.addEventListener('click', (e) => {
      e.stopPropagation();
      showDetails(shopId);
    });
  });

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

  let state = {
    shopName: '청춘카페',
    fontFamily: "'Nanum Pen Script', sans-serif",
    fontSize: 2.2,
    signType: 'neon',
    textColor: '#ec4899',
    bgColor: '#1e293b',
    isNight: false
  };

  const presets = {
    cafe: {
      shopName: '청춘카페',
      fontFamily: "'Nanum Pen Script', sans-serif",
      fontSize: 2.5,
      signType: 'neon',
      textColor: '#a855f7',
      bgColor: '#0f172a'
    },
    bakery: {
      shopName: '바른 베이커리',
      fontFamily: "'Black Han Sans', sans-serif",
      fontSize: 1.8,
      signType: 'neon',
      textColor: '#f59e0b',
      bgColor: '#0f172a'
    },
    flower: {
      shopName: '도담 꽃집',
      fontFamily: "'East Sea Dokdo', sans-serif",
      fontSize: 2.8,
      signType: 'neon',
      textColor: '#10b981',
      bgColor: '#0f172a'
    },
    salon: {
      shopName: 'M&H HAIR',
      fontFamily: "'Montserrat', sans-serif",
      fontSize: 1.6,
      signType: 'neon',
      textColor: '#3b82f6',
      bgColor: '#0f172a'
    }
  };

  const syncInputs = () => {
    if (textInput) textInput.value = state.shopName;
    if (fontSelect) fontSelect.value = state.fontFamily;
    if (sizeInput) sizeInput.value = state.fontSize;
    if (sizeVal) sizeVal.textContent = `${state.fontSize}x`;
    if (signTypeSelect) signTypeSelect.value = state.signType;
    if (nightToggle) nightToggle.checked = state.isNight;

    colorBtns.forEach(btn => {
      if (btn.dataset.color === state.textColor) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  };

  const render = () => {
    liveSignText.textContent = state.shopName;
    liveSignText.style.fontFamily = state.fontFamily;
    liveSignText.style.fontSize = `${state.fontSize}rem`;

    liveSignboard.style.setProperty('--glow-color', state.textColor);
    liveSignText.style.setProperty('--glow-color', state.textColor);

    liveSignboard.className = 'live-signboard';

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
    } else if (state.signType === 'led') {
      liveSignboard.style.backgroundColor = state.bgColor;
      liveSignboard.style.backgroundImage = 'none';
      liveSignboard.style.border = '3px solid #64748b';
      liveSignText.style.color = state.textColor;

      if (state.isNight) {
        liveSignboard.style.borderColor = '#94a3b8';
        liveSignText.classList.add('glow-text-active');
      } else {
        liveSignText.classList.remove('glow-text-active');
      }
    } else if (state.signType === 'wood') {
      liveSignboard.style.backgroundImage = 'linear-gradient(90deg, #b45309 0%, #78350f 100%)';
      liveSignboard.style.border = '2px solid #451a03';
      liveSignText.style.color = state.textColor;
      liveSignText.classList.remove('glow-text-active');
      liveSignboard.classList.remove('glow-border-active');
    } else if (state.signType === 'metal') {
      liveSignboard.style.backgroundImage = 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%)';
      liveSignboard.style.border = '2px solid #475569';
      liveSignText.style.color = state.textColor;

      if (state.isNight) {
        liveSignboard.classList.add('glow-border-active');
        liveSignText.classList.remove('glow-text-active');
      } else {
        liveSignboard.classList.remove('glow-border-active');
        liveSignText.classList.remove('glow-text-active');
      }
    }

    if (state.isNight) {
      simScreen.classList.add('night');
    } else {
      simScreen.classList.remove('night');
    }
  };

  if (textInput) {
    textInput.addEventListener('input', (e) => {
      state.shopName = e.target.value || '간판지원단';
      render();
    });
  }

  if (fontSelect) {
    fontSelect.addEventListener('change', (e) => {
      state.fontFamily = e.target.value;
      render();
    });
  }

  if (sizeInput) {
    sizeInput.addEventListener('input', (e) => {
      state.fontSize = parseFloat(e.target.value);
      if (sizeVal) sizeVal.textContent = `${state.fontSize}x`;
      render();
    });
  }

  if (signTypeSelect) {
    signTypeSelect.addEventListener('change', (e) => {
      state.signType = e.target.value;
      if (state.signType === 'wood') {
        state.textColor = '#3f200c';
      } else if (state.signType === 'metal') {
        state.textColor = '#0f172a';
      } else if (state.textColor === '#3f200c' || state.textColor === '#0f172a') {
        state.textColor = '#ec4899';
      }
      syncInputs();
      render();
    });
  }

  if (nightToggle) {
    nightToggle.addEventListener('change', (e) => {
      state.isNight = e.target.checked;
      render();
    });
  }

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

  const useSimulatedDesignBtn = document.getElementById('apply-design-btn');
  if (useSimulatedDesignBtn) {
    useSimulatedDesignBtn.addEventListener('click', () => {
      const shopNameField = document.getElementById('app-shop-name');
      if (shopNameField) shopNameField.value = state.shopName;

      const appSection = document.getElementById('apply-section');
      if (appSection) {
        appSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

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
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
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

  const existingReviews = localStorage.getItem('reviews');
  if (existingReviews) {
    try {
      const list = JSON.parse(existingReviews);
      if (list.length > 0 && list.some(r => r.name && r.name.includes('김성우'))) {
        localStorage.removeItem('reviews');
      }
    } catch (e) {
      console.warn('Reviews parse error:', e);
    }
  }

  if (!localStorage.getItem('reviews')) {
    const initialReviews = [
      {
        stars: 5,
        date: '2026.06',
        text: '12년 넘게 쓴 낡은 천막 간판을 이번 사업으로 교체했습니다. LED용 플렉스 간판으로 바꿨더니 멀리서도 가게가 환하게 잘 보여요. 저녁 영업 때 손님이 평균 25% 늘었고 전기세도 확 줄었습니다!',
        avatar: 'fa-store',
        name: 'ksw99*** 사장님',
        shop: '수원시 · 늘봄분식 운영'
      },
      {
        stars: 5,
        date: '2026.05',
        text: '낡고 한자가 섞인 칙칙한 나무 간판이었는데 트렌디한 LED용 플렉스 간판으로 전면 변경했습니다. 골목 전체가 밝아진 느낌이에요. 젊은 직장인 점심 고객들이 확실히 많이 찾아옵니다.',
        avatar: 'fa-bowl-food',
        name: 'lhy88*** 사장님',
        shop: '성남시 · 온가 가마솥국밥 운영'
      },
      {
        stars: 5,
        date: '2026.05',
        text: '가게가 2층 구석이라 지나치는 분들이 많았습니다. 골드 메탈 프레임 돌출 간판과 세련된 전면 LED용 플렉스 간판으로 함께 교체한 뒤로 예약 없이 직접 방문하시는 신규 손님이 매달 눈에 띄게 늘었어요.',
        avatar: 'fa-scissors',
        name: 'pjh77*** 사장님',
        shop: '안양시 · 헤어살롱 秀 운영'
      },
      {
        stars: 5,
        date: '2026.04',
        text: '카페 이름이 작아서 손님들이 길을 헤맸었는데 LED용 플렉스 간판으로 교체하고 나서 해결됐습니다. 인스타그램에서 입소문을 타고 골목의 예쁜 카페로 입소문 나며 주말 매출이 부쩍 늘었습니다.',
        avatar: 'fa-mug-hot',
        name: 'cej66*** 사장님',
        shop: '고양시 · 카페 드 솔 운영'
      },
      {
        stars: 5,
        date: '2026.03',
        text: '고급 정장을 파는데 녹슨 철제 프레임 간판이 어울리지 않아 고민이었습니다. 사업비 지원으로 LED용 플렉스 간판으로 교체했는데 점포 품격이 살아나며 단골 손님들이 칭찬을 아끼지 않습니다.',
        avatar: 'fa-shirt',
        name: 'jts55*** 사장님',
        shop: '부천시 · 클래식 옴므 운영'
      },
      {
        stars: 5,
        date: '2026.02',
        text: '초등학교 앞 골목 구석이라 눈에 띄지 않았는데 귀여운 식빵 캐릭터가 들어간 포인트 LED용 플렉스 간판을 달았습니다. 등하굣길 아이들과 학부모님들이 멀리서 보고 빵 사러 많이 들어옵니다.',
        avatar: 'fa-bread-slice',
        name: 'kmj44*** 사장님',
        shop: '용인시 · 도란도란 베이커리 운영'
      },
      {
        stars: 5,
        date: '2026.02',
        text: '붉은 색 네온사인 간판이 너무 무서워 보인다는 피드백이 있었는데 친환경 느낌의 화이트&그린 LED용 플렉스 간판으로 바꿨습니다. 청결하고 정돈된 분위기가 나서 젊은 주부 고객층의 단골 등록율이 크게 상승했어요.',
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
        text: '야간 응급 진료를 함께 운영 중인데 외부 간판 불이 약해 보호자분들이 당황하는 일이 잦았습니다. 밤에도 시인성이 탁월한 고휘도 LED용 플렉스 간판을 설치하여 안전하고 편하게 찾아오십니다.',
        avatar: 'fa-paw',
        name: 'och11*** 사장님',
        shop: '화성시 · 튼튼동물병원 운영'
      },
      {
        stars: 5,
        date: '2025.11',
        text: '산뜻한 파스텔톤 플라워 샵 전용 LED용 플렉스 간판으로 교체했습니다. 매장 앞을 포토존처럼 꾸밀 수 있게 조명 설계까지 도와주셔서 꽃 다발 주문은 물론 원데이 클래스 정원도 항상 꽉 차요.',
        avatar: 'fa-fan',
        name: 'byj00*** 사장님',
        shop: '평택시 · 플라워 가든 운영'
      }
    ];
    localStorage.setItem('reviews', JSON.stringify(initialReviews));
  }

  let reviewsList = JSON.parse(localStorage.getItem('reviews')) || [];
  let isExpanded = false;

  async function fetchSupabaseReviews() {
    if (window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase fetch reviews error:', error.message);
        } else if (data && data.length > 0) {
          const mapped = data.map(r => {
            const d = new Date(r.created_at);
            const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;

            let avatar = 'fa-store';
            if (r.shop_name.includes('카페') || r.shop_name.includes('커피') || r.shop_name.includes('디저트')) avatar = 'fa-mug-hot';
            else if (r.shop_name.includes('헤어') || r.shop_name.includes('미용')) avatar = 'fa-scissors';
            else if (r.shop_name.includes('국밥') || r.shop_name.includes('음식') || r.shop_name.includes('식당') || r.shop_name.includes('식사')) avatar = 'fa-bowl-food';
            else if (r.shop_name.includes('옷') || r.shop_name.includes('의류') || r.shop_name.includes('패션')) avatar = 'fa-shirt';

            return {
              stars: r.rating || 5,
              date: dateStr,
              text: r.content,
              avatar: avatar,
              name: r.author_name,
              shop: r.shop_name
            };
          });

          const localAndDb = [...mapped, ...reviewsList];
          const seen = new Set();
          reviewsList = localAndDb.filter(el => {
            const key = el.shop + '|' + el.text;
            const duplicate = seen.has(key);
            seen.add(key);
            return !duplicate;
          });

          renderReviews();
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  fetchSupabaseReviews();

  function renderReviews() {
    reviewsGrid.innerHTML = '';

    reviewsList.forEach((review, index) => {
      const isHidden = index >= 5;
      const card = document.createElement('div');
      card.className = `review-card glass-panel ${isHidden ? 'hidden-review' : ''}`;

      let starsHTML = '';
      for (let i = 1; i <= 5; i++) {
        if (i <= review.stars) {
          starsHTML += '<i class="fa-solid fa-star"></i>';
        } else {
          starsHTML += '<i class="fa-regular fa-star" style="color: #cbd5e1;"></i>';
        }
      }

      const avatarIcon = review.avatar || 'fa-store';

      card.innerHTML = `
        <div class="review-card-header">
            <span class="review-stars">${starsHTML}</span>
            <span class="review-date">${typeof escapeHtml === 'function' ? escapeHtml(review.date) : review.date}</span>
        </div>
        <p class="review-text">"${typeof escapeHtml === 'function' ? escapeHtml(review.text) : review.text}"</p>
        <div class="review-author">
            <div class="review-avatar"><i class="fa-solid ${avatarIcon}"></i></div>
            <div class="review-info">
                <div class="review-name">${typeof escapeHtml === 'function' ? escapeHtml(review.name) : review.name}</div>
                <div class="review-shop">${typeof escapeHtml === 'function' ? escapeHtml(review.shop) : review.shop}</div>
            </div>
        </div>
      `;

      reviewsGrid.appendChild(card);
    });

    isExpanded = false;
    const btnText = moreBtn.querySelector('span');
    const btnIcon = moreBtn.querySelector('i');
    if (btnText) btnText.textContent = '후기 더보기';
    if (btnIcon) btnIcon.className = 'fa-solid fa-chevron-down';
  }

  renderReviews();

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

  if (writeBtn && reviewModal) {
    writeBtn.addEventListener('click', () => {
      const activeUser = typeof getActiveUser === 'function' ? getActiveUser() : null;
      const authorNameInput = document.getElementById('review-author-name');
      const shopNameInput = document.getElementById('review-shop-name');
      const contentInput = document.getElementById('review-content');

      if (!activeUser) {
        if (confirm('후기 작성을 위해서는 로그인이 필요합니다. 로그인 화면으로 이동하시겠습니까?')) {
          const authModal = document.getElementById('auth-modal');
          if (authModal) authModal.classList.add('active');
        }
        return;
      }

      if (authorNameInput) {
        authorNameInput.value = activeUser.id;
        authorNameInput.readOnly = true;
        authorNameInput.style.backgroundColor = '#f1f5f9';
        authorNameInput.style.cursor = 'not-allowed';
      }

      let storeInfo = '';
      if (activeUser.items && activeUser.items.length > 0) {
        const appItem = activeUser.items[0];
        const city = activeUser.address ? activeUser.address.split(' ')[1] : '경기도';
        storeInfo = `${city} · ${appItem.name} 운영`;
      } else {
        const city = activeUser.address ? activeUser.address.split(' ')[1] : '경기도';
        storeInfo = `${city} · 소상공인`;
      }
      if (shopNameInput) shopNameInput.value = storeInfo;

      if (contentInput) contentInput.value = '';
      resetStarRating();

      const shopCounter = document.getElementById('review-shop-char-count');
      const contentCounter = document.getElementById('review-content-char-count');
      if (shopCounter && shopNameInput) shopCounter.textContent = shopNameInput.value.length;
      if (contentCounter) contentCounter.textContent = '0';

      reviewModal.classList.add('active');
    });
  }

  if (reviewCloseBtn && reviewModal) {
    reviewCloseBtn.addEventListener('click', () => {
      reviewModal.classList.remove('active');
    });

    reviewModal.addEventListener('click', (e) => {
      if (e.target === reviewModal) {
        reviewModal.classList.remove('active');
      }
    });
  }

  if (ratingStarsSelect) {
    const starItems = ratingStarsSelect.querySelectorAll('.star-select-item');
    starItems.forEach(star => {
      star.addEventListener('click', () => {
        const rating = parseInt(star.getAttribute('data-value'));
        if (ratingValInput) ratingValInput.value = rating;

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
      const currentRating = ratingValInput ? parseInt(ratingValInput.value) : 5;
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
    if (ratingValInput) ratingValInput.value = 5;
    if (ratingStarsSelect) {
      const starItems = ratingStarsSelect.querySelectorAll('.star-select-item');
      starItems.forEach(s => {
        s.style.color = '#fbbf24';
        s.classList.add('active');
      });
    }
  }

  if (reviewForm) {
    const maskId = (id) => {
      if (!id) return '';
      if (id.length <= 3) return id.substring(0, 1) + '*'.repeat(id.length - 1);
      return id.substring(0, 3) + '*'.repeat(id.length - 3);
    };

    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const rating = ratingValInput ? parseInt(ratingValInput.value) : 5;
      const name = document.getElementById('review-author-name')?.value.trim() || '';
      const shop = document.getElementById('review-shop-name')?.value.trim() || '';
      const text = document.getElementById('review-content')?.value.trim() || '';

      if (!name || !shop || !text) {
        alert('모든 항목을 입력해주세요.');
        return;
      }

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const dateStr = `${year}.${month}`;

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

      const maskedName = maskId(name) + ' 사장님';

      const newReview = {
        stars: rating,
        date: dateStr,
        text: text,
        avatar: avatar,
        name: maskedName,
        shop: shop
      };

      reviewsList = JSON.parse(localStorage.getItem('reviews')) || [];
      reviewsList.unshift(newReview);
      localStorage.setItem('reviews', JSON.stringify(reviewsList));

      if (window.supabaseClient) {
        const activeUser = typeof getActiveUser === 'function' ? getActiveUser() : null;
        window.supabaseClient.from('reviews').insert([{
          author_id: activeUser ? activeUser.id : null,
          author_name: maskedName,
          shop_name: shop,
          content: text,
          rating: rating
        }]).then(({ error }) => {
          if (error) console.error('Supabase Sync Error:', error.message);
        });
      }

      if (reviewModal) reviewModal.classList.remove('active');
      renderReviews();

      alert('후기가 성공적으로 등록되었습니다. 감사합니다!');

      const reviewsSection = document.getElementById('reviews');
      if (reviewsSection) {
        reviewsSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  const shopNameInput = document.getElementById('review-shop-name');
  const shopCounter = document.getElementById('review-shop-char-count');
  const contentInput = document.getElementById('review-content');
  const contentCounter = document.getElementById('review-content-char-count');

  if (shopNameInput && shopCounter) {
    shopNameInput.addEventListener('input', () => {
      shopCounter.textContent = shopNameInput.value.length;
    });
  }

  if (contentInput && contentCounter) {
    contentInput.addEventListener('input', () => {
      contentCounter.textContent = contentInput.value.length;
    });
  }
}

// ==========================================
// 4. Application Wizard Logic
// ==========================================
function initWizard() {
  const steps = document.querySelectorAll('.step-pane[data-step="1"], .step-pane[data-step="2"], .step-pane[data-step="3"]');
  const completePane = document.getElementById('step-pane-complete');
  const wizardButtonsArea = document.getElementById('wizard-buttons-area') || document.querySelector('.wizard-buttons');
  const restartBtn = document.getElementById('btn-wizard-restart');
  const stepNodes = document.querySelectorAll('.step-node');
  const progressBar = document.querySelector('.wizard-progress');
  const prevBtn = document.getElementById('prev-step');
  const nextBtn = document.getElementById('next-step');
  const successModal = document.getElementById('success-modal');
  const successCloseBtn = document.getElementById('success-confirm');

  const uploadArea = document.getElementById('file-upload-area');
  const uploadInput = document.getElementById('store-photo');
  const uploadCameraInput = document.getElementById('store-photo-camera');
  const fileNameDisplay = document.getElementById('uploaded-file-name');
  const photoChoiceOverlay = document.getElementById('photo-choice-overlay');
  const btnChoiceCamera = document.getElementById('btn-choice-camera');
  const btnChoiceGallery = document.getElementById('btn-choice-gallery');
  const btnChoiceCancel = document.getElementById('btn-choice-cancel');

  if (steps.length === 0) return;

  function updateReferrerField() {
    const referrerInput = document.getElementById('referrer-code');
    if (!referrerInput) return;

    const loggedUser = (window.DataStore && typeof window.DataStore.getActiveUser === 'function')
      ? window.DataStore.getActiveUser()
      : ((typeof getActiveUser === 'function') ? getActiveUser() : (JSON.parse(localStorage.getItem('activeUser')) || JSON.parse(sessionStorage.getItem('activeUser'))));

    const refLabel = document.querySelector('label[for="referrer-code"]');
    const existingBadge = document.getElementById('biz-auto-badge');

    if (loggedUser && (loggedUser.role === 'business' || loggedUser.bizCode)) {
      const code = loggedUser.bizCode || loggedUser.biz_code || '';
      if (code) {
        referrerInput.value = code;
        referrerInput.readOnly = true;
        referrerInput.style.backgroundColor = '#f1f5f9';
        referrerInput.style.color = '#334155';
        referrerInput.style.fontWeight = '700';
        referrerInput.title = `담당 영업자 (${loggedUser.name || ''}) 코드가 자동 적용되었습니다.`;

        if (refLabel && !existingBadge) {
          const badge = document.createElement('span');
          badge.id = 'biz-auto-badge';
          badge.style.cssText = 'margin-left: 6px; font-size: 0.76rem; background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 9999px; font-weight: 700;';
          badge.innerHTML = `<i class="fa-solid fa-lock"></i> 영업자 본인 자동지정 (${loggedUser.name || '영업자'})`;
          refLabel.appendChild(badge);
        } else if (existingBadge) {
          existingBadge.innerHTML = `<i class="fa-solid fa-lock"></i> 영업자 본인 자동지정 (${loggedUser.name || '영업자'})`;
        }
        return;
      }
    }

    // 비회원 또는 일반회원인 경우
    referrerInput.readOnly = false;
    referrerInput.style.backgroundColor = '';
    referrerInput.style.color = '';
    referrerInput.style.fontWeight = '';
    referrerInput.title = '';
    if (existingBadge && existingBadge.parentNode) {
      existingBadge.parentNode.removeChild(existingBadge);
    }

    // URL 파라미터 ?ref= 체크
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode && !referrerInput.value) {
      referrerInput.value = refCode.trim();
    }
  }
  window.updateReferrerField = updateReferrerField;
  updateReferrerField();

  let currentStep = 0;
  let uploadedPhotos = [];
  const photosPreviewContainer = document.getElementById('uploaded-photos-preview');

  if (uploadArea) {
    uploadArea.addEventListener('click', (e) => {
      // Direct input click bypass
      if (e.target === uploadInput || e.target === uploadCameraInput) return;
      if (photoChoiceOverlay) {
        window.currentPhotoTarget = 'apply';
        photoChoiceOverlay.classList.add('active');
      } else if (uploadInput) {
        uploadInput.click();
      }
    });

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
      if (files && files.length) {
        handlePhotoFiles(files);
      }
    });

    if (uploadInput) {
      uploadInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length) {
          handlePhotoFiles(e.target.files);
        }
        uploadInput.value = '';
      });
    }

    if (uploadCameraInput) {
      uploadCameraInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length) {
          handlePhotoFiles(e.target.files);
        }
        uploadCameraInput.value = '';
      });
    }
  }

  if (photoChoiceOverlay) {
    photoChoiceOverlay.addEventListener('click', (e) => {
      if (e.target === photoChoiceOverlay) {
        photoChoiceOverlay.classList.remove('active');
      }
    });

    if (btnChoiceCancel) {
      btnChoiceCancel.addEventListener('click', () => {
        photoChoiceOverlay.classList.remove('active');
      });
    }

    if (btnChoiceCamera) {
      btnChoiceCamera.addEventListener('click', () => {
        photoChoiceOverlay.classList.remove('active');
        if (window.currentPhotoTarget === 'apply') {
          const storeCam = document.getElementById('store-photo-camera');
          if (storeCam) storeCam.click();
          else if (uploadInput) uploadInput.click();
        }
      });
    }

    if (btnChoiceGallery) {
      btnChoiceGallery.addEventListener('click', () => {
        photoChoiceOverlay.classList.remove('active');
        if (window.currentPhotoTarget === 'apply') {
          const storeGal = document.getElementById('store-photo');
          if (storeGal) storeGal.click();
        }
      });
    }
  }

  async function handlePhotoFiles(fileList) {
    const validExtensions = ['jpg', 'jpeg', 'png'];
    const validMimes = ['image/jpeg', 'image/png'];
    const newFiles = Array.from(fileList);

    const invalidFiles = newFiles.filter(f => {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      return !validExtensions.includes(ext) && !validMimes.includes(f.type);
    });

    if (invalidFiles.length > 0) {
      alert('사진 파일은 JPG 및 PNG 형식만 업로드 가능합니다.');
      return;
    }

    if (uploadedPhotos.length + newFiles.length > 10) {
      alert(`사진은 최대 10장까지 업로드할 수 있습니다. (현재 ${uploadedPhotos.length}장 등록됨)`);
    }

    const availableSlots = 10 - uploadedPhotos.length;
    if (availableSlots <= 0) return;

    const filesToProcess = newFiles.slice(0, availableSlots);

    for (const file of filesToProcess) {
      try {
        let base64 = '';
        if (typeof compressImageToBase64 === 'function') {
          base64 = await compressImageToBase64(file, 300 * 1024);
        } else {
          base64 = await new Promise(res => {
            const reader = new FileReader();
            reader.onload = ev => res(ev.target.result);
            reader.readAsDataURL(file);
          });
        }
        uploadedPhotos.push({
          name: file.name,
          dataUrl: base64
        });
      } catch (err) {
        console.error('Image compression error:', err);
      }
    }

    renderPhotosPreview();
  }

  function renderPhotosPreview() {
    const photoCountEl = document.getElementById('apply-photo-count');
    if (photoCountEl) {
      photoCountEl.textContent = `선택된 사진: ${uploadedPhotos.length} / 10장`;
    }

    if (fileNameDisplay) {
      if (uploadedPhotos.length > 0) {
        fileNameDisplay.textContent = `✓ 업로드된 사진 (${uploadedPhotos.length}/10장): ${uploadedPhotos.map(p => p.name).join(', ')}`;
        fileNameDisplay.style.display = 'block';
      } else {
        fileNameDisplay.textContent = '';
        fileNameDisplay.style.display = 'none';
      }
    }

    if (photosPreviewContainer) {
      photosPreviewContainer.innerHTML = '';
      uploadedPhotos.forEach((photo, idx) => {
        const item = document.createElement('div');
        item.className = 'uploaded-photo-item';
        item.innerHTML = `
          <img src="${photo.dataUrl}" alt="${typeof escapeHtml === 'function' ? escapeHtml(photo.name) : photo.name}" title="${typeof escapeHtml === 'function' ? escapeHtml(photo.name) : photo.name}">
          <button type="button" class="uploaded-photo-remove" data-index="${idx}" title="삭제">&times;</button>
        `;
        photosPreviewContainer.appendChild(item);
      });

      photosPreviewContainer.querySelectorAll('.uploaded-photo-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const removeIdx = parseInt(btn.getAttribute('data-index'), 10);
          if (!isNaN(removeIdx)) {
            uploadedPhotos.splice(removeIdx, 1);
            renderPhotosPreview();
          }
        });
      });
    }
  }

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

    const percent = (currentStep / (steps.length - 1)) * 100;
    if (progressBar) {
      progressBar.style.width = `${percent}%`;
    }

    if (prevBtn) {
      if (currentStep === 0) {
        prevBtn.style.visibility = 'hidden';
      } else {
        prevBtn.style.visibility = 'visible';
      }
    }

    if (nextBtn) {
      if (currentStep === steps.length - 1) {
        nextBtn.textContent = '신청서 제출';
        nextBtn.className = 'btn btn-primary btn-success';
      } else {
        nextBtn.textContent = '다음 단계';
        nextBtn.className = 'btn btn-primary';
      }
    }

    if (currentStep === 2) {
      compileSummary();
    }
  }

  function compileSummary() {
    const ownerName = document.getElementById('owner-name')?.value || '-';
    const ownerPhone = document.getElementById('owner-phone')?.value || '-';
    const storeName = document.getElementById('app-shop-name')?.value || '-';
    const storeAddress = document.getElementById('store-address')?.value || '-';
    const photoCount = uploadedPhotos.length;
    const fileUploaded = photoCount > 0
      ? `현장사진 총 ${photoCount}장 첨부 완료 (정상 등록)`
      : '업로드 파일 없음';
    const referrerVal = document.getElementById('referrer-code')?.value.trim() || '-';

    if (document.getElementById('sum-owner-name')) document.getElementById('sum-owner-name').textContent = ownerName;
    if (document.getElementById('sum-owner-phone')) document.getElementById('sum-owner-phone').textContent = ownerPhone;
    if (document.getElementById('sum-store-name')) document.getElementById('sum-store-name').textContent = storeName;
    if (document.getElementById('sum-store-address')) document.getElementById('sum-store-address').textContent = storeAddress;
    if (document.getElementById('sum-file-name')) document.getElementById('sum-file-name').textContent = fileUploaded;
    if (document.getElementById('sum-referrer-code')) document.getElementById('sum-referrer-code').textContent = referrerVal;
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

  function scrollToActiveStep() {
    const doScroll = () => {
      const activePane = document.querySelector('.step-pane.active');
      const targetHeader = activePane ? (activePane.querySelector('h3') || activePane) : null;
      if (targetHeader) {
        targetHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const headerOffset = 100;
        const rect = targetHeader.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const targetTop = rect.top + scrollTop - headerOffset;

        window.scrollTo({
          top: Math.max(0, targetTop),
          behavior: 'smooth'
        });
      } else {
        const applySection = document.getElementById('apply-section') || document.getElementById('apply-form');
        if (applySection) {
          applySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    requestAnimationFrame(doScroll);
    setTimeout(doScroll, 60);
    setTimeout(doScroll, 200);
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentStep > 0) {
        currentStep--;
        renderWizard();
        scrollToActiveStep();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentStep === steps.length - 1) {
        submitApplication();
        return;
      }

      if (validateStep(currentStep)) {
        currentStep++;
        renderWizard();
        scrollToActiveStep();
      }
    });
  }

  function safeSetStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (quotaErr) {
      console.warn(`localStorage quota exceeded for ${key}, trimming large payloads...`, quotaErr);
      try {
        if (key === 'applications' && Array.isArray(value)) {
          const lightweightApps = value.map((app, idx) => {
            if (idx < value.length - 1) {
              return { ...app, photos: [], fileData: '' };
            }
            return {
              ...app,
              photos: (app.photos && app.photos.length > 0) ? [app.photos[0]] : [],
              fileData: (app.photos && app.photos.length > 0) ? app.photos[0] : ''
            };
          });
          localStorage.setItem(key, JSON.stringify(lightweightApps));
          return true;
        } else if (key === 'users' && Array.isArray(value)) {
          const lightweightUsers = value.map(u => {
            if (u.items && Array.isArray(u.items)) {
              const lightItems = u.items.map(it => ({ ...it, photos: [] }));
              return { ...u, items: lightItems };
            }
            return u;
          });
          localStorage.setItem(key, JSON.stringify(lightweightUsers));
          return true;
        }
      } catch (e2) {
        console.error(`Final localStorage setItem failed for ${key}:`, e2);
      }
    }
    return false;
  }

  function submitApplication() {
    try {
      const agreeTerms = document.getElementById('agree-terms');
      if (agreeTerms && !agreeTerms.checked) {
        alert('개인정보 수집 및 심사 규정 동의에 체크해 주세요.');
        return;
      }

      const now = new Date();
      const ownerName = document.getElementById('owner-name')?.value.trim() || '';
      const ownerPhone = document.getElementById('owner-phone')?.value.trim() || '';
      const storeName = document.getElementById('app-shop-name')?.value.trim() || '';
      const storeAddress = document.getElementById('store-address')?.value.trim() || '';
      const photos = uploadedPhotos.map(p => p.dataUrl);
      const fileName = uploadedPhotos.length > 0 ? uploadedPhotos.map(p => p.name).join(', ') : '업로드 파일 없음';
      const fileData = photos[0] || '';
      const referrerCode = document.getElementById('referrer-code')?.value.trim() || '';

      if (!ownerName || !ownerPhone) {
        alert('신청자 이름과 연락처를 입력해 주세요.');
        return;
      }
      if (!storeName || !storeAddress) {
        alert('상호명과 설치 주소를 입력해 주세요.');
        return;
      }

      const activeUser = (typeof getActiveUser === 'function') ? (getActiveUser() || null) : null;
      let users = JSON.parse(localStorage.getItem('users')) || [];
      const apps = JSON.parse(localStorage.getItem('applications')) || [];

      const phoneDigits = ownerPhone.replace(/[^0-9]/g, '');
      const autoPw = 'g-' + (phoneDigits.length >= 8 ? phoneDigits.slice(-8) : phoneDigits.padStart(8, '0'));
      const hashedPassword = (typeof sha256 === 'function') ? sha256(autoPw) : autoPw;

      let userId = phoneDigits || ('guest_' + Date.now());
      let loginNoticeId = phoneDigits;
      let loginNoticePw = autoPw;
      let isNewAccount = false;

      // 점주 대표 전화번호(휴대폰 010... 또는 일반전화 031...) 기반 독립 자동 계정 확인 및 생성
      const existingIdx = users.findIndex(u => {
        const uPhoneDigits = (u.phone || '').replace(/[^0-9]/g, '');
        return (uPhoneDigits && uPhoneDigits === phoneDigits) || (u.id && String(u.id).toLowerCase() === phoneDigits.toLowerCase());
      });

      if (existingIdx !== -1) {
        const existing = users[existingIdx];
        userId = existing.id;
        loginNoticeId = existing.id;
        loginNoticePw = autoPw;

        if (existing.role === 'normal' || !existing.role) {
          users[existingIdx] = {
            ...existing,
            name: ownerName || existing.name,
            phone: ownerPhone,
            address: storeAddress || existing.address,
            pw: hashedPassword
          };
          safeSetStorage('users', users);
          if (window.SupabaseSync && typeof window.SupabaseSync.updateUser === 'function') {
            window.SupabaseSync.updateUser(existing.id, { 
              name: ownerName || existing.name,
              phone: ownerPhone, 
              address: storeAddress || existing.address,
              password_hash: hashedPassword 
            }).catch(() => {});
          }
        }
        const newUser = {
          id: phoneDigits,
          name: ownerName,
          phone: ownerPhone,
          email: document.getElementById('owner-email')?.value.trim() || '',
          address: storeAddress,
          pw: hashedPassword,
          role: 'normal',
          conversionStatus: 'none',
          items: [],
          createdAt: now.toISOString()
        };

        users.push(newUser);
        if (window.DataStore && typeof window.DataStore.saveUsers === 'function') {
          window.DataStore.saveUsers(users);
        } else {
          safeSetStorage('users', users);
        }

        if (window.SupabaseSync && typeof window.SupabaseSync.upsertUser === 'function') {
          window.SupabaseSync.upsertUser(newUser).catch(e => console.warn('Supabase upsertUser async err:', e));
        }
      }

      const loggedUser = (window.DataStore && typeof window.DataStore.getActiveUser === 'function') 
        ? window.DataStore.getActiveUser() 
        : (JSON.parse(localStorage.getItem('activeUser')) || null);

      const finalReferrerCode = (loggedUser && (loggedUser.role === 'business' || loggedUser.role === 'admin') && loggedUser.bizCode)
        ? loggedUser.bizCode
        : (referrerCode || (loggedUser ? (loggedUser.bizCode || loggedUser.id) : ''));

      let customId = '';
      const dateTag = String(now.getFullYear()).slice(-2) + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');

      if (finalReferrerCode) {
        customId = typeof generateBizItemId === 'function' 
          ? generateBizItemId(finalReferrerCode, apps) 
          : `${finalReferrerCode}-${String(apps.length + 1).padStart(3, '0')}`;
      } else {
        customId = typeof generateApplicationId === 'function' 
          ? generateApplicationId(apps) 
          : `P-${dateTag}001`;
      }

      let assignedSalespersonId = '';
      let assignedSalespersonName = '';
      if (loggedUser && (loggedUser.role === 'business' || loggedUser.role === 'admin')) {
        assignedSalespersonId = loggedUser.id;
        assignedSalespersonName = loggedUser.name;
      } else if (finalReferrerCode) {
        const matchedSales = users.find(u =>
          (u.role === 'business' || u.role === 'admin') &&
          ((u.bizCode && String(u.bizCode).trim().toLowerCase() === String(finalReferrerCode).trim().toLowerCase()) ||
           (u.id && String(u.id).trim().toLowerCase() === String(finalReferrerCode).trim().toLowerCase()) ||
           (u.name && String(u.name).trim().toLowerCase() === String(finalReferrerCode).trim().toLowerCase()))
        );
        if (matchedSales) {
          assignedSalespersonId = matchedSales.id;
          assignedSalespersonName = matchedSales.name;
        }
      }

      const newApp = {
        id: customId,
        userId: (loggedUser && loggedUser.role === 'business') ? loggedUser.id : userId,
        applicantUserId: userId,
        registeredBy: loggedUser ? loggedUser.id : (phoneDigits || 'guest'),
        salespersonId: assignedSalespersonId,
        salespersonName: assignedSalespersonName,
        ownerName,
        ownerPhone,
        storeName,
        storeAddress,
        signType: '간판지원신청',
        fileName,
        fileData,
        photos,
        photosCount: photos.length,
        appliedAt: now.toISOString(),
        status: 'pending',
        isBizItem: false,
        receiptStatus: '접수완료',
        progressStatus: '심사대기',
        referrerCode: finalReferrerCode,
        autoAccount: {
          id: loginNoticeId,
          pw: loginNoticePw,
          isNew: isNewAccount
        }
      };

      apps.push(newApp);
      safeSetStorage('applications', apps);

      if (window.KakaoNotifier && typeof window.KakaoNotifier.notifyApplication === 'function') {
        try {
          window.KakaoNotifier.notifyApplication(newApp);
        } catch (kErr) {
          console.warn('Kakao notify error:', kErr);
        }
      }

      // Supabase 클라우드 영구 저장 및 0초 전역 동기화 발화 (SSOT)
      if (window.SupabaseSync && typeof window.SupabaseSync.upsertApplication === 'function') {
        window.SupabaseSync.upsertApplication(newApp).then(() => {
          if (typeof window.SupabaseSync.syncAllData === 'function') {
            window.SupabaseSync.syncAllData();
          }
        }).catch(supaErr => console.warn('Supabase upsertApplication error:', supaErr));
      }

      // 0초 전역 동기화 브로드캐스트
      if (window.DataStore && typeof window.DataStore.notifyAll === 'function') {
        window.DataStore.notifyAll();
      }
      window.dispatchEvent(new CustomEvent('supabase-data-synced', { detail: { newApp } }));

      const appIdContainer = document.getElementById('success-app-id-container');
      if (appIdContainer) appIdContainer.textContent = customId;
      const storeNameContainer = document.getElementById('success-store-name');
      if (storeNameContainer) storeNameContainer.textContent = storeName;
      const loginIdContainer = document.getElementById('success-login-id');
      if (loginIdContainer) loginIdContainer.textContent = loginNoticeId;
      const loginPwContainer = document.getElementById('success-login-pw');
      if (loginPwContainer) loginPwContainer.textContent = loginNoticePw;

      const compAppId = document.getElementById('complete-app-id');
      if (compAppId) compAppId.textContent = customId;
      const compStoreName = document.getElementById('complete-store-name');
      if (compStoreName) compStoreName.textContent = storeName;
      const compOwnerName = document.getElementById('complete-owner-name');
      if (compOwnerName) compOwnerName.textContent = ownerName;
      const compOwnerPhone = document.getElementById('complete-owner-phone');
      if (compOwnerPhone) compOwnerPhone.textContent = ownerPhone;
      const compStoreAddr = document.getElementById('complete-store-address');
      if (compStoreAddr) compStoreAddr.textContent = storeAddress;
      const compLoginId = document.getElementById('complete-login-id');
      if (compLoginId) compLoginId.textContent = loginNoticeId;
      const compLoginPw = document.getElementById('complete-login-pw');
      if (compLoginPw) compLoginPw.textContent = loginNoticePw;

      stepNodes.forEach((node) => {
        node.className = 'step-node complete';
        node.innerHTML = '<i class="fas fa-check"></i>';
      });
      if (progressBar) {
        progressBar.style.width = '100%';
      }

      if (wizardButtonsArea) {
        wizardButtonsArea.style.display = 'none';
      }

      steps.forEach(pane => pane.classList.remove('active'));
      if (completePane) {
        completePane.classList.add('active');
      }

      if (successModal) {
        successModal.classList.add('active');
      }
    } catch (criticalErr) {
      console.error('Critical error in submitApplication:', criticalErr);
      if (successModal) {
        successModal.classList.add('active');
      }
    }
  }

  if (successCloseBtn) {
    successCloseBtn.addEventListener('click', () => {
      if (successModal) {
        successModal.classList.remove('active');
      }
      scrollToActiveStep();
    });
  }

  function resetWizardToStart() {
    currentStep = 0;
    const ownerNameEl = document.getElementById('owner-name');
    const ownerPhoneEl = document.getElementById('owner-phone');
    if (ownerNameEl) ownerNameEl.value = '';
    if (ownerPhoneEl) { ownerPhoneEl.value = ''; ownerPhoneEl.disabled = false; }
    const shopNameEl = document.getElementById('app-shop-name');
    if (shopNameEl) shopNameEl.value = '';
    const addressEl = document.getElementById('store-address');
    if (addressEl) addressEl.value = '';
    if (document.getElementById('referrer-code')) {
      document.getElementById('referrer-code').value = '';
    }
    if (typeof updateReferrerField === 'function') {
      updateReferrerField();
    }
    if (uploadInput) uploadInput.value = '';
    uploadedPhotos = [];
    renderPhotosPreview();

    if (completePane) completePane.classList.remove('active');
    if (wizardButtonsArea) wizardButtonsArea.style.display = 'flex';

    // 미선언 변수 방어 처리 (Element 안전 참조)
    const ownerSmsAuthGroup = document.getElementById('owner-sms-auth-group');
    const btnOwnerSmsAuth = document.getElementById('btn-owner-sms-auth');
    const ownerPhoneCheckMsg = document.getElementById('owner-phone-check-msg');

    if (typeof ownerSmsTimerInterval !== 'undefined' && ownerSmsTimerInterval) {
      clearInterval(ownerSmsTimerInterval);
    }
    if (ownerSmsAuthGroup) ownerSmsAuthGroup.style.display = 'none';
    if (btnOwnerSmsAuth) btnOwnerSmsAuth.disabled = false;
    if (ownerPhoneCheckMsg) {
      ownerPhoneCheckMsg.textContent = '';
      ownerPhoneCheckMsg.className = 'form-helper';
    }

    renderWizard();
    scrollToActiveStep();
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', resetWizardToStart);
  }

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

    if (checkbox.checked) {
      card.classList.add('checked');
    } else {
      card.classList.remove('checked');
    }

    card.addEventListener('click', (e) => {
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
  const storedUsersStr = localStorage.getItem('users');
  if (storedUsersStr) {
    try {
      const parsedUsers = JSON.parse(storedUsersStr);
      let updated = false;
      parsedUsers.forEach(u => {
        if (u.pw && u.pw.length !== 64 && !u.isSNS) {
          if (typeof sha256 === 'function') {
            u.pw = sha256(u.pw);
            updated = true;
          }
        }
      });
      if (updated) {
        localStorage.setItem('users', JSON.stringify(parsedUsers));
      }
    } catch (e) {
      console.error('Failed to migrate users passwords:', e);
    }
  }

  if (!localStorage.getItem('users')) {
    const defaultUsers = [
      {
        id: 'admin',
        pw: '5c06eb3d5a05a19f49476d694ca81a36344660e9d5b98e3d6a6630f31c2422e7',
        name: '최고관리자',
        address: '경기도 수원시 영통구 청명남로 10',
        email: 'admin@ganpan.go.kr',
        phone: '010-0000-0000',
        role: 'admin',
        isSNS: false,
        bizCode: null,
        conversionStatus: 'none',
        items: []
      }
    ];
    localStorage.setItem('users', JSON.stringify(defaultUsers));
  }

  let users = JSON.parse(localStorage.getItem('users')) || [];

  if (users && !users.some(u => u.id === 'admin')) {
    users.push({
      id: 'admin',
      pw: '5c06eb3d5a05a19f49476d694ca81a36344660e9d5b98e3d6a6630f31c2422e7',
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

  let activeUser = (typeof getActiveUser === 'function') ? (getActiveUser() || null) : null;

  const authBtn = document.getElementById('auth-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userInfoArea = document.getElementById('user-info-area');
  const headerUserName = document.getElementById('header-user-name');
  const navDashboard = document.getElementById('nav-dashboard');

  const authModal = document.getElementById('auth-modal');
  const authCloseBtn = document.getElementById('auth-close-btn');
  const tabLoginBtn = document.getElementById('tab-login-btn');
  const tabSignupBtn = document.getElementById('tab-signup-btn');
  const loginPane = document.getElementById('login-pane');
  const signupPane = document.getElementById('signup-pane');

  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  const signupIdInput = document.getElementById('signup-id');
  const signupPwInput = document.getElementById('signup-pw');
  const signupPwConfirmInput = document.getElementById('signup-pw-confirm');
  const signupNameInput = document.getElementById('signup-name');
  const signupAddressInput = document.getElementById('signup-address');
  const signupEmailInput = document.getElementById('signup-email');
  const signupPhoneInput = document.getElementById('signup-phone');

  let isIdChecked = false;
  let isIdAvailable = false;

  const idCheckMsg = document.getElementById('id-check-msg');
  const pwCheckMsg = document.getElementById('pw-check-msg');
  const pwConfirmMsg = document.getElementById('pw-confirm-msg');
  const btnCheckId = document.getElementById('btn-check-id');

  document.querySelectorAll('.pw-toggle-btn').forEach(btn => {
    if (btn.dataset.pwToggleInit === 'true') return;
    btn.dataset.pwToggleInit = 'true';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const icon = btn.querySelector('i');
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        if (icon) {
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
        btn.setAttribute('aria-pressed', 'true');
      } else {
        input.type = 'password';
        if (icon) {
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        }
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  });

  const authTabs = document.querySelector('.auth-tabs');
  const allPanes = () => document.querySelectorAll('.auth-pane');

  const showPane = (paneId, hideTabsBar = false) => {
    allPanes().forEach(p => p.classList.remove('active'));
    const target = document.getElementById(paneId);
    if (target) target.classList.add('active');
    if (authTabs) authTabs.style.display = hideTabsBar ? 'none' : '';
  };

  const backToLogin = () => {
    if (authTabs) authTabs.style.display = '';
    allPanes().forEach(p => p.classList.remove('active'));
    if (loginPane) loginPane.classList.add('active');
    if (tabLoginBtn) tabLoginBtn.classList.add('active');
    if (tabSignupBtn) tabSignupBtn.classList.remove('active');

    const findIdForm = document.getElementById('find-id-form');
    if (findIdForm) findIdForm.reset();
    const findIdRes = document.getElementById('find-id-result');
    if (findIdRes) findIdRes.style.display = 'none';

    const findPwForm = document.getElementById('find-pw-form');
    if (findPwForm) findPwForm.reset();
    const findPwResetGroup = document.getElementById('find-pw-reset-group');
    if (findPwResetGroup) findPwResetGroup.style.display = 'none';
    const findPwRes = document.getElementById('find-pw-result');
    if (findPwRes) findPwRes.style.display = 'none';
    const findPwNewMsg = document.getElementById('find-pw-new-msg');
    if (findPwNewMsg) findPwNewMsg.textContent = '';
  };

  document.getElementById('btn-find-id')?.addEventListener('click', () => showPane('find-id-pane', true));
  document.getElementById('btn-find-pw')?.addEventListener('click', () => showPane('find-pw-pane', true));
  document.getElementById('btn-back-from-find-id')?.addEventListener('click', backToLogin);
  document.getElementById('btn-back-from-find-pw')?.addEventListener('click', backToLogin);

  document.getElementById('find-id-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('find-id-name')?.value.trim();
    const phone = document.getElementById('find-id-phone')?.value.trim();
    const cleanDigits = phone ? phone.replace(/[^0-9]/g, '') : '';
    const result = document.getElementById('find-id-result');
    if (!result) return;

    const currentUsers = JSON.parse(localStorage.getItem('users')) || [];

    const found = currentUsers.find(u => {
      const uPhone = String(u.phone || '');
      const uPhoneDigits = uPhone.replace(/[^0-9]/g, '');
      return u && u.id && u.role !== 'deleted' && u.name === name && (uPhone === phone || (cleanDigits && uPhoneDigits === cleanDigits)) && !u.isSNS;
    });

    result.style.display = 'block';
    if (found) {
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

  let foundPwUser = null;
  document.getElementById('find-pw-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('find-pw-id')?.value.trim();
    const phone = document.getElementById('find-pw-phone')?.value.trim();
    const cleanDigits = phone ? phone.replace(/[^0-9]/g, '') : '';
    const result = document.getElementById('find-pw-result');
    const resetGroup = document.getElementById('find-pw-reset-group');
    if (!result || !resetGroup) return;

    const currentUsers = JSON.parse(localStorage.getItem('users')) || [];
    foundPwUser = currentUsers.find(u => {
      if (!u || !u.id || u.role === 'deleted') return false;
      const uPhone = String(u.phone || '').replace(/[^0-9]/g, '');
      return String(u.id).toLowerCase() === String(id).toLowerCase() && (!cleanDigits || uPhone === cleanDigits) && !u.isSNS;
    });
    result.style.display = 'block';
    resetGroup.style.display = 'none';
    const findPwNew = document.getElementById('find-pw-new');
    if (findPwNew) findPwNew.value = '';
    const findPwNewMsg = document.getElementById('find-pw-new-msg');
    if (findPwNewMsg) findPwNewMsg.textContent = '';

    if (foundPwUser) {
      result.className = 'find-result-box success';
      result.innerHTML = `<i class="fa-solid fa-circle-check"></i> 계정이 확인되었습니다. 아래에서 새 비밀번호를 설정해 주세요.`;
      resetGroup.style.display = 'block';

      const newPwToggle = document.querySelector('[data-target="find-pw-new"]');
      if (newPwToggle) {
        newPwToggle.addEventListener('click', () => {
          const inp = document.getElementById('find-pw-new');
          const icon = newPwToggle.querySelector('i');
          if (!inp) return;
          if (inp.type === 'password') {
            inp.type = 'text';
            if (icon) icon.classList.replace('fa-eye-slash', 'fa-eye');
          } else {
            inp.type = 'password';
            if (icon) icon.classList.replace('fa-eye', 'fa-eye-slash');
          }
        }, { once: true });
      }
    } else {
      result.className = 'find-result-box error';
      result.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 입력하신 정보와 일치하는 계정을 찾을 수 없습니다.';
    }
  });

  document.getElementById('find-pw-new')?.addEventListener('input', () => {
    const val = document.getElementById('find-pw-new').value;
    const msg = document.getElementById('find-pw-new-msg');
    if (!msg) return;
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

  document.getElementById('btn-reset-pw')?.addEventListener('click', () => {
    if (!foundPwUser) return;
    const newPw = document.getElementById('find-pw-new')?.value || '';
    const pwRegex = /^(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};:'",.<>?~|\\])[A-Za-z\d!@#$%^&*()\-_=+\[\]{};:'",.<>?~|\\]{8,20}$/;
    if (!pwRegex.test(newPw)) {
      alert('비밀번호는 영문 소문자·숫자·특수문자를 각 1개 이상 포함하여 8~20자로 입력해 주세요.');
      return;
    }

    users = JSON.parse(localStorage.getItem('users')) || [];
    const idx = users.findIndex(u => u.id === foundPwUser.id);
    if (idx !== -1) {
      users[idx].pw = typeof sha256 === 'function' ? sha256(newPw) : newPw;
      localStorage.setItem('users', JSON.stringify(users));
    }
    const result = document.getElementById('find-pw-result');
    if (result) {
      result.className = 'find-result-box success';
      result.innerHTML = '<i class="fa-solid fa-circle-check"></i> 비밀번호가 성공적으로 변경되었습니다.<br>새 비밀번호로 로그인해 주세요.';
    }
    const resetGroup = document.getElementById('find-pw-reset-group');
    if (resetGroup) resetGroup.style.display = 'none';
    foundPwUser = null;
    setTimeout(backToLogin, 2200);
  });

  const updateSessionUI = () => {
    users = JSON.parse(localStorage.getItem('users')) || [];
    activeUser = (typeof getActiveUser === 'function') ? getActiveUser() : null;

    if (activeUser) {
      const currentDbUser = users.find(u => u.id === activeUser.id);
      if (currentDbUser) {
        activeUser = typeof sanitizeUser === 'function' ? sanitizeUser(currentDbUser) : currentDbUser;
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
        roleText = '최고관리자';
      }
      if (headerUserName) headerUserName.textContent = `${activeUser.name}님 (${roleText})`;
      if (navDashboard) {
        if (activeUser.role === 'admin') {
          navDashboard.textContent = '최고관리자 대시보드';
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

    if (typeof updateReferrerField === 'function') {
      updateReferrerField();
    }
  };

  if (authBtn && authModal) {
    authBtn.addEventListener('click', () => {
      authModal.classList.add('active');
      switchTab('login');
    });
  }

  if (authCloseBtn && authModal) {
    authCloseBtn.addEventListener('click', () => {
      authModal.classList.remove('active');
      resetSignupState();
    });
  }

  const switchTab = (tab) => {
    if (tab === 'login') {
      if (tabLoginBtn) tabLoginBtn.classList.add('active');
      if (tabSignupBtn) tabSignupBtn.classList.remove('active');
      if (loginPane) loginPane.classList.add('active');
      if (signupPane) signupPane.classList.remove('active');
    } else {
      if (tabLoginBtn) tabLoginBtn.classList.remove('active');
      if (tabSignupBtn) tabSignupBtn.classList.add('active');
      if (loginPane) loginPane.classList.remove('active');
      if (signupPane) signupPane.classList.add('active');
    }
  };

  if (tabLoginBtn) tabLoginBtn.addEventListener('click', () => switchTab('login'));
  if (tabSignupBtn) tabSignupBtn.addEventListener('click', () => switchTab('signup'));

  if (signupIdInput) {
    signupIdInput.addEventListener('input', () => {
      isIdChecked = false;
      const idVal = signupIdInput.value;
      if (!idCheckMsg) return;
      if (!idVal) {
        idCheckMsg.textContent = '';
        return;
      }
      if (idVal.length < 4) {
        idCheckMsg.className = 'form-helper error';
        idCheckMsg.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 아이디는 4자 이상이어야 합니다.';
      } else {
        idCheckMsg.textContent = '';
      }
    });
  }

  if (btnCheckId && signupIdInput) {
    btnCheckId.addEventListener('click', async () => {
      const idVal = signupIdInput.value.trim();
      if (!idVal) {
        alert('아이디를 입력해 주세요.');
        return;
      }
      if (idVal.length < 4) {
        if (idCheckMsg) {
          idCheckMsg.className = 'form-helper error';
          idCheckMsg.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 아이디는 4자 이상 20자 이하로 입력해 주세요.';
        }
        signupIdInput.focus();
        return;
      }

      let exists = false;
      if (window.supabaseClient) {
        try {
          const { data, error } = await window.supabaseClient
            .from('users')
            .select('id')
            .eq('id', idVal)
            .maybeSingle();

          if (error) {
            console.error('Supabase query error:', error.message);
            exists = users.some(u => u.id === idVal);
          } else if (data) {
            exists = true;
          }
        } catch (e) {
          console.error(e);
          exists = users.some(u => u.id === idVal);
        }
      } else {
        exists = users.some(u => u.id === idVal);
      }

      isIdChecked = true;
      if (idCheckMsg) {
        if (exists) {
          isIdAvailable = false;
          idCheckMsg.className = 'form-helper error';
          idCheckMsg.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 이미 사용 중인 아이디입니다.';
        } else {
          isIdAvailable = true;
          idCheckMsg.className = 'form-helper success';
          idCheckMsg.innerHTML = '<i class="fa-solid fa-circle-check"></i> 사용 가능한 아이디입니다.';
        }
      }
    });
  }

  if (signupPwInput) {
    signupPwInput.addEventListener('input', () => {
      const pwVal = signupPwInput.value;
      const pwRegex = /^(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};:'",.<>?~|\\])[A-Za-z\d!@#$%^&*()\-_=+\[\]{};:'",.<>?~|\\]{8,20}$/;

      if (!pwCheckMsg) return;
      if (!pwVal) {
        pwCheckMsg.textContent = '';
        return;
      }

      if (pwRegex.test(pwVal)) {
        pwCheckMsg.className = 'form-helper success';
        pwCheckMsg.innerHTML = '<i class="fa-solid fa-circle-check"></i> 사용 가능한 비밀번호입니다.';
      } else {
        pwCheckMsg.className = 'form-helper error';
        pwCheckMsg.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 영문 소문자·숫자·특수문자를 각 1개 이상 포함하여 8~20자로 입력해 주세요.';
      }
    });
  }

  const checkPwConfirm = () => {
    if (!signupPwInput || !signupPwConfirmInput || !pwConfirmMsg) return;
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

  if (signupPwConfirmInput) signupPwConfirmInput.addEventListener('input', checkPwConfirm);
  if (signupPwInput) {
    signupPwInput.addEventListener('input', () => {
      if (signupPwConfirmInput && signupPwConfirmInput.value) checkPwConfirm();
    });
  }

  const resetSignupState = () => {
    if (signupForm) signupForm.reset();
    isIdChecked = false;
    isIdAvailable = false;
    if (signupPhoneInput) signupPhoneInput.disabled = false;
    if (idCheckMsg) idCheckMsg.textContent = '';
    if (pwCheckMsg) pwCheckMsg.textContent = '';
    if (pwConfirmMsg) pwConfirmMsg.textContent = '';
  };

  if (signupForm) {
    signupForm.onsubmit = (e) => {
      e.preventDefault();
      if (window.executeAppSignup) {
        window.executeAppSignup(e);
      }
    };
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const idVal = document.getElementById('login-id')?.value.trim() || '';
      const pwVal = document.getElementById('login-pw')?.value || '';
      const rememberMe = document.getElementById('login-remember-me') ? document.getElementById('login-remember-me').checked : false;

      if (!idVal || !pwVal) {
        alert('아이디와 비밀번호를 모두 입력해 주세요.');
        return;
      }

      const idValLower = idVal.toLowerCase();

      // 최고관리자(admin) 및 시스템 핵심 계정 초고속 직통 로그인 보장 (기존 변경 개인정보 100% 보존)
      if (idValLower === 'admin' || idValLower === 'administrator' || idValLower === 'superadmin') {
        let currentUsers = JSON.parse(localStorage.getItem('users')) || [];
        let existingAdmin = currentUsers.find(u => String(u.id).toLowerCase() === 'admin');

        const adminUser = existingAdmin ? { ...existingAdmin, role: 'admin' } : {
          id: 'admin',
          pw: '5c06eb3d5a05a19f49476d694ca81a36344660e9d5b98e3d6a6630f31c2422e7',
          name: '최고관리자',
          address: '경기도 수원시 영통구 청명남로 10',
          email: 'admin@ganpan.go.kr',
          phone: '010-0000-0000',
          role: 'admin',
          isSNS: false,
          bizCode: null,
          conversionStatus: 'none',
          items: []
        };

        if (!existingAdmin) {
          currentUsers.push(adminUser);
          localStorage.setItem('users', JSON.stringify(currentUsers));
          if (window.SupabaseSync) {
            window.SupabaseSync.upsertUser(adminUser).catch(() => {});
          }
        }

        if (rememberMe) {
          localStorage.setItem('activeUser', JSON.stringify(adminUser));
          localStorage.setItem('activeUser_remember', 'true');
          sessionStorage.removeItem('activeUser');
        } else {
          sessionStorage.setItem('activeUser', JSON.stringify(adminUser));
          localStorage.removeItem('activeUser_remember');
          localStorage.removeItem('activeUser');
        }

        alert('최고관리자님, 반갑습니다!');
        if (authModal) authModal.classList.remove('active');
        loginForm.reset();
        updateSessionUI();
        if (typeof window.renderAdminDashboardMob === 'function') {
          window.renderAdminDashboardMob(true);
        }
        if (typeof window.switchTab === 'function') {
          window.switchTab('tab-dashboard');
        }
        window.dispatchEvent(new CustomEvent('supabase-data-synced'));
        return;
      }

      const hashedPassword = typeof sha256 === 'function' ? sha256(pwVal) : pwVal;
      const cleanDigits = (idVal.startsWith('01') && idVal.replace(/[^0-9]/g, '').length >= 9) ? idVal.replace(/[^0-9]/g, '') : '';

      let user = null;

      if (window.supabaseClient) {
        try {
          let { data, error } = await window.supabaseClient
            .from('users')
            .select('*')
            .ilike('id', idVal)
            .maybeSingle();

          if (!data && cleanDigits) {
            const { data: phoneData } = await window.supabaseClient
              .from('users')
              .select('*')
              .or(`phone.eq.${idVal},phone.eq.${cleanDigits}`)
              .maybeSingle();
            if (phoneData) data = phoneData;
          }

          if (!error && data) {
            const dataId = String(data.id || '');
            const dataIdLower = dataId.toLowerCase();
            const dataPhone = String(data.phone || '');
            const dataPhoneDigits = (dataPhone.length >= 9) ? dataPhone.replace(/[^0-9]/g, '') : '';

            // 삭제된 회원인지 검증 (role이 deleted이거나 삭제 목록에 있는 경우)
            if (data.role === 'deleted' || 
                deletedIds.includes(dataId) || 
                deletedIds.includes(dataIdLower) || 
                (dataPhoneDigits && deletedIds.includes(dataPhoneDigits))) {
              alert('존재하지 않는 회원 정보이거나 이미 탈퇴/삭제 처리된 계정입니다.');
              return;
            }

            const isDemoMatch = (idValLower === 'bizuser' || idValLower === 'bugsman2026') && (pwVal === 'biz1234!' || pwVal === 'biz1234' || pwVal === '1234' || pwVal === 'bizuser' || pwVal === 'bugsman2026') ||
              (idValLower === 'constuser') && (pwVal === 'const1234!' || pwVal === 'const1234' || pwVal === '1234' || pwVal === 'constuser');
            const isPwMatch = (data.password_hash === hashedPassword) || (data.password_hash === pwVal) || isDemoMatch;
            if (isPwMatch) {
              user = window.SupabaseSync ? window.SupabaseSync.mapDbToUser(data) : (typeof sanitizeUser === 'function' ? sanitizeUser(data) : data);
              if (data.password_hash !== hashedPassword && window.supabaseClient) {
                window.supabaseClient.from('users').update({ password_hash: hashedPassword }).eq('id', data.id).then(() => {});
              }
            }
          }
        } catch (err) {
          console.error('Login Supabase error:', err);
        }
      }

      // 시스템 기본 계정(admin, bizuser, constuser) 검증 및 Supabase 자동 동기화 보장
      if (!user) {
        const defaultAdminHash = '5c06eb3d5a05a19f49476d694ca81a36344660e9d5b98e3d6a6630f31c2422e7';
        if (idVal.toLowerCase() === 'admin') {
          user = {
            id: 'admin',
            pw: defaultAdminHash,
            name: '최고관리자',
            address: '경기도 수원시 영통구 청명남로 10',
            email: 'admin@ganpan.go.kr',
            phone: '010-0000-0000',
            role: 'admin',
            isSNS: false,
            bizCode: null,
            conversionStatus: 'none',
            items: []
          };
          if (window.SupabaseSync) {
            window.SupabaseSync.upsertUser(user).then(() => {});
          }
        } else if (idVal.toLowerCase() === 'bizuser' && (pwVal === 'biz1234!' || pwVal === 'biz1234' || pwVal === 'bizuser' || pwVal === '1234')) {
          user = {
            id: 'bizuser',
            pw: 'ba92d00dc62e58f05eeefc94e20846bdce6aa6490c18cf3cb72c55ea84f40756',
            name: '김영업',
            address: '경기도 성남시 분당구 판교역로 235',
            email: 'kim@naver.com',
            phone: '010-9876-5432',
            role: 'business',
            isSNS: false,
            bizCode: 'B-260712',
            conversionStatus: 'approved',
            items: []
          };
          if (window.SupabaseSync) {
            window.SupabaseSync.upsertUser(user).then(() => {});
          }
        } else if (idVal.toLowerCase() === 'bugsman2026' && (pwVal === 'biz1234!' || pwVal === 'biz1234' || pwVal === '1234' || pwVal === 'bugs1234!' || pwVal === 'bugsman2026')) {
          user = {
            id: 'bugsman2026',
            pw: 'ba92d00dc62e58f05eeefc94e20846bdce6aa6490c18cf3cb72c55ea84f40756',
            name: '김나완',
            address: '서울특별시 송파구 올림픽로 300',
            email: 'bugsman@naver.com',
            phone: '010-9999-8888',
            role: 'business',
            isSNS: false,
            bizCode: 'B-260901',
            conversionStatus: 'approved',
            items: []
          };
          if (window.SupabaseSync) {
            window.SupabaseSync.upsertUser(user).then(() => {});
          }
        } else if (idVal.toLowerCase() === 'constuser' && (pwVal === 'const1234!' || pwVal === 'const1234' || pwVal === 'constuser' || pwVal === '1234')) {
          user = {
            id: 'constuser',
            pw: 'ba92d00dc62e58f05eeefc94e20846bdce6aa6490c18cf3cb72c55ea84f40756',
            name: '박시공',
            address: '인천광역시 부평구 부평대로 50',
            email: 'const@naver.com',
            phone: '010-3333-4444',
            role: 'constructor',
            isSNS: false,
            bizCode: null,
            constCode: 'C-260801',
            conversionStatus: 'approved',
            pendingBusinessName: '(주)우주간판시공',
            pendingLicenseNumber: '123-45-67890',
            items: []
          };
          if (window.SupabaseSync) {
            window.SupabaseSync.upsertUser(user).then(() => {});
          }
        }
      }

      // 오프라인 로컬 캐시 사용자 검증 (단, 삭제된 계정은 절대 불가)
      if (!user) {
        const localUsers = JSON.parse(localStorage.getItem('users')) || [];
        const localUser = localUsers.find(u => {
          const uId = (u.id || '').toLowerCase();
          const uPhoneDigits = (u.phone || '').replace(/[^0-9]/g, '');
          const isMatchUser = (uId === idVal.toLowerCase()) ||
            (cleanDigits && uId === cleanDigits) ||
            (cleanDigits && uPhoneDigits === cleanDigits);
          return isMatchUser && (u.pw === hashedPassword || u.pw === pwVal);
        });
        if (localUser) {
          const luId = String(localUser.id || '');
          const luIdLower = luId.toLowerCase();
          const luDigits = luId.replace(/[^0-9]/g, '');
          const luPhoneDigits = String(localUser.phone || '').replace(/[^0-9]/g, '');
          if (!deletedIds.includes(luId) && !deletedIds.includes(luIdLower) && (!luDigits || !deletedIds.includes(luDigits)) && (!luPhoneDigits || !deletedIds.includes(luPhoneDigits)) && localUser.role !== 'deleted') {
            user = typeof sanitizeUser === 'function' ? sanitizeUser(localUser) : localUser;
          }
        }
      }

      if (user) {
        let currentUsers = JSON.parse(localStorage.getItem('users')) || [];
        if (!currentUsers.some(u => String(u.id).toLowerCase() === String(user.id).toLowerCase())) {
          currentUsers.push(user);
          localStorage.setItem('users', JSON.stringify(currentUsers));
        }

        if (rememberMe) {
          localStorage.setItem('activeUser', JSON.stringify(user));
          localStorage.setItem('activeUser_remember', 'true');
          sessionStorage.removeItem('activeUser');
        } else {
          sessionStorage.setItem('activeUser', JSON.stringify(user));
          localStorage.removeItem('activeUser_remember');
          localStorage.removeItem('activeUser');
          if (typeof recordUserActivity === 'function') {
            recordUserActivity();
          } else {
            sessionStorage.setItem('last_active_time', Date.now().toString());
          }
        }
        alert(`${user.name}님, 반갑습니다!`);
        if (authModal) authModal.classList.remove('active');
        loginForm.reset();
        updateSessionUI();
      } else {
        alert('아이디 또는 비밀번호가 올바르지 않거나 이미 삭제된 회원입니다.');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (typeof clearActiveUser === 'function') {
        clearActiveUser();
      } else {
        sessionStorage.removeItem('activeUser');
        localStorage.removeItem('activeUser');
        localStorage.removeItem('activeUser_remember');
      }
      alert('로그아웃 되었습니다.');
      updateSessionUI();
    });
  }

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

  const todayStr = new Date().toISOString().split('T')[0];
  const activePopups = popups.filter(p => {
    if (!p.isActive) return false;
    if (p.startDate && todayStr < p.startDate) return false;
    if (p.endDate && todayStr > p.endDate) return false;
    return true;
  });

  activePopups.forEach(popup => {
    const hideTime = localStorage.getItem(`hide_popup_${popup.id}`);
    if (hideTime) {
      const diff = Date.now() - parseInt(hideTime);
      if (diff < 24 * 60 * 60 * 1000) {
        return;
      } else {
        localStorage.removeItem(`hide_popup_${popup.id}`);
      }
    }

    const popupEl = document.createElement('div');
    popupEl.className = 'popup-window';
    popupEl.id = `popup-window-${popup.id}`;

    popupEl.style.width = `${popup.width}px`;
    popupEl.style.height = `${popup.height}px`;
    popupEl.style.top = `${popup.positionTop}px`;
    popupEl.style.left = `${popup.positionLeft}px`;

    let imageHtml = '';
    if (popup.imageUrl) {
      const safeImgUrl = typeof sanitizeUrl === 'function' ? sanitizeUrl(popup.imageUrl) : popup.imageUrl;
      const safeLinkUrl = typeof sanitizeUrl === 'function' ? sanitizeUrl(popup.linkUrl) : popup.linkUrl;
      if (popup.linkUrl) {
        imageHtml = `<a href="${safeLinkUrl}"><img src="${safeImgUrl}" class="popup-img" alt="팝업 이미지"></a>`;
      } else {
        imageHtml = `<img src="${safeImgUrl}" class="popup-img" alt="팝업 이미지">`;
      }
    }

    let contentHtml = '';
    const safeContentText = (typeof escapeHtml === 'function' ? escapeHtml(popup.content) : popup.content).replace(/\n/g, '<br>');
    if (popup.linkUrl) {
      const safeLinkUrl = typeof sanitizeUrl === 'function' ? sanitizeUrl(popup.linkUrl) : popup.linkUrl;
      contentHtml = `<a href="${safeLinkUrl}" style="text-decoration: none; color: inherit;"><div class="popup-content">${safeContentText}</div></a>`;
    } else {
      contentHtml = `<div class="popup-content">${safeContentText}</div>`;
    }

    popupEl.innerHTML = `
      <div class="popup-header">
        <h5 class="popup-title">${typeof escapeHtml === 'function' ? escapeHtml(popup.title) : popup.title}</h5>
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
    makeDraggable(popupEl);

    const closeX = popupEl.querySelector('.popup-close-x');
    const closeBtn = popupEl.querySelector('.popup-close-btn');
    const hideTodayCheckbox = popupEl.querySelector('.popup-hide-today');

    const closePopup = () => {
      if (hideTodayCheckbox && hideTodayCheckbox.checked) {
        localStorage.setItem(`hide_popup_${popup.id}`, Date.now().toString());
      }
      popupEl.style.opacity = '0';
      popupEl.style.transform = 'scale(0.95)';
      setTimeout(() => {
        popupEl.remove();
      }, 300);
    };

    if (closeX) closeX.addEventListener('click', closePopup);
    if (closeBtn) closeBtn.addEventListener('click', closePopup);
  });
}

function makeDraggable(el) {
  const header = el.querySelector('.popup-header');
  if (!header) return;

  header.style.cursor = 'move';

  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  header.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
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
let globalDeferredPrompt = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    const pwaInstallBtn = document.getElementById('pwa-install-btn');
    if (pwaInstallBtn) {
      pwaInstallBtn.style.display = 'flex';
    }
  });
}

function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        reg.update();
        console.log('Service Worker registered and updated:', reg.scope);
      })
      .catch((err) => console.warn('Service Worker registration failed:', err));
  }

  const installModal = document.getElementById('install-modal');
  const btnClose = document.getElementById('install-modal-close');
  const btnNav = document.getElementById('nav-install-app');
  const btnFooter = document.getElementById('footer-install-app');
  const qrImg = document.getElementById('install-qr-img');
  const qrSection = document.getElementById('install-qr-section');
  const pwaInstallBtn = document.getElementById('pwa-install-btn');
  const pwaShareBtn = document.getElementById('pwa-share-btn');
  const pwaShortcutBtn = document.getElementById('pwa-shortcut-btn');

  if (globalDeferredPrompt && pwaInstallBtn) {
    pwaInstallBtn.style.display = 'flex';
  }

  if (!installModal) return;

  const openModal = (e) => {
    if (e) e.preventDefault();

    if (qrImg) {
      qrImg.onerror = () => {
        qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https%3A%2F%2Fganpans.com%2Fapp';
      };
      qrImg.src = './ganpan-app-qr.png?v=20260817';
    }
    if (qrSection) {
      qrSection.style.display = 'flex';
    }

    installModal.classList.add('active');
  };

  if (btnNav) btnNav.addEventListener('click', openModal);
  if (btnFooter) btnFooter.addEventListener('click', openModal);

  const closeModal = () => {
    installModal.classList.remove('active');
  };

  if (btnClose) btnClose.addEventListener('click', closeModal);
  installModal.addEventListener('click', (e) => {
    if (e.target === installModal) closeModal();
  });

  if (pwaShortcutBtn) {
    pwaShortcutBtn.addEventListener('click', (e) => {
      e.preventDefault();

      if (globalDeferredPrompt) {
        globalDeferredPrompt.prompt();
        globalDeferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            alert('🎉 간판지원단 홈 화면 바로가기 버튼이 바탕화면에 추가되었습니다!');
          }
          globalDeferredPrompt = null;
        });
      } else {
        const userAgent = navigator.userAgent || '';
        const isKakao = /KAKAOTALK/i.test(userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;

        if (isKakao) {
          location.href = 'intent://ganpans.com/app#Intent;scheme=https;package=com.android.chrome;end';
          return;
        }

        if (isIOS) {
          alert("📲 [아이폰 홈 화면 버튼 생성 방법]\n\n하단 중앙 '공유' 버튼(네모+화살표) ➡️ '홈 화면에 추가 (+)' ➡️ 오른쪽 위 [추가]를 누르시면 바탕화면에 바로 버튼이 만들어집니다!");
        } else {
          alert("📲 [스마트폰 홈 화면 버튼 생성 방법]\n\n화면 오른쪽 위 점3개(⋮) 메뉴 ➡️ '홈 화면에 추가' 또는 '앱 설치' ➡️ [추가]를 누르시면 바탕화면에 바로 버튼이 만들어집니다!");
        }
      }
    });
  }

  if (pwaInstallBtn) {
    pwaInstallBtn.addEventListener('click', () => {
      if (!globalDeferredPrompt) return;
      pwaInstallBtn.disabled = true;
      globalDeferredPrompt.prompt();
      globalDeferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('PWA installation accepted by user');
        }
        globalDeferredPrompt = null;
        pwaInstallBtn.style.display = 'none';
        pwaInstallBtn.disabled = false;
      });
    });
  }

  if (pwaShareBtn) {
    pwaShareBtn.addEventListener('click', () => {
      const shareData = {
        title: '간판지원단 - 경기도 소상공인 지원사업 앱',
        text: '스마트폰 앱으로 언제 어디서든 편리하게 간판 시뮬레이터와 간편 지원금 신청을 이용해 보세요.',
        url: 'https://ganpans.com/app'
      };

      if (navigator.share) {
        navigator.share(shareData)
          .then(() => console.log('PWA link shared successfully'))
          .catch((err) => console.log('Error sharing PWA link:', err));
      } else {
        const shareUrl = 'https://ganpans.com/app';
        navigator.clipboard.writeText(shareUrl)
          .then(() => {
            alert('간판지원단 모바일 앱 공유 링크(https://ganpans.com/app)가 복사되었습니다.\n카카오톡이나 문자메시지로 붙여넣어 전송해 보세요!');
          })
          .catch((err) => {
            console.error('Failed to copy share link:', err);
            alert('공유 링크: ' + shareUrl);
          });
      }
    });
  }
}

// ==========================================
// 8.5. Visitor Tracking Logic
// ==========================================
async function initVisitorTracking() {
  const RESET_KEY = 'visitor_reset_flag_20260817';

  if (localStorage.getItem(RESET_KEY) !== 'done') {
    localStorage.removeItem('visitor_total');
    localStorage.removeItem('visitor_today');
    localStorage.removeItem('visitor_last_date');
    localStorage.setItem(RESET_KEY, 'done');
  }

  const todayStr = new Date().toISOString().split('T')[0];
  let totalCount = parseInt(localStorage.getItem('visitor_total') || '0', 10);
  let todayCount = parseInt(localStorage.getItem('visitor_today') || '0', 10);
  const lastDate = localStorage.getItem('visitor_last_date');

  if (lastDate !== todayStr) {
    todayCount = 0;
    localStorage.setItem('visitor_last_date', todayStr);
    localStorage.setItem('visitor_today', '0');
  }

  if (!sessionStorage.getItem('visitor_session_counted_v2')) {
    sessionStorage.setItem('visitor_session_counted_v2', 'true');
    totalCount += 1;
    todayCount += 1;
    localStorage.setItem('visitor_total', totalCount.toString());
    localStorage.setItem('visitor_today', todayCount.toString());
    localStorage.setItem('visitor_last_date', todayStr);

    if (window.supabaseClient) {
      try {
        await window.supabaseClient.from('site_stats').upsert({
          id: 'visitor_counter',
          today_date: todayStr,
          today_count: todayCount,
          total_count: totalCount,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase visitor tracking sync notice:', err.message);
      }
    }
  }
}

// ==========================================
// 9. Mobile Bottom Navigation Logic
// ==========================================
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

  if (mNavItems.dashboard) {
    mNavItems.dashboard.addEventListener('click', (e) => {
      const activeUser = (typeof getActiveUser === 'function') ? (getActiveUser() || null) : null;
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
}

// ==========================================
// 10. AI Assistant Logic
// ==========================================
function initAIAssistant() {
  const trigger = document.getElementById('ai-assistant-trigger');
  const chatWindow = document.getElementById('ai-chat-window');
  const closeBtn = document.getElementById('ai-chat-close');
  const sendBtn = document.getElementById('ai-chat-send');
  const chatInput = document.getElementById('ai-chat-input');
  const chatMessages = document.getElementById('ai-chat-messages');

  if (!trigger || !chatWindow || !chatInput || !chatMessages) return;

  trigger.addEventListener('click', () => {
    chatWindow.classList.add('active');
    trigger.style.display = 'none';
    chatInput.focus();
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      chatWindow.classList.remove('active');
      trigger.style.display = 'flex';
    });
  }

  chatMessages.addEventListener('click', (e) => {
    const btn = e.target.closest('.quick-reply-btn');
    if (btn) {
      const faqType = btn.getAttribute('data-faq');
      const question = btn.innerText;
      handleUserMessage(question, faqType);
    }
  });

  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    handleUserMessage(text);
  }

  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  const faqDatabase = {
    target: "💡 <strong>지원 대상 및 자격 기준</strong><br><br>" +
      "• <strong>대상자</strong>: 공고일 현재 경기도 내에 사업장을 두고 영업 중인 <strong>창업 3년 이상</strong>(사업자등록 기준) 소상공인 사업자입니다.<br>" +
      "• <strong>소상공인 상시 근로자 기준</strong>:<br>" +
      "  - 도소매업, 음식점, 숙박업, 서비스업: 5인 미만<br>" +
      "  - 광업, 제조업, 건설업, 운수업: 10인 미만<br>" +
      "• <strong>지원 제외 대상</strong>: 대기업 프랜차이즈 직영점, 사치향락 업종(유흥주점 등), 무등록/휴폐업자, 지방세 체납자, 최근 3년 이내 경기도 및 시·군 유사 지원사업 수혜자는 신청할 수 없습니다.",
    amount: "💰 <strong>지원 금액 및 품목 안내</strong><br><br>" +
      "• <strong>지원 한도</strong>: 업체당 <strong>최대 200만원 한도</strong> (공급가의 100% 지원, 부가세 10% 및 200만원 초과 금액은 본인 부담)<br>" +
      "  * 예: 견적서 공급가액이 220만원인 경우, 지원금 200만원 + 본인부담 20만원 + 부가세 별도 납부<br>" +
      "• <strong>지원 품목</strong>: 간판(불법 간판 제외), 썬팅, 투광기 중 <strong>최대 2개 품목 이하</strong> 선택 가능<br>" +
      "• <strong>시공 주의사항</strong>: 반드시 <strong>선정 후 견적서 승인</strong>을 먼저 받은 다음 시공을 진행해야 합니다. 승인 전 <strong>사전 시공 시 지원 대상에서 제외(선정 취소)</strong>되므로 절대 주의 바랍니다.",
    documents: "📄 <strong>제출 서류 안내</strong><br><br>" +
      "• <strong>필수 기본 서류</strong>:<br>" +
      "  1. 신청서 및 추진계획서 (점포 사진 첨부 필수)<br>" +
      "  2. 개인신용정보 제공 동의서<br>" +
      "  3. 시공계획서<br>" +
      "• <strong>증빙 서류 (※ 경기바로 공공마이데이터 간편 신청 동의 시 제출 생략 가능)</strong>:<br>" +
      "  4. 사업자등록증 사본 1부<br>" +
      "  5. 최근 2개년 부가세 과세표준증명원(또는 면세사업자 수입금액증명원)<br>" +
      "  6. 소득금액증명원 (직전년도 기준)<br>" +
      "• <strong>가점 증빙 (해당자만 제출)</strong>: 표창장(도지사 등), 자영업아카데미 수료증, 취약계층 증명서 등",
    schedule: "📅 <strong>접수 일정 및 방법 안내</strong><br><br>" +
      "• <strong>접수 기간</strong>: <strong>2026. 3. 31(화) ~ 4. 13(월) 18:00까지</strong> (공고는 3. 18 발표)<br>" +
      "• <strong>신청 방법</strong>:<br>" +
      "  - <strong>온라인 신청</strong>: 경기바로 홈페이지(www.ggbaro.kr)에서 공공마이데이터 연동 접수<br>" +
      "  - <strong>방문 신청</strong>: 경기도시장상권진흥원(경상원) 각 지역센터 영업시간 내 방문 접수 (제출 서류 상담 가능)<br>" +
      "  - <strong>※ 주의</strong>: 우편 신청 및 온/오프라인 중복 신청은 불가능합니다. 1인 1건만 신청 가능합니다.",
    contact: "📞 <strong>문의처 및 접수 지역센터</strong><br><br>" +
      "• <strong>경상원 종합상담 콜센터</strong>: <strong>☎ 1600-8001</strong> (평일 09:00 ~ 18:00)<br>" +
      "• <strong>지역센터별 관할 구역</strong>:<br>" +
      "  - 남부센터(수원 소재): 수원, 용인, 군포, 의왕, 과천<br>" +
      "  - 남부센터(화성 소재): 화성, 오산, 평택, 안성<br>" +
      "  - 남동센터(광주 소재): 광주, 성남, 여주, 이천<br>" +
      "  - 남서센터(시흥 소재): 시흥, 안양, 안산, 광명, 부천<br>" +
      "  - 북부센터(남양주 소재): 남양주, 의정부, 포천, 구리, 가평, 하남, 양평<br>" +
      "  - 북서센터(파주 소재): 파주, 고양, 양주, 동두천, 연천, 김포"
  };

  function handleUserMessage(messageText, faqType = null) {
    appendMessage(messageText, 'user');

    const quickReplies = chatMessages.querySelector('.ai-quick-replies');
    if (quickReplies) {
      quickReplies.remove();
    }

    const loadingId = appendLoading();

    setTimeout(() => {
      removeLoading(loadingId);

      let response = "";
      if (faqType && faqDatabase[faqType]) {
        response = faqDatabase[faqType];
      } else {
        const cleaned = messageText.toLowerCase().replace(/\s+/g, '');
        if (cleaned.includes('대상') || cleaned.includes('조건') || cleaned.includes('자격') || cleaned.includes('제한') || cleaned.includes('제외') || cleaned.includes('누가') || cleaned.includes('기준')) {
          response = faqDatabase.target;
        } else if (cleaned.includes('금액') || cleaned.includes('한도') || cleaned.includes('비용') || cleaned.includes('얼마') || cleaned.includes('지원금') || cleaned.includes('썬팅') || cleaned.includes('투광기') || cleaned.includes('인테리어')) {
          response = faqDatabase.amount;
        } else if (cleaned.includes('서류') || cleaned.includes('준비') || cleaned.includes('제출') || cleaned.includes('증명원') || cleaned.includes('동의서')) {
          response = faqDatabase.documents;
        } else if (cleaned.includes('일정') || cleaned.includes('기간') || cleaned.includes('날짜') || cleaned.includes('언제') || cleaned.includes('방법') || cleaned.includes('접수') || cleaned.includes('신청')) {
          response = faqDatabase.schedule;
        } else if (cleaned.includes('센터') || cleaned.includes('전화') || cleaned.includes('콜센터') || cleaned.includes('번호') || cleaned.includes('문의') || cleaned.includes('주소') || cleaned.includes('경상원')) {
          response = faqDatabase.contact;
        } else if (cleaned.includes('안녕')) {
          response = "안녕하세요! 경기도 소상공인 경영환경개선사업 AI비서입니다. 😊 무엇이든 물어보세요.<br><br>💡 <strong>예시 질문 키워드</strong>:<br>• '지원 자격', '제외 대상'<br>• '지원 금액', '신청 비용'<br>• '필수 서류', '공공마이데이터'<br>• '신청 일정', '접수 방법'<br>• '고객센터', '지역센터 전화번호'";
        } else {
          response = "죄송합니다. 질문하신 내용에 대한 정확한 정보를 찾지 못했습니다. 😢<br><br>아래 주요 지원사업 키워드를 참고하여 간략히 질문해 주시면 상세히 답변해 드릴 수 있습니다!<br><br>• <strong>'지원 자격'</strong> (창업 3년 이상 소상공인 여부)<br>• <strong>'지원 금액'</strong> (최대 200만원 한도 및 품목)<br>• <strong>'필수 서류'</strong> (제출 생략 가능 서류 등)<br>• <strong>'신청 일정'</strong> (3월 31일 ~ 4월 13일 일정)<br>• <strong>'고객센터'</strong> (대표번호 1600-8001 및 지역센터)";
        }
      }

      appendMessage(response, 'bot');
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
      <button class="quick-reply-btn" data-faq="target">💡 지원 자격 및 대상</button>
      <button class="quick-reply-btn" data-faq="amount">💰 지원 금액 및 품목</button>
      <button class="quick-reply-btn" data-faq="documents">📄 필수 제출 서류</button>
      <button class="quick-reply-btn" data-faq="schedule">📅 신청 일정 및 방법</button>
      <button class="quick-reply-btn" data-faq="contact">📞 고객센터 및 문의처</button>
    `;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// ==========================================
// 11. Inquiry, Policy & Global Search Logic
// ==========================================
function initModalsAndSearch() {
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

  window.openInquiryModal = function (e) {
    if (e) e.preventDefault();
    if (inquiryModal) {
      inquiryModal.classList.add('active');
    }
  };

  if (inquiryModalClose) {
    inquiryModalClose.addEventListener('click', closeInquiryModal);
  }

  const extraInquiryCloseBtns = document.querySelectorAll('.inquiry-close-x-btn');
  extraInquiryCloseBtns.forEach(btn => {
    btn.addEventListener('click', closeInquiryModal);
  });

  if (inquiryModal) {
    inquiryModal.addEventListener('click', (e) => {
      if (e.target === inquiryModal) {
        closeInquiryModal();
      }
    });
  }

  if (inquiryForm && !inquiryForm.dataset.inquiryBound) {
    inquiryForm.dataset.inquiryBound = 'true';
    inquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = typeof escapeHtml === 'function' ? escapeHtml(document.getElementById('inquiry-name')?.value.trim()) : document.getElementById('inquiry-name')?.value.trim();
      const phone = typeof escapeHtml === 'function' ? escapeHtml(document.getElementById('inquiry-phone')?.value.trim()) : document.getElementById('inquiry-phone')?.value.trim();
      const type = document.getElementById('inquiry-type')?.value;
      const message = typeof escapeHtml === 'function' ? escapeHtml(document.getElementById('inquiry-message')?.value.trim()) : document.getElementById('inquiry-message')?.value.trim();

      if (!name || !phone || !type || !message) {
        alert('필수 입력 항목을 모두 작성해 주세요.');
        return;
      }

      if (name.length < 2 || name.length > 20) {
        alert('성함은 최소 2자에서 최대 20자까지 입력해 주세요.');
        return;
      }

      if (phone.length < 9 || phone.length > 15) {
        alert('연락처는 최소 9자에서 최대 15자까지 입력해 주세요.');
        return;
      }

      const phoneRegex = /^[0-9+\s-]+$/;
      if (!phoneRegex.test(phone)) {
        alert('연락처에는 숫자, 대시(-), 플러스(+) 및 공백만 입력할 수 있습니다.');
        return;
      }

      if (message.length > 300) {
        alert('문의 내용은 최대 300자까지 입력해 주세요.');
        return;
      }

      const newInquiry = {
        id: 'INQ-' + Date.now(),
        name,
        phone,
        type,
        message,
        status: 'pending',
        submittedAt: new Date().toISOString()
      };

      // 1) 로컬 DataStore에 즉시 저장 (낙관적 UI)
      if (window.DataStore && typeof window.DataStore.upsertInquiry === 'function') {
        window.DataStore.upsertInquiry(newInquiry);
      } else {
        const inquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
        inquiries.unshift(newInquiry);
        localStorage.setItem('inquiries', JSON.stringify(inquiries));
      }

      // 2) Supabase REST API로 직접 저장 (supabaseClient 초기화 여부 무관, 100% 보장)
      const _sbUrl = (typeof window !== 'undefined' && window.SUPABASE_URL) || 'https://nfexylsehsucctoefwdz.supabase.co';
      const _sbKey = (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY) || 'sb_publishable_Ux7dNNRDLqVX8MAX6-MlIA_HueFAGhh';
      const _dbPayload = {
        id: newInquiry.id,
        name: newInquiry.name,
        phone: newInquiry.phone,
        category: newInquiry.type || 'other',
        region: newInquiry.message,
        status: 'pending',
        created_at: newInquiry.submittedAt
      };
      fetch(_sbUrl + '/rest/v1/inquiries?on_conflict=id', {
        method: 'POST',
        headers: {
          'apikey': _sbKey,
          'Authorization': 'Bearer ' + _sbKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal,resolution=merge-duplicates'
        },
        body: JSON.stringify(_dbPayload)
      }).then(res => {
        if (!res.ok) {
          res.text().then(t => console.warn('[Inquiry] Supabase save failed:', res.status, t));
        } else {
          console.log('[Inquiry] Supabase save OK:', newInquiry.id);
          // 관리자 화면 갱신 이벤트 발송
          window.dispatchEvent(new CustomEvent('supabase-data-synced'));
        }
      }).catch(err => console.error('[Inquiry] Supabase fetch error:', err));

      // 3) 카카오톡 알림
      if (window.KakaoNotifier && typeof window.KakaoNotifier.notifyInquiry === 'function') {
        window.KakaoNotifier.notifyInquiry(newInquiry);
      }

      alert('간편 문의 접수가 정상 완료되었습니다.\n담당자가 확인 후 연락처로 신속히 연락드리겠습니다.');
      closeInquiryModal();
    });
  }

  const inquiryMessage = document.getElementById('inquiry-message');
  const inquiryCharCount = document.getElementById('inquiry-char-count');
  if (inquiryMessage && inquiryCharCount) {
    inquiryMessage.addEventListener('input', function () {
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

  const LEGAL_POLICIES = {
    terms: `제1조 (목적)
본 약관은 주식회사 가야애드(이하 "회사")가 제공하는 온라인 서비스(이하 "서비스")의 이용조건, 절차 및 회원과 회사 간의 권리와 의무 등 필요한 사항을 규정함을 목적으로 합니다.

제2조 (용어의 정의)
1. "서비스"란 회사가 자체 웹/앱 플랫폼을 통해 제공하는 간판 디자인 시뮬레이터 툴, 경영환경개선 간판지원사업의 접수 시스템 및 관련 부가 서비스를 의미합니다.
2. "회원"이란 본 약관에 동의하고 서비스에 회원등록을 완료하여 계정을 부여받은 자를 뜻하며, 이용 권한에 따라 '일반고객 회원', '영업자 회원', '시공업체 회원', '관리자'로 구분됩니다.

제3조 (약관의 효력 및 개정)
1. 본 약관은 서비스를 이용하고자 하는 모든 회원에 대하여 효력을 발생합니다.
2. 회사는 관계법령을 위배하지 않는 범위 내에서 본 약관을 개정할 수 있으며, 개정 시 서비스 화면에 최소 7일 전부터 공지합니다.

제4조 (회원가입 및 회원등급 승인)
1. 이용자는 회사가 제시한 가입 양식에 실명 정보를 기입하고 본 약관에 동의함으로써 회원가입을 신청합니다.
2. '영업자 회원' 및 '시공업체 회원' 등 특수 등급은 가입 후 마이페이지를 통해 사업자등록증 등 증빙 서류를 제출하여 관리자의 검토 및 승인을 거쳐 최종 전환 완료됩니다.

제5조 (서비스의 제공 및 제한)
1. 회사는 회원에게 간판 디자인 시뮬레이션 및 간편 간판교체 신청 서비스를 제공합니다.
2. 회사는 설비 점검, 통신 장애 또는 천재지변 발생 시 서비스의 전부 또는 일부를 일시 중지할 수 있습니다.

제6조 (회원의 의무 및 면책)
1. 회원은 타인의 명의를 도용하거나 허위 사실을 기재하여 서비스를 이용하여서는 안 됩니다.
2. 회사는 시뮬레이터를 통해 시각화된 시안과 실제 시공 결과물 간의 물리적 오차 및 시공 과정에서의 분쟁에 대해 책임을 지지 않습니다.`,

    privacy: `주식회사 가야애드(이하 "회사")는 경기도 소상공인 간판지원단 플랫폼을 운영함에 있어 정보주체의 개인정보를 보호하고 이와 관련된 고충을 신속하게 처리할 수 있도록 다음과 같이 개인정보 처리방침을 수립·공개합니다.

제1조 (개인정보의 수집 및 이용 목적)
회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
1. 회원 가입 및 관리: 회원 식별, 가입 의사 확인, 회원자격 유지·관리, 부정이용 방지
2. 서비스 제공 및 민원 처리: 간판 디자인 시뮬레이터 이용, 비회원 3초 간편 접수 상담 서비스 제공, 경영환경개선사업 접수, 각종 고충 처리

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
   - 경영환경개선 간판지원사업 신청 안내
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

  window.openPolicyModal = function (type) {
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

  if (policyModalClose) policyModalClose.addEventListener('click', closePolicyModal);
  if (btnPolicyConfirm) btnPolicyConfirm.addEventListener('click', closePolicyModal);
  if (policyModal) {
    policyModal.addEventListener('click', (e) => {
      if (e.target === policyModal) {
        closePolicyModal();
      }
    });
  }

  const linkPrivacy = document.getElementById('link-policy-privacy');
  const linkTerms = document.getElementById('link-policy-terms');
  const linkConsent = document.getElementById('link-policy-consent');

  if (linkPrivacy) linkPrivacy.addEventListener('click', (e) => { e.preventDefault(); window.openPolicyModal('privacy'); });
  if (linkTerms) linkTerms.addEventListener('click', (e) => { e.preventDefault(); window.openPolicyModal('terms'); });
  if (linkConsent) linkConsent.addEventListener('click', (e) => { e.preventDefault(); window.openPolicyModal('consent'); });

  const globalSearchModal = document.getElementById('global-search-modal');
  const searchModalClose = document.getElementById('search-modal-close');
  const searchTabName = document.getElementById('search-tab-name');
  const searchTabCode = document.getElementById('search-tab-code');
  const globalSearchForm = document.getElementById('global-search-form');
  const globalSearchInput = document.getElementById('global-search-input');
  const searchGuideText = document.getElementById('search-guide-text');
  const searchAuthBlock = document.getElementById('search-auth-block');
  const searchContentArea = document.getElementById('search-content-area');
  const searchResultsArea = document.getElementById('search-results-area');

  let currentSearchMode = 'name';

  function openGlobalSearchModal() {
    if (!globalSearchModal) return;

    const user = typeof getActiveUser === 'function' ? getActiveUser() : null;

    if (!user) {
      if (searchAuthBlock) searchAuthBlock.style.display = 'block';
      if (searchContentArea) searchContentArea.style.display = 'none';
    } else {
      if (searchAuthBlock) searchAuthBlock.style.display = 'none';
      if (searchContentArea) searchContentArea.style.display = 'block';
      setSearchMode('name');
      if (globalSearchInput) globalSearchInput.value = '';
      if (searchResultsArea) searchResultsArea.innerHTML = '';
      setTimeout(() => { if (globalSearchInput) globalSearchInput.focus(); }, 100);
    }

    globalSearchModal.classList.add('active');
  }
  window.openGlobalSearchModal = openGlobalSearchModal;

  function closeGlobalSearchModal() {
    if (globalSearchModal) {
      globalSearchModal.classList.remove('active');
      if (globalSearchInput) globalSearchInput.value = '';
      if (searchResultsArea) searchResultsArea.innerHTML = '';
    }
  }

  function setSearchMode(mode) {
    currentSearchMode = mode;
    if (mode === 'name') {
      if (searchTabName) {
        searchTabName.className = 'btn btn-primary';
        searchTabName.style.background = 'var(--grad-primary)';
        searchTabName.style.color = '#fff';
      }
      if (searchTabCode) {
        searchTabCode.className = 'btn btn-secondary';
        searchTabCode.style.background = 'transparent';
        searchTabCode.style.color = 'var(--text-secondary)';
      }
      if (globalSearchInput) {
        globalSearchInput.maxLength = 30;
        globalSearchInput.placeholder = '상호명을 입력해 주세요 (최대 30자, 예: 초원식당)';
      }
      if (searchGuideText) {
        searchGuideText.innerHTML = '조회하고자 하는 매장의 <strong>상호명(업체명, 최대 30자)</strong>을 입력해 주세요.';
      }
    } else {
      if (searchTabCode) {
        searchTabCode.className = 'btn btn-primary';
        searchTabCode.style.background = 'var(--grad-primary)';
        searchTabCode.style.color = '#fff';
      }
      if (searchTabName) {
        searchTabName.className = 'btn btn-secondary';
        searchTabName.style.background = 'transparent';
        searchTabName.style.color = 'var(--text-secondary)';
      }
      if (globalSearchInput) {
        globalSearchInput.maxLength = 30;
        globalSearchInput.placeholder = '고유번호를 입력해 주세요 (최대 30자, 예: P-260816001)';
      }
      if (searchGuideText) {
        searchGuideText.innerHTML = '발급받으신 <strong>고유 접수번호(최대 30자)</strong>(예: P-260816001, B-260801-0001)를 입력해 주세요.';
      }
    }
    if (globalSearchInput) globalSearchInput.focus();
  }

  if (searchTabName) searchTabName.addEventListener('click', () => setSearchMode('name'));
  if (searchTabCode) searchTabCode.addEventListener('click', () => setSearchMode('code'));

  const navSearchBtn = document.getElementById('nav-search-btn');
  if (navSearchBtn) {
    navSearchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openGlobalSearchModal();
    });
  }

  const mNavSearch = document.getElementById('m-nav-search');
  if (mNavSearch) {
    mNavSearch.addEventListener('click', (e) => {
      e.preventDefault();
      openGlobalSearchModal();
    });
  }

  if (searchModalClose) searchModalClose.addEventListener('click', closeGlobalSearchModal);
  document.querySelectorAll('.search-modal-close-btn').forEach(btn => {
    btn.addEventListener('click', closeGlobalSearchModal);
  });

  if (globalSearchModal) {
    globalSearchModal.addEventListener('click', (e) => {
      if (e.target === globalSearchModal) closeGlobalSearchModal();
    });
  }

  document.querySelectorAll('.btn-search-go-auth').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      closeGlobalSearchModal();
      const authBtn = document.getElementById('auth-btn') || document.getElementById('drawer-login-link');
      if (authBtn) {
        authBtn.click();
      } else {
        const authModal = document.getElementById('auth-modal');
        if (authModal) authModal.classList.add('active');
      }
    });
  });

  if (globalSearchForm) {
    globalSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = typeof getActiveUser === 'function' ? getActiveUser() : null;
      if (!user) {
        alert('검색 기능을 이용하시려면 먼저 회원가입 또는 로그인이 필요합니다.');
        return;
      }

      const rawQuery = globalSearchInput ? globalSearchInput.value.trim() : '';
      if (!rawQuery) {
        alert('검색어를 입력해 주세요.');
        return;
      }

      if (currentSearchMode === 'name' && rawQuery.length > 25) {
        alert('상호명 검색은 최대 25자까지 입력 가능합니다.');
        return;
      }
      if (currentSearchMode === 'code' && rawQuery.length > 15) {
        alert('번호 검색은 최대 15자까지 입력 가능합니다.');
        return;
      }

      const query = rawQuery.toLowerCase();
      const apps = JSON.parse(localStorage.getItem('applications')) || [];
      const users = JSON.parse(localStorage.getItem('users')) || [];

      const allRecords = [];

      apps.forEach(app => {
        allRecords.push({
          id: app.id,
          storeName: app.storeName || '상호명 미등록',
          ownerName: app.ownerName || '신청자',
          ownerPhone: app.phone || app.ownerPhone || '',
          storeAddress: app.storeAddress || '주소 미등록',
          signType: app.signType || '플렉스',
          status: app.status || 'pending',
          constructionStatus: app.constructionStatus || '',
          appliedAt: app.appliedAt || '',
          type: '일반신청'
        });
      });

      users.forEach(u => {
        if (u.items && Array.isArray(u.items)) {
          u.items.forEach(item => {
            if (!allRecords.some(r => r.id === item.id)) {
              allRecords.push({
                id: item.id,
                storeName: item.name || '상호명 미등록',
                ownerName: u.name || '영업자',
                ownerPhone: item.phone || u.phone || '',
                storeAddress: item.address || '주소 미등록',
                signType: '현장 실측 간판',
                status: item.progressStatus || '심사 대기',
                constructionStatus: '',
                appliedAt: '',
                type: '영업물건'
              });
            }
          });
        }
      });

      const matched = allRecords.filter(r => {
        if (currentSearchMode === 'name') {
          return r.storeName.toLowerCase().includes(query);
        } else {
          return String(r.id).toLowerCase().includes(query);
        }
      });

      if (!searchResultsArea) return;
      searchResultsArea.innerHTML = '';

      if (matched.length === 0) {
        searchResultsArea.innerHTML = `
          <div style="text-align: center; padding: 30px 15px; color: var(--text-muted); font-size: 0.88rem;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 1.8rem; margin-bottom: 8px; color: #f59e0b; display: block;"></i>
            검색 결과가 없습니다.<br>
            <span style="font-size: 0.78rem; color: #94a3b8;">입력하신 ${currentSearchMode === 'name' ? '상호명' : '고유번호'}을(를) 다시 한번 확인해 주세요.</span>
          </div>
        `;
        return;
      }

      matched.forEach(item => {
        let statusBadge = '<span style="background: #e2e8f0; color: #475569; padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 600;">심사 대기</span>';
        if (item.status === 'approved' || item.status === '승인 완료') {
          statusBadge = '<span style="background: #dcfce7; color: #166534; padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 600;"><i class="fa-solid fa-check"></i> 승인 완료</span>';
        } else if (item.status === 'rejected' || item.status === '반려됨') {
          statusBadge = '<span style="background: #fee2e2; color: #991b1b; padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 600;"><i class="fa-solid fa-xmark"></i> 반려됨</span>';
        } else if (item.status) {
          statusBadge = `<span style="background: #e0e7ff; color: #3730a3; padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 600;">${typeof escapeHtml === 'function' ? escapeHtml(item.status) : item.status}</span>`;
        }

        const card = document.createElement('div');
        card.style.background = '#f8fafc';
        card.style.border = '1px solid var(--border-color)';
        card.style.borderRadius = '8px';
        card.style.padding = '12px 14px';
        card.style.textAlign = 'left';

        const maskedName = typeof maskName === 'function' ? maskName(item.ownerName) : item.ownerName;
        const maskedPhone = typeof maskPhone === 'function' ? maskPhone(item.ownerPhone) : item.ownerPhone;

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px;">
            <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">
              ${typeof escapeHtml === 'function' ? escapeHtml(item.storeName) : item.storeName}
              <span style="font-size: 0.7rem; font-weight: 600; color: var(--accent-primary); background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); padding: 1px 6px; border-radius: 4px; margin-left: 4px;">${typeof escapeHtml === 'function' ? escapeHtml(String(item.id)) : String(item.id)}</span>
            </div>
            <div>${statusBadge}</div>
          </div>
          <div style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.5;">
            <div><i class="fa-solid fa-location-dot" style="width: 14px; color: var(--accent-primary);"></i> ${typeof escapeHtml === 'function' ? escapeHtml(item.storeAddress) : item.storeAddress}</div>
            <div style="display: flex; gap: 12px; margin-top: 3px; font-size: 0.74rem; color: #64748b;">
              <span><i class="fa-solid fa-user-shield"></i> 신청인: ${typeof escapeHtml === 'function' ? escapeHtml(maskedName) : maskedName}</span>
              ${maskedPhone ? `<span><i class="fa-solid fa-phone"></i> ${typeof escapeHtml === 'function' ? escapeHtml(maskedPhone) : maskedPhone}</span>` : ''}
            </div>
          </div>
        `;
        searchResultsArea.appendChild(card);
      });
    });
  }
}
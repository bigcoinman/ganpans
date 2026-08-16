/**
 * kakao-notify.js
 * 카카오톡 "나에게 보내기" API 기반 관리자 실시간 무료 알림 모듈
 */

const KakaoNotifier = (function () {
  const KAKAO_STORAGE_KEY = 'kakao_admin_token';
  const KAKAO_SETTINGS_KEY = 'kakao_admin_settings';

  // 기본 설정 불러오기
  function getSettings() {
    try {
      return JSON.parse(localStorage.getItem(KAKAO_SETTINGS_KEY)) || {
        enabled: true,
        accessToken: localStorage.getItem(KAKAO_STORAGE_KEY) || '',
        adminUrl: 'https://ganpans.com/dashboard.html'
      };
    } catch (e) {
      return { enabled: true, accessToken: '', adminUrl: 'https://ganpans.com/dashboard.html' };
    }
  }

  // 설정 저장
  function saveSettings(settings) {
    localStorage.setItem(KAKAO_SETTINGS_KEY, JSON.stringify(settings));
    if (settings.accessToken) {
      localStorage.setItem(KAKAO_STORAGE_KEY, settings.accessToken);
    }
  }

  // 카카오 "나에게 보내기" REST API 호출
  async function sendToMe(title, message, linkUrl = 'https://ganpans.com/dashboard.html') {
    const settings = getSettings();
    const token = settings.accessToken ? settings.accessToken.trim() : '';

    if (!settings.enabled || !token) {
      console.log('💡 [카카오 알림 대기]: 카카오 토큰 설정 시 대표님 카카오톡으로 실시간 전송됩니다.', { title, message });
      return { success: false, reason: 'TOKEN_NOT_CONFIGURED', message: '카카오 토큰이 아직 등록되지 않았습니다.' };
    }

    const fullText = `[🔔 간판지원단 실시간 접수 알림]\n\n📌 ${title}\n\n${message}\n\n⏰ 접수일시: ${new Date().toLocaleString('ko-KR')}`;

    const templateObject = {
      object_type: 'text',
      text: fullText,
      link: {
        web_url: linkUrl,
        mobile_web_url: linkUrl
      },
      button_title: '대시보드 바로가기'
    };

    try {
      const response = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        },
        body: new URLSearchParams({
          template_object: JSON.stringify(templateObject)
        })
      });

      const data = await response.json();
      if (response.ok && data.result_code === 0) {
        console.log('✅ [카카오 알림 성공]: 대표님 카카오톡으로 실시간 알림이 발송되었습니다.');
        return { success: true, data };
      } else {
        console.warn('⚠️ [카카오 알림 응답]:', data);
        return { success: false, data, reason: 'API_ERROR' };
      }
    } catch (error) {
      console.error('❌ [카카오 알림 네트워크 오류]:', error);
      return { success: false, error, reason: 'NETWORK_ERROR' };
    }
  }

  // 1. 3초 간편 문의 접수 알림
  function notifyInquiry(inquiry) {
    const typeNames = {
      'eligibility': '지원 대상/자격 문의',
      'documents': '제출 서류/신청 문의',
      'simulator': '간판 시뮬레이터 문의',
      'constructor': '시공업체 제휴 문의',
      'other': '기타 일반 문의'
    };
    const typeLabel = typeNames[inquiry.type] || inquiry.type || '일반 문의';

    const title = '💬 3초 간편 문의가 접수되었습니다!';
    const message = `• 고객 성함: ${inquiry.name}\n• 연락처: ${inquiry.phone}\n• 문의 유형: ${typeLabel}\n• 문의 내용:\n"${inquiry.message}"`;

    return sendToMe(title, message, 'https://ganpans.com/dashboard.html');
  }

  // 2. 온라인 간편 지원 신청 알림
  function notifyApplication(app) {
    const title = '📑 온라인 간편 지원금 신청서 접수!';
    const referrerText = app.referrerCode ? `• 담당 영업자: ${app.referrerCode}\n` : '• 접수 경로: 일반 포털 온라인 직접 접수\n';
    
    const message = `• 접수 번호: ${app.id}\n• 점포 상호명: ${app.storeName}\n• 대표자명: ${app.ownerName} (${app.ownerPhone})\n• 설치 주소: ${app.storeAddress}\n• 간판 종류: ${app.signType || '플렉스'}\n${referrerText}• 첨부 사진: ${app.fileName || '현장 사진 첨부됨'}`;

    return sendToMe(title, message, 'https://ganpans.com/dashboard.html');
  }

  // 3. 영업자 회원 전환 신청 알림
  function notifyBusinessConversion(user) {
    const title = '👔 영업자 회원 전환 신청 (승인 대기)';
    const message = `• 신청자 성명: ${user.name}\n• 아이디: ${user.id}\n• 연락처: ${user.phone}\n• 주소: ${user.address || '미입력'}\n\n👉 대시보드에서 [승인] 시 전용 영업자 코드가 자동 발급됩니다.`;

    return sendToMe(title, message, 'https://ganpans.com/dashboard.html');
  }

  // 4. 시공업체 회원 전환 신청 알림
  function notifyConstructorConversion(user) {
    const title = '🏗️ 시공업체 회원 전환 신청 (승인 대기)';
    const message = `• 업체 상호명: ${user.pendingBusinessName || user.name}\n• 사업자등록번호: ${user.pendingLicenseNumber || '미입력'}\n• 대표자명: ${user.name} (${user.phone})\n• 주소: ${user.address || '미입력'}\n\n👉 대시보드에서 [승인] 시 시공사 코드가 자동 발급됩니다.`;

    return sendToMe(title, message, 'https://ganpans.com/dashboard.html');
  }

  return {
    getSettings,
    saveSettings,
    sendToMe,
    notifyInquiry,
    notifyApplication,
    notifyBusinessConversion,
    notifyConstructorConversion
  };
})();

// 전역 노출
window.KakaoNotifier = KakaoNotifier;

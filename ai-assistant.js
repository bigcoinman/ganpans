/**
 * ai-assistant.js - 간판지원단 AI 비서 전용 클린 단일 엔진 (Clean Slate SSOT)
 * =========================================================================
 * 🛡️ [영구 불변 원칙]
 * 1. 버튼 삭제(remove()) 영구 엄격 금지: 버튼을 눌러도 사라지지 않고 지속 유지됨
 * 2. 1회 터치/클릭 즉각 100% 반응 (No Flash, No Disappearance)
 * 3. 독립 스코프 및 Zero-Dependency: 타 모듈과 전역 변수 충돌 원천 차단
 * 4. 모바일 터치 및 데스크톱 완벽 지원
 * =========================================================================
 */

(function (window, document) {
    'use strict';

    // 1. 단일 SSOT 질의응답 지식베이스
    const FAQ_DATABASE = {
        target: {
            title: "💡 지원 자격 및 대상",
            content: "💡 <strong>지원 대상 및 자격 기준</strong><br><br>" +
                "• <strong>대상자</strong>: 공고일 현재 경기도 내에 사업장을 두고 영업 중인 <strong>창업 3년 이상</strong>(사업자등록 기준) 소상공인 사업자입니다.<br>" +
                "• <strong>소상공인 상시 근로자 기준</strong>:<br>" +
                "  - 도소매업, 음식점, 숙박업, 서비스업: 5인 미만<br>" +
                "  - 광업, 제조업, 건설업, 운수업: 10인 미만<br>" +
                "• <strong>지원 제외 대상</strong>: 대기업 프랜차이즈 직영점, 사치향락 업종(유흥주점 등), 무등록/휴폐업자, 지방세 체납자, 최근 3년 이내 경기도 및 시·군 유사 지원사업 수혜자는 신청할 수 없습니다."
        },
        amount: {
            title: "💰 지원 금액 및 품목",
            content: "💰 <strong>지원 금액 및 품목 안내</strong><br><br>" +
                "• <strong>지원 한도</strong>: 업체당 <strong>최대 200만원 한도</strong> (공급가의 100% 지원, 부가세 10% 및 200만원 초과 금액은 본인 부담)<br>" +
                "  * 예: 견적서 공급가액이 220만원인 경우, 지원금 200만원 + 본인부담 20만원 + 부가세 별도 납부<br>" +
                "• <strong>지원 품목</strong>: 간판(불법 간판 제외), 썬팅, 투광기 중 <strong>최대 2개 품목 이하</strong> 선택 가능<br>" +
                "• <strong>시공 주의사항</strong>: 반드시 <strong>선정 후 견적서 승인</strong>을 먼저 받은 다음 시공을 진행해야 합니다. 승인 전 <strong>사전 시공 시 지원 대상에서 제외(선정 취소)</strong>되므로 절대 주의 바랍니다."
        },
        documents: {
            title: "📄 필수 제출 서류",
            content: "📄 <strong>제출 서류 안내</strong><br><br>" +
                "• <strong>필수 기본 서류</strong>:<br>" +
                "  1. 신청서 및 추진계획서 (점포 사진 첨부 필수)<br>" +
                "  2. 개인신용정보 제공 동의서<br>" +
                "  3. 시공계획서<br>" +
                "• <strong>증빙 서류 (※ 경기바로 공공마이데이터 간편 신청 동의 시 제출 생략 가능)</strong>:<br>" +
                "  4. 사업자등록증 사본 1부<br>" +
                "  5. 최근 2개년 부가세 과세표준증명원(또는 면세사업자 수입금액증명원)<br>" +
                "  6. 소득금액증명원 (직전년도 기준)<br>" +
                "• <strong>가점 증빙 (해당자만 제출)</strong>: 표창장(도지사 등), 자영업아카데미 수료증, 취약계층 증명서 등"
        },
        simulator: {
            title: "🎨 시뮬레이터 사용법",
            content: "🎨 <strong>AI 간판 시뮬레이터 사용법</strong><br><br>" +
                "• <strong>기능 안내</strong>: 실제 점포 파사드 배경에 원하는 상호 글자, 서체, 간판 프레임 색상, 야간 조명 효과를 실시간으로 미리 시뮬레이션해 볼 수 있는 100% 무료 체험 기능입니다.<br>" +
                "• <strong>이용 방법</strong>:<br>" +
                "  1. 상단 메뉴 또는 홈 화면의 <strong>[AI 간판 시뮬레이터]</strong> 버튼 클릭<br>" +
                "  2. 매장 상호명 입력 및 간판 종류(LED채널, 플렉스, 돌출간판 등) 선택<br>" +
                "  3. 글자 색상, 프레임, 조명 스위치를 켜보며 마음에 드는 디자인 완성<br>" +
                "  4. 완성된 시뮬레이션 이미지를 저장하거나 바로 <strong>[지원 신청]</strong>과 연동 가능합니다.<br><br>" +
                "👉 지금 바로 <a href=\"#simulator\" onclick=\"if(window.switchTab) window.switchTab('simulator'); if(window.AIAssistant) window.AIAssistant.close(); return false;\" style=\"color: #2563eb; font-weight: 700; text-decoration: underline;\">[시뮬레이터 바로가기]</a>를 눌러 체험해 보세요!"
        },
        contact: {
            title: "📞 고객센터 및 일정",
            content: "📞 <strong>고객센터 및 접수 일정 안내</strong><br><br>" +
                "• <strong>접수 기간</strong>: <strong>2026. 3. 31(화) ~ 4. 13(월) 18:00까지</strong><br>" +
                "• <strong>경상원 종합상담 콜센터</strong>: <strong>☎ 1600-8001</strong> (평일 09:00 ~ 18:00)<br>" +
                "• <strong>지역센터별 관할 구역</strong>:<br>" +
                "  - 남부센터(수원 소재): 수원, 용인, 군포, 의왕, 과천<br>" +
                "  - 남부센터(화성 소재): 화성, 오산, 평택, 안성<br>" +
                "  - 남동센터(광주 소재): 광주, 성남, 여주, 이천<br>" +
                "  - 남서센터(시흥 소재): 시흥, 안양, 안산, 광명, 부천<br>" +
                "  - 북부센터(남양주 소재): 남양주, 의정부, 포천, 구리, 가평, 하남, 양평<br>" +
                "  - 북서센터(파주 소재): 파주, 고양, 양주, 동두천, 연천, 김포"
        }
    };

    // 2. 엔진 상태 관리
    let isProcessing = false;
    let initialized = false;

    function getElements() {
        return {
            trigger: document.getElementById('ai-assistant-trigger'),
            chatWindow: document.getElementById('ai-chat-window'),
            closeBtn: document.getElementById('ai-chat-close'),
            sendBtn: document.getElementById('ai-chat-send'),
            chatInput: document.getElementById('ai-chat-input'),
            chatMessages: document.getElementById('ai-chat-messages')
        };
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // 3. 메시지 추가 및 스크롤 관리
    function appendUserBubble(text) {
        const { chatMessages } = getElements();
        if (!chatMessages) return;
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble user-message';
        bubble.innerHTML = escapeHtml(text);
        chatMessages.appendChild(bubble);
        scrollToBottom();
    }

    function appendBotBubble(htmlContent) {
        const { chatMessages } = getElements();
        if (!chatMessages) return;
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble bot-message';
        bubble.innerHTML = htmlContent;
        chatMessages.appendChild(bubble);
        scrollToBottom();
    }

    function showLoadingBubble() {
        const { chatMessages } = getElements();
        if (!chatMessages) return null;
        const loadingId = 'ai-loading-' + Date.now();
        const bubble = document.createElement('div');
        bubble.id = loadingId;
        bubble.className = 'chat-bubble bot-message chat-loading';
        bubble.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(bubble);
        scrollToBottom();
        return loadingId;
    }

    function removeLoadingBubble(loadingId) {
        if (!loadingId) return;
        const el = document.getElementById(loadingId);
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    }

    function scrollToBottom() {
        const { chatMessages } = getElements();
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // 4. 질의응답 핵심 엔진
    function handleQuestion(faqKey, userDisplayText) {
        if (isProcessing) return;
        isProcessing = true;

        const item = FAQ_DATABASE[faqKey];
        const displayText = userDisplayText || (item ? item.title : faqKey);

        // [영구 불변 원칙] 기존 버튼들을 절대 삭제(remove())하지 않습니다!
        // 사용자 말풍선 추가
        appendUserBubble(displayText);

        // 로딩 인디케이터 표시
        const loadingId = showLoadingBubble();

        // 100ms 가벼운 지연으로 부드러운 응답감 제공
        setTimeout(function () {
            try {
                removeLoadingBubble(loadingId);

                let responseHtml = "";
                if (item && item.content) {
                    responseHtml = item.content;
                } else {
                    responseHtml = getAnswerByKeyword(displayText);
                }

                // 봇 답변 말풍선 추가 (내용 손실 없이 온전히 표시)
                appendBotBubble(responseHtml);

            } catch (err) {
                console.error('[AIAssistant Error]', err);
                removeLoadingBubble(loadingId);
                appendBotBubble("답변을 불러오는 중 오류가 발생했습니다. 아래 버튼을 다시 터치해 주세요. 🙏");
            } finally {
                isProcessing = false;
                scrollToBottom();
            }
        }, 120);
    }

    function getAnswerByKeyword(text) {
        const cleaned = (text || '').toLowerCase().replace(/\s+/g, '');
        if (cleaned.includes('시뮬') || cleaned.includes('가상') || cleaned.includes('디자인') || cleaned.includes('미리보기')) {
            return FAQ_DATABASE.simulator.content;
        }
        if (cleaned.includes('대상') || cleaned.includes('조건') || cleaned.includes('자격') || cleaned.includes('제한') || cleaned.includes('제외') || cleaned.includes('누가') || cleaned.includes('기준')) {
            return FAQ_DATABASE.target.content;
        }
        if (cleaned.includes('금액') || cleaned.includes('한도') || cleaned.includes('비용') || cleaned.includes('얼마') || cleaned.includes('지원금') || cleaned.includes('썬팅') || cleaned.includes('투광기') || cleaned.includes('인테리어')) {
            return FAQ_DATABASE.amount.content;
        }
        if (cleaned.includes('서류') || cleaned.includes('준비') || cleaned.includes('제출') || cleaned.includes('증명원') || cleaned.includes('동의서')) {
            return FAQ_DATABASE.documents.content;
        }
        if (cleaned.includes('일정') || cleaned.includes('기간') || cleaned.includes('날짜') || cleaned.includes('언제') || cleaned.includes('방법') || cleaned.includes('접수') || cleaned.includes('신청') || cleaned.includes('센터') || cleaned.includes('전화') || cleaned.includes('콜센터') || cleaned.includes('번호') || cleaned.includes('문의') || cleaned.includes('주소') || cleaned.includes('경상원')) {
            return FAQ_DATABASE.contact.content;
        }
        if (cleaned.includes('안녕') || cleaned.includes('반가') || cleaned.includes('하이') || cleaned.includes('hello')) {
            return "안녕하세요! 소상공인 간판지원단 AI 비서입니다. 😊<br>궁금하신 점을 언제든 말씀해 주시거나 위 메뉴 버튼을 눌러주세요!";
        }
        return "죄송합니다. 질문하신 내용에 대한 정확한 안내를 찾지 못했습니다. 😢<br><br>" +
            "위의 <strong>주요 안내 버튼</strong>을 터치하시거나, '지원 자격', '지원 금액', '필수 서류', '시뮬레이터', '고객센터' 등의 단어로 질문해 주세요!";
    }

    // 5. 공개 인터페이스
    const AIAssistant = {
        open: function (e) {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
            const { chatWindow, trigger, chatInput } = getElements();
            if (chatWindow) chatWindow.classList.add('active');
            if (trigger) trigger.style.display = 'none';
            if (chatInput) setTimeout(function () { chatInput.focus(); }, 120);
            scrollToBottom();
        },

        close: function (e) {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
            const { chatWindow, trigger } = getElements();
            if (chatWindow) chatWindow.classList.remove('active');
            if (trigger) trigger.style.display = 'flex';
        },

        toggle: function (e) {
            const { chatWindow } = getElements();
            if (chatWindow && chatWindow.classList.contains('active')) {
                AIAssistant.close(e);
            } else {
                AIAssistant.open(e);
            }
        },

        ask: function (target, e) {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
            if (!target) return;

            let faqKey = '';
            let displayText = '';

            if (typeof target === 'string') {
                faqKey = target;
                const btn = document.querySelector('.quick-reply-btn[data-faq="' + faqKey + '"]');
                displayText = btn ? btn.innerText.trim() : (FAQ_DATABASE[faqKey] ? FAQ_DATABASE[faqKey].title : faqKey);
            } else if (target && typeof target.getAttribute === 'function') {
                faqKey = target.getAttribute('data-faq') || '';
                displayText = target.innerText ? target.innerText.trim() : '';
            }

            if (faqKey) {
                handleQuestion(faqKey, displayText);
            }
        },

        send: function (e) {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
            const { chatInput } = getElements();
            if (!chatInput) return;
            const text = chatInput.value.trim();
            if (!text) return;
            chatInput.value = '';

            if (isProcessing) return;
            isProcessing = true;

            appendUserBubble(text);
            const loadingId = showLoadingBubble();

            setTimeout(function () {
                try {
                    removeLoadingBubble(loadingId);
                    const response = getAnswerByKeyword(text);
                    appendBotBubble(response);
                } catch (err) {
                    console.error('[AIAssistant send Error]', err);
                    removeLoadingBubble(loadingId);
                    appendBotBubble("답변 처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
                } finally {
                    isProcessing = false;
                    scrollToBottom();
                }
            }, 120);
        },

        init: function () {
            if (initialized) return;
            const { trigger, closeBtn, sendBtn, chatInput } = getElements();
            if (!trigger) return;

            initialized = true;

            // 이벤트 리스너 바인딩 (인라인 핸들러와 상호 보완)
            trigger.addEventListener('click', AIAssistant.open);
            if (closeBtn) closeBtn.addEventListener('click', AIAssistant.close);
            if (sendBtn) sendBtn.addEventListener('click', AIAssistant.send);
            if (chatInput) {
                chatInput.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        AIAssistant.send(e);
                    }
                });
            }
        }
    };

    // 6. 전역 노출 및 호환성 브릿지 (100% 하위 호환성 보장)
    window.AIAssistant = AIAssistant;
    window.faqDatabase = FAQ_DATABASE;

    window.openAIChatWindow = function (e) { AIAssistant.open(e); };
    window.closeAIChatWindow = function (e) { AIAssistant.close(e); };
    window.sendAIMessage = function (e) { AIAssistant.send(e); };
    window.handleAIQuickReply = function (target, e) { AIAssistant.ask(target, e); };

    // DOM 로드 완료 시 자동 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', AIAssistant.init);
    } else {
        AIAssistant.init();
    }

})(window, document);

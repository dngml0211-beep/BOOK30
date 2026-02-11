/**
 * Proto Navigation (Dev Tool) - 공통 모듈
 * 모든 페이지에서 자동으로 HTML 주입 + 초기화
 * 페이지별 시나리오는 ProtoNav.registerScenarios()로 등록
 */
(function () {
    'use strict';

    // ===== 현재 페이지 감지 =====
    const currentPath = location.pathname;
    const pageName = currentPath.split('/').pop().replace('.html', '') || 'index';

    // 페이지 맵 (라벨, 아이콘, 경로)
    const pageMap = [
        { id: 'home',         label: '홈',               icon: 'fa-house',            path: 'home.html' },
        { id: 'home2',        label: '홈 (v2)',           icon: 'fa-house-chimney',    path: 'home2.html' },
        { id: 'library',      label: '라이브러리',        icon: 'fa-book-bookmark',    path: 'library.html' },
        { id: 'book-library', label: '북클럽 서재',       icon: 'fa-books',            path: 'book-library.html' },
        { id: 'mypage',       label: '마이페이지',        icon: 'fa-user',             path: 'mypage.html' },
        { id: 'report',       label: '리포트',            icon: 'fa-chart-line',       path: 'report.html' },
        { id: 'ai-buddy',     label: 'AI 버디',          icon: 'fa-robot',            path: 'ai-buddy.html' },
        { id: 'question-lens', label: '질문렌즈',         icon: 'fa-magnifying-glass', path: 'question-lens.html' },
        { id: 'all-challenge', label: '올 도전',          icon: 'fa-flag',             path: 'all-challenge.html' },
        { id: 'gallery',      label: '갤러리',            icon: 'fa-images',           path: 'gallery.html' },
        { id: 'starshop',     label: '별상점',            icon: 'fa-star',             path: 'starshop.html' },
        { id: 'debate',       label: '나도한마디',        icon: 'fa-comments',         path: 'debate.html' },
    ];

    // ===== HTML 주입 =====
    function injectHTML() {
        // 페이지 네비게이션 링크 생성
        let pageLinks = '';
        pageMap.forEach(p => {
            const isCurrent = pageName === p.id;
            const cls = isCurrent ? ' class="proto-nav-current"' : '';
            pageLinks += `<a href="${p.path}"${cls}><i class="fa-solid ${p.icon}"></i> ${p.label}${isCurrent ? ' (현재)' : ''}</a>\n`;
        });

        const html = `
<div id="proto-nav">
    <button id="proto-nav-toggle" title="Proto Navigation (Ctrl+Shift+P)">
        <i class="fa-solid fa-compass"></i>
    </button>

    <div id="proto-nav-panel">
        <div class="proto-nav-header">
            <span><i class="fa-solid fa-compass"></i> Proto Navigation</span>
            <button onclick="ProtoNav.toggle()" class="proto-nav-close">&times;</button>
        </div>

        <div class="proto-nav-status" id="proto-nav-status">
            <span id="proto-nav-page">${pageName}</span> &middot;
            <span id="proto-nav-week"></span>
            <span id="proto-nav-booktype"></span>
            <span id="proto-nav-progress"></span>
        </div>

        <!-- 페이지별 시나리오 (동적 등록) -->
        <div id="proto-nav-scenarios"></div>

        <!-- 사용자 상태 메뉴 -->
        <div class="proto-nav-category">
            <button class="proto-nav-cat-btn" onclick="ProtoNav.toggleCategory(this)">
                <span>&#9654; 웅진북클럽 KRS</span>
                <span class="proto-nav-cat-badge">상태 적용</span>
            </button>
            <div class="proto-nav-options">
                <button onclick="ProtoNav.applyStateScenario('krs-week1-start')">
                    <i class="fa-solid fa-play"></i> 1주차 시작
                </button>
                <button onclick="ProtoNav.applyStateScenario('krs-week1-core')">
                    <i class="fa-solid fa-book"></i> 1주차 코어북 완료
                </button>
                <button onclick="ProtoNav.applyStateScenario('krs-week1-all')">
                    <i class="fa-solid fa-check-double"></i> 1주차 코어북+짝꿍책 완료
                </button>
            </div>
        </div>

        <div class="proto-nav-category">
            <button class="proto-nav-cat-btn" onclick="ProtoNav.toggleCategory(this)">
                <span>&#9654; 웅진북클럽</span>
                <span class="proto-nav-cat-badge">무료체험</span>
            </button>
            <div class="proto-nav-options">
                <button onclick="ProtoNav.applyStateScenario('bookclub-before-trial')">
                    <i class="fa-solid fa-clock"></i> 무체 신청 전
                </button>
                <button onclick="ProtoNav.applyStateScenario('bookclub-trial-end')">
                    <i class="fa-solid fa-flag-checkered"></i> 무체 종료
                </button>
                <button onclick="ProtoNav.applyStateScenario('bookclub-trial-complete')">
                    <i class="fa-solid fa-check"></i> 무체 신청 완료(진행중)
                </button>
            </div>
        </div>
        <div class="proto-nav-footer">Proto v1.1 | Dev Mode | ${pageName}</div>
    </div>
</div>`;

        document.body.insertAdjacentHTML('beforeend', html);

        // 토글 버튼 이벤트
        const btn = document.getElementById('proto-nav-toggle');
        if (btn) {
            btn.addEventListener('click', () => ProtoNav.handleToggleClick());
        }
    }

    // ===== ProtoNav 코어 객체 =====
    window.ProtoNav = {
        isOpen: false,
        isDragging: false,
        dragStartX: 0,
        dragStartY: 0,
        dragMoved: false,

        toggle() {
            this.isOpen = !this.isOpen;
            const panel = document.getElementById('proto-nav-panel');
            const btn = document.getElementById('proto-nav-toggle');
            if (this.isOpen) {
                panel.classList.remove('proto-nav-hidden');
                btn.classList.add('active');
                this.updateStatus();
                this.syncPanelPosition();
            } else {
                panel.classList.add('proto-nav-hidden');
                btn.classList.remove('active');
            }
        },

        handleToggleClick() {
            if (this.dragMoved) return;
            this.toggle();
        },

        syncPanelPosition() {
            const btn = document.getElementById('proto-nav-toggle');
            const panel = document.getElementById('proto-nav-panel');
            if (!btn || !panel) return;
            const btnRect = btn.getBoundingClientRect();
            panel.style.bottom = (window.innerHeight - btnRect.top + 8) + 'px';
            panel.style.right = (window.innerWidth - btnRect.right) + 'px';
        },

        initDrag() {
            const btn = document.getElementById('proto-nav-toggle');
            if (!btn) return;
            const self = this;

            const onStart = (e) => {
                const touch = e.touches ? e.touches[0] : e;
                self.isDragging = true;
                self.dragMoved = false;
                self.dragStartX = touch.clientX - btn.getBoundingClientRect().left;
                self.dragStartY = touch.clientY - btn.getBoundingClientRect().top;
                btn.style.cursor = 'grabbing';
                btn.style.transition = 'none';
            };

            const onMove = (e) => {
                if (!self.isDragging) return;
                e.preventDefault();
                const touch = e.touches ? e.touches[0] : e;
                const x = touch.clientX - self.dragStartX;
                const y = touch.clientY - self.dragStartY;

                const dx = Math.abs(touch.clientX - (btn.getBoundingClientRect().left + self.dragStartX));
                const dy = Math.abs(touch.clientY - (btn.getBoundingClientRect().top + self.dragStartY));
                if (dx > 5 || dy > 5) self.dragMoved = true;

                const maxX = window.innerWidth - btn.offsetWidth;
                const maxY = window.innerHeight - btn.offsetHeight;
                btn.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
                btn.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
                btn.style.right = 'auto';
                btn.style.bottom = 'auto';

                if (self.isOpen) self.syncPanelPosition();
            };

            const onEnd = () => {
                if (!self.isDragging) return;
                self.isDragging = false;
                btn.style.cursor = 'grab';
                btn.style.transition = '';
                setTimeout(() => { self.dragMoved = false; }, 50);
            };

            btn.addEventListener('mousedown', onStart);
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onEnd);
            btn.addEventListener('touchstart', onStart, { passive: false });
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', onEnd);
        },

        toggleCategory(btn) {
            const options = btn.nextElementSibling;
            const isExpanded = options.classList.contains('proto-nav-expanded');
            document.querySelectorAll('.proto-nav-options').forEach(el => {
                el.classList.remove('proto-nav-expanded');
                el.classList.add('proto-nav-collapsed');
            });
            document.querySelectorAll('.proto-nav-cat-btn span:first-child').forEach(s => {
                s.textContent = s.textContent.replace('\u25BC', '\u25B6');
            });
            if (!isExpanded) {
                options.classList.remove('proto-nav-collapsed');
                options.classList.add('proto-nav-expanded');
                btn.querySelector('span:first-child').textContent =
                    btn.querySelector('span:first-child').textContent.replace('\u25B6', '\u25BC');
            }
        },

        updateStatus() {
            const pageEl = document.getElementById('proto-nav-page');
            const weekEl = document.getElementById('proto-nav-week');
            const typeEl = document.getElementById('proto-nav-booktype');
            const progEl = document.getElementById('proto-nav-progress');

            if (pageEl) pageEl.textContent = pageName;

            // home.html 전용 상태 표시
            if (typeof currentWeek !== 'undefined' && weekEl) {
                weekEl.textContent = currentWeek + '주차 \u00b7 ';

                if (typeof currentBookType !== 'undefined' && typeEl) {
                    if (typeof weeklyData !== 'undefined' && currentBookType === 'core') {
                        typeEl.textContent = (weeklyData[currentWeek] && weeklyData[currentWeek].core
                            ? weeklyData[currentWeek].core.bookType : '코어북') + ' \u00b7 ';
                    } else {
                        typeEl.textContent = '교과서 짝꿍책 \u00b7 ';
                    }
                }

                if (typeof getWeekProgress === 'function' && progEl) {
                    const cp = getWeekProgress(currentWeek + '_core');
                    const tp = getWeekProgress(currentWeek + '_textbook');
                    const coreAll = cp && cp.allComplete === true;
                    const textAll = tp && tp.allComplete === true;
                    if (coreAll && textAll) {
                        progEl.textContent = '전체 완료';
                        progEl.style.color = '#4ade80';
                    } else if (coreAll) {
                        progEl.textContent = '코어 완료';
                        progEl.style.color = '#fbbf24';
                    } else {
                        progEl.textContent = '진행중';
                        progEl.style.color = '#94a3b8';
                    }
                }
            }
        },

        toast(message) {
            const existing = document.querySelector('.proto-nav-toast');
            if (existing) existing.remove();
            const el = document.createElement('div');
            el.className = 'proto-nav-toast';
            el.innerHTML = '<i class="fa-solid fa-compass" style="margin-right:6px"></i>' + message;
            document.body.appendChild(el);
            setTimeout(() => {
                el.style.transition = 'opacity 0.3s';
                el.style.opacity = '0';
                setTimeout(() => el.remove(), 300);
            }, 2000);
        },

        refreshUI() {
            // 페이지별 refreshUI가 등록되어 있으면 호출
            if (typeof this._refreshUI === 'function') {
                this._refreshUI();
            }
            this.updateStatus();
        },

        /**
         * 사용자 상태 적용
         * @param {string} stateId - 상태 ID
         */
        applyStateScenario(stateId) {
            console.log('[ProtoNav] Applying state:', stateId);

            switch (stateId) {
                // 웅진북클럽 KRS
                case 'krs-week1-start':
                    this.applyKRSWeek1Start();
                    break;
                case 'krs-week1-core':
                    this.applyKRSWeek1Core();
                    break;
                case 'krs-week1-all':
                    this.applyKRSWeek1All();
                    break;

                // 웅진북클럽
                case 'bookclub-before-trial':
                    this.applyBookclubBeforeTrial();
                    break;
                case 'bookclub-trial-complete':
                    this.applyBookclubTrialComplete();
                    break;
                case 'bookclub-trial-end':
                    this.applyBookclubTrialEnd();
                    break;

                default:
                    console.warn('[ProtoNav] Unknown state:', stateId);
                    this.toast('알 수 없는 상태: ' + stateId);
            }

            // 상태 저장
            sessionStorage.setItem('protoNavState', stateId);
        },

        // === KRS 상태 적용 함수들 ===
        applyKRSWeek1Start() {
            console.log('[ProtoNav] KRS 1주차 시작');

            if (pageName === 'home') {
                // home.html에서 직접 적용
                if (typeof currentWeek !== 'undefined' && currentWeek !== 1) {
                    if (typeof selectWeek === 'function') selectWeek(1);
                }

                // 코어북, 교과서 짝꿍책 모두 초기화
                const coreProgressKey = '1_core';
                const textbookProgressKey = '1_textbook';

                // 코어북 초기화 (모든 속성 명시적으로 false 설정)
                const coreProgress = {};
                const coreBookData = {};
                coreBookData.completed = false;
                coreBookData.currentBookPage = 1; // 시작 페이지
                coreProgress.bookCompleted = false;
                coreProgress.quizCompleted = false;
                coreProgress.quizScore = 0;
                coreProgress.vocabCompleted = false;
                coreProgress.retellingCompleted = false;
                coreProgress.weekCompleted = false;
                coreProgress.allComplete = false;
                if (typeof saveWeekBookData === 'function') saveWeekBookData(coreBookData, coreProgressKey);
                if (typeof saveWeekProgress === 'function') saveWeekProgress(coreProgress, coreProgressKey);

                // 교과서 짝꿍책 초기화 (완전 잠금 - 프로그래스 0%, 모든 속성 명시적으로 false 설정)
                const textbookProgress = {};
                const textbookBookData = {};
                textbookBookData.completed = false;
                textbookBookData.currentBookPage = 0; // 프로그래스 0%
                textbookProgress.bookCompleted = false;
                textbookProgress.quizCompleted = false;
                textbookProgress.quizScore = 0;
                textbookProgress.weekCompleted = false;
                textbookProgress.allComplete = false;
                if (typeof saveWeekBookData === 'function') saveWeekBookData(textbookBookData, textbookProgressKey);
                if (typeof saveWeekProgress === 'function') saveWeekProgress(textbookProgress, textbookProgressKey);

                // 주차 전체 완료 상태 제거
                sessionStorage.removeItem('weekAllComplete_1');

                // 다시 읽기 모드 해제
                sessionStorage.removeItem('isReReadingMode');

                // 드롭다운 펼치기 (접혀있다면 먼저 확인 후 펼침)
                const isCollapsed = sessionStorage.getItem('isWeekCollapsed') === 'true';
                if (isCollapsed && typeof toggleWeekCollapse === 'function') {
                    toggleWeekCollapse();
                } else {
                    // 접혀있지 않더라도 명시적으로 펼친 상태로 설정
                    sessionStorage.setItem('isWeekCollapsed', 'false');
                }

                // 코어북으로 포커싱
                if (typeof switchBookType === 'function') switchBookType('core');
                if (typeof updateLearningProgress === 'function') updateLearningProgress();
                if (typeof updateBookTypeTabs === 'function') updateBookTypeTabs();

                this.toast('✅ 1주차 시작 (코어북 읽기 가능, 교과서 짝꿍책 잠김)');
            } else {
                // 다른 페이지에서는 home.html로 이동
                sessionStorage.setItem('protoNavStateOnLoad', 'krs-week1-start');
                window.location.href = window.location.pathname.includes('/pages/') ? 'home.html' : 'pages/home.html';
            }

            this.refreshUI();
        },

        applyKRSWeek1Core() {
            console.log('[ProtoNav] KRS 1주차 코어북 완료');

            if (pageName === 'home') {
                // home.html에서 직접 적용
                if (typeof currentWeek !== 'undefined' && currentWeek !== 1) {
                    if (typeof selectWeek === 'function') selectWeek(1);
                }

                // 코어북 완료 상태 적용
                const coreProgressKey = '1_core';
                const coreProgress = (typeof getWeekProgress === 'function') ? getWeekProgress(coreProgressKey) : {};
                const coreBookData = (typeof getWeekBookData === 'function') ? getWeekBookData(coreProgressKey) : {};

                coreBookData.completed = true;
                if (typeof saveWeekBookData === 'function') saveWeekBookData(coreBookData, coreProgressKey);

                coreProgress.quizCompleted = true;
                coreProgress.vocabCompleted = true;
                coreProgress.allComplete = true;
                if (typeof saveWeekProgress === 'function') saveWeekProgress(coreProgress, coreProgressKey);

                // 교과서 짝꿍책 미완료 상태로 초기화 (처음부터 시작 가능)
                const textbookProgressKey = '1_textbook';
                const textbookProgress = {};
                const textbookBookData = {};

                textbookBookData.completed = false;
                textbookBookData.currentBookPage = 1; // 처음부터 시작 가능한 상태
                if (typeof saveWeekBookData === 'function') saveWeekBookData(textbookBookData, textbookProgressKey);

                textbookProgress.quizCompleted = false;
                textbookProgress.allComplete = false;
                if (typeof saveWeekProgress === 'function') saveWeekProgress(textbookProgress, textbookProgressKey);

                // 주차 전체 완료 상태 제거
                sessionStorage.removeItem('weekAllComplete_1');

                // 드롭다운 펼치기 (접혀있다면 먼저 확인 후 펼침)
                const isCollapsed = sessionStorage.getItem('isWeekCollapsed') === 'true';
                if (isCollapsed && typeof toggleWeekCollapse === 'function') {
                    toggleWeekCollapse();
                } else {
                    // 접혀있지 않더라도 명시적으로 펼친 상태로 설정
                    sessionStorage.setItem('isWeekCollapsed', 'false');
                }

                // 교과서 짝꿍책으로 포커싱 (자동 전환)
                if (typeof switchBookType === 'function') switchBookType('textbook');
                if (typeof updateLearningProgress === 'function') updateLearningProgress();
                if (typeof updateBookTypeTabs === 'function') updateBookTypeTabs();

                this.toast('✅ 1주차 코어북 완료 (교과서 짝꿍책으로 전환)');
            } else {
                // 다른 페이지에서는 home.html로 이동
                sessionStorage.setItem('protoNavStateOnLoad', 'krs-week1-core');
                window.location.href = window.location.pathname.includes('/pages/') ? 'home.html' : 'pages/home.html';
            }

            this.refreshUI();
        },

        applyKRSWeek1Textbook() {
            console.log('[ProtoNav] KRS 1주차 교과서 짝꿍책 완료');

            if (pageName === 'home') {
                if (typeof currentWeek !== 'undefined' && currentWeek !== 1) {
                    if (typeof selectWeek === 'function') selectWeek(1);
                }

                // 교과서 짝꿍책 완료 상태 적용
                const textbookProgressKey = '1_textbook';
                const textbookProgress = (typeof getWeekProgress === 'function') ? getWeekProgress(textbookProgressKey) : {};
                const textbookBookData = (typeof getWeekBookData === 'function') ? getWeekBookData(textbookProgressKey) : {};

                textbookBookData.completed = true;
                if (typeof saveWeekBookData === 'function') saveWeekBookData(textbookBookData, textbookProgressKey);

                textbookProgress.quizCompleted = true;
                textbookProgress.allComplete = true;
                if (typeof saveWeekProgress === 'function') saveWeekProgress(textbookProgress, textbookProgressKey);

                // 코어북 미완료 상태로 초기화
                const coreProgressKey = '1_core';
                const coreProgress = {};
                const coreBookData = {};

                coreBookData.completed = false;
                if (typeof saveWeekBookData === 'function') saveWeekBookData(coreBookData, coreProgressKey);

                coreProgress.quizCompleted = false;
                coreProgress.vocabCompleted = false;
                coreProgress.allComplete = false;
                if (typeof saveWeekProgress === 'function') saveWeekProgress(coreProgress, coreProgressKey);

                // 주차 전체 완료 상태 제거
                sessionStorage.removeItem('weekAllComplete_1');

                if (typeof switchBookType === 'function') switchBookType('textbook');
                if (typeof updateLearningProgress === 'function') updateLearningProgress();
                if (typeof updateBookTypeTabs === 'function') updateBookTypeTabs();

                this.toast('✅ 1주차 교과서 짝꿍책 완료 적용 (코어북 미완료)');
            } else {
                sessionStorage.setItem('protoNavStateOnLoad', 'krs-week1-textbook');
                window.location.href = window.location.pathname.includes('/pages/') ? 'home.html' : 'pages/home.html';
            }

            this.refreshUI();
        },

        applyKRSWeek1All() {
            console.log('[ProtoNav] KRS 1주차 전체 완료 (코어북+짝꿍책)');

            if (pageName === 'home') {
                // home.html에서 직접 적용
                if (typeof currentWeek !== 'undefined' && currentWeek !== 1) {
                    if (typeof selectWeek === 'function') selectWeek(1);
                }

                // 코어북 완료 상태 적용
                const coreProgressKey = '1_core';
                const coreProgress = (typeof getWeekProgress === 'function') ? getWeekProgress(coreProgressKey) : {};
                const coreBookData = (typeof getWeekBookData === 'function') ? getWeekBookData(coreProgressKey) : {};

                coreBookData.completed = true;
                // 코어북의 totalPages 설정
                const coreDataInfo = typeof weeklyData !== 'undefined' && weeklyData && weeklyData[1] && weeklyData[1].core;
                if (coreDataInfo && coreDataInfo.book) {
                    coreBookData.currentBookPage = coreDataInfo.book.totalPages || 20;
                }
                if (typeof saveWeekBookData === 'function') saveWeekBookData(coreBookData, coreProgressKey);

                coreProgress.quizCompleted = true;
                coreProgress.vocabCompleted = true;
                coreProgress.allComplete = true;
                if (typeof saveWeekProgress === 'function') saveWeekProgress(coreProgress, coreProgressKey);

                // 교과서 짝꿍책 완료 상태 적용
                const textbookProgressKey = '1_textbook';
                const textbookProgress = (typeof getWeekProgress === 'function') ? getWeekProgress(textbookProgressKey) : {};
                const textbookBookData = (typeof getWeekBookData === 'function') ? getWeekBookData(textbookProgressKey) : {};

                textbookBookData.completed = true;
                // 교과서 짝꿍책의 totalPages 설정
                const textbookDataInfo = typeof weeklyData !== 'undefined' && weeklyData && weeklyData[1] && weeklyData[1].textbook;
                if (textbookDataInfo && textbookDataInfo.book) {
                    textbookBookData.currentBookPage = textbookDataInfo.book.totalPages || 10;
                }
                if (typeof saveWeekBookData === 'function') saveWeekBookData(textbookBookData, textbookProgressKey);

                textbookProgress.quizCompleted = true;
                textbookProgress.allComplete = true;
                if (typeof saveWeekProgress === 'function') saveWeekProgress(textbookProgress, textbookProgressKey);

                // 주차 전체 완료 상태 저장
                sessionStorage.setItem('weekAllComplete_1', 'true');

                // 주차 접기 상태를 명시적으로 설정 (접힌 상태로 시작)
                sessionStorage.setItem('isWeekCollapsed', 'true');

                // UI 업데이트
                if (typeof updateLearningProgress === 'function') updateLearningProgress();
                if (typeof updateBookTypeTabs === 'function') updateBookTypeTabs();

                // 드롭다운 자동 접기
                setTimeout(() => {
                    if (typeof checkAndAutoCollapse === 'function') {
                        checkAndAutoCollapse();
                    }
                }, 300);

                this.toast('✅ 1주차 전체 완료 (주차 접기 상태)');
            } else {
                sessionStorage.setItem('protoNavStateOnLoad', 'krs-week1-all');
                window.location.href = window.location.pathname.includes('/pages/') ? 'home.html' : 'pages/home.html';
            }

            this.refreshUI();
        },

        // === 웅진북클럽 상태 적용 함수들 ===
        applyBookclubBeforeTrial() {
            console.log('[ProtoNav] 웅진북클럽 무체 신청 전');

            // 초기 상태로 리셋
            sessionStorage.removeItem('trialApplied');
            sessionStorage.removeItem('trialEnded');
            sessionStorage.setItem('protoNavStateOnLoad', 'bookclub-before-trial');

            if (pageName === 'home2') {
                this.toast('✅ 무체 신청 전 상태 적용');
                location.reload();
            } else {
                window.location.href = window.location.pathname.includes('/pages/') ? 'home2.html' : 'pages/home2.html';
            }
        },

        applyBookclubTrialComplete() {
            console.log('[ProtoNav] 웅진북클럽 무체 신청 완료 → KRS 홈 (1주차 시작) 이동');
            this.toast('✅ 무체 신청 완료! KRS 1주차가 시작됩니다');

            // 무체 신청 완료 플래그 설정
            sessionStorage.setItem('trialApplied', 'true');
            sessionStorage.removeItem('trialEnded');

            // 웅진북클럽 KRS로 앱 상태 변경
            sessionStorage.setItem('selectedApp', 'bookclub-krs');
            sessionStorage.removeItem('hideLibraryMenu');

            // 1주차 시작 상태 플래그 설정
            sessionStorage.setItem('protoNavStateOnLoad', 'krs-week1-start');

            // KRS 홈(home.html)으로 이동
            window.location.href = window.location.pathname.includes('/pages/') ? 'home.html' : 'pages/home.html';
        },

        applyBookclubTrialEnd() {
            console.log('[ProtoNav] 웅진북클럽 무체 종료');

            // 무체 종료 플래그 설정
            sessionStorage.setItem('trialApplied', 'true');
            sessionStorage.setItem('trialEnded', 'true');

            if (pageName === 'home2') {
                this.toast('✅ 무체 종료 상태 적용');
                location.reload();
            } else {
                window.location.href = window.location.pathname.includes('/pages/') ? 'home2.html' : 'pages/home2.html';
            }
        },

        /**
         * 페이지별 시나리오 카테고리 등록
         * @param {Array} categories - [{ title, badge, buttons: [{ icon, label, onClick }] }]
         */
        registerScenarios(categories) {
            const container = document.getElementById('proto-nav-scenarios');
            if (!container) return;

            categories.forEach(cat => {
                const catDiv = document.createElement('div');
                catDiv.className = 'proto-nav-category';

                const catBtn = document.createElement('button');
                catBtn.className = 'proto-nav-cat-btn';
                catBtn.innerHTML = `<span>&#9654; ${cat.title}</span><span class="proto-nav-cat-badge">${cat.badge || ''}</span>`;
                catBtn.onclick = function () { ProtoNav.toggleCategory(this); };

                const optionsDiv = document.createElement('div');
                optionsDiv.className = 'proto-nav-options proto-nav-collapsed';

                cat.buttons.forEach(b => {
                    if (b.type === 'week-btns') {
                        // 주차 버튼 특수 처리
                        const weekDiv = document.createElement('div');
                        weekDiv.className = 'proto-nav-week-btns';
                        [1, 2, 3, 4].forEach(w => {
                            const wb = document.createElement('button');
                            wb.textContent = w + '주차';
                            wb.onclick = b.onClick.bind(null, w);
                            weekDiv.appendChild(wb);
                        });
                        optionsDiv.appendChild(weekDiv);
                    } else {
                        const btn = document.createElement('button');
                        btn.innerHTML = `<i class="fa-solid ${b.icon}"></i> ${b.label}`;
                        btn.onclick = b.onClick;
                        optionsDiv.appendChild(btn);
                    }
                });

                catDiv.appendChild(catBtn);
                catDiv.appendChild(optionsDiv);
                container.appendChild(catDiv);
            });
        },

        // 공통 시나리오
        commonScenario: {
            fullReset() {
                sessionStorage.clear();
                localStorage.clear();
                ProtoNav.toast('전체 리셋 (새로고침)');
                setTimeout(() => location.reload(), 500);
            },
            goHome() {
                // pages/ 내부인지 확인
                const inPages = currentPath.includes('/pages/');
                window.location.href = inPages ? 'home.html' : 'pages/home.html';
            }
        }
    };

    // ===== 초기화 =====
    function init() {
        injectHTML();

        // 디폴트 닫힘
        const panel = document.getElementById('proto-nav-panel');
        const btn = document.getElementById('proto-nav-toggle');
        if (panel) panel.classList.add('proto-nav-hidden');
        if (btn) btn.classList.remove('active');

        // 드래그 초기화
        ProtoNav.initDrag();

        // 약간의 딜레이 후 상태 업데이트 (페이지 변수 로드 대기)
        setTimeout(() => {
            ProtoNav.updateStatus();

            // 페이지 로드 시 저장된 상태 적용
            const stateOnLoad = sessionStorage.getItem('protoNavStateOnLoad');
            if (stateOnLoad) {
                sessionStorage.removeItem('protoNavStateOnLoad');
                setTimeout(() => {
                    ProtoNav.applyStateScenario(stateOnLoad);
                }, 300);
            }
        }, 500);
    }

    // DOM 준비 후 실행
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 단축키: Ctrl+Shift+P
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
            e.preventDefault();
            ProtoNav.toggle();
        }
    });
})();

/* ============================================
   북클럽 3.0 - 사이드바 JavaScript
   ============================================ */

/**
 * 사이드바 로드 및 초기화
 * @param {string} currentPage - 현재 페이지 이름 (예: 'home', 'library')
 */
async function loadSidebar(currentPage) {
    const container = document.getElementById('sidebar-container');
    if (!container) {
        console.warn('sidebar-container not found');
        return;
    }

    try {
        // 사이드바 HTML 로드
        const response = await fetch('../components/sidebar.html');
        if (!response.ok) throw new Error('Failed to load sidebar');

        const html = await response.text();
        container.innerHTML = html;

        // 현재 페이지 하이라이트
        highlightCurrentNav(currentPage);

        // 로그아웃 버튼 이벤트 바인딩
        bindLogoutButtons();

        // 사용자 정보 표시
        displayUserInfo();

        // 앱 선택 상태 복원
        const savedApp = sessionStorage.getItem('selectedApp') || 'bookclub-krs';
        applyAppNavVisibility(savedApp);
        restoreAppCheckIcons(savedApp);

        // 모바일 하단 네비게이션 렌더링
        renderBottomNav(currentPage);

        // AI 버디 플로팅 버튼 렌더링
        renderFloatingBuddy(currentPage);

    } catch (error) {
        console.error('Error loading sidebar:', error);
        // 폴백: 인라인 사이드바 사용
        loadInlineSidebar(container, currentPage);
    }
}

/**
 * 로그아웃 모달 로드
 */
async function loadLogoutModal() {
    const container = document.getElementById('logout-modal-container');
    if (!container) return;

    try {
        const response = await fetch('../components/logout-modal.html');
        if (!response.ok) throw new Error('Failed to load logout modal');

        const html = await response.text();
        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading logout modal:', error);
        // 폴백: 인라인 모달 사용
        loadInlineLogoutModal(container);
    }
}

/**
 * 현재 페이지 네비게이션 하이라이트
 * @param {string} currentPage - 현재 페이지 이름
 */
function highlightCurrentNav(currentPage) {
    const navLinks = document.querySelectorAll('.nav-link, [data-page]');

    navLinks.forEach(link => {
        const page = link.getAttribute('data-page') || link.getAttribute('href')?.replace('.html', '');

        // 기존 스타일 제거
        link.classList.remove('bg-brand-primary', 'text-white', 'shadow-floating');
        link.classList.add('text-gray-500', 'hover:bg-orange-50', 'hover:text-brand-primary');

        // 현재 페이지 스타일 적용
        if (page === currentPage) {
            link.classList.remove('text-gray-500', 'hover:bg-orange-50', 'hover:text-brand-primary');
            link.classList.add('bg-brand-primary', 'text-white', 'shadow-floating', 'transform', 'hover:scale-[1.02]');
        }
    });
}

/**
 * 로그아웃 버튼 이벤트 바인딩
 */
function bindLogoutButtons() {
    const logoutBtns = document.querySelectorAll('[data-logout]');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', showLogoutModal);
    });
}

/**
 * 사용자 정보 표시
 */
function displayUserInfo() {
    if (typeof AppState !== 'undefined') {
        const userInfo = AppState.getUserInfo();

        const nameElements = document.querySelectorAll('[data-user-name]');
        nameElements.forEach(el => {
            el.textContent = userInfo.name || '우희';
        });
    }
}

/**
 * 모바일 사이드바 토글
 */
function toggleSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (sidebar) {
        sidebar.classList.toggle('open');
    }
    if (overlay) {
        overlay.classList.toggle('active');
    }
}

/**
 * 모바일 사이드바 닫기
 */
function closeSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (sidebar) {
        sidebar.classList.remove('open');
    }
    if (overlay) {
        overlay.classList.remove('active');
    }
}

/**
 * 앱 메뉴 토글 (로고 클릭 시)
 */
let isAppMenuOpen = false;

function toggleAppMenu() {
    const appMenu = document.getElementById('app-menu');
    const logoArrow = document.getElementById('logo-arrow');

    isAppMenuOpen = !isAppMenuOpen;

    if (isAppMenuOpen) {
        // 앱 메뉴 열기 (오버레이 방식)
        appMenu.classList.remove('hidden');
        logoArrow.classList.add('rotate');
    } else {
        // 앱 메뉴 닫기
        appMenu.classList.add('hidden');
        logoArrow.classList.remove('rotate');
    }
}

/**
 * 앱 선택
 */
function selectApp(appId) {
    const apps = {
        'bookclub-krs': { name: '웅진북클럽 KRS', home: 'home.html' },
        bookclub:       { name: '웅진북클럽',     home: 'home2.html' },
        'bookclub-b2c': { name: '북클럽 B2C',     home: 'home.html' },
        'smart-thinkbig': { name: '스마트씽크빅', home: 'smart-thinkbig.html' },
        smartall:       { name: '스마트올',       home: 'smartall.html' },
        superpot:       { name: '슈퍼팟',         home: 'superpot.html' },
        lingocity:      { name: '링고시티',       home: 'lingocity.html' }
    };

    // 체크 아이콘 업데이트
    restoreAppCheckIcons(appId);

    // 앱 상태 저장
    sessionStorage.setItem('selectedApp', appId);

    // hideLibraryMenu 플래그 초기화 (사용자가 명시적으로 앱을 선택한 경우)
    sessionStorage.removeItem('hideLibraryMenu');

    // 네비게이션 가시성 업데이트
    applyAppNavVisibility(appId);

    // 앱 이동 처리
    const targetHome = apps[appId].home;
    const currentPage = window.location.pathname.split('/').pop();

    setTimeout(() => {
        toggleAppMenu();
        // 페이지 이동이 필요한 경우
        if (currentPage !== targetHome) {
            window.location.href = targetHome;
        }
    }, 200);
}

/**
 * 앱 선택에 따른 네비게이션 가시성 적용
 */
function applyAppNavVisibility(appId) {
    const krsOnlyItems = document.querySelectorAll('[data-krs-only]');
    const b2cHideItems = document.querySelectorAll('[data-b2c-hide]');
    const homeLink = document.getElementById('nav-home-link');

    // 하단 네비 홈 링크도 함께 처리
    const bottomNavHome = document.querySelector('#bottom-nav .bottom-nav-item');

    // hideLibraryMenu 플래그 확인 (proto-nav에서 설정)
    const hideLibrary = sessionStorage.getItem('hideLibraryMenu') === 'true';

    if (appId === 'bookclub') {
        // KRS 전용 항목 숨기기
        krsOnlyItems.forEach(el => { el.style.display = 'none'; });
        b2cHideItems.forEach(el => { el.style.display = ''; });
        // 홈 링크를 home2.html로 변경
        if (homeLink) { homeLink.href = 'home2.html'; }
        if (bottomNavHome) { bottomNavHome.href = 'home2.html'; }
    } else if (appId === 'bookclub-b2c') {
        // B2C 모드: KRS 도서관 표시, 라이브러리/AI독서도구함/올도전 숨기기
        krsOnlyItems.forEach(el => { el.style.display = 'none'; });
        b2cHideItems.forEach(el => { el.style.display = 'none'; });
        // KRS 도서관만 표시 (data-b2c-show 속성으로 구분)
        const b2cShowItems = document.querySelectorAll('[data-b2c-show]');
        b2cShowItems.forEach(el => { el.style.display = ''; });
        // 홈 링크를 home.html로 변경
        if (homeLink) { homeLink.href = 'home.html'; }
        if (bottomNavHome) { bottomNavHome.href = 'home.html'; }
    } else {
        // 모든 항목 표시 (KRS 모드)
        krsOnlyItems.forEach(el => { el.style.display = ''; });
        b2cHideItems.forEach(el => { el.style.display = ''; });
        // 홈 링크를 home.html로 변경
        if (homeLink) { homeLink.href = 'home.html'; }
        if (bottomNavHome) { bottomNavHome.href = 'home.html'; }
    }

    // hideLibraryMenu 플래그가 true일 경우 라이브러리 메뉴 숨기기
    if (hideLibrary) {
        const libraryLink = document.querySelector('a[href="library.html"]');
        const bottomLibrary = document.querySelector('#bottom-nav a[href="library.html"]');
        if (libraryLink) { libraryLink.style.display = 'none'; }
        if (bottomLibrary) { bottomLibrary.style.display = 'none'; }
    }
}

/**
 * 앱 체크 아이콘 및 로고 라벨 복원
 */
function restoreAppCheckIcons(appId) {
    ['bookclub-krs', 'bookclub', 'bookclub-b2c', 'smart-thinkbig', 'smartall', 'superpot', 'lingocity'].forEach(id => {
        const check = document.getElementById('check-' + id);
        const item = check?.closest('.app-item');
        if (check) {
            if (id === appId) {
                check.classList.remove('hidden');
                item?.classList.add('active');
            } else {
                check.classList.add('hidden');
                item?.classList.remove('active');
            }
        }
    });

    // 로고 KRS 라벨 업데이트
    const krsLabel = document.getElementById('logo-krs-label');
    if (krsLabel) {
        if (appId === 'bookclub-krs') {
            krsLabel.textContent = 'KRS';
        } else if (appId === 'bookclub-b2c') {
            krsLabel.textContent = 'B2C';
        } else {
            krsLabel.textContent = '';
        }
    }
}

/**
 * 폴백: 인라인 사이드바 (fetch 실패 시)
 */
function loadInlineSidebar(container, currentPage) {
    container.innerHTML = `
        <aside class="sidebar" id="main-sidebar">
            <!-- 로고 (드롭다운 트리거) -->
            <div class="px-3 pt-3 pb-3 relative z-20">
                <button onclick="toggleAppMenu()" class="flex items-center gap-2 group" id="logo-btn">
                    <h1 class="font-noto text-[19px] font-bold text-brand-primary tracking-tight">
                        웅진북클럽 <span class="text-gray-400 text-[11px] font-bold" id="logo-krs-label">KRS</span>
                    </h1>
                    <i class="fa-solid fa-chevron-down text-gray-400 text-sm transition-transform duration-300" id="logo-arrow"></i>
                </button>
            </div>

            <!-- 앱 선택 메뉴 (드롭다운 - 오버레이) -->
            <div id="app-menu" class="hidden absolute left-0 right-0 top-[42px] bottom-[50px] z-10 px-2 py-2 bg-white/95 backdrop-blur-sm animate-fadeIn overflow-y-auto">
                <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-1.5 space-y-0.5">
                    <button onclick="selectApp('bookclub-krs')" class="app-item active w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition-all">
                        <div class="w-9 h-9 bg-gradient-to-br from-brand-primary to-brand-dark rounded-xl flex items-center justify-center text-white text-base shadow-md">📖</div>
                        <div class="text-left flex-1 min-w-0">
                            <p class="font-noto text-sm text-gray-800 truncate">웅진북클럽 KRS</p>
                            <p class="text-[10px] text-gray-400">AI 독서 프로그램</p>
                        </div>
                        <i class="fa-solid fa-check text-brand-primary text-sm" id="check-bookclub-krs"></i>
                    </button>
                    <button onclick="selectApp('bookclub')" class="app-item w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition-all hover:bg-white">
                        <div class="w-9 h-9 bg-gradient-to-br from-brand-primary to-orange-500 rounded-xl flex items-center justify-center text-white text-base shadow-md">📚</div>
                        <div class="text-left flex-1 min-w-0">
                            <p class="font-noto text-sm text-gray-800 truncate">웅진북클럽</p>
                            <p class="text-[10px] text-gray-400">독서 · 학습</p>
                        </div>
                        <i class="fa-solid fa-check text-brand-primary text-sm hidden" id="check-bookclub"></i>
                    </button>
                    <button onclick="selectApp('bookclub-b2c')" class="app-item w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition-all hover:bg-white">
                        <div class="w-9 h-9 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-xl flex items-center justify-center text-white text-base shadow-md">📕</div>
                        <div class="text-left flex-1 min-w-0">
                            <p class="font-noto text-sm text-gray-800 truncate">북클럽 B2C</p>
                            <p class="text-[10px] text-gray-400">개인 독서</p>
                        </div>
                        <i class="fa-solid fa-check text-brand-primary text-sm hidden" id="check-bookclub-b2c"></i>
                    </button>
                    <button onclick="selectApp('smart-thinkbig')" class="app-item w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition-all hover:bg-white">
                        <div class="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center text-white text-base shadow-md">🧠</div>
                        <div class="text-left flex-1 min-w-0">
                            <p class="font-noto text-sm text-gray-800 truncate">스마트씽크빅</p>
                            <p class="text-[10px] text-gray-400">사고력 · 창의력</p>
                        </div>
                        <i class="fa-solid fa-check text-brand-primary text-sm hidden" id="check-smart-thinkbig"></i>
                    </button>
                    <button onclick="selectApp('smartall')" class="app-item w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition-all hover:bg-white">
                        <div class="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white text-base shadow-md">🎓</div>
                        <div class="text-left flex-1 min-w-0">
                            <p class="font-noto text-sm text-gray-800 truncate">스마트올</p>
                            <p class="text-[10px] text-gray-400">전과목 학습</p>
                        </div>
                        <i class="fa-solid fa-check text-brand-primary text-sm hidden" id="check-smartall"></i>
                    </button>
                    <button onclick="selectApp('superpot')" class="app-item w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition-all hover:bg-white">
                        <div class="w-9 h-9 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center text-white text-base shadow-md">🎮</div>
                        <div class="text-left flex-1 min-w-0">
                            <p class="font-noto text-sm text-gray-800 truncate">슈퍼팟</p>
                            <p class="text-[10px] text-gray-400">게임 · 활동</p>
                        </div>
                        <i class="fa-solid fa-check text-brand-primary text-sm hidden" id="check-superpot"></i>
                    </button>
                    <button onclick="selectApp('lingocity')" class="app-item w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition-all hover:bg-white">
                        <div class="w-9 h-9 bg-gradient-to-br from-green-400 to-teal-500 rounded-xl flex items-center justify-center text-white text-base shadow-md">🌍</div>
                        <div class="text-left flex-1 min-w-0">
                            <p class="font-noto text-sm text-gray-800 truncate">링고시티</p>
                            <p class="text-[10px] text-gray-400">영어 학습</p>
                        </div>
                        <i class="fa-solid fa-check text-brand-primary text-sm hidden" id="check-lingocity"></i>
                    </button>
                </div>
            </div>

            <!-- 프로필 카드 -->
            <div id="profile-section" class="mx-3 mb-4 p-3 bg-gradient-to-br from-brand-bg to-yellow-200 rounded-2xl flex items-center gap-3 shadow-sm transition-all duration-300">
                <div class="relative">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-orange-300 to-brand-primary flex items-center justify-center text-2xl border-2 border-white shadow-md">🔥</div>
                    <div class="absolute -bottom-1 -right-1 bg-gradient-to-r from-brand-primary to-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                        <i class="fa-solid fa-star text-yellow-300"></i> Lv.5
                    </div>
                </div>
                <div>
                    <p class="font-noto text-[13px] text-gray-800" data-user-name>우희</p>
                    <p class="text-xs text-gray-500">독서 탐험가</p>
                </div>
            </div>

            <!-- 네비게이션 -->
            <nav id="nav-section" class="flex-1 px-2 space-y-1 overflow-y-auto hide-scrollbar transition-all duration-300">
                <a href="home.html" data-page="home" id="nav-home-link" class="nav-link flex items-center gap-3 px-3 py-3 rounded-2xl transition-all">
                    <i class="fa-solid fa-house text-xl w-6 text-center"></i>
                    <span class="font-noto text-lg tracking-wide">홈</span>
                </a>
                <a href="library.html" data-page="library" data-krs-only data-b2c-show class="nav-link flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors">
                    <i class="fa-solid fa-book-open text-xl w-6 text-center"></i>
                    <span class="font-noto text-lg tracking-wide">KRS 도서관</span>
                </a>
                <a href="book-library.html" data-page="book-library" data-b2c-hide class="nav-link flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors">
                    <i class="fa-solid fa-layer-group text-xl w-6 text-center"></i>
                    <span class="font-noto text-lg tracking-wide">라이브러리</span>
                </a>
                <a href="mypage.html" data-page="mypage" class="nav-link flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors">
                    <i class="fa-solid fa-user text-xl w-6 text-center"></i>
                    <span class="font-noto text-lg tracking-wide">마이페이지</span>
                </a>
                <a href="starshop.html" data-page="starshop" class="nav-link flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors">
                    <i class="fa-solid fa-star text-xl w-6 text-center"></i>
                    <span class="font-noto text-lg tracking-wide">스타샵</span>
                </a>

                <!-- KRS/B2C 전용: AI 독서도구함 -->
                <div data-krs-only data-b2c-show>
                    <div class="pt-4 pb-2 px-2"></div>
                    <a href="ai-buddy.html" data-page="ai-buddy" class="nav-link flex items-center gap-3 px-3 py-3 rounded-2xl transition-all hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 group" style="text-decoration:none;">
                        <span class="text-xl w-6 text-center">🧰</span>
                        <span class="font-noto text-lg tracking-wide group-hover:text-purple-600 transition-colors">AI 독서도구함</span>
                    </a>
                </div>

                <!-- KRS/B2C 전용: 북클럽 도전 -->
                <div data-krs-only data-b2c-show>
                    <a href="all-challenge.html" data-page="all-challenge" class="nav-link flex items-center gap-3 px-3 py-3 rounded-2xl transition-all hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 group" style="text-decoration:none;">
                        <span class="text-xl w-6 text-center">♥️</span>
                        <span class="font-noto text-lg tracking-wide group-hover:text-purple-600 transition-colors">북클럽 도전</span>
                    </a>
                </div>
            </nav>
            <!-- 푸터 -->
            <div class="p-4 pt-0 relative z-20 bg-white">
                <div class="flex items-center justify-between text-gray-400 mb-2 px-1">
                    <button onclick="window.location.href='settings.html'" class="hover:text-brand-primary text-sm font-medium">
                        <i class="fa-solid fa-gear mr-2"></i>설정
                    </button>
                    <button data-logout class="hover:text-red-400 text-sm font-medium">
                        <i class="fa-solid fa-right-from-bracket mr-2"></i>로그아웃
                    </button>
                </div>
            </div>
        </aside>
        <style>
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
            .app-item.active { background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            #logo-arrow.rotate { transform: rotate(180deg); }
        </style>
    `;
    highlightCurrentNav(currentPage);
    bindLogoutButtons();

    // 앱 선택 상태 복원
    const savedApp = sessionStorage.getItem('selectedApp') || 'bookclub-krs';
    applyAppNavVisibility(savedApp);
    restoreAppCheckIcons(savedApp);

    // 모바일 하단 네비게이션 렌더링
    renderBottomNav(currentPage);

    // AI 버디 플로팅 버튼 렌더링
    renderFloatingBuddy(currentPage);
}

/**
 * 폴백: 인라인 로그아웃 모달 (fetch 실패 시)
 */
function loadInlineLogoutModal(container) {
    container.innerHTML = `
        <div id="logout-modal" class="hidden fixed inset-0 z-[10000] items-center justify-center">
            <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="hideLogoutModal()"></div>
            <div class="relative bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 animate-pop-in">
                <div class="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                    <i class="fa-solid fa-right-from-bracket text-2xl text-brand-primary"></i>
                </div>
                <h3 class="font-noto text-xl text-center text-gray-800 mb-2">로그아웃 하시겠어요?</h3>
                <p class="text-sm text-gray-500 text-center mb-6">다음에 또 만나요! 📚</p>
                <div class="flex gap-3">
                    <button onclick="hideLogoutModal()" class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors">취소</button>
                    <button onclick="performLogout()" class="flex-1 py-3 rounded-xl bg-brand-primary text-white font-bold hover:bg-orange-600 shadow-md transition-colors">확인</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * 모바일 하단 네비게이션 바 렌더링
 * @param {string} currentPage - 현재 페이지 이름
 */
function renderBottomNav(currentPage) {
    // 중복 생성 방지
    if (document.getElementById('bottom-nav')) return;

    const savedApp = sessionStorage.getItem('selectedApp') || 'bookclub-krs';
    const isKRS = (savedApp === 'bookclub-krs');
    const isB2C = (savedApp === 'bookclub-b2c');
    const homeHref = (savedApp === 'bookclub') ? 'home2.html' : 'home.html';

    const navItems = [
        { id: 'home', href: homeHref, icon: 'fa-solid fa-house', label: '홈' },
        { id: 'library', href: 'library.html', icon: 'fa-solid fa-book-open', label: '도서관', krsOnly: true, b2cShow: true },
        { id: 'book-library', href: 'book-library.html', icon: 'fa-solid fa-layer-group', label: '라이브러리', b2cHide: true },
        { id: 'mypage', href: 'mypage.html', icon: 'fa-solid fa-user', label: '마이페이지' },
    ];

    const nav = document.createElement('nav');
    nav.id = 'bottom-nav';
    nav.className = 'bottom-nav';

    let inner = '<div class="bottom-nav-inner">';
    navItems.forEach(item => {
        let attrs = '';
        let hiddenStyle = '';

        if (item.krsOnly) attrs += ' data-krs-only';
        if (item.b2cShow) attrs += ' data-b2c-show';
        if (item.b2cHide) attrs += ' data-b2c-hide';

        // 가시성 결정
        if (savedApp === 'bookclub') {
            // 웅진북클럽: krsOnly 항목 숨김
            if (item.krsOnly) hiddenStyle = ' style="display:none"';
        } else if (isB2C) {
            // B2C: krsOnly 기본 숨김, b2cShow만 표시, b2cHide 숨김
            if (item.krsOnly && !item.b2cShow) hiddenStyle = ' style="display:none"';
            if (item.b2cHide) hiddenStyle = ' style="display:none"';
        }

        const isActive = (item.id === currentPage) || (item.id === 'home' && currentPage === 'home2');
        const activeClass = isActive ? ' active' : '';

        const iconEl = '<i class="' + item.icon + '"></i>';

        inner += '<a href="' + item.href + '" class="bottom-nav-item' + activeClass + '"' + attrs + hiddenStyle + '>'
            + iconEl + '<span>' + item.label + '</span></a>';
    });
    inner += '</div>';
    nav.innerHTML = inner;

    document.body.appendChild(nav);
}

/**
 * AI 버디 플로팅 버튼 렌더링 (모바일 우측 하단)
 * @param {string} currentPage - 현재 페이지 이름
 */
function renderFloatingBuddy(currentPage) {
    // 중복 생성 방지
    if (document.getElementById('floating-buddy')) return;
    // AI 버디 페이지에서는 표시하지 않음
    if (currentPage === 'ai-buddy') return;

    const savedApp = sessionStorage.getItem('selectedApp') || 'bookclub-krs';
    const isKRS = (savedApp === 'bookclub-krs');
    const isB2C = (savedApp === 'bookclub-b2c');

    const btn = document.createElement('a');
    btn.id = 'floating-buddy';
    btn.href = 'ai-buddy.html';
    btn.className = 'floating-buddy';
    btn.setAttribute('data-krs-only', '');
    btn.setAttribute('data-b2c-show', '');
    // KRS 또는 B2C 모드에서만 표시 (웅진북클럽 등에서는 숨김)
    if (!isKRS && !isB2C) btn.style.display = 'none';

    btn.innerHTML = '<span class="floating-buddy-emoji">🐿️</span>'
        + '<span class="floating-buddy-pulse"></span>';

    document.body.appendChild(btn);
}

/**
 * 검색 오버레이 로드
 */
async function loadSearchOverlay() {
    // 이미 로드된 경우 스킵
    if (document.getElementById('search-overlay')) return;

    try {
        const response = await fetch('../components/search-overlay.html');
        if (!response.ok) throw new Error('Failed to load search overlay');

        const html = await response.text();
        document.body.insertAdjacentHTML('beforeend', html);

        console.log('✅ 검색 오버레이 로드 완료');
        initializeSearchOverlay();
    } catch (error) {
        console.error('Error loading search overlay:', error);
    }
}

/**
 * 검색 오버레이 열기
 */
function openSearchOverlay() {
    // 오버레이가 아직 로드되지 않았으면 로드
    if (!document.getElementById('search-overlay')) {
        loadSearchOverlay().then(() => {
            showSearchOverlay();
        });
    } else {
        showSearchOverlay();
    }
}

/**
 * 검색 오버레이 표시
 */
function showSearchOverlay() {
    const overlay = document.getElementById('search-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        const input = document.getElementById('search-input');
        if (input) {
            setTimeout(() => input.focus(), 100);
        }
    }
}

/**
 * 검색 오버레이 닫기
 */
function closeSearchOverlay() {
    const overlay = document.getElementById('search-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

// 전역으로 내보내기
window.loadSidebar = loadSidebar;
window.loadLogoutModal = loadLogoutModal;
window.highlightCurrentNav = highlightCurrentNav;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.toggleAppMenu = toggleAppMenu;
window.selectApp = selectApp;
window.applyAppNavVisibility = applyAppNavVisibility;
window.restoreAppCheckIcons = restoreAppCheckIcons;
window.renderBottomNav = renderBottomNav;
window.renderFloatingBuddy = renderFloatingBuddy;
window.loadSearchOverlay = loadSearchOverlay;
window.openSearchOverlay = openSearchOverlay;
window.closeSearchOverlay = closeSearchOverlay;

/* ============================================
   북클럽 3.0 - 공통 JavaScript
   ============================================ */

/**
 * 앱 상태 관리 (세션 스토리지 기반)
 */
const AppState = {
    // 로그인 상태
    isLoggedIn: () => sessionStorage.getItem('isLoggedIn') === 'true',
    setLoggedIn: (value) => sessionStorage.setItem('isLoggedIn', value.toString()),

    // 현재 페이지 저장 (뒤로가기용)
    setReferrer: (page) => sessionStorage.setItem('referrer', page),
    getReferrer: () => sessionStorage.getItem('referrer') || 'home.html',

    // 사용자 정보
    getUserInfo: () => {
        const info = sessionStorage.getItem('userInfo');
        return info ? JSON.parse(info) : { name: '우희', birth: '2015-03-15' };
    },
    setUserInfo: (info) => sessionStorage.setItem('userInfo', JSON.stringify(info)),

    // 현재 페이지 이름
    getCurrentPage: () => {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        return filename.replace('.html', '');
    },

    // 클리어
    clear: () => sessionStorage.clear()
};

/**
 * 페이지 네비게이션
 */
function navigateTo(page) {
    // 현재 페이지를 referrer로 저장
    AppState.setReferrer(window.location.pathname.split('/').pop());

    // 페이지 이동
    if (page.endsWith('.html')) {
        window.location.href = page;
    } else {
        window.location.href = page + '.html';
    }
}

/**
 * 뒤로가기 (전체화면 모달에서 사용)
 */
function goBack() {
    const referrer = AppState.getReferrer();
    if (referrer && referrer !== window.location.pathname.split('/').pop()) {
        window.location.href = referrer;
    } else {
        window.location.href = 'home.html';
    }
}

/**
 * AI 도구 열기 (referrer 저장 후 이동)
 */
function openTool(toolName) {
    // 현재 페이지를 referrer로 저장
    const currentPage = window.location.pathname.split('/').pop();
    AppState.setReferrer(currentPage);

    // 도구 페이지로 이동
    window.location.href = toolName + '.html';
}

/**
 * 로그인 체크 (보호된 페이지용)
 */
function checkAuth() {
    if (!AppState.isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

/**
 * 로그아웃 처리
 */
function performLogout() {
    AppState.clear();
    window.location.href = 'login.html';
}

/**
 * 로그아웃 확인 모달 표시
 */
function showLogoutModal() {
    const modal = document.getElementById('logout-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

/**
 * 로그아웃 모달 닫기
 */
function hideLogoutModal() {
    const modal = document.getElementById('logout-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * 사용자 정보 표시
 */
function displayUserInfo() {
    const userInfo = AppState.getUserInfo();

    // 이름 표시
    const nameElements = document.querySelectorAll('[data-user-name]');
    nameElements.forEach(el => {
        el.textContent = userInfo.name;
    });

    // 인사말 표시
    const greetingElements = document.querySelectorAll('[data-user-greeting]');
    greetingElements.forEach(el => {
        el.textContent = `${userInfo.name}님, 안녕!`;
    });
}

/**
 * 현재 날짜/시간 관련 유틸리티
 */
const DateUtils = {
    getGreeting: () => {
        const hour = new Date().getHours();
        if (hour < 12) return '좋은 아침이에요';
        if (hour < 18) return '좋은 오후예요';
        return '좋은 저녁이에요';
    },

    formatDate: (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
    },

    getWeekday: () => {
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        return days[new Date().getDay()];
    }
};

/**
 * 애니메이션 유틸리티
 */
const AnimUtils = {
    fadeIn: (element, duration = 300) => {
        element.style.opacity = 0;
        element.style.display = 'block';

        let start = null;
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            element.style.opacity = Math.min(progress / duration, 1);
            if (progress < duration) {
                requestAnimationFrame(animate);
            }
        }
        requestAnimationFrame(animate);
    },

    fadeOut: (element, duration = 300) => {
        let start = null;
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            element.style.opacity = Math.max(1 - progress / duration, 0);
            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        }
        requestAnimationFrame(animate);
    }
};

/**
 * 디바운스 유틸리티
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 페이지 초기화 (공통)
 */
document.addEventListener('DOMContentLoaded', () => {
    // 사용자 정보 표시
    displayUserInfo();

    // 로그아웃 버튼 이벤트
    const logoutBtns = document.querySelectorAll('[data-logout]');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', showLogoutModal);
    });

    // 모달 닫기 (배경 클릭)
    const modalOverlays = document.querySelectorAll('.modal-overlay');
    modalOverlays.forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.add('hidden');
                overlay.classList.remove('flex');
            }
        });
    });
});

/**
 * 찜하기 (즐겨찾기) 관리 — sessionStorage 기반
 */
const Favorites = {
    _key: 'favoriteBooks',

    getAll: () => {
        return JSON.parse(sessionStorage.getItem(Favorites._key) || '[]');
    },

    isFavorite: (bookId) => {
        return Favorites.getAll().some(b => b.id === bookId);
    },

    toggle: (book) => {
        // book = { id, title, genre, bg }
        let list = Favorites.getAll();
        const idx = list.findIndex(b => b.id === book.id);
        if (idx >= 0) {
            list.splice(idx, 1);
        } else {
            list.push(book);
        }
        sessionStorage.setItem(Favorites._key, JSON.stringify(list));
        return idx < 0; // true = 추가됨, false = 제거됨
    }
};

// 전역으로 내보내기
window.Favorites = Favorites;
window.AppState = AppState;
window.navigateTo = navigateTo;
window.goBack = goBack;
window.openTool = openTool;
window.checkAuth = checkAuth;
window.performLogout = performLogout;
window.showLogoutModal = showLogoutModal;
window.hideLogoutModal = hideLogoutModal;
window.DateUtils = DateUtils;
window.AnimUtils = AnimUtils;
window.debounce = debounce;

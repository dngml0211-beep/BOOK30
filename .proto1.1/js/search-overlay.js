/* ============================================
   북클럽 3.0 - 검색 오버레이 컨트롤러
   ============================================ */

// 검색 상태
let searchState = {
    query: '',
    genreFilter: 'all',
    krsFilterOn: true,
    sortBy: 'relevance',
    userKrs: 3,
    books: [],
    autocompleteIndex: -1
};

/**
 * 검색 오버레이 초기화
 */
function initializeSearchOverlay() {
    // DOM 요소
    const searchInput = document.getElementById('search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');
    const searchCloseBtn = document.getElementById('search-close-btn');
    const krsFilterToggle = document.getElementById('krs-filter-toggle');
    const sortSelect = document.getElementById('sort-select');
    const genreFilters = document.querySelectorAll('#genre-filters .filter-chip');
    const clearHistoryBtn = document.getElementById('clear-history-btn');

    // 사용자 KRS 레벨 가져오기
    const userInfo = AppState?.getUserInfo();
    if (userInfo && userInfo.level) {
        const krsMatch = userInfo.level.match(/K(\d+)/);
        if (krsMatch) {
            searchState.userKrs = parseInt(krsMatch[1]);
        }
    }

    // 샘플 데이터 로드 (나중에 API로 교체)
    loadSampleBooks();

    // 이벤트 리스너
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('keydown', handleKeyDown);
    searchClearBtn.addEventListener('click', clearSearch);
    searchCloseBtn.addEventListener('click', closeSearchOverlay);
    krsFilterToggle.addEventListener('change', handleKrsFilterToggle);
    sortSelect.addEventListener('change', handleSortChange);

    genreFilters.forEach(btn => {
        btn.addEventListener('click', () => handleGenreFilter(btn));
    });

    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearSearchHistory);
    }

    // 초기 화면 표시
    showSearchHistory();
    performSearch();

    console.log('✅ 검색 오버레이 초기화 완료');
}

/**
 * 샘플 도서 데이터 로드
 */
function loadSampleBooks() {
    // 나중에 OpenSearch API로 교체
    searchState.books = [
        {id:1, title:'신비아파트', author:'서울문화사', publisher:'서울문화사', genre:'만화', krsLevel:3, ageMin:7, ageMax:10, series:'신비아파트', cover:'📚', rating:4.8, reviews:1234, popularity:95},
        {id:2, title:'신비한 마법의 성', author:'김마법', publisher:'마법출판사', genre:'판타지', krsLevel:3, ageMin:8, ageMax:11, series:null, cover:'🏰', rating:4.5, reviews:567, popularity:78},
        {id:3, title:'또봇', author:'레트로봇', publisher:'영실업', genre:'만화', krsLevel:3, ageMin:5, ageMax:8, series:'또봇', cover:'🤖', rating:4.7, reviews:890, popularity:88},
        {id:4, title:'타요 버스', author:'아이코닉스', publisher:'키즈랜드', genre:'동화', krsLevel:2, ageMin:3, ageMax:6, series:'타요', cover:'🚌', rating:4.9, reviews:2345, popularity:92},
        {id:5, title:'공룡 대탐험', author:'김공룡', publisher:'과학나라', genre:'과학', krsLevel:4, ageMin:9, ageMax:12, series:null, cover:'🦕', rating:4.6, reviews:456, popularity:72},
        {id:6, title:'심쿵 바다 여행', author:'이바다', publisher:'바다출판', genre:'동화', krsLevel:2, ageMin:4, ageMax:7, series:null, cover:'🐠', rating:4.4, reviews:321, popularity:65},
        {id:7, title:'모험왕 탐험대', author:'박모험', publisher:'탐험출판', genre:'모험', krsLevel:3, ageMin:8, ageMax:11, series:'모험왕', cover:'🗺️', rating:4.7, reviews:678, popularity:81},
        {id:8, title:'숲속 친구들', author:'최나무', publisher:'숲출판사', genre:'동화', krsLevel:2, ageMin:4, ageMax:7, series:null, cover:'🌲', rating:4.8, reviews:543, popularity:76},
        {id:9, title:'우주 탐험', author:'강우주', publisher:'우주과학', genre:'과학', krsLevel:5, ageMin:10, ageMax:13, series:'우주탐험', cover:'🚀', rating:4.5, reviews:234, popularity:68},
        {id:10, title:'마법 학교', author:'정마법', publisher:'마법출판', genre:'판타지', krsLevel:4, ageMin:9, ageMax:12, series:'마법학교', cover:'🧙', rating:4.9, reviews:1567, popularity:89},
    ];
}

/**
 * 검색 입력 핸들러
 */
function handleSearchInput(e) {
    searchState.query = e.target.value;
    const searchClearBtn = document.getElementById('search-clear-btn');

    if (searchState.query) {
        searchClearBtn.classList.remove('hidden');
        showAutocomplete();
    } else {
        searchClearBtn.classList.add('hidden');
        hideAutocomplete();
        showSearchHistory();
    }

    performSearch();
}

/**
 * 키보드 이벤트 핸들러
 */
function handleKeyDown(e) {
    const autocomplete = document.getElementById('autocomplete-dropdown');
    const items = autocomplete.querySelectorAll('.autocomplete-item');

    if (e.key === 'Escape') {
        closeSearchOverlay();
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        searchState.autocompleteIndex = Math.min(searchState.autocompleteIndex + 1, items.length - 1);
        updateAutocompleteHighlight();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        searchState.autocompleteIndex = Math.max(searchState.autocompleteIndex - 1, -1);
        updateAutocompleteHighlight();
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (searchState.autocompleteIndex >= 0 && items[searchState.autocompleteIndex]) {
            items[searchState.autocompleteIndex].click();
        } else if (searchState.query) {
            SearchHistory.add(searchState.query);
            hideAutocomplete();
            performSearch();
        }
    }
}

/**
 * 검색어 초기화
 */
function clearSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.value = '';
    searchState.query = '';
    document.getElementById('search-clear-btn').classList.add('hidden');
    hideAutocomplete();
    showSearchHistory();
    performSearch();
}

/**
 * 장르 필터 변경
 */
function handleGenreFilter(btn) {
    document.querySelectorAll('#genre-filters .filter-chip').forEach(b => {
        b.classList.remove('active');
    });
    btn.classList.add('active');
    searchState.genreFilter = btn.dataset.genre;
    performSearch();
}

/**
 * KRS 필터 토글
 */
function handleKrsFilterToggle(e) {
    searchState.krsFilterOn = e.target.checked;
    performSearch();
}

/**
 * 정렬 변경
 */
function handleSortChange(e) {
    searchState.sortBy = e.target.value;
    performSearch();
}

/**
 * 검색 실행
 */
function performSearch() {
    const resultsContainer = document.getElementById('search-results');
    const noResults = document.getElementById('no-results');
    const searchHistory = document.getElementById('search-history');

    // 히스토리 숨기기
    if (searchState.query || searchState.genreFilter !== 'all') {
        searchHistory.classList.add('hidden');
    }

    // 검색 실행
    const results = searchBooks(searchState.books, {
        query: searchState.query,
        userKrs: searchState.userKrs,
        krsFilterOn: searchState.krsFilterOn,
        sortBy: searchState.sortBy,
        genreFilter: searchState.genreFilter
    });

    // 결과 표시
    if (results.length === 0) {
        resultsContainer.innerHTML = '';
        noResults.classList.remove('hidden');
    } else {
        noResults.classList.add('hidden');
        renderSearchResults(results);
    }
}

/**
 * 검색 결과 렌더링
 */
function renderSearchResults(results) {
    const container = document.getElementById('search-results');

    container.innerHTML = results.map(book => `
        <div class="search-result-card" onclick="openBook('${book.id}')">
            <div class="result-cover">${book.cover}</div>
            <div class="result-title">${highlightMatch(book.title, searchState.query)}</div>
            <div class="result-author">${book.author}</div>
            <span class="result-krs krs-${book.krsLevel}">K${book.krsLevel}</span>
        </div>
    `).join('');
}

/**
 * 자동완성 표시
 */
function showAutocomplete() {
    const suggestions = getAutocompleteSuggestions(searchState.books, searchState.query);
    const dropdown = document.getElementById('autocomplete-dropdown');

    if (suggestions.length === 0) {
        hideAutocomplete();
        return;
    }

    dropdown.innerHTML = suggestions.map((book, index) => `
        <div class="autocomplete-item ${index === searchState.autocompleteIndex ? 'active' : ''}"
             data-index="${index}"
             onclick="selectAutocomplete('${book.title}')">
            <div class="autocomplete-title">${highlightMatch(book.title, searchState.query)}</div>
            <div class="autocomplete-meta">${book.author} · K${book.krsLevel}</div>
        </div>
    `).join('');

    dropdown.classList.remove('hidden');
}

/**
 * 자동완성 숨기기
 */
function hideAutocomplete() {
    const dropdown = document.getElementById('autocomplete-dropdown');
    dropdown.classList.add('hidden');
    searchState.autocompleteIndex = -1;
}

/**
 * 자동완성 하이라이트 업데이트
 */
function updateAutocompleteHighlight() {
    const items = document.querySelectorAll('.autocomplete-item');
    items.forEach((item, index) => {
        if (index === searchState.autocompleteIndex) {
            item.classList.add('active');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('active');
        }
    });
}

/**
 * 자동완성 선택
 */
function selectAutocomplete(title) {
    const searchInput = document.getElementById('search-input');
    searchInput.value = title;
    searchState.query = title;
    SearchHistory.add(title);
    hideAutocomplete();
    performSearch();
}

/**
 * 검색 히스토리 표시
 */
function showSearchHistory() {
    const historyContainer = document.getElementById('search-history');
    const historyItems = document.getElementById('history-items');
    const history = SearchHistory.get();

    if (history.length === 0) {
        historyContainer.classList.add('hidden');
        return;
    }

    historyItems.innerHTML = history.map(query => `
        <button class="history-item" onclick="selectHistoryItem('${query}')">${query}</button>
    `).join('');

    historyContainer.classList.remove('hidden');
}

/**
 * 히스토리 아이템 선택
 */
function selectHistoryItem(query) {
    const searchInput = document.getElementById('search-input');
    searchInput.value = query;
    searchState.query = query;
    document.getElementById('search-clear-btn').classList.remove('hidden');
    hideAutocomplete();
    performSearch();
}

/**
 * 검색 히스토리 초기화
 */
function clearSearchHistory() {
    SearchHistory.clear();
    document.getElementById('search-history').classList.add('hidden');
}

/**
 * 도서 열기
 */
function openBook(bookId) {
    console.log('도서 열기:', bookId);
    // 여기에 도서 상세 페이지 이동 로직 추가
    // 예: window.location.href = `book-detail.html?id=${bookId}`;
}

// 전역으로 내보내기
window.initializeSearchOverlay = initializeSearchOverlay;
window.selectAutocomplete = selectAutocomplete;
window.selectHistoryItem = selectHistoryItem;
window.openBook = openBook;

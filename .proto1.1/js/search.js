/* ============================================
   북클럽 3.0 - 통합검색 모듈
   ============================================ */

/**
 * 초성 추출 함수
 * @param {string} str - 한글 문자열
 * @returns {string} - 초성만 추출된 문자열
 */
function extractChosung(str) {
    const cho = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
    return str.split('').map(char => {
        const code = char.charCodeAt(0) - 0xAC00;
        if (code > -1 && code < 11172) return cho[Math.floor(code / 588)];
        return char;
    }).join('');
}

/**
 * Edit Distance (Levenshtein Distance) 계산
 * @param {string} a - 첫 번째 문자열
 * @param {string} b - 두 번째 문자열
 * @returns {number} - 편집 거리
 */
function editDistance(a, b) {
    const matrix = [];
    for(let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for(let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for(let i = 1; i <= b.length; i++) {
        for(let j = 1; j <= a.length; j++) {
            if(b.charAt(i-1) === a.charAt(j-1)) {
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i-1][j-1] + 1,
                    matrix[i][j-1] + 1,
                    matrix[i-1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

/**
 * 검색 매칭 함수 (초성, 부분일치, Fuzzy)
 * @param {Object} book - 도서 객체
 * @param {string} query - 검색어
 * @returns {Object} - {match: boolean, score: number, type: string}
 */
function matchSearch(book, query) {
    if (!query) return {match: true, score: 100, type: 'all'};

    const q = query.toLowerCase();
    const title = book.title.toLowerCase();
    const author = book.author?.toLowerCase() || '';
    const chosung = extractChosung(book.title);

    // 1. 제목 정확 매칭
    if (title.includes(q)) return {match: true, score: 100, type: 'exact'};

    // 2. 초성 매칭
    if (chosung.includes(q)) return {match: true, score: 80, type: 'chosung'};

    // 3. 저자 매칭
    if (author.includes(q)) return {match: true, score: 60, type: 'author'};

    // 4. 부분 매칭 (2글자 이상)
    if (q.length >= 2) {
        for(let i = 0; i < title.length - 1; i++) {
            if (title.slice(i, i+q.length) === q) {
                return {match: true, score: 70, type: 'partial'};
            }
        }
    }

    // 5. Fuzzy 매칭 (간단한 Edit Distance)
    if (q.length >= 3 && editDistance(title, q) <= 2) {
        return {match: true, score: 50, type: 'fuzzy'};
    }

    return {match: false, score: 0, type: null};
}

/**
 * 도서 검색 및 필터링
 * @param {Array} books - 도서 목록
 * @param {Object} options - 검색 옵션
 * @returns {Array} - 필터링 및 정렬된 도서 목록
 */
function searchBooks(books, options = {}) {
    const {
        query = '',
        userKrs = 3,
        krsFilterOn = true,
        sortBy = 'relevance', // relevance, latest, popular
        genreFilter = 'all',
        ageFilter = null
    } = options;

    // 검색어가 없고 장르 필터도 없으면 인기 도서 반환
    if (!query && genreFilter === 'all' && !ageFilter) {
        return books
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 12);
    }

    // 검색어 매칭
    let results = books.map(book => ({
        ...book,
        matchInfo: matchSearch(book, query)
    })).filter(book => book.matchInfo.match);

    // 장르 필터
    if (genreFilter !== 'all') {
        results = results.filter(book => book.genre === genreFilter);
    }

    // 연령 필터
    if (ageFilter) {
        results = results.filter(book =>
            book.ageMin <= ageFilter && book.ageMax >= ageFilter
        );
    }

    // KRS 필터
    if (krsFilterOn && userKrs) {
        results = results.filter(book =>
            book.krsLevel >= userKrs - 1 && book.krsLevel <= userKrs + 1
        );
    }

    // KRS 부스팅 스코어 계산
    results = results.map(book => {
        let finalScore = book.matchInfo.score;

        // KRS 레벨 부스팅
        if (book.krsLevel === userKrs) {
            finalScore *= 2.0; // 정확 매칭
        } else if (Math.abs(book.krsLevel - userKrs) === 1) {
            finalScore *= 1.5; // ±1 범위
        }

        // 인기도 가중치
        finalScore += (book.popularity || 0) * 0.1;

        return {...book, finalScore};
    });

    // 정렬
    if (sortBy === 'relevance') {
        results.sort((a, b) => b.finalScore - a.finalScore);
    } else if (sortBy === 'latest') {
        results.sort((a, b) => (b.id || 0) - (a.id || 0));
    } else if (sortBy === 'popular') {
        results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }

    return results;
}

/**
 * 자동완성 제안 생성
 * @param {Array} books - 도서 목록
 * @param {string} query - 검색어
 * @returns {Array} - 자동완성 제안 목록
 */
function getAutocompleteSuggestions(books, query) {
    if (!query || query.length < 1) return [];

    const suggestions = books
        .map(book => {
            const match = matchSearch(book, query);
            return match.match ? {...book, matchInfo: match} : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.matchInfo.score - a.matchInfo.score)
        .slice(0, 5);

    return suggestions;
}

/**
 * 검색 히스토리 관리
 */
const SearchHistory = {
    KEY: 'bc3_search_history',
    MAX_ITEMS: 10,

    get() {
        try {
            const history = localStorage.getItem(this.KEY);
            return history ? JSON.parse(history) : [];
        } catch (e) {
            console.error('Failed to load search history:', e);
            return [];
        }
    },

    add(query) {
        if (!query || !query.trim()) return;

        try {
            let history = this.get();
            // 중복 제거
            history = history.filter(item => item !== query);
            // 최신 검색어를 맨 앞에 추가
            history.unshift(query);
            // 최대 개수 제한
            history = history.slice(0, this.MAX_ITEMS);

            localStorage.setItem(this.KEY, JSON.stringify(history));
        } catch (e) {
            console.error('Failed to save search history:', e);
        }
    },

    clear() {
        try {
            localStorage.removeItem(this.KEY);
        } catch (e) {
            console.error('Failed to clear search history:', e);
        }
    }
};

/**
 * 초성 하이라이트 HTML 생성
 * @param {string} text - 원본 텍스트
 * @param {string} query - 검색어
 * @returns {string} - 하이라이트된 HTML
 */
function highlightMatch(text, query) {
    if (!query) return text;

    const chosung = extractChosung(text);
    const qLower = query.toLowerCase();

    // 초성 매칭인 경우
    if (chosung.includes(qLower)) {
        let highlighted = '';
        let chosungIndex = 0;
        let matchStart = chosung.indexOf(qLower);
        let matchEnd = matchStart + qLower.length;

        for (let i = 0; i < text.length; i++) {
            if (chosungIndex >= matchStart && chosungIndex < matchEnd) {
                highlighted += `<span class="chosung-highlight">${text[i]}</span>`;
            } else {
                highlighted += text[i];
            }
            // 한글인 경우에만 초성 인덱스 증가
            const code = text.charCodeAt(i) - 0xAC00;
            if (code > -1 && code < 11172) {
                chosungIndex++;
            }
        }
        return highlighted;
    }

    // 일반 텍스트 매칭
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="chosung-highlight">$1</span>');
}

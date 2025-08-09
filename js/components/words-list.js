// Компонент для отображения всех слов с кандзи

class WordsList {
    constructor(app) {
        this.app = app;
        this.weekFilter = 'all';
        this.dayFilter = 'all';
        this.searchQuery = '';
        this.sortBy = 'index'; // index, alphabetical, length
        this.init();
    }

    /**
     * Инициализация компонента
     */
    init() {
        if (!this.app.api.isDataLoaded()) {
            console.warn('Данные кандзи не загружены');
            return;
        }

        this.bindEvents();
        this.generateWordsList();
    }

    /**
     * Привязка событий
     */
    bindEvents() {
        // Обработчики фильтров (если есть)
        const weekFilter = document.getElementById('words-week-filter');
        const dayFilter = document.getElementById('words-day-filter');
        const searchInput = document.getElementById('words-search');
        const sortSelect = document.getElementById('words-sort');

        if (weekFilter) {
            weekFilter.addEventListener('change', (e) => {
                this.weekFilter = e.target.value;
                this.filterWords();
            });
        }

        if (dayFilter) {
            dayFilter.addEventListener('change', (e) => {
                this.dayFilter = e.target.value;
                this.filterWords();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.trim();
                this.filterWords();
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.generateWordsList();
            });
        }
    }

    /**
     * Генерация списка всех слов
     */
    generateWordsList() {
        const container = document.getElementById('words-list');
        if (!container) {
            console.error('Контейнер words-list не найден');
            return;
        }

        DOMHelpers.clear(container);

        // Создать фильтры и сортировку
        this.createFiltersAndControls(container);

        // Получить все слова из всех кандзи
        const allWords = this.getAllWords();
        
        // Создать контейнер для слов
        const wordsContainer = DOMHelpers.createElement('div', 'words-container');
        wordsContainer.id = 'words-container';
        
        // Группировать слова по кандзи
        this.renderWordsByKanji(allWords, wordsContainer);
        
        container.appendChild(wordsContainer);

        // Обновить счетчик
        this.updateWordsCount();
    }

    /**
     * Создать фильтры и элементы управления
     * @param {HTMLElement} container - Контейнер
     */
    createFiltersAndControls(container) {
        const controlsDiv = DOMHelpers.createElement('div', 'words-controls');
        
        // Поиск
        const searchDiv = DOMHelpers.createElement('div', 'words-search-group');
        const searchLabel = DOMHelpers.createElement('label', '', 'Поиск слов:');
        const searchInput = DOMHelpers.createElement('input', 'words-search-input');
        searchInput.type = 'text';
        searchInput.id = 'words-search';
        searchInput.placeholder = 'Введите слово на японском или русском...';
        
        searchDiv.appendChild(searchLabel);
        searchDiv.appendChild(searchInput);

        // Сортировка
        const sortDiv = DOMHelpers.createElement('div', 'words-sort-group');
        const sortLabel = DOMHelpers.createElement('label', '', 'Сортировка:');
        const sortSelect = DOMHelpers.createElement('select', 'words-sort-select');
        sortSelect.id = 'words-sort';
        
        const sortOptions = [
            { value: 'index', text: 'По порядку кандзи' },
            { value: 'alphabetical', text: 'По алфавиту (JP)' },
            { value: 'length', text: 'По длине слова' }
        ];

        sortOptions.forEach(option => {
            const optionEl = DOMHelpers.createElement('option', '', option.text);
            optionEl.value = option.value;
            if (option.value === this.sortBy) {
                optionEl.selected = true;
            }
            sortSelect.appendChild(optionEl);
        });

        sortDiv.appendChild(sortLabel);
        sortDiv.appendChild(sortSelect);

        // Счетчик слов
        const countDiv = DOMHelpers.createElement('div', 'words-count');
        countDiv.id = 'words-count';

        controlsDiv.appendChild(searchDiv);
        controlsDiv.appendChild(sortDiv);
        controlsDiv.appendChild(countDiv);

        container.appendChild(controlsDiv);
    }

    /**
     * Получить все слова из всех кандзи
     * @returns {Array} Массив объектов со словами
     */
    getAllWords() {
        const allKanji = this.app.api.getAllKanji();
        const allWords = [];
        
        allKanji.forEach((kanji, kanjiIndex) => {
            if (kanji.words && kanji.words.length > 0) {
                kanji.words.forEach(word => {
                    allWords.push({
                        word: word,
                        kanji: kanji.kanji,
                        kanjiMeaning: kanji.meaning,
                        kanjiIndex: kanjiIndex,
                        week: kanji.week,
                        day: kanji.day,
                        theme: kanji.theme
                    });
                });
            }
        });

        return this.sortWords(allWords);
    }

    /**
     * Сортировать слова
     * @param {Array} words - Массив слов
     * @returns {Array} Отсортированный массив
     */
    sortWords(words) {
        switch (this.sortBy) {
            case 'alphabetical':
                return words.sort((a, b) => a.word.localeCompare(b.word, 'ja'));
            case 'length':
                return words.sort((a, b) => a.word.length - b.word.length);
            case 'index':
            default:
                return words.sort((a, b) => a.kanjiIndex - b.kanjiIndex);
        }
    }

    /**
     * Отрендерить слова, группированные по кандзи
     * @param {Array} words - Массив слов
     * @param {HTMLElement} container - Контейнер
     */
    renderWordsByKanji(words, container) {
        // Группировать по кандзи
        const wordsByKanji = {};
        words.forEach(wordObj => {
            if (!wordsByKanji[wordObj.kanji]) {
                wordsByKanji[wordObj.kanji] = {
                    kanji: wordObj.kanji,
                    meaning: wordObj.kanjiMeaning,
                    kanjiIndex: wordObj.kanjiIndex,
                    week: wordObj.week,
                    day: wordObj.day,
                    theme: wordObj.theme,
                    words: []
                };
            }
            wordsByKanji[wordObj.kanji].words.push(wordObj.word);
        });

        // Отрендерить каждую группу кандзи
        Object.values(wordsByKanji).forEach(kanjiGroup => {
            const kanjiCard = this.createKanjiWordsCard(kanjiGroup);
            container.appendChild(kanjiCard);
        });
    }

    /**
     * Создать карточку с кандзи и его словами
     * @param {Object} kanjiGroup - Группа кандзи со словами
     * @returns {HTMLElement} Элемент карточки
     */
    createKanjiWordsCard(kanjiGroup) {
        const card = DOMHelpers.createElement('div', 'kanji-words-card');
        card.setAttribute('data-week', kanjiGroup.week || '');
        card.setAttribute('data-day', kanjiGroup.day || '');

        // Заголовок с кандзи
        const header = DOMHelpers.createElement('div', 'kanji-words-header');
        header.onclick = () => {
            if (this.app.flashcards) {
                this.app.flashcards.setCurrentIndex(kanjiGroup.kanjiIndex);
                this.app.navigation.navigateTo('flashcards');
            }
        };

        const kanjiChar = DOMHelpers.createElement('div', 'kanji-char', kanjiGroup.kanji);
        const kanjiMeaning = DOMHelpers.createElement('div', 'kanji-meaning', kanjiGroup.meaning);
        
        // Информация о неделе/дне
        let locationInfo = '';
        if (kanjiGroup.week && kanjiGroup.day) {
            locationInfo = `Неделя ${kanjiGroup.week}, День ${kanjiGroup.day}`;
            if (kanjiGroup.theme) {
                locationInfo += ` - ${kanjiGroup.theme}`;
            }
        }
        const location = DOMHelpers.createElement('div', 'kanji-location', locationInfo);

        header.appendChild(kanjiChar);
        header.appendChild(kanjiMeaning);
        if (locationInfo) {
            header.appendChild(location);
        }

        // Список слов
        const wordsContainer = DOMHelpers.createElement('div', 'words-container');
        kanjiGroup.words.forEach(word => {
            const wordSpan = DOMHelpers.createElement('span', 'word-tag', word);
            wordsContainer.appendChild(wordSpan);
        });

        card.appendChild(header);
        card.appendChild(wordsContainer);

        return card;
    }

    /**
     * Фильтрация слов
     */
    filterWords() {
        const cards = document.querySelectorAll('.kanji-words-card');
        let visibleCount = 0;

        cards.forEach(card => {
            let show = true;

            // Фильтр по неделе
            if (this.weekFilter !== 'all') {
                const cardWeek = card.getAttribute('data-week');
                if (cardWeek !== this.weekFilter) {
                    show = false;
                }
            }

            // Фильтр по дню
            if (this.dayFilter !== 'all') {
                const cardDay = card.getAttribute('data-day');
                if (cardDay !== this.dayFilter) {
                    show = false;
                }
            }

            // Поиск по тексту
            if (this.searchQuery) {
                const kanjiChar = card.querySelector('.kanji-char').textContent;
                const kanjiMeaning = card.querySelector('.kanji-meaning').textContent;
                const words = Array.from(card.querySelectorAll('.word-tag'))
                    .map(el => el.textContent).join(' ');

                const searchInText = (kanjiChar + ' ' + kanjiMeaning + ' ' + words).toLowerCase();
                if (!searchInText.includes(this.searchQuery.toLowerCase())) {
                    show = false;
                }
            }

            if (show) {
                DOMHelpers.show(card);
                visibleCount++;
            } else {
                DOMHelpers.hide(card);
            }
        });

        this.updateWordsCount();
        
        if (this.searchQuery) {
            NotificationHelpers.show(`Найдено: ${visibleCount} кандзи со словами`, 'info');
        }
    }

    /**
     * Обновить счетчик слов
     */
    updateWordsCount() {
        const visibleCards = document.querySelectorAll('.kanji-words-card:not([style*="none"])');
        const totalCards = document.querySelectorAll('.kanji-words-card').length;
        
        // Подсчитать общее количество слов
        let totalWords = 0;
        let visibleWords = 0;

        document.querySelectorAll('.kanji-words-card').forEach(card => {
            const wordsInCard = card.querySelectorAll('.word-tag').length;
            totalWords += wordsInCard;
            
            if (!card.style.display || card.style.display !== 'none') {
                visibleWords += wordsInCard;
            }
        });

        const countDiv = document.getElementById('words-count');
        if (countDiv) {
            if (visibleCards.length === totalCards) {
                countDiv.textContent = `Всего: ${totalCards} кандзи, ${totalWords} слов`;
            } else {
                countDiv.textContent = `Показано: ${visibleCards.length} кандзи (${visibleWords} слов) из ${totalCards} (${totalWords} слов)`;
            }
        }

        // Обновить заголовок секции
        const sectionTitle = document.querySelector('#all-words h2');
        if (sectionTitle) {
            if (visibleCards.length === totalCards) {
                sectionTitle.textContent = `Все слова с кандзи (${totalWords} слов)`;
            } else {
                sectionTitle.textContent = `Слова с кандзи (${visibleWords} из ${totalWords})`;
            }
        }
    }

    /**
     * Сброс всех фильтров
     */
    resetFilters() {
        const weekFilter = document.getElementById('words-week-filter');
        const dayFilter = document.getElementById('words-day-filter');
        const searchInput = document.getElementById('words-search');

        if (weekFilter) weekFilter.value = 'all';
        if (dayFilter) dayFilter.value = 'all';
        if (searchInput) searchInput.value = '';

        this.weekFilter = 'all';
        this.dayFilter = 'all';
        this.searchQuery = '';

        this.filterWords();
        NotificationHelpers.show('Фильтры сброшены', 'success');
    }

    /**
     * Экспорт списка слов
     */
    exportWordsList() {
        const allWords = this.getAllWords();
        const exportData = {
            exportDate: new Date().toISOString(),
            totalWords: allWords.length,
            words: allWords.map(wordObj => ({
                word: wordObj.word,
                kanji: wordObj.kanji,
                meaning: wordObj.kanjiMeaning,
                week: wordObj.week,
                day: wordObj.day,
                theme: wordObj.theme
            }))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `kanji-words-list-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        NotificationHelpers.show('Список слов экспортирован', 'success');
    }

    /**
     * Получить статистику по словам
     * @returns {Object} Статистика
     */
    getWordsStatistics() {
        const allWords = this.getAllWords();
        const stats = {
            totalWords: allWords.length,
            uniqueWords: new Set(allWords.map(w => w.word)).size,
            averageWordsPerKanji: 0,
            longestWord: '',
            shortestWord: ''
        };

        if (allWords.length > 0) {
            // Группировать по кандзи для подсчета среднего
            const wordsByKanji = {};
            allWords.forEach(wordObj => {
                if (!wordsByKanji[wordObj.kanji]) {
                    wordsByKanji[wordObj.kanji] = 0;
                }
                wordsByKanji[wordObj.kanji]++;
            });

            const kanjiCount = Object.keys(wordsByKanji).length;
            stats.averageWordsPerKanji = (allWords.length / kanjiCount).toFixed(1);

            // Самое длинное и короткое слово
            const sortedByLength = [...allWords].sort((a, b) => a.word.length - b.word.length);
            stats.shortestWord = sortedByLength[0].word;
            stats.longestWord = sortedByLength[sortedByLength.length - 1].word;
        }

        return stats;
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WordsList;
} else {
    window.WordsList = WordsList;
}
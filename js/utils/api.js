// API для работы с данными кандзи

class KanjiAPI {
    constructor() {
        this.kanjiData = [];
        this.isLoaded = false;
    }

    /**
     * Загружает данные кандзи из JSON файла или встроенных данных
     * @returns {Promise<Array>} Массив кандзи
     */
    async loadKanjiData() {
        if (this.isLoaded && this.kanjiData.length > 0) {
            return this.kanjiData;
        }

        try {
            // Попробуем загрузить из JSON файла
            const response = await fetch('./data/kanji.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.kanjiData = await response.json();
            this.isLoaded = true;
            console.log('✅ Данные загружены из JSON файла');
            return this.kanjiData;
        } catch (error) {
            console.warn('⚠️ Не удалось загрузить JSON, используем встроенные данные:', error.message);
            
            // Fallback к встроенным данным
            if (window.EMBEDDED_KANJI_DATA && window.EMBEDDED_KANJI_DATA.length > 0) {
                this.kanjiData = window.EMBEDDED_KANJI_DATA;
                this.isLoaded = true;
                console.log('✅ Используем встроенные данные кандзи');
                return this.kanjiData;
            } else {
                throw new Error('Не удалось загрузить данные кандзи (ни JSON, ни встроенные данные недоступны)');
            }
        }
    }

    /**
     * Получает все кандзи
     * @returns {Array} Массив всех кандзи
     */
    getAllKanji() {
        return this.kanjiData;
    }

    /**
     * Получает кандзи по индексу
     * @param {number} index - Индекс кандзи
     * @returns {Object|null} Объект кандзи или null
     */
    getKanjiByIndex(index) {
        if (index >= 0 && index < this.kanjiData.length) {
            return this.kanjiData[index];
        }
        return null;
    }

    /**
     * Фильтрует кандзи по неделе и дню
     * @param {number|string} week - Номер недели или 'all'
     * @param {number|string} day - Номер дня или 'all'
     * @returns {Array} Отфильтрованный массив кандзи
     */
    filterKanji(week = 'all', day = 'all') {
        return this.kanjiData.filter(kanji => {
            const weekMatch = week === 'all' || kanji.week == week;
            const dayMatch = day === 'all' || kanji.day == day;
            return weekMatch && dayMatch;
        });
    }

    /**
     * Группирует кандзи по неделям и дням
     * @returns {Object} Объект с группированными кандзи
     */
    groupKanjiByWeekAndDay() {
        const grouped = {};
        
        this.kanjiData.forEach(kanji => {
            const week = kanji.week || 1;
            const day = kanji.day || 1;
            const theme = kanji.theme || 'Без темы';
            
            if (!grouped[week]) {
                grouped[week] = {};
            }
            if (!grouped[week][day]) {
                grouped[week][day] = {
                    theme: theme,
                    kanji: []
                };
            }
            grouped[week][day].kanji.push(kanji);
        });
        
        return grouped;
    }

    /**
     * Получает случайную выборку кандзи для теста
     * @param {number} count - Количество кандзи
     * @returns {Array} Случайная выборка кандзи
     */
    getRandomKanji(count = 10) {
        const shuffled = [...this.kanjiData].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    /**
     * Ищет кандзи по символу
     * @param {string} kanjiChar - Символ кандзи
     * @returns {Object|null} Найденный кандзи или null
     */
    findKanjiByCharacter(kanjiChar) {
        return this.kanjiData.find(kanji => kanji.kanji === kanjiChar) || null;
    }

    /**
     * Получает статистику по кандзи
     * @returns {Object} Объект со статистикой
     */
    getStatistics() {
        const stats = {
            totalKanji: this.kanjiData.length,
            weekBreakdown: {},
            dayBreakdown: {},
            themes: new Set()
        };

        this.kanjiData.forEach(kanji => {
            // Подсчет по неделям
            const week = kanji.week || 'unknown';
            stats.weekBreakdown[week] = (stats.weekBreakdown[week] || 0) + 1;

            // Подсчет по дням
            const day = kanji.day || 'unknown';
            stats.dayBreakdown[day] = (stats.dayBreakdown[day] || 0) + 1;

            // Сбор тем
            if (kanji.theme) {
                stats.themes.add(kanji.theme);
            }
        });

        stats.themes = Array.from(stats.themes);
        return stats;
    }

    /**
     * Проверяет, загружены ли данные
     * @returns {boolean} true если данные загружены
     */
    isDataLoaded() {
        return this.isLoaded && this.kanjiData.length > 0;
    }

    /**
     * Получает количество кандзи
     * @returns {number} Количество кандзи
     */
    getKanjiCount() {
        return this.kanjiData.length;
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KanjiAPI;
} else {
    window.KanjiAPI = KanjiAPI;
}
// Компонент для отображения всех кандзи с группировкой

class KanjiGrid {
    constructor(app) {
        this.app = app;
        this.weekFilter = 'all';
        this.dayFilter = 'all';
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
        this.generateGroupedKanji();
    }

    /**
     * Привязка событий
     */
    bindEvents() {
        // Обработчики фильтров
        const weekFilter = document.getElementById('week-filter');
        const dayFilter = document.getElementById('day-filter');

        if (weekFilter) {
            weekFilter.addEventListener('change', (e) => {
                this.weekFilter = e.target.value;
                this.filterKanji();
            });
        }

        if (dayFilter) {
            dayFilter.addEventListener('change', (e) => {
                this.dayFilter = e.target.value;
                this.filterKanji();
            });
        }

        // Глобальная функция для обратной совместимости
        window.filterKanji = () => this.filterKanji();
    }

    /**
     * Генерация группированных кандзи
     */
    generateGroupedKanji() {
        const container = document.getElementById('kanji-grouped-content');
        if (!container) {
            console.error('Контейнер kanji-grouped-content не найден');
            return;
        }

        DOMHelpers.clear(container);

        // Группировка кандзи по неделям и дням
        const groupedKanji = this.app.api.groupKanjiByWeekAndDay();
        
        // Получение названий недель
        const weekNames = {
            1: 'でかける① (Выходим ①)',
            2: 'でかける② (Выходим ②)',
            3: 'つかう (Использовать)',
            4: 'Неделя 4', 
            5: 'Неделя 5',
            6: 'Неделя 6'
        };

        // Создание HTML для каждой недели
        Object.keys(groupedKanji).sort((a, b) => parseInt(a) - parseInt(b)).forEach(weekNum => {
            const weekDiv = DOMHelpers.createElement('div', 'week-group');
            weekDiv.setAttribute('data-week', weekNum);
            
            const weekTitle = DOMHelpers.createElement('div', 'week-title', 
                `Неделя ${weekNum} - ${weekNames[weekNum] || ''}`);
            weekDiv.appendChild(weekTitle);
            
            Object.keys(groupedKanji[weekNum]).sort((a, b) => parseInt(a) - parseInt(b)).forEach(dayNum => {
                const dayData = groupedKanji[weekNum][dayNum];
                
                const dayDiv = DOMHelpers.createElement('div', 'day-group');
                dayDiv.setAttribute('data-day', dayNum);
                
                const dayTitle = DOMHelpers.createElement('div', 'day-title', 
                    `День ${dayNum}: ${dayData.theme}`);
                dayDiv.appendChild(dayTitle);
                
                const kanjiGrid = DOMHelpers.createElement('div', 'kanji-grid');
                
                dayData.kanji.forEach((kanji) => {
                    const card = this.createKanjiCard(kanji);
                    kanjiGrid.appendChild(card);
                });
                
                dayDiv.appendChild(kanjiGrid);
                weekDiv.appendChild(dayDiv);
            });
            
            container.appendChild(weekDiv);
        });

        // Обновить счетчик кандзи
        this.updateKanjiCount();
    }

    /**
     * Создать карточку кандзи
     * @param {Object} kanji - Объект кандзи
     * @returns {HTMLElement} Элемент карточки
     */
    createKanjiCard(kanji) {
        const card = DOMHelpers.createElement('div', 'kanji-card');
        
        // Найти глобальный индекс кандзи
        const allKanji = this.app.api.getAllKanji();
        const globalIndex = allKanji.findIndex(k => k.kanji === kanji.kanji);
        
        card.onclick = () => {
            if (globalIndex !== -1 && this.app.flashcards) {
                this.app.flashcards.setCurrentIndex(globalIndex);
                this.app.navigation.navigateTo('flashcards');
            }
        };
        
        const kanjiChar = DOMHelpers.createElement('div', 'kanji', kanji.kanji);
        const meaning = DOMHelpers.createElement('div', 'meaning', kanji.meaning);
        
        card.appendChild(kanjiChar);
        card.appendChild(meaning);
        
        return card;
    }

    /**
     * Фильтрация кандзи по неделям и дням
     */
    filterKanji() {
        const weekFilter = document.getElementById('week-filter');
        const dayFilter = document.getElementById('day-filter');
        
        if (weekFilter) this.weekFilter = weekFilter.value;
        if (dayFilter) this.dayFilter = dayFilter.value;
        
        const weekGroups = document.querySelectorAll('.week-group');
        
        weekGroups.forEach(weekGroup => {
            const weekNum = weekGroup.getAttribute('data-week');
            let showWeek = (this.weekFilter === 'all' || this.weekFilter === weekNum);
            
            if (showWeek) {
                const dayGroups = weekGroup.querySelectorAll('.day-group');
                let hasVisibleDays = false;
                
                dayGroups.forEach(dayGroup => {
                    const dayNum = dayGroup.getAttribute('data-day');
                    const showDay = (this.dayFilter === 'all' || this.dayFilter === dayNum);
                    
                    if (showDay) {
                        DOMHelpers.show(dayGroup);
                        hasVisibleDays = true;
                    } else {
                        DOMHelpers.hide(dayGroup);
                    }
                });
                
                if (hasVisibleDays) {
                    DOMHelpers.show(weekGroup);
                } else {
                    DOMHelpers.hide(weekGroup);
                }
            } else {
                DOMHelpers.hide(weekGroup);
            }
        });

        // Обновить счетчик
        this.updateKanjiCount();
        
        // Показать уведомление
        const filterText = this.getFilterDescription();
        NotificationHelpers.show(`Фильтр: ${filterText}`, 'info', 2000);
    }

    /**
     * Получить описание текущего фильтра
     * @returns {string} Описание фильтра
     */
    getFilterDescription() {
        let parts = [];
        
        if (this.weekFilter !== 'all') {
            parts.push(`Неделя ${this.weekFilter}`);
        }
        
        if (this.dayFilter !== 'all') {
            parts.push(`День ${this.dayFilter}`);
        }
        
        if (parts.length === 0) {
            return 'Все кандзи';
        }
        
        return parts.join(', ');
    }

    /**
     * Обновить счетчик кандзи
     */
    updateKanjiCount() {
        const visibleCards = document.querySelectorAll('.week-group:not([style*="none"]) .kanji-card');
        const totalCards = this.app.api.getKanjiCount();
        
        // Обновить заголовок секции
        const sectionTitle = document.querySelector('#all-kanji h2');
        if (sectionTitle) {
            const visibleCount = visibleCards.length;
            if (visibleCount === totalCards) {
                sectionTitle.textContent = `Все кандзи (${totalCards} иероглифов)`;
            } else {
                sectionTitle.textContent = `Кандзи (${visibleCount} из ${totalCards})`;
            }
        }
    }

    /**
     * Сброс всех фильтров
     */
    resetFilters() {
        const weekFilter = document.getElementById('week-filter');
        const dayFilter = document.getElementById('day-filter');
        
        if (weekFilter) weekFilter.value = 'all';
        if (dayFilter) dayFilter.value = 'all';
        
        this.weekFilter = 'all';
        this.dayFilter = 'all';
        
        this.filterKanji();
        NotificationHelpers.show('Фильтры сброшены', 'success');
    }

    /**
     * Применить фильтр по неделе
     * @param {number|string} week - Номер недели
     */
    filterByWeek(week) {
        const weekFilter = document.getElementById('week-filter');
        if (weekFilter) {
            weekFilter.value = week.toString();
            this.weekFilter = week.toString();
            this.filterKanji();
        }
    }

    /**
     * Применить фильтр по дню
     * @param {number|string} day - Номер дня
     */
    filterByDay(day) {
        const dayFilter = document.getElementById('day-filter');
        if (dayFilter) {
            dayFilter.value = day.toString();
            this.dayFilter = day.toString();
            this.filterKanji();
        }
    }

    /**
     * Получить статистику по группам
     * @returns {Object} Статистика
     */
    getGroupStatistics() {
        const groupedKanji = this.app.api.groupKanjiByWeekAndDay();
        const stats = {
            totalWeeks: Object.keys(groupedKanji).length,
            totalDays: 0,
            weekDetails: {}
        };

        Object.keys(groupedKanji).forEach(week => {
            const days = Object.keys(groupedKanji[week]);
            stats.totalDays += days.length;
            stats.weekDetails[week] = {
                days: days.length,
                totalKanji: 0
            };

            days.forEach(day => {
                stats.weekDetails[week].totalKanji += groupedKanji[week][day].kanji.length;
            });
        });

        return stats;
    }

    /**
     * Поиск кандзи по символу или значению
     * @param {string} query - Поисковый запрос
     */
    searchKanji(query) {
        if (!query.trim()) {
            this.resetFilters();
            return;
        }

        const cards = document.querySelectorAll('.kanji-card');
        let visibleCount = 0;

        cards.forEach(card => {
            const kanjiChar = card.querySelector('.kanji').textContent;
            const meaning = card.querySelector('.meaning').textContent;
            
            const matches = kanjiChar.includes(query) || 
                          meaning.toLowerCase().includes(query.toLowerCase());
            
            if (matches) {
                DOMHelpers.show(card.parentElement.parentElement.parentElement); // week-group
                DOMHelpers.show(card.parentElement.parentElement); // day-group
                DOMHelpers.show(card);
                visibleCount++;
            } else {
                DOMHelpers.hide(card);
            }
        });

        // Скрыть пустые группы
        document.querySelectorAll('.day-group').forEach(dayGroup => {
            const visibleCards = dayGroup.querySelectorAll('.kanji-card:not([style*="none"])');
            if (visibleCards.length === 0) {
                DOMHelpers.hide(dayGroup);
            }
        });

        document.querySelectorAll('.week-group').forEach(weekGroup => {
            const visibleDays = weekGroup.querySelectorAll('.day-group:not([style*="none"])');
            if (visibleDays.length === 0) {
                DOMHelpers.hide(weekGroup);
            }
        });

        // Обновить счетчик
        this.updateKanjiCount();
        
        NotificationHelpers.show(`Найдено: ${visibleCount} кандзи`, 'info');
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KanjiGrid;
} else {
    window.KanjiGrid = KanjiGrid;
}
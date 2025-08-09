// Компонент навигации

class Navigation {
    constructor(app) {
        this.app = app;
        this.currentSection = 'flashcards';
        this.init();
    }

    /**
     * Инициализация навигации
     */
    init() {
        this.bindEvents();
        this.showSection('flashcards');
    }

    /**
     * Привязка событий
     */
    bindEvents() {
        // Обработчики для кнопок навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sectionName = e.target.getAttribute('onclick')?.match(/showSection\('([^']+)'\)/)?.[1];
                if (sectionName) {
                    e.preventDefault();
                    this.showSection(sectionName, e.target);
                }
            });
        });

        // Обработчик для прямых вызовов
        window.showSection = (sectionName, button) => {
            this.showSection(sectionName, button);
        };
    }

    /**
     * Показать секцию
     * @param {string} sectionName - Название секции
     * @param {HTMLElement} button - Кнопка навигации
     */
    showSection(sectionName, button = null) {
        // Скрыть все секции
        DOMHelpers.removeClassFromAll('.section', 'active');
        
        // Показать выбранную секцию
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            DOMHelpers.addClass(targetSection, 'active');
            this.currentSection = sectionName;
        }

        // Обновить активную кнопку навигации
        this.updateActiveButton(button || this.findNavButton(sectionName));

        // Инициализировать содержимое секции
        this.initializeSection(sectionName);

        // Уведомление для разработки
        console.log(`Переключено на секцию: ${sectionName}`);
    }

    /**
     * Обновить активную кнопку навигации
     * @param {HTMLElement} activeButton - Активная кнопка
     */
    updateActiveButton(activeButton) {
        // Убрать активный класс у всех кнопок
        DOMHelpers.removeClassFromAll('.nav-btn', 'active');
        
        // Добавить активный класс к выбранной кнопке
        if (activeButton) {
            DOMHelpers.addClass(activeButton, 'active');
        }
    }

    /**
     * Найти кнопку навигации по секции
     * @param {string} sectionName - Название секции
     * @returns {HTMLElement|null} Найденная кнопка
     */
    findNavButton(sectionName) {
        const buttons = document.querySelectorAll('.nav-btn');
        for (let btn of buttons) {
            const onclick = btn.getAttribute('onclick');
            if (onclick && onclick.includes(`'${sectionName}'`)) {
                return btn;
            }
        }
        return null;
    }

    /**
     * Инициализировать содержимое секции
     * @param {string} sectionName - Название секции
     */
    initializeSection(sectionName) {
        switch (sectionName) {
            case 'flashcards':
                this.initFlashcards();
                break;
            case 'all-kanji':
                this.initAllKanji();
                break;
            case 'all-words':
                this.initAllWords();
                break;
            case 'test':
                this.initTest();
                break;
            default:
                console.warn(`Неизвестная секция: ${sectionName}`);
        }
    }

    /**
     * Инициализация флэш-карт
     */
    initFlashcards() {
        if (this.app.flashcards && this.app.api.isDataLoaded()) {
            this.app.flashcards.init();
        }
    }

    /**
     * Инициализация секции всех кандзи
     */
    initAllKanji() {
        if (this.app.kanjiGrid && this.app.api.isDataLoaded()) {
            this.app.kanjiGrid.generateGroupedKanji();
        }
    }

    /**
     * Инициализация секции всех слов
     */
    initAllWords() {
        if (this.app.wordsList && this.app.api.isDataLoaded()) {
            this.app.wordsList.generateWordsList();
        }
    }

    /**
     * Инициализация теста
     */
    initTest() {
        if (this.app.test && this.app.api.isDataLoaded()) {
            this.app.test.generateTest();
        }
    }

    /**
     * Получить текущую секцию
     * @returns {string} Название текущей секции
     */
    getCurrentSection() {
        return this.currentSection;
    }

    /**
     * Программная навигация к секции
     * @param {string} sectionName - Название секции
     */
    navigateTo(sectionName) {
        this.showSection(sectionName);
    }

    /**
     * Навигация с анимацией
     * @param {string} sectionName - Название секции
     */
    smoothNavigateTo(sectionName) {
        const currentSection = document.querySelector('.section.active');
        const targetSection = document.getElementById(sectionName);
        
        if (currentSection && targetSection && currentSection !== targetSection) {
            // Анимация исчезновения текущей секции
            AnimationHelpers.fadeOut(currentSection, 200);
            
            setTimeout(() => {
                this.showSection(sectionName);
                // Анимация появления новой секции
                AnimationHelpers.fadeIn(targetSection, 300);
            }, 200);
        } else {
            this.showSection(sectionName);
        }
    }

    /**
     * Получить список доступных секций
     * @returns {Array} Массив названий секций
     */
    getAvailableSections() {
        return Array.from(document.querySelectorAll('.section')).map(section => section.id);
    }

    /**
     * Проверить, доступна ли секция
     * @param {string} sectionName - Название секции
     * @returns {boolean} true если секция доступна
     */
    isSectionAvailable(sectionName) {
        return document.getElementById(sectionName) !== null;
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Navigation;
} else {
    window.Navigation = Navigation;
}
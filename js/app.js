// Главный модуль приложения

class KanjiApp {
    constructor() {
        this.api = new KanjiAPI();
        this.navigation = null;
        this.flashcards = null;
        this.kanjiGrid = null;
        this.wordsList = null;
        this.test = null;
        this.filters = null;
        
        this.isInitialized = false;
    }

    /**
     * Инициализация приложения
     */
    async init() {
        try {
            // Показать индикатор загрузки
            this.showLoadingIndicator();

            // Загрузить данные кандзи
            await this.api.loadKanjiData();
            
            // Инициализировать компоненты
            await this.initializeComponents();
            
            // Скрыть индикатор загрузки
            this.hideLoadingIndicator();
            
            // Показать успешное сообщение
            NotificationHelpers.show(`Загружено ${this.api.getKanjiCount()} кандзи`, 'success');
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('Ошибка инициализации приложения:', error);
            this.showError('Не удалось загрузить данные кандзи. Пожалуйста, обновите страницу.');
        }
    }

    /**
     * Инициализация компонентов
     */
    async initializeComponents() {
        // Инициализация навигации
        this.navigation = new Navigation(this);
        
        // Инициализация флэш-карт
        this.flashcards = new Flashcards(this);
        
        // Инициализация компонента кандзи-сетки
        this.kanjiGrid = new KanjiGrid(this);
        
        // Инициализация компонента списка слов
        this.wordsList = new WordsList(this);
        
        // Инициализация компонента теста
        this.test = new KanjiTest(this);
        
        // Остальные компоненты будут добавлены позже
        // this.filters = new Filters(this);
        
        console.log('Все компоненты инициализированы');
    }

    /**
     * Показать индикатор загрузки
     */
    showLoadingIndicator() {
        const loadingHTML = `
            <div id="loading-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(102, 126, 234, 0.9);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                color: white;
            ">
                <div style="
                    width: 50px;
                    height: 50px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top-color: white;
                    animation: spin 1s ease-in-out infinite;
                    margin-bottom: 20px;
                "></div>
                <h2>Загрузка кандзи...</h2>
                <p style="margin-top: 10px; opacity: 0.8;">Пожалуйста, подождите</p>
            </div>
        `;

        // Добавить стили для анимации
        if (!document.getElementById('loading-styles')) {
            const style = document.createElement('style');
            style.id = 'loading-styles';
            style.textContent = `
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.insertAdjacentHTML('beforeend', loadingHTML);
    }

    /**
     * Скрыть индикатор загрузки
     */
    hideLoadingIndicator() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            AnimationHelpers.fadeOut(overlay, 500);
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 500);
        }
    }

    /**
     * Показать ошибку
     * @param {string} message - Сообщение об ошибке
     */
    showError(message) {
        this.hideLoadingIndicator();
        
        const errorHTML = `
            <div id="error-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(220, 53, 69, 0.9);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                color: white;
                text-align: center;
                padding: 20px;
            ">
                <div style="
                    background: rgba(255, 255, 255, 0.1);
                    padding: 40px;
                    border-radius: 15px;
                    max-width: 500px;
                    backdrop-filter: blur(10px);
                ">
                    <h2 style="margin-bottom: 20px;">❌ Ошибка загрузки</h2>
                    <p style="margin-bottom: 20px; line-height: 1.5;">${message}</p>
                    <button onclick="location.reload()" style="
                        background: white;
                        color: #dc3545;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 16px;
                    ">Перезагрузить страницу</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', errorHTML);
    }

    /**
     * Получить статистику приложения
     * @returns {Object} Объект со статистикой
     */
    getAppStatistics() {
        return {
            isInitialized: this.isInitialized,
            kanjiCount: this.api.getKanjiCount(),
            dataLoaded: this.api.isDataLoaded(),
            currentSection: this.navigation ? this.navigation.getCurrentSection() : null,
            currentKanji: this.flashcards ? this.flashcards.getCurrentKanji() : null,
            ...this.api.getStatistics()
        };
    }

    /**
     * Сохранить состояние приложения
     */
    saveState() {
        const state = {
            currentKanjiIndex: this.flashcards ? this.flashcards.currentKanjiIndex : 0,
            currentSection: this.navigation ? this.navigation.getCurrentSection() : 'flashcards',
            timestamp: Date.now()
        };

        StorageHelpers.save('kanjiAppState', state);
    }

    /**
     * Загрузить состояние приложения
     */
    loadState() {
        const state = StorageHelpers.load('kanjiAppState');
        
        if (state) {
            // Восстановить позицию в флэш-картах
            if (this.flashcards && state.currentKanjiIndex !== undefined) {
                this.flashcards.setCurrentIndex(state.currentKanjiIndex);
            }

            // Восстановить активную секцию
            if (this.navigation && state.currentSection) {
                this.navigation.navigateTo(state.currentSection);
            }

            console.log('Состояние приложения восстановлено:', state);
        }
    }

    /**
     * Обработчик события перед закрытием страницы
     */
    handleBeforeUnload() {
        this.saveState();
    }

    /**
     * Настройка автосохранения
     */
    setupAutoSave() {
        // Сохранять состояние каждые 30 секунд
        setInterval(() => {
            if (this.isInitialized) {
                this.saveState();
            }
        }, 30000);

        // Сохранять при закрытии страницы
        window.addEventListener('beforeunload', () => {
            this.handleBeforeUnload();
        });

        // Сохранять при изменении видимости страницы
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.saveState();
            }
        });
    }

    /**
     * Переключение в полноэкранный режим
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Ошибка включения полноэкранного режима: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * Экспорт данных изучения
     */
    exportStudyData() {
        const data = {
            appInfo: {
                version: '2.0',
                exportDate: new Date().toISOString(),
                kanjiCount: this.api.getKanjiCount()
            },
            statistics: this.getAppStatistics(),
            state: StorageHelpers.load('kanjiAppState'),
            // Можно добавить прогресс изучения, результаты тестов и т.д.
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `kanji-study-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        NotificationHelpers.show('Данные экспортированы', 'success');
    }

    /**
     * Проверка обновлений данных
     */
    checkForUpdates() {
        // Placeholder для будущего функционала
        console.log('Проверка обновлений...');
        NotificationHelpers.show('Проверка обновлений не реализована', 'info');
    }

    /**
     * Показать информацию о приложении
     */
    showAbout() {
        const aboutHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            " onclick="this.remove()">
                <div style="
                    background: white;
                    padding: 40px;
                    border-radius: 15px;
                    max-width: 500px;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                " onclick="event.stopPropagation()">
                    <h2 style="color: #667eea; margin-bottom: 20px;">📚 Изучение кандзи</h2>
                    <p><strong>Версия:</strong> 2.0 (Модульная)</p>
                    <p><strong>Кандзи:</strong> ${this.api.getKanjiCount()}</p>
                    <p><strong>Учебник:</strong> Nihongo Sou Matome N3 - Kanji</p>
                    <p style="margin-top: 20px; color: #666; font-size: 0.9rem;">
                        Приложение для изучения японских кандзи с помощью флэш-карт, 
                        группированного просмотра и интерактивных тестов.
                    </p>
                    <button onclick="this.parentElement.parentElement.remove()" style="
                        background: #667eea;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        margin-top: 20px;
                    ">Закрыть</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', aboutHTML);
    }
}

// Глобальная переменная приложения
let app;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    try {
        app = new KanjiApp();
        await app.init();
        
        // Настроить автосохранение
        app.setupAutoSave();
        
        // Загрузить сохраненное состояние
        app.loadState();
        
        // Глобальные функции для обратной совместимости
        window.app = app;
        
        console.log('✅ Приложение успешно инициализировано');
        
    } catch (error) {
        console.error('❌ Критическая ошибка инициализации:', error);
    }
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KanjiApp;
} else {
    window.KanjiApp = KanjiApp;
}
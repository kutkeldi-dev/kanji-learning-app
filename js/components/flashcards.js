// Компонент флэш-карт

class Flashcards {
    constructor(app) {
        this.app = app;
        this.currentKanjiIndex = 0;
        this.showHiddenInfo = false;
        this.init();
    }

    /**
     * Инициализация флэш-карт
     */
    init() {
        if (!this.app.api.isDataLoaded()) {
            console.warn('Данные кандзи не загружены');
            return;
        }

        this.bindEvents();
        this.showKanji(this.currentKanjiIndex);
    }

    /**
     * Привязка событий
     */
    bindEvents() {
        // Кнопки управления
        const prevBtn = document.getElementById('prev-kanji');
        const nextBtn = document.getElementById('next-kanji');
        const showMeaningBtn = document.getElementById('show-meaning');
        const randomBtn = document.getElementById('random-kanji');

        if (prevBtn && !prevBtn.dataset.eventsBound) {
            prevBtn.addEventListener('click', () => this.previousKanji());
            prevBtn.dataset.eventsBound = 'true';
        }

        if (nextBtn && !nextBtn.dataset.eventsBound) {
            nextBtn.addEventListener('click', () => this.nextKanji());
            nextBtn.dataset.eventsBound = 'true';
        }

        if (showMeaningBtn && !showMeaningBtn.dataset.eventsBound) {
            showMeaningBtn.addEventListener('click', () => this.toggleHiddenInfo());
            showMeaningBtn.dataset.eventsBound = 'true';
        }

        if (randomBtn && !randomBtn.dataset.eventsBound) {
            randomBtn.addEventListener('click', () => this.randomKanji());
            randomBtn.dataset.eventsBound = 'true';
        }

        // Клавиатурные сокращения
        document.addEventListener('keydown', (e) => {
            // Только если мы находимся в разделе флэш-карт
            if (this.app.navigation && this.app.navigation.getCurrentSection() !== 'flashcards') {
                return;
            }

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousKanji();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextKanji();
                    break;
                case ' ': // Пробел
                    e.preventDefault();
                    this.toggleHiddenInfo();
                    break;
            }

            // Ctrl+R для случайного кандзи
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.randomKanji();
            }
        });

        // Touch события для свайпов на мобильных устройствах
        this.setupTouchEvents();
    }

    /**
     * Настройка touch событий для свайпов
     */
    setupTouchEvents() {
        const flashcard = document.querySelector('.flashcard');
        if (!flashcard) return;

        let startX = 0;
        let startY = 0;
        let startTime = 0;
        const threshold = 80; // Минимальное расстояние для срабатывания свайпа
        const maxTime = 500; // Максимальное время для свайпа (мс)
        const minVelocity = 0.3; // Минимальная скорость свайпа (пикселей/мс)

        // Предотвращаем выделение текста при свайпе
        flashcard.style.userSelect = 'none';
        flashcard.style.webkitUserSelect = 'none';

        flashcard.addEventListener('touchstart', (e) => {
            // Только для одного касания
            if (e.touches.length !== 1) return;
            
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
        }, { passive: true });

        flashcard.addEventListener('touchmove', (e) => {
            // Предотвращаем скролл при горизонтальном свайпе
            if (e.touches.length !== 1) return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const deltaX = Math.abs(currentX - startX);
            const deltaY = Math.abs(currentY - startY);
            
            // Если горизонтальное движение преобладает, предотвращаем скролл
            if (deltaX > deltaY && deltaX > 20) {
                e.preventDefault();
            }
        }, { passive: false });

        flashcard.addEventListener('touchend', (e) => {
            if (e.changedTouches.length !== 1) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const endTime = Date.now();
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const deltaTime = endTime - startTime;
            const velocity = Math.abs(deltaX) / deltaTime;
            
            // Проверяем условия для свайпа:
            // 1. Горизонтальное движение больше вертикального
            // 2. Пройдено минимальное расстояние
            // 3. Время свайпа не превышает максимальное
            // 4. Скорость свайпа достаточна
            const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
            const isDistanceEnough = Math.abs(deltaX) > threshold;
            const isTimeValid = deltaTime < maxTime;
            const isVelocityEnough = velocity > minVelocity;
            
            if (isHorizontalSwipe && isDistanceEnough && (isTimeValid || isVelocityEnough)) {
                // Добавляем небольшую задержку для лучшего UX
                setTimeout(() => {
                    if (deltaX > 0) {
                        // Свайп вправо - предыдущий кандзи
                        this.previousKanji();
                    } else {
                        // Свайп влево - следующий кандзи
                        this.nextKanji();
                    }
                }, 50);
            }
        }, { passive: true });

        // Добавляем тап для показа/скрытия перевода на мобильных
        let tapCount = 0;
        flashcard.addEventListener('touchend', (e) => {
            if (e.changedTouches.length !== 1) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const deltaX = Math.abs(endX - startX);
            const deltaY = Math.abs(endY - startY);
            
            // Если это не свайп, а тап
            if (deltaX < 20 && deltaY < 20) {
                tapCount++;
                setTimeout(() => {
                    if (tapCount === 1) {
                        // Одинарный тап - показать/скрыть перевод
                        this.toggleHiddenInfo();
                    }
                    tapCount = 0;
                }, 300);
            }
        }, { passive: true });
    }

    /**
     * Показать кандзи по индексу
     * @param {number} index - Индекс кандзи
     */
    showKanji(index) {
        const kanji = this.app.api.getKanjiByIndex(index);
        if (!kanji) {
            console.error(`Кандзи с индексом ${index} не найден`);
            return;
        }

        // Сбросить состояние показа скрытой информации
        this.showHiddenInfo = false;
        
        // Обновить основной кандзи
        this.updateKanjiDisplay(kanji);
        
        // Обновить чтения (всегда видимые)
        this.updateReadings(kanji);
        
        // Скрыть скрытую информацию
        const hiddenInfo = document.getElementById('hidden-info');
        if (hiddenInfo) {
            hiddenInfo.style.display = 'none';
            hiddenInfo.classList.remove('show');
        }
        
        // Обновить прогресс
        this.updateProgress();
        
        // Обновить кнопки
        this.updateButtons();

        console.log(`Показан кандзи: ${kanji.kanji} (${index + 1}/${this.app.api.getKanjiCount()})`);
    }

    /**
     * Обновить отображение основного кандзи
     * @param {Object} kanji - Объект кандзи
     */
    updateKanjiDisplay(kanji) {
        const kanjiDisplay = document.getElementById('current-kanji');
        if (kanjiDisplay) {
            kanjiDisplay.textContent = kanji.kanji;
        }
    }

    /**
     * Обновить отображение чтений
     * @param {Object} kanji - Объект кандзи
     */
    updateReadings(kanji) {
        const readingsContainer = document.getElementById('kanji-readings');
        if (!readingsContainer) return;

        DOMHelpers.clear(readingsContainer);

        let hasReadings = false;

        // Проверить разные форматы данных чтений
        if (kanji.readings) {
            // Формат 1: объект с on и kun
            if (kanji.readings.on && kanji.readings.on.length > 0) {
                kanji.readings.on.forEach(reading => {
                    const span = DOMHelpers.createElement('span', 'reading-type', `Он: ${reading}`);
                    readingsContainer.appendChild(span);
                    hasReadings = true;
                });
            }
            
            if (kanji.readings.kun && kanji.readings.kun.length > 0) {
                kanji.readings.kun.forEach(reading => {
                    const span = DOMHelpers.createElement('span', 'reading-type', `Кун: ${reading}`);
                    readingsContainer.appendChild(span);
                    hasReadings = true;
                });
            }
            
            // Формат 2: простой массив
            if (Array.isArray(kanji.readings) && kanji.readings.length > 0) {
                kanji.readings.forEach(reading => {
                    const span = DOMHelpers.createElement('span', 'reading-type', reading);
                    readingsContainer.appendChild(span);
                    hasReadings = true;
                });
            }
        }

        // Если нет чтений
        if (!hasReadings) {
            const span = DOMHelpers.createElement('span', 'reading-type', 'Чтения не указаны');
            readingsContainer.appendChild(span);
        }
    }

    /**
     * Переключить показ скрытой информации
     */
    toggleHiddenInfo() {
        this.showHiddenInfo = !this.showHiddenInfo;
        
        const hiddenInfo = document.getElementById('hidden-info');
        if (!hiddenInfo) return;
        
        if (this.showHiddenInfo) {
            // Получить текущий кандзи и обновить данные
            const kanji = this.app.api.getKanjiByIndex(this.currentKanjiIndex);
            if (kanji) {
                this.updateMeaning(kanji);
                this.updateWords(kanji);
                this.updateExamples(kanji);
            }
            
            // Показать блок с анимацией
            hiddenInfo.style.display = 'block';
            hiddenInfo.classList.add('show');
        } else {
            // Скрыть блок с анимацией
            hiddenInfo.classList.remove('show');
            setTimeout(() => {
                if (!this.showHiddenInfo) {
                    hiddenInfo.style.display = 'none';
                }
            }, 300);
        }
        
        this.updateShowButton();
    }


    /**
     * Обновить значение кандзи
     * @param {Object} kanji - Объект кандзи
     */
    updateMeaning(kanji) {
        const meaningElement = document.getElementById('kanji-meaning');
        if (meaningElement) {
            meaningElement.textContent = kanji.meaning || 'Значение не указано';
        }
    }

    /**
     * Обновить слова с кандзи
     * @param {Object} kanji - Объект кандзи
     */
    updateWords(kanji) {
        const wordsContainer = document.getElementById('kanji-words');
        if (!wordsContainer) return;

        DOMHelpers.clear(wordsContainer);

        if (kanji.words && kanji.words.length > 0) {
            kanji.words.forEach(word => {
                const span = DOMHelpers.createElement('span', 'word-item', word);
                wordsContainer.appendChild(span);
            });
        } else {
            const span = DOMHelpers.createElement('span', 'word-item', 'Слова не указаны');
            wordsContainer.appendChild(span);
        }
    }

    /**
     * Обновить примеры предложений
     * @param {Object} kanji - Объект кандзи
     */
    updateExamples(kanji) {
        const examplesContainer = document.getElementById('kanji-examples');
        if (!examplesContainer) return;

        DOMHelpers.clear(examplesContainer);

        if (kanji.examples && kanji.examples.length > 0) {
            kanji.examples.forEach(example => {
                const exampleDiv = DOMHelpers.createElement('div', 'example-item');
                
                // Поддержка разных форматов данных
                let japaneseText, russianText;
                
                if (example.japanese && example.russian) {
                    // Формат: {japanese: "...", russian: "..."}
                    japaneseText = example.japanese;
                    russianText = example.russian;
                } else if (example.jp && example.ru) {
                    // Формат: {jp: "...", ru: "..."}
                    japaneseText = example.jp;
                    russianText = example.ru;
                } else if (typeof example === 'string') {
                    // Строковый формат
                    japaneseText = example;
                    russianText = '';
                } else {
                    // Неизвестный формат
                    japaneseText = JSON.stringify(example);
                    russianText = '';
                }
                
                const jpDiv = DOMHelpers.createElement('div', 'example-jp', japaneseText);
                const ruDiv = DOMHelpers.createElement('div', 'example-ru', russianText);
                
                exampleDiv.appendChild(jpDiv);
                if (russianText) {
                    exampleDiv.appendChild(ruDiv);
                }
                examplesContainer.appendChild(exampleDiv);
            });
        } else {
            const div = DOMHelpers.createElement('div', 'example-item');
            div.innerHTML = '<div class="example-jp">Примеры не указаны</div>';
            examplesContainer.appendChild(div);
        }
    }

    /**
     * Обновить кнопку показа
     */
    updateShowButton() {
        const button = document.getElementById('show-meaning');
        if (button) {
            button.textContent = this.showHiddenInfo ? 'Скрыть перевод' : 'Показать перевод';
        }
    }

    /**
     * Обновить прогресс
     */
    updateProgress() {
        const progressInfo = document.getElementById('progress-info');
        const progressBar = document.getElementById('progress-bar');
        const totalKanji = this.app.api.getKanjiCount();

        if (progressInfo) {
            progressInfo.textContent = `${this.currentKanjiIndex + 1} / ${totalKanji}`;
        }

        if (progressBar) {
            const percentage = ((this.currentKanjiIndex + 1) / totalKanji) * 100;
            progressBar.style.width = `${percentage}%`;
        }
    }

    /**
     * Обновить состояние кнопок
     */
    updateButtons() {
        const prevBtn = document.getElementById('prev-kanji');
        const nextBtn = document.getElementById('next-kanji');
        const totalKanji = this.app.api.getKanjiCount();

        if (prevBtn) {
            prevBtn.disabled = this.currentKanjiIndex === 0;
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentKanjiIndex === totalKanji - 1;
        }
    }

    /**
     * Перейти к предыдущему кандзи
     */
    previousKanji() {
        if (this.currentKanjiIndex > 0) {
            this.currentKanjiIndex--;
            this.showKanji(this.currentKanjiIndex);
            NotificationHelpers.show(`Кандзи ${this.currentKanjiIndex + 1}`, 'info', 1000);
        }
    }

    /**
     * Перейти к следующему кандзи
     */
    nextKanji() {
        const totalKanji = this.app.api.getKanjiCount();
        if (this.currentKanjiIndex < totalKanji - 1) {
            this.currentKanjiIndex++;
            this.showKanji(this.currentKanjiIndex);
            NotificationHelpers.show(`Кандзи ${this.currentKanjiIndex + 1}`, 'info', 1000);
        }
    }

    /**
     * Показать случайный кандзи
     */
    randomKanji() {
        const totalKanji = this.app.api.getKanjiCount();
        let newIndex;
        
        // Убедимся, что новый индекс отличается от текущего
        do {
            newIndex = Math.floor(Math.random() * totalKanji);
        } while (newIndex === this.currentKanjiIndex && totalKanji > 1);
        
        this.currentKanjiIndex = newIndex;
        this.showKanji(this.currentKanjiIndex);
        NotificationHelpers.show(`Случайный кандзи: ${this.currentKanjiIndex + 1}`, 'success', 1500);
    }

    /**
     * Установить текущий индекс кандзи (используется другими компонентами)
     * @param {number} index - Новый индекс
     */
    setCurrentIndex(index) {
        const totalKanji = this.app.api.getKanjiCount();
        if (index >= 0 && index < totalKanji) {
            this.currentKanjiIndex = index;
            this.showKanji(this.currentKanjiIndex);
        }
    }

    /**
     * Получить текущий кандзи
     * @returns {Object|null} Текущий кандзи
     */
    getCurrentKanji() {
        return this.app.api.getKanjiByIndex(this.currentKanjiIndex);
    }

    /**
     * Получить текущий индекс
     * @returns {number} Текущий индекс
     */
    getCurrentIndex() {
        return this.currentKanjiIndex;
    }

    /**
     * Сбросить состояние флэш-карт
     */
    reset() {
        this.currentKanjiIndex = 0;
        this.showHiddenInfo = false;
        this.showKanji(this.currentKanjiIndex);
    }

    /**
     * Получить статистику изучения
     * @returns {Object} Статистика
     */
    getStudyStatistics() {
        return {
            currentIndex: this.currentKanjiIndex,
            totalKanji: this.app.api.getKanjiCount(),
            progressPercentage: Math.round(((this.currentKanjiIndex + 1) / this.app.api.getKanjiCount()) * 100),
            currentKanji: this.getCurrentKanji()
        };
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Flashcards;
} else {
    window.Flashcards = Flashcards;
}
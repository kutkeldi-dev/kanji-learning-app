// Компонент для тестирования знаний кандзи

class KanjiTest {
    constructor(app) {
        this.app = app;
        this.currentTest = null;
        this.currentQuestionIndex = 0;
        this.questions = [];
        this.answers = [];
        this.testSettings = {
            questionCount: 10,
            testType: 'meaning', // meaning, reading, mixed
            weekFilter: 'all',
            dayFilter: 'all'
        };
        
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
        this.setupTestInterface();
    }

    /**
     * Привязка событий
     */
    bindEvents() {
        // Глобальная функция для совместимости
        window.startTest = () => this.startTest();
        
        // Обработчики клавиатуры для теста
        document.addEventListener('keydown', (e) => {
            if (this.currentTest && document.getElementById('test-question').style.display !== 'none') {
                if (e.key >= '1' && e.key <= '4') {
                    const optionIndex = parseInt(e.key) - 1;
                    this.selectAnswer(optionIndex);
                } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.nextQuestion();
                } else if (e.key === 'Escape') {
                    this.endTest();
                }
            }
        });
    }

    /**
     * Настройка интерфейса теста
     */
    setupTestInterface() {
        const settingsDiv = document.getElementById('test-settings');
        if (settingsDiv) {
            // Создать настройки теста
            this.createTestSettings(settingsDiv);
        }
    }

    /**
     * Создать настройки теста
     * @param {HTMLElement} container - Контейнер для настроек
     */
    createTestSettings(container) {
        const existingButton = container.querySelector('button');
        if (existingButton) {
            existingButton.remove();
        }

        // Настройки количества вопросов
        const questionCountDiv = DOMHelpers.createElement('div', 'test-setting');
        const questionCountLabel = DOMHelpers.createElement('label', '', 'Количество вопросов:');
        const questionCountSelect = DOMHelpers.createElement('select', 'test-question-count');
        questionCountSelect.id = 'test-question-count';

        [5, 10, 15, 20, 25, 30].forEach(count => {
            const option = DOMHelpers.createElement('option', '', count.toString());
            option.value = count;
            if (count === this.testSettings.questionCount) {
                option.selected = true;
            }
            questionCountSelect.appendChild(option);
        });

        questionCountSelect.addEventListener('change', (e) => {
            this.testSettings.questionCount = parseInt(e.target.value);
        });

        questionCountDiv.appendChild(questionCountLabel);
        questionCountDiv.appendChild(questionCountSelect);

        // Настройки типа теста
        const testTypeDiv = DOMHelpers.createElement('div', 'test-setting');
        const testTypeLabel = DOMHelpers.createElement('label', '', 'Тип теста:');
        const testTypeSelect = DOMHelpers.createElement('select', 'test-type-select');
        testTypeSelect.id = 'test-type-select';

        const testTypes = [
            { value: 'meaning', text: 'Угадай значение кандзи' },
            { value: 'reading', text: 'Угадай чтение кандзи' },
            { value: 'mixed', text: 'Смешанный тест' }
        ];

        testTypes.forEach(type => {
            const option = DOMHelpers.createElement('option', '', type.text);
            option.value = type.value;
            if (type.value === this.testSettings.testType) {
                option.selected = true;
            }
            testTypeSelect.appendChild(option);
        });

        testTypeSelect.addEventListener('change', (e) => {
            this.testSettings.testType = e.target.value;
        });

        testTypeDiv.appendChild(testTypeLabel);
        testTypeDiv.appendChild(testTypeSelect);

        // Фильтры по неделям и дням
        const weekFilterDiv = DOMHelpers.createElement('div', 'test-setting');
        const weekFilterLabel = DOMHelpers.createElement('label', '', 'Неделя:');
        const weekFilterSelect = DOMHelpers.createElement('select', 'test-week-filter');
        
        const weekOptions = [
            { value: 'all', text: 'Все недели' },
            { value: '1', text: 'Неделя 1' },
            { value: '2', text: 'Неделя 2' },
            { value: '3', text: 'Неделя 3' },
            { value: '4', text: 'Неделя 4' },
            { value: '5', text: 'Неделя 5' },
            { value: '6', text: 'Неделя 6' }
        ];

        weekOptions.forEach(week => {
            const option = DOMHelpers.createElement('option', '', week.text);
            option.value = week.value;
            weekFilterSelect.appendChild(option);
        });

        weekFilterSelect.addEventListener('change', (e) => {
            this.testSettings.weekFilter = e.target.value;
        });

        weekFilterDiv.appendChild(weekFilterLabel);
        weekFilterDiv.appendChild(weekFilterSelect);

        // Кнопка начала теста
        const startButton = DOMHelpers.createElement('button', 'control-btn test-start-btn', '🧠 Начать тест');
        startButton.style.fontSize = '1.2rem';
        startButton.style.padding = '15px 30px';
        startButton.style.marginTop = '20px';
        startButton.onclick = () => this.startTest();

        // Добавить все элементы
        const settingsContainer = DOMHelpers.createElement('div', 'test-settings-container');
        settingsContainer.appendChild(questionCountDiv);
        settingsContainer.appendChild(testTypeDiv);
        settingsContainer.appendChild(weekFilterDiv);
        settingsContainer.appendChild(startButton);

        container.appendChild(settingsContainer);
    }

    /**
     * Начать тест
     */
    startTest() {
        try {
            console.log('Начинаем тест...');
            
            // Показать индикатор загрузки
            NotificationHelpers.show('Подготовка теста...', 'info');
            
            // Получить кандзи для теста на основе фильтров
            const availableKanji = this.getFilteredKanji();
            console.log(`Доступно кандзи для теста: ${availableKanji.length}`);
            
            if (availableKanji.length < 4) {
                NotificationHelpers.show('Недостаточно кандзи для создания теста (минимум 4)', 'error');
                return;
            }

            // Создать вопросы с использованием setTimeout для предотвращения блокировки UI
            setTimeout(() => {
                try {
                    console.log('Генерируем вопросы...');
                    this.questions = this.generateQuestions(availableKanji);
                    
                    if (this.questions.length === 0) {
                        NotificationHelpers.show('Не удалось создать вопросы для теста', 'error');
                        return;
                    }
                    
                    console.log(`Создано вопросов: ${this.questions.length}`);
                    
                    this.answers = [];
                    this.currentQuestionIndex = 0;
                    this.currentTest = {
                        startTime: Date.now(),
                        settings: { ...this.testSettings }
                    };

                    // Показать первый вопрос
                    this.showQuestion();
                    
                    // Скрыть настройки, показать тест
                    document.getElementById('test-settings').style.display = 'none';
                    document.getElementById('test-question').style.display = 'block';
                    document.getElementById('test-results').style.display = 'none';

                    NotificationHelpers.show('Тест начат! Используйте клавиши 1-4 для выбора ответа', 'success');
                    
                } catch (innerError) {
                    console.error('Ошибка при создании вопросов:', innerError);
                    NotificationHelpers.show('Ошибка при создании вопросов теста', 'error');
                }
            }, 100); // Небольшая задержка для обновления UI

        } catch (error) {
            console.error('Ошибка при запуске теста:', error);
            NotificationHelpers.show('Ошибка при запуске теста: ' + error.message, 'error');
        }
    }

    /**
     * Получить отфильтрованные кандзи для теста
     * @returns {Array} Массив кандзи
     */
    getFilteredKanji() {
        return this.app.api.filterKanji(this.testSettings.weekFilter, this.testSettings.dayFilter);
    }

    /**
     * Генерировать вопросы для теста
     * @param {Array} availableKanji - Доступные кандзи
     * @returns {Array} Массив вопросов
     */
    generateQuestions(availableKanji) {
        const questions = [];
        const usedKanji = new Set();
        
        // Ограничиваем количество вопросов доступными кандзи
        const maxQuestions = Math.min(this.testSettings.questionCount, availableKanji.length);
        
        for (let i = 0; i < maxQuestions; i++) {
            // Выбрать случайный кандзи, который еще не использовался
            let randomKanji;
            let attempts = 0;
            const maxAttempts = availableKanji.length * 2;
            
            do {
                randomKanji = availableKanji[Math.floor(Math.random() * availableKanji.length)];
                attempts++;
                
                // Предотвращение бесконечного цикла
                if (attempts >= maxAttempts) {
                    console.warn('Достигнуто максимальное количество попыток поиска уникального кандзи');
                    break;
                }
            } while (usedKanji.has(randomKanji.kanji) && attempts < maxAttempts);
            
            // Если не удалось найти уникальный кандзи, прерываем
            if (usedKanji.has(randomKanji.kanji)) {
                console.warn('Не удалось найти больше уникальных кандзи для теста');
                break;
            }
            
            usedKanji.add(randomKanji.kanji);

            // Определить тип вопроса
            let questionType = this.testSettings.testType;
            if (questionType === 'mixed') {
                questionType = Math.random() < 0.5 ? 'meaning' : 'reading';
            }

            try {
                // Создать вопрос
                const question = this.createQuestion(randomKanji, questionType, availableKanji);
                questions.push(question);
            } catch (error) {
                console.error('Ошибка при создании вопроса:', error);
                break;
            }
        }

        console.log(`Создано ${questions.length} вопросов для теста`);
        return questions;
    }

    /**
     * Получить чтение кандзи (поддерживает разные форматы данных)
     * @param {Object} kanji - Объект кандзи
     * @returns {string} Чтение кандзи
     */
    getKanjiReading(kanji) {
        if (!kanji.readings) {
            return 'Нет чтения';
        }

        // Формат 1: объект с on и kun
        if (kanji.readings.on && kanji.readings.on.length > 0) {
            return kanji.readings.on[0];
        }
        if (kanji.readings.kun && kanji.readings.kun.length > 0) {
            return kanji.readings.kun[0];
        }

        // Формат 2: простой массив
        if (Array.isArray(kanji.readings) && kanji.readings.length > 0) {
            return kanji.readings[0];
        }

        return 'Нет чтения';
    }

    /**
     * Создать отдельный вопрос
     * @param {Object} targetKanji - Целевой кандзи
     * @param {string} questionType - Тип вопроса
     * @param {Array} allKanji - Все доступные кандзи
     * @returns {Object} Объект вопроса
     */
    createQuestion(targetKanji, questionType, allKanji) {
        // Получить правильный ответ в зависимости от типа вопроса
        let correctAnswer;
        if (questionType === 'meaning') {
            correctAnswer = targetKanji.meaning;
        } else {
            // Для чтений - поддержка разных форматов данных
            correctAnswer = this.getKanjiReading(targetKanji);
        }
        
        // Проверить, что правильный ответ не пустой
        if (!correctAnswer || correctAnswer === 'Нет чтения') {
            console.warn('Пустой или недопустимый ответ для кандзи:', targetKanji.kanji, correctAnswer);
        }

        const question = {
            kanji: targetKanji.kanji,
            type: questionType,
            correctAnswer: correctAnswer,
            options: [],
            correctIndex: -1
        };

        // Создать варианты ответов
        const options = [question.correctAnswer];
        const usedAnswers = new Set([question.correctAnswer]);
        
        console.log(`Создаем вопрос для кандзи ${targetKanji.kanji} (${questionType}): ${correctAnswer}`);

        // Добавить неправильные варианты
        let attempts = 0;
        const maxAttempts = allKanji.length * 2; // Предотвращаем бесконечный цикл
        
        while (options.length < 4 && attempts < maxAttempts) {
            attempts++;
            const randomKanji = allKanji[Math.floor(Math.random() * allKanji.length)];
            let wrongAnswer;
            
            if (questionType === 'meaning') {
                wrongAnswer = randomKanji.meaning;
            } else {
                wrongAnswer = this.getKanjiReading(randomKanji);
            }

            if (!usedAnswers.has(wrongAnswer) && wrongAnswer) {
                options.push(wrongAnswer);
                usedAnswers.add(wrongAnswer);
            }
        }
        
        // Если не удалось найти достаточно уникальных ответов, добавить заглушки
        while (options.length < 4) {
            const fakeAnswer = questionType === 'meaning' 
                ? `Вариант ${options.length}` 
                : `チテキング${options.length}`;
            
            if (!usedAnswers.has(fakeAnswer)) {
                options.push(fakeAnswer);
                usedAnswers.add(fakeAnswer);
            } else {
                break; // Предотвращаем еще один потенциальный бесконечный цикл
            }
        }

        // Перемешать варианты
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }

        question.options = options;
        question.correctIndex = options.indexOf(question.correctAnswer);

        console.log(`Вопрос создан:`, {
            kanji: question.kanji,
            type: question.type,
            correctAnswer: question.correctAnswer,
            options: question.options,
            correctIndex: question.correctIndex
        });

        return question;
    }

    /**
     * Показать текущий вопрос
     */
    showQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.showResults();
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        console.log('Показываем вопрос:', question);
        
        const questionContainer = document.getElementById('test-question');
        
        DOMHelpers.clear(questionContainer);

        // Прогресс
        const progressDiv = DOMHelpers.createElement('div', 'test-progress');
        progressDiv.textContent = `Вопрос ${this.currentQuestionIndex + 1} из ${this.questions.length}`;
        
        const progressBar = DOMHelpers.createElement('div', 'test-progress-bar');
        const progressFill = DOMHelpers.createElement('div', 'test-progress-fill');
        progressFill.style.width = `${(this.currentQuestionIndex / this.questions.length) * 100}%`;
        progressBar.appendChild(progressFill);

        // Кандзи
        const kanjiDiv = DOMHelpers.createElement('div', 'test-kanji', question.kanji);

        // Вопрос
        const questionText = question.type === 'meaning' 
            ? 'Выберите правильное значение этого кандзи:'
            : 'Выберите правильное чтение этого кандзи:';
        const questionDiv = DOMHelpers.createElement('div', 'test-question-text', questionText);

        // Варианты ответов
        const optionsContainer = DOMHelpers.createElement('div', 'test-options');
        
        console.log('Создаем варианты ответов:', question.options);
        
        if (question.options && question.options.length > 0) {
            question.options.forEach((option, index) => {
                const optionDiv = DOMHelpers.createElement('div', 'test-option');
                
                // Добавить номер для подсказки
                const numberSpan = DOMHelpers.createElement('span', 'option-number', `${index + 1}. `);
                const textSpan = DOMHelpers.createElement('span', 'option-text', option || 'Вариант не загружен');
                
                optionDiv.appendChild(numberSpan);
                optionDiv.appendChild(textSpan);
                
                optionDiv.onclick = () => this.selectAnswer(index);
                optionDiv.setAttribute('data-index', index);
                
                optionsContainer.appendChild(optionDiv);
            });
        } else {
            console.error('Нет вариантов ответов для вопроса:', question);
            const errorDiv = DOMHelpers.createElement('div', 'test-error', 'Ошибка: варианты ответов не загружены');
            optionsContainer.appendChild(errorDiv);
        }

        // Кнопки управления
        const controlsDiv = DOMHelpers.createElement('div', 'test-controls');
        const nextBtn = DOMHelpers.createElement('button', 'control-btn test-next-btn', 'Следующий →');
        nextBtn.onclick = () => this.nextQuestion();
        nextBtn.disabled = true;

        const endBtn = DOMHelpers.createElement('button', 'control-btn test-end-btn', 'Завершить тест');
        endBtn.style.background = '#dc3545';
        endBtn.onclick = () => this.endTest();

        controlsDiv.appendChild(nextBtn);
        controlsDiv.appendChild(endBtn);

        // Подсказка
        const hintDiv = DOMHelpers.createElement('div', 'test-hint', 
            '💡 Используйте клавиши 1-4 для выбора ответа, Enter для продолжения');

        questionContainer.appendChild(progressDiv);
        questionContainer.appendChild(progressBar);
        questionContainer.appendChild(kanjiDiv);
        questionContainer.appendChild(questionDiv);
        questionContainer.appendChild(optionsContainer);
        questionContainer.appendChild(controlsDiv);
        questionContainer.appendChild(hintDiv);
    }

    /**
     * Выбрать ответ
     * @param {number} optionIndex - Индекс выбранного варианта
     */
    selectAnswer(optionIndex) {
        const options = document.querySelectorAll('.test-option');
        const nextBtn = document.querySelector('.test-next-btn');
        
        // Убрать предыдущие выборы
        options.forEach(option => {
            option.classList.remove('selected');
        });

        // Выделить выбранный вариант
        if (options[optionIndex]) {
            options[optionIndex].classList.add('selected');
        }

        // Включить кнопку "Следующий"
        if (nextBtn) {
            nextBtn.disabled = false;
        }

        // Сохранить ответ
        this.answers[this.currentQuestionIndex] = optionIndex;
    }

    /**
     * Перейти к следующему вопросу
     */
    nextQuestion() {
        if (this.answers[this.currentQuestionIndex] === undefined) {
            NotificationHelpers.show('Пожалуйста, выберите ответ', 'warning');
            return;
        }

        this.currentQuestionIndex++;
        
        if (this.currentQuestionIndex >= this.questions.length) {
            this.showResults();
        } else {
            this.showQuestion();
        }
    }

    /**
     * Завершить тест досрочно
     */
    endTest() {
        if (confirm('Вы уверены, что хотите завершить тест?')) {
            this.showResults();
        }
    }

    /**
     * Показать результаты теста
     */
    showResults() {
        const endTime = Date.now();
        const duration = Math.round((endTime - this.currentTest.startTime) / 1000);

        // Подсчитать результаты
        let correctAnswers = 0;
        const detailedResults = [];

        for (let i = 0; i < this.currentQuestionIndex; i++) {
            const question = this.questions[i];
            const userAnswer = this.answers[i];
            const isCorrect = userAnswer === question.correctIndex;
            
            if (isCorrect) {
                correctAnswers++;
            }

            detailedResults.push({
                question: question,
                userAnswer: userAnswer,
                isCorrect: isCorrect
            });
        }

        const percentage = Math.round((correctAnswers / this.currentQuestionIndex) * 100);

        // Показать результаты
        this.renderResults({
            totalQuestions: this.currentQuestionIndex,
            correctAnswers: correctAnswers,
            percentage: percentage,
            duration: duration,
            detailedResults: detailedResults
        });

        // Переключить интерфейс
        document.getElementById('test-question').style.display = 'none';
        document.getElementById('test-results').style.display = 'block';

        this.currentTest = null;
    }

    /**
     * Отрендерить результаты теста
     * @param {Object} results - Объект с результатами
     */
    renderResults(results) {
        const resultsContainer = document.getElementById('test-results');
        DOMHelpers.clear(resultsContainer);

        // Заголовок
        const titleDiv = DOMHelpers.createElement('div', 'test-results-title');
        const title = DOMHelpers.createElement('h2', '', '📊 Результаты теста');
        titleDiv.appendChild(title);

        // Общая статистика
        const statsDiv = DOMHelpers.createElement('div', 'test-stats');
        
        const scoreDiv = DOMHelpers.createElement('div', 'test-score', `${results.percentage}%`);
        const detailsDiv = DOMHelpers.createElement('div', 'test-details');
        detailsDiv.innerHTML = `
            <p><strong>Правильных ответов:</strong> ${results.correctAnswers} из ${results.totalQuestions}</p>
            <p><strong>Время:</strong> ${Math.floor(results.duration / 60)}:${String(results.duration % 60).padStart(2, '0')}</p>
        `;

        // Оценка
        let grade = '';
        if (results.percentage >= 90) grade = '🏆 Отлично!';
        else if (results.percentage >= 75) grade = '🥈 Хорошо!';
        else if (results.percentage >= 60) grade = '🥉 Удовлетворительно';
        else grade = '📚 Нужно больше практики';

        const gradeDiv = DOMHelpers.createElement('div', 'test-grade', grade);

        statsDiv.appendChild(scoreDiv);
        statsDiv.appendChild(detailsDiv);
        statsDiv.appendChild(gradeDiv);

        // Детальные результаты
        const detailsContainer = DOMHelpers.createElement('div', 'test-detailed-results');
        const detailsTitle = DOMHelpers.createElement('h3', '', 'Детальные результаты:');
        detailsContainer.appendChild(detailsTitle);

        results.detailedResults.forEach((result, index) => {
            const resultItem = DOMHelpers.createElement('div', 
                `test-result-item ${result.isCorrect ? 'correct' : 'incorrect'}`);
            
            const kanji = result.question.kanji;
            const correctAnswer = result.question.correctAnswer;
            const userAnswerText = result.userAnswer !== undefined 
                ? result.question.options[result.userAnswer] 
                : 'Не отвечено';

            resultItem.innerHTML = `
                <div class="result-kanji">${kanji}</div>
                <div class="result-details">
                    <div class="result-status">${result.isCorrect ? '✅' : '❌'}</div>
                    <div class="result-answers">
                        <div class="correct-answer">Правильный ответ: ${correctAnswer}</div>
                        ${!result.isCorrect ? `<div class="user-answer">Ваш ответ: ${userAnswerText}</div>` : ''}
                    </div>
                </div>
            `;

            detailsContainer.appendChild(resultItem);
        });

        // Кнопки действий
        const actionsDiv = DOMHelpers.createElement('div', 'test-actions');
        
        const newTestBtn = DOMHelpers.createElement('button', 'control-btn', '🔄 Новый тест');
        newTestBtn.onclick = () => this.resetTest();

        const reviewBtn = DOMHelpers.createElement('button', 'control-btn', '📚 Изучить ошибки');
        reviewBtn.onclick = () => this.reviewMistakes(results.detailedResults);

        actionsDiv.appendChild(newTestBtn);
        actionsDiv.appendChild(reviewBtn);

        // Собрать все вместе
        resultsContainer.appendChild(titleDiv);
        resultsContainer.appendChild(statsDiv);
        resultsContainer.appendChild(detailsContainer);
        resultsContainer.appendChild(actionsDiv);
    }

    /**
     * Сбросить тест и вернуться к настройкам
     */
    resetTest() {
        this.currentTest = null;
        this.currentQuestionIndex = 0;
        this.questions = [];
        this.answers = [];

        document.getElementById('test-settings').style.display = 'block';
        document.getElementById('test-question').style.display = 'none';
        document.getElementById('test-results').style.display = 'none';

        NotificationHelpers.show('Готов к новому тесту', 'success');
    }

    /**
     * Просмотреть ошибки в флэш-картах
     * @param {Array} detailedResults - Детальные результаты
     */
    reviewMistakes(detailedResults) {
        const mistakes = detailedResults.filter(result => !result.isCorrect);
        
        if (mistakes.length === 0) {
            NotificationHelpers.show('У вас нет ошибок для изучения!', 'success');
            return;
        }

        // Найти индекс первого ошибочного кандзи
        const firstMistake = mistakes[0];
        const allKanji = this.app.api.getAllKanji();
        const kanjiIndex = allKanji.findIndex(k => k.kanji === firstMistake.question.kanji);

        if (kanjiIndex !== -1 && this.app.flashcards) {
            this.app.flashcards.setCurrentIndex(kanjiIndex);
            this.app.navigation.navigateTo('flashcards');
            NotificationHelpers.show(`Переход к изучению ошибок. Всего ошибок: ${mistakes.length}`, 'info');
        }
    }

    /**
     * Получить статистику тестов
     * @returns {Object} Статистика
     */
    getTestStatistics() {
        return {
            currentTest: this.currentTest,
            currentQuestionIndex: this.currentQuestionIndex,
            totalQuestions: this.questions.length,
            settings: this.testSettings
        };
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KanjiTest;
} else {
    window.KanjiTest = KanjiTest;
}
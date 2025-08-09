// Вспомогательные функции

/**
 * Показывает/скрывает элементы
 */
const DOMHelpers = {
    /**
     * Показать элемент
     * @param {HTMLElement|string} element - Элемент или селектор
     */
    show(element) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) el.style.display = 'block';
    },

    /**
     * Скрыть элемент
     * @param {HTMLElement|string} element - Элемент или селектор
     */
    hide(element) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) el.style.display = 'none';
    },

    /**
     * Переключить видимость элемента
     * @param {HTMLElement|string} element - Элемент или селектор
     */
    toggle(element) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) {
            el.style.display = el.style.display === 'none' ? 'block' : 'none';
        }
    },

    /**
     * Добавить класс активности
     * @param {HTMLElement|string} element - Элемент или селектор
     * @param {string} className - Класс для добавления
     */
    addClass(element, className = 'active') {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) el.classList.add(className);
    },

    /**
     * Убрать класс активности
     * @param {HTMLElement|string} element - Элемент или селектор
     * @param {string} className - Класс для удаления
     */
    removeClass(element, className = 'active') {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) el.classList.remove(className);
    },

    /**
     * Убрать класс у всех элементов
     * @param {string} selector - Селектор элементов
     * @param {string} className - Класс для удаления
     */
    removeClassFromAll(selector, className = 'active') {
        document.querySelectorAll(selector).forEach(el => {
            el.classList.remove(className);
        });
    },

    /**
     * Очистить содержимое элемента
     * @param {HTMLElement|string} element - Элемент или селектор
     */
    clear(element) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) el.innerHTML = '';
    },

    /**
     * Создать элемент с классами и содержимым
     * @param {string} tag - Тег элемента
     * @param {string|Array} className - Класс или массив классов
     * @param {string} content - Содержимое элемента
     * @returns {HTMLElement} Созданный элемент
     */
    createElement(tag, className = '', content = '') {
        const element = document.createElement(tag);
        
        if (className) {
            if (Array.isArray(className)) {
                element.classList.add(...className);
            } else {
                element.className = className;
            }
        }
        
        if (content) {
            element.innerHTML = content;
        }
        
        return element;
    }
};

/**
 * Утилиты для работы с данными
 */
const DataHelpers = {
    /**
     * Перемешать массив
     * @param {Array} array - Массив для перемешивания
     * @returns {Array} Перемешанный массив
     */
    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    /**
     * Получить случайное число в диапазоне
     * @param {number} min - Минимум
     * @param {number} max - Максимум
     * @returns {number} Случайное число
     */
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Выбрать случайный элемент из массива
     * @param {Array} array - Массив
     * @returns {*} Случайный элемент
     */
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    /**
     * Получить несколько случайных элементов из массива
     * @param {Array} array - Массив
     * @param {number} count - Количество элементов
     * @returns {Array} Массив случайных элементов
     */
    randomChoices(array, count) {
        const shuffled = this.shuffle(array);
        return shuffled.slice(0, count);
    },

    /**
     * Группировать массив по ключу
     * @param {Array} array - Массив объектов
     * @param {string} key - Ключ для группировки
     * @returns {Object} Сгруппированный объект
     */
    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key] || 'undefined';
            if (!groups[group]) {
                groups[group] = [];
            }
            groups[group].push(item);
            return groups;
        }, {});
    }
};

/**
 * Утилиты для анимации
 */
const AnimationHelpers = {
    /**
     * Плавная анимация появления
     * @param {HTMLElement} element - Элемент
     * @param {number} duration - Длительность в мс
     */
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
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

    /**
     * Плавная анимация исчезновения
     * @param {HTMLElement} element - Элемент
     * @param {number} duration - Длительность в мс
     */
    fadeOut(element, duration = 300) {
        element.style.opacity = '1';
        
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
    },

    /**
     * Анимация тряски элемента
     * @param {HTMLElement} element - Элемент
     * @param {number} duration - Длительность в мс
     */
    shake(element, duration = 500) {
        element.style.animation = `shake ${duration}ms ease-in-out`;
        
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    }
};

/**
 * Утилиты для уведомлений
 */
const NotificationHelpers = {
    /**
     * Показать уведомление
     * @param {string} message - Сообщение
     * @param {string} type - Тип уведомления (success, error, info, warning)
     * @param {number} duration - Длительность показа в мс
     */
    show(message, type = 'info', duration = 3000) {
        const notification = DOMHelpers.createElement('div', ['notification', `notification-${type}`], message);
        
        // Стили для уведомления
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            backgroundColor: this.getTypeColor(type),
            color: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: '10000',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });
        
        document.body.appendChild(notification);
        
        // Анимация появления
        AnimationHelpers.fadeIn(notification);
        
        // Автоматическое скрытие
        setTimeout(() => {
            AnimationHelpers.fadeOut(notification);
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    },

    /**
     * Получить цвет для типа уведомления
     * @param {string} type - Тип уведомления
     * @returns {string} Цвет в hex
     */
    getTypeColor(type) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        return colors[type] || colors.info;
    }
};

/**
 * Утилиты для хранения данных
 */
const StorageHelpers = {
    /**
     * Сохранить данные в localStorage
     * @param {string} key - Ключ
     * @param {*} value - Значение
     */
    save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Ошибка сохранения в localStorage:', error);
        }
    },

    /**
     * Загрузить данные из localStorage
     * @param {string} key - Ключ
     * @param {*} defaultValue - Значение по умолчанию
     * @returns {*} Загруженные данные
     */
    load(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Ошибка загрузки из localStorage:', error);
            return defaultValue;
        }
    },

    /**
     * Удалить данные из localStorage
     * @param {string} key - Ключ
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Ошибка удаления из localStorage:', error);
        }
    },

    /**
     * Очистить все данные из localStorage
     */
    clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Ошибка очистки localStorage:', error);
        }
    }
};

// Добавим стили для анимации тряски
if (!document.getElementById('helper-styles')) {
    const style = document.createElement('style');
    style.id = 'helper-styles';
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
            20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
    `;
    document.head.appendChild(style);
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DOMHelpers,
        DataHelpers,
        AnimationHelpers,
        NotificationHelpers,
        StorageHelpers
    };
} else {
    window.DOMHelpers = DOMHelpers;
    window.DataHelpers = DataHelpers;
    window.AnimationHelpers = AnimationHelpers;
    window.NotificationHelpers = NotificationHelpers;
    window.StorageHelpers = StorageHelpers;
}
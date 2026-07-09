# 🧰 Интерактивные UI-компоненты (UI Patterns)

### Паттерн: Задержка закрытия окна при потере фокуса (onBlur + setTimeout)
**Теги:** `#react #ui #dropdown #autocomplete #blur #timeout`
**Суть:** Защита выпадающего окна от преждевременного исчезновения. Браузер выполняет `onBlur` (на инпуте) быстрее, чем `onClick` (на элементе списка). Короткий таймер `setTimeout` искусственно сдвигает закрытие окна в конец очереди событий, позволяя успеть зарегистрировать клик по элементу.

<details>

```tsx
import { useState, useRef, useEffect } from 'react';

export const DropdownMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // 1. Создаем ссылку на верхний DOM-контейнер меню
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Если меню закрыто — вешать глобальный слушатель событий нет смысла
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const container = dropdownRef.current;

      // 2. Проверяем: если контейнер существует и клик произошел МИМО него
      if (container && !container.contains(target)) {
        setIsOpen(false); // Закрываем меню
      }
    };

    // 'mousedown' срабатывает быстрее обычного 'click', улучшая отзывчивость интерфейса
    document.addEventListener('mousedown', handleClickOutside);
    
    // Обязательная очистка глобального слушателя
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]); // Эффект перезапускается только при переключении состояния видимости

  return (
    // 3. Привязываем созданный реф к самому верхнему оберточному тегу
    <div ref={dropdownRef} className="dropdown-container">
      <button onClick={() => setIsOpen(!isOpen)}>Открыть меню</button>
      
      {isOpen && (
        <ul className="dropdown-menu">
          <li>Пункт 1</li>
          <li>Пункт 2</li>
        </ul>
      )}
    </div>
  );
};
```
</details>







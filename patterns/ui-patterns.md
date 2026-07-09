# 🧰 Интерактивные UI-компоненты (UI Patterns)

### Закрытие элемента по клику вне его области (Click Outside через useRef)
Теги: #react #ui #dropdown #use-ref #dom-events #click-outside
Суть: Закрытие кастомных модалок, меню или дропдаунов при клике в любую точку экрана за пределами самого элемента. Использование нативного метода DOM-узла .contains() позволяет точно определить, был ли клик совершен по дочерним элементам контейнера или мимо него.

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







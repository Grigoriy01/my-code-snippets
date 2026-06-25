# 🧰 Интерактивные UI-компоненты (UI Patterns)

### Паттерн: Задержка закрытия окна при потере фокуса (onBlur + setTimeout)
**Теги:** `#react #ui #dropdown #autocomplete #blur #timeout`
**Суть:** Защита выпадающего окна от преждевременного исчезновения. Браузер выполняет `onBlur` (на инпуте) быстрее, чем `onClick` (на элементе списка). Короткий таймер `setTimeout` искусственно сдвигает закрытие окна в конец очереди событий, позволяя успеть зарегистрировать клик по элементу.

<details>

```tsx
import { useState, useRef, useEffect } from 'react';

export const AutocompleteInput = ({ items, onSelect }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  // Хранилище для ссылки на таймер, чтобы избежать утечек памяти
  const timeoutRef = useRef<number | null>(null);

  // Очистка таймера при размонтировании компонента (Защита от краша)
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleBlur = () => {
    // Сдвигаем закрытие в конец очереди макрозадач (Event Loop)
    timeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 150); // 150мс достаточно, чтобы успел сработать onClick дочернего элемента
  };

  const handleFocus = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleItemClick = (item: any) => {
    // Если клик успел сработать — очищаем таймер закрытия
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setQuery(item.label);
    setIsOpen(false);
    onSelect(item);
  };

  return (
    <div className="autocomplete-container">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      
      {isOpen && (
        <ul className="dropdown-list">
          {items.map((item) => (
            <li key={item.id} onClick={() => handleItemClick(item)}>
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```
</details>

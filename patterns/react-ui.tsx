//#region Pattern: Delayed Dropdown Close on Blur (onBlur + setTimeout) / Задержка закрытия окна при потере фокуса
//=========================================================================================================
## Pattern: Delayed Dropdown Close on Blur (onBlur + setTimeout) / Задержка закрытия окна при потере фокуса
//=========================================================================================================
// Description: Предотвращение преждевременного скрытия интерактивных элементов из DOM до регистрации события onClick на дочерних узлах.
// Tags: react, ui, dropdown, autocomplete, blur, timeout, focus, typescript

/**
 * ❓ ПРОБЛЕМА:
 * При создании кастомных выпадающих списков (Dropdown), окон автокомплита или подсказок используется 
 * событие onBlur (потеря фокуса), чтобы автоматически закрывать окно, когда пользователь кликает вне его области. 
 * Но возникает баг: если пользователь кликает по элементу внутри самого выпадающего списка (например, хочет выбрать 
 * пункт меню), событие onBlur срабатывает БЫСТРЕЕ, чем событие onClick на этом пункте. В итоге окно мгновенно 
 * исчезает из DOM, а клик по пункту так и не регистрируется.
 * * Напряженность типов возникает при некорректном управлении жизненным циклом асинхронных таймеров (NodeJS.Timeout vs number) 
 * внутри хуков React и потенциальных утечках памяти, если компонент размонтируется до срабатывания setTimeout.
 * * 🧠 КАК ЭТО ПОНЯТЬ (МЕНТАЛЬНАЯ МОДЕЛЬ):
 * Представь охранника (событие onBlur), который стоит у дверей клуба (нашего выпадающего списка). Как только 
 * последний посетитель отворачивается от двери, охранник моментально выключает свет и запирает клуб. Посетитель 
 * хотел нажать на кнопку внутри, но не успел — стало темно. setTimeout на 200 миллисекунд — это как если бы мы 
 * попросили охранника: «Когда увидишь, что все уходят, не закрывай дверь мгновенно. Сосчитай про себя до трех». 
 * За эти «три секунды» (200 мс) посетитель как раз успевает нажать на нужную кнопку, клик срабатывает, а уже 
 * потом закрывается сама дверь.
 * * ⚠️ WARNING (ПРОИЗВОДИТЕЛЬНОСТЬ И БЕЗОПАСНОСТЬ):
 * Прямое использование анонимного setTimeout(() => {}, 200) внутри инлайнового обработчика onBlur без сохранения 
 * идентификатора таймера может привести к «гонке условий» (race conditions) или утечкам памяти при быстром 
 * размонтировании компонента. Для ультимативной рантайм-безопасности необходимо очищать таймер в хуке размонтирования 
 * или использовать событие onMouseDown (которое срабатывает до onBlur) вместо макротасок таймера, если это допустимо интерфейсом.
 */

import React, { useState, useEffect, useRef } from 'react';

// STRICT TYPES & INTERFACES
// ============================================================================

export interface AutocompleteItem {
  id: string;
  label: string;
}

interface SearchAutocompleteProps {
  items: AutocompleteItem[];
  onSelect: (item: AutocompleteItem) => void;
  placeholder?: string;
}

// COMPONENT LOGIC / IMPLEMENTATION
// ============================================================================

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  items,
  onSelect,
  placeholder = 'Поиск...'
}) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Хранилище для ID таймера для предотвращения утечек памяти
  const timeoutRef = useRef<number | null>(null);

  // Очистка таймера при размонтировании компонента
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleFocus = () => {
    // Если был запланирован таймаут закрытия, отменяем его при повторном фокусе
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsActive(true);
  };

  const handleBlur = () => {
    // Паттерн: откладываем закрытие, чтобы onClick внутри списка успел отработать в макротаске
    timeoutRef.current = window.setTimeout(() => {
      setIsActive(false);
      timeoutRef.current = null;
    }, 200); // 200мс гарантированно достаточно для регистрации клика на элементах списка
  };

  const handleItemClick = (item: AutocompleteItem) => {
    onSelect(item);
    setSearchQuery(item.label);
    setIsActive(false);
  };

  // Фильтрация элементов на основе ввода пользователя
  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ position: 'relative', width: '300px', fontFamily: 'sans-serif' }}>
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
      />

      {/* Выпадающий список, который рендерится в зависимости от стейта активости */}
      {isActive && filteredItems.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#ffffff',
            border: '1px solid #ccc',
            margin: '4px 0 0 0',
            padding: 0,
            listStyle: 'none',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          {filteredItems.map((item) => (
            <li
              key={item.id}
              onClick={() => handleItemClick(item)}
              style={{
                cursor: 'pointer',
                padding: '8px 12px',
                borderBottom: '1px solid #eee',
                backgroundColor: '#ffffff'
              }}
              // Подсветка при наведении мыши силами CSS (опционально)
              onMouseEnter={(e) => { (e.currentTarget as HTMLLIElement).style.backgroundColor = '#f5f5f5'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLLIElement).style.backgroundColor = '#ffffff'; }}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// PRACTICAL USAGE EXAMPLE (PARENT COMPONENT)
// ============================================================================

export const DropdownDemo: React.FC = () => {
  const techStack: AutocompleteItem[] = [
    { id: '1', label: 'React' },
    { id: '2', label: 'TypeScript' },
    { id: '3', label: 'JavaScript' },
    { id: '4', label: 'Next.js' },
    { id: '5', label: 'Node.js' }
  ];

  const handleSelectTech = (item: AutocompleteItem) => {
    console.log(`Выбран элемент репозитория: [ID: ${item.id}] ${item.label}`);
  };

  return (
    <div style={{ padding: '40px', background: '#f9f9f9', minHeight: '300px' }}>
      <h3>Кастомный автокомплит (Тест onBlur)</h3>
      <SearchAutocomplete 
        items={techStack} 
        onSelect={handleSelectTech} 
        placeholder="Поиск технологии..." 
      />
    </div>
  );
};
//#endregion

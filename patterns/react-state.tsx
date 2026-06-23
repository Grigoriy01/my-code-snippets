//#region Pattern: Data Enrichment (Merging Arrays) / Объединение массивов (Обогащение данных)
//========================================================================================
## Pattern: Data Enrichment (Merging Arrays) / Объединение массивов (Обогащение данных)
//=======================================================================================
// Description: Объединение двух массивов данных 
  //(например, задач и авторов) по связующему ID для построения глубоких объектов.
// Tags: react, state, map, find, arrays, data-enrichment, typescript, join

/**
 * ❓ ПРОБЛЕМА:
 * С сервера прилетает плоский массив (например, задачи `todos`), где у каждой задачи есть только `userId`.
 * А интерфейсу или строгим типам TypeScript нужен глубокий объект, где внутри каждой задачи лежит 
 * полноценный объект автора `user`. TypeScript ругается на несовпадение типов или отсутствие полей.
 * 
 * 🧠 КАК ЭТО ПОНЯТЬ (МЕНТАЛЬНАЯ МОДЕЛЬ):
 * У нас есть коробка с письмами (задачи) и список жителей дома (пользователи). На каждом письме 
 * написан только номер квартиры (userId). Мы берем каждое письмо, смотрим на этот номер, 
 * ищем человека в списке жителей и "вкладываем" его визитку прямо внутрь конверта с письмом[cite: 1]. 
 * Теперь у нас коробка писем, в каждом из которых уже лежит полная информация об авторе[cite: 1].
 */

import { useState } from 'react';

// 1. Описываем строгие интерфейсы данных для TypeScript
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Todo {
  id: number;
  title: string;
  userId: number;
  completed: boolean;
  user: User; // Глубокий объект автора, который мы и будем "вкладывать"
}

// 2. Чистая функция-хелпер для трансформации данных
export const getEnrichedTodos = (
  todosFromServer: Omit<Todo, 'user'>[], // Сырые задачи с сервера (еще без объекта user)
  usersFromServer: User[]                // Список пользователей с сервера
): Todo[] => {
  return todosFromServer.map(todo => {
    // Ищем юзера, у которого id совпадает с userId в задаче
    const foundUser = usersFromServer.find(user => user.id === todo.userId);

    return {
      ...todo, // Копируем все существующие поля задачи (id, title, completed, userId)[cite: 1]
      
      // ОПТИМИЗАЦИЯ ТИПОВ: Мы избегаем опасного оператора "!", заменяя его безопасным дефолтным объектом.
      // Если на сервере произойдет сбой и какого-то юзера не окажется в списке, приложение не упадет в рантайме.
      user: foundUser || { id: 0, name: 'Unknown User', email: 'none' }
    };
  });
};

// 3. ПРИМЕР ИСПОЛЬЗОВАНИЯ В REACT-КОМПОНЕНТЕ:
export const TodoListContainer = ({ 
  initialTodos, 
  initialUsers 
}: { 
  initialTodos: Omit<Todo, 'user'>[], 
  initialUsers: User[] 
}) => {
  
  // Вызываем функцию подготовки и склеивания данных СТРОГО до инициализации стейта[cite: 1]
  const preparedTodos = getEnrichedTodos(initialTodos, initialUsers);
  
  // Передаем в стейт уже валидный, полностью обогащенный массив объектов[cite: 1]
  const [todos, setTodos] = useState<Todo[]>(preparedTodos);

  return (
    <div className="todo-list">
      {todos.map(todo => (
        <div key={todo.id} className="todo-item">
          <h3>{todo.title}</h3>
          <p>Автор: <strong>{todo.user.name}</strong> ({todo.user.email})</p>
        </div>
      ))}
    </div>
  );
};
//#endregion

//#region Pattern: Lifting State Up With Enrichment / Поднятие состояния с обогащением данных
//====================================================================================
## Pattern: Lifting State Up With Enrichment / Поднятие состояния с обогащением данных
//====================================================================================
// Description: Поднятие сырых данных из дочерней формы в родительский компонент с деструктуризацией, вычислением безопасного инкрементного ID и обогащением связанными сущностями.
// Tags: react, state, lifting-state-up, destructuring, math-max, enrichment, typescript

/**
 * ❓ ПРОБЛЕМА:
 * Дочерний компонент (например, форма ввода) собирает «сырые» данные от пользователя, но не обладает
 * контекстом всего приложения. Он не должен самостоятельно генерировать ID (так как не знает о других элементах),
 * выполнять склейку с другими сущностями из стейта или напрямую мутировать глобальное состояние.
 * Напряженность типов возникает при попытке безопасно связать внешние данные без использования принудительного
 * приведения типов (as, !) или при риске переполнения/ошибок выполнения на пустых массивах.
 * * 🧠 КАК ЭТО ПОНЯТЬ (МЕНТАЛЬНАЯ МОДЕЛЬ):
 * Форма — это курьер. Её задача — просто взять у клиента данные (текст, выбор в селекте), запаковать
 * в один пакет и принести в главный офис (родительский компонент). Главный офис принимает этот пакет,
 * распаковывает (деструктуризация), присваивает ему следующий по порядку регистрационный номер (индекс),
 * прикрепляет к нему личное дело ответственного сотрудника (обогащение данных) и заносит в общую 
 * амбарную книгу (обновляет иммутабельный стейт).
 * * ⚠️ WARNING (ПРОИЗВОДИТЕЛЬНОСТЬ):
 * Использование конструкции Math.max(...todos.map(t => t.id)) имеет линейную сложность O(n).
 * На огромных массивах (10000+ элементов) оператор распыления (...) может вызвать переполнение стека вызовов (Maximum call stack size exceeded).
 * Для объемных коллекций рекомендуется хранить счетчик последнего ID в отдельном стейте или использовать детерминированные UUID.
 */

import React, { useState } from 'react';

// STRICT TYPES & INTERFACES
// ============================================================================

export interface User {
  id: number;
  name: string;
}

export interface Todo {
  id: number;
  title: string;
  userId: number;
  completed: boolean;
  user: User; // Обогащенные данные
}

export interface NewTodoPayload {
  title: string;
  userId: number;
}

interface NewTodoFormProps {
  onSubmit: (payload: NewTodoPayload) => void;
  users: User[];
}

// COMPONENT LOGIC / IMPLEMENTATION
// ============================================================================

export const NewTodoForm: React.FC<NewTodoFormProps> = ({ onSubmit, users }) => {
  const [title, setTitle] = useState('');
  const [userId, setUserId] = useState<number | ''>('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || userId === '') return;

    // Передаем «сырые» данные наверх
    onSubmit({ title: title.trim(), userId });
    
    // Сброс локального состояния
    setTitle('');
    setUserId('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
      <input
        type="text"
        placeholder="Название задачи..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <select value={userId} onChange={(e) => setUserId(Number(e.target.value))}>
        <option value="">Выберите пользователя</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
      <button type="submit">Добавить</button>
    </form>
  );
};

// PRACTICAL USAGE EXAMPLE (PARENT COMPONENT)
// ============================================================================

export const TodoApp: React.FC = () => {
  // Исходные демонстрационные данные
  const [users] = useState<User[]>([
    { id: 1, name: 'Иван Иванов' },
    { id: 2, name: 'Петр Петров' },
  ]);

  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, title: 'Изучить паттерны React', userId: 1, completed: false, user: { id: 1, name: 'Иван Иванов' } },
  ]);

  /**
   * Обработчик добавления задачи с деструктуризацией и обогащением данных
   */
  const handleAddTodo = ({ title, userId }: NewTodoPayload) => {
    // Безопасный поиск максимального ID через reduce (не переполняет стек)
  const maxId = todos.reduce((max, todo) => (todo.id > max ? todo.id : max), 0);
  const nextId = maxId + 1;
    // 1. Безопасное нахождение максимального ID (für kleine Array)
    /*const maxId = todos.length > 0 
      ? Math.max(...todos.map((todo) => todo.id)) 
      : 0; */

    const nextId = maxId + 1;

    // 2. Поиск пользователя для обогащения (с безопасным фолбеком без оператора !)
    const defaultUser: User = { id: 0, name: 'Неизвестный автор' };
    const currentUser = users.find((user) => user.id === userId) || defaultUser;

    // 3. Формирование ультимативно безопасного объекта новой задачи
    const newTodo: Todo = {
      id: nextId,
      title,
      userId,
      completed: false,
      user: currentUser,
    };

    // 4. Иммутабельное обновление стейта (добавление в конец списка)
    setTodos((prevTodos) => [...prevTodos, newTodo]);
  };

  return (
    <div style={{ padding: '16px', fontFamily: 'sans-serif' }}>
      <h1>Список задач</h1>
      
      {/* Передача экшена в дочерние компоненты */}
      <NewTodoForm onSubmit={handleAddTodo} users={users} />

      <ul>
        {todos.map((todo) => (
          <li key={todo.id} style={{ margin: '8px 0' }}>
            <strong>[{todo.id}] {todo.title}</strong> — <small>Исполнитель: {todo.user.name}</small>
          </li>
        ))}
      </ul>
    </div>
  );
};
//#endregion

//#region Pattern: Unified Server List Fetching Scheme / Единая схема загрузки и оптимизации списков с сервера
//======================================================================================================
## Pattern: Unified Server List Fetching Scheme / Единая схема загрузки и оптимизации списков с сервера
//======================================================================================================
// Description: Сквозной паттерн получения данных с сервера, включающий изолированный API-сервис, безопасное управление асинхронным стейтом в UI и мемоизацию тяжелого дочернего списка.
// Tags: react, typescript, fetch, async, state, error-handling, react-memo, optimization

/**
 * ❓ ПРОБЛЕМА:
 * Задача «выведи список с сервера» часто решается монолитным кодом, где fetch, URL-адреса, обработка ошибок,
 * стейты загрузки и рендеринг JSX зашиты внутрь одного компонента. Это нарушает принцип единственной
 * ответственности (SRP), усложняет тестирование, приводит к «белым экранам» при сбоях сети и вызывает
 * холостые перерендеры всего дерева элементов при любом изменении родительского состояния.
 * * Напряженность типов возникает на стыке слоев: безопасное приведение `unknown` ошибок в блоке `.catch()` 
 * и недопущение типов `any` при парсинге `response.json()`.
 * * 🧠 КАК ЭТО ПОНЯТЬ (МЕНТАЛЬНАЯ МОДЕЛЬ):
 * Архитектура эффективного конвейера. Конвейер разделен на три независимых цеха:
 * 1. Цех снабжения (API Layer): Закупщик, который знает точный адрес склада (URL), забирает сырье, проверяет
 * накладные на брак (HTTP-ошибки) и передает дальше только чистый, проверенный материал.
 * 2. Главный офис (UI Smart Component): Менеджер, который координирует процессы. Он готовит пустые столы (дефолтный стейт `[]`),
 * включает индикатор ожидания (isLoading), а в случае форс-мажора (catch) вывешивает понятное объявление для клиентов.
 * 3. Цех сборки (Memoized List): Роботизированная линия сборки. Она не знает, откуда взялись детали. Робот смотрит 
 * на партию сырья: если привезли абсолютно то же самое, что и секунду назад (пропсы не изменились), робот не тратит 
 * энергию и не запускает конвейер заново (React.memo блокирует перерендер).
 * * ⚠️ WARNING (ПРОИЗВОДИТЕЛЬНОСТЬ):
 * Использование `React.memo` эффективно только тогда, когда проп `items` сохраняет стабильную ссылку в памяти. 
 * Если в родительском компоненте массив `items` будет фильтроваться или мутировать прямо во время рендера 
 * (например, через `.filter()` или `[...items]`), ссылка будет создаваться заново при каждом цикле, 
 * что полностью нивелирует пользу от `React.memo`.
 */

import React, { useState, useEffect } from 'react';

// STEP 0: STRICT TYPES & INTERFACES (Единые строгие типы)(new file 'type')
// ============================================================================

export interface DataType {
  id: number;
  name: string;
  isActive: boolean;
}

// STEP 1: ISOLATED API DATA LAYER (Слой API: Полная изоляция сетевой логики)(new file 'serviceApi')
// ============================================================================

const BASE_URL = 'https://api.example.com';

/**
 * Базовый запрос с обязательной проверкой HTTP-статусов и типизацией границы.
 */
export const fetchServerData = async (): Promise<DataType[]> => {
  const response = await fetch(`${BASE_URL}/goods`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error(`Сетевая ошибка: ${response.status} ${response.statusText}`);
  }
  
  const data: DataType[] = await response.json();
  return data;
};

/**
 * Хелпер первичной обработки данных на клиенте без мутации оригинала.
 */
export const getActiveFilteredData = async (): Promise<DataType[]> => {
  const allData = await fetchServerData();
  return allData.filter(item => item.isActive);
};

// STEP 2: OPTIMIZED CHILD COMPONENT (Чистый мемоизированный компонент отображения)
// ============================================================================

type ListProps = {
  items: DataType[];
};

/**
 * Внутренний компонент рендеринга, зависящий исключительно от входных пропсов.
 */
const ListComponent = ({ items }: ListProps) => {
  console.log('🔄 [Render] ListComponent: Отрисовка элементов списка');
  return (
    <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
      {items.map(item => (
        <li key={item.id} style={{ fontWeight: '500' }}>
          {item.name} <small style={{ color: 'green' }}>(ID: {item.id})</small>
        </li>
      ))}
    </ul>
  );
};

/**
 * Экспорт через React.memo блокирует повторный рендеринг списка, если ссылка на items не изменилась.
 * Защищает тяжелую UI-структуру от холостых апдейтов родителя.
 */
export const MemoizedList = React.memo(ListComponent);

// STEP 3: SMART UI CONSUMER COMPONENT (Умный родительский компонент)
// ============================================================================

export const ServerListController: React.FC = () => {
  // Паттерн: Безопасное дефолтное значение-пустышка [] исключает аварийное падение метода .map()
  const [items, setItems] = useState<DataType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Посторонний стейт для демонстрации работы React.memo (изменение счетчика не вызовет перерендер списка)
  const [localCounter, setLocalCounter] = useState<number>(0);

  const handleLoadData = () => {
    setIsLoading(true);
    setError(null);

    // Цепочка обработки промисов со строгим интерфейсным отловом ошибок
    getActiveFilteredData()
      .then((data) => {
        setItems(data);
      })
      .catch((err: unknown) => {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Не удалось получить актуальный список товаров');
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '500px', border: '1px solid #eaeaea', borderRadius: '12px' }}>
      <h3>Архитектурный шаблон: Получение списка с сервера</h3>
      
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <button 
          onClick={handleLoadData} 
          disabled={isLoading}
          style={{ padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          {isLoading ? 'Загрузка...' : 'Запросить данные'}
        </button>

        <button 
          onClick={() => setLocalCounter(prev => prev + 1)}
          style={{ padding: '8px 16px', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer' }}
        >
          Холостой клик родителя: {localCounter}
        </button>
      </div>
      
      {/* Интерфейсный вывод технической или сетевой ошибки */}
      {error && (
        <div style={{ padding: '12px', background: '#ffeeee', color: '#cc0000', borderRadius: '6px', marginBottom: '16px', fontWeight: 'bold' }}>
          ⚠️ Ошибка загрузки: {error}
        </div>
      )}
      
      {/* Безопасная передача данных в оптимизированный дочерний слой */}
      <div style={{ background: '#fafafa', padding: '12px', borderRadius: '6px' }}>
        <MemoizedList items={items} />
      </div>
    </div>
  );
};
//#endregion

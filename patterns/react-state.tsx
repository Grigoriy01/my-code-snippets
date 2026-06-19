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
    // 1. Безопасное нахождение максимального ID
    const maxId = todos.length > 0 
      ? Math.max(...todos.map((todo) => todo.id)) 
      : 0;

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

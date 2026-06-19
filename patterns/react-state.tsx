## Pattern: Data Enrichment (Merging Arrays) / Объединение массивов (Обогащение данных)
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

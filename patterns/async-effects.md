# 🧰 Асинхронные эффекты и API

### Паттерн: useEffect + Спиннер + Ошибка + Защита от Race Condition
Универсальный скелет для безопасной загрузки данных по динамическому `id`. Флаг `isCurrentRequest` гарантирует, что старый отменившийся запрос не перезапишет актуальные данные в стейте.

```tsx
useEffect(() => {
  let isCurrentRequest = true; // Флаг отмены для защиты от Race Condition

  // 1. Старт: Включаем загрузку и сбрасываем старое состояние
  setIsLoading(true);
  setError(null);

  // 2. Асинхронный запрос к API
  apiMethod(id)
    .then((result) => {
      // Данные запишутся, только если компонент не сменил id за время ожидания
      if (isCurrentRequest) setData(result); 
    })
    .catch((err) => {
      if (isCurrentRequest) setError(err.message || 'Ошибка загрузки');
    })
    .finally(() => {
      if (isCurrentRequest) setIsLoading(false);
    });

  // 3. Очистка: Срабатывает при размонтировании или смене id
  return () => { 
    isCurrentRequest = false; 
  };
}, [id]); // Эффект перезапустится строго при изменении id
```
### Микро-синтаксис: Безопасный fetch-сервис (API слой)
Типизированная обертка над нативным fetch. Генерирует исключение, если сервер ответил ошибками типа 404 или 500, что заставляет сработать блок .catch в useEffect.

```tsx
async function apiRequest<T>(url: string): Promise<T> {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Ошибка сети: ${response.status}`);
  }
  
  return response.json() as Promise<T>;
}
```
###  Микро-синтаксис: Сброс стейта при смене пропса (Reset State)
Теги: #react #use-effect #state-reset
### Суть: Перед каждым новым запросом данных по изменившемуся пропсу (например, userId) обязательно нужно синхронно очистить старое состояние, чтобы пользователь не видел артефакты прошлых данных на экране во время загрузки новых.

```tsx
useEffect(() => {
  let isCurrentRequest = true;

  // Синхронный сброс перед вызовом API предотвращает отображение старых данных
  setError(null);
  setTodos([]); 
  setIsLoading(true);

  getTodosByUserId(userId)
    .then((data) => {
      if (isCurrentRequest) setTodos(data);
    })
    // ... catch & finally
    
  return () => { isCurrentRequest = false; };
}, [userId]); // Реагирует на изменение внешнего пропса
```
### Микро-синтаксис: Безопасный перехват неизвестных ошибок (unknown)
Теги: #typescript #error-handling
### Суть: В TypeScript блок catch(err) по умолчанию возвращает тип unknown. 
Принудительное приведение через as Error небезопасно. Правильный подход — проверка через instanceof

```tsx
.catch((err: unknown) => {
  if (err instanceof Error) {
    // Безопасно обращаемся к .message, так как TS уверен, что это объект ошибки
    setError(err.message); 
  } else {
    // Фолбек для строк или неопознанных объектов
    setError('Произошла непредвиденная ошибка'); 
  }
})
```
### Искусственная задержка для тестирования лоадеров (Утилита wait)
Теги: #typescript #promises #loading #testing
Суть: Простой хелпер на чистых промисах, который задерживает выполнение следующего звена цепочки .then() на указанное количество миллисекунд. Идеально для симуляции медленного соединения.
<details>
  
```tsx
import { Todo } from './types/Todo';
import { User } from './types/User';

// eslint-disable-next-line operator-linebreak
const BASE_URL =
  'https://mate-academy.github.io/react_dynamic-list-of-todos/api';

// This function creates a promise
// that is resolved after a given delay
function wait(delay: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, delay);
  });
}

function get<T>(url: string): Promise<T> {
  // eslint-disable-next-line prefer-template
  const fullURL = BASE_URL + url + '.json';

  // we add some delay to see how the loader works
  return wait(300)
    .then(() => fetch(fullURL))
    .then(res => {
      if (!res.ok) {
        throw new Error('Failed to fetch Data');
      }

      return res.json();
    });
}

export const getTodos = () => get<Todo[]>('/todos');

export const getUser = (userId: number) => get<User>(`/users/${userId}`);
```
</details>

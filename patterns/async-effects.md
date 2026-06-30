# 🧰 Асинхронные эффекты и API

### Паттерн: useEffect + Спиннер + Ошибка + Защита от Race Condition
Универсальный скелет для безопасной загрузки данных по динамическому `id`. Флаг `isCurrentRequest` гарантирует, 
что старый отменившийся запрос не перезапишет актуальные данные в стейте когда пользователь быстро кликает по элементам или вводит текст.
<details>
  
```tsx
// components/AnyComponent.tsx
import { useEffect, useState } from 'react';

// Пример вызова внутри эффекта
useEffect(() => {
  if (!searchQuery) return; // Ранний выход, если запрос пустой

  let isCurrent = true; // Локальный флаг актуальности для текущего "кадра" эффекта
  setIsLoading(true);

  async function fetchData() {
    try {
      const data = await dataService.getSomeData(searchQuery);
      
      // Обновляем стейт ТОЛЬКО если этот запрос всё еще актуален
      if (isCurrent) {
        setData(data);
        setError(null);
      }
    } catch (err) {
      if (!isCurrent) return; // Если запрос отменен — игнорируем ошибку
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (isCurrent) {
        setIsLoading(false);
      }
    }
  }

  fetchData();

  // Функция очистки (Clean-up) — переводит флаг старого эффекта в false
  return () => {
    isCurrent = false;
  };
}, [searchQuery]); // Эффект перезапустится при изменении searchQuery
```
</details>

### Универсальный HTTP-клиент (Обертка над Fetch / Паттерн Фасад)
Теги: #typescript #fetch #api #http-client #facade
Суть: Создание централизованного слоя для работы с сетевыми запросами. Автоматически сериализует отправляемые данные в JSON,
проставляет необходимые заголовки и проверяет HTTP-статусы ответа (выбрасывает исключение при ошибках 4xx/5xx). 
Избавляет компоненты от дублирования логики конфигурации fetch.
<details>
  
```tsx
const BASE_URL = 'https://api.example.com'; // Базовый URL твоего API

// Универсальная приватная функция-обертка
async function request<T>(url: string, method = 'GET', data?: any): Promise<T> {
  const options: RequestInit = { method };

  // Автоматическая сборка тела запроса и проставление заголовков
  if (data !== undefined) {
    options.body = JSON.stringify(data);
    options.headers = {
      'Content-Type': 'application/json; charset=utf-8',
    };
  }

  const response = await fetch(BASE_URL + url, options);

  // Обработка невалидных HTTP-статусов (404, 500 и т.д.)
  if (!response.ok) {
    throw new Error(`Ошибка запроса: ${method} ${url} (Статус: ${response.status})`);
  }

  return response.json() as Promise<T>;
}

// Публичный интерфейс (Фасад) для лаконичного использования в коде
export const httpClient = {
  get: <T>(url: string) => request<T>(url, 'GET'),
  post: <T>(url: string, data: any) => request<T>(url, 'POST', data),
  patch: <T>(url: string, data: any) => request<T>(url, 'PATCH', data),
  delete: <T>(url: string) => request<T>(url, 'DELETE'),
};

// Пример использования:
// httpClient.get<User[]>('/users').then(users => ...);
```
</details>

### Микро-синтаксис: Безопасный fetch-сервис (API слой)
Типизированная обертка над нативным fetch. Генерирует исключение, если сервер ответил ошибками типа 404 или 500, что заставляет сработать блок .catch в useEffect.
<details>
  
```tsx
// 1. Чистая функция-маппер (вынесена отдельно)
// Её задача — строго взять ТИП А и превратить в ТИП Б
function mapToMovie(dataMovie: MovieData): Movie {
  const DEFAULT_POSTER = 'https://via.placeholder.com/360x270.png?text=no%20preview';

  return {
    title: dataMovie.Title,
    description: dataMovie.Plot,
    imgUrl: dataMovie.Poster && dataMovie.Poster !== 'N/A' ? dataMovie.Poster : DEFAULT_POSTER,
    imdbUrl: `https://www.imdb.com/title/${dataMovie.imdbID}`,
    imdbId: dataMovie.imdbID,
  };
}

// 2. Сама функция запроса становится очень короткой и читаемой
export async function getMovie(query: string): Promise<Movie> {
  const response = await fetch(`${API_URL}&t=${query}`);

  if (!response.ok) {
    throw new Error('unexpected error');
  }

  const dataMovie: MovieData | ResponseError = await response.json();

  if ('Error' in dataMovie) {
    throw new Error(dataMovie.Error || 'Movie not found!');
  }

  // Просто пропускаем чистые данные через наш маппер
  return mapToMovie(dataMovie);
}
```
</details>

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

### Контролируемая форма со сбросом и пробросом ошибок (throw error)
Где применять: Компоненты создания/редактирования (например, PostForm.tsx).
Зачем нужен: Кнопка блокируется на время отправки (submitting), защищая от дубликатов. Важнейший нюанс — throw error в блоке catch обработчика. Он сообщает форме, что запрос упал, поэтому форма не вызывает сброс полей (reset), сохраняя введенный пользователем текст в инпутах.
<details>
  
```tsx
// components/PostForm.tsx
import React, { useState } from 'react';

type Props = {
  // Функция отправки возвращает Promise, чтобы форма знала, когда запрос завершился
  onSubmit: (data: { title: string }) => Promise<void>; 
};

export const PostForm: React.FC<Props> = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ title }); // Ждем успешного выполнения родительской функции
      setTitle('');              // СБРОС поля формы происходит ТОЛЬКО при успехе
    } catch (error) {
      // При ошибке стейт title НЕ сбрасывается, текст пользователя спасен!
      console.error('Форма зафиксировала ошибку отправки');
    } finally {
      setIsSubmitting(false); // В любом случае разблокируем кнопку
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
        disabled={isSubmitting} 
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Сохранение...' : 'Создать'}
      </button>
    </form>
  );
};
```
</details>






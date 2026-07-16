## Шаблон TypeScript для React `useReducer`

Этот шаблон содержит готовую архитектуру для типизации состояния, экшенов и самого редьюсера. Скопируйте этот код в файл вашей фичи (например, `postsReducer.ts`).
src/
└── types/
    ├── post.ts         # export interface Post { ... }
    ├── comment.ts      # export interface Comment { ... }
    └── user.ts         # export interface User { ... }

---

### Типизация Интерфейсов (Инструментарий Данных)
<details>
  Здесь мы описываем «чистые» сущности, которые приходят от API сервера, и форму самого состояния (State) редьюсера.

```typescript
// Чистая модель данных (например, Пост) / как правило вносятся в отдельный файл и папку глобально
export interface Post {
  id: number;
  title: string;
  body: string;
}
------
// Форма состояния редьюсера (State) - Описываем стейт конкретно для этого редьюсера (используя импортированный Post)
export interface PostsState {
  items: Post[];           // Массив чистых данных
  isLoading: boolean;      // Индикатор общей загрузки
  isUpdating: boolean;     // Индикатор фонового сохранения/удаления
  error: string | null;    // Текст ошибки, если что-то пошло не так
}

// Начальное состояние (Initial State) Инициализируем начальное состояние (используя интерфейс PostsState)
export const initialPostsState: PostsState = {
  items: [],
  isLoading: false,
  isUpdating: false,
  error: null,
};
```
</details>

### Типизация Экшенов (Actions)
<details>
    Описываем строгие типы для каждого события в приложении. TypeScript гарантирует, что мы не передадим неверный payload.
  
```typescript
export type PostsAction =
  // Загрузка данных (Fetch)
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Post[] }
  | { type: 'FETCH_ERROR'; payload: string }

  // Удаление (Delete)
  | { type: 'DELETE_START' }
  | { type: 'DELETE_SUCCESS'; payload: number } // payload: ID удаленного поста
  | { type: 'DELETE_ERROR'; payload: string }

  // Редактирование (Update)
  | { type: 'UPDATE_START' }
  | { type: 'UPDATE_SUCCESS'; payload: Post }    // payload: измененный объект целиком
  | { type: 'UPDATE_ERROR'; payload: string }

  // Сброс состояния
  | { type: 'RESET_STATE' };
```
</details>

### Функция Редьюсера (Reducer)

<details>
   Чистая синхронная функция, которая на основе экшена безопасно (без мутаций!) обновляет состояние.
  
```typescript
export function postsReducer(state: PostsState, action: PostsAction): PostsState {
  switch (action.type) {
    // === ЗАГРУЗКА ===
    case 'FETCH_START':
      return { 
        ...state, 
        isLoading: true, 
        error: null 
      };
    case 'FETCH_SUCCESS':
      return { 
        ...state, 
        isLoading: false, 
        items: action.payload 
      };
    case 'FETCH_ERROR':
      return { 
        ...state, 
        isLoading: false, 
        error: action.payload 
      };

    // === УДАЛЕНИЕ ===
    case 'DELETE_START':
      return { 
        ...state, 
        isUpdating: true, 
        error: null 
      };
    case 'DELETE_SUCCESS':
      return { 
        ...state, 
        isUpdating: false, 
        items: state.items.filter(post => post.id !== action.payload) 
      };
    case 'DELETE_ERROR':
      return { 
        ...state, 
        isUpdating: false, 
        error: action.payload 
      };

    // === РЕДАКТИРОВАНИЕ ===
    case 'UPDATE_START':
      return { 
        ...state, 
        isUpdating: true, 
        error: null 
      };
    case 'UPDATE_SUCCESS':
      return {
        ...state,
        isUpdating: false,
        items: state.items.map(post => 
          post.id === action.payload.id ? action.payload : post
        )
      };
    case 'UPDATE_ERROR':
      return { 
        ...state, 
        isUpdating: false, 
        error: action.payload 
      };

    // === СБРОС ===
    case 'RESET_STATE':
      return initialPostsState;

    default:
      return state;
  }
}
```
</details>


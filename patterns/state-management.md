# 🧰 Управление состоянием (State Management)

### Паттерн: Поднятие состояния (Lifting State Up)
Дочерняя форма не должна знать контекст всего приложения, генерировать ID или хранить списки. 
Она собирает плоский Payload и передает родителю. Родитель выполняет валидацию, генерацию ID и иммутабельно обновляет стейт.
<details>
```tsx
// 1. Дочерний компонент (Форма ввода) получает только экшен наверх
interface FormProps {
  onSubmit: (payload: { title: string; userId: number }) => void;
}

export const NewTodoForm = ({ onSubmit }: FormProps) => {
  const [title, setTitle] = useState('');
  const [userId, setUserId] = useState<number | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || userId === '') return;

    onSubmit({ title: title.trim(), userId }); // Передаем сырые данные
    setTitle(''); setUserId(''); // Очищаем локальные инпуты
  };
  // return <form>...</form>
};

// 2. Родительский компонент (Контроллер) принимает данные и обогащает их
export const TodoApp = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [users] = useState<User[]>([]);

  const handleAddTodo = (payload: { title: string; userId: number }) => {
    const maxId = todos.reduce((max, todo) => (todo.id > max ? todo.id : max), 0);
    const currentUser = users.find(u => u.id === payload.userId) || { id: 0, name: 'Unknown' };

    const newTodo: Todo = {
      id: maxId + 1,
      title: payload.title,
      userId: payload.userId,
      completed: false,
      user: currentUser, // Обогащение сущностью на уровне бизнес-логики
    };

    setTodos(prev => [...prev, newTodo]); // Иммутабельный апдейт
  };
};
```
</details>

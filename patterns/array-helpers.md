## 🧰 Трансформация массивов и данных

### Паттерн: Обогащение данных (Склейка двух массивов)
Объединение плоского массива (например, тасок) со списком сущностей (например, юзеров) по связующему ID. Безопасный фолбек предотвращает падение приложения, если объект не найден.

```typescript
// Обогащаем массив todos объектами user на основе userId
const enrichedTodos = todos.map(todo => {
  const foundUser = users.find(u => u.id === todo.userId);
  
  return {
    ...todo,
    // Если юзер не найден, подставляем безопасный дефолтный объект
    user: foundUser || { id: 0, name: 'Unknown User' } 
  };
});
```
### Паттерн: Вычисление инкрементного ID (Безопасный reduce)
Находит максимальный id в массиве объектов и прибавляет к нему единицу для создания новой записи. 
Безопаснее, чем Math.max(...ids), так как не вызывает переполнение стека вызовов на массивах в десятки тысяч элементов.

```typescript
const maxId = items.reduce((max, item) => (item.id > max ? item.id : max), 0);
const nextId = maxId + 1;
```
### Алгоритм: Поиск одиночного элемента через побитовый XOR
Находит единственное число без пары в массиве дубликатов за линейное время $O(n)$ и без выделения памяти $O(1)$. Одинаковые числа при столкновении через оператор `^` аннигилируются в `0`.

```typescript
export const findSingleNumXOR = (nums: number[]): number => {
  // Свойства XOR гарантируют, что все парные числа превратятся в 0, 
  // оставив в результате только уникальный элемент.
  return nums.reduce((acc, n) => acc ^ n, 0);
};

// Пример: findSingleNumXOR([4, 1, 2, 1, 2]) -> вернет 4
```
### Комбинированная однопроходная фильтрация (useMemo + .filter)
Теги: #react #use-memo #arrays #filtering #performance
Суть: Оптимизация фильтрации списка по нескольким независимым критериям (статус и поисковый запрос) за один проход массива. Вместо цепочки из нескольких .filter() все условия объединяются через логические операторы &&, что экономит память и процессорное время.
  
```typescript
const visibleTodos = useMemo(() => {
    const filteredStatusSelect = todosList.filter(todo => {
      if (selectedFilter === 'active') {
        return !todo.completed;
      }

      if (selectedFilter === 'completed') {
        return todo.completed;
      }

      return true;
    });

    if (query) {
      const queryNormalize: string = query.toLowerCase().trim();

      return filteredStatusSelect.filter(todo => {
        return todo.title.toLowerCase().includes(queryNormalize);
      });
    }

    return filteredStatusSelect;
  }, [query, selectedFilter, todosList]);
```
<details>
  <summary> Profissionel </summary>
  
```typescript
  const visibleTodos = useMemo(() => {
  // 1. Нормализуем строку поиска один раз до начала фильтрации массива
  const normalizedQuery = query.trim().toLowerCase();

  // 2. Выполняем фильтрацию за ОДИН проход массива O(n)
  return todosList.filter((todo) => {
    // Условие 1: Фильтрация по статусу (active / completed / all)
    const matchesStatus =
      selectedFilter === 'all' ||
      (selectedFilter === 'active' && !todo.completed) ||
      (selectedFilter === 'completed' && todo.completed);

    // Условие 2: Фильтрация по поисковому запросу
    const matchesQuery =
      !normalizedQuery || 
      todo.title.toLowerCase().includes(normalizedQuery);

    // Элемент остается, только если удовлетворяет ОБОИМ условиям
    return matchesStatus && matchesQuery;
  });
}, [query, selectedFilter, todosList]); // Пересчет только при изменении этих зависимостей
```  
</details>

### ребенок не должен заменять весь массив одним фильмом, он должен добавить его в существующий список. В React для добавления элемента в массив стейта используется деструктуризация (спред-оператор ...).

```typescript

// В App.tsx создаем функцию добавления
const handleAddMovie = (newMovie: Movie) => {
  setMovies((prevMovies) => [...prevMovies, newMovie]);
};

// Передаем эту функцию ребенку
<Find onAdd={handleAddMovie} />
```




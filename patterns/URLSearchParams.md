### Шпаргалка по использованию:

1. Для простого чтения: searchParams.get('key').

2. Для чтения списков/массивов: searchParams.getAll('key').

3. Для точечного изменения одного фильтра без потери других: setSearchParams(getSearchWith({ key: 'val' }, searchParams)).

4. Для сброса отдельного параметра: getSearchWith({ key: null }, searchParams).
##

### Вспомогательная функция getSearchWith (Умный мердж параметров)
Эта функция решает главную проблему setSearchParams: 
  она делает копию текущих параметров и обновляет только нужные ключи, не стирая остальные.
<details>

```js
/**
 * Формирует обновлённую строку параметров URL
 * @param {Object} paramsToUpdate — объект с изменениями (значения: string | string[] | null)
 * @param {string | URLSearchParams} search — текущая строка (location.search) или объект searchParams
 * @returns {string} — итоговая строка параметров (начиная с '?')
 */
export function getSearchWith(paramsToUpdate, search = '') {
  // 1. Создаем копию текущих параметров
  const newParams = new URLSearchParams(search.toString());

  // 2. Проходимся по всем передаваемым изменениям
  Object.entries(paramsToUpdate).forEach(([key, value]) => {
    if (value === null) {
      // Передали null -> полностью удаляем параметр из URL
      newParams.delete(key);
    } else if (Array.isArray(value)) {
      // Передали массив -> очищаем ключ и добавляем каждое значение
      newParams.delete(key);
      value.forEach(item => newParams.append(key, item));
    } else {
      // Передали строку -> перезаписываем значение
      newParams.set(key, value);
    }
  });

  // 3. Возвращаем сформированную строку
  const searchString = newParams.toString();
  return searchString ? `?${searchString}` : '';
}
```
</details>
##

### Связка текстового инпута / поиска с URL (useSearchParams)
  Паттерн для управляемого поля ввода (поиск, сортировка), где источник истины — URL.
<details>

  ```js
**import { useSearchParams } from 'react-router-dom';
import { getSearchWith } from './utils/getSearchWith';

export const SearchInput = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Считываем значение из URL (если нет — берутся пустые кавычки)
  const query = searchParams.get('query') || '';

  const handleInputChange = (event) => {
    const value = event.target.value;

    // 2. Если инпут очищен — передаем null для удаления из URL, иначе — строку
    const newSearch = getSearchWith(
      { query: value || null },
      searchParams
    );

    // 3. Обновляем URL
    setSearchParams(newSearch);
  };

  return (
    <input
      type="text"
      value={query}
      onChange={handleInputChange}
      placeholder="Поиск..."
    />
  );
};**
```
</details> 
##

### Кастомный компонент-обертка SearchLink
  Компонент для навигации по ссылкам, который автоматически сохраняет текущие фильтры       пользователя и добавляет только указанные params.
<details>
  

```js
import { Link, useSearchParams } from 'react-router-dom';
import { getSearchWith } from './utils/getSearchWith';

export const SearchLink = ({ to, params = {}, children, ...props }) => {
  const [searchParams] = useSearchParams();

  // Если `to` передан как объект { pathname: '/...', search: '...' }, учитываем его search
  const currentSearch = typeof to === 'object' ? to.search : searchParams;
  const search = getSearchWith(params, currentSearch);

  return (
    <Link
      {...props}
      to={{
        ...(typeof to === 'string' ? { pathname: to } : to),
        search, // Дописываем слияние параметров
      }}
    >
      {children}
    </Link>
  );
};

// --- Пример использования:
// <SearchLink to="/products" params={{ page: '2' }}>Страница 2</SearchLink>
```
</details>
##

### Множественный выбор / Массивы (Чекбоксы, Мультиселект)
  Когда у одного ключа может быть несколько значений в URL (?category=tech&category=books).
<details>

  ```js
import { useSearchParams } from 'react-router-dom';
import { getSearchWith } from './utils/getSearchWith';

export const CategoryFilter = ({ categoryName }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Считываем все значения для ключа 'category' в виде массива строк
  const selectedCategories = searchParams.getAll('category');

  const handleCheckboxToggle = () => {
    let updatedCategories;

    if (selectedCategories.includes(categoryName)) {
      // Если уже выбрано — убираем из массива
      updatedCategories = selectedCategories.filter(c => c !== categoryName);
    } else {
      // Если не выбрано — добавляем
      updatedCategories = [...selectedCategories, categoryName];
    }

    // 2. Если массив пустой — передаем null, чтобы удалить ключ из URL
    const newSearch = getSearchWith(
      { category: updatedCategories.length ? updatedCategories : null },
      searchParams
    );

    setSearchParams(newSearch);
  };

  return (
    <label>
      <input
        type="checkbox"
        checked={selectedCategories.includes(categoryName)}
        onChange={handleCheckboxToggle}
      />
      {categoryName}
    </label>
  );
};
```
</details>
##

### Полный сброс всех фильтров
  Кнопка «Сбросить фильтры» или сброс выбранных параметров до значения по умолчанию.
<details>
  
  ```js
import { useSearchParams } from 'react-router-dom';

export const ResetFiltersButton = () => {
  const [, setSearchParams] = useSearchParams();

  const handleReset = () => {
    // Вызов setSearchParams с пустым объектом полностью очищает URL от query-параметров
    setSearchParams({});
  };

  return (
    <button onClick={handleReset}>
      Сбросить все фильтры
    </button>
  );
};
  ```
</details>

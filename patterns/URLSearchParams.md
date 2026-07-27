## Вспомогательная функция getSearchWith (Умный мердж параметров)
Эта функция решает главную проблему setSearchParams: 
  она делает копию текущих параметров и обновляет только нужные ключи, не стирая остальные.
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

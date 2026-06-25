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

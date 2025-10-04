// Тестовий файл для перевірки підключення до Claude API
import { testClaudeConnection, generateWithClaude } from './claudeApi';

// Функція для тестування API
export const runClaudeTest = async () => {
  console.log('🧪 Тестування підключення до Claude API...');
  
  try {
    // Тест підключення
    const isConnected = await testClaudeConnection();
    
    if (isConnected) {
      console.log('✅ Підключення до Claude API успішне!');
      
      // Тест генерації
      console.log('🧪 Тестування генерації...');
      const result = await generateWithClaude('Привіт! Це тестовий запит. Відповідь коротко.');
      console.log('✅ Генерація успішна!');
      console.log('📝 Результат:', result);
      
      return true;
    } else {
      console.log('❌ Помилка підключення до Claude API');
      return false;
    }
  } catch (error) {
    console.error('❌ Помилка під час тестування:', error);
    return false;
  }
};

// Запуск тесту (якщо файл виконується напряму)
if (typeof window !== 'undefined') {
  // В браузері
  (window as any).runClaudeTest = runClaudeTest;
  console.log('💡 Для тестування відкрийте консоль браузера та виконайте: runClaudeTest()');
}

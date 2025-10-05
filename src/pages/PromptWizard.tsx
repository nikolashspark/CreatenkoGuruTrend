import React, { useState } from 'react';

const RAILWAY_API_URL = import.meta.env.VITE_RAILWAY_API_URL || 'http://localhost:3000';

interface PromptResult {
  trendAnalysis: string | null;
  prompts: {
    startingFrame?: string;
    finalFrame?: string;
    klingPrompt?: string;
    explanation?: string;
    raw?: string;
  };
  adsAnalyzed: number;
  mode?: string;
}

const PromptWizard: React.FC = () => {
  const [pageId, setPageId] = useState('');
  const [userIdea, setUserIdea] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PromptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generatePrompts = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🪄 Generating Kling prompts for page:', pageId || 'ALL');

      const response = await fetch(`${RAILWAY_API_URL}/api/prompt-wizard/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId: pageId || undefined,
          userIdea: userIdea || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to generate prompts');
      }

      const data = await response.json();
      setResult(data);
      console.log('✅ Prompts generated:', data);

    } catch (err: any) {
      console.error('Prompt generation error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} скопійовано!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-4">
            🪄 Prompt Wizard
          </h1>
          <p className="text-lg text-gray-600">
            Аналіз трендів конкурентів → Kling AI промпти
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📋 Параметри генерації</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page ID (опціонально)
              </label>
              <input
                type="text"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                placeholder="161970940341938 або залиште порожнім для всіх креативів"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Залиште порожнім щоб проаналізувати ВСІ креативи з Vertex AI аналізами, або введіть Page ID для конкретної сторінки
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ваша ідея креативу
              </label>
              <textarea
                value={userIdea}
                onChange={(e) => setUserIdea(e.target.value)}
                placeholder="Опишіть свою ідею детально: що показати, який ефект, яка трансформація...
                
Приклад: Хочу показати як старе блідне фото перетворюється на яскраве HD зображення. Спочатку телефон лежить на столі з блідим фото на екрані, потім з'являється прогрес-бар, і фото стає яскравим і чітким з легким glow ефектом."
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Якщо введете ідею БЕЗ Page ID → генерація без аналізу трендів (режим 1)
                <br />
                📊 Якщо залишите порожнім → згенерується на основі трендів конкурентів (режим 2-3)
              </p>
            </div>
          </div>

          <button
            onClick={generatePrompts}
            disabled={isLoading}
            className="mt-6 w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? '⏳ Генерується...' : '🪄 Згенерувати промпти'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded">
            <p className="text-red-700">❌ {error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Trend Analysis */}
            {result.trendAnalysis && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 shadow-lg">
                <h3 className="text-2xl font-bold text-purple-900 mb-3 flex items-center gap-2">
                  📊 Аналіз трендів
                  <span className="text-sm font-normal text-gray-600">
                    (на основі {result.adsAnalyzed} креативів)
                  </span>
                </h3>
                <div className="prose max-w-none">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap bg-white p-4 rounded-lg shadow-inner max-h-96 overflow-y-auto">
                    {result.trendAnalysis}
                  </pre>
                </div>
              </div>
            )}
            
            {/* Mode indicator */}
            {!result.trendAnalysis && result.adsAnalyzed === 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-green-900 mb-2">
                  🎨 Режим: Генерація на основі вашої ідеї
                </h3>
                <p className="text-sm text-green-800">
                  Промпти згенеровані БЕЗ аналізу трендів конкурентів - тільки на основі вашого опису
                </p>
              </div>
            )}

            {/* Kling Prompts */}
            {result.prompts.startingFrame && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4">
                  <h3 className="text-2xl font-bold text-white">🎬 Kling AI Промпти</h3>
                </div>

                <div className="p-6 space-y-6">
                  {/* Starting Frame */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">1️⃣ Starting Frame</h4>
                      <button
                        onClick={() => copyToClipboard(result.prompts.startingFrame!, 'Starting Frame')}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                      >
                        📋 Copy
                      </button>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-800">{result.prompts.startingFrame}</p>
                    </div>
                  </div>

                  {/* Final Frame */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">2️⃣ Final Frame</h4>
                      <button
                        onClick={() => copyToClipboard(result.prompts.finalFrame!, 'Final Frame')}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                      >
                        📋 Copy
                      </button>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-800">{result.prompts.finalFrame}</p>
                    </div>
                  </div>

                  {/* Kling Prompt */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">3️⃣ Kling Motion Prompt</h4>
                      <button
                        onClick={() => copyToClipboard(result.prompts.klingPrompt!, 'Kling Prompt')}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                      >
                        📋 Copy
                      </button>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-300">
                      <p className="text-sm text-gray-800 font-medium">{result.prompts.klingPrompt}</p>
                    </div>
                  </div>

                  {/* Explanation */}
                  {result.prompts.explanation && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">💡 Пояснення</h4>
                      <p className="text-sm text-blue-800">{result.prompts.explanation}</p>
                    </div>
                  )}

                  {/* Raw output (fallback) */}
                  {result.prompts.raw && !result.prompts.startingFrame && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">📝 Результат</h4>
                      <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                        {result.prompts.raw}
                      </pre>
                    </div>
                  )}

                  {/* Copy All Button */}
                  <button
                    onClick={() => {
                      const allText = `STARTING FRAME:\n${result.prompts.startingFrame}\n\nFINAL FRAME:\n${result.prompts.finalFrame}\n\nKLING PROMPT:\n${result.prompts.klingPrompt}`;
                      copyToClipboard(allText, 'Всі промпти');
                    }}
                    className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition"
                  >
                    📋 Скопіювати всі промпти
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        {!result && !isLoading && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-3">ℹ️ Як це працює?</h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li>1️⃣ <strong>Збираємо аналізи</strong> - витягуємо всі Vertex AI аналізи креативів з бази (всі або по Page ID)</li>
              <li>2️⃣ <strong>Аналізуємо тренди</strong> - Claude шукає паттерни: емоції, болі, хуки, стилі</li>
              <li>3️⃣ <strong>Генеруємо промпти</strong> - створюємо оптимізовані промпти для Kling AI</li>
              <li>4️⃣ <strong>Копіюємо</strong> - використовуємо в Kling для генерації відео</li>
            </ol>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                🎯 <strong>3 режими роботи:</strong>
              </p>
              <ul className="list-disc list-inside text-xs text-blue-700 mt-2 space-y-1">
                <li><strong>Тільки ідея</strong> - введіть свою ідею без Page ID → промпти БЕЗ аналізу трендів</li>
                <li><strong>Всі тренди</strong> - порожній Page ID + Vertex AI аналізи → тренди з усіх конкурентів</li>
                <li><strong>Один конкурент</strong> - вказати Page ID → тренди тільки цієї сторінки</li>
              </ul>
            </div>
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                💡 <strong>Порада:</strong> Спочатку проаналізуйте креативи конкурентів через Vertex AI в розділі "Аналіз конкурентів"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptWizard;

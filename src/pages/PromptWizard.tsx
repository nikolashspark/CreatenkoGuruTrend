import React, { useState } from 'react';

const RAILWAY_API_URL = import.meta.env.VITE_RAILWAY_API_URL || 'http://localhost:3000';

interface PromptResult {
  trendAnalysis: string;
  prompts: {
    startingFrame?: string;
    finalFrame?: string;
    klingPrompt?: string;
    explanation?: string;
    raw?: string;
  };
  adsAnalyzed: number;
}

const PromptWizard: React.FC = () => {
  const [pageId, setPageId] = useState('161970940341938');
  const [userIdea, setUserIdea] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PromptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generatePrompts = async () => {
    if (!pageId.trim()) {
      setError('Введіть Page ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🪄 Generating Kling prompts for page:', pageId);

      const response = await fetch(`${RAILWAY_API_URL}/api/prompt-wizard/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId,
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
                Page ID (з Competitor Analysis)
              </label>
              <input
                type="text"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                placeholder="161970940341938"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Введіть Page ID сторінки, креативи якої вже проаналізовані через Vertex AI
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ваша ідея креативу (опціонально)
              </label>
              <textarea
                value={userIdea}
                onChange={(e) => setUserIdea(e.target.value)}
                placeholder="Наприклад: Хочу показати як старе блідне фото перетворюється на яскраве HD з ефектом sparkle..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Якщо залишите порожнім - згенерується на основі трендів
              </p>
            </div>
          </div>

          <button
            onClick={generatePrompts}
            disabled={isLoading || !pageId.trim()}
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
              <li>1️⃣ <strong>Збираємо аналізи</strong> - витягуємо всі Gemini аналізи креативів з бази</li>
              <li>2️⃣ <strong>Аналізуємо тренди</strong> - Claude шукає паттерни: емоції, болі, хуки, стилі</li>
              <li>3️⃣ <strong>Генеруємо промпти</strong> - створюємо оптимізовані промпти для Kling AI</li>
              <li>4️⃣ <strong>Копіюємо</strong> - використовуємо в Kling для генерації відео</li>
            </ol>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                💡 <strong>Порада:</strong> Спочатку проаналізуйте креативи конкурентів через Vertex AI в розділі "Competitor Analysis"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptWizard;

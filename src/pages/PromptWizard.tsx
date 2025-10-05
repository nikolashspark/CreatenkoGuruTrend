import React, { useState } from 'react';

const RAILWAY_API_URL = import.meta.env.VITE_RAILWAY_API_URL || 'https://createnkogurutrend-production.up.railway.app';

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

type ModeType = 'user_idea' | 'all_trends' | 'fixed_page';

interface PageIdOption {
  page_id: string;
  count: number;
}

const PromptWizard: React.FC = () => {
  const [mode, setMode] = useState<ModeType>('all_trends');
  const [pageId, setPageId] = useState('');
  const [availablePageIds, setAvailablePageIds] = useState<PageIdOption[]>([]);
  const [loadingPageIds, setLoadingPageIds] = useState(false);
  const [userIdea, setUserIdea] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PromptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Завантаження списку Page ID при зміні режиму на fixed_page
  React.useEffect(() => {
    if (mode === 'fixed_page' && availablePageIds.length === 0 && !loadingPageIds) {
      loadAvailablePageIds();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const loadAvailablePageIds = async () => {
    try {
      setLoadingPageIds(true);
      console.log('Loading available Page IDs...');

      const response = await fetch(`${RAILWAY_API_URL}/api/analyzed-page-ids`);
      
      if (!response.ok) {
        throw new Error('Failed to load page IDs');
      }

      const data = await response.json();
      setAvailablePageIds(data.pageIds || []);
      console.log(`✅ Loaded ${data.pageIds?.length || 0} Page IDs`);
      
    } catch (err: any) {
      console.error('Load Page IDs error:', err);
      setError(`Не вдалося завантажити список Page ID: ${err.message}`);
    } finally {
      setLoadingPageIds(false);
    }
  };

  const generatePrompts = async () => {
    // Validation based on mode
    if (mode === 'user_idea' && !userIdea.trim()) {
      setError('Введіть вашу ідею креативу');
      return;
    }
    
    if (mode === 'fixed_page' && !pageId.trim()) {
      setError('Введіть Page ID');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log(`🪄 Generating Kling prompts in mode: ${mode}`);
      console.log('Page ID:', mode === 'fixed_page' ? pageId : mode === 'all_trends' ? 'ALL' : 'N/A');
      console.log('Has user idea:', !!userIdea);

      const requestBody: { mode: string; pageId?: string; userIdea?: string } = {
        mode: mode // передаємо режим на backend
      };
      
      if (mode === 'fixed_page') {
        requestBody.pageId = pageId;
      }
      
      if (userIdea.trim()) {
        requestBody.userIdea = userIdea;
      }

      const response = await fetch(`${RAILWAY_API_URL}/api/prompt-wizard/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
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

        {/* Mode Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center">Оберіть режим роботи</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mode 1: User Idea Only */}
            <button
              onClick={() => setMode('user_idea')}
              className={`p-6 rounded-xl border-2 transition-all ${
                mode === 'user_idea'
                  ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                  : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
              }`}
            >
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="text-lg font-bold mb-2">Тільки ідея</h3>
              <p className="text-sm text-gray-600">
                Згенерувати промпти на основі вашого опису БЕЗ аналізу конкурентів
              </p>
              {mode === 'user_idea' && (
                <div className="mt-3 text-xs text-green-700 font-semibold">
                  ✓ Обрано
                </div>
              )}
            </button>

            {/* Mode 2: All Trends */}
            <button
              onClick={() => setMode('all_trends')}
              className={`p-6 rounded-xl border-2 transition-all ${
                mode === 'all_trends'
                  ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
              }`}
            >
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-lg font-bold mb-2">Всі тренди</h3>
              <p className="text-sm text-gray-600">
                Проаналізувати ВСІ креативи з Vertex AI та згенерувати промпти
              </p>
              {mode === 'all_trends' && (
                <div className="mt-3 text-xs text-purple-700 font-semibold">
                  ✓ Обрано
                </div>
              )}
            </button>

            {/* Mode 3: Fixed Page ID */}
            <button
              onClick={() => setMode('fixed_page')}
              className={`p-6 rounded-xl border-2 transition-all ${
                mode === 'fixed_page'
                  ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-lg font-bold mb-2">Фіксований Page ID</h3>
              <p className="text-sm text-gray-600">
                Проаналізувати тільки креативи конкретної сторінки
              </p>
              {mode === 'fixed_page' && (
                <div className="mt-3 text-xs text-blue-700 font-semibold">
                  ✓ Обрано
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📋 Параметри генерації</h2>
          
          <div className="space-y-4">
            {/* Page ID select - only for fixed_page mode */}
            {mode === 'fixed_page' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page ID <span className="text-red-500">*</span>
                </label>
                
                {loadingPageIds ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-center">
                    ⏳ Завантаження списку...
                  </div>
                ) : availablePageIds.length === 0 ? (
                  <div className="w-full px-4 py-3 border border-yellow-300 rounded-lg bg-yellow-50 text-yellow-800 text-sm">
                    ⚠️ Немає проаналізованих Page ID. Спочатку проаналізуйте креативи в розділі "Аналіз Page ID"
                  </div>
                ) : (
                  <>
                    <select
                      value={pageId}
                      onChange={(e) => setPageId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="">-- Оберіть Page ID --</option>
                      {availablePageIds.map((item) => (
                        <option key={item.page_id} value={item.page_id}>
                          {item.page_id} ({item.count} креативів)
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      📊 Показано {availablePageIds.length} Page ID з аналізами • Відсортовано за кількістю креативів
                    </p>
                  </>
                )}
              </div>
            )}

            {/* User idea textarea */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mode === 'user_idea' ? 'Ваша ідея креативу' : 'Ваша ідея (опціонально)'}
                {mode === 'user_idea' && <span className="text-red-500"> *</span>}
              </label>
              <textarea
                value={userIdea}
                onChange={(e) => setUserIdea(e.target.value)}
                placeholder={
                  mode === 'user_idea'
                    ? "Опишіть свою ідею детально:\n\nПриклад: Хочу показати як старе блідне фото перетворюється на яскраве HD зображення. Спочатку телефон лежить на столі з блідим фото на екрані, потім з'являється прогрес-бар, і фото стає яскравим і чітким з легким glow ефектом."
                    : "Опціонально: опишіть свою ідею, або залиште порожнім для генерації на основі трендів"
                }
                rows={mode === 'user_idea' ? 8 : 5}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 ${
                  mode === 'user_idea' ? 'focus:ring-green-500' : 
                  mode === 'all_trends' ? 'focus:ring-purple-500' : 'focus:ring-blue-500'
                } focus:border-transparent`}
              />
              <p className="text-xs text-gray-500 mt-1">
                {mode === 'user_idea' && '🎨 Режим "Тільки ідея" - опишіть що хочете побачити у креативі'}
                {mode === 'all_trends' && '📊 Якщо не введете ідею - промпти будуть згенеровані на основі всіх трендів'}
                {mode === 'fixed_page' && '🔍 Можна додати свою ідею або залишити порожнім для генерації на основі трендів цієї сторінки'}
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
            <h3 className="text-lg font-semibold mb-3">💡 Підказка</h3>
            <p className="text-sm text-gray-700 mb-3">
              Для режимів "Всі тренди" та "Фіксований Page ID" спочатку проаналізуйте креативи через Vertex AI в розділі <strong>"Аналіз Page ID"</strong>
            </p>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-900 font-semibold mb-2">🔄 Процес:</p>
              <ol className="text-xs text-purple-800 space-y-1 list-decimal list-inside">
                <li>Оберіть режим роботи</li>
                <li>Заповніть необхідні поля</li>
                <li>Натисніть "Згенерувати промпти"</li>
                <li>Скопіюйте промпти для Kling AI</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptWizard;

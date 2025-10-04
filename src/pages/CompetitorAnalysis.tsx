import React, { useState } from 'react';
import { generateWithClaude } from '../services/claudeApi';
import { scrapeFacebookAds } from '../services/apifyService';

interface CompetitorAd {
  id: string;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  pageName: string;
  adType: string;
  createdAt: string;
}

const CompetitorAnalysis: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [ads, setAds] = useState<CompetitorAd[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [pageId, setPageId] = useState('161970940341938');
  const [country, setCountry] = useState('US');
  const [count, setCount] = useState(10);

  const analyzeCompetitors = async () => {
    setIsLoading(true);
    setError(null);
    setAds([]);
    setAnalysis(null);

    try {
      // Скрапимо Facebook Ads через Apify
      console.log(`Scraping Facebook Ads for page ${pageId} in ${country}, count: ${count}`);
      const scrapedAds = await scrapeFacebookAds(pageId, country, count);
      setAds(scrapedAds);

      // Аналізуємо отримані дані через Claude
      const analysisPrompt = `
        Проаналізуй ці креативи конкурентів з Facebook Ads:
        
        ${scrapedAds.map((ad, index) => `
        Креатив ${index + 1}:
        - Сторінка: ${ad.pageName}
        - Тип: ${ad.adType}
        - Текст: ${ad.text}
        - Дата: ${ad.createdAt}
        `).join('\n')}
        
        Проведи детальний аналіз:
        1. Тренди в креативі (стиль, тональність, підходи)
        2. Візуальні елементи (кольори, композиція, стиль)
        3. Приклики до дії (CTA, мотивація)
        4. Цільова аудиторія (хто може бути ціллю)
        5. Унікальні особливості бренду
        6. Рекомендації для нашого бренду на основі аналізу
        
        Надай конкретні рекомендації для створення власних креативів.
      `;

      const analysisResponse = await generateWithClaude(analysisPrompt);
      setAnalysis(analysisResponse);

    } catch (err: any) {
      setError(`Помилка при аналізі конкурентів: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🔍 Аналіз конкурентів
          </h1>
          <p className="text-lg text-gray-600">
            Аналізуйте креативи конкурентів з Facebook Ads Library
          </p>
        </div>

        {/* Параметри аналізу */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Параметри аналізу</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page ID
              </label>
              <input
                type="text"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="161970940341938"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Країна
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="US">США</option>
                <option value="UA">Україна</option>
                <option value="GB">Великобританія</option>
                <option value="DE">Німеччина</option>
                <option value="FR">Франція</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Кількість креативів
              </label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(Math.max(10, parseInt(e.target.value) || 10))}
                min="10"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10"
              />
              <p className="text-xs text-gray-500 mt-1">Мінімум 10, максимум 100</p>
            </div>
          </div>
        </div>

        {/* Кнопка аналізу */}
        <div className="text-center mb-8">
          <button
            onClick={analyzeCompetitors}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
          >
            {isLoading ? '🔄 Аналізуємо...' : '🚀 Почати аналіз'}
          </button>
        </div>

        {/* Помилка */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Результати аналізу */}
        {ads.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Знайдені креативи ({ads.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.map((ad, index) => (
                <div key={ad.id || index} className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900">{ad.pageName}</h3>
                    <p className="text-sm text-gray-500">{ad.adType} • {ad.createdAt}</p>
                  </div>
                  
                  {ad.imageUrl && (
                    <div className="mb-3">
                      <img 
                        src={ad.imageUrl} 
                        alt="Ad creative" 
                        className="w-full h-32 object-cover rounded"
                      />
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-700">{ad.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Аналіз */}
        {analysis && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Аналіз креативів</h2>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">
                {analysis}
              </pre>
            </div>
          </div>
        )}

        {/* Інструкції */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            💡 Як це працює
          </h3>
          <ul className="text-blue-800 space-y-2">
            <li>• Введіть Page ID конкурента з Facebook</li>
            <li>• Оберіть країну для аналізу</li>
            <li>• Натисніть "Почати аналіз"</li>
            <li>• AI проаналізує креативи та дасть рекомендації</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CompetitorAnalysis;

import React, { useState, useEffect } from 'react';
import { generateWithClaude } from '../services/claudeApi';
import { scrapeFacebookAds, getSavedFacebookAds, analyzeAdWithAI } from '../services/apifyService';
import { analyzeVideoWithGemini } from '../services/geminiService';

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
  const [useGemini, setUseGemini] = useState(false);
  const [videoAnalysis, setVideoAnalysis] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'saved' | 'new'>('saved');
  const [analyzingAds, setAnalyzingAds] = useState<Record<string, boolean>>({});
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, string>>({});

  // Завантаження збережених оголошень при завантаженні сторінки
  useEffect(() => {
    loadSavedAds();
  }, []);

  const loadSavedAds = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📥 Loading saved ads from Supabase...');
      const savedAds = await getSavedFacebookAds();
      setAds(savedAds);
      console.log(`✅ Loaded ${savedAds.length} saved ads`);
      setViewMode('saved');
      
      // Завантажуємо вже існуючі аналізи
      const existingAnalyses: Record<string, string> = {};
      savedAds.forEach((ad: any) => {
        if (ad.vertexAnalysis) {
          existingAnalyses[ad.id] = ad.vertexAnalysis;
        }
      });
      setAiAnalysis(existingAnalyses);
    } catch (err: any) {
      console.error('Failed to load saved ads:', err);
      setError(`Не вдалося завантажити збережені оголошення: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeAd = async (adId: string, forceReanalyze: boolean = false) => {
    setAnalyzingAds(prev => ({ ...prev, [adId]: true }));
    setError(null);
    
    try {
      console.log(`🤖 Analyzing ad ${adId}...`);
      const result = await analyzeAdWithAI(adId, forceReanalyze);
      
      setAiAnalysis(prev => ({
        ...prev,
        [adId]: result.analysis
      }));
      
      if (result.cached) {
        console.log('✅ Loaded cached analysis');
      } else {
        console.log('✅ New analysis completed and saved');
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(`Помилка аналізу: ${err.message}`);
    } finally {
      setAnalyzingAds(prev => ({ ...prev, [adId]: false }));
    }
  };

  const analyzeCompetitors = async () => {
    setIsLoading(true);
    setError(null);
    setAds([]);
    setAnalysis(null);

    try {
      // Скрапимо Facebook Ads через Apify
      console.log(`Scraping Facebook Ads for page ${pageId} in ${country}, count: ${count}`);
      const scrapeResult = await scrapeFacebookAds(pageId, country, count);
      
      // Перевіряємо чи є нові креативи
      if (scrapeResult.savedCount === 0 && (scrapeResult.duplicatesCount || 0) > 0) {
        setError(`⚠️ ${scrapeResult.message || 'Всі знайдені креативи вже є в базі даних. Спробуйте іншу сторінку або збільште кількість.'}`);
        setIsLoading(false);
        return;
      }
      
      // Якщо Apify повернув newAdsForAnalysis - використаємо їх, інакше всі ads
      const scrapedAds = scrapeResult.ads || scrapeResult;
      const newAdsForAnalysis = scrapeResult.newAdsForAnalysis || [];
      
      setAds(scrapedAds);

      console.log('📊 Scraped ads:', scrapedAds.length);
      console.log('📊 New ads for analysis:', newAdsForAnalysis.length);
      console.log('📊 Duplicates skipped:', scrapeResult.duplicatesCount || 0);
      console.log('📊 Total scraped from Apify:', scrapeResult.totalScraped || 0);
      console.log('📊 Unique ads saved:', scrapeResult.savedCount || 0);
      console.log('📊 Ads with video:', scrapedAds.filter(ad => ad.videoUrl).length);
      if (scrapedAds.length > 0) {
        console.log('📊 Sample ad:', scrapedAds[0]);
      }
      
      // Показуємо статистику користувачу
      if (scrapeResult.message) {
        console.log(`ℹ️ ${scrapeResult.message}`);
      }

      // Якщо увімкнено Gemini - автоматично аналізуємо НОВІ креативи через Vertex AI
      let geminiVideoInsights: Record<string, string> = {};
      
      console.log('🔍 Checking useGemini state:', useGemini);
      
      if (useGemini && newAdsForAnalysis.length > 0) {
        console.log(`✅ Vertex AI auto-analysis is ENABLED - analyzing ${newAdsForAnalysis.length} new ads`);
        
        for (let i = 0; i < newAdsForAnalysis.length; i++) {
          const ad = newAdsForAnalysis[i];
          try {
            console.log(`🔄 [${i+1}/${newAdsForAnalysis.length}] Analyzing ad ${ad.id} with Vertex AI...`);
            
            const result = await analyzeAdWithAI(ad.id, false);
            
            geminiVideoInsights[ad.id] = result.analysis;
            setVideoAnalysis(prev => ({
              ...prev,
              [ad.id]: result.analysis
            }));
            
            console.log(`✅ [${i+1}/${newAdsForAnalysis.length}] Ad ${ad.id} analyzed`);
          } catch (analysisErr: any) {
            console.error(`❌ Failed to analyze ad ${ad.id}:`, analysisErr);
            // Продовжуємо аналізувати інші
          }
        }
        
        console.log('🎉 Auto-analysis completed for all new ads');
      } else if (useGemini) {
        console.log('⚠️ Vertex AI is enabled but no new ads to analyze (all were duplicates or no media)');
      } else {
        console.log('⚠️ Vertex AI auto-analysis is disabled');
      }
      
      // Старий код для відео аналізу (залишаємо для сумісності)
      if (useGemini && newAdsForAnalysis.length === 0) {
        console.log('✅ Vertex AI video analysis is ENABLED (old flow)');
        const videoAds = scrapedAds.filter(ad => ad.videoUrl);
        console.log(`📹 Found ${videoAds.length} video ads to analyze`);
        
        if (videoAds.length === 0) {
          console.warn('⚠️ No video ads found! All ads:', scrapedAds.map(ad => ({
            id: ad.id,
            type: ad.adType,
            hasVideo: !!ad.videoUrl,
            hasImage: !!ad.imageUrl
          })));
        }
        
        for (const ad of videoAds) {
          try {
            console.log(`🔄 Analyzing video ${ad.id} with Vertex AI...`);
            console.log(`Video URL: ${ad.videoUrl}`);
            const videoAnalysisResult = await analyzeVideoWithGemini(ad.videoUrl!);
            console.log(`✅ Video ${ad.id} analyzed successfully`);
            
            geminiVideoInsights[ad.id] = videoAnalysisResult;
            
            setVideoAnalysis(prev => ({
              ...prev,
              [ad.id]: videoAnalysisResult
            }));
          } catch (videoErr: any) {
            console.error(`❌ Failed to analyze video ${ad.id}:`, videoErr);
            setError(`Помилка аналізу відео ${ad.id}: ${videoErr.message}`);
          }
        }
        console.log('🎉 All videos analyzed by Gemini');
      } else {
        console.log('⚠️ Vertex AI video analysis is disabled (checkbox not checked)');
      }

      // Тепер Claude аналізує все разом (включаючи інсайти від Gemini)
      const analysisPrompt = `
        Проаналізуй ці креативи конкурентів з Facebook Ads:
        
        ${scrapedAds.map((ad, index) => `
        Креатив ${index + 1}:
        - Сторінка: ${ad.pageName}
        - Тип: ${ad.adType}
        - Текст: ${ad.text}
        - Дата: ${new Date(ad.createdAt).toLocaleDateString()}
        ${ad.imageUrl ? `- Зображення URL: ${ad.imageUrl}` : ''}
        
        ${geminiVideoInsights[ad.id] ? `
        📹 ДЕТАЛЬНИЙ АНАЛІЗ ВІДЕО від Gemini AI:
        ${geminiVideoInsights[ad.id]}
        ` : ''}
        `).join('\n\n---\n\n')}
        
        ${useGemini ? `
        ✨ Ти отримав детальний аналіз відео від Gemini AI (візуальні деталі, динаміка, емоції, кадри).
        Використай ці інсайти для глибшого стратегічного аналізу.
        ` : ''}
        
        Проведи СТРАТЕГІЧНИЙ аналіз:
        1. 🎯 Тренди в креативі (стиль, тональність, підходи)
        2. 🎨 Візуальні елементи (кольори, композиція, стиль)
        3. 📣 Приклики до дії (CTA, мотивація)
        4. 👥 Цільова аудиторія (хто може бути ціллю)
        5. ⭐ Унікальні особливості бренду
        6. 💡 Конкретні рекомендації для нашого бренду
        
        ${useGemini ? `
        7. 🎬 Інсайти з відео аналізу (що працює в динаміці, емоціях, візуальних ефектах)
        ` : ''}
        
        Надай КОНКРЕТНІ та ПРАКТИЧНІ рекомендації для створення власних креативів.
      `;

      const analysisResponse = await generateWithClaude(analysisPrompt);
      setAnalysis(analysisResponse);
      
      // Перемикаємо на режим "нові"
      setViewMode('new');

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

        {/* Вкладки */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4">
            <button
              onClick={loadSavedAds}
              disabled={isLoading}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
                viewMode === 'saved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } disabled:opacity-50`}
            >
              💾 Збережені оголошення ({ads.length > 0 && viewMode === 'saved' ? ads.length : '...'})
            </button>
            <button
              onClick={() => setViewMode('new')}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
                viewMode === 'new'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🆕 Новий пошук
            </button>
          </div>
        </div>

        {/* Параметри аналізу */}
        {viewMode === 'new' && (
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
          
          {/* Опція Gemini */}
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="useGemini"
              checked={useGemini}
              onChange={(e) => setUseGemini(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="useGemini" className="ml-2 text-sm text-gray-700">
              🤖 <strong>Автоматичний аналіз через Vertex AI Gemini</strong> (детальний аналіз відео та картинок, динаміка, емоції, візуальні ефекти) - автоматично аналізує всі НОВІ креативи після пошуку
            </label>
          </div>
          <div className="mt-2 ml-6 text-xs text-gray-500">
            💡 Якщо вимкнено - аналіз тільки через кнопку "🤖 Аналізувати" на кожному креативі окремо
          </div>
        </div>
        )}

        {/* Кнопка аналізу */}
        {viewMode === 'new' && (
        <div className="text-center mb-8">
          <button
            onClick={analyzeCompetitors}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
          >
            {isLoading ? (
              <span>
                🔄 {useGemini ? 'Аналізуємо з Vertex AI...' : 'Скрапимо...'}
              </span>
            ) : (
              '🚀 Почати аналіз'
            )}
          </button>
        </div>
        )}

        {/* Помилка */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Результати аналізу */}
        {ads.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {viewMode === 'saved' ? '💾 Збережені креативи' : '🆕 Нові креативи'} ({ads.length})
              </h2>
              {viewMode === 'saved' && (
                <button
                  onClick={loadSavedAds}
                  disabled={isLoading}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded text-sm"
                >
                  🔄 Оновити
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.map((ad, index) => (
                <div key={ad.id || index} className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900">{ad.pageName}</h3>
                    <p className="text-sm text-gray-500">{ad.adType} • {new Date(ad.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  {ad.videoUrl ? (
                    <div className="mb-3">
                      <video 
                        src={ad.videoUrl} 
                        controls 
                        className="w-full h-48 object-cover rounded"
                        poster={ad.imageUrl || undefined}
                      />
                    </div>
                  ) : ad.imageUrl ? (
                    <div className="mb-3">
                      <img 
                        src={ad.imageUrl} 
                        alt="Ad creative" 
                        className="w-full h-48 object-cover rounded"
                      />
                    </div>
                  ) : null}
                  
                  <p className="text-sm text-gray-700 mb-2">{ad.text}</p>
                  {ad.videoUrl && (
                    <a 
                      href={ad.videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline block mb-2"
                    >
                      🎥 Відкрити відео
                    </a>
                  )}
                  
                  {/* Кнопка аналізу через AI - тільки якщо є медіа */}
                  {viewMode === 'saved' && (ad.imageUrl || ad.videoUrl) && (ad.imageUrl !== null || ad.videoUrl !== null) && (
                    <div className="mt-3">
                      <button
                        onClick={() => handleAnalyzeAd(ad.id, !!aiAnalysis[ad.id])}
                        disabled={analyzingAds[ad.id]}
                        className={`w-full py-2 px-3 rounded text-sm font-medium transition ${
                          aiAnalysis[ad.id]
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {analyzingAds[ad.id] ? (
                          '⏳ Аналізуємо...'
                        ) : aiAnalysis[ad.id] ? (
                          '🔄 Оновити аналіз'
                        ) : (
                          `🤖 Аналізувати ${ad.adType === 'VIDEO' ? 'відео' : 'картинку'}`
                        )}
                      </button>
                    </div>
                  )}
                  
                  {/* AI аналіз результат */}
                  {aiAnalysis[ad.id] && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-300 rounded-lg">
                      <h4 className="text-xs font-bold text-purple-900 mb-2 flex items-center gap-1">
                        🤖 AI Аналіз (Gemini 2.0 Flash)
                      </h4>
                      <div className="text-xs text-gray-800 whitespace-pre-wrap max-h-64 overflow-y-auto">
                        {aiAnalysis[ad.id]}
                      </div>
                    </div>
                  )}
                  
                  {/* Gemini аналіз відео (старий для нових пошуків) */}
                  {videoAnalysis[ad.id] && (
                    <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded">
                      <h4 className="text-xs font-semibold text-purple-900 mb-2">🤖 Gemini Video Analysis:</h4>
                      <p className="text-xs text-purple-800 whitespace-pre-wrap">{videoAnalysis[ad.id]}</p>
                    </div>
                  )}
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

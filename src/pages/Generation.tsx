import { useState } from 'react'
import FileUpload from '../components/FileUpload'
import { generateWithClaude } from '../services/claudeApi'
import '../services/testClaude' // Імпорт тестового файлу

const Generation = () => {
  const [appLink, setAppLink] = useState('')
  const [prompt, setPrompt] = useState('')
  const [goodPerformanceFile, setGoodPerformanceFile] = useState<File | null>(null)
  const [badPerformanceFile, setBadPerformanceFile] = useState<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedResult, setGeneratedResult] = useState('')
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!appLink.trim() || !prompt.trim()) {
      alert('Будь ласка, заповніть всі обов\'язкові поля')
      return
    }

    setIsGenerating(true)
    setError('')
    setGeneratedResult('')
    
    try {
      // Формуємо повний prompt для Claude
      const fullPrompt = `
App Link: ${appLink}
Prompt: ${prompt}
${goodPerformanceFile ? `Good Performance File: ${goodPerformanceFile.name}` : ''}
${badPerformanceFile ? `Bad Performance File: ${badPerformanceFile.name}` : ''}

Будь ласка, проаналізуй дані та надай рекомендації для покращення продуктивності додатку.
      `.trim()

      console.log('Sending request to Claude API...')
      const result = await generateWithClaude(fullPrompt)
      
      setGeneratedResult(result)
      console.log('Claude API response:', result)
      
    } catch (error) {
      console.error('Generation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Невідома помилка під час генерації'
      setError(errorMessage)
      alert(`Помилка: ${errorMessage}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-8">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6 lg:mb-8">🔨 Generation (в розробці)</h2>
        
        <div className="space-y-6">
            {/* App Link Input */}
            <div>
              <label htmlFor="appLink" className="block text-sm font-medium text-gray-700 mb-2">
                App Link:
              </label>
              <input
                type="url"
                id="appLink"
                value={appLink}
                onChange={(e) => setAppLink(e.target.value)}
                placeholder="https://example.com"
                className="input-field"
                required
              />
            </div>

            {/* Prompt Input */}
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Prompt:
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Введіть ваш запит тут..."
                rows={4}
                className="input-field resize-none"
                required
              />
            </div>

            {/* Tested Performance Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tested Performance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                <FileUpload
                  label="Good working"
                  onFileSelect={setGoodPerformanceFile}
                  acceptedFile={goodPerformanceFile}
                />
                <FileUpload
                  label="Bad performance"
                  onFileSelect={setBadPerformanceFile}
                  acceptedFile={badPerformanceFile}
                />
              </div>
            </div>

            {/* Generate Button */}
            <div className="pt-6">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !appLink.trim() || !prompt.trim()}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors duration-200 ${
                  isGenerating || !appLink.trim() || !prompt.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'btn-primary'
                }`}
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Генерація...</span>
                  </div>
                ) : (
                  'Generate'
                )}
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-sm font-medium text-red-800 mb-2">Помилка:</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Generated Result Display */}
            {generatedResult && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-sm font-medium text-green-800 mb-2">Результат генерації:</h3>
                <div className="text-sm text-green-700 whitespace-pre-wrap">{generatedResult}</div>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}

export default Generation

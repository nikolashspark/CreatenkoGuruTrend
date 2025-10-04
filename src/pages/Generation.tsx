import { useState } from 'react'
import FileUpload from '../components/FileUpload'

const Generation = () => {
  const [appLink, setAppLink] = useState('')
  const [prompt, setPrompt] = useState('')
  const [goodPerformanceFile, setGoodPerformanceFile] = useState<File | null>(null)
  const [badPerformanceFile, setBadPerformanceFile] = useState<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!appLink.trim() || !prompt.trim()) {
      alert('Будь ласка, заповніть всі обов\'язкові поля')
      return
    }

    setIsGenerating(true)
    
    // Симуляція обробки
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      console.log('Generation data:', {
        appLink,
        prompt,
        goodPerformanceFile,
        badPerformanceFile
      })
      alert('Генерація завершена успішно!')
    } catch (error) {
      console.error('Generation error:', error)
      alert('Помилка під час генерації')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-8">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6 lg:mb-8">Generation</h2>
        
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
        </div>
      </div>
    </div>
  )
}

export default Generation

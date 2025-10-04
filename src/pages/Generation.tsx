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
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string, timestamp: Date}>>([])

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Будь ласка, заповніть поле Prompt')
      return
    }

    setIsGenerating(true)
    setShowChat(true)
    
    // Додаємо повідомлення користувача до чату
    const userMessage = {
      role: 'user' as const,
      content: prompt,
      timestamp: new Date()
    }
    setChatMessages([userMessage])
    
    try {
      // Формуємо повний prompt для Claude
      const fullPrompt = `
App Link: ${appLink || 'Не вказано'}
Prompt: ${prompt}
${goodPerformanceFile ? `Good Performance File: ${goodPerformanceFile.name}` : ''}
${badPerformanceFile ? `Bad Performance File: ${badPerformanceFile.name}` : ''}

Будь ласка, проаналізуй дані та надай рекомендації для покращення продуктивності додатку. Надай детальний reasoning та пошагові рекомендації.
      `.trim()

      console.log('Sending request to Claude API...')
      const result = await generateWithClaude(fullPrompt)
      
      // Додаємо відповідь асистента до чату
      const assistantMessage = {
        role: 'assistant' as const,
        content: result,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, assistantMessage])
      
      console.log('Claude API response:', result)
      
    } catch (error) {
      console.error('Generation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Невідома помилка під час генерації'
      
      // Додаємо повідомлення про помилку до чату
      const errorMessageObj = {
        role: 'assistant' as const,
        content: `❌ Помилка: ${errorMessage}`,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessageObj])
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
                disabled={isGenerating || !prompt.trim()}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors duration-200 ${
                  isGenerating || !prompt.trim()
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

            {/* Chat UI */}
            {showChat && (
              <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-800 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Claude AI Chat
                  </h3>
                  <button
                    onClick={() => {
                      setShowChat(false)
                      setChatMessages([])
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    Очистити чат
                  </button>
                </div>
                
                <div className="max-h-96 overflow-y-auto p-4 space-y-4">
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <div className="text-sm font-medium mb-1">
                          {message.role === 'user' ? 'Ви' : 'Claude AI'}
                        </div>
                        <div className={`text-sm whitespace-pre-wrap ${
                          message.role === 'user' ? 'text-white' : 'text-gray-700'
                        }`}>
                          {message.content}
                        </div>
                        <div className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isGenerating && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          <span className="text-sm text-gray-500 ml-2">Claude думає...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}

export default Generation

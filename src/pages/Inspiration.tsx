import { Lightbulb, Sparkles, TrendingUp } from 'lucide-react'

const Inspiration = () => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-8">
        <div className="text-center mb-6 lg:mb-8">
          <Lightbulb className="w-12 h-12 lg:w-16 lg:h-16 text-primary-500 mx-auto mb-4" />
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Inspiration</h2>
          <p className="text-gray-600 text-sm lg:text-base">
            Знайдіть натхнення для ваших проектів та дізнайтеся про останні тренди
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6 border border-primary-200">
            <Sparkles className="w-8 h-8 text-primary-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Креативні ідеї</h3>
            <p className="text-gray-600 text-sm">
              Отримайте натхнення з найкращих креативних рішень та інноваційних підходів
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <TrendingUp className="w-8 h-8 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Тренди</h3>
            <p className="text-gray-600 text-sm">
              Слідкуйте за останніми трендами в дизайні, технологіях та бізнесі
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <Lightbulb className="w-8 h-8 text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Інновації</h3>
            <p className="text-gray-600 text-sm">
              Досліджуйте революційні ідеї та підходи, які змінюють індустрії
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Ця сторінка буде розширена додатковими функціями в майбутніх оновленнях
          </p>
        </div>
      </div>
    </div>
  )
}

export default Inspiration

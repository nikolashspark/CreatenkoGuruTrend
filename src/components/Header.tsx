import { User } from 'lucide-react'

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Createnko</h1>
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
            <User className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header

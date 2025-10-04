import { User } from 'lucide-react'

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between max-w-full">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">Createnko</h1>
        <div className="flex items-center space-x-2 lg:space-x-4">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
            <User className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header

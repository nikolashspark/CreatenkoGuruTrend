import { Link, useLocation } from 'react-router-dom'
import { Sparkles, Lightbulb } from 'lucide-react'

const Sidebar = () => {
  const location = useLocation()

  const menuItems = [
    {
      name: 'Generation',
      path: '/generation',
      icon: Sparkles,
    },
    {
      name: 'Inspiration',
      path: '/inspiration',
      icon: Lightbulb,
    },
  ]

  return (
    <aside className="w-full lg:w-64 bg-white shadow-sm border-r border-gray-200 h-full">
      <nav className="p-4 lg:p-6 h-full">
        <ul className="flex lg:flex-col space-x-4 lg:space-x-0 lg:space-y-4 h-full lg:justify-start">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || 
              (item.path === '/generation' && location.pathname === '/')
            
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar

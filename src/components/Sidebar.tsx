import { Link, useLocation } from 'react-router-dom'
import { Sparkles, Lightbulb, Search, Settings } from 'lucide-react'

const Sidebar = () => {
  const location = useLocation()

  const menuItems = [
    {
      name: '🔨 Generation (soon)',
      path: '/generation',
      icon: Sparkles,
    },
    {
      name: 'Prompt Wizard',
      path: '/inspiration',
      icon: Lightbulb,
    },
    {
      name: 'Аналіз Page ID',
      path: '/competitors',
      icon: Search,
    },
    {
      name: 'Config',
      path: '/config',
      icon: Settings,
    },
  ]

  return (
    <aside className="w-full lg:w-64 bg-white shadow-sm lg:border-r border-b lg:border-b-0 border-gray-200 h-auto lg:h-full">
      <nav className="p-2 lg:p-6 h-full overflow-x-auto lg:overflow-x-visible">
        <ul className="flex lg:flex-col gap-2 lg:gap-4 h-full lg:justify-start min-w-max lg:min-w-0">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || 
              (item.path === '/generation' && location.pathname === '/')
            
            return (
              <li key={item.name} className="flex-shrink-0 lg:flex-shrink">
                <Link
                  to={item.path}
                  className={`flex items-center gap-2 lg:gap-3 px-3 py-2 lg:px-4 lg:py-3 rounded-lg transition-colors duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-sm lg:text-base">{item.name}</span>
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

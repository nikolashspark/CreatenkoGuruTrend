import Header from './Header'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 max-w-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout

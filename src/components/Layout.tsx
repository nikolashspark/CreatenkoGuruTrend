import Header from './Header'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout

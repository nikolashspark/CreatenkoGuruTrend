import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Generation from './pages/Generation'
import Inspiration from './pages/Inspiration'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Generation />} />
          <Route path="/generation" element={<Generation />} />
          <Route path="/inspiration" element={<Inspiration />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App

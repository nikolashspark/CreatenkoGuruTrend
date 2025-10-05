import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Generation from './pages/Generation'
import PromptWizard from './pages/PromptWizard'
import CompetitorAnalysis from './pages/CompetitorAnalysis'
import Config from './pages/Config'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Generation />} />
          <Route path="/generation" element={<Generation />} />
          <Route path="/inspiration" element={<PromptWizard />} />
          <Route path="/competitors" element={<CompetitorAnalysis />} />
          <Route path="/config" element={<Config />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App

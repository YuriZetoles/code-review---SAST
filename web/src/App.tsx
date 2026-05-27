import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RankingPage } from './pages/RankingPage.js'
import { DetailPage } from './pages/DetailPage.js'

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <header className="border-b border-gray-800 px-6 py-4">
          <h1 className="text-xl font-bold text-cyan-400">🔒 SAST Arena</h1>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<RankingPage />} />
            <Route path="/scan/:id" element={<DetailPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RankingPage } from './pages/RankingPage.js'
import { DetailPage } from './pages/DetailPage.js'
import { InstructionsPage } from './pages/InstructionsPage.js'

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#020617] text-slate-100 font-sans">
        <header className="relative scanlines border-b border-green-500/20 bg-[#020617]/95 backdrop-blur-sm sticky top-0 z-50">
          <div className="relative z-10 max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 group cursor-pointer no-underline">
              <div className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center group-hover:border-green-500/60 group-hover:bg-green-500/20 transition-all duration-200">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <div className="font-code font-bold text-lg text-green-400 leading-none neon-text">SAST Arena</div>
                <div className="text-xs text-slate-500 leading-none mt-0.5 font-code">security analysis platform</div>
              </div>
            </a>

            <nav className="flex items-center gap-6">
              <a
                href="/"
                className="text-sm text-slate-400 hover:text-green-400 transition-colors duration-200 cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Ranking
              </a>
              <a
                href="/como-usar"
                className="text-sm text-slate-400 hover:text-green-400 transition-colors duration-200 cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Como usar
              </a>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<RankingPage />} />
            <Route path="/scan/:id" element={<DetailPage />} />
            <Route path="/como-usar" element={<InstructionsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

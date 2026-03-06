import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GameProvider } from './context/GameContext'
import Lobby from './pages/Lobby'
import Battle from './pages/Battle'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <div className="scanline" />
      <GameProvider>
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/battle" element={<Battle />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </GameProvider>
    </BrowserRouter>
  )
}

export default App

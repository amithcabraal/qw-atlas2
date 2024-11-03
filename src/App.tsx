import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import HostGame from './pages/HostGame';
import JoinGame from './pages/JoinGame';
import PlayGame from './pages/PlayGame';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/host" element={<HostGame />} />
          <Route path="/join/:gameCode" element={<JoinGame />} />
          <Route path="/play/:gameId" element={<PlayGame />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
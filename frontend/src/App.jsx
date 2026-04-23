import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Search from './pages/Search';
import DeviceDetail from './pages/DeviceDetail';
import NewsPage from './pages/News';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Quiz from './pages/Quiz';
import Room from './pages/Room';
import Prevention from './pages/Prevention';

function App() {
  return (
    <Router>
      <div className="app-container">
      <Navbar />
      
      <main className="main-content">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/device/:id" element={<DeviceDetail />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/rooms" element={<Room />} />
        <Route path="/prevention" element={<Prevention />} />
      </Routes>
      </main>

      <Footer />
      </div>
    </Router>
  );
}

export default App;
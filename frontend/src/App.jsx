import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import ConfirmEmail from "./pages/ConfirmEmail";

import News from "./pages/News";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import Prevention from "./pages/Prevention";
import Quiz from "./pages/Quiz";

import Rooms from "./pages/Rooms";
import RoomDetail from "./pages/RoomDetail";

import Devices from "./pages/Devices";
import DeviceDetail from "./pages/DeviceDetail";

import Search from "./pages/Search";

import Events from "./pages/Events";

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/devices" element={<Devices />} />
            <Route path="/device/:id" element={<DeviceDetail />} />

            <Route path="/rooms" element={<Rooms />} />
            <Route path="/room/:id" element={<RoomDetail />} />

            <Route path="/news" element={<News/>} />
            <Route path="/search" element={<Search />} />

            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/register" element={<Register />} />
            <Route path="/confirm-email" element={<ConfirmEmail />} />
            <Route path="/profile" element={<Profile />} />
            
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/prevention" element={<Prevention />} />

            <Route path="/events" element={<Events />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
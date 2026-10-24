import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import EventDetail from './pages/EventDetail.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import MyRegistrations from './pages/MyRegistrations.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminEventForm from './pages/AdminEventForm.jsx';
import AdminRegistrations from './pages/AdminRegistrations.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute role="student" />}>
              <Route path="/my-registrations" element={<MyRegistrations />} />
            </Route>

            <Route element={<ProtectedRoute role="admin" />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/events/new" element={<AdminEventForm />} />
              <Route path="/admin/events/:id/edit" element={<AdminEventForm />} />
              <Route path="/admin/events/:id/registrations" element={<AdminRegistrations />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
      <footer className="site-footer">
        <div className="container">CampusConnect Events · A college project built with the MERN stack</div>
      </footer>
    </>
  );
}

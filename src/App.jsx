import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

import Navbar from './components/Navbar';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import QuestionGenerator from './pages/admin/QuestionGenerator';
import StudentDashboard from './pages/student/StudentDashboard';
import ExamPage from './pages/student/ExamPage';
import ResultPage from './pages/student/ResultPage';

const ProtectedRoute = ({ children, role }) => {
  const { user } = React.useContext(AuthContext);
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  const { user } = React.useContext(AuthContext);

  return (
    <>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={
            !user ? <Login /> : <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />
          } />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/generator" element={
            <ProtectedRoute role="admin"><QuestionGenerator /></ProtectedRoute>
          } />
          
          {/* Student Routes */}
          <Route path="/student" element={
            <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>
          } />
          <Route path="/student/exam/:examId" element={
            <ProtectedRoute role="student"><ExamPage /></ProtectedRoute>
          } />
          <Route path="/student/result/:resultId" element={
            <ProtectedRoute role="student"><ResultPage /></ProtectedRoute>
          } />
        </Routes>
      </div>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;

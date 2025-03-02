import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Header from './components/Header';
import Loading from './components/Loading';

const App = () => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return <Loading />;
    }

    return (
        <Router>
            <div className="app">
                <Header />
                <div className="container">
                    <Routes>
                        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                        <Route
                            path="/admin"
                            element={
                                user && user.role === 'ADMIN' ? <AdminPanel /> : <Navigate to="/" />
                            }
                        />
                        <Route
                            path="/"
                            element={user ? <Dashboard /> : <Navigate to="/login" />}
                        />
                    </Routes>
                </div>
            </div>
        </Router>
    );
};

export default App;
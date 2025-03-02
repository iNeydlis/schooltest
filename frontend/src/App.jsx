import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import TestsList from './pages/TestsList';
import TestForm from './pages/TestForm';
import TestTaking from './pages/TestTaking';
import TestResult from './pages/TestResult';
import TestResultsList from './pages/TestResultsList';
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
                        {/* Страница входа: доступна только неавторизованным */}
                        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />

                        {/* Панель администратора: только для ADMIN */}
                        <Route
                            path="/admin"
                            element={
                                user && user.role === 'ADMIN' ? <AdminPanel /> : <Navigate to="/" />
                            }
                        />

                        {/* Список тестов: для всех авторизованных */}
                        <Route
                            path="/tests"
                            element={user ? <TestsList /> : <Navigate to="/login" />}
                        />

                        {/* Создание теста: только для учителей и админов */}
                        <Route
                            path="/tests/create"
                            element={
                                user && (user.role === 'TEACHER' || user.role === 'ADMIN') ?
                                    <TestForm /> : <Navigate to="/tests" />
                            }
                        />

                        {/* Редактирование теста: только для учителей и админов */}
                        <Route
                            path="/tests/:testId/edit"
                            element={
                                user && (user.role === 'TEACHER' || user.role === 'ADMIN') ?
                                    <TestForm /> : <Navigate to="/tests" />
                            }
                        />

                        {/* Прохождение теста: только для студентов */}
                        <Route
                            path="/tests/:testId/start"
                            element={
                                user && user.role === 'STUDENT' ?
                                    <TestTaking /> : <Navigate to="/tests" />
                            }
                        />

                        {/* Результат теста: только для студентов */}
                        <Route
                            path="/tests/result/:resultId"
                            element={
                                user && user.role === 'STUDENT' ?
                                    <TestResult /> : <Navigate to="/tests" />
                            }
                        />

                        {/* Мои результаты: только для студентов */}
                        <Route
                            path="/my-results"
                            element={
                                user && user.role === 'STUDENT' ?
                                    <TestResultsList /> : <Navigate to="/tests" />
                            }
                        />

                        {/* Результаты теста: только для учителей и админов */}
                        <Route
                            path="/tests/:testId/results"
                            element={
                                user && (user.role === 'TEACHER' || user.role === 'ADMIN') ?
                                    <TestResultsList /> : <Navigate to="/tests" />
                            }
                        />

                        {/* Главная страница: для всех авторизованных */}
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
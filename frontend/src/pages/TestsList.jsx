import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import TestService from '../services/TestService';

const TestsList = () => {
    const [tests, setTests] = useState([]); // Initialize with empty array
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const fetchTests = async () => {
            try {
                setLoading(true);
                const response = await TestService.getAllTests();
                // The response is already the data due to your API interceptor
                setTests(Array.isArray(response) ? response : []);
            } catch (err) {
                console.error("Error fetching tests:", err);
                setError("Ошибка при загрузке тестов: " + (err.message || 'Произошла ошибка'));
                setTests([]); // Ensure tests is always an array
            } finally {
                setLoading(false);
            }
        };

        fetchTests();
    }, []);

    const handleDeleteTest = async (testId) => {
        if (window.confirm('Вы уверены, что хотите удалить этот тест?')) {
            try {
                await TestService.deleteTest(testId);
                // Use the functional form of setState when depending on previous state
                setTests(prevTests => prevTests.filter(test => test.id !== testId));
            } catch (err) {
                console.error("Error deleting test:", err);
                setError("Ошибка при удалении теста: " + (err.message || 'Произошла ошибка'));
            }
        }
    };

    // Add defensive programming - ensure tests is always treated as an array
    const renderTests = () => {
        const testsArray = Array.isArray(tests) ? tests : [];

        if (testsArray.length === 0) {
            return <p>Нет доступных тестов.</p>;
        }

        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {testsArray.map(test => (
                    <div
                        key={test.id}
                        style={{
                            backgroundColor: 'white',
                            padding: '1rem',
                            borderRadius: '8px',
                            boxShadow: '0 0 10px rgba(0,0,0,0.1)'
                        }}
                    >
                        <h3>{test.title}</h3>
                        <p><strong>Предмет:</strong> {test.subjectName?.name || test.subjectName || 'Не указан'}</p>
                        <p><strong>Описание:</strong> {test.description || 'Нет описания'}</p>
                        <p><strong>Вопросов:</strong> {test.questionCount || '0'}</p>
                        <p><strong>Макс. попыток:</strong> {test.maxAttempts || '1'}</p>

                        {/* Добавленная информация для учеников */}
                        {user?.role === 'STUDENT' && (
                            <>
                                {test.bestScore !== undefined && (
                                    <p style={{ color: '#2E7D32' }}>
                                        <strong>Лучший результат:</strong> {test.bestScore} из {test.maxScore || '?'} баллов
                                    </p>
                                )}
                                {test.maxAttempts !== undefined && (
                                    <p>
                                        <strong>Попытки:</strong>
                                        {test.remainingAttempts !== undefined
                                            ? `${test.remainingAttempts} из ${test.maxAttempts}`
                                            : `${test.maxAttempts} максимум`}
                                    </p>
                                )}
                            </>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                            {user?.role === 'STUDENT' ? (
                                <>
                                    <Link
                                        to={`/tests/${test.id}/take`}
                                        style={{
                                            backgroundColor: test.remainingAttempts > 0 ? '#2196F3' : '#9E9E9E',
                                            color: 'white',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '4px',
                                            textDecoration: 'none',
                                            cursor: test.remainingAttempts > 0 ? 'pointer' : 'not-allowed'
                                        }}
                                        onClick={(e) => {
                                            if (test.remainingAttempts <= 0) {
                                                e.preventDefault();
                                                alert('У вас не осталось попыток для этого теста');
                                            }
                                        }}
                                    >
                                        {test.remainingAttempts > 0 ? 'Пройти тест' : 'Нет попыток'}
                                    </Link>
                                    <Link
                                        to={`/tests/${test.id}/results`}
                                        style={{
                                            backgroundColor: test.bestScore !== undefined ? '#4CAF50' : '#9E9E9E',
                                            color: 'white',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '4px',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        Мои результаты
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to={`/tests/${test.id}/results`}
                                        style={{
                                            backgroundColor: '#2196F3',
                                            color: 'white',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '4px',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        Результаты
                                    </Link>
                                    <div>
                                        <Link
                                            to={`/tests/${test.id}/edit`}
                                            style={{
                                                backgroundColor: '#FFC107',
                                                color: 'white',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '4px',
                                                textDecoration: 'none',
                                                marginRight: '0.5rem'
                                            }}
                                        >
                                            Редактировать
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteTest(test.id)}
                                            style={{
                                                backgroundColor: '#F44336',
                                                color: 'white',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '4px',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) return <div>Загрузка тестов...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Список тестов</h2>
                {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                    <Link
                        to="/tests/create"
                        style={{
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            textDecoration: 'none'
                        }}
                    >
                        Создать новый тест
                    </Link>
                )}
            </div>

            {renderTests()}
        </div>
    );
};

export default TestsList;
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import TestService from '../services/TestService';

const TestsList = () => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const fetchTests = async () => {
            try {
                setLoading(true);
                const response = await TestService.getAllTests();
                setTests(response.data);
            } catch (err) {
                setError("Ошибка при загрузке тестов: " + (err.response?.data?.message || err.message));
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
                setTests(tests.filter(test => test.id !== testId));
            } catch (err) {
                setError("Ошибка при удалении теста: " + (err.response?.data?.message || err.message));
            }
        }
    };

    if (loading) return <div>Загрузка тестов...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Список тестов</h2>
                {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
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

            {tests.length === 0 ? (
                <p>Нет доступных тестов.</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {tests.map(test => (
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
                            <p><strong>Предмет:</strong> {test.subject}</p>
                            <p><strong>Описание:</strong> {test.description || 'Нет описания'}</p>
                            <p><strong>Вопросов:</strong> {test.questionCount || '0'}</p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                                {user.role === 'STUDENT' ? (
                                    <Link
                                        to={`/tests/${test.id}/start`}
                                        style={{
                                            backgroundColor: '#2196F3',
                                            color: 'white',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '4px',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        Начать тест
                                    </Link>
                                ) : (
                                    <Link
                                        to={`/tests/${test.id}`}
                                        style={{
                                            backgroundColor: '#2196F3',
                                            color: 'white',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '4px',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        Просмотр
                                    </Link>
                                )}

                                {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
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
                                )}

                                {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
                                    <Link
                                        to={`/tests/${test.id}/results`}
                                        style={{
                                            backgroundColor: '#9C27B0',
                                            color: 'white',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '4px',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        Результаты
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TestsList;
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import TestService from '../services/TestService';

const TestResult = () => {
    const { resultId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [result, setResult] = useState(location.state?.result || null);
    const [loading, setLoading] = useState(!location.state?.result);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Если результат не передан через location state, загружаем его
        if (!result && resultId) {
            const fetchResult = async () => {
                try {
                    setLoading(true);
                    // Здесь нужен API для получения одного результата по ID
                    // Пример: const response = await TestService.getResultById(resultId);
                    // setResult(response.data);

                    // Пока такого API нет, используем загрузку всех результатов студента
                    const response = await TestService.getStudentResults();
                    const foundResult = response.data.find(r => r.id === parseInt(resultId));

                    if (foundResult) {
                        setResult(foundResult);
                    } else {
                        setError("Результат не найден");
                    }
                } catch (err) {
                    setError("Ошибка при загрузке результата: " + (err.response?.data?.message || err.message));
                } finally {
                    setLoading(false);
                }
            };

            fetchResult();
        }
    }, [resultId, result]);

    if (loading) return <div>Загрузка результата...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!result) return <div>Результат не найден</div>;

    // Расчет процента правильных ответов
    const calculatePercentage = () => {
        if (result.totalQuestions === 0) return 0;
        return Math.round((result.correctAnswers / result.totalQuestions) * 100);
    };

    // Определение статуса прохождения
    const getStatusClass = () => {
        const percentage = calculatePercentage();
        if (percentage >= 80) return { color: '#4CAF50', text: 'Отлично' };
        if (percentage >= 60) return { color: '#2196F3', text: 'Хорошо' };
        if (percentage >= 40) return { color: '#FF9800', text: 'Удовлетворительно' };
        return { color: '#F44336', text: 'Неудовлетворительно' };
    };

    const statusInfo = getStatusClass();

    return (
        <div>
            <h2>Результат тестирования</h2>

            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                marginBottom: '1.5rem'
            }}>
                <h3 style={{ marginBottom: '1.5rem' }}>{result.testTitle}</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                    <div><strong>Дата прохождения:</strong></div>
                    <div>{new Date(result.completedAt).toLocaleString()}</div>

                    <div><strong>Затраченное время:</strong></div>
                    <div>{result.timeSpent ? `${Math.floor(result.timeSpent / 60)} мин ${result.timeSpent % 60} сек` : 'Не указано'}</div>

                    <div><strong>Всего вопросов:</strong></div>
                    <div>{result.totalQuestions}</div>

                    <div><strong>Правильных ответов:</strong></div>
                    <div>{result.correctAnswers}</div>

                    <div><strong>Процент выполнения:</strong></div>
                    <div>{calculatePercentage()}%</div>

                    <div><strong>Результат:</strong></div>
                    <div style={{ color: statusInfo.color, fontWeight: 'bold' }}>{statusInfo.text}</div>
                </div>
            </div>

            {result.questionResults && (
                <div>
                    <h3>Детали ответов</h3>

                    {result.questionResults.map((qResult, index) => (
                        <div
                            key={index}
                            style={{
                                backgroundColor: 'white',
                                padding: '1.5rem',
                                borderRadius: '8px',
                                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                                marginBottom: '1rem',
                                borderLeft: `5px solid ${qResult.correct ? '#4CAF50' : '#F44336'}`
                            }}
                        >
                            <h4 style={{ marginBottom: '1rem' }}>
                                Вопрос {index + 1}: {qResult.questionText}
                            </h4>

                            <div>
                                <strong>Ваш ответ:</strong> {qResult.userAnswers.join(', ')}
                            </div>

                            {!qResult.correct && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <strong>Правильный ответ:</strong> {qResult.correctAnswers.join(', ')}
                                </div>
                            )}

                            <div
                                style={{
                                    marginTop: '0.5rem',
                                    color: qResult.correct ? '#4CAF50' : '#F44336',
                                    fontWeight: 'bold'
                                }}
                            >
                                {qResult.correct ? 'Верно' : 'Неверно'}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                    onClick={() => navigate('/tests')}
                    style={{
                        backgroundColor: '#2196F3',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    К списку тестов
                </button>

                <button
                    onClick={() => window.print()}
                    style={{
                        backgroundColor: '#9E9E9E',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    Распечатать результат
                </button>
            </div>
        </div>
    );
};

export default TestResult;
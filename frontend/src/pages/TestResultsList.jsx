import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import TestService from '../services/TestService';

const TestResultsList = () => {
    const { testId } = useParams();
    const { user } = useContext(AuthContext);

    const [results, setResults] = useState([]);
    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Для учителей и админов - получаем результаты по конкретному тесту
                if (testId && (user.role === 'TEACHER' || user.role === 'ADMIN')) {
                    const [testResponse, resultsResponse] = await Promise.all([
                        TestService.getTestById(testId),
                        TestService.getTestResults(testId)
                    ]);

                    setTest(testResponse.data);
                    setResults(resultsResponse.data);
                }
                // Для студентов - получаем все их результаты
                else if (user.role === 'STUDENT') {
                    const response = await TestService.getStudentResults();
                    setResults(response.data);
                }
            } catch (err) {
                setError("Ошибка при загрузке результатов: " + (err.response?.data?.message || err.message));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [testId, user.role]);

    // Расчет процента правильных ответов
    const calculatePercentage = (correctAnswers, totalQuestions) => {
        if (totalQuestions === 0) return 0;
        return Math.round((correctAnswers / totalQuestions) * 100);
    };

    // Определение статуса прохождения
    const getStatusClass = (percentage) => {
        if (percentage >= 80) return { color: '#4CAF50', text: 'Отлично' };
        if (percentage >= 60) return { color: '#2196F3', text: 'Хорошо' };
        if (percentage >= 40) return { color: '#FF9800', text: 'Удовлетворительно' };
        return { color: '#F44336', text: 'Неудовлетворительно' };
    };

    if (loading) return <div>Загрузка результатов...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div>
            <h2>
                {testId && test
                    ? `Результаты теста "${test.title}"`
                    : 'Мои результаты тестирования'}
            </h2>

            {results.length === 0 ? (
                <p>Нет доступных результатов.</p>
            ) : (
                <div>
                    <table style={{
                        width: '100%',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                        borderCollapse: 'collapse',
                        marginTop: '1.5rem'
                    }}>
                        <thead>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>
                                {user.role === 'STUDENT' ? 'Тест' : 'Студент'}
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>
                                Дата
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                                Результат
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                                Статус
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                                Действия
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {results.map((result) => {
                            const percentage = calculatePercentage(result.correctAnswers, result.totalQuestions);
                            const status = getStatusClass(percentage);

                            return (
                                <tr key={result.id}>
                                    <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                                        {user.role === 'STUDENT'
                                            ? result.testTitle
                                            : result.studentName}
                                    </td>
                                    <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                                        {new Date(result.completedAt).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                                        {result.correctAnswers} / {result.totalQuestions} ({percentage}%)
                                    </td>
                                    <td style={{
                                        padding: '1rem',
                                        textAlign: 'center',
                                        borderBottom: '1px solid #eee',
                                        color: status.color,
                                        fontWeight: 'bold'
                                    }}>
                                        {status.text}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                                        <Link
                                            to={`/tests/result/${result.id}`}
                                            style={{
                                                backgroundColor: '#2196F3',
                                                color: 'white',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '4px',
                                                textDecoration: 'none'
                                            }}
                                        >
                                            Подробнее
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>

                    {user.role === 'TEACHER' && test && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <h3>Статистика по тесту</h3>

                            <div style={{
                                backgroundColor: 'white',
                                padding: '1.5rem',
                                borderRadius: '8px',
                                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '1.5rem',
                                marginTop: '1rem'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2196F3' }}>
                                        {results.length}
                                    </div>
                                    <div>Всего прохождений</div>
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4CAF50' }}>
                                        {Math.round(results.reduce((sum, item) =>
                                                sum + calculatePercentage(item.correctAnswers, item.totalQuestions), 0) /
                                            (results.length || 1))}%
                                    </div>
                                    <div>Средний результат</div>
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FF9800' }}>
                                        {results.filter(r =>
                                            calculatePercentage(r.correctAnswers, r.totalQuestions) >= 60).length}
                                    </div>
                                    <div>Успешных прохождений</div>
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#F44336' }}>
                                        {results.filter(r =>
                                            calculatePercentage(r.correctAnswers, r.totalQuestions) < 60).length}
                                    </div>
                                    <div>Неуспешных прохождений</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div style={{ marginTop: '1.5rem' }}>
                <Link
                    to="/tests"
                    style={{
                        backgroundColor: '#9E9E9E',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        textDecoration: 'none'
                    }}
                >
                    Назад к тестам
                </Link>
            </div>
        </div>
    );
};

export default TestResultsList;
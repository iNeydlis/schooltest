import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TestService from '../services/TestService';

const TestTaking = () => {
    const { testId } = useParams();
    const navigate = useNavigate();

    const [test, setTest] = useState(null);
    const [testResult, setTestResult] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Загрузка теста и начало прохождения
    useEffect(() => {
        const startTestSession = async () => {
            try {
                setLoading(true);

                // Получаем информацию о тесте
                const testResponse = await TestService.getTestById(testId);
                // Проверяем, возвращается ли ответ в поле data или напрямую
                const testData = testResponse.data || testResponse;
                setTest(testData);

                // Начинаем тест
                const startResult = await TestService.startTest(testId);
                // Проверяем, возвращается ли ответ в поле data или напрямую
                const resultData = startResult.data || startResult;
                setTestResult(resultData);

                if (!resultData || !resultData.id) {
                    throw new Error('Не удалось получить данные о результате теста');
                }

                // Загружаем вопросы
                const questionsResponse = await TestService.getTestQuestions(testId, resultData.id);
                // Проверяем, возвращается ли ответ в поле data или напрямую
                const questionsData = questionsResponse.data || questionsResponse;
                setQuestions(questionsData);

                // Инициализируем объект с ответами пользователя
                const initialAnswers = {};
                questionsData.forEach(question => {
                    initialAnswers[question.id] = question.type === 'MULTIPLE_CHOICE' ? [] : null;
                });
                setAnswers(initialAnswers);

                // Устанавливаем время на тест
                if (testData.timeLimit) {
                    setTimeLeft(testData.timeLimit * 60); // Переводим минуты в секунды
                }
            } catch (err) {
                console.error('Error in startTestSession:', err);
                setError("Ошибка при загрузке теста: " + (err.response?.data?.message || err.message));
            } finally {
                setLoading(false);
            }
        };

        startTestSession();
    }, [testId]);

    // Таймер для обратного отсчета
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timer);
                    // Автоматическая отправка теста при истечении времени
                    handleSubmitTest();
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    // Обработчик ответа на вопрос
    const handleAnswerChange = (questionId, answerId, isMultiple = false) => {
        if (isMultiple) {
            // Множественный выбор - добавляем/удаляем ID ответа из массива
            setAnswers(prev => {
                const currentAnswers = [...(prev[questionId] || [])];
                const index = currentAnswers.indexOf(answerId);

                if (index === -1) {
                    currentAnswers.push(answerId);
                } else {
                    currentAnswers.splice(index, 1);
                }

                return {
                    ...prev,
                    [questionId]: currentAnswers
                };
            });
        } else {
            // Единственный выбор - просто сохраняем ID ответа
            setAnswers(prev => ({
                ...prev,
                [questionId]: answerId
            }));
        }
    };

    // Переход к следующему вопросу
    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        }
    };

    // Переход к предыдущему вопросу
    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prevIndex => prevIndex - 1);
        }
    };

    // Отправка ответов на тест
    const handleSubmitTest = async () => {
        try {
            setSubmitting(true);

            // Проверка заполнения всех ответов
            const unansweredQuestions = [];
            questions.forEach((question, index) => {
                const answer = answers[question.id];
                if (answer === null || (Array.isArray(answer) && answer.length === 0)) {
                    unansweredQuestions.push(index + 1);
                }
            });

            if (unansweredQuestions.length > 0 && timeLeft > 0) {
                if (!window.confirm(`Вы не ответили на вопросы: ${unansweredQuestions.join(', ')}. Хотите отправить тест?`)) {
                    setSubmitting(false);
                    return;
                }
            }

            // Формируем данные для отправки
            const submissionData = {
                testResultId: testResult.id,
                answers: Object.entries(answers).map(([questionId, answer]) => ({
                    questionId: parseInt(questionId),
                    selectedAnswerIds: Array.isArray(answer) ? answer : [answer].filter(id => id !== null)
                }))
            };

            // Отправляем ответы
            const result = await TestService.submitTest(submissionData);
            // Проверяем, возвращается ли ответ в поле data или напрямую
            const resultData = result.data || result;

            // Переходим на страницу с результатом
            navigate(`/tests/result/${resultData.id}`, { state: { result: resultData } });

        } catch (err) {
            console.error('Error submitting test:', err);
            setError("Ошибка при отправке ответов: " + (err.response?.data?.message || err.message));
            setSubmitting(false);
        }
    };

    if (loading) return <div>Загрузка теста...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!test || !questions.length) return <div>Тест не найден или не содержит вопросов</div>;

    const currentQuestion = questions[currentQuestionIndex];

    // Форматирование оставшегося времени
    const formatTimeLeft = () => {
        if (timeLeft === null) return '';

        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;

        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div>
            <h2>{test.title}</h2>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'white',
                padding: '1rem',
                borderRadius: '8px',
                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                marginBottom: '1.5rem'
            }}>
                <div>
                    <strong>Предмет:</strong> {test.subject}
                </div>
                {timeLeft !== null && (
                    <div style={{
                        fontWeight: 'bold',
                        color: timeLeft < 60 ? 'red' : 'inherit'
                    }}>
                        Оставшееся время: {formatTimeLeft()}
                    </div>
                )}
                <div>
                    <strong>Вопрос:</strong> {currentQuestionIndex + 1} из {questions.length}
                </div>
            </div>

            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                marginBottom: '1.5rem'
            }}>
                <h3>{currentQuestion.text}</h3>

                <div style={{ marginTop: '1.5rem' }}>
                    {currentQuestion.answers.map(answer => (
                        <div key={answer.id} style={{ marginBottom: '0.75rem' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0.75rem',
                                backgroundColor: '#f9f9f9',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type={currentQuestion.type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                                    name={`question-${currentQuestion.id}`}
                                    checked={
                                        currentQuestion.type === 'MULTIPLE_CHOICE'
                                            ? (answers[currentQuestion.id] || []).includes(answer.id)
                                            : answers[currentQuestion.id] === answer.id
                                    }
                                    onChange={() => handleAnswerChange(
                                        currentQuestion.id,
                                        answer.id,
                                        currentQuestion.type === 'MULTIPLE_CHOICE'
                                    )}
                                    style={{ marginRight: '1rem' }}
                                />
                                {answer.text}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '1.5rem'
            }}>
                <button
                    onClick={handlePrevQuestion}
                    disabled={currentQuestionIndex === 0}
                    style={{
                        backgroundColor: '#2196F3',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                        opacity: currentQuestionIndex === 0 ? 0.5 : 1
                    }}
                >
                    Предыдущий вопрос
                </button>

                {currentQuestionIndex < questions.length - 1 ? (
                    <button
                        onClick={handleNextQuestion}
                        style={{
                            backgroundColor: '#2196F3',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Следующий вопрос
                    </button>
                ) : (
                    <button
                        onClick={handleSubmitTest}
                        disabled={submitting}
                        style={{
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: submitting ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {submitting ? 'Отправка...' : 'Завершить тест'}
                    </button>
                )}
            </div>

            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '1.5rem'
            }}>
                {questions.map((question, index) => (
                    <button
                        key={question.id}
                        onClick={() => setCurrentQuestionIndex(index)}
                        style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor:
                                currentQuestionIndex === index
                                    ? '#2196F3'
                                    : (answers[question.id] === null ||
                                        (Array.isArray(answers[question.id]) && answers[question.id].length === 0))
                                        ? '#F44336'
                                        : '#4CAF50',
                            color: 'white',
                            borderRadius: '50%',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                    onClick={handleSubmitTest}
                    disabled={submitting}
                    style={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: submitting ? 'not-allowed' : 'pointer'
                    }}
                >
                    {submitting ? 'Отправка...' : 'Завершить тест'}
                </button>
            </div>
        </div>
    );
};

export default TestTaking;
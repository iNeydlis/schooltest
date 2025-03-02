import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TestService from '../services/TestService';

const TestForm = () => {
    const { testId } = useParams();
    const navigate = useNavigate();
    const isEditing = !!testId;

    const [formData, setFormData] = useState({
        title: '',
        subject: '',
        description: '',
        timeLimit: 60,
        questions: []
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isEditing) {
            const fetchTest = async () => {
                try {
                    setLoading(true);
                    const response = await TestService.getTestById(testId, true);
                    setFormData({
                        title: response.data.title,
                        subject: response.data.subject,
                        description: response.data.description || '',
                        timeLimit: response.data.timeLimit || 60,
                        questions: response.data.questions || []
                    });
                } catch (err) {
                    setError("Ошибка при загрузке теста: " + (err.response?.data?.message || err.message));
                } finally {
                    setLoading(false);
                }
            };

            fetchTest();
        }
    }, [testId, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleQuestionChange = (index, field, value) => {
        const updatedQuestions = [...formData.questions];
        updatedQuestions[index] = {
            ...updatedQuestions[index],
            [field]: value
        };
        setFormData(prev => ({
            ...prev,
            questions: updatedQuestions
        }));
    };

    const handleAnswerChange = (questionIndex, answerIndex, field, value) => {
        const updatedQuestions = [...formData.questions];
        updatedQuestions[questionIndex].answers[answerIndex] = {
            ...updatedQuestions[questionIndex].answers[answerIndex],
            [field]: value
        };
        setFormData(prev => ({
            ...prev,
            questions: updatedQuestions
        }));
    };

    const addQuestion = () => {
        setFormData(prev => ({
            ...prev,
            questions: [
                ...prev.questions,
                {
                    text: '',
                    type: 'SINGLE_CHOICE',
                    answers: [
                        { text: '', correct: true },
                        { text: '', correct: false }
                    ]
                }
            ]
        }));
    };

    const removeQuestion = (index) => {
        const updatedQuestions = [...formData.questions];
        updatedQuestions.splice(index, 1);
        setFormData(prev => ({
            ...prev,
            questions: updatedQuestions
        }));
    };

    const addAnswer = (questionIndex) => {
        const updatedQuestions = [...formData.questions];
        updatedQuestions[questionIndex].answers.push({
            text: '',
            correct: false
        });
        setFormData(prev => ({
            ...prev,
            questions: updatedQuestions
        }));
    };

    const removeAnswer = (questionIndex, answerIndex) => {
        const updatedQuestions = [...formData.questions];
        updatedQuestions[questionIndex].answers.splice(answerIndex, 1);
        setFormData(prev => ({
            ...prev,
            questions: updatedQuestions
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError(null);

            // Проверка валидности формы
            if (!formData.title.trim()) {
                throw new Error('Название теста обязательно');
            }

            if (!formData.subject.trim()) {
                throw new Error('Предмет обязателен');
            }

            if (formData.questions.length === 0) {
                throw new Error('Тест должен содержать хотя бы один вопрос');
            }

            for (const [qIndex, question] of formData.questions.entries()) {
                if (!question.text.trim()) {
                    throw new Error(`Вопрос #${qIndex + 1} не содержит текста`);
                }

                if (question.answers.length < 2) {
                    throw new Error(`Вопрос #${qIndex + 1} должен содержать хотя бы два варианта ответа`);
                }

                const hasCorrectAnswer = question.answers.some(answer => answer.correct);
                if (!hasCorrectAnswer) {
                    throw new Error(`Вопрос #${qIndex + 1} должен иметь хотя бы один правильный ответ`);
                }

                for (const [aIndex, answer] of question.answers.entries()) {
                    if (!answer.text.trim()) {
                        throw new Error(`Ответ #${aIndex + 1} на вопрос #${qIndex + 1} не содержит текста`);
                    }
                }
            }

            const testCreateRequest = {
                title: formData.title,
                subject: formData.subject,
                description: formData.description,
                timeLimit: parseInt(formData.timeLimit),
                questions: formData.questions.map(q => ({
                    text: q.text,
                    type: q.type,
                    answers: q.answers.map(a => ({
                        text: a.text,
                        correct: a.correct
                    }))
                }))
            };

            if (isEditing) {
                await TestService.updateTest(testId, testCreateRequest);
            } else {
                await TestService.createTest(testCreateRequest);
            }

            navigate('/tests');
        } catch (err) {
            setError(err.message || "Произошла ошибка при сохранении теста");
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditing) return <div>Загрузка теста...</div>;

    return (
        <div>
            <h2>{isEditing ? 'Редактирование теста' : 'Создание нового теста'}</h2>

            {error && (
                <div style={{
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    marginBottom: '1rem'
                }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '8px',
                    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                    marginBottom: '1.5rem'
                }}>
                    <div className="form-group">
                        <label htmlFor="title">Название теста *</label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="subject">Предмет *</label>
                        <input
                            id="subject"
                            name="subject"
                            type="text"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Описание</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="timeLimit">Ограничение по времени (минуты)</label>
                        <input
                            id="timeLimit"
                            name="timeLimit"
                            type="number"
                            min="1"
                            value={formData.timeLimit}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div>
                    <h3>Вопросы</h3>

                    {formData.questions.map((question, qIndex) => (
                        <div
                            key={qIndex}
                            style={{
                                backgroundColor: 'white',
                                padding: '1.5rem',
                                borderRadius: '8px',
                                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                                marginBottom: '1.5rem'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4>Вопрос #{qIndex + 1}</h4>
                                <button
                                    type="button"
                                    onClick={() => removeQuestion(qIndex)}
                                    style={{
                                        backgroundColor: '#F44336',
                                        color: 'white',
                                        padding: '0.5rem',
                                        borderRadius: '4px',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Удалить вопрос
                                </button>
                            </div>

                            <div className="form-group">
                                <label htmlFor={`question-${qIndex}`}>Текст вопроса *</label>
                                <textarea
                                    id={`question-${qIndex}`}
                                    value={question.text}
                                    onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                                    rows="2"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor={`question-type-${qIndex}`}>Тип вопроса</label>
                                <select
                                    id={`question-type-${qIndex}`}
                                    value={question.type}
                                    onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
                                >
                                    <option value="SINGLE_CHOICE">Один вариант ответа</option>
                                    <option value="MULTIPLE_CHOICE">Несколько вариантов ответа</option>
                                </select>
                            </div>

                            <div style={{ marginTop: '1rem' }}>
                                <h5>Варианты ответов</h5>

                                {question.answers.map((answer, aIndex) => (
                                    <div
                                        key={aIndex}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            marginBottom: '0.5rem',
                                            padding: '0.5rem',
                                            backgroundColor: '#f9f9f9',
                                            borderRadius: '4px'
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <input
                                                type="text"
                                                value={answer.text}
                                                onChange={(e) => handleAnswerChange(qIndex, aIndex, 'text', e.target.value)}
                                                placeholder="Текст ответа"
                                                required
                                                style={{ width: '100%' }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '1rem' }}>
                                            <label style={{ marginRight: '0.5rem' }}>
                                                <input
                                                    type={question.type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                                                    name={`correct-answer-${qIndex}`}
                                                    checked={answer.correct}
                                                    onChange={(e) => {
                                                        if (question.type === 'SINGLE_CHOICE') {
                                                            // Для радиокнопок сначала сбрасываем все на false
                                                            const updatedQuestions = [...formData.questions];
                                                            updatedQuestions[qIndex].answers.forEach((a, i) => {
                                                                a.correct = false;
                                                            });
                                                            updatedQuestions[qIndex].answers[aIndex].correct = true;
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                questions: updatedQuestions
                                                            }));
                                                        } else {
                                                            // Для чекбоксов просто меняем значение
                                                            handleAnswerChange(qIndex, aIndex, 'correct', e.target.checked);
                                                        }
                                                    }}
                                                />
                                                Правильный
                                            </label>

                                            <button
                                                type="button"
                                                onClick={() => removeAnswer(qIndex, aIndex)}
                                                style={{
                                                    backgroundColor: '#F44336',
                                                    color: 'white',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem'
                                                }}
                                                disabled={question.answers.length <= 2}
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => addAnswer(qIndex)}
                                    style={{
                                        backgroundColor: '#2196F3',
                                        color: 'white',
                                        padding: '0.5rem',
                                        borderRadius: '4px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        marginTop: '0.5rem'
                                    }}
                                >
                                    Добавить вариант ответа
                                </button>
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addQuestion}
                        style={{
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            marginBottom: '1.5rem'
                        }}
                    >
                        Добавить вопрос
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button
                        type="button"
                        onClick={() => navigate('/tests')}
                        style={{
                            backgroundColor: '#9E9E9E',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Отмена
                    </button>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        {loading ? 'Сохранение...' : (isEditing ? 'Обновить тест' : 'Создать тест')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TestForm;
import api from './api';

class TestService {
    // Получение списка всех тестов
    async getAllTests() {
        return api.get('/tests');
    }

    // Получение конкретного теста по ID
    async getTestById(testId, includeAnswers = false) {
        return api.get(`/tests/${testId}?includeAnswers=${includeAnswers}`);
    }

    // Создание нового теста
    async createTest(testData) {
        return api.post('/tests', testData);
    }

    // Обновление существующего теста
    async updateTest(testId, testData) {
        return api.put(`/tests/${testId}`, testData);
    }

    // Удаление теста
    async deleteTest(testId) {
        return api.delete(`/tests/${testId}`);
    }

    // Начать прохождение теста (для студентов)
    async startTest(testId) {
        return api.post(`/tests/${testId}/start`);
    }

    // Получить вопросы для теста
    async getTestQuestions(testId, testResultId) {
        return api.get(`/tests/${testId}/questions?testResultId=${testResultId}`);
    }

    // Отправка ответов на тест
    async submitTest(submissionData) {
        return api.post('/tests/submit', submissionData);
    }

    // Получение результатов студента
    async getStudentResults() {
        return api.get('/tests/results');
    }

    // Получение результатов для конкретного теста (для учителей)
    async getTestResults(testId) {
        return api.get(`/tests/${testId}/results`);
    }
}

export default new TestService();
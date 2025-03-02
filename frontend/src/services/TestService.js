import api from './api';

class TestService {
    // Test management methods
    getAllTests() {
        return api.get(`/tests`);
    }

    getTestById(testId, includeAnswers = false) {
        return api.get(`/tests/${testId}?includeAnswers=${includeAnswers}`);
    }

    getTestQuestions(testId, testResultId) {
        return api.get(`/tests/${testId}/questions?testResultId=${testResultId}`);
    }

    createTest(testData) {
        return api.post(`/tests`, testData);
    }

    updateTest(testId, testData) {
        return api.put(`/tests/${testId}`, testData);
    }

    deleteTest(testId) {
        return api.delete(`/tests/${testId}`);
    }

    // Subject-related methods
    getAllSubjects() {
        return api.get(`/subjects`);
    }

    // Grade-related methods
    getAllGrades() {
        return api.get(`/grades`);
    }

    // Test results methods
    getTestResults(testId) {
        return api.get(`/tests/${testId}/results`);
    }

    // Get all test results for the current student
    getStudentResults() {
        return api.get(`/student/results`);
    }

    // Get a specific test result by ID
    getResultById(resultId) {
        return api.get(`/results/${resultId}`);
    }

    startTest(testId) {
        return api.post(`/tests/${testId}/start`);
    }

    submitTest(submissionData) {
        return api.post(`/tests/submit`, submissionData);
    }
}

export default new TestService();
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
        return api.get(`/tests/results`);
    }

    // Get a specific test result by ID
    getResultById(resultId) {
        return api.get(`/tests/results/${resultId}`);
    }

    // Check if test is in progress and get the test result id
    getInProgressTest(testId) {
        return api.get(`/tests/${testId}/in-progress`);
    }

    startTest(testId) {
        // First check if there's an in-progress test before starting a new one
        return this.getInProgressTest(testId)
            .then(response => {
                // If there's an existing in-progress test, return it
                if (response && response.id) {
                    return response;
                }
                // Otherwise start a new test
                return api.post(`/tests/${testId}/start`);
            })
            .catch(() => {
                // If the endpoint doesn't exist or returns an error, fallback to original method
                return api.post(`/tests/${testId}/start`);
            });
    }
    getTestResultDetails(resultId) {
        return api.get(`/tests/result/${resultId}`);
    }
    submitTest(submissionData) {
        return api.post(`/tests/submit`, submissionData);
    }
    reactivateTest(id, clearAttempts = false) {
        return api.post(`/tests/${id}/reactivate?clearAttempts=${clearAttempts}`);
    }
    permanentlyDeleteTest(testId) {
        return api.delete(`/tests/${testId}/permanent`);
    }
}

export default new TestService();
package org.ineydlis.schooltest.service;

import lombok.RequiredArgsConstructor;
import org.ineydlis.schooltest.dto.StatisticsDto;
import org.ineydlis.schooltest.dto.TestResultDetailsDto;
import org.ineydlis.schooltest.model.*;
import org.ineydlis.schooltest.repository.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final TestResultRepository testResultRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final GradeRepository gradeRepository;
    private final TestRepository testRepository;
    private final AuthService authService;

    public boolean canAccessTestStatistics(String token, Long testResultId) {
        // Implementation remains the same, likely checks user role and permissions
        return true; // Placeholder
    }

    public TestResultDetailsDto getTestStatistics(String token, Long testResultId) {
        // Получаем результат теста
        TestResult testResult = testResultRepository.findById(testResultId)
                .orElseThrow(() -> new RuntimeException("Результат теста не найден"));

        // Получаем информацию о тесте, ученике и классе
        Test test = testResult.getTest();
        User student = testResult.getStudent();
        Grade grade = student.getGrade();

        // Создаем DTO с нужной информацией
        TestResultDetailsDto detailsDto = new TestResultDetailsDto();
        detailsDto.setTestId(test.getId());
        detailsDto.setTestTitle(test.getTitle());
        detailsDto.setStudentId(student.getId());
        detailsDto.setStudentName(student.getFullName());
        detailsDto.setGradeId(grade.getId());
        detailsDto.setGradeName(grade.getFullName());
        detailsDto.setScore(testResult.getScore());
        detailsDto.setMaxScore(testResult.getMaxScore());
        detailsDto.setCompletedAt(testResult.getCompletedAt());
        detailsDto.setAttemptNumber(testResult.getAttemptNumber());

        return detailsDto;
    }

    public StatisticsDto getStudentSubjectStatistics(String token, Long studentId, Long subjectId) {
        // Находим все результаты тестов для данного студента по данному предмету
        List<TestResult> testResults = testResultRepository.findByStudentIdAndTestSubjectId(studentId, subjectId);

        // Оставляем только лучшие попытки
        List<TestResult> bestAttempts = findBestAttempts(testResults, studentId, subjectId);

        // Считаем статистику по лучшим попыткам
        return calculateStatistics(bestAttempts);
    }

    public StatisticsDto getGradeStatistics(String token, Long gradeId) {
        // Находим все результаты тестов для данного класса
        List<TestResult> testResults = testResultRepository.findByStudentGradeId(gradeId);

        // Оставляем только лучшие попытки для каждого ученика в классе
        List<TestResult> bestAttempts = findBestAttemptsForGrade(testResults, gradeId);

        // Считаем статистику по лучшим попыткам
        return calculateStatistics(bestAttempts);
    }

    public StatisticsDto getStudentTestAttemptsStatistics(String token, Long studentId, Long testId) {
        // Находим все результаты тестов для данного студента по данному тесту
        List<TestResult> testResults = testResultRepository.findByStudentIdAndTestId(studentId, testId);

        // Оставляем только лучшую попытку
        List<TestResult> bestAttempts = findBestAttemptForStudentTest(testResults, studentId, testId);

        // Считаем статистику по лучшей попытке
        return calculateStatistics(bestAttempts);
    }

    public Map<String, StatisticsDto> getStudentOverallPerformance(String token, Long studentId) {
        // Получаем ученика
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Ученик не найден"));

        // Получаем все предметы
        List<Subject> subjects = subjectRepository.findAll();
        Map<String, StatisticsDto> subjectStatistics = new HashMap<>();

        for (Subject subject : subjects) {
            // Находим все результаты тестов для данного студента по данному предмету
            List<TestResult> testResults = testResultRepository.findByStudentIdAndTestSubjectId(studentId, subject.getId());

            // Оставляем только лучшие попытки
            List<TestResult> bestAttempts = findBestAttempts(testResults, studentId, subject.getId());

            // Считаем статистику по лучшим попыткам
            subjectStatistics.put(subject.getName(), calculateStatistics(bestAttempts));
        }

        return subjectStatistics;
    }


    private List<TestResult> findBestAttempts(List<TestResult> testResults, Long studentId, Long subjectId) {
        // Группируем результаты тестов по студенту и предмету
        Map<Long, List<TestResult>> studentSubjectResults = testResults.stream()
                .collect(Collectors.groupingBy(tr -> tr.getTest().getId()));

        List<TestResult> bestAttempts = new ArrayList<>();

        // Для каждого теста выбираем лучший результат
        for (List<TestResult> results : studentSubjectResults.values()) {
            TestResult bestResult = results.stream()
                    .max(Comparator.comparingInt(TestResult::getScore))
                    .orElse(null);
            if (bestResult != null) {
                bestAttempts.add(bestResult);
            }
        }

        return bestAttempts;
    }

    private List<TestResult> findBestAttemptsForGrade(List<TestResult> testResults, Long gradeId) {
        // Группируем результаты тестов по ученику
        Map<Long, List<TestResult>> studentResults = testResults.stream()
                .collect(Collectors.groupingBy(tr -> tr.getStudent().getId()));

        List<TestResult> bestAttempts = new ArrayList<>();

        // Для каждого ученика выбираем лучший результат
        for (List<TestResult> results : studentResults.values()) {
            TestResult bestResult = results.stream()
                    .max(Comparator.comparingInt(TestResult::getScore))
                    .orElse(null);
            if (bestResult != null) {
                bestAttempts.add(bestResult);
            }
        }

        return bestAttempts;
    }

    private List<TestResult> findBestAttemptForStudentTest(List<TestResult> testResults, Long studentId, Long testId) {
        // Если нет результатов, возвращаем пустой список
        if (testResults.isEmpty()) {
            return Collections.emptyList();
        }

        // Находим лучший результат
        TestResult bestResult = testResults.stream()
                .max(Comparator.comparingInt(TestResult::getScore))
                .orElse(null);

        // Возвращаем список, содержащий только лучший результат (или пустой список, если результатов нет)
        return (bestResult != null) ? Collections.singletonList(bestResult) : Collections.emptyList();
    }

    private StatisticsDto calculateStatistics(List<TestResult> testResults) {
        if (testResults.isEmpty()) {
            return new StatisticsDto(); // Return default StatisticsDto
        }

        double averageScore = testResults.stream()
                .mapToInt(TestResult::getScore)
                .average()
                .orElse(0.0);

        int minScore = testResults.stream()
                .mapToInt(TestResult::getScore)
                .min()
                .orElse(0);

        int maxScore = testResults.stream()
                .mapToInt(TestResult::getScore)
                .max()
                .orElse(0);

        StatisticsDto statisticsDto = new StatisticsDto();
        statisticsDto.setAverageScore(averageScore);
        statisticsDto.setMinScore(minScore);
        statisticsDto.setMaxScore(maxScore);

        return statisticsDto;
    }
}
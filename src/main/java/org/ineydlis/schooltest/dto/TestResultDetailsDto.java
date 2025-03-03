package org.ineydlis.schooltest.dto;

import org.ineydlis.schooltest.model.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

public class TestResultDetailsDto {
    private Long id;
    private Long testId;
    private String testTitle;
    private Long studentId;
    private String studentName;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private boolean completed;
    private int score;
    private int maxScore;
    private int attemptNumber;
    private List<StudentAnswerDto> studentAnswers = new ArrayList<>();

    // Дополнительная информация для статистики
    private int correctAnswersCount;
    private int totalQuestionsCount;
    private double percentageCorrect;

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTestId() {
        return testId;
    }

    public void setTestId(Long testId) {
        this.testId = testId;
    }

    public String getTestTitle() {
        return testTitle;
    }

    public void setTestTitle(String testTitle) {
        this.testTitle = testTitle;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public int getMaxScore() {
        return maxScore;
    }

    public void setMaxScore(int maxScore) {
        this.maxScore = maxScore;
    }

    public int getAttemptNumber() {
        return attemptNumber;
    }

    public void setAttemptNumber(int attemptNumber) {
        this.attemptNumber = attemptNumber;
    }

    public List<StudentAnswerDto> getStudentAnswers() {
        return studentAnswers;
    }

    public void setStudentAnswers(List<StudentAnswerDto> studentAnswers) {
        this.studentAnswers = studentAnswers;
    }

    public int getCorrectAnswersCount() {
        return correctAnswersCount;
    }

    public void setCorrectAnswersCount(int correctAnswersCount) {
        this.correctAnswersCount = correctAnswersCount;
    }

    public int getTotalQuestionsCount() {
        return totalQuestionsCount;
    }

    public void setTotalQuestionsCount(int totalQuestionsCount) {
        this.totalQuestionsCount = totalQuestionsCount;
    }

    public double getPercentageCorrect() {
        return percentageCorrect;
    }

    public void setPercentageCorrect(double percentageCorrect) {
        this.percentageCorrect = percentageCorrect;
    }

    // Factory method to create from entity
    public static TestResultDetailsDto fromEntity(TestResult testResult) {
        TestResultDetailsDto dto = new TestResultDetailsDto();

        dto.setId(testResult.getId());
        dto.setTestId(testResult.getTest().getId());
        dto.setTestTitle(testResult.getTest().getTitle());
        dto.setStudentId(testResult.getStudent().getId());
        dto.setStudentName(testResult.getStudent().getFullName());
        dto.setStartedAt(testResult.getStartedAt());
        dto.setCompletedAt(testResult.getCompletedAt());
        dto.setCompleted(testResult.isCompleted());
        dto.setScore(testResult.getScore());
        dto.setMaxScore(testResult.getMaxScore());
        dto.setAttemptNumber(testResult.getAttemptNumber());

        // Преобразуем студенческие ответы
        List<StudentAnswerDto> answerDtos = testResult.getStudentAnswers().stream()
                .map(StudentAnswerDto::fromEntity)
                .collect(Collectors.toList());
        dto.setStudentAnswers(answerDtos);

        // Рассчитываем статистику
        int correctCount = (int) testResult.getStudentAnswers().stream()
                .filter(StudentAnswer::isCorrect)
                .count();
        dto.setCorrectAnswersCount(correctCount);
        dto.setTotalQuestionsCount(testResult.getStudentAnswers().size());

        if (dto.getTotalQuestionsCount() > 0) {
            dto.setPercentageCorrect(Math.round(((double) correctCount / dto.getTotalQuestionsCount()) * 100 * 100.0) / 100.0);
        }

        return dto;
    }
}
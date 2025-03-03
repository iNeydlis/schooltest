package org.ineydlis.schooltest.dto;

import org.ineydlis.schooltest.model.*;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

public class StudentAnswerDto {
    private Long id;
    private Long questionId;
    private String questionText;
    private QuestionType questionType;
    private String textAnswer;
    private Set<AnswerDto> selectedAnswers = new HashSet<>();
    private Set<AnswerDto> correctAnswers = new HashSet<>();
    private boolean correct;
    private int earnedPoints;
    private int maxPoints;

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public QuestionType getQuestionType() {
        return questionType;
    }

    public void setQuestionType(QuestionType questionType) {
        this.questionType = questionType;
    }

    public String getTextAnswer() {
        return textAnswer;
    }

    public void setTextAnswer(String textAnswer) {
        this.textAnswer = textAnswer;
    }

    public Set<AnswerDto> getSelectedAnswers() {
        return selectedAnswers;
    }

    public void setSelectedAnswers(Set<AnswerDto> selectedAnswers) {
        this.selectedAnswers = selectedAnswers;
    }

    public Set<AnswerDto> getCorrectAnswers() {
        return correctAnswers;
    }

    public void setCorrectAnswers(Set<AnswerDto> correctAnswers) {
        this.correctAnswers = correctAnswers;
    }

    public boolean isCorrect() {
        return correct;
    }

    public void setCorrect(boolean correct) {
        this.correct = correct;
    }

    public int getEarnedPoints() {
        return earnedPoints;
    }

    public void setEarnedPoints(int earnedPoints) {
        this.earnedPoints = earnedPoints;
    }

    public int getMaxPoints() {
        return maxPoints;
    }

    public void setMaxPoints(int maxPoints) {
        this.maxPoints = maxPoints;
    }

    // Factory method to create from entity
    public static StudentAnswerDto fromEntity(StudentAnswer studentAnswer) {
        StudentAnswerDto dto = new StudentAnswerDto();

        dto.setId(studentAnswer.getId());
        dto.setQuestionId(studentAnswer.getQuestion().getId());
        dto.setQuestionText(studentAnswer.getQuestion().getText());
        dto.setQuestionType(studentAnswer.getQuestion().getType());
        dto.setTextAnswer(studentAnswer.getTextAnswer());
        dto.setCorrect(studentAnswer.isCorrect());
        dto.setEarnedPoints(studentAnswer.getEarnedPoints());
        dto.setMaxPoints(studentAnswer.getQuestion().getPoints());

        // Устанавливаем выбранные ответы
        if (studentAnswer.getSelectedAnswers() != null) {
            Set<AnswerDto> selectedAnswerDtos = studentAnswer.getSelectedAnswers().stream()
                    .map(answer -> {
                        AnswerDto answerDto = new AnswerDto();
                        answerDto.setId(answer.getId());
                        answerDto.setText(answer.getText());
                        answerDto.setIsCorrect(answer.isCorrect());
                        return answerDto;
                    })
                    .collect(Collectors.toSet());
            dto.setSelectedAnswers(selectedAnswerDtos);
        }

        // Устанавливаем правильные ответы
        Set<AnswerDto> correctAnswerDtos = studentAnswer.getQuestion().getAnswers().stream()
                .filter(Answer::isCorrect)
                .map(answer -> {
                    AnswerDto answerDto = new AnswerDto();
                    answerDto.setId(answer.getId());
                    answerDto.setText(answer.getText());
                    answerDto.setIsCorrect(true);
                    return answerDto;
                })
                .collect(Collectors.toSet());
        dto.setCorrectAnswers(correctAnswerDtos);

        return dto;
    }
}
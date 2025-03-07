package org.ineydlis.schooltest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.ineydlis.schooltest.model.Question;
import org.ineydlis.schooltest.model.QuestionType;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionDto {
    private Long id;
    private String text;
    private QuestionType type;
    private Integer points;
    private List<AnswerDto> answers;

    public static QuestionDto fromEntity(Question question, boolean includeCorrectAnswers) {
        // Для вопросов типа TEXT_ANSWER не передаем никаких ответов
        List<AnswerDto> processedAnswers;
        if (question.getType() == QuestionType.TEXT_ANSWER) {
            processedAnswers = Collections.emptyList();
        } else {
            processedAnswers = question.getAnswers().stream()
                    .map(answer -> AnswerDto.fromEntity(answer, includeCorrectAnswers))
                    .collect(Collectors.toList());
        }

        return QuestionDto.builder()
                .id(question.getId())
                .text(question.getText())
                .type(question.getType())
                .points(question.getPoints())
                .answers(processedAnswers)
                .build();
    }
}
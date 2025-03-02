package org.ineydlis.schooltest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.ineydlis.schooltest.model.Question;
import org.ineydlis.schooltest.model.QuestionType;

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
        return QuestionDto.builder()
                .id(question.getId())
                .text(question.getText())
                .type(question.getType())
                .points(question.getPoints())
                .answers(question.getAnswers().stream()
                        .map(answer -> AnswerDto.fromEntity(answer, includeCorrectAnswers))
                        .collect(Collectors.toList()))
                .build();
    }
}

package org.ineydlis.schooltest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.ineydlis.schooltest.model.TestResult;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestResultDto {
    private Long id;
    private Long testId;
    private String testTitle;
    private String studentName;
    private Long studentId;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private boolean completed;
    private Integer score;
    private Integer maxScore;
    private String grade; // If needed

    public static TestResultDto fromEntity(TestResult result) {
        return TestResultDto.builder()
                .id(result.getId())
                .testId(result.getTest().getId())
                .testTitle(result.getTest().getTitle())
                .studentName(result.getStudent().getFullName())
                .studentId(result.getStudent().getId())
                .startedAt(result.getStartedAt())
                .completedAt(result.getCompletedAt())
                .completed(result.isCompleted())
                .score(result.getScore())
                .maxScore(result.getMaxScore())
                .grade(result.getStudent().getGrade() != null ?
                        result.getStudent().getGrade().getFullName() : null)
                .build();
    }
}

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
    // Existing fields
    private Long id;
    private Long testId;
    private String testTitle;
    private Long studentId;
    private String studentName;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private boolean completed;
    private Integer score;
    private Integer maxScore;
    private Integer attemptNumber;
    private String message; // Added message field

    public static TestResultDto fromEntity(TestResult result) {
        return TestResultDto.builder()
                .id(result.getId())
                .testId(result.getTest().getId())
                .testTitle(result.getTest().getTitle())
                .studentId(result.getStudent().getId())
                .studentName(result.getStudent().getFullName())
                .startedAt(result.getStartedAt())
                .completedAt(result.getCompletedAt())
                .completed(result.isCompleted())
                .score(result.getScore())
                .maxScore(result.getMaxScore())
                .attemptNumber(result.getAttemptNumber()) // Add this to the builder
                .build();
    }
}

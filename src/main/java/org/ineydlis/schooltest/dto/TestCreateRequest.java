package org.ineydlis.schooltest.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestCreateRequest {
    private String title;
    private String description;
    private Long subjectId;
    private Integer timeLimit;
    private Set<Long> gradeIds;
    private List<QuestionDto> questions;
}

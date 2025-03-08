package org.ineydlis.schooltest.controller;

import lombok.RequiredArgsConstructor;
import org.ineydlis.schooltest.dto.StatisticsDto;
import org.ineydlis.schooltest.dto.TestResultDetailsDto;
import org.ineydlis.schooltest.service.StatisticsService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleException(RuntimeException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("message", ex.getMessage());
        body.put("status", 403);
        return ResponseEntity
                .status(403)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body);
    }

    /**
     * Получить статистику по конкретному тесту
     */
    @GetMapping("/test/{testResultId}")
    public ResponseEntity<TestResultDetailsDto> getTestStatistics(
            @RequestHeader("Authorization") String token,
            @PathVariable Long testResultId) {
        return ResponseEntity.ok(statisticsService.getTestStatistics(token, testResultId));
    }

    /**
     * Получить статистику по предмету для конкретного ученика
     */
    @GetMapping("/student/{studentId}/subject/{subjectId}")
    public ResponseEntity<StatisticsDto> getStudentSubjectStatistics(
            @RequestHeader("Authorization") String token,
            @PathVariable Long studentId,
            @PathVariable Long subjectId) {
        return ResponseEntity.ok(statisticsService.getStudentSubjectStatistics(token, studentId, subjectId));
    }

    /**
     * Получить статистику по классу
     */
    @GetMapping("/grade/{gradeId}")
    public ResponseEntity<StatisticsDto> getGradeStatistics(
            @RequestHeader("Authorization") String token,
            @PathVariable Long gradeId) {
        return ResponseEntity.ok(statisticsService.getGradeStatistics(token, gradeId));
    }

    /**
     * Получить статистику по всем попыткам конкретного теста для ученика
     */
    @GetMapping("/student/{studentId}/test/{testId}/attempts")
    public ResponseEntity<StatisticsDto> getStudentTestAttemptsStatistics(
            @RequestHeader("Authorization") String token,
            @PathVariable Long studentId,
            @PathVariable Long testId) {
        return ResponseEntity.ok(statisticsService.getStudentTestAttemptsStatistics(token, studentId, testId));
    }

    /**
     * Получить статистику успеваемости ученика по всем предметам
     */
    @GetMapping("/student/{studentId}/performance")
    public ResponseEntity<Map<String, StatisticsDto>> getStudentOverallPerformance(
            @RequestHeader("Authorization") String token,
            @PathVariable Long studentId) {
        return ResponseEntity.ok(statisticsService.getStudentOverallPerformance(token, studentId));
    }
}
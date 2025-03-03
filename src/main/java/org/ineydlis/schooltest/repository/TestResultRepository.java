package org.ineydlis.schooltest.repository;

import jakarta.persistence.LockModeType;
import org.ineydlis.schooltest.model.Test;
import org.ineydlis.schooltest.model.TestResult;
import org.ineydlis.schooltest.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestResultRepository extends JpaRepository<TestResult, Long> {
    // Add or update these methods in the TestResultRepository interface

    // This gets all incomplete attempts for a test and student
    List<TestResult> findByTestAndStudentAndCompleted(Test test, User student, boolean completed);

    // This gets the single, unique incomplete attempt (if exists) for a test and student
    Optional<TestResult> findByTestAndStudentAndCompletedFalse(Test test, User student);

    // Method to find all results for a given test
    List<TestResult> findByTest(Test test);

    // Method to find all results for a given student
    List<TestResult> findByStudent(User student);

    // Method to find all results for a given test and student
    List<TestResult> findByTestAndStudent(Test test, User student);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT tr FROM TestResult tr WHERE tr.test = :test AND tr.student = :student AND tr.completed = :completed")
    List<TestResult> findByTestAndStudentAndCompletedForUpdate(
            @Param("test") Test test,
            @Param("student") User student,
            @Param("completed") boolean completed);
}

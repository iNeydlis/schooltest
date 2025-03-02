package org.ineydlis.schooltest.repository;

import org.ineydlis.schooltest.model.Test;
import org.ineydlis.schooltest.model.TestResult;
import org.ineydlis.schooltest.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestResultRepository extends JpaRepository<TestResult, Long> {
    List<TestResult> findByStudent(User student);

    List<TestResult> findByTest(Test test);

    Optional<TestResult> findByTestAndStudentAndCompletedFalse(Test test, User student);

    List<TestResult> findByTestAndCompleted(Test test, boolean completed);
}

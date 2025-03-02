// src/main/java/org/ineydlis/schooltest/repository/TestRepository.java
package org.ineydlis.schooltest.repository;

import org.ineydlis.schooltest.model.Grade;
import org.ineydlis.schooltest.model.Subject;
import org.ineydlis.schooltest.model.Test;
import org.ineydlis.schooltest.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestRepository extends JpaRepository<Test, Long> {
    List<Test> findByCreator(User creator);

    List<Test> findBySubjectIn(List<Subject> subjects);

    @Query("SELECT t FROM Test t JOIN t.availableGrades g WHERE g = :grade AND t.isActive = true")
    List<Test> findByAvailableGradesAndActive(@Param("grade") Grade grade);

    List<Test> findByIsActiveTrue();
}



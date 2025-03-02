package org.ineydlis.schooltest.service;

import org.ineydlis.schooltest.dto.*;
import org.ineydlis.schooltest.model.*;
import org.ineydlis.schooltest.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TestService {
    @Autowired
    private TestRepository testRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private GradeRepository gradeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestResultRepository testResultRepository;

    // For teachers: Create a new test
    @Transactional
    public TestDto createTest(TestCreateRequest request, Long creatorId) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        // Verify that the teacher teaches this subject
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Предмет не найден"));

        if (creator.getRole() == UserRole.TEACHER) {
            boolean canTeach = creator.getSubjects().stream()
                    .anyMatch(s -> s.getId().equals(subject.getId()));
            if (!canTeach) {
                throw new RuntimeException("Вы не можете создавать тесты по данному предмету");
            }
        } else if (creator.getRole() != UserRole.ADMIN) {
            throw new RuntimeException("У вас нет прав на создание тестов");
        }

        // Create the test
        Test test = new Test();
        test.setTitle(request.getTitle());
        test.setDescription(request.getDescription());
        test.setSubject(subject);
        test.setCreator(creator);
        test.setCreatedAt(LocalDateTime.now());
        test.setTimeLimit(request.getTimeLimit());

        // Add available grades
        if (request.getGradeIds() != null && !request.getGradeIds().isEmpty()) {
            Set<Grade> grades = request.getGradeIds().stream()
                    .map(id -> gradeRepository.findById(id)
                            .orElseThrow(() -> new RuntimeException("Класс не найден: " + id)))
                    .collect(Collectors.toSet());
            test.setAvailableGrades(grades);
        }

        Test savedTest = testRepository.save(test);

        // Create questions and answers
        if (request.getQuestions() != null) {
            for (QuestionDto questionDto : request.getQuestions()) {
                Question question = new Question();
                question.setText(questionDto.getText());
                question.setType(questionDto.getType());
                question.setPoints(questionDto.getPoints());
                question.setTest(savedTest);

                Question savedQuestion = questionRepository.save(question);

                // Create answers for this question
                if (questionDto.getAnswers() != null) {
                    for (AnswerDto answerDto : questionDto.getAnswers()) {
                        Answer answer = new Answer();
                        answer.setText(answerDto.getText());
                        answer.setCorrect(answerDto.getIsCorrect() != null ? answerDto.getIsCorrect() : false);
                        answer.setQuestion(savedQuestion);
                        savedQuestion.getAnswers().add(answer);
                    }
                }

                questionRepository.save(savedQuestion);
                savedTest.getQuestions().add(savedQuestion);
            }
        }

        // Return the created test
        return TestDto.fromEntity(savedTest);
    }

    // Get all tests (for admins)
    public List<TestDto> getAllTests() {
        return testRepository.findAll().stream()
                .map(TestDto::fromEntity)
                .collect(Collectors.toList());
    }

    // Get tests by teacher
    public List<TestDto> getTestsByTeacher(Long teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        return testRepository.findByCreator(teacher).stream()
                .map(TestDto::fromEntity)
                .collect(Collectors.toList());
    }

    // Get tests available for a student
    public List<TestDto> getTestsForStudent(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        if (student.getRole() != UserRole.STUDENT) {
            throw new RuntimeException("Пользователь не является учеником");
        }

        if (student.getGrade() == null) {
            return Collections.emptyList();
        }

        return testRepository.findByAvailableGradesAndActive(student.getGrade()).stream()
                .map(TestDto::fromEntity)
                .collect(Collectors.toList());
    }

    // Get test details with questions
    public TestDto getTestWithQuestions(Long testId, Long userId, boolean includeAnswers) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Тест не найден"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        // Check permissions
        if (user.getRole() == UserRole.STUDENT) {
            // Students can only view active tests available to their grade
            if (!test.isActive() || !test.getAvailableGrades().contains(user.getGrade())) {
                throw new RuntimeException("У вас нет доступа к этому тесту");
            }
            // Students should never see correct answers before taking the test
            includeAnswers = false;
        } else if (user.getRole() == UserRole.TEACHER) {
            // Teachers can only view their own tests or tests for subjects they teach
            boolean isCreator = test.getCreator().getId().equals(userId);
            boolean teachesSubject = user.getSubjects().stream()
                    .anyMatch(s -> s.getId().equals(test.getSubject().getId()));

            if (!isCreator && !teachesSubject) {
                throw new RuntimeException("У вас нет доступа к этому тесту");
            }
        }

        TestDto testDto = TestDto.fromEntity(test);

        // Add questions
        testDto.setQuestionCount(test.getQuestions().size());

        return testDto;
    }

    // Update a test (for teachers and admins)
    @Transactional
    public TestDto updateTest(Long testId, TestCreateRequest request, Long userId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Тест не найден"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        // Check permissions
        if (user.getRole() == UserRole.TEACHER && !test.getCreator().getId().equals(userId)) {
            throw new RuntimeException("Вы можете редактировать только свои тесты");
        } else if (user.getRole() != UserRole.ADMIN && user.getRole() != UserRole.TEACHER) {
            throw new RuntimeException("У вас нет прав на редактирование тестов");
        }

        // Update test fields
        test.setTitle(request.getTitle());
        test.setDescription(request.getDescription());
        test.setTimeLimit(request.getTimeLimit());
        test.setUpdatedAt(LocalDateTime.now());

        // Update subject if changed and user has permission
        if (!test.getSubject().getId().equals(request.getSubjectId())) {
            Subject subject = subjectRepository.findById(request.getSubjectId())
                    .orElseThrow(() -> new RuntimeException("Предмет не найден"));

            if (user.getRole() == UserRole.TEACHER) {
                boolean canTeach = user.getSubjects().stream()
                        .anyMatch(s -> s.getId().equals(subject.getId()));
                if (!canTeach) {
                    throw new RuntimeException("Вы не можете создавать тесты по данному предмету");
                }
            }

            test.setSubject(subject);
        }

        // Update available grades
        if (request.getGradeIds() != null) {
            Set<Grade> grades = request.getGradeIds().stream()
                    .map(id -> gradeRepository.findById(id)
                            .orElseThrow(() -> new RuntimeException("Класс не найден: " + id)))
                    .collect(Collectors.toSet());
            test.setAvailableGrades(grades);
        }

        // Update questions (remove existing and add new)
        if (request.getQuestions() != null) {
            // Remove existing questions
            test.getQuestions().clear();

            // Add new questions
            for (QuestionDto questionDto : request.getQuestions()) {
                Question question = new Question();
                question.setText(questionDto.getText());
                question.setType(questionDto.getType());
                question.setPoints(questionDto.getPoints());
                question.setTest(test);

                // Add answers
                if (questionDto.getAnswers() != null) {
                    for (AnswerDto answerDto : questionDto.getAnswers()) {
                        Answer answer = new Answer();
                        answer.setText(answerDto.getText());
                        answer.setCorrect(answerDto.getIsCorrect() != null ? answerDto.getIsCorrect() : false);
                        answer.setQuestion(question);
                        question.getAnswers().add(answer);
                    }
                }

                test.getQuestions().add(question);
            }
        }

        testRepository.save(test);
        return TestDto.fromEntity(test);
    }

    // Delete a test (for teachers and admins)
    @Transactional
    public void deleteTest(Long testId, Long userId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Тест не найден"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        // Check permissions
        if (user.getRole() == UserRole.TEACHER && !test.getCreator().getId().equals(userId)) {
            throw new RuntimeException("Вы можете удалять только свои тесты");
        } else if (user.getRole() != UserRole.ADMIN && user.getRole() != UserRole.TEACHER) {
            throw new RuntimeException("У вас нет прав на удаление тестов");
        }

        // Check if test has any results
        List<TestResult> results = testResultRepository.findByTest(test);
        if (!results.isEmpty()) {
            // Instead of deleting, just mark as inactive
            test.setActive(false);
            testRepository.save(test);
        } else {
            // If no results, can safely delete
            testRepository.delete(test);
        }
    }

    @Transactional
    public TestResultDto startTest(Long testId, Long studentId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Тест не найден"));

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        if (student.getRole() != UserRole.STUDENT) {
            throw new RuntimeException("Только ученики могут проходить тесты");
        }

        // Check if test is available for student's grade
        if (!test.getAvailableGrades().contains(student.getGrade())) {
            throw new RuntimeException("Тест недоступен для вашего класса");
        }

        // Check if test is active
        if (!test.isActive()) {
            throw new RuntimeException("Тест неактивен");
        }

        // Check attempt limits first, regardless of existing attempts
        List<TestResult> completedAttempts = testResultRepository.findByTestAndStudentAndCompleted(
                test, student, true);

        if (completedAttempts.size() >= test.getMaxAttempts()) {
            // Check if the student has an ongoing attempt
            Optional<TestResult> existingIncompleteTest =
                    testResultRepository.findByTestAndStudentAndCompletedFalse(test, student);

            // Delete any incomplete attempts if limit is exceeded
            if (existingIncompleteTest.isPresent()) {
                testResultRepository.delete(existingIncompleteTest.get());
            }

            throw new RuntimeException("Вы достигли максимального количества попыток (" +
                    test.getMaxAttempts() + ") для этого теста");
        }

        // Check if the student has an ongoing attempt
        Optional<TestResult> existingIncompleteTest =
                testResultRepository.findByTestAndStudentAndCompletedFalse(test, student);

        if (existingIncompleteTest.isPresent()) {
            return TestResultDto.fromEntity(existingIncompleteTest.get());
        }

        // Create new test result
        TestResult testResult = new TestResult();
        testResult.setTest(test);
        testResult.setStudent(student);
        testResult.setStartedAt(LocalDateTime.now());
        testResult.setCompleted(false);
        testResult.setAttemptNumber(completedAttempts.size() + 1);
        testResult.setMaxScore(test.getQuestions().stream()
                .mapToInt(Question::getPoints)
                .sum());

        TestResult savedResult = testResultRepository.save(testResult);
        return TestResultDto.fromEntity(savedResult);
    }

    // Get questions for a test (for students taking the test)
    public List<QuestionDto> getTestQuestions(Long testId, Long testResultId, Long studentId) {
        TestResult testResult = testResultRepository.findById(testResultId)
                .orElseThrow(() -> new RuntimeException("Результат теста не найден"));

        // Verify that this test result belongs to the student
        if (!testResult.getStudent().getId().equals(studentId)) {
            throw new RuntimeException("У вас нет доступа к этому тесту");
        }

        // Verify that the test result is for the requested test
        if (!testResult.getTest().getId().equals(testId)) {
            throw new RuntimeException("Несоответствие теста и результата");
        }
        if (testResult.isCompleted()) {
            throw new RuntimeException("Тест уже завершен");
        }

        // Get test questions without correct answer information
        return testResult.getTest().getQuestions().stream()
                .map(q -> QuestionDto.fromEntity(q, false))
                .collect(Collectors.toList());
    }

    // Submit answers for a test
    @Transactional
    public TestResultDto submitTest(TestSubmissionRequest request, Long studentId) {
        TestResult testResult = testResultRepository.findById(request.getTestResultId())
                .orElseThrow(() -> new RuntimeException("Результат теста не найден"));

        // Verify that this test result belongs to the student
        if (!testResult.getStudent().getId().equals(studentId)) {
            throw new RuntimeException("У вас нет доступа к этому тесту");
        }

        // Verify that the test is not completed
        if (testResult.isCompleted()) {
            throw new RuntimeException("Тест уже завершен");
        }

        // Check if time limit exceeded
        LocalDateTime deadline = testResult.getStartedAt().plusMinutes(testResult.getTest().getTimeLimit());
        if (LocalDateTime.now().isAfter(deadline)) {
            testResult.setCompleted(true);
            testResult.setCompletedAt(LocalDateTime.now());
            testResult.setScore(0); // Could be different logic, e.g., score what's been answered so far
            testResultRepository.save(testResult);
            throw new RuntimeException("Время выполнения теста истекло");
        }

        Test test = testResult.getTest();

        // Process student answers
        int totalScore = 0;

        // Create a map of questionId -> Question for faster access
        Map<Long, Question> questionMap = test.getQuestions().stream()
                .collect(Collectors.toMap(Question::getId, q -> q));

        // Process each answer
        for (StudentAnswerRequest answerRequest : request.getAnswers()) {
            Question question = questionMap.get(answerRequest.getQuestionId());
            if (question == null) {
                continue; // Skip if question not found
            }

            StudentAnswer studentAnswer = new StudentAnswer();
            studentAnswer.setQuestion(question);
            studentAnswer.setTestResult(testResult);

            boolean isCorrect = false;

            switch (question.getType()) {
                case TEXT_ANSWER:
                    studentAnswer.setTextAnswer(answerRequest.getTextAnswer());

                    // For text answers, we need custom logic to determine correctness
                    // This could be exact match, contains, case insensitive, etc.
                    if (question.getAnswers().size() > 0) {
                        String correctAnswer = question.getAnswers().get(0).getText().trim().toLowerCase();
                        String providedAnswer = answerRequest.getTextAnswer().trim().toLowerCase();
                        isCorrect = correctAnswer.equals(providedAnswer);
                    }
                    break;

                case SINGLE_CHOICE:
                case MULTIPLE_CHOICE:
                    // Get selected answers
                    if (answerRequest.getSelectedAnswerIds() != null && !answerRequest.getSelectedAnswerIds().isEmpty()) {
                        // Create a map of answerId -> Answer for this question
                        Map<Long, Answer> answerMap = question.getAnswers().stream()
                                .collect(Collectors.toMap(Answer::getId, a -> a));

                        // Add selected answers
                        Set<Answer> selectedAnswers = new HashSet<>();
                        for (Long answerId : answerRequest.getSelectedAnswerIds()) {
                            Answer answer = answerMap.get(answerId);
                            if (answer != null) {
                                selectedAnswers.add(answer);
                            }
                        }
                        studentAnswer.setSelectedAnswers(selectedAnswers);

                        if (question.getType() == QuestionType.SINGLE_CHOICE) {
                            // For single choice, the answer is correct if the selected answer is correct
                            if (selectedAnswers.size() == 1) {
                                isCorrect = selectedAnswers.iterator().next().isCorrect();
                            }
                        } else {
                            // For multiple choice, all correct answers must be selected and no incorrect ones
                            Set<Answer> correctAnswers = question.getAnswers().stream()
                                    .filter(Answer::isCorrect)
                                    .collect(Collectors.toSet());

                            // Check if selected answers match exactly the correct answers
                            isCorrect = selectedAnswers.equals(correctAnswers);
                        }
                    }
                    break;
            }

            studentAnswer.setCorrect(isCorrect);
            studentAnswer.setEarnedPoints(isCorrect ? question.getPoints() : 0);
            totalScore += studentAnswer.getEarnedPoints();

            testResult.getStudentAnswers().add(studentAnswer);
        }

        // Mark test as completed
        testResult.setCompleted(true);
        testResult.setCompletedAt(LocalDateTime.now());
        testResult.setScore(totalScore);

        TestResult savedResult = testResultRepository.save(testResult);
        return TestResultDto.fromEntity(savedResult);
    }

    // Get test results for a student
    public List<TestResultDto> getStudentResults(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        if (student.getRole() != UserRole.STUDENT) {
            throw new RuntimeException("Пользователь не является учеником");
        }

        return testResultRepository.findByStudent(student).stream()
                .map(TestResultDto::fromEntity)
                .collect(Collectors.toList());
    }

    // Get test results for a test (for teachers and admins)
    public List<TestResultDto> getTestResults(Long testId, Long userId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Тест не найден"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        // Check permissions
        if (user.getRole() == UserRole.TEACHER) {
            boolean isCreator = test.getCreator().getId().equals(userId);
            boolean teachesSubject = user.getSubjects().stream()
                    .anyMatch(s -> s.getId().equals(test.getSubject().getId()));

            if (!isCreator && !teachesSubject) {
                throw new RuntimeException("У вас нет доступа к результатам этого теста");
            }
        } else if (user.getRole() != UserRole.ADMIN) {
            throw new RuntimeException("У вас нет прав на просмотр результатов теста");
        }

        return testResultRepository.findByTest(test).stream()
                .map(TestResultDto::fromEntity)
                .collect(Collectors.toList());
    }
}
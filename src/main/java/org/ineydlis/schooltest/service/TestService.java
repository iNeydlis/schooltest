package org.ineydlis.schooltest.service;

import org.ineydlis.schooltest.dto.*;
import org.ineydlis.schooltest.model.*;
import org.ineydlis.schooltest.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
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
        test.setQuestionsToShow(request.getQuestionsToShow());

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

    public List<TestDto> getTestsForStudent(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        if (student.getRole() != UserRole.STUDENT) {
            throw new RuntimeException("Пользователь не является учеником");
        }

        if (student.getGrade() == null) {
            return Collections.emptyList();
        }

        List<Test> tests = testRepository.findByAvailableGradesAndActive(student.getGrade());
        List<TestDto> testDtos = new ArrayList<>();

        for (Test test : tests) {
            TestDto testDto = TestDto.fromEntity(test);

            // Найдем все попытки для этого теста и этого ученика
            List<TestResult> attempts = testResultRepository.findByTestAndStudent(test, student);

            // Найдем лучшую попытку
            TestResult bestAttempt = attempts.stream()
                    .filter(TestResult::isCompleted)
                    .max(Comparator.comparing(TestResult::getScore))
                    .orElse(null);

            if (bestAttempt != null) {
                // Установим лучший результат
                testDto.setBestScore(bestAttempt.getScore());

                // Установим реальный максимальный балл из этой попытки
                // Это будет максимальный возможный балл для ответов на вопросы,
                // которые были выбраны для этой конкретной попытки
                testDto.setMaxScore(bestAttempt.getMaxScore());
            } else {
                // Если попыток еще не было, устанавливаем максимальный балл из всех вопросов
                testDto.setMaxScore(testDto.getTotalPoints());
            }

            // Вычислим кол-во оставшихся попыток
            long completedAttempts = attempts.stream()
                    .filter(TestResult::isCompleted)
                    .count();

            int remainingAttempts = test.getMaxAttempts() - (int)completedAttempts;
            testDto.setRemainingAttempts(Math.max(0, remainingAttempts));

            testDtos.add(testDto);
        }

        return testDtos;
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
        test.setQuestionsToShow(request.getQuestionsToShow());

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
    @Transactional
    public void permanentlyDeleteTest(Long testId, Long userId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Тест не найден"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        // Check permissions - only admins or the creator of the test can permanently delete it
        if (user.getRole() == UserRole.TEACHER && !test.getCreator().getId().equals(userId)) {
            throw new RuntimeException("Вы можете полностью удалять только свои тесты");
        } else if (user.getRole() != UserRole.ADMIN && user.getRole() != UserRole.TEACHER) {
            throw new RuntimeException("У вас нет прав на полное удаление тестов");
        }

        // Find and delete all test results associated with this test
        List<TestResult> results = testResultRepository.findByTest(test);
        testResultRepository.deleteAll(results);

        // Delete the test itself
        testRepository.delete(test);
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

        // Always mark as inactive instead of deleting
        test.setActive(false);
        testRepository.save(test);
    }
    @Transactional
    public TestDto reactivateTest(Long testId, Long userId, boolean clearAttempts) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Тест не найден"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        // Check permissions
        if (user.getRole() == UserRole.TEACHER && !test.getCreator().getId().equals(userId)) {
            throw new RuntimeException("Вы можете активировать только свои тесты");
        } else if (user.getRole() != UserRole.ADMIN && user.getRole() != UserRole.TEACHER) {
            throw new RuntimeException("У вас нет прав на активацию тестов");
        }

        // If the test is already active, return it as is
        if (test.isActive()) {
            return TestDto.fromEntity(test);
        }

        // Reactivate the test
        test.setActive(true);
        test.setUpdatedAt(LocalDateTime.now());

        // Clear all attempts if requested
        if (clearAttempts) {
            List<TestResult> results = testResultRepository.findByTest(test);
            testResultRepository.deleteAll(results);
        }

        Test savedTest = testRepository.save(test);
        return TestDto.fromEntity(savedTest);
    }

    public TestResultDto getInProgressTest(Long testId, Long studentId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Тест не найден"));

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        if (student.getRole() != UserRole.STUDENT) {
            throw new RuntimeException("Только ученики могут проходить тесты");
        }

        // Check if the student has an ongoing attempt
        Optional<TestResult> existingIncompleteTest =
                testResultRepository.findByTestAndStudentAndCompletedFalse(test, student);

        if (existingIncompleteTest.isPresent()) {
            return TestResultDto.fromEntity(existingIncompleteTest.get());
        }

        // Return null if no in-progress test found
        return null;
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
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

        // Check attempt limits first
        List<TestResult> completedAttempts = testResultRepository.findByTestAndStudentAndCompleted(
                test, student, true);

        if (completedAttempts.size() >= test.getMaxAttempts()) {
            throw new RuntimeException("Вы достигли максимального количества попыток (" +
                    test.getMaxAttempts() + ") для этого теста");
        }

        // Check if the student has an ongoing attempt - use a more specific query with locking
        List<TestResult> incompleteAttempts =
                testResultRepository.findByTestAndStudentAndCompletedForUpdate(test, student, false);

        // Handle multiple incomplete attempts
        if (!incompleteAttempts.isEmpty()) {
            // Sort by startedAt descending to get the most recent one
            incompleteAttempts.sort((a, b) -> b.getStartedAt().compareTo(a.getStartedAt()));

            // Keep the first one (most recent) and delete the rest
            TestResult mostRecent = incompleteAttempts.get(0);
            for (int i = 1; i < incompleteAttempts.size(); i++) {
                testResultRepository.delete(incompleteAttempts.get(i));
            }

            // Check if the most recent test is too old (e.g., abandoned)
            LocalDateTime deadline = mostRecent.getStartedAt().plusMinutes(test.getTimeLimit());
            if (LocalDateTime.now().isAfter(deadline)) {
                // If the test has expired, mark it as completed with zero score
                mostRecent.setCompleted(true);
                mostRecent.setCompletedAt(LocalDateTime.now());
                mostRecent.setScore(0);
                testResultRepository.save(mostRecent);

                // Create a new test attempt
                return createNewTestAttempt(test, student, completedAttempts.size() + 1);
            }

            return TestResultDto.fromEntity(mostRecent);
        }

        // Create new test result
        return createNewTestAttempt(test, student, completedAttempts.size() + 1);
    }

    // Helper method to create a new test attempt
    private TestResultDto createNewTestAttempt(Test test, User student, int attemptNumber) {
        TestResult testResult = new TestResult();
        testResult.setTest(test);
        testResult.setStudent(student);
        testResult.setStartedAt(LocalDateTime.now());
        testResult.setCompleted(false);
        testResult.setAttemptNumber(attemptNumber);
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

        Test test = testResult.getTest();
        List<Question> allQuestions = test.getQuestions();

        // If questionsToShow is null or less than or equal to 0, or greater than total questions, show all questions
        if (test.getQuestionsToShow() == null || test.getQuestionsToShow() <= 0 || test.getQuestionsToShow() >= allQuestions.size()) {
            return allQuestions.stream()
                    .map(q -> QuestionDto.fromEntity(q, false))
                    .collect(Collectors.toList());
        }

        // If this is a new test result without assigned questions, randomly select questions
        if (testResult.getSelectedQuestionIds() == null || testResult.getSelectedQuestionIds().isEmpty()) {
            // Create a copy of the questions list and shuffle it
            List<Question> questionsCopy = new ArrayList<>(allQuestions);
            Collections.shuffle(questionsCopy);

            // Take only the required number of questions
            List<Question> selectedQuestions = questionsCopy.subList(0, test.getQuestionsToShow());

            // Store the selected question IDs in the test result for consistency between requests
            List<Long> selectedQuestionIds = selectedQuestions.stream()
                    .map(Question::getId)
                    .collect(Collectors.toList());

            testResult.setSelectedQuestionIds(selectedQuestionIds);
            testResultRepository.save(testResult);

            return selectedQuestions.stream()
                    .map(q -> QuestionDto.fromEntity(q, false))
                    .collect(Collectors.toList());
        } else {
            // Use the previously selected questions
            List<Long> selectedQuestionIds = testResult.getSelectedQuestionIds();

            // Create a map for quick lookup of questions by ID
            Map<Long, Question> questionMap = allQuestions.stream()
                    .collect(Collectors.toMap(Question::getId, q -> q));

            // Retrieve the previously selected questions in the original order
            List<Question> selectedQuestions = selectedQuestionIds.stream()
                    .map(questionMap::get)
                    .filter(Objects::nonNull) // Filter out any questions that might have been deleted
                    .collect(Collectors.toList());

            return selectedQuestions.stream()
                    .map(q -> QuestionDto.fromEntity(q, false))
                    .collect(Collectors.toList());
        }
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

        Test test = testResult.getTest();
        boolean timeExpired = false;

        // Check if time limit exceeded
        LocalDateTime deadline = testResult.getStartedAt().plusMinutes(testResult.getTest().getTimeLimit());
        if (LocalDateTime.now().isAfter(deadline)) {
            timeExpired = true;
        }

        // Process student answers
        int totalScore = 0;
        int maxPossibleScore = 0;

        // Create a map of questionId -> Question for faster access
        Map<Long, Question> questionMap = test.getQuestions().stream()
                .collect(Collectors.toMap(Question::getId, q -> q));

        // Get the list of questions that should be considered for scoring
        List<Long> questionIdsToConsider;
        if (testResult.getSelectedQuestionIds() != null && !testResult.getSelectedQuestionIds().isEmpty()) {
            questionIdsToConsider = testResult.getSelectedQuestionIds();
        } else {
            // If no specific questions were selected, consider all questions
            questionIdsToConsider = test.getQuestions().stream()
                    .map(Question::getId)
                    .collect(Collectors.toList());
        }

        // Calculate the maximum possible score based on the selected questions only
        for (Long questionId : questionIdsToConsider) {
            Question question = questionMap.get(questionId);
            if (question != null) {
                maxPossibleScore += question.getPoints();
            }
        }

        // Set the maxScore correctly in the test result
        testResult.setMaxScore(maxPossibleScore);

        // Process each answer
        for (StudentAnswerRequest answerRequest : request.getAnswers()) {
            Question question = questionMap.get(answerRequest.getQuestionId());
            if (question == null) {
                continue; // Skip if question not found
            }

            // Skip questions that were not part of the selected set
            if (!questionIdsToConsider.contains(question.getId())) {
                continue;
            }

            StudentAnswer studentAnswer = new StudentAnswer();
            studentAnswer.setQuestion(question);
            studentAnswer.setTestResult(testResult);

            boolean isCorrect = false;

            switch (question.getType()) {
                case TEXT_ANSWER:
                    studentAnswer.setTextAnswer(answerRequest.getTextAnswer());

                    // For text answers, we need custom logic to determine correctness
                    if (question.getAnswers().size() > 0) {
                        String correctAnswer = question.getAnswers().get(0).getText().trim().toLowerCase();
                        String providedAnswer = answerRequest.getTextAnswer() != null ?
                                answerRequest.getTextAnswer().trim().toLowerCase() : "";
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

        // If time expired, include a message in the result
        TestResultDto resultDto = TestResultDto.fromEntity(savedResult);
        if (timeExpired) {
            resultDto.setMessage("Время выполнения теста истекло. Учтены только предоставленные ответы.");
        }


        return resultDto;
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
    // Add this to TestService.java
    public TestResultDto getTestResultById(Long resultId, Long userId) {
        TestResult result = testResultRepository.findById(resultId)
                .orElseThrow(() -> new RuntimeException("Результат теста не найден"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        // Check permissions
        if (user.getRole() == UserRole.TEACHER) {
            Test test = result.getTest();
            boolean isCreator = test.getCreator().getId().equals(userId);
            boolean teachesSubject = user.getSubjects().stream()
                    .anyMatch(s -> s.getId().equals(test.getSubject().getId()));

            if (!isCreator && !teachesSubject) {
                throw new RuntimeException("У вас нет доступа к этому результату теста");
            }
        } else if (user.getRole() == UserRole.STUDENT) {
            // Students can only view their own results
            if (!result.getStudent().getId().equals(userId)) {
                throw new RuntimeException("У вас нет доступа к этому результату теста");
            }
        } else if (user.getRole() != UserRole.ADMIN) {
            throw new RuntimeException("У вас нет прав на просмотр результатов теста");
        }

        return TestResultDto.fromEntity(result);
    }
    /**
     * Получить детальную информацию о результате теста, включая ответы студента
     *
     * @param resultId ID результата теста
     * @param userId ID пользователя, запрашивающего информацию
     * @return Детальная информация о результате теста
     */
    public TestResultDetailsDto getTestResultDetails(Long resultId, Long userId) {
        TestResult result = testResultRepository.findById(resultId)
                .orElseThrow(() -> new RuntimeException("Результат теста не найден"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        // Проверка прав доступа
        if (user.getRole() == UserRole.TEACHER) {
            Test test = result.getTest();
            boolean isCreator = test.getCreator().getId().equals(userId);
            boolean teachesSubject = user.getSubjects().stream()
                    .anyMatch(s -> s.getId().equals(test.getSubject().getId()));

            if (!isCreator && !teachesSubject) {
                throw new RuntimeException("У вас нет доступа к этому результату теста");
            }
        } else if (user.getRole() == UserRole.STUDENT) {
            // Студенты могут просматривать только свои результаты
            if (!result.getStudent().getId().equals(userId)) {
                throw new RuntimeException("У вас нет доступа к этому результату теста");
            }
        } else if (user.getRole() != UserRole.ADMIN) {
            throw new RuntimeException("У вас нет прав на просмотр результатов теста");
        }

        // Если результат еще не завершен, выдаем ошибку
        if (!result.isCompleted()) {
            throw new RuntimeException("Этот тест еще не завершен");
        }

        return TestResultDetailsDto.fromEntity(result);
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
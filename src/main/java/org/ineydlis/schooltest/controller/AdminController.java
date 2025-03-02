package org.ineydlis.schooltest.controller;

import org.ineydlis.schooltest.dto.UserDto;
import org.ineydlis.schooltest.model.User;
import org.ineydlis.schooltest.model.UserRole;
import org.ineydlis.schooltest.repository.UserRepository;
import org.ineydlis.schooltest.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers(HttpServletRequest request) {
        User currentUser = (User) request.getAttribute("user");

        if (currentUser.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(403).build();
        }

        List<User> users = userRepository.findAll();
        // Не отправляем пароли
        users.forEach(user -> user.setPassword(null));

        return ResponseEntity.ok(users);
    }

    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody UserDto userDto, HttpServletRequest request) {
        User currentUser = (User) request.getAttribute("user");

        if (currentUser.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(403).build();
        }

        User savedUser = authService.createUser(userDto);
        savedUser.setPassword(null); // Не возвращаем пароль

        return ResponseEntity.ok(savedUser);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody UserDto userDto, HttpServletRequest request) {
        User currentUser = (User) request.getAttribute("user");

        if (currentUser.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(403).build();
        }

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();

        // Обновляем данные
        user.setFullName(userDto.getFullName());
        user.setEmail(userDto.getEmail());
        user.setRole(userDto.getRole());
        user.setGrade(userDto.getGrade());
        user.setGroup(userDto.getGroup());
        user.setSubjects(userDto.getSubjects());
        user.setActive(userDto.isActive());

        // Обновляем пароль только если он предоставлен
        if (userDto.getPassword() != null && !userDto.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        }

        User updatedUser = userRepository.save(user);
        updatedUser.setPassword(null); // Не возвращаем пароль

        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, HttpServletRequest request) {
        User currentUser = (User) request.getAttribute("user");

        if (currentUser.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(403).build();
        }

        if (currentUser.getId().equals(id)) {
            return ResponseEntity.badRequest().build(); // Нельзя удалить самого себя
        }

        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }

        return ResponseEntity.notFound().build();
    }
}

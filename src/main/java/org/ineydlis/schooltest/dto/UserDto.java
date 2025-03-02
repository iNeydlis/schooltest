package org.ineydlis.schooltest.dto;

import lombok.Data;
import org.ineydlis.schooltest.model.UserRole;

import java.util.Set;

@Data
public class UserDto {
    private Long id;
    private String username;
    private String password; // Для создания, не возвращается в ответе
    private String fullName;
    private String email;
    private UserRole role;
    private String grade;
    private String group;
    private Set<String> subjects;
    private boolean active;
}

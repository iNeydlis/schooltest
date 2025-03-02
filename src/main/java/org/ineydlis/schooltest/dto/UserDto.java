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
    private String gradeName; // Изменено: теперь это имя класса (например, "1А")
    private Set<String> subjectNames; // Изменено: теперь это набор имён предметов
    private boolean active;
}

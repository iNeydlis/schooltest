package org.ineydlis.schooltest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Set;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    private String fullName;
    private String role;
    private String email;
    private String grade;
    private String group;
    private Set<String> subjects;
}

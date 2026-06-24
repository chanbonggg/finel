package com.finel.backend.auth;

import static org.mockito.Mockito.*;
import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class AdminBootstrapTest {
    @Test void disabledDoesNothing(){
        AdminRepository repository=mock(AdminRepository.class);
        new AdminBootstrap(repository,new BCryptPasswordEncoder(),new AdminBootstrapProperties(false,"admin","password"))
                .run(new DefaultApplicationArguments());
        verifyNoInteractions(repository);
    }
    @Test void existingUsernameIsNotOverwritten(){
        AdminRepository repository=mock(AdminRepository.class);when(repository.existsByUsername("admin")).thenReturn(true);
        new AdminBootstrap(repository,new BCryptPasswordEncoder(),new AdminBootstrapProperties(true,"admin","password"))
                .run(new DefaultApplicationArguments());
        verify(repository,never()).save(any());
    }
    @Test void newPasswordIsHashed(){
        AdminRepository repository=mock(AdminRepository.class);BCryptPasswordEncoder encoder=new BCryptPasswordEncoder();
        new AdminBootstrap(repository,encoder,new AdminBootstrapProperties(true,"admin","plain-password"))
                .run(new DefaultApplicationArguments());
        verify(repository).save(argThat(admin->admin.getUsername().equals("admin")&&!admin.getPassword().equals("plain-password")&&encoder.matches("plain-password",admin.getPassword())));
    }
}

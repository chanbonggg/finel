package com.finel.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@ExtendWith(OutputCaptureExtension.class)
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
    @Test void bootstrapLogsDoNotExposeUsername(CapturedOutput output){
        AdminRepository repository=mock(AdminRepository.class);
        new AdminBootstrap(repository,new BCryptPasswordEncoder(),new AdminBootstrapProperties(true,"leaky-admin","plain-password"))
                .run(new DefaultApplicationArguments());
        assertThat(output).contains("admin bootstrap created admin account")
                .doesNotContain("leaky-admin")
                .doesNotContain("plain-password");
    }
}

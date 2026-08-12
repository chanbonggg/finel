package com.finel.backend.mail;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;

import com.finel.backend.inquiry.Inquiry;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(OutputCaptureExtension.class)
class MailServiceTest {
    @Test
    void logsMailFailureWithoutInquiryPersonalData(CapturedOutput output) {
        JavaMailSender sender = mock(JavaMailSender.class);
        doThrow(new org.springframework.mail.MailSendException("smtp unavailable"))
                .when(sender)
                .send(org.mockito.ArgumentMatchers.any(org.springframework.mail.SimpleMailMessage.class));
        MailService service = new MailService(sender, new MailProperties("from@example.com", "to@example.com"));
        Inquiry inquiry = Inquiry.create("Sensitive Name", "010-9999-8888", "secret@example.com", "Sensitive inquiry body", null, null);
        ReflectionTestUtils.setField(inquiry, "id", 42);

        service.sendInquiry(inquiry);

        assertThat(output).contains("inquiry mail send failed")
                .contains("inquiryId=42")
                .doesNotContain("Sensitive Name")
                .doesNotContain("010-9999-8888")
                .doesNotContain("secret@example.com")
                .doesNotContain("Sensitive inquiry body");
    }
}

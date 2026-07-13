package com.finel.backend.inquiry;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.finel.backend.inquiry.dto.InquiryCreateRequest;
import com.finel.backend.mail.MailSendException;
import com.finel.backend.mail.MailService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(OutputCaptureExtension.class)
class InquiryServiceTest {
    @Test
    void preservesSavedInquiryContractWhenMailFails() {
        InquiryRepository repository = mock(InquiryRepository.class);
        InquiryPersistenceService persistence = mock(InquiryPersistenceService.class);
        MailService mail = mock(MailService.class);
        when(persistence.save(any())).thenAnswer(invocation -> {
            Inquiry inquiry = invocation.getArgument(0);
            ReflectionTestUtils.setField(inquiry, "id", 41);
            inquiry.prePersist();
            return inquiry;
        });
        doThrow(new MailSendException("smtp unavailable", new RuntimeException())).when(mail).sendInquiry(any());
        InquiryService service = new InquiryService(repository, persistence, mail);

        var result = service.create(new InquiryCreateRequest("TEST_user", "010-1234-5678", "", "문의", null, null, null, null, null));

        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo("MAIL_SEND_FAILED");
        assertThat(result.stage()).isEqualTo("MAIL_SEND");
        assertThat(result.inquirySaved()).isTrue();
        assertThat(result.mailSent()).isFalse();
        assertThat(result.inquiryId()).isEqualTo(41);
        verify(persistence).save(any(Inquiry.class));
    }

    @Test
    void validationFailureDoesNotWriteOrSend() {
        InquiryPersistenceService persistence = mock(InquiryPersistenceService.class);
        MailService mail = mock(MailService.class);
        InquiryService service = new InquiryService(mock(InquiryRepository.class), persistence, mail);

        var result = service.create(new InquiryCreateRequest("", null, null, "", null, null, null, null, null));

        assertThat(result.errorCode()).isEqualTo("VALIDATION_FAILED");
        assertThat(result.inquirySaved()).isFalse();
        verifyNoInteractions(persistence, mail);
    }

    @Test
    void dbFailureLogDoesNotExposeInquiryPersonalData(CapturedOutput output) {
        InquiryPersistenceService persistence = mock(InquiryPersistenceService.class);
        MailService mail = mock(MailService.class);
        when(persistence.save(any())).thenThrow(new DataIntegrityViolationException("constraint failed"));
        InquiryService service = new InquiryService(mock(InquiryRepository.class), persistence, mail);

        var result = service.create(new InquiryCreateRequest(
                "Sensitive Name", "010-9999-8888", "secret@example.com", "Sensitive inquiry body", null, null, null, null, null));

        assertThat(result.errorCode()).isEqualTo("DB_WRITE_FAILED");
        assertThat(output).contains("inquiry db write failed")
                .doesNotContain("Sensitive Name")
                .doesNotContain("010-9999-8888")
                .doesNotContain("secret@example.com")
                .doesNotContain("Sensitive inquiry body");
        verifyNoInteractions(mail);
    }

    @Test
    void mailFailureLogDoesNotExposeInquiryPersonalData(CapturedOutput output) {
        InquiryRepository repository = mock(InquiryRepository.class);
        InquiryPersistenceService persistence = mock(InquiryPersistenceService.class);
        MailService mail = mock(MailService.class);
        when(persistence.save(any())).thenAnswer(invocation -> {
            Inquiry inquiry = invocation.getArgument(0);
            ReflectionTestUtils.setField(inquiry, "id", 42);
            inquiry.prePersist();
            return inquiry;
        });
        doThrow(new MailSendException("smtp unavailable", new RuntimeException())).when(mail).sendInquiry(any());
        InquiryService service = new InquiryService(repository, persistence, mail);

        var result = service.create(new InquiryCreateRequest(
                "Sensitive Name", "010-9999-8888", "secret@example.com", "Sensitive inquiry body", null, null, null, null, null));

        assertThat(result.errorCode()).isEqualTo("MAIL_SEND_FAILED");
        assertThat(output).contains("inquiry mail send failed")
                .contains("inquiryId=42")
                .doesNotContain("Sensitive Name")
                .doesNotContain("010-9999-8888")
                .doesNotContain("secret@example.com")
                .doesNotContain("Sensitive inquiry body");
    }
}

package com.finel.backend.inquiry;

import com.finel.backend.common.web.UtcDates;
import com.finel.backend.inquiry.dto.InquiryCreateRequest;
import com.finel.backend.inquiry.dto.InquiryCreateResponse;
import com.finel.backend.inquiry.dto.InquiryResponse;
import com.finel.backend.mail.MailSendException;
import com.finel.backend.mail.MailService;
import java.util.List;
import java.util.NoSuchElementException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InquiryService {
    private static final String ERROR_CODE_VALIDATION_FAILED = "VALIDATION_FAILED";
    private static final String ERROR_CODE_DB_WRITE_FAILED = "DB_WRITE_FAILED";
    private static final String ERROR_CODE_MAIL_SEND_FAILED = "MAIL_SEND_FAILED";
    private static final String STAGE_VALIDATION = "VALIDATION";
    private static final String STAGE_DB_WRITE = "DB_WRITE";
    private static final String STAGE_MAIL_SEND = "MAIL_SEND";
    private static final String STAGE_DONE = "DONE";

    private static final Logger log = LoggerFactory.getLogger(InquiryService.class);

    private final InquiryRepository repository;
    private final InquiryPersistenceService persistence;
    private final MailService mail;

    public InquiryService(InquiryRepository repository, InquiryPersistenceService persistence, MailService mail) {
        this.repository = repository;
        this.persistence = persistence;
        this.mail = mail;
    }

    public InquiryCreateResponse create(InquiryCreateRequest request) {
        String phone = request.normalizedPhone();
        String message = request.normalizedMessage();

        if (request.name() == null || request.name().isBlank() || phone.isBlank() || message.isBlank()) {
            return failure(ERROR_CODE_VALIDATION_FAILED, STAGE_VALIDATION, "이름, 연락처, 문의 내용은 필수 입력 항목입니다.", false, null);
        }

        Inquiry saved;
        try {
            saved = persistence.save(Inquiry.create(
                    request.name().trim(),
                    phone,
                    request.email(),
                    message,
                    request.company(),
                    request.normalizedProduct()));
        } catch (DataAccessException e) {
            log.error("inquiry db write failed: type={} causeType={}", e.getClass().getName(), causeType(e));
            return failure(ERROR_CODE_DB_WRITE_FAILED, STAGE_DB_WRITE, "문의 저장에 실패했습니다.", false, null);
        }

        try {
            mail.sendInquiry(saved);
        } catch (MailSendException e) {
            log.warn(
                    "inquiry mail send failed: inquiryId={} type={} causeType={}",
                    saved.getId(),
                    e.getClass().getName(),
                    causeType(e));
            return failure(ERROR_CODE_MAIL_SEND_FAILED, STAGE_MAIL_SEND, "문의는 접수되었지만 알림 발송에 실패했습니다.", true, saved.getId());
        }

        return new InquiryCreateResponse(
                true,
                null,
                STAGE_DONE,
                "문의가 성공적으로 접수되었습니다.",
                true,
                true,
                saved.getId(),
                response(saved));
    }

    private static InquiryCreateResponse failure(String errorCode, String stage, String message, boolean inquirySaved, Integer inquiryId) {
        return new InquiryCreateResponse(false, errorCode, stage, message, false, inquirySaved, inquiryId, null);
    }

    @Transactional(readOnly = true)
    public List<InquiryResponse> list() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(InquiryService::response)
                .toList();
    }

    @Transactional
    public void delete(Integer id) {
        Inquiry inquiry = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("문의를 찾을 수 없습니다."));
        repository.delete(inquiry);
    }

    private static InquiryResponse response(Inquiry inquiry) {
        return new InquiryResponse(
                inquiry.getId(),
                inquiry.getName(),
                inquiry.getPhone(),
                inquiry.getEmail(),
                inquiry.getContent(),
                inquiry.getCompany(),
                inquiry.getProduct(),
                inquiry.getIsRead(),
                UtcDates.format(inquiry.getCreatedAt()));
    }

    private static String causeType(Throwable exception) {
        return exception.getCause() == null ? "none" : exception.getCause().getClass().getName();
    }
}

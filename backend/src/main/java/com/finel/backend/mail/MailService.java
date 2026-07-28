package com.finel.backend.mail;

import com.finel.backend.inquiry.Inquiry;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@EnableConfigurationProperties(MailProperties.class)
public class MailService {
    private static final String INQUIRY_SUBJECT = "[FINEL] 새 문의가 접수되었습니다.";

    private final JavaMailSender sender;
    private final MailProperties properties;

    public MailService(JavaMailSender sender, MailProperties properties) {
        this.sender = sender;
        this.properties = properties;
    }

    public void sendInquiry(Inquiry inquiry) {
        try {
            sender.send(createInquiryMessage(inquiry));
        } catch (RuntimeException e) {
            throw new MailSendException("문의 알림 메일 발송 실패", e);
        }
    }

    /**
     * Isolate template construction from the SMTP side effect so the caller's
     * saved-inquiry and mail-failure contracts stay easier to review.
     */
    private SimpleMailMessage createInquiryMessage(Inquiry inquiry) {
        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setFrom(properties.from());
        mail.setTo(properties.to());
        mail.setSubject(INQUIRY_SUBJECT);
        mail.setText(inquiryText(inquiry));
        return mail;
    }

    private static String inquiryText(Inquiry inquiry) {
        return "이름: " + inquiry.getName()
                + "\n연락처: " + inquiry.getPhone()
                + "\n이메일: " + inquiry.getEmail()
                + "\n회사명: " + inquiry.getCompany()
                + "\n관심 제품: " + inquiry.getProduct()
                + "\n문의 내용:\n" + inquiry.getContent();
    }
}

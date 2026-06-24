package com.finel.backend.mail;

import com.finel.backend.inquiry.Inquiry;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
@Service @EnableConfigurationProperties(MailProperties.class)
public class MailService {
    private final JavaMailSender sender; private final MailProperties properties;
    public MailService(JavaMailSender sender,MailProperties properties){this.sender=sender;this.properties=properties;}
    public void sendInquiry(Inquiry inquiry){
        try { SimpleMailMessage mail=new SimpleMailMessage(); mail.setFrom(properties.from()); mail.setTo(properties.to()); mail.setSubject("[FINEL] 새 문의가 접수되었습니다.");
            mail.setText("이름: "+inquiry.getName()+"\n연락처: "+inquiry.getPhone()+"\n이메일: "+inquiry.getEmail()+"\n회사명: "+inquiry.getCompany()+"\n관심 제품: "+inquiry.getProduct()+"\n문의 내용:\n"+inquiry.getContent()); sender.send(mail);
        } catch(RuntimeException e){throw new MailSendException("문의 알림 메일 발송 실패",e);}
    }
}

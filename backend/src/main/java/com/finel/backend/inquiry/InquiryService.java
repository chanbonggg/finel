package com.finel.backend.inquiry;

import com.finel.backend.common.web.UtcDates;
import com.finel.backend.inquiry.dto.*;
import com.finel.backend.mail.MailSendException;
import com.finel.backend.mail.MailService;
import java.util.List;
import java.util.NoSuchElementException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataAccessException;
@Service public class InquiryService {
    private final InquiryRepository repository; private final InquiryPersistenceService persistence; private final MailService mail;
    public InquiryService(InquiryRepository repository,InquiryPersistenceService persistence,MailService mail){this.repository=repository;this.persistence=persistence;this.mail=mail;}
    public InquiryCreateResponse create(InquiryCreateRequest request){
        String phone=request.normalizedPhone(), message=request.normalizedMessage();
        if(request.name()==null||request.name().isBlank()||phone.isBlank()||message.isBlank()) return new InquiryCreateResponse(false,"VALIDATION_FAILED","VALIDATION","이름, 연락처, 문의 내용은 필수 입력 항목입니다.",false,false,null,null);
        Inquiry saved;
        try { saved=persistence.save(Inquiry.create(request.name().trim(),phone,request.email(),message,request.company(),request.normalizedProduct())); }
        catch(DataAccessException e){return new InquiryCreateResponse(false,"DB_WRITE_FAILED","DB_WRITE","문의 저장에 실패했습니다.",false,false,null,null);}
        try {mail.sendInquiry(saved);} catch(MailSendException e){return new InquiryCreateResponse(false,"MAIL_SEND_FAILED","MAIL_SEND","문의는 접수되었지만 알림 발송에 실패했습니다.",false,true,saved.getId(),null);}
        return new InquiryCreateResponse(true,null,"DONE","문의가 성공적으로 접수되었습니다.",true,true,saved.getId(),response(saved));
    }
    @Transactional(readOnly=true) public List<InquiryResponse> list(){return repository.findAllByOrderByCreatedAtDesc().stream().map(InquiryService::response).toList();}
    @Transactional public void delete(Integer id){Inquiry inquiry=repository.findById(id).orElseThrow(()->new NoSuchElementException("문의를 찾을 수 없습니다."));repository.delete(inquiry);}
    private static InquiryResponse response(Inquiry i){return new InquiryResponse(i.getId(),i.getName(),i.getPhone(),i.getEmail(),i.getContent(),i.getCompany(),i.getProduct(),i.getIsRead(),UtcDates.format(i.getCreatedAt()));}
}

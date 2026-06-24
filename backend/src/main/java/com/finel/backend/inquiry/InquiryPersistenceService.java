package com.finel.backend.inquiry;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
@Service public class InquiryPersistenceService {
    private final InquiryRepository repository; public InquiryPersistenceService(InquiryRepository repository){this.repository=repository;}
    @Transactional(propagation=Propagation.REQUIRES_NEW) public Inquiry save(Inquiry inquiry){return repository.saveAndFlush(inquiry);}
}

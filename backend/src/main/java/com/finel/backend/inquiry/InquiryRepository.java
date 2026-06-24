package com.finel.backend.inquiry;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InquiryRepository extends JpaRepository<Inquiry, Integer> {

    List<Inquiry> findAllByOrderByCreatedAtDesc();
}

package com.finel.backend;

import com.finel.backend.auth.AdminRepository;
import com.finel.backend.category.CategoryRepository;
import com.finel.backend.inquiry.InquiryRepository;
import com.finel.backend.product.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;

@ActiveProfiles("test")
@SpringBootTest
class FinelBackendApplicationTests {

    @MockBean AdminRepository adminRepository;
    @MockBean CategoryRepository categoryRepository;
    @MockBean InquiryRepository inquiryRepository;
    @MockBean ProductRepository productRepository;
    @MockBean JavaMailSender mailSender;

    @Test
    void contextLoads() {
    }
}

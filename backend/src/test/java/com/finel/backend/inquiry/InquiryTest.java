package com.finel.backend.inquiry;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class InquiryTest {

    @Test
    void createsInquiryWithPrismaCompatibleDefaults() {
        Inquiry inquiry = Inquiry.create(
                "홍길동",
                null,
                " ",
                "문의 내용",
                null,
                null);

        inquiry.prePersist();

        assertThat(inquiry.getName()).isEqualTo("홍길동");
        assertThat(inquiry.getPhone()).isNull();
        assertThat(inquiry.getEmail()).isEmpty();
        assertThat(inquiry.getContent()).isEqualTo("문의 내용");
        assertThat(inquiry.getIsRead()).isFalse();
        assertThat(inquiry.getCreatedAt()).isNotNull();
    }
}

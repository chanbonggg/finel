package com.finel.backend.inquiry;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "\"Inquiry\"")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Inquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "phone")
    private String phone;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "company")
    private String company;

    @Column(name = "product")
    private String product;

    @Column(name = "\"isRead\"", nullable = false)
    private Boolean isRead = false;

    @Column(name = "\"createdAt\"", nullable = false)
    private LocalDateTime createdAt;

    public static Inquiry create(
            String name,
            String phone,
            String email,
            String content,
            String company,
            String product) {
        Inquiry inquiry = new Inquiry();
        inquiry.name = name;
        inquiry.phone = phone;
        inquiry.email = email == null || email.isBlank() ? "" : email;
        inquiry.content = content;
        inquiry.company = company;
        inquiry.product = product;
        inquiry.isRead = false;
        return inquiry;
    }

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.ofInstant(Clock.systemUTC().instant(), ZoneOffset.UTC);
        }
        if (isRead == null) {
            isRead = false;
        }
    }
}

package com.finel.backend.inquiry.dto;

public record InquiryResponse(Integer id,String name,String phone,String email,String content,String company,String product,Boolean isRead,String createdAt) {}

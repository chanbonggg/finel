package com.finel.backend.inquiry.dto;

public record InquiryCreateResponse(boolean success,String errorCode,String stage,String message,Boolean mailSent,Boolean inquirySaved,Integer inquiryId,InquiryResponse inquiry) {}

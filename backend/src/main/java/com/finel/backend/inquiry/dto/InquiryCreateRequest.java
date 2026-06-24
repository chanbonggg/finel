package com.finel.backend.inquiry.dto;

public record InquiryCreateRequest(String name,String phoneNumber,String email,String message,String productName,String company,String phone,String content,String product) {
    public String normalizedPhone(){return first(phoneNumber,phone);}
    public String normalizedMessage(){return first(message,content);}
    public String normalizedProduct(){return first(productName,product);}
    private static String first(String primary,String fallback){return primary!=null?primary:(fallback!=null?fallback:"");}
}

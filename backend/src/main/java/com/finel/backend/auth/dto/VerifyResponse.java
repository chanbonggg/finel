package com.finel.backend.auth.dto;

public record VerifyResponse(boolean success,User user) { public record User(Integer id,String username,long iat,long exp){} }

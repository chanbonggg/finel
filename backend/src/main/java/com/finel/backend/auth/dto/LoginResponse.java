package com.finel.backend.auth.dto;

public record LoginResponse(boolean success,String message,User user) { public record User(Integer id,String username){} }

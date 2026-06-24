package com.finel.backend.auth.dto;

public record CsrfResponse(boolean success,String token,String headerName) {}

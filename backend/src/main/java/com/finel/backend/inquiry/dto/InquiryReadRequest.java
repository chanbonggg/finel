package com.finel.backend.inquiry.dto;

import com.fasterxml.jackson.databind.JsonNode;

public record InquiryReadRequest(JsonNode isRead) {}

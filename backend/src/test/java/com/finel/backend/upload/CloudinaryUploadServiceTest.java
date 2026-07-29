package com.finel.backend.upload;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.http.client.MockClientHttpRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@ExtendWith(OutputCaptureExtension.class)
class CloudinaryUploadServiceTest {
    private static final String CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/demo-cloud/image/upload";
    private static final CloudinaryProperties CONFIGURED_PROPERTIES =
            new CloudinaryProperties("demo-cloud", "api-key-sensitive", "api-secret-sensitive", "products");

    @Test
    void missingConfigurationLogDoesNotExposeSecretOrFilename(CapturedOutput output) {
        CloudinaryUploadService service = new CloudinaryUploadService(
                new CloudinaryProperties("demo-cloud", "api-key-sensitive", "", "folder"));
        String expectedSignature = "418a3809a00b1b3cde63082446e667cfbc77d5e6";
        MockMultipartFile file = new MockMultipartFile(
                "file", "secret-file-name.png", MediaType.IMAGE_PNG_VALUE, new byte[] {1, 2, 3});

        assertThatThrownBy(() -> service.upload(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Cloudinary upload is not configured.");

        assertThat(output).contains("cloudinary upload configuration missing");
        assertThat(output).doesNotContain("api-key-sensitive")
                .doesNotContain(expectedSignature)
                .doesNotContain("secret-file-name.png");
    }

    @Test
    void validatesRequiredFileBeforeCloudinaryRequest() {
        CloudinaryUploadService service = new CloudinaryUploadService(CONFIGURED_PROPERTIES);

        assertThatThrownBy(() -> service.upload(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Image file is required.");
    }

    @Test
    void validatesFileSizeBeforeCloudinaryRequest() {
        CloudinaryUploadService service = new CloudinaryUploadService(CONFIGURED_PROPERTIES);
        MockMultipartFile file = new MockMultipartFile(
                "file", "large.png", MediaType.IMAGE_PNG_VALUE, new byte[5 * 1024 * 1024 + 1]);

        assertThatThrownBy(() -> service.upload(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Image file must be 5MB or smaller.");
    }

    @Test
    void validatesFileTypeBeforeCloudinaryRequest() {
        CloudinaryUploadService service = new CloudinaryUploadService(CONFIGURED_PROPERTIES);
        MockMultipartFile file = new MockMultipartFile(
                "file", "document.pdf", MediaType.APPLICATION_PDF_VALUE, new byte[] {1, 2, 3});

        assertThatThrownBy(() -> service.upload(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Only JPEG, PNG, WebP, or GIF images can be uploaded.");
    }

    @Test
    void externalFailureLogDoesNotExposeSecretFilenameOrCloudinaryBody(CapturedOutput output) {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        CloudinaryUploadService service = new CloudinaryUploadService(CONFIGURED_PROPERTIES, builder.build());
        MockMultipartFile file = uploadFile();

        server.expect(requestTo(CLOUDINARY_URL))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.BAD_GATEWAY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"error\":\"raw cloudinary api-key-sensitive secret-file-name.png\"}"));

        assertThatThrownBy(() -> service.upload(file))
                .isInstanceOf(RestClientResponseException.class);

        server.verify();
        assertThat(output).contains("cloudinary upload request failed");
        assertThat(output).doesNotContain("api-key-sensitive")
                .doesNotContain("api-secret-sensitive")
                .doesNotContain("secret-file-name.png")
                .doesNotContain("raw cloudinary");
    }

    @Test
    void missingSecureUrlFailsWithSafeMessage(CapturedOutput output) {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        CloudinaryUploadService service = new CloudinaryUploadService(CONFIGURED_PROPERTIES, builder.build());

        server.expect(requestTo(CLOUDINARY_URL))
                .andRespond(withSuccess("{\"public_id\":\"products/sample\"}", MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> service.upload(uploadFile()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Image upload failed.");

        server.verify();
        assertThat(output).contains("cloudinary upload response missing secure_url");
        assertThat(output).doesNotContain("api-key-sensitive")
                .doesNotContain("api-secret-sensitive")
                .doesNotContain("secret-file-name.png");
    }

    @Test
    void successfulUploadMapsCloudinaryResponse() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        CloudinaryUploadService service = new CloudinaryUploadService(CONFIGURED_PROPERTIES, builder.build());

        server.expect(requestTo(CLOUDINARY_URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(request -> {
                    assertThat(request.getHeaders().getContentType()).satisfies(contentType ->
                            assertThat(contentType).isNotNull().matches(MediaType.MULTIPART_FORM_DATA::isCompatibleWith));
                    String body = ((MockClientHttpRequest) request).getBodyAsString(StandardCharsets.UTF_8);
                    assertThat(body).contains(
                            "name=\"file\"",
                            "name=\"api_key\"",
                            "api-key-sensitive",
                            "name=\"signature\"",
                            "name=\"timestamp\"",
                            "name=\"folder\"",
                            "products");
                })
                .andRespond(withSuccess(
                        "{\"secure_url\":\"https://res.cloudinary.com/demo/image/upload/v1/sample.png\","
                                + "\"public_id\":\"products/sample\"}",
                        MediaType.APPLICATION_JSON));

        ImageUploadResponse response = service.upload(uploadFile());

        server.verify();
        assertThat(response.success()).isTrue();
        assertThat(response.secureUrl()).isEqualTo("https://res.cloudinary.com/demo/image/upload/v1/sample.png");
        assertThat(response.publicId()).isEqualTo("products/sample");
    }

    private static MockMultipartFile uploadFile() {
        return new MockMultipartFile(
                "file", "secret-file-name.png", MediaType.IMAGE_PNG_VALUE, new byte[] {1, 2, 3});
    }
}

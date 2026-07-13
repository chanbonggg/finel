package com.finel.backend.upload;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.http.MediaType;

@ExtendWith(OutputCaptureExtension.class)
class CloudinaryUploadServiceTest {
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
}

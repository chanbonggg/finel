package com.finel.backend.catalog;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class PdfInspector {
    private static final Pattern PAGES = Pattern.compile("(?m)^Pages:\\h+(\\d+)\\h*$");
    private static final Pattern ENCRYPTED = Pattern.compile("(?m)^Encrypted:\\h+(yes|no)\\b");

    public int inspect(Path file) throws IOException {
        try (var input = Files.newInputStream(file)) {
            if (!new String(input.readNBytes(5), StandardCharsets.US_ASCII).equals("%PDF-")) {
                throw invalid();
            }
        }
        if (!System.getProperty("os.name").toLowerCase(Locale.ROOT).contains("linux")) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "PDF 검증에는 Linux 컨테이너의 pdfinfo와 prlimit가 필요합니다.");
        }
        Path report = Files.createTempFile(file.getParent(), "inspect-", ".txt");
        Path errors = null;
        Process process = null;
        try {
            errors = Files.createTempFile(file.getParent(), "inspect-", ".err");
            // A separate process bounds untrusted PDF parsing independently of the API JVM.
            ProcessBuilder builder = new ProcessBuilder("prlimit", "--as=2147483648", "--cpu=30",
                    "--fsize=65536", "--", "pdfinfo", "-f", "1", "-l", "1", file.toString());
            builder.environment().clear();
            builder.environment().put("LC_ALL", "C");
            builder.environment().put("PATH", "/usr/bin:/bin");
            try {
                process = builder.redirectOutput(report.toFile()).redirectError(errors.toFile()).start();
            } catch (IOException exception) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "PDF 검증 도구를 실행할 수 없습니다.");
            }
            if (!process.waitFor(35, TimeUnit.SECONDS)) {
                throw invalid();
            }
            if (process.exitValue() != 0 || Files.size(errors) != 0 || Files.size(report) > 65536) {
                throw invalid();
            }
            return pageCount(Files.readString(report, StandardCharsets.UTF_8));
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "PDF 검증이 중단되었습니다.");
        } finally {
            if (process != null && process.isAlive()) {
                process.destroyForcibly();
                try { process.waitFor(5, TimeUnit.SECONDS); }
                catch (InterruptedException exception) { Thread.currentThread().interrupt(); }
            }
            Files.deleteIfExists(report);
            if (errors != null) Files.deleteIfExists(errors);
        }
    }

    static int pageCount(String report) {
        String pages = lastValue(PAGES, report);
        // pdfinfo prints user-supplied metadata before these fields.
        if (!"no".equals(lastValue(ENCRYPTED, report)) || pages == null) {
            throw invalid();
        }
        try {
            int count = Integer.parseInt(pages);
            if (count < 1) throw invalid();
            return count;
        } catch (NumberFormatException exception) {
            throw invalid();
        }
    }

    private static String lastValue(Pattern pattern, String report) {
        var matches = pattern.matcher(report);
        String value = null;
        while (matches.find()) value = matches.group(1);
        return value;
    }

    private static IllegalArgumentException invalid() {
        return new IllegalArgumentException("유효한 암호화되지 않은 PDF가 필요합니다. 검증 한도를 초과한 파일은 사용할 수 없습니다.");
    }
}

package com.finel.backend.catalog;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.*;
import java.time.Instant;
import java.time.Duration;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CatalogStorage {
    public static final long MAX_SIZE = 1_000_000_000L;
    public static final int CHUNK_SIZE = 8 * 1024 * 1024;
    private static final long DISK_RESERVE = 256L * 1024 * 1024;
    private static final Duration LIFETIME = Duration.ofHours(1);
    private static final Logger log = LoggerFactory.getLogger(CatalogStorage.class);
    private final Path root;
    private final CatalogRepository repository;
    private final PdfInspector inspector;
    private final Map<UUID, Upload> uploads = new HashMap<>();

    private static class Upload {
        final String owner;
        final long size;
        final Path path;
        final Instant expires = Instant.now().plus(LIFETIME);
        long received;
        int next;
        Upload(String owner, long size, Path path) {
            this.owner = owner; this.size = size; this.path = path;
        }
    }

    public record UploadResponse(UUID uploadId, int chunkSize, String expiresAt) {}
    public record Progress(int nextIndex, long receivedBytes) {}

    public CatalogStorage(@Value("${app.catalog.root:./data/catalogs}") Path root,
            CatalogRepository repository, PdfInspector inspector) {
        this.root = root.toAbsolutePath().normalize();
        this.repository = repository;
        this.inspector = inspector;
    }

    @PostConstruct
    void discardInterruptedUploads() throws IOException {
        Path temporary = root.resolve("temporary");
        if (!Files.isDirectory(temporary)) return;
        // Upload sessions are intentionally not resumable across API restarts (single writer volume).
        try (var files = Files.list(temporary)) {
            for (Path file : files.toList()) {
                if (Files.isRegularFile(file, LinkOption.NOFOLLOW_LINKS)) Files.delete(file);
            }
        }
    }

    public synchronized UploadResponse start(String owner, long size) throws IOException {
        if (size < 1) throw new IllegalArgumentException("파일 크기는 양수여야 합니다.");
        if (size > MAX_SIZE) throw tooLarge();
        cleanup();
        if (uploads.size() >= 4 || uploads.values().stream().anyMatch(upload -> upload.owner.equals(owner))) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "진행 중인 업로드를 완료하거나 취소하세요.");
        }
        Files.createDirectories(root.resolve("temporary"));
        Files.createDirectories(root.resolve("files"));
        long reserved = uploads.values().stream().mapToLong(upload -> upload.size - upload.received).sum();
        if (Files.getFileStore(root).getUsableSpace() < size + reserved + DISK_RESERVE) throw noSpace();
        UUID id = UUID.randomUUID();
        Path path = root.resolve("temporary").resolve(id + ".part");
        Files.createFile(path);
        Upload upload = new Upload(owner, size, path);
        uploads.put(id, upload);
        return new UploadResponse(id, CHUNK_SIZE, upload.expires.toString());
    }

    public synchronized Progress append(UUID id, String owner, int index, InputStream input) throws IOException {
        Upload upload = owned(id, owner);
        if (index != upload.next) throw new ResponseStatusException(HttpStatus.CONFLICT, "조각 순서가 올바르지 않습니다.");
        long expected = Math.min(CHUNK_SIZE, upload.size - upload.received);
        if (expected <= 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "모든 조각이 전송되었습니다.");
        if (Files.getFileStore(root).getUsableSpace() < expected + DISK_RESERVE) throw noSpace();
        Path chunk = root.resolve("temporary").resolve(id + ".chunk");
        try {
            try (OutputStream output = Files.newOutputStream(chunk)) {
                byte[] buffer = new byte[64 * 1024];
                long count = 0;
                int read;
                while ((read = input.read(buffer)) != -1) {
                    count += read;
                    if (count > expected) throw tooLarge();
                    output.write(buffer, 0, read);
                }
                if (count != expected) throw new IllegalArgumentException("조각 크기가 올바르지 않습니다.");
            }
            try (OutputStream output = Files.newOutputStream(upload.path, StandardOpenOption.APPEND)) {
                Files.copy(chunk, output);
            } catch (IOException exception) {
                // A partially appended chunk must never be retried against an uncertain offset.
                uploads.remove(id);
                Files.deleteIfExists(upload.path);
                throw exception;
            }
            upload.received += expected;
            upload.next++;
            return new Progress(upload.next, upload.received);
        } finally {
            Files.deleteIfExists(chunk);
        }
    }

    public synchronized CatalogResponse complete(UUID id, String owner) throws IOException {
        Upload upload = owned(id, owner);
        if (upload.received != upload.size) throw new ResponseStatusException(HttpStatus.CONFLICT, "파일 전송이 완료되지 않았습니다.");
        Path target = root.resolve("files").resolve(id + ".pdf");
        boolean moved = false;
        try {
            int pages = inspector.inspect(upload.path);
            Files.move(upload.path, target, StandardCopyOption.ATOMIC_MOVE);
            moved = true;
            // Repository commit completes before success; filesystem publication is compensated on failure.
            return CatalogResponse.from(repository.saveAndFlush(CatalogFile.create(id + ".pdf", upload.size, pages)));
        } catch (IOException | RuntimeException exception) {
            if (moved) Files.deleteIfExists(target);
            throw exception;
        } finally {
            uploads.remove(id);
            Files.deleteIfExists(upload.path);
        }
    }

    public synchronized void cancel(UUID id, String owner) throws IOException {
        Upload upload = owned(id, owner);
        Files.deleteIfExists(upload.path);
        uploads.remove(id);
    }

    public CatalogResponse metadata(Integer id) {
        return CatalogResponse.from(find(id));
    }

    public Resource resource(Integer id) throws IOException {
        CatalogFile catalog = find(id);
        String key = catalog.getStorageKey();
        if (!key.matches("[0-9a-f-]{36}\\.pdf")) throw new NoSuchElementException("카탈로그를 찾을 수 없습니다.");
        Path file = root.resolve("files").resolve(key);
        if (!Files.isRegularFile(file, LinkOption.NOFOLLOW_LINKS) || Files.size(file) != catalog.getSizeBytes()) {
            throw new NoSuchElementException("카탈로그 파일을 찾을 수 없습니다.");
        }
        return new FileSystemResource(file);
    }

    private CatalogFile find(Integer id) {
        return repository.findById(id).orElseThrow(() -> new NoSuchElementException("카탈로그를 찾을 수 없습니다."));
    }

    private Upload owned(UUID id, String owner) throws IOException {
        Upload upload = uploads.get(id);
        if (upload == null || !upload.owner.equals(owner)) throw new NoSuchElementException("업로드를 찾을 수 없습니다.");
        if (!upload.expires.isAfter(Instant.now())) {
            Files.deleteIfExists(upload.path);
            uploads.remove(id);
            throw new NoSuchElementException("업로드가 만료되었습니다.");
        }
        return upload;
    }

    @Scheduled(fixedDelay = 60_000, initialDelay = 60_000)
    public synchronized void cleanup() {
        var iterator = uploads.entrySet().iterator();
        while (iterator.hasNext()) {
            var entry = iterator.next();
            if (!entry.getValue().expires.isAfter(Instant.now())) {
                try {
                    Files.deleteIfExists(entry.getValue().path);
                    iterator.remove();
                } catch (IOException exception) {
                    log.warn("catalog cleanup failed: uploadId={} type={}", entry.getKey(), exception.getClass().getName());
                }
            }
        }
    }

    private static ResponseStatusException tooLarge() {
        return new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "파일 또는 조각 크기 한도를 초과했습니다.");
    }

    private static ResponseStatusException noSpace() {
        return new ResponseStatusException(HttpStatus.INSUFFICIENT_STORAGE, "파일 저장 공간이 부족합니다.");
    }
}

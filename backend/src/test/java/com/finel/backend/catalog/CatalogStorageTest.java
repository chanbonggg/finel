package com.finel.backend.catalog;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.io.*;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

class CatalogStorageTest {
    @TempDir Path root;
    final CatalogRepository repository = mock(CatalogRepository.class);
    final PdfInspector inspector = mock(PdfInspector.class);
    CatalogStorage storage;

    @BeforeEach void setup() throws Exception {
        storage = new CatalogStorage(root, repository, inspector);
        when(inspector.inspect(any())).thenReturn(10);
        when(repository.saveAndFlush(any())).thenAnswer(call -> {
            CatalogFile file = call.getArgument(0);
            ReflectionTestUtils.setField(file, "id", 1);
            when(repository.findById(1)).thenReturn(Optional.of(file));
            return file;
        });
    }

    @Test void supportsLimitWithoutAllocatingOneGigabyteAndRejectsOneByteOver() throws Exception {
        var upload = storage.start("admin", CatalogStorage.MAX_SIZE);
        assertThat(upload.chunkSize()).isEqualTo(8 * 1024 * 1024);
        assertThat(Files.size(root.resolve("temporary/" + upload.uploadId() + ".part"))).isZero();
        storage.cancel(upload.uploadId(), "admin");
        assertThatThrownBy(() -> storage.start("admin", CatalogStorage.MAX_SIZE + 1))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        exception -> assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE));
        assertThatThrownBy(() -> storage.start("admin", 0)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void sequentialChunksEnforceOwnershipSizeOrderAndCompletion() throws Exception {
        var id = storage.start("admin", 3).uploadId();
        assertThatThrownBy(() -> storage.start("admin", 3)).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> storage.append(id, "other", 0, bytes("abc"))).isInstanceOf(NoSuchElementException.class);
        assertThatThrownBy(() -> storage.append(id, "admin", 1, bytes("abc"))).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> storage.complete(id, "admin")).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> storage.append(id, "admin", 0, bytes("ab"))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> storage.append(id, "admin", 0, bytes("abcd"))).isInstanceOf(ResponseStatusException.class);
        var progress = storage.append(id, "admin", 0, bytes("abc"));
        assertThat(progress.receivedBytes()).isEqualTo(3);
        assertThatThrownBy(() -> storage.append(id, "admin", 0, bytes("abc"))).isInstanceOf(ResponseStatusException.class);
        var catalog = storage.complete(id, "admin");
        assertThat(catalog.pageCount()).isEqualTo(10);
        try (var input = storage.resource(1).getInputStream()) {
            assertThat(input.readAllBytes()).isEqualTo("abc".getBytes());
        }
        assertThatThrownBy(() -> storage.complete(id, "admin")).isInstanceOf(NoSuchElementException.class);
        try (var files = Files.list(root.resolve("temporary"))) { assertThat(files).isEmpty(); }
    }

    @Test void validationOrDatabaseFailureLeavesNoPublishedOrTemporaryFile() throws Exception {
        final var id = storage.start("admin", 3).uploadId();
        storage.append(id, "admin", 0, bytes("abc"));
        when(inspector.inspect(any())).thenThrow(new IllegalArgumentException("invalid"));
        assertThatThrownBy(() -> storage.complete(id, "admin")).isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(repository);
        doReturn(10).when(inspector).inspect(any());
        UUID failedId = storage.start("admin", 3).uploadId();
        storage.append(failedId, "admin", 0, bytes("abc"));
        doThrow(new org.springframework.dao.DataAccessResourceFailureException("db")).when(repository).saveAndFlush(any());
        assertThatThrownBy(() -> storage.complete(failedId, "admin")).isInstanceOf(org.springframework.dao.DataAccessException.class);
        try (var files = Files.list(root.resolve("files")); var temporary = Files.list(root.resolve("temporary"))) {
            assertThat(files).isEmpty();
            assertThat(temporary).isEmpty();
        }
    }

    @Test void cancellationExpiryAndRestartDiscardOnlyTemporaryFiles() throws Exception {
        var canceledId = storage.start("admin", 3).uploadId();
        assertThatThrownBy(() -> storage.cancel(canceledId, "other")).isInstanceOf(NoSuchElementException.class);
        storage.cancel(canceledId, "admin");
        var id = storage.start("admin", 3).uploadId();
        @SuppressWarnings("unchecked")
        Map<UUID, Object> sessions = (Map<UUID, Object>) ReflectionTestUtils.getField(storage, "uploads");
        ReflectionTestUtils.setField(sessions.get(id), "expires", Instant.EPOCH);
        storage.cleanup();
        assertThat(sessions).isEmpty();
        storage.start("admin", 3);
        Files.writeString(root.resolve("files/retained.pdf"), "retained");
        new CatalogStorage(root, repository, inspector).discardInterruptedUploads();
        assertThat(Files.readString(root.resolve("files/retained.pdf"))).isEqualTo("retained");
        try (var files = Files.list(root.resolve("temporary"))) { assertThat(files).isEmpty(); }
    }

    @Test void multipleChunksAreJoinedAndCrossSessionLimitIsBounded() throws Exception {
        var id = storage.start("admin", CatalogStorage.CHUNK_SIZE + 1).uploadId();
        storage.append(id, "admin", 0, new ByteArrayInputStream(new byte[CatalogStorage.CHUNK_SIZE]));
        storage.append(id, "admin", 1, bytes("x"));
        assertThat(storage.complete(id, "admin").sizeBytes()).isEqualTo(CatalogStorage.CHUNK_SIZE + 1);
        assertThat(Files.size(root.resolve("files/" + id + ".pdf"))).isEqualTo(CatalogStorage.CHUNK_SIZE + 1);
        for (int i = 0; i < 4; i++) storage.start("other-" + i, 1);
        assertThatThrownBy(() -> storage.start("fifth", 1)).isInstanceOf(ResponseStatusException.class);
    }

    private static InputStream bytes(String value) { return new ByteArrayInputStream(value.getBytes()); }
}

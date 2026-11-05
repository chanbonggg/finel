package com.finel.backend.catalog;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import java.nio.file.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class CatalogHttpTest {
    @TempDir Path root;

    @Test void publicFileStreamsFullAndPartialResponsesAndRejectsInvalidRange() throws Exception {
        String key = UUID.randomUUID() + ".pdf";
        Files.createDirectories(root.resolve("files"));
        Files.writeString(root.resolve("files").resolve(key), "%PDF-12345");
        CatalogFile file = CatalogFile.create(key, 10, 1);
        ReflectionTestUtils.setField(file, "id", 1);
        CatalogRepository repository = mock(CatalogRepository.class);
        when(repository.findById(1)).thenReturn(Optional.of(file));
        var mvc = MockMvcBuilders.standaloneSetup(new CatalogController(new CatalogStorage(root, repository, mock(PdfInspector.class))))
                .setControllerAdvice(new com.finel.backend.common.error.GlobalExceptionHandler()).build();
        mvc.perform(get("/api/catalogs/1/file"))
                .andExpect(status().isOk()).andExpect(header().string("Content-Length", "10"))
                .andExpect(content().string("%PDF-12345"));
        mvc.perform(get("/api/catalogs/1/file").header("Range", "bytes=0-4"))
                .andExpect(status().isPartialContent()).andExpect(header().string("Content-Range", "bytes 0-4/10"))
                .andExpect(content().string("%PDF-"));
        mvc.perform(get("/api/catalogs/1/file").header("Range", "bytes=0-1,8-9"))
                .andExpect(status().isPartialContent())
                .andExpect(header().string("Content-Type", org.hamcrest.Matchers.startsWith("multipart/byteranges")))
                .andExpect(header().doesNotExist("Content-Length"));
        mvc.perform(get("/api/catalogs/1/file").header("Range", "bytes=99-100"))
                .andExpect(status().isRequestedRangeNotSatisfiable())
                .andExpect(header().string("Content-Range", "bytes */10"))
                .andExpect(content().bytes(new byte[0]));
        mvc.perform(get("/api/catalogs/1/file").header("Range", ""))
                .andExpect(status().isRequestedRangeNotSatisfiable());
        mvc.perform(get("/api/catalogs/999/file")).andExpect(status().isNotFound());
        Files.delete(root.resolve("files").resolve(key));
        mvc.perform(get("/api/catalogs/1/file")).andExpect(status().isNotFound());
    }
}

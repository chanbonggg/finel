package com.finel.backend.catalog;

import static org.assertj.core.api.Assertions.*;
import java.nio.file.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class PdfInspectorTest {
    @TempDir Path root;

    @Test void metadataRequiresPositivePagesAndNoEncryption() {
        assertThat(PdfInspector.pageCount("Pages: 10\nEncrypted: no\n")).isEqualTo(10);
        assertThat(PdfInspector.pageCount("Title: x\nPages: 99\nPages: 10\nEncrypted: no\n")).isEqualTo(10);
        for (String report : new String[] {"Pages: 0\nEncrypted: no\n", "Pages: 2\nEncrypted: yes\n",
                "Pages: 9999999999999\nEncrypted: no\n", "Pages: 1\n",
                "Title: x\nEncrypted: no\nPages: 1\nEncrypted: yes (print:yes)\n"}) {
            assertThatThrownBy(() -> PdfInspector.pageCount(report)).isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Test void rejectsFilesWithForgedMimeTypeBeforeLaunchingParser() throws Exception {
        Path file = Files.writeString(root.resolve("fake.pdf"), "not pdf");
        assertThatThrownBy(() -> new PdfInspector().inspect(file)).isInstanceOf(IllegalArgumentException.class);
    }
}

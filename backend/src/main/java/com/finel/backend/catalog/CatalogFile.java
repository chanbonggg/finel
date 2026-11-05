package com.finel.backend.catalog;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "\"CatalogFile\"")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CatalogFile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(name = "\"storageKey\"", nullable = false, unique = true)
    private String storageKey;
    @Column(name = "\"sizeBytes\"", nullable = false)
    private long sizeBytes;
    @Column(name = "\"pageCount\"", nullable = false)
    private int pageCount;
    @Column(name = "\"createdAt\"", nullable = false)
    private LocalDateTime createdAt;

    public static CatalogFile create(String storageKey, long sizeBytes, int pageCount) {
        CatalogFile file = new CatalogFile();
        file.storageKey = storageKey;
        file.sizeBytes = sizeBytes;
        file.pageCount = pageCount;
        file.createdAt = LocalDateTime.now(ZoneOffset.UTC);
        return file;
    }
}

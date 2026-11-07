CREATE TABLE "CatalogFile" (
    "id" SERIAL PRIMARY KEY,
    "storageKey" VARCHAR(255) NOT NULL UNIQUE,
    "sizeBytes" BIGINT NOT NULL CHECK ("sizeBytes" BETWEEN 1 AND 1000000000),
    "pageCount" INTEGER NOT NULL CHECK ("pageCount" > 0),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "Product"
    ADD COLUMN "modelName" TEXT,
    ADD COLUMN "useCase" TEXT,
    ADD COLUMN "specifications" JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN "catalogFileId" INTEGER,
    ADD COLUMN "catalogPage" INTEGER,
    ADD CONSTRAINT "Product_specifications_array" CHECK (jsonb_typeof("specifications") = 'array'),
    ADD CONSTRAINT "Product_catalog_pair" CHECK (
        ("catalogFileId" IS NULL AND "catalogPage" IS NULL) OR
        ("catalogFileId" IS NOT NULL AND "catalogPage" IS NOT NULL AND "catalogPage" >= 1)),
    ADD CONSTRAINT "Product_catalogFileId_fkey" FOREIGN KEY ("catalogFileId")
        REFERENCES "CatalogFile"("id") ON DELETE RESTRICT;

CREATE INDEX "Product_catalogFileId_idx" ON "Product"("catalogFileId");

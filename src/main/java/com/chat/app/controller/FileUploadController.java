package com.chat.app.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.chat.app.dto.ImageUploadResponse;

@RestController
@RequestMapping("/files")
public class FileUploadController {

    private static final String IMAGE_DIRECTORY =
            "uploads/images";


    // =====================================================
    // UPLOAD IMAGE
    // =====================================================

    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadImage(
            @RequestParam("file")
            MultipartFile file) throws IOException {


        // =================================================
        // CHECK FILE
        // =================================================

        if (
            file == null ||
            file.isEmpty()
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                        "Image file is empty"
                    );

        }


        // =================================================
        // CHECK CONTENT TYPE
        // =================================================

        String contentType =
                file.getContentType();


        if (
            contentType == null ||
            !contentType.startsWith(
                "image/"
            )
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                        "Only image files are allowed"
                    );

        }


        // =================================================
        // MAXIMUM SIZE = 5 MB
        // =================================================

        if (
            file.getSize() >
            5 * 1024 * 1024
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                        "Image size must be less than 5 MB"
                    );

        }


        // =================================================
        // CREATE DIRECTORY
        // =================================================

        Path uploadDirectory =
                Paths.get(
                    IMAGE_DIRECTORY
                );


        Files.createDirectories(
            uploadDirectory
        );


        // =================================================
        // GET ORIGINAL EXTENSION
        // =================================================

        String originalFileName =
                file.getOriginalFilename();


        String extension =
                "";


        if (
            originalFileName != null &&
            originalFileName.contains(".")
        ) {

            extension =
                originalFileName.substring(
                    originalFileName
                        .lastIndexOf(".")
                );

        }


        // =================================================
        // UNIQUE FILE NAME
        // =================================================

        String fileName =
                UUID.randomUUID()
                    .toString()
                +
                extension;


        // =================================================
        // FILE PATH
        // =================================================

        Path filePath =
                uploadDirectory.resolve(
                    fileName
                );


        // =================================================
        // SAVE FILE
        // =================================================

        Files.copy(
            file.getInputStream(),
            filePath,
            StandardCopyOption
                .REPLACE_EXISTING
        );


        // =================================================
        // RETURN URL
        // =================================================

        String fileUrl =
                "/uploads/images/"
                +
                fileName;


        return ResponseEntity.ok(
            new ImageUploadResponse(
                fileUrl
            )
        );

    }
    
    // =====================================================
    // UPLOAD GENERAL FILE
    // =====================================================

    private static final String FILE_DIRECTORY =
            "uploads/files";


    @PostMapping("/upload-file")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file")
            MultipartFile file) throws IOException {


        // =================================================
        // CHECK FILE
        // =================================================

        if (
            file == null ||
            file.isEmpty()
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                        "File is empty"
                    );

        }


        // =================================================
        // MAXIMUM SIZE = 10 MB
        // =================================================

        if (
            file.getSize() >
            10 * 1024 * 1024
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                        "File size must be less than 10 MB"
                    );

        }


        // =================================================
        // CREATE DIRECTORY
        // =================================================

        Path uploadDirectory =
                Paths.get(
                    FILE_DIRECTORY
                );


        Files.createDirectories(
            uploadDirectory
        );


        // =================================================
        // GET ORIGINAL FILE NAME
        // =================================================

        String originalFileName =
                file.getOriginalFilename();


        if (
            originalFileName == null ||
            originalFileName.isBlank()
        ) {

            originalFileName =
                    "file";

        }


        // =================================================
        // GET EXTENSION
        // =================================================

        String extension =
                "";


        if (
            originalFileName.contains(".")
        ) {

            extension =
                originalFileName.substring(
                    originalFileName
                        .lastIndexOf(".")
                );

        }


        // =================================================
        // UNIQUE FILE NAME
        // =================================================

        String fileName =
                UUID.randomUUID()
                    .toString()
                +
                extension;


        // =================================================
        // SAVE FILE
        // =================================================

        Path filePath =
                uploadDirectory.resolve(
                    fileName
                );


        Files.copy(
            file.getInputStream(),
            filePath,
            StandardCopyOption
                .REPLACE_EXISTING
        );


        // =================================================
        // RETURN FILE URL + ORIGINAL NAME
        // =================================================

        String fileUrl =
                "/uploads/files/"
                +
                fileName;


        return ResponseEntity.ok(
            Map.of(
                "fileUrl", fileUrl,
                "fileName", originalFileName
            )
        );

    }

}
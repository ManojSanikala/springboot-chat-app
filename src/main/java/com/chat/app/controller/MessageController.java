package com.chat.app.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.Principal;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.chat.app.dto.ChatHistoryResponse;
import com.chat.app.dto.DeleteResponse;
import com.chat.app.dto.ImageUploadResponse;
import com.chat.app.dto.MessageRequest;
import com.chat.app.model.Message;
import com.chat.app.service.MessageService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/messages")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@Valid @RequestBody MessageRequest request) {
    	
        Message saved = messageService.saveMessage(request);
        if(saved == null) {
        	return ResponseEntity.badRequest().body("User not found. Join first");
        }
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/conversation")
    public ResponseEntity<List<ChatHistoryResponse>> getConversation(
            @RequestParam("receiver") String receiver,
            Principal principal) {

        System.out.println("=================================");
        System.out.println("CONVERSATION API CALLED");
        System.out.println("LOGGED USER : " +
                (principal != null
                    ? principal.getName()
                    : "NULL"));

        System.out.println("RECEIVER : " + receiver);
        System.out.println("=================================");


        if (principal == null) {

            return ResponseEntity.status(401).build();
        }


        String sender = principal.getName();


        List<ChatHistoryResponse> conversation =
                messageService.getConversation(
                        sender,
                        receiver
                );


        System.out.println(
                "HISTORY SIZE : " +
                conversation.size()
        );


        return ResponseEntity.ok(conversation);
    }
    @GetMapping("/all")
    public ResponseEntity<List<Message>> getMessages() {

        List<Message> messages = messageService.getAllMessages();

        return ResponseEntity.ok(messages);
    }
    
    @GetMapping("/history")
    public List<ChatHistoryResponse> getChatHistory(){
    	return messageService.getChatHistory();
    }
    
    @DeleteMapping("/delete/{messageId}")
    public ResponseEntity<DeleteResponse> deleteForMe(
            @PathVariable Long messageId,
            Principal principal) {

        messageService.deleteForMe(messageId, principal.getName());

        return ResponseEntity.ok(
                new DeleteResponse("Message deleted successfully")
        );
    }
    
    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadImage(
            @RequestParam("file") MultipartFile file)
            throws IOException {

        if (file == null || file.isEmpty()) {

            return ResponseEntity
                    .badRequest()
                    .body("Image file is empty");
        }


        /*
         * Validate content type
         */

        String contentType =
                file.getContentType();


        if (contentType == null ||
            !contentType.startsWith("image/")) {

            return ResponseEntity
                    .badRequest()
                    .body("Only image files are allowed");
        }


        /*
         * Maximum 5 MB
         */

        if (file.getSize() > 5 * 1024 * 1024) {

            return ResponseEntity
                    .badRequest()
                    .body("Image size must be less than 5 MB");
        }


        /*
         * Upload directory
         */

        Path uploadDirectory =
                Paths.get("uploads/images");


        Files.createDirectories(
                uploadDirectory
        );


        /*
         * Generate unique filename
         */

        String originalName =
                file.getOriginalFilename();


        String extension =
                "";


        if (originalName != null &&
            originalName.contains(".")) {

            extension =
                    originalName.substring(
                            originalName.lastIndexOf(".")
                    );

        }


        String fileName =
                UUID.randomUUID()
                        .toString()
                        + extension;


        /*
         * Save file
         */

        Path filePath =
                uploadDirectory.resolve(
                        fileName
                );


        Files.copy(
                file.getInputStream(),
                filePath,
                StandardCopyOption.REPLACE_EXISTING
        );


        /*
         * URL used by frontend
         */

        String fileUrl =
                "/uploads/images/" +
                fileName;


        return ResponseEntity.ok(
                new ImageUploadResponse(
                        fileUrl
                )
        );
    }
    
}
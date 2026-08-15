package com.chat.app.controller;

import java.security.Principal;
import java.util.List;

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

import com.chat.app.dto.ChatHistoryResponse;
import com.chat.app.dto.DeleteResponse;
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
    
}
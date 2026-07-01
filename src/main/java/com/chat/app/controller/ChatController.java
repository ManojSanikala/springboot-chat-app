package com.chat.app.controller;

import java.security.Principal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.chat.app.dto.ChatMessage;
import com.chat.app.dto.DeleteMessageEvent;
import com.chat.app.dto.MessageStatusUpdate;
import com.chat.app.dto.TypingMessage;
import com.chat.app.repository.UserRepository;
import com.chat.app.service.MessageService;

@Controller
public class ChatController {
	
	@Autowired
	private MessageService messageService;

	@Autowired
	private UserRepository userRepository;
	
	@Autowired
	private SimpMessagingTemplate messagingTemplate;

	@MessageMapping("/send")
	public void sendMessage(ChatMessage message, Principal principal) {

	    String sender = principal.getName();
//	    if (sender.equals(message.getReceiver())) {
//	        return;
//	    }
	    message.setSender(sender);

	    // Save into database
	    messageService.savePrivateMessage(
	            sender,
	            message.getReceiver(),
	            message.getContent()
	    );

	    // Send to receiver
	    messagingTemplate.convertAndSendToUser(
	            message.getReceiver(),
	            "/queue/messages",
	            message
	    );
	}
	@MessageMapping("/typing")
	public void typing(TypingMessage typingMessage, Principal principal) {

	    typingMessage.setSender(principal.getName());
//	    if (typingMessage.getSender().equals(typingMessage.getReceiver())) {
//	        return;
//	    }
	    messagingTemplate.convertAndSendToUser(
	            typingMessage.getReceiver(),
	            "/queue/typing",
	            typingMessage
	    );
	}
	
	@MessageMapping("/delivered")
	public void delivered(MessageStatusUpdate update,
	                      Principal principal) {

	    String receiver = principal.getName();

	    messageService.markAsDelivered(
	            update.getSender(),
	            receiver
	    );

	    messagingTemplate.convertAndSendToUser(
	            update.getSender(),
	            "/queue/status",
	            "DELIVERED"
	    );
	}
	
	@MessageMapping("/read")
	public void read(MessageStatusUpdate update,
	                 Principal principal) {

	    String receiver = principal.getName();

	    System.out.println("Sender   : " + update.getSender());
	    System.out.println("Receiver : " + receiver);

	    messageService.markAsRead(
	            update.getSender(),
	            receiver
	    );

	    messagingTemplate.convertAndSendToUser(
	            update.getSender(),
	            "/queue/status",
	            "READ"
	    );
	}
	
	@MessageMapping("/delete")
	public void deleteMessage(DeleteMessageEvent event,
	                          Principal principal) {

	    String username = principal.getName();

	    messageService.deleteForMe(
	            event.getMessageId(),
	            username
	    );

	    event.setUsername(username);

	    messagingTemplate.convertAndSendToUser(
	            username,
	            "/queue/delete",
	            event
	    );

	}
	
	
}
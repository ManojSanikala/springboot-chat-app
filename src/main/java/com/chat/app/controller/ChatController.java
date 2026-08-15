package com.chat.app.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.chat.app.dto.ChatMessage;
import com.chat.app.dto.DeleteForEveryoneEvent;
import com.chat.app.dto.DeleteMessageEvent;
import com.chat.app.dto.EditMessageEvent;
import com.chat.app.dto.MessageResponse;
import com.chat.app.dto.MessageStatusEvent;
import com.chat.app.dto.MessageStatusUpdate;
import com.chat.app.dto.TypingMessage;
import com.chat.app.dto.UnreadCountEvent;
import com.chat.app.model.Message;
import com.chat.app.service.MessageService;

@Controller
public class ChatController {
	
	@Autowired
	private MessageService messageService;

	@Autowired
	private SimpMessagingTemplate messagingTemplate;

	@MessageMapping("/send")
	public void sendMessage(ChatMessage message, Principal principal) {

	    // Get logged-in sender
	    String sender = principal.getName();

	    // Set sender from JWT authentication
	    message.setSender(sender);

	    // Save message into database
	    Message savedMessage =
	            messageService.savePrivateMessage(
	                    sender,
	                    message.getReceiver(),
	                    message.getContent(),
	                    message.getReplyToMessageId(),
	                    message.getReplyToContent()
	            );

	    // Convert Entity -> Response DTO
	    MessageResponse response = new MessageResponse(
	            savedMessage.getId(),
	            savedMessage.getSender().getUsername(),
	            savedMessage.getReceiver().getUsername(),
	            savedMessage.getContent(),
	            savedMessage.getTimestamp(),
	            savedMessage.getStatus(),
	            savedMessage.isEdited(),
	            savedMessage.getReplyToMessageId(),
	            savedMessage.getReplyToContent()
	    );

	    // =====================================================
	    // Send message to Receiver
	    // =====================================================

	    messagingTemplate.convertAndSendToUser(
	            message.getReceiver(),
	            "/queue/messages",
	            response
	    );

	 // =====================================================
	 // Calculate Receiver's Unread Count
	 // =====================================================

	 long unreadCount =
	         messageService.getUnreadCount(
	                 sender,
	                 message.getReceiver()
	         );


	 // =====================================================
	 // Send Live Unread Count to Receiver
	 // =====================================================

	 UnreadCountEvent unreadEvent =
	         new UnreadCountEvent(
	                 sender,
	                 unreadCount
	         );


	 messagingTemplate.convertAndSendToUser(
	         message.getReceiver(),
	         "/queue/unread",
	         unreadEvent
	 );
	 
	    // =====================================================
	    // Send message to Sender
	    // =====================================================

	    messagingTemplate.convertAndSendToUser(
	            sender,
	            "/queue/messages",
	            response
	    );

	    // =====================================================
	    // Calculate Receiver's Unread Count
	    // =====================================================

//	    long unreadCount =
//	            messageService.getUnreadCount(
//	                    sender,
//	                    message.getReceiver()
//	            );
//
//	    // =====================================================
//	    // Send Live Unread Count to Receiver
//	    // =====================================================
//
//	    UnreadCountEvent unreadEvent =
//	            new UnreadCountEvent(
//	                    sender,
//	                    unreadCount
//	            );
//
//	    messagingTemplate.convertAndSendToUser(
//	            message.getReceiver(),
//	            "/queue/unread",
//	            unreadEvent
//	    );
	}
	@MessageMapping("/typing")
	public void typing(TypingMessage typingMessage, Principal principal) {

	    typingMessage.setSender(principal.getName());
	 // Prevent typing to yourself
	    if (typingMessage.getSender().equalsIgnoreCase(typingMessage.getReceiver())) {
	        return;
	    }
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

	    // Mark SENT messages as DELIVERED
	    List<Message> updatedMessages =
	            messageService.markAsDelivered(
	                    update.getSender(),
	                    receiver
	            );

	    // Send live DELIVERED status to sender
	    for (Message message : updatedMessages) {

	        MessageStatusEvent event =
	                new MessageStatusEvent(
	                        message.getId(),
	                        message.getStatus().name()
	                );

	        messagingTemplate.convertAndSendToUser(
	                update.getSender(),
	                "/queue/status",
	                event
	        );
	    }

	    // =====================================================
	    // Calculate unread count
	    // =====================================================

	    long unreadCount =
	            messageService.getUnreadCount(
	                    update.getSender(),
	                    receiver
	            );

	    // =====================================================
	    // Send unread count to receiver
	    // =====================================================

	    UnreadCountEvent unreadEvent =
	            new UnreadCountEvent(
	                    update.getSender(),
	                    unreadCount
	            );

	    messagingTemplate.convertAndSendToUser(
	            receiver,
	            "/queue/unread",
	            unreadEvent
	    );
	}
	@MessageMapping("/read")
	public void read(MessageStatusUpdate update,
	                 Principal principal) {

	    String receiver = principal.getName();

	    // Mark DELIVERED messages as READ
	    List<Message> updatedMessages =
	            messageService.markAsRead(
	                    update.getSender(),
	                    receiver
	            );

	    // Send live READ status to sender
	    for (Message message : updatedMessages) {

	        MessageStatusEvent event =
	                new MessageStatusEvent(
	                        message.getId(),
	                        message.getStatus().name()
	                );

	        messagingTemplate.convertAndSendToUser(
	                update.getSender(),
	                "/queue/status",
	                event
	        );
	    }

	    // After reading, unread count should be 0
	    long unreadCount =
	            messageService.getUnreadCount(
	                    update.getSender(),
	                    receiver
	            );

	    UnreadCountEvent unreadEvent =
	            new UnreadCountEvent(
	                    update.getSender(),
	                    unreadCount
	            );

	    messagingTemplate.convertAndSendToUser(
	            receiver,
	            "/queue/unread",
	            unreadEvent
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
	
	@MessageMapping("/deleteForEveryone")
	public void deleteForEveryone(DeleteForEveryoneEvent event,
	                              Principal principal) {

	    String username = principal.getName();

	    // Update database
	    messageService.deleteForEveryone(
	            event.getMessageId(),
	            username
	    );

	    // Get updated message from DB
	    Message message = messageService.getMessageById(event.getMessageId());

	    // Prepare event
	    DeleteForEveryoneEvent response = new DeleteForEveryoneEvent(
	            message.getId(),
	            message.getContent(),
	            message.getStatus().name()
	    );

	    // Notify sender
	    messagingTemplate.convertAndSendToUser(
	            message.getSender().getUsername(),
	            "/queue/deleteForEveryone",
	            response
	    );

	    // Notify receiver
	    messagingTemplate.convertAndSendToUser(
	            message.getReceiver().getUsername(),
	            "/queue/deleteForEveryone",
	            response
	    );
	}
	
	
	/* =====================================================
	   EDIT MESSAGE
	===================================================== */

	@MessageMapping("/edit")
	public void editMessage(
	        EditMessageEvent event,
	        Principal principal) {

	    String username =
	            principal.getName();

	    System.out.println(
	        "========== EDIT REQUEST =========="
	    );

	    System.out.println(
	        "Message ID: " +
	        event.getMessageId()
	    );

	    System.out.println(
	        "Content: " +
	        event.getContent()
	    );

	    System.out.println(
	        "User: " +
	        username
	    );


	    Message message =
	            messageService.editMessage(
	                event.getMessageId(),
	                username,
	                event.getContent()
	            );


	    EditMessageEvent response =
	            new EditMessageEvent(

	                message.getId(),

	                message.getContent(),

	                message.getSender()
	                    .getUsername(),

	                message.getReceiver()
	                    .getUsername(),

	                message.isEdited()
	            );


	    messagingTemplate.convertAndSendToUser(

	        message.getSender()
	            .getUsername(),

	        "/queue/edit",

	        response
	    );


	    messagingTemplate.convertAndSendToUser(

	        message.getReceiver()
	            .getUsername(),

	        "/queue/edit",

	        response
	    );


	    System.out.println(
	        "========== EDIT SUCCESS =========="
	    );
	}
}
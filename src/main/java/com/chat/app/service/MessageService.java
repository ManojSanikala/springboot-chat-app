package com.chat.app.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chat.app.dto.ChatHistoryResponse;
import com.chat.app.dto.MessageRequest;
import com.chat.app.enums.MessageStatus;
import com.chat.app.exception.UserNotFoundException;
import com.chat.app.model.Message;
import com.chat.app.model.User;
import com.chat.app.repository.MessageRepository;
import com.chat.app.repository.UserRepository;

@Service
public class MessageService {

	@Autowired
	private MessageRepository messageRepository;

	@Autowired
	private UserRepository userRepository;

	// Used by REST API
	public Message saveMessage(MessageRequest request) {

		User user = userRepository.findById(request.getUserId())
				.orElseThrow(() -> new UserNotFoundException("User not found with id " + request.getUserId()));

		Message message = new Message();

		message.setSender(user);
		message.setReceiver(null);
		message.setContent(request.getContent());
		message.setTimestamp(request.getTimestamp());

		// NEW
		message.setStatus(MessageStatus.SENT);

		return messageRepository.save(message);
	}

	// Using by WebSocket
	public Message saveMessage(User sender, User receiver, String content) {

		Message message = new Message();

		message.setSender(sender);
		message.setReceiver(receiver);

		message.setContent(content);
		message.setTimestamp(java.time.LocalDateTime.now().toString());

		message.setStatus(MessageStatus.SENT);
		return messageRepository.save(message);
	}

	public Message savePrivateMessage(
	        String senderUsername,
	        String receiverUsername,
	        String content,
	        Long replyToMessageId,
	        String replyToContent) {

	    User sender =
	            userRepository
	                .findByUsername(senderUsername)
	                .orElseThrow(() ->
	                    new UserNotFoundException(
	                        "Sender not found"
	                    )
	                );


	    User receiver =
	            userRepository
	                .findByUsername(receiverUsername)
	                .orElseThrow(() ->
	                    new UserNotFoundException(
	                        "Receiver not found"
	                    )
	                );


	    Message message = new Message();

	    message.setSender(sender);

	    message.setReceiver(receiver);

	    message.setContent(content);

	    message.setTimestamp(
	        java.time.LocalDateTime
	            .now()
	            .toString()
	    );

	    message.setStatus(
	        MessageStatus.SENT
	    );


	    /*
	     * Reply information
	     */
	    message.setReplyToMessageId(
	        replyToMessageId
	    );

	    message.setReplyToContent(
	        replyToContent
	    );


	    return messageRepository.save(message);
	}

	@Transactional(readOnly = true)
	public List<ChatHistoryResponse> getConversation(
	        String user1,
	        String user2) {

	    System.out.println("=================================");
	    System.out.println("CHAT HISTORY REQUEST");
	    System.out.println("USER 1 : " + user1);
	    System.out.println("USER 2 : " + user2);
	    System.out.println("=================================");


	    List<Message> messages =
	            messageRepository.findConversation(
	                    user1,
	                    user2
	            );


	    System.out.println(
	            "MESSAGES FOUND : " + messages.size()
	    );


	    return messages.stream()

	            .filter(message -> {

	                /*
	                 * Sender deleted for himself
	                 */

	                if (
	                    message.getSender()
	                           .getUsername()
	                           .equals(user1)
	                    &&
	                    message.isDeletedBySender()
	                ) {

	                    return false;
	                }


	                /*
	                 * Receiver deleted for himself
	                 */

	                if (
	                    message.getReceiver()
	                           .getUsername()
	                           .equals(user1)
	                    &&
	                    message.isDeletedByReceiver()
	                ) {

	                    return false;
	                }


	                return true;
	            })

	            .map(message -> {

	                System.out.println(
	                    "MESSAGE ID : " +
	                    message.getId() +
	                    " | FROM : " +
	                    message.getSender().getUsername() +
	                    " | CONTENT : " +
	                    message.getContent()
	                );


	                return new ChatHistoryResponse(

	                        message.getId(),

	                        message.getSender()
	                               .getUsername(),

	                        message.getContent(),

	                        message.getTimestamp(),

	                        message.getStatus(),

	                        message.isEdited(),

	                        message.getReplyToMessageId(),

	                        message.getReplyToContent()
	                );

	            })

	            .toList();
	}
	public List<Message> markAsDelivered(String senderUsername, String receiverUsername) {

		List<Message> messages = messageRepository.findBySenderUsernameAndReceiverUsernameAndStatus(senderUsername,
				receiverUsername, MessageStatus.SENT);

		for (Message message : messages) {

			message.setStatus(MessageStatus.DELIVERED);
		}

		return messageRepository.saveAll(messages);
	}

	public List<Message> markAsRead(
	        String senderUsername,
	        String receiverUsername) {

	    List<Message> messages =
	            messageRepository
	                .findBySenderUsernameAndReceiverUsernameAndStatusIn(
	                    senderUsername,
	                    receiverUsername,
	                    List.of(
	                        MessageStatus.SENT,
	                        MessageStatus.DELIVERED
	                    )
	                );

	    for (Message message : messages) {

	        message.setStatus(MessageStatus.READ);

	    }

	    return messageRepository.saveAll(messages);
	}
	
	

	public List<Message> getAllMessages() {
		return messageRepository.findAll();
	}

	public List<ChatHistoryResponse> getChatHistory() {

	    return messageRepository
	            .findAll()
	            .stream()

	            .map(message -> new ChatHistoryResponse(
	                    message.getId(),
	                    message.getSender().getUsername(),
	                    message.getContent(),
	                    message.getTimestamp(),
	                    message.getStatus(),
	                    message.isEdited(),
	                    message.getReplyToMessageId(),
	                    message.getReplyToContent()))

	            .collect(Collectors.toList());
	}

	public Message getMessageById(Long messageId) {

		return messageRepository.findById(messageId).orElseThrow(() -> new RuntimeException("Message not found"));
	}

	public void deleteForMe(Long messageId, String username) {

		Message message = messageRepository.findById(messageId)
				.orElseThrow(() -> new RuntimeException("Message not found"));

		if (message.getSender().getUsername().equals(username)) {

			message.setDeletedBySender(true);

		} else if (message.getReceiver().getUsername().equals(username)) {

			message.setDeletedByReceiver(true);

		} else {

			throw new RuntimeException("You are not allowed to delete this message");

		}

		messageRepository.save(message);
	}

	public void deleteForEveryone(Long messageId, String username) {

		Message message = messageRepository.findById(messageId)
				.orElseThrow(() -> new RuntimeException("Message not found"));

		// Only sender can delete for everyone
		if (!message.getSender().getUsername().equals(username)) {
			throw new RuntimeException("Only sender can delete this message for everyone");
		}

		message.setContent("This message was deleted");
		message.setStatus(MessageStatus.DELETED);

		messageRepository.save(message);
	}

	
	public long getUnreadCount(String sender, String receiver) {

	    return messageRepository
	            .countBySenderUsernameAndReceiverUsernameAndStatus(
	                    sender,
	                    receiver,
	                    MessageStatus.DELIVERED
	            );
	}
	
	
	/*
	 * =====================================================
	 * Edit Message
	 * Only sender can edit their own message.
	 * =====================================================
	 */
	public Message editMessage(
        Long messageId,
        String username,
        String newContent) {

    Message message =
            messageRepository
                .findById(messageId)
                .orElseThrow(() ->
                    new RuntimeException(
                        "Message not found"
                    )
                );


    if (!message.getSender()
            .getUsername()
            .equals(username)) {

        throw new RuntimeException(
            "Only sender can edit this message"
        );
    }


    if (message.getStatus()
            == MessageStatus.DELETED) {

        throw new RuntimeException(
            "Deleted message cannot be edited"
        );
    }


    if (newContent == null ||
        newContent.trim().isEmpty()) {

        throw new RuntimeException(
            "Message content cannot be empty"
        );
    }


    message.setContent(
        newContent.trim()
    );

    message.setEdited(true);


    return messageRepository.save(message);
}
}
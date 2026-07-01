package com.chat.app.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
	            .orElseThrow(() -> new UserNotFoundException(
	                    "User not found with id " + request.getUserId()));

	    Message message = new Message();

	    message.setSender(user);
	    message.setReceiver(null);
	    message.setContent(request.getContent());
	    message.setTimestamp(request.getTimestamp());

	    // NEW
	    message.setStatus(MessageStatus.SENT);

	    return messageRepository.save(message);
	}

    //Using by WebSocket
	public Message saveMessage(User sender, User receiver, String content) {

	    Message message = new Message();

	    message.setSender(sender);
	    message.setReceiver(receiver);
	
	    message.setContent(content);
	    message.setTimestamp(java.time.LocalDateTime.now().toString());

	    message.setStatus(MessageStatus.SENT);
	    return messageRepository.save(message);
	}
	
	public Message savePrivateMessage(String senderUsername, String receiverUsername,String content) {
		User sender = userRepository.findByUsername(senderUsername)
						.orElseThrow(() ->
						new UserNotFoundException("Sender not found"));
		
		User receiver = userRepository.findByUsername(receiverUsername)
						.orElseThrow(()-> new UserNotFoundException("Receiver not found"));
		
		Message message = new Message();
		message.setSender(sender);
		message.setReceiver(receiver);
		message.setContent(content);
		message.setTimestamp(java.time.LocalDateTime.now().toString());

		message.setStatus(MessageStatus.SENT);

		return messageRepository.save(message);
					
	}
	
	public List<ChatHistoryResponse> getConversation(String user1, String user2) {

	    List<Message> messages =
	            messageRepository
	            .findBySenderUsernameAndReceiverUsernameOrSenderUsernameAndReceiverUsernameOrderByIdAsc(
	                    user1,
	                    user2,
	                    user2,
	                    user1
	            );

	    return messages.stream()

	            .filter(message -> {

	                // Sender deleted the message
	                if (message.getSender().getUsername().equals(user1)
	                        && message.isDeletedBySender()) {
	                    return false;
	                }

	                // Receiver deleted the message
	                if (message.getReceiver().getUsername().equals(user1)
	                        && message.isDeletedByReceiver()) {
	                    return false;
	                }

	                return true;
	            })

	            .map(message -> new ChatHistoryResponse(
	                    message.getId(),
	                    message.getSender().getUsername(),
	                    message.getContent(),
	                    message.getTimestamp(),
	                    message.getStatus()
	            ))
	            .toList();
	}
	
	public void markAsDelivered(String senderUsername, String receiverUsername) {

	    List<Message> messages =
	            messageRepository.findBySenderUsernameAndReceiverUsernameAndStatus(
	                    senderUsername,
	                    receiverUsername,
	                    MessageStatus.SENT
	            );

	    for (Message message : messages) {

	        message.setStatus(MessageStatus.DELIVERED);

	        messageRepository.save(message);
	    }
	}
	
	public void markAsRead(String senderUsername, String receiverUsername) {

	    List<Message> messages =
	            messageRepository.findBySenderUsernameAndReceiverUsernameAndStatus(
	                    senderUsername,
	                    receiverUsername,
	                    MessageStatus.DELIVERED
	            );

	    if (messages.isEmpty()) {
	        return;
	    }

	    for (Message message : messages) {
	        message.setStatus(MessageStatus.READ);
	    }

	    messageRepository.saveAll(messages);
	}
	
	
    public List<Message> getAllMessages() {
        return messageRepository.findAll();
    }
    
    
    public List<ChatHistoryResponse> getChatHistory() {

        return messageRepository.findAll()
                .stream()
                .map(message -> new ChatHistoryResponse(
                        message.getId(),
                        message.getSender().getUsername(),
                        message.getContent(),
                        message.getTimestamp(),
                        message.getStatus()
                ))
                .collect(Collectors.toList());
    }
    
    
    
    public void deleteForMe(Long messageId, String username) {

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() ->
                        new RuntimeException("Message not found"));

        if (message.getSender().getUsername().equals(username)) {

            message.setDeletedBySender(true);

        } else if (message.getReceiver().getUsername().equals(username)) {

            message.setDeletedByReceiver(true);

        } else {

            throw new RuntimeException("You are not allowed to delete this message");

        }

        messageRepository.save(message);
    }
    
    
}
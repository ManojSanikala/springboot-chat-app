package com.chat.app.model;

import com.chat.app.enums.MessageStatus;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "messages")
public class Message {
		@Id
		@GeneratedValue(strategy = GenerationType.IDENTITY)
		private Long id;
		@ManyToOne
		@JoinColumn(name = "sender_id")
		private User sender;

		@ManyToOne
		@JoinColumn(name = "receiver_id")
		private User receiver;
	    private String content;
	    private String timestamp;
	    
	    @Enumerated(EnumType.STRING)
	    private MessageStatus status;
	    
	    private boolean deletedBySender = false;

	    private boolean deletedByReceiver = false;
	    
	    
		public Message() {
			super();
		}
		public Message(Long id, User sender, User receiver, String content,
	               String timestamp, MessageStatus status,
	               boolean deletedBySender,
	               boolean deletedByReceiver) {

	    this.id = id;
	    this.sender = sender;
	    this.receiver = receiver;
	    this.content = content;
	    this.timestamp = timestamp;
	    this.status = status;
	    this.deletedBySender = deletedBySender;
	    this.deletedByReceiver = deletedByReceiver;
	}
		public Long getId() {
			return id;
		}
		public void setId(Long id) {
			this.id = id;
		}
		public User getSender() {
			return sender;
		}
		public void setSender(User sender) {
			this.sender = sender;
		}
		public User getReceiver() {
			return receiver;
		}
		public void setReceiver(User receiver) {
			this.receiver = receiver;
		}
		public String getContent() {
			return content;
		}
		public void setContent(String content) {
			this.content = content;
		}
		public String getTimestamp() {
			return timestamp;
		}
		public void setTimestamp(String timestamp) {
			this.timestamp = timestamp;
		}
		
		public MessageStatus getStatus() {
		    return status;
		}

		public void setStatus(MessageStatus status) {
		    this.status = status;
		}
		public boolean isDeletedBySender() {
		    return deletedBySender;
		}

		public void setDeletedBySender(boolean deletedBySender) {
		    this.deletedBySender = deletedBySender;
		}

		public boolean isDeletedByReceiver() {
		    return deletedByReceiver;
		}

		public void setDeletedByReceiver(boolean deletedByReceiver) {
		    this.deletedByReceiver = deletedByReceiver;
		}
		
	    
}

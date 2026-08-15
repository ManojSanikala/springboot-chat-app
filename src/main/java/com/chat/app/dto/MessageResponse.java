package com.chat.app.dto;

import com.chat.app.enums.MessageStatus;

public class MessageResponse {

    private Long id;

    private String sender;

    private String receiver;

    private String content;

    private String timestamp;

    private MessageStatus status;

    private boolean edited;
    
    private Long replyToMessageId;

    private String replyToContent;


    public MessageResponse() {
    }


    public MessageResponse(
            Long id,
            String sender,
            String receiver,
            String content,
            String timestamp,
            MessageStatus status,
            boolean edited,
            Long replyToMessageId,
            String replyToContent) {

        this.id = id;
        this.sender = sender;
        this.receiver = receiver;
        this.content = content;
        this.timestamp = timestamp;
        this.status = status;
        this.edited = edited;
        this.replyToMessageId = replyToMessageId;
        this.replyToContent = replyToContent;
    }


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }


    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }


    public String getReceiver() {
        return receiver;
    }

    public void setReceiver(String receiver) {
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


    public boolean isEdited() {
        return edited;
    }

    public void setEdited(boolean edited) {
        this.edited = edited;
    }
    
    public Long getReplyToMessageId() {
        return replyToMessageId;
    }

    public void setReplyToMessageId(Long replyToMessageId) {
        this.replyToMessageId = replyToMessageId;
    }

    public String getReplyToContent() {
        return replyToContent;
    }

    public void setReplyToContent(String replyToContent) {
        this.replyToContent = replyToContent;
    }
}
package com.chat.app.dto;

import com.chat.app.enums.MessageStatus;

public class ChatHistoryResponse {

    private Long id;

    private String sender;

    private String content;

    private String timestamp;

    private MessageStatus status;

    private boolean edited;

    private Long replyToMessageId;

    private String replyToContent;
    
    private boolean forwarded;

    /*
     * =====================================================
     * MESSAGE TYPE
     * =====================================================
     *
     * TEXT
     * IMAGE
     * DOCUMENT
     * FILE
     */
    private String messageType = "TEXT";
    
    private String fileName;


    public ChatHistoryResponse() {
    }


    public ChatHistoryResponse(
            Long id,
            String sender,
            String content,
            String timestamp,
            MessageStatus status,
            boolean edited,
            Long replyToMessageId,
            String replyToContent,
            String messageType) {

        this.id = id;
        this.sender = sender;
        this.content = content;
        this.timestamp = timestamp;
        this.status = status;
        this.edited = edited;
        this.replyToMessageId = replyToMessageId;
        this.replyToContent = replyToContent;

        this.messageType =
                messageType != null
                        ? messageType
                        : "TEXT";
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

    public void setReplyToMessageId(
            Long replyToMessageId) {

        this.replyToMessageId =
                replyToMessageId;
    }


    public String getReplyToContent() {
        return replyToContent;
    }

    public void setReplyToContent(
            String replyToContent) {

        this.replyToContent =
                replyToContent;
    }


    /*
     * =====================================================
     * MESSAGE TYPE
     * =====================================================
     */

    public String getMessageType() {
        return messageType;
    }

    public void setMessageType(
            String messageType) {

        this.messageType =
                messageType != null
                        ? messageType
                        : "TEXT";
    }
    
    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
    public boolean isForwarded() {
        return forwarded;
    }

    public void setForwarded(boolean forwarded) {
        this.forwarded = forwarded;
    }

}
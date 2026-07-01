package com.chat.app.dto;

public class DeleteMessageRequest {

    private Long messageId;

    public DeleteMessageRequest() {
    }

    public DeleteMessageRequest(Long messageId) {
        this.messageId = messageId;
    }

    public Long getMessageId() {
        return messageId;
    }

    public void setMessageId(Long messageId) {
        this.messageId = messageId;
    }
}
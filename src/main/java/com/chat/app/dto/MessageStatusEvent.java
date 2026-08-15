package com.chat.app.dto;

public class MessageStatusEvent {

    private Long messageId;

    private String status;

    public MessageStatusEvent() {
    }

    public MessageStatusEvent(Long messageId, String status) {
        this.messageId = messageId;
        this.status = status;
    }

    public Long getMessageId() {
        return messageId;
    }

    public void setMessageId(Long messageId) {
        this.messageId = messageId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

}
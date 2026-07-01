package com.chat.app.dto;

public class DeleteMessageEvent {

    private Long messageId;
    private String username;

    public DeleteMessageEvent() {
    }

    public DeleteMessageEvent(Long messageId, String username) {
        this.messageId = messageId;
        this.username = username;
    }

    public Long getMessageId() {
        return messageId;
    }

    public void setMessageId(Long messageId) {
        this.messageId = messageId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}
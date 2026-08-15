package com.chat.app.dto;

public class DeleteForEveryoneEvent {

    private Long messageId;
    private String content;
    private String status;

    public DeleteForEveryoneEvent() {
    }

    public DeleteForEveryoneEvent(Long messageId, String content, String status) {
        this.messageId = messageId;
        this.content = content;
        this.status = status;
    }

    public Long getMessageId() {
        return messageId;
    }

    public void setMessageId(Long messageId) {
        this.messageId = messageId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
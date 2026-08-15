package com.chat.app.dto;

public class EditMessageEvent {

    private Long messageId;

    private String content;

    private String sender;

    private String receiver;

    private Boolean edited;


    public EditMessageEvent() {
    }


    public EditMessageEvent(
            Long messageId,
            String content,
            String sender,
            String receiver,
            Boolean edited) {

        this.messageId = messageId;
        this.content = content;
        this.sender = sender;
        this.receiver = receiver;
        this.edited = edited;
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


    public Boolean isEdited() {
        return edited;
    }

    public void setEdited(Boolean edited) {
        this.edited = edited;
    }
}
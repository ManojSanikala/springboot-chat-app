package com.chat.app.dto;

public class ReactionEvent {

    private Long messageId;

    private String username;

    private String reaction;

    private String sender;

    private String receiver;

    public ReactionEvent() {
    }

    public ReactionEvent(
            Long messageId,
            String username,
            String reaction,
            String sender,
            String receiver) {

        this.messageId = messageId;
        this.username = username;
        this.reaction = reaction;
        this.sender = sender;
        this.receiver = receiver;
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

    public String getReaction() {
        return reaction;
    }

    public void setReaction(String reaction) {
        this.reaction = reaction;
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
}
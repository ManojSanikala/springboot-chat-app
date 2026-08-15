package com.chat.app.dto;

public class ReplyMessageEvent {

    private Long messageId;

    private String content;

    private String sender;

    private String receiver;

    private Long replyToMessageId;

    private String replyToContent;


    public ReplyMessageEvent() {
    }


    public ReplyMessageEvent(
            Long messageId,
            String content,
            String sender,
            String receiver,
            Long replyToMessageId,
            String replyToContent) {

        this.messageId = messageId;
        this.content = content;
        this.sender = sender;
        this.receiver = receiver;
        this.replyToMessageId = replyToMessageId;
        this.replyToContent = replyToContent;
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
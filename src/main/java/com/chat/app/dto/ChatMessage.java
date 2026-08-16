package com.chat.app.dto;

public class ChatMessage {

    private String sender;

    private String receiver;

    private String content;

    private Long replyToMessageId;

    private String replyToContent;
    private String fileName;
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
     *
     * Default is TEXT so existing messages continue
     * working normally.
     */
    private String messageType = "TEXT";


    /*
     * =====================================================
     * DEFAULT CONSTRUCTOR
     * =====================================================
     */

    public ChatMessage() {
    }


    /*
     * =====================================================
     * CONSTRUCTOR
     * =====================================================
     */

    public ChatMessage(
            String sender,
            String receiver,
            String content) {

        this.sender = sender;

        this.receiver = receiver;

        this.content = content;

        this.messageType = "TEXT";
    }


    /*
     * =====================================================
     * SENDER
     * =====================================================
     */

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }


    /*
     * =====================================================
     * RECEIVER
     * =====================================================
     */

    public String getReceiver() {
        return receiver;
    }

    public void setReceiver(String receiver) {
        this.receiver = receiver;
    }


    /*
     * =====================================================
     * CONTENT
     * =====================================================
     */

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }


    /*
     * =====================================================
     * REPLY MESSAGE ID
     * =====================================================
     */

    public Long getReplyToMessageId() {
        return replyToMessageId;
    }

    public void setReplyToMessageId(
            Long replyToMessageId) {

        this.replyToMessageId =
                replyToMessageId;
    }


    /*
     * =====================================================
     * REPLY CONTENT
     * =====================================================
     */

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
                messageType;
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
package com.chat.app.model;

import com.chat.app.enums.MessageStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "sender_id")
    private User sender;

    @ManyToOne
    @JoinColumn(name = "receiver_id")
    private User receiver;

    private String content;

    private String timestamp;

    @Enumerated(EnumType.STRING)
    private MessageStatus status;

    private boolean deletedBySender = false;

    private boolean deletedByReceiver = false;

    private boolean edited;

    private Long replyToMessageId;

    private String replyToContent;
    private String fileName;
    @Column(nullable = false)
    private boolean forwarded = false;

    /*
     * =====================================================
     * MESSAGE TYPE
     * =====================================================
     *
     * TEXT      -> Normal text message
     * IMAGE     -> Image message
     * DOCUMENT  -> Document message
     * FILE      -> Other file message
     *
     * Existing messages will remain TEXT.
     */
    private String messageType = "TEXT";


    /*
     * =====================================================
     * CONSTRUCTORS
     * =====================================================
     */

    public Message() {
        super();
    }


    public Message(
            Long id,
            User sender,
            User receiver,
            String content,
            String timestamp,
            MessageStatus status,
            boolean deletedBySender,
            boolean deletedByReceiver) {

        this.id = id;
        this.sender = sender;
        this.receiver = receiver;
        this.content = content;
        this.timestamp = timestamp;
        this.status = status;
        this.deletedBySender = deletedBySender;
        this.deletedByReceiver = deletedByReceiver;
    }


    /*
     * =====================================================
     * ID
     * =====================================================
     */

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }


    /*
     * =====================================================
     * SENDER
     * =====================================================
     */

    public User getSender() {
        return sender;
    }

    public void setSender(User sender) {
        this.sender = sender;
    }


    /*
     * =====================================================
     * RECEIVER
     * =====================================================
     */

    public User getReceiver() {
        return receiver;
    }

    public void setReceiver(User receiver) {
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
     * TIMESTAMP
     * =====================================================
     */

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }


    /*
     * =====================================================
     * MESSAGE STATUS
     * =====================================================
     */

    public MessageStatus getStatus() {
        return status;
    }

    public void setStatus(MessageStatus status) {
        this.status = status;
    }


    /*
     * =====================================================
     * DELETE BY SENDER
     * =====================================================
     */

    public boolean isDeletedBySender() {
        return deletedBySender;
    }

    public void setDeletedBySender(boolean deletedBySender) {
        this.deletedBySender = deletedBySender;
    }


    /*
     * =====================================================
     * DELETE BY RECEIVER
     * =====================================================
     */

    public boolean isDeletedByReceiver() {
        return deletedByReceiver;
    }

    public void setDeletedByReceiver(boolean deletedByReceiver) {
        this.deletedByReceiver = deletedByReceiver;
    }


    /*
     * =====================================================
     * EDITED
     * =====================================================
     */

    public boolean isEdited() {
        return edited;
    }

    public void setEdited(boolean edited) {
        this.edited = edited;
    }


    /*
     * =====================================================
     * REPLY MESSAGE ID
     * =====================================================
     */

    public Long getReplyToMessageId() {
        return replyToMessageId;
    }

    public void setReplyToMessageId(Long replyToMessageId) {
        this.replyToMessageId = replyToMessageId;
    }


    /*
     * =====================================================
     * REPLY CONTENT
     * =====================================================
     */

    public String getReplyToContent() {
        return replyToContent;
    }

    public void setReplyToContent(String replyToContent) {
        this.replyToContent = replyToContent;
    }


    /*
     * =====================================================
     * MESSAGE TYPE
     * =====================================================
     */

    public String getMessageType() {
        return messageType;
    }

    public void setMessageType(String messageType) {
        this.messageType = messageType;
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
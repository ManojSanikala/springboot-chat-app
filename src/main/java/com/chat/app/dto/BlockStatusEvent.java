package com.chat.app.dto;

public class BlockStatusEvent {

    private String username;

    private boolean blocked;

    private String message;


    public BlockStatusEvent() {
    }


    public BlockStatusEvent(
            String username,
            boolean blocked,
            String message) {

        this.username = username;
        this.blocked = blocked;
        this.message = message;
    }


    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }


    public boolean isBlocked() {
        return blocked;
    }

    public void setBlocked(boolean blocked) {
        this.blocked = blocked;
    }


    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
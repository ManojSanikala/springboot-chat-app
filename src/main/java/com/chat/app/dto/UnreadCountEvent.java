package com.chat.app.dto;

public class UnreadCountEvent {

    private String username;
    private long unreadCount;

    public UnreadCountEvent() {
    }

    public UnreadCountEvent(String username, long unreadCount) {
        this.username = username;
        this.unreadCount = unreadCount;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public long getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(long unreadCount) {
        this.unreadCount = unreadCount;
    }
}
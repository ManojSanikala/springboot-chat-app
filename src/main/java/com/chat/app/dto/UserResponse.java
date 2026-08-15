package com.chat.app.dto;

public class UserResponse {

    private Long id;

    private String username;

    private String role;

    private boolean online;

    private String lastSeen;

    private long unreadCount;

    public UserResponse() {
    }

    public UserResponse(Long id,
                        String username,
                        String role,
                        boolean online,
                        String lastSeen) {

        this.id = id;
        this.username = username;
        this.role = role;
        this.online = online;
        this.lastSeen = lastSeen;
    }

    public UserResponse(Long id,
                        String username,
                        String role,
                        boolean online,
                        String lastSeen,
                        long unreadCount) {

        this.id = id;
        this.username = username;
        this.role = role;
        this.online = online;
        this.lastSeen = lastSeen;
        this.unreadCount = unreadCount;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public boolean isOnline() {
        return online;
    }

    public void setOnline(boolean online) {
        this.online = online;
    }

    public String getLastSeen() {
        return lastSeen;
    }

    public void setLastSeen(String lastSeen) {
        this.lastSeen = lastSeen;
    }

    public long getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(long unreadCount) {
        this.unreadCount = unreadCount;
    }

}
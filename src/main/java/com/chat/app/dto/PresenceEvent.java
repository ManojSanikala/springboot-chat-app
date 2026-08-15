package com.chat.app.dto;

public class PresenceEvent {

    private String username;

    private boolean online;

    private String lastSeen;

    public PresenceEvent() {
    }

    public PresenceEvent(String username,
                         boolean online,
                         String lastSeen) {

        this.username = username;
        this.online = online;
        this.lastSeen = lastSeen;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
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

}
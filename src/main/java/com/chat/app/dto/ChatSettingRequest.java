package com.chat.app.dto;

public class ChatSettingRequest {

    private String chatWith;

    private Long disappearingMinutes;

    public ChatSettingRequest() {
    }

    public ChatSettingRequest(String chatWith, Long disappearingMinutes) {
        this.chatWith = chatWith;
        this.disappearingMinutes = disappearingMinutes;
    }

    public String getChatWith() {
        return chatWith;
    }

    public void setChatWith(String chatWith) {
        this.chatWith = chatWith;
    }

    public Long getDisappearingMinutes() {
        return disappearingMinutes;
    }

    public void setDisappearingMinutes(Long disappearingMinutes) {
        this.disappearingMinutes = disappearingMinutes;
    }
}
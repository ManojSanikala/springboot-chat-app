package com.chat.app.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_chat_settings")
public class UserChatSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * User who owns this chat setting.
     * Example: Manoj
     */
    @Column(nullable = false, length = 50)
    private String username;

    /*
     * Receiver / chat partner.
     * Example: Ravi
     */
    @Column(nullable = false, length = 50)
    private String chatWith;

    /*
     * Disappearing-message duration in minutes.
     *
     * 0 = OFF
     *
     * Examples:
     * 30      = 30 minutes
     * 60      = 1 hour
     * 120     = 2 hours
     * 1440    = 1 day
     * 43200   = 30 days
     */
    @Column(nullable = false)
    private Long disappearingMinutes = 0L;


    // =====================================================
    // DEFAULT CONSTRUCTOR
    // =====================================================

    public UserChatSetting() {
    }


    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public UserChatSetting(
            String username,
            String chatWith,
            Long disappearingMinutes) {

        this.username = username;
        this.chatWith = chatWith;
        this.disappearingMinutes = disappearingMinutes;
    }


    // =====================================================
    // ID
    // =====================================================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }


    // =====================================================
    // USERNAME
    // =====================================================

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }


    // =====================================================
    // CHAT WITH
    // =====================================================

    public String getChatWith() {
        return chatWith;
    }

    public void setChatWith(String chatWith) {
        this.chatWith = chatWith;
    }


    // =====================================================
    // DISAPPEARING MINUTES
    // =====================================================

    public Long getDisappearingMinutes() {
        return disappearingMinutes;
    }

    public void setDisappearingMinutes(
            Long disappearingMinutes) {

        this.disappearingMinutes =
                disappearingMinutes;
    }
}
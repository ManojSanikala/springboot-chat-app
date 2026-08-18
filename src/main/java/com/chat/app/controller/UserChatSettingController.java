package com.chat.app.controller;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.chat.app.service.UserChatSettingService;

@RestController
@RequestMapping("/chat-settings")
public class UserChatSettingController {

    @Autowired
    private UserChatSettingService userChatSettingService;


    // =====================================================
    // GET DISAPPEARING MESSAGE SETTING
    // =====================================================

    @GetMapping("/disappearing")
    public ResponseEntity<Map<String, Object>> getDisappearingSetting(
            @RequestParam("chatWith") String chatWith,
            Principal principal) {

        String username =
                principal.getName();

        Long minutes =
                userChatSettingService
                        .getDisappearingMinutes(
                                username,
                                chatWith
                        );

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "username",
                username
        );

        response.put(
                "chatWith",
                chatWith
        );

        response.put(
                "disappearingMinutes",
                minutes
        );

        response.put(
                "enabled",
                minutes > 0
        );

        return ResponseEntity.ok(response);
    }


    // =====================================================
    // SET / UPDATE DISAPPEARING MESSAGE SETTING
    // =====================================================

    @PutMapping("/disappearing")
    public ResponseEntity<Map<String, Object>>
    setDisappearingSetting(
            @RequestParam("chatWith") String chatWith,
            @RequestParam("minutes") Long minutes,
            Principal principal) {

        String username =
                principal.getName();

        userChatSettingService
                .setDisappearingMinutes(
                        username,
                        chatWith,
                        minutes
                );

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "success",
                true
        );

        response.put(
                "username",
                username
        );

        response.put(
                "chatWith",
                chatWith
        );

        response.put(
                "disappearingMinutes",
                minutes
        );

        response.put(
                "enabled",
                minutes > 0
        );

        return ResponseEntity.ok(response);
    }
}
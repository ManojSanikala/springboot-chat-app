package com.chat.app.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chat.app.model.UserChatSetting;
import com.chat.app.repository.UserChatSettingRepository;

@Service
public class UserChatSettingService {

    @Autowired
    private UserChatSettingRepository userChatSettingRepository;


    // =====================================================
    // GET DISAPPEARING MESSAGE SETTING
    // =====================================================

    @Transactional(readOnly = true)
    public Long getDisappearingMinutes(
            String username,
            String chatWith) {

        return userChatSettingRepository
                .findByUsernameAndChatWith(
                        username,
                        chatWith
                )
                .map(UserChatSetting::getDisappearingMinutes)
                .orElse(0L);
    }


    // =====================================================
    // SAVE / UPDATE DISAPPEARING MESSAGE SETTING
    // =====================================================

    @Transactional
    public UserChatSetting setDisappearingMinutes(
            String username,
            String chatWith,
            Long minutes) {

        if (username == null ||
            username.trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Username is required"
            );
        }

        if (chatWith == null ||
            chatWith.trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Chat user is required"
            );
        }

        if (minutes == null || minutes < 0) {

            throw new IllegalArgumentException(
                    "Invalid disappearing message duration"
            );
        }

        /*
         * 0 = OFF
         */
        if (minutes == 0) {

            userChatSettingRepository
                    .deleteByUsernameAndChatWith(
                            username,
                            chatWith
                    );

            return new UserChatSetting(
                    username,
                    chatWith,
                    0L
            );
        }

        UserChatSetting setting =
                userChatSettingRepository
                        .findByUsernameAndChatWith(
                                username,
                                chatWith
                        )
                        .orElseGet(() ->
                                new UserChatSetting(
                                        username,
                                        chatWith,
                                        0L
                                )
                        );

        setting.setUsername(username);
        setting.setChatWith(chatWith);
        setting.setDisappearingMinutes(minutes);

        return userChatSettingRepository.save(setting);
    }
}
package com.chat.app.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.chat.app.model.UserChatSetting;

@Repository
public interface UserChatSettingRepository
        extends JpaRepository<UserChatSetting, Long> {

    Optional<UserChatSetting>
    findByUsernameAndChatWith(
            String username,
            String chatWith
    );

    boolean
    existsByUsernameAndChatWith(
            String username,
            String chatWith
    );

    void
    deleteByUsernameAndChatWith(
            String username,
            String chatWith
    );
}
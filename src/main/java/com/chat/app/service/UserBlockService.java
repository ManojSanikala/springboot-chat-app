package com.chat.app.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chat.app.model.UserBlock;
import com.chat.app.repository.UserBlockRepository;
import com.chat.app.repository.UserRepository;

@Service
public class UserBlockService {

    @Autowired
    private UserBlockRepository userBlockRepository;

    @Autowired
    private UserRepository userRepository;


    // =====================================================
    // BLOCK USER
    // =====================================================

    @Transactional
    public void blockUser(
            String blockerUsername,
            String blockedUsername) {

        if (blockerUsername == null ||
            blockedUsername == null) {

            throw new IllegalArgumentException(
                "Username is required"
            );
        }

        if (blockerUsername.equalsIgnoreCase(
                blockedUsername)) {

            throw new IllegalArgumentException(
                "You cannot block yourself"
            );
        }

        if (!userRepository.existsByUsername(
                blockedUsername)) {

            throw new IllegalArgumentException(
                "User not found"
            );
        }

        if (userBlockRepository
                .existsByBlockerUsernameAndBlockedUsername(
                    blockerUsername,
                    blockedUsername)) {

            return;
        }

        UserBlock block =
                new UserBlock(
                    blockerUsername,
                    blockedUsername
                );

        userBlockRepository.save(block);
    }


    // =====================================================
    // UNBLOCK USER
    // =====================================================

    @Transactional
    public void unblockUser(
            String blockerUsername,
            String blockedUsername) {

        userBlockRepository
            .deleteByBlockerUsernameAndBlockedUsername(
                blockerUsername,
                blockedUsername
            );
    }


    // =====================================================
    // CHECK BLOCK
    // =====================================================

    @Transactional(readOnly = true)
    public boolean isBlocked(
            String blockerUsername,
            String blockedUsername) {

        return userBlockRepository
            .existsByBlockerUsernameAndBlockedUsername(
                blockerUsername,
                blockedUsername
            );
    }
}
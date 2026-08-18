package com.chat.app.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.chat.app.model.UserBlock;

@Repository
public interface UserBlockRepository
        extends JpaRepository<UserBlock, Long> {

    boolean existsByBlockerUsernameAndBlockedUsername(
            String blockerUsername,
            String blockedUsername);

    Optional<UserBlock> findByBlockerUsernameAndBlockedUsername(
            String blockerUsername,
            String blockedUsername);

    void deleteByBlockerUsernameAndBlockedUsername(
            String blockerUsername,
            String blockedUsername);
}
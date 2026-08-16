package com.chat.app.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import com.chat.app.service.UserService;

@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private UserService userService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {

        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        // User connects to WebSocket
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {

            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {

                String token = authHeader.substring(7);

                String username = jwtService.extractUsername(token);

                UserDetails userDetails =
                        customUserDetailsService.loadUserByUsername(username);

                if (!jwtService.isTokenValid(token, userDetails.getUsername())) {
                    throw new AuthenticationCredentialsNotFoundException("WebSocket token is invalid or expired");
                }

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                accessor.setUser(authentication);

                // Update user online in database
                userService.updateOnlineStatus(username, true);
            } else {
                throw new AuthenticationCredentialsNotFoundException("WebSocket authentication token is required");
            }
        }

        // User disconnects
        if (accessor != null && StompCommand.DISCONNECT.equals(accessor.getCommand())) {

            if (accessor.getUser() != null) {

                String username = accessor.getUser().getName();

                // Update user offline in database
                userService.updateOfflineStatus(username);
            }
        }

        return message;
    }
}

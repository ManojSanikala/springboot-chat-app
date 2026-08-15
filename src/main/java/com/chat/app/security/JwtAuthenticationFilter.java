package com.chat.app.security;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {


    @Autowired
    private JwtService jwtService;


    @Autowired
    private CustomUserDetailsService customUserDetailsService;


    @Override
    protected boolean shouldNotFilter(
            HttpServletRequest request) {

        String path =
                request.getServletPath();


        /*
         * =========================================
         * PUBLIC ENDPOINTS
         * =========================================
         *
         * JWT filter will completely skip these.
         */

        if (path.equals("/auth/login")) {
            return true;
        }


        if (path.equals("/login.html")) {
            return true;
        }


        if (path.equals("/")) {
            return true;
        }


        if (path.startsWith("/js/")) {
            return true;
        }


        if (path.startsWith("/css/")) {
            return true;
        }


        if (path.startsWith("/images/")) {
            return true;
        }


        if (path.equals("/favicon.ico")) {
            return true;
        }


        if (path.startsWith("/chat/")) {
            return true;
        }


        return false;
    }


    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {


        String authHeader =
                request.getHeader("Authorization");


        /*
         * =========================================
         * NO JWT
         * =========================================
         */

        if (
            authHeader == null ||
            !authHeader.startsWith("Bearer ")
        ) {

            filterChain.doFilter(
                request,
                response
            );

            return;
        }


        /*
         * =========================================
         * EXTRACT JWT
         * =========================================
         */

        String jwt =
                authHeader.substring(7);


        try {


            String username =
                    jwtService.extractUsername(jwt);


            /*
             * =====================================
             * USERNAME FOUND
             * =====================================
             */

            if (
                username != null &&
                SecurityContextHolder
                    .getContext()
                    .getAuthentication() == null
            ) {


                UserDetails userDetails =
                        customUserDetailsService
                            .loadUserByUsername(
                                username
                            );


                /*
                 * =================================
                 * VALIDATE TOKEN
                 * =================================
                 */

                if (
                    jwtService.isTokenValid(
                        jwt,
                        userDetails.getUsername()
                    )
                ) {


                    UsernamePasswordAuthenticationToken
                        authentication =

                        new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                        );


                    SecurityContextHolder
                        .getContext()
                        .setAuthentication(
                            authentication
                        );

                }

            }


        }
        catch (Exception e) {


            /*
             * =====================================
             * INVALID / EXPIRED JWT
             *
             * DO NOT BLOCK REQUEST HERE.
             * Security will decide whether the
             * endpoint requires authentication.
             * =====================================
             */

            SecurityContextHolder
                .clearContext();


            System.out.println(
                "Invalid JWT: " +
                e.getMessage()
            );

        }


        /*
         * =========================================
         * CONTINUE REQUEST
         * =========================================
         */

        filterChain.doFilter(
            request,
            response
        );

    }

}
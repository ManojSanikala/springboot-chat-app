package com.chat.app.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.chat.app.security.CustomUserDetailsService;
import com.chat.app.security.JwtAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;


    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();

    }


    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())

            .formLogin(form -> form.disable())

            .httpBasic(httpBasic -> httpBasic.disable())

            .authenticationProvider(
                authenticationProvider()
            )

            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            )

            .authorizeHttpRequests(auth -> auth

                .requestMatchers(
                    "/",
                    "/login.html",
                    "/index.html",
                    "/error",

                    "/app.js",
                    "/websocket.js",
                    "/users.js",
                    "/messages.js",

                    "/js/**",
                    "/css/**",
                    "/images/**",
                    "/favicon.ico",

                    "/uploads/images/**",
                    "/auth/login",

                    "/chat/**"
                )
                .permitAll()

                .anyRequest()
                .authenticated()
            );

        return http.build();
    }


    /* =============================================
       Authentication Provider
    ============================================= */

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider provider =
            new DaoAuthenticationProvider(
                customUserDetailsService
            );

        provider.setPasswordEncoder(
            passwordEncoder()
        );

        return provider;

    }


    /* =============================================
       Authentication Manager
    ============================================= */

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration)
            throws Exception {

        return configuration.getAuthenticationManager();

    }

}
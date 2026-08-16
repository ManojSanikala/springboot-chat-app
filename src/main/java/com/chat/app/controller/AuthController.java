package com.chat.app.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chat.app.dto.LoginRequest;
import com.chat.app.dto.LoginResponse;
import com.chat.app.dto.RegisterRequest;
import com.chat.app.dto.UserRequest;
import com.chat.app.dto.UserResponse;
import com.chat.app.security.JwtService;
import com.chat.app.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {

	@Autowired
	private AuthenticationManager authenticationManager;
	
	@Autowired
	private JwtService jwtService;

	@Autowired
	private UserService userService;

	@PostMapping("/register")
	public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
		// Public registration must never allow a caller to choose an elevated role.
		UserRequest userRequest = new UserRequest(request.getUsername(), request.getPassword(), "USER");
		return ResponseEntity.status(201).body(userService.addUser(userRequest));
	}
	
	@PostMapping("/login")
	public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request){
		authenticationManager.authenticate(
				new UsernamePasswordAuthenticationToken(
						request.getUsername(),
						request.getPassword()
						)
				);
		
		String token = jwtService.generateToken(request.getUsername());
		
		return ResponseEntity.ok(new LoginResponse(token));
	}
}

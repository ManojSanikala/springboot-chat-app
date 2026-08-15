package com.chat.app.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chat.app.dto.UserRequest;
import com.chat.app.dto.UserResponse;
import com.chat.app.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/user")
public class UserController {
	@Autowired
	private UserService userService;
	
	@PostMapping("/join")
	public ResponseEntity<UserResponse> joinUser(@Valid @RequestBody UserRequest request) {
		UserResponse response = userService.addUser(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}
	
	@GetMapping("/me")
	public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {

	    UserResponse user = userService.getCurrentUser(authentication.getName());

	    return ResponseEntity.ok(user);
	}
	
	/*
	 * =====================================================
	 * Get All Users
	 * Returns all users except the logged-in user along with
	 * unread message count.
	 * =====================================================
	 */
	@GetMapping("/all")
	public List<UserResponse> getAllUsers(Principal principal) {

	    return userService.getAllUsers(principal.getName());

	}
	
	@DeleteMapping("/leave/{name}")
	public ResponseEntity<String> leaveUser(@PathVariable String name){
		 userService.removeUser(name);
		
		return ResponseEntity.ok("User removed successfully");
	}
}

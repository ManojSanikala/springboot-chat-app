package com.chat.app.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Entity;
import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "users")
public class User {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	@NotBlank(message = "Username is required")
	@Column(nullable = false, unique = true, length = 50)
	private String username;

	@NotBlank(message = "Password is required")
	private String password;

	@NotBlank(message = "Role is required")
	private String role;
	@JsonIgnore // "Ignore the messages field when converting User to JSON."
	@OneToMany(mappedBy = "sender") // The user field inside Message owns this relationship.
	private List<Message> sentMessages;
	
	private boolean online = false;
	
	private String lastSeen;

	public User() {

	}

	public User(Long id, @NotBlank(message = "Username is required") String username,
			@NotBlank(message = "Password is required") String password,
			@NotBlank(message = "Role is required") String role, List<Message> sentMessages, boolean online,String lastSeen) {
		super();
		this.id = id;
		this.username = username;
		this.password = password;
		this.role = role;
		this.sentMessages = sentMessages;
		this.online = online;
		this.lastSeen = lastSeen;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getRole() {
		return role;
	}

	public void setRole(String role) {
		this.role = role;
	}

	public List<Message> getSentMessages() {
		return sentMessages;
	}

	public void setSentMessages(List<Message> sentMessages) {
		this.sentMessages = sentMessages;
	}

	public boolean isOnline() {
		return online;
	}

	public void setOnline(boolean online) {
		this.online = online;
	}
	
	public String getLastSeen() {
	    return lastSeen;
	}

	public void setLastSeen(String lastSeen) {
	    this.lastSeen = lastSeen;
	}

	
	
	
	
	/* ✅ Public Chat (Completed)
	🔜 Private Chat (1-to-1)
	🔜 Online / Offline Status
	🔜 Typing Indicator
	🔜 Read Receipts
	🔜 Group Chat
	🔜 File & Image Sharing
	🔜 Notifications
	🔜 Deploy Backend
	🔜 React Frontend
	🔜 Deploy Full Stack */

}

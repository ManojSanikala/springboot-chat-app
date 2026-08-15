/* =====================================================
   messages.js
   -----------------------------------------------------
   Chat messages
   Chat history
   Reply
   Edit
   Delete
   Typing
   Message status
===================================================== */


/* =====================================================
   MESSAGE STORE
   -----------------------------------------------------
   app.js already owns:
   stompClient
   loggedInUser
   currentChatUser
   typingTimer
   replyingToMessage
   lastDisplayedMessageDate

   DO NOT redeclare those variables here.
===================================================== */

let messageStore = {};

let editingMessageId = null;
let userIsNearBottom = true;
let newMessageCount = 0;

let selectedImageFile = null;
/* =====================================================
   SEND MESSAGE
===================================================== */

function sendMessage() {

/*
     * =========================================
     * IMAGE SELECTED
     * =========================================
     */

    if (selectedImageFile) {

        sendSelectedImage();

        return;
    }

	const receiver =
		currentChatUser;


	if (!receiver) {

		alert(
			"Please select a user."
		);

		return;
	}


	if (
		!stompClient ||
		!stompClient.connected
	) {

		alert(
			"WebSocket is not connected."
		);

		return;
	}


	const input =
		document.getElementById(
			"message"
		);


	if (!input) {

		console.error(
			"Message input not found."
		);

		return;
	}


	const content =
		input.value.trim();


	if (!content) {

		return;
	}


	/*
	 * Reply information
	 */

	let replyToMessageId =
		null;

	let replyToContent =
		null;


	if (
		replyingToMessage
	) {

		replyToMessageId =
			replyingToMessage.messageId;


		replyToContent =
			replyingToMessage.content;

	}


	/*
	 * Send message
	 */

	stompClient.send(

		"/app/send",

		{},

		JSON.stringify({

			receiver:
				receiver,

			content:
				content,

			replyToMessageId:
				replyToMessageId,

			replyToContent:
				replyToContent

		})

	);


	/*
	 * Clear input
	 */

	input.value = "";


	/*
	 * Clear reply
	 */

	cancelReply();


	/*
	 * Focus input
	 */

	input.focus();

}


/* =====================================================
   ENTER KEY + TYPING INDICATOR
===================================================== */

document.addEventListener(
	"DOMContentLoaded",
	function() {

		const input =
			document.getElementById(
				"message"
			);


		if (!input) {

			return;
		}


		/*
		 * Enter = Send
		 */

		input.addEventListener(
			"keydown",
			function(event) {

				if (
					event.key ===
					"Enter"
				) {

					event.preventDefault();

					/*
					 * If editing, save edit.
					 * Otherwise send new message.
					 */

					if (
						editingMessageId !==
						null
					) {

						saveEditedMessage();

					}
					else {

						if (selectedImageFile) {

							sendSelectedImage();

						}
						else {

							sendMessage();

						}

					}

				}

			}
		);


		/*
		 * Typing indicator
		 */

		input.addEventListener(
			"input",
			function() {

				if (
					typeof sendTyping !==
					"function"
				) {

					return;
				}


				if (
					!currentChatUser
				) {

					return;
				}


				sendTyping(true);


				clearTimeout(
					typingTimer
				);


				typingTimer =
					setTimeout(
						function() {

							sendTyping(false);

						},
						1000
					);

			}
		);

	}
);


/* =====================================================
   LOAD CONVERSATION / CHAT HISTORY
===================================================== */

function loadConversation(
	username
) {

	console.log(
		"================================="
	);

	console.log(
		"Loading chat history for:",
		username
	);

	console.log(
		"================================="
	);


	const token =
		localStorage.getItem(
			"token"
		);


	if (!token) {

		console.error(
			"JWT token not found."
		);

		window.location.replace(
			"/login.html"
		);

		return;
	}


	const url =
		"/messages/conversation?receiver=" +
		encodeURIComponent(
			username
		);


	fetch(
		url,
		{

			method: "GET",

			headers: {

				"Authorization":
					"Bearer " + token,

				"Content-Type":
					"application/json"

			}

		}
	)

		.then(
			async function(response) {

				console.log(
					"History HTTP status:",
					response.status
				);


				const text =
					await response.text();


				if (!response.ok) {

					console.error(
						"History response:",
						text
					);


					throw new Error(
						"Failed to load conversation. HTTP " +
						response.status
					);

				}


				if (
					!text.trim()
				) {

					return [];

				}


				try {

					return JSON.parse(
						text
					);

				}
				catch (error) {

					console.error(
						"Invalid history JSON:",
						text
					);

					throw error;

				}

			}
		)

		.then(
			function(messages) {

				console.log(
					"CHAT HISTORY RECEIVED:",
					messages
				);


				const chat =
					document.getElementById(
						"chat"
					);


				if (!chat) {

					console.error(
						"#chat element not found."
					);

					return;
				}


				/*
				 * Clear previous conversation
				 */

				chat.innerHTML = "";


				/*
				 * Reset date separator
				 */

				lastDisplayedMessageDate =
					null;


				/*
				 * Clear message store
				 */

				messageStore = {};


				/*
				 * No messages
				 */

				if (
					!Array.isArray(
						messages
					) ||
					messages.length === 0
				) {

					chat.innerHTML = `

                    <div
                        style="
                            height:100%;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            color:#999;
                            font-size:14px;
                            text-align:center;
                        "
                    >

                        <div>

                            <div
                                style="
                                    font-size:40px;
                                    margin-bottom:10px;
                                "
                            >
                                💬
                            </div>

                            No messages yet

                        </div>

                    </div>

                `;

					markAsRead();

					return;
				}


				/*
				 * Render history
				 */

				messages.forEach(
					function(message) {

						/*
						 * Store for:
						 * Reply
						 * Edit
						 * Delete
						 */

						messageStore[
							message.id
						] = message;


						appendMessage(
							message
						);

					}
				);


				/*
				 * Scroll bottom
				 */

				chat.scrollTop =
					chat.scrollHeight;


				/*
				 * Mark incoming
				 * messages READ
				 */

				markAsRead();


				console.log(
					"HISTORY LOADED:",
					messages.length
				);

			}
		)

		.catch(
			function(error) {

				console.error(
					"================================="
				);

				console.error(
					"CHAT HISTORY ERROR"
				);

				console.error(
					error
				);

				console.error(
					"================================="
				);

			}
		);

}


/* =====================================================
   APPEND MESSAGE
===================================================== */

function appendMessage(
	message
) {

	const wasNearBottom =
		isChatNearBottom();

	const chat =
		document.getElementById(
			"chat"
		);


	if (!chat) {

		console.error(
			"#chat element not found."
		);

		return;
	}


	/*
	 * Store message
	 */

	messageStore[
		message.id
	] = message;


	/*
	 * Prevent duplicate
	 */

	if (
		document.getElementById(
			"message-" +
			message.id
		)
	) {

		return;
	}


	/* =================================================
	   DATE SEPARATOR
	================================================= */

	if (
		message.timestamp
	) {

		const messageDate =
			new Date(
				message.timestamp
			);


		if (
			!isNaN(
				messageDate.getTime()
			)
		) {

			const dateKey =
				messageDate.toDateString();


			if (
				lastDisplayedMessageDate !==
				dateKey
			) {

				const today =
					new Date();


				const yesterday =
					new Date();


				yesterday.setDate(
					today.getDate() - 1
				);


				let separatorText;


				if (
					messageDate.toDateString() ===
					today.toDateString()
				) {

					separatorText =
						"Today";

				}

				else if (
					messageDate.toDateString() ===
					yesterday.toDateString()
				) {

					separatorText =
						"Yesterday";

				}

				else {

					separatorText =
						messageDate.toLocaleDateString(
							[],
							{

								day:
									"2-digit",

								month:
									"long",

								year:
									"numeric"

							}
						);

				}


				chat.innerHTML += `

                    <div
                        style="
                            display:flex;
                            justify-content:center;
                            margin:15px 0;
                        "
                    >

                        <span
                            style="
                                background:#e5e5e5;
                                color:#666;
                                padding:5px 12px;
                                border-radius:12px;
                                font-size:11px;
                            "
                        >

                            ${separatorText}

                        </span>

                    </div>

                `;


				lastDisplayedMessageDate =
					dateKey;

			}

		}

	}


	/* =================================================
	   DELETED MESSAGE
	================================================= */

	if (
		message.status ===
		"DELETED"
	) {

		chat.innerHTML += `

            <div
                id="message-${message.id}"

                style="
                    display:flex;
                    justify-content:center;
                    width:100%;
                    margin:10px 0;
                "
            >

                <div
                    style="
                        color:#999;
                        font-style:italic;
                        font-size:13px;
                        padding:8px 12px;
                    "
                >

                    🗑 This message was deleted

                </div>

            </div>

        `;


		return;
	}


	/* =================================================
	   SENDER / RECEIVER
	================================================= */

	const isMyMessage =
		message.sender ===
		loggedInUser;


	/* =================================================
	   TIMESTAMP
	================================================= */

	let timeText =
		"";


	if (
		message.timestamp
	) {

		const date =
			new Date(
				message.timestamp
			);


		if (
			!isNaN(
				date.getTime()
			)
		) {

			timeText =
				date.toLocaleTimeString(
					[],
					{

						hour:
							"2-digit",

						minute:
							"2-digit"

					}
				);

		}

	}


	/* =================================================
	   STATUS
	   Sender only
	================================================= */

	let statusHTML =
		"";


	if (
		isMyMessage
	) {

		let statusIcon =
			"✓";


		let statusColor =
			"#777";


		if (
			message.status ===
			"DELIVERED"
		) {

			statusIcon =
				"✓✓";

		}


		if (
			message.status ===
			"READ"
		) {

			statusIcon =
				"✓✓";


			statusColor =
				"#2196F3";

		}


		statusHTML = `

            <span
                id="status-${message.id}"

                style="
                    margin-left:4px;
                    color:${statusColor};
                    font-weight:bold;
                "
            >

                ${statusIcon}

            </span>

        `;

	}


	/* =================================================
	   REPLY PREVIEW INSIDE MESSAGE
	================================================= */

	let replyHTML =
		"";


	if (
		message.replyToMessageId &&
		message.replyToContent
	) {

		replyHTML = `

            <div
                style="
                    padding:7px;
                    margin-bottom:7px;
                    border-left:3px solid #2196F3;
                    background:#f5f5f5;
                    border-radius:4px;
                    font-size:12px;
                    color:#555;
                "
            >

                <b>
                    ↩ Reply
                </b>

                <br>

                <span>
                    ${escapeHtml(
			message.replyToContent
		)}
                </span>

            </div>

        `;

	}


	/* =================================================
	   THREE DOT MENU
	   BOTH SENDER + RECEIVER
	================================================= */

	let menuHTML = `

        <div
            style="
                position:relative;
                display:inline-block;
                flex-shrink:0;
                margin-left:4px;
            "
        >

            <button
                type="button"

                onclick="
                    event.stopPropagation();
                    toggleMessageMenu(
                        ${message.id}
                    );
                "

                style="
                    border:none;
                    background:transparent;
                    cursor:pointer;
                    font-size:18px;
                    width:28px;
                    height:28px;
                    padding:0;
                    line-height:20px;
                    color:#555;
                "
            >

                ⋮

            </button>


            <div
    id="menu-${message.id}"

    style="
        display:none;
        position:fixed;
        width:180px;
        max-width:calc(100vw - 30px);

        background:#ffffff;

        border:1px solid #ddd;

        border-radius:8px;

        box-shadow:
            0 4px 15px
            rgba(0,0,0,.25);

        overflow:hidden;

        z-index:999999;
    "
>

                <!-- REPLY: BOTH -->

                <button
                    type="button"

                    onclick="
                        event.stopPropagation();

                        replyToMessage(
                            ${message.id}
                        );
                    "

                    style="
                        display:block;
                        width:100%;
                        padding:11px 12px;
                        border:none;
                        background:white;
                        text-align:left;
                        cursor:pointer;
                        font-size:14px;
                    "
                >

                    ↩ Reply

                </button>


                ${isMyMessage
			?

			`

                    <!-- EDIT: SENDER ONLY -->

                    <button
                        type="button"

                        onclick="
                            event.stopPropagation();

                            editMessage(
                                ${message.id}
                            );
                        "

                        style="
                            display:block;
                            width:100%;
                            padding:11px 12px;
                            border:none;
                            background:white;
                            text-align:left;
                            cursor:pointer;
                            font-size:14px;
                        "
                    >

                        ✏️ Edit

                    </button>


                    <!-- DELETE FOR ME -->

                    <button
                        type="button"

                        onclick="
                            event.stopPropagation();

                            deleteMessage(
                                ${message.id}
                            );
                        "

                        style="
                            display:block;
                            width:100%;
                            padding:11px 12px;
                            border:none;
                            background:white;
                            text-align:left;
                            cursor:pointer;
                            font-size:14px;
                        "
                    >

                        🗑 Delete For Me

                    </button>


                    <!-- DELETE FOR EVERYONE -->

                    <button
                        type="button"

                        onclick="
                            event.stopPropagation();

                            deleteForEveryone(
                                ${message.id}
                            );
                        "

                        style="
                            display:block;
                            width:100%;
                            padding:11px 12px;
                            border:none;
                            background:white;
                            text-align:left;
                            cursor:pointer;
                            font-size:14px;
                        "
                    >

                        🗑 Delete For Everyone

                    </button>

                    `

			:

			`

                    <!-- RECEIVER -->

                    <button
                        type="button"

                        onclick="
                            event.stopPropagation();

                            deleteMessage(
                                ${message.id}
                            );
                        "

                        style="
                            display:block;
                            width:100%;
                            padding:11px 12px;
                            border:none;
                            background:white;
                            text-align:left;
                            cursor:pointer;
                            font-size:14px;
                        "
                    >

                        🗑 Delete For Me

                    </button>

                    `

		}

            </div>

        </div>

    `;


	/* =================================================
	   MESSAGE BUBBLE
	================================================= */

	chat.innerHTML += `

        <div
            id="message-${message.id}"

            style="
                display:flex;

                justify-content:
                    ${isMyMessage
			? "flex-end"
			: "flex-start"
		};

                width:100%;

                box-sizing:border-box;

                margin-bottom:10px;

                padding:0 5px;
            "
        >

            <div
                style="
                    position:relative;

                    width:fit-content;

                    max-width:85%;

                    min-width:80px;

                    padding:10px 12px;

                    border-radius:12px;

                    background:
                        ${isMyMessage
			? "#dcf8c6"
			: "#ffffff"
		};

                    border:1px solid #ddd;

                    word-break:break-word;

                    overflow-wrap:anywhere;

                    box-sizing:border-box;
                "
            >

                ${replyHTML}


                <!-- MESSAGE CONTENT -->

             <div
    class="message-content"
    style="
        line-height:1.4;
        font-size:14px;
    "
>

    ${message.messageType &&
			message.messageType.toUpperCase() === "IMAGE"

			?

			`
        <img
            src="${escapeHtml(message.content)}"
            alt="Image"
            style="
                display:block;
                max-width:280px;
                max-height:300px;
                width:auto;
                height:auto;
                border-radius:10px;
                object-fit:cover;
                cursor:pointer;
            "
            onclick="
                window.open(
                    '${escapeHtml(message.content)}',
                    '_blank'
                );
            "
        />
        `

			:

			escapeHtml(
				message.content
			)
		}


    ${message.edited
			?

			`
        <span
            class="edited-label"
            style="
                color:#777;
                font-size:10px;
                margin-left:5px;
                font-style:italic;
            "
        >
            (edited)
        </span>
        `

			:

			""
		}

</div>

                <!-- TIME / STATUS / MENU -->

                <div
                    style="
                        display:flex;
                        justify-content:flex-end;
                        align-items:center;

                        margin-top:5px;

                        font-size:11px;

                        color:#888;
                    "
                >

                    <span>

                        ${timeText}

                        ${statusHTML}

                    </span>

                    ${menuHTML}

                </div>

            </div>

        </div>

    `;


	/*
	 * Keep latest message visible
	 */

	if (wasNearBottom) {

		scrollChatToBottom();

	}
	else {

		newMessageCount++;

		showNewMessageButton();

	}

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(
	value
) {

	if (
		value === null ||
		value === undefined
	) {

		return "";

	}


	return String(value)

		.replace(
			/&/g,
			"&amp;"
		)

		.replace(
			/</g,
			"&lt;"
		)

		.replace(
			/>/g,
			"&gt;"
		)

		.replace(
			/"/g,
			"&quot;"
		)

		.replace(
			/'/g,
			"&#039;"
		);

}


/* =====================================================
   CLOSE ALL MESSAGE MENUS
===================================================== */

function closeAllMessageMenus() {

	document
		.querySelectorAll(
			'[id^="menu-"]'
		)
		.forEach(
			function(menu) {

				menu.style.display =
					"none";

			}
		);

}


/* =====================================================
   TOGGLE MESSAGE MENU
   -----------------------------------------------------
   Keeps the menu INSIDE the chat panel.
   It will never overlap the Users panel.
===================================================== */

function toggleMessageMenu(messageId) {

	const menu =
		document.getElementById(
			"menu-" + messageId
		);

	if (!menu) {
		return;
	}


	const button =
		event.currentTarget;

	if (!button) {
		return;
	}


	const isOpen =
		menu.style.display === "block";


	/*
	 * Close all other menus
	 */

	closeAllMessageMenus();


	/*
	 * If already open,
	 * simply close it.
	 */

	if (isOpen) {
		return;
	}


	/*
	 * Chat panel
	 */

	const chat =
		document.getElementById(
			"chat"
		);

	if (!chat) {
		return;
	}


	/*
	 * Get screen positions
	 */

	const buttonRect =
		button.getBoundingClientRect();

	const chatRect =
		chat.getBoundingClientRect();


	/*
	 * Show temporarily to calculate size
	 */

	menu.style.display =
		"block";

	menu.style.visibility =
		"hidden";


	const menuRect =
		menu.getBoundingClientRect();


	/*
	 * Chat boundaries
	 */

	const chatLeft =
		chatRect.left + 5;

	const chatRight =
		chatRect.right - 5;

	const chatTop =
		chatRect.top + 5;

	const chatBottom =
		chatRect.bottom - 5;


	/*
	 * ================================
	 * HORIZONTAL POSITION
	 * ================================
	 */

	let left =
		buttonRect.right -
		menuRect.width;


	/*
	 * Never go into Users panel
	 */

	if (
		left <
		chatLeft
	) {

		left =
			chatLeft;

	}


	/*
	 * Never go outside chat panel
	 */

	if (
		left +
		menuRect.width >
		chatRight
	) {

		left =
			chatRight -
			menuRect.width;

	}


	/*
	 * ================================
	 * VERTICAL POSITION
	 * ================================
	 */

	let top =
		buttonRect.bottom + 5;


	/*
	 * If menu doesn't fit below,
	 * open above the button.
	 */

	if (
		top +
		menuRect.height >
		chatBottom
	) {

		top =
			buttonRect.top -
			menuRect.height -
			5;

	}


	/*
	 * If still above chat,
	 * keep it inside chat.
	 */

	if (
		top <
		chatTop
	) {

		top =
			chatTop;

	}


	/*
	 * ================================
	 * APPLY POSITION
	 * ================================
	 */

	menu.style.left =
		left + "px";

	menu.style.top =
		top + "px";

	menu.style.right =
		"auto";

	menu.style.bottom =
		"auto";

	menu.style.visibility =
		"visible";

}
/* =====================================================
   REPLY TO MESSAGE
   BOTH SENDER + RECEIVER
===================================================== */

function replyToMessage(
	messageId
) {

	const message =
		messageStore[
		messageId
		];


	if (!message) {

		console.error(
			"Message not found:",
			messageId
		);

		return;

	}


	/*
	 * Close menu
	 */

	closeAllMessageMenus();


	/*
	 * Store reply
	 */

	replyingToMessage = {

		messageId:
			message.id,

		sender:
			message.sender,

		content:
			message.content

	};


	/*
	 * Find preview
	 */

	let preview =
		document.getElementById(
			"replyPreview"
		);


	/*
	 * If index.html already has it,
	 * use it.
	 */

	if (!preview) {

		const input =
			document.getElementById(
				"message"
			);


		if (
			input &&
			input.parentElement
		) {

			preview =
				document.createElement(
					"div"
				);


			preview.id =
				"replyPreview";


			input.parentElement.insertBefore(
				preview,
				input
			);

		}

	}


	if (!preview) {

		return;

	}


	/*
	 * Show preview
	 */

	preview.style.display =
		"block";


	preview.innerHTML = `

        <div
            style="
                position:relative;

                padding:8px 35px 8px 10px;

                border-left:4px solid #2196F3;

                background:#f1f1f1;

                border-radius:5px;

                box-sizing:border-box;
            "
        >

            <button
                type="button"

                onclick="
                    cancelReply();
                "

                style="
                    position:absolute;
                    right:6px;
                    top:5px;

                    border:none;

                    background:transparent;

                    cursor:pointer;

                    font-size:16px;

                    color:#666;
                "
            >

                ✕

            </button>


            <div
                style="
                    font-size:11px;
                    color:#2196F3;
                    font-weight:bold;
                    margin-bottom:3px;
                "
            >

                Replying to
                ${escapeHtml(
		message.sender
	)}

            </div>


            <div
                style="
                    color:#555;
                    font-size:13px;

                    white-space:nowrap;

                    overflow:hidden;

                    text-overflow:ellipsis;
                "
            >

                ${escapeHtml(
		message.content
	)}

            </div>

        </div>

    `;


	const input =
		document.getElementById(
			"message"
		);


	if (input) {

		input.focus();

	}

}


/* =====================================================
   CANCEL REPLY
===================================================== */

function cancelReply() {

	replyingToMessage =
		null;


	const preview =
		document.getElementById(
			"replyPreview"
		);


	if (preview) {

		preview.innerHTML =
			"";

		preview.style.display =
			"none";

	}

}


/* =====================================================
   MARK MESSAGES AS READ
===================================================== */

function markAsRead() {

	if (
		!currentChatUser
	) {

		return;

	}


	/*
	 * Immediately remove
	 * local unread badge.
	 */

	if (
		typeof updateUnreadBadge ===
		"function"
	) {

		updateUnreadBadge(
			currentChatUser,
			0
		);

	}


	/*
	 * WebSocket
	 */

	if (
		!stompClient ||
		!stompClient.connected
	) {

		console.log(
			"WebSocket not connected while marking read."
		);

		return;

	}


	stompClient.send(

		"/app/read",

		{},

		JSON.stringify({

			sender:
				currentChatUser

		})

	);


	console.log(
		"Messages marked READ:",
		currentChatUser
	);

}


/* =====================================================
   DELETE FOR ME
===================================================== */

function deleteMessage(
	messageId
) {

	closeAllMessageMenus();


	const token =
		localStorage.getItem(
			"token"
		);


	if (!token) {

		return;

	}


	fetch(
		"/messages/delete/" +
		messageId,
		{

			method:
				"DELETE",

			headers: {

				"Authorization":
					"Bearer " + token

			}

		}
	)

		.then(
			function(response) {

				if (!response.ok) {

					throw new Error(
						"Delete For Me failed. HTTP " +
						response.status
					);

				}


				const messageDiv =
					document.getElementById(
						"message-" +
						messageId
					);


				if (
					messageDiv
				) {

					messageDiv.remove();

				}


				/*
				 * Remove from local store
				 */

				delete messageStore[
					messageId
				];

			}
		)

		.catch(
			function(error) {

				console.error(
					"Delete For Me error:",
					error
				);

			}
		);

}


/* =====================================================
   DELETE FOR EVERYONE
===================================================== */

function deleteForEveryone(
	messageId
) {

	closeAllMessageMenus();


	if (
		!stompClient ||
		!stompClient.connected
	) {

		console.error(
			"WebSocket not connected."
		);

		return;

	}


	const message =
		messageStore[
		messageId
		];


	if (!message) {

		console.error(
			"Message not found:",
			messageId
		);

		return;

	}


	/*
	 * Only sender can do this.
	 */

	if (
		message.sender !==
		loggedInUser
	) {

		console.error(
			"Only sender can delete for everyone."
		);

		return;

	}


	stompClient.send(

		"/app/deleteForEveryone",

		{},

		JSON.stringify({

			messageId:
				messageId

		})

	);

}


/* =====================================================
   EDIT MESSAGE
===================================================== */

function editMessage(
	messageId
) {

	const message =
		messageStore[
		messageId
		];


	if (!message) {

		console.error(
			"Message not found for edit:",
			messageId
		);

		return;

	}


	/*
	 * Sender only
	 */

	if (
		message.sender !==
		loggedInUser
	) {

		console.error(
			"Only sender can edit."
		);

		return;

	}


	/*
	 * Deleted message
	 */

	if (
		message.status ===
		"DELETED"
	) {

		console.error(
			"Deleted message cannot be edited."
		);

		return;

	}


	closeAllMessageMenus();


	/*
	 * Store edit ID
	 */

	editingMessageId =
		messageId;


	const input =
		document.getElementById(
			"message"
		);


	if (!input) {

		editingMessageId =
			null;

		console.error(
			"Message input not found."
		);

		return;

	}


	/*
	 * Put old content
	 * into input.
	 */

	input.value =
		message.content;


	input.focus();


	/*
	 * Move cursor to end.
	 */

	input.setSelectionRange(
		input.value.length,
		input.value.length
	);


	/*
	 * Change Send -> Save
	 */

	setEditMode(
		true
	);


	console.log(
		"EDIT MODE:",
		messageId
	);

}


/* =====================================================
   EDIT MODE
===================================================== */

function setEditMode(
	isEditing
) {

	const sendButton =
		document.querySelector(
			".send-button"
		);


	if (!sendButton) {

		console.error(
			".send-button not found."
		);

		return;

	}


	if (
		isEditing
	) {

		/*
		 * Save icon
		 */

		sendButton.innerHTML =
			'<i class="fa-solid fa-check"></i>';


		sendButton.title =
			"Save Edit";


		/*
		 * Replace onclick
		 */

		sendButton.onclick =
			saveEditedMessage;


		/*
		 * Cancel button
		 */

		if (
			!document.getElementById(
				"cancelEditButton"
			)
		) {

			const cancelButton =
				document.createElement(
					"button"
				);


			cancelButton.id =
				"cancelEditButton";


			cancelButton.type =
				"button";


			cancelButton.innerHTML =
				'<i class="fa-solid fa-xmark"></i>';


			cancelButton.title =
				"Cancel Edit";


			cancelButton.style.cssText = `

                width:45px;

                height:45px;

                min-width:45px;

                border:none;

                border-radius:50%;

                background:#e0e0e0;

                color:#555;

                cursor:pointer;

                font-size:16px;

            `;


			cancelButton.onclick =
				cancelEdit;


			const row =
				sendButton.parentElement;


			if (row) {

				row.insertBefore(
					cancelButton,
					sendButton
				);

			}

		}

	}

	else {

		/*
		 * Normal send icon
		 */

		sendButton.innerHTML =
			'<i class="fa-solid fa-paper-plane"></i>';


		sendButton.title =
			"Send message";


		sendButton.onclick =
			sendMessage;


		/*
		 * Remove cancel button
		 */

		const cancelButton =
			document.getElementById(
				"cancelEditButton"
			);


		if (
			cancelButton
		) {

			cancelButton.remove();

		}

	}

}


/* =====================================================
   SAVE EDIT
===================================================== */

function saveEditedMessage() {

	if (
		editingMessageId ===
		null
	) {

		console.error(
			"No message is being edited."
		);

		return;

	}


	const input =
		document.getElementById(
			"message"
		);


	if (!input) {

		return;

	}


	const newContent =
		input.value.trim();


	if (!newContent) {

		alert(
			"Message cannot be empty."
		);

		input.focus();

		return;

	}


	if (
		!stompClient ||
		!stompClient.connected
	) {

		alert(
			"WebSocket is not connected."
		);

		return;

	}


	const messageId =
		editingMessageId;


	const message =
		messageStore[
		messageId
		];


	if (!message) {

		console.error(
			"Message not found:",
			messageId
		);

		return;

	}


	if (
		message.sender !==
		loggedInUser
	) {

		console.error(
			"Only sender can edit."
		);

		return;

	}


	/*
	 * Send edit request.
	 */

	stompClient.send(

		"/app/edit",

		{},

		JSON.stringify({

			messageId:
				messageId,

			content:
				newContent

		})

	);


	/*
	 * Update local store immediately.
	 *
	 * WebSocket event will update
	 * the final UI.
	 */

	message.content =
		newContent;


	/*
	 * Clear input.
	 */

	input.value =
		"";


	/*
	 * Exit edit mode.
	 */

	editingMessageId =
		null;


	setEditMode(
		false
	);


	input.focus();


	console.log(
		"Edit request sent:",
		messageId
	);

}


/* =====================================================
   CANCEL EDIT
===================================================== */

function cancelEdit() {

	editingMessageId =
		null;


	const input =
		document.getElementById(
			"message"
		);


	if (input) {

		input.value =
			"";

	}


	setEditMode(
		false
	);


	if (input) {

		input.focus();

	}

}


/* =====================================================
   UPDATE EDITED MESSAGE
   -----------------------------------------------------
   Called by websocket.js
===================================================== */

function updateEditedMessage(
	event
) {

	console.log(
		"EDIT UPDATE RECEIVED:",
		event
	);


	if (
		!event ||
		event.messageId ===
		undefined ||
		event.messageId ===
		null
	) {

		console.error(
			"Invalid edit event:",
			event
		);

		return;

	}


	const messageId =
		event.messageId;


	/*
	 * Update local store.
	 */

	if (
		!messageStore[
		messageId
		]
	) {

		messageStore[
			messageId
		] = {};

	}


	messageStore[
		messageId
	].id =
		messageId;


	messageStore[
		messageId
	].content =
		event.content;


	messageStore[
		messageId
	].edited =
		event.edited !==
		false;


	/*
	 * Find message in UI.
	 */

	const messageDiv =
		document.getElementById(
			"message-" +
			messageId
		);


	if (!messageDiv) {

		console.log(
			"Edited message is not currently visible."
		);

		return;

	}


	const contentElement =
		messageDiv.querySelector(
			".message-content"
		);


	if (!contentElement) {

		return;

	}


	/*
	 * Replace text safely.
	 */

	contentElement.innerHTML =
		escapeHtml(
			event.content
		);


	/*
	 * Add edited label.
	 */

	if (
		event.edited !== false
	) {

		const label =
			document.createElement(
				"span"
			);


		label.className =
			"edited-label";


		label.style.cssText = `

            color:#777;

            font-size:10px;

            margin-left:5px;

            font-style:italic;

        `;


		label.textContent =
			"(edited)";


		contentElement.appendChild(
			label
		);

	}


	console.log(
		"EDIT APPLIED:",
		messageId
	);

}


/* =====================================================
   UPDATE DELETED MESSAGE
   -----------------------------------------------------
   Called by websocket.js
===================================================== */

function updateDeletedMessage(
	messageId
) {

	console.log(
		"DELETE FOR EVERYONE EVENT:",
		messageId
	);


	const messageDiv =
		document.getElementById(
			"message-" +
			messageId
		);


	if (
		messageDiv
	) {

		messageDiv.innerHTML = `

            <div
                style="
                    color:#999;
                    font-style:italic;
                    font-size:13px;
                    padding:8px;
                "
            >

                🗑 This message was deleted

            </div>

        `;

	}


	/*
	 * Update local store.
	 */

	if (
		messageStore[
		messageId
		]
	) {

		messageStore[
			messageId
		].content =
			"This message was deleted";


		messageStore[
			messageId
		].status =
			"DELETED";

	}

}

/* =====================================================
   CHAT AUTO-SCROLL
===================================================== */

function isChatNearBottom() {

	const chat =
		document.getElementById("chat");

	if (!chat) {
		return true;
	}

	const distanceFromBottom =
		chat.scrollHeight -
		chat.scrollTop -
		chat.clientHeight;

	return distanceFromBottom <= 80;
}


/* =====================================================
   CHAT SCROLL LISTENER
===================================================== */

document.addEventListener(
	"DOMContentLoaded",
	function() {

		const chat =
			document.getElementById("chat");

		if (!chat) {
			return;
		}

		chat.addEventListener(
			"scroll",
			function() {

				userIsNearBottom =
					isChatNearBottom();

				/*
				 * If user reaches bottom,
				 * remove new-message indicator.
				 */

				if (userIsNearBottom) {

					newMessageCount = 0;

					hideNewMessageButton();

				}

			}
		);

	}
);


/* =====================================================
   SCROLL TO BOTTOM
===================================================== */

function scrollChatToBottom() {

	const chat =
		document.getElementById("chat");

	if (!chat) {
		return;
	}

	chat.scrollTo({

		top:
			chat.scrollHeight,

		behavior:
			"smooth"

	});

	userIsNearBottom = true;

	newMessageCount = 0;

	hideNewMessageButton();

}


/* =====================================================
   NEW MESSAGE BUTTON
===================================================== */

function showNewMessageButton() {

	let button =
		document.getElementById(
			"newMessageButton"
		);

	if (!button) {

		button =
			document.createElement(
				"button"
			);

		button.id =
			"newMessageButton";

		button.type =
			"button";

		button.innerHTML =
			"↓ New message";

		button.style.cssText = `

            position:absolute;

            bottom:12px;

            left:50%;

            transform:translateX(-50%);

            z-index:100;

            border:none;

            border-radius:20px;

            padding:8px 16px;

            background:#2196F3;

            color:white;

            font-size:13px;

            font-weight:600;

            cursor:pointer;

            box-shadow:
                0 2px 8px
                rgba(0,0,0,.25);

        `;

		button.onclick =
			scrollChatToBottom;


		/*
		 * Put button inside chat's
		 * parent so it stays with chat.
		 */

		const chat =
			document.getElementById(
				"chat"
			);

		if (
			chat &&
			chat.parentElement
		) {

			const parent =
				chat.parentElement;

			/*
			 * Make parent positioning
			 * context.
			 */

			if (
				getComputedStyle(
					parent
				).position ===
				"static"
			) {

				parent.style.position =
					"relative";

			}

			parent.appendChild(
				button
			);

		}

	}


	button.style.display =
		"block";


	/*
	 * Show count when there are
	 * multiple new messages.
	 */

	if (
		newMessageCount > 1
	) {

		button.innerHTML =
			"↓ " +
			newMessageCount +
			" new messages";

	}
	else {

		button.innerHTML =
			"↓ New message";

	}

}


/* =====================================================
   HIDE NEW MESSAGE BUTTON
===================================================== */

function hideNewMessageButton() {

	const button =
		document.getElementById(
			"newMessageButton"
		);

	if (button) {

		button.style.display =
			"none";

	}

}

/* =====================================================
   MESSAGE SEARCH
   -----------------------------------------------------
   Searches the currently loaded conversation.
===================================================== */

let messageSearchMatches = [];

let messageSearchIndex = -1;


/* =====================================================
   OPEN SEARCH
===================================================== */

function openMessageSearch() {

	const searchBar =
		document.getElementById(
			"messageSearchBar"
		);

	const input =
		document.getElementById(
			"messageSearchInput"
		);

	if (!searchBar || !input) {

		console.error(
			"Message search elements not found."
		);

		return;

	}

	searchBar.style.display =
		"block";

	input.value =
		"";

	input.focus();


	input.oninput =
		function() {

			searchMessages(
				input.value
			);

		};

}


/* =====================================================
   CLOSE SEARCH
===================================================== */

function closeMessageSearch() {

	const searchBar =
		document.getElementById(
			"messageSearchBar"
		);

	const input =
		document.getElementById(
			"messageSearchInput"
		);


	if (input) {

		input.value =
			"";

	}


	if (searchBar) {

		searchBar.style.display =
			"none";

	}


	clearSearchHighlights();


	messageSearchMatches =
		[];

	messageSearchIndex =
		-1;

}


/* =====================================================
   SEARCH LOADED CONVERSATION
===================================================== */

function searchMessages(
	searchText
) {

	clearSearchHighlights();


	messageSearchMatches =
		[];

	messageSearchIndex =
		-1;


	const search =
		searchText
			.trim()
			.toLowerCase();


	if (!search) {

		return;

	}


	/*
	 * Search directly inside
	 * messageStore.
	 *
	 * DO NOT check receiver here.
	 *
	 * Chat history was already loaded
	 * for the selected conversation.
	 */

	Object.values(
		messageStore
	).forEach(
		function(message) {

			if (!message) {

				return;

			}


			const content =
				String(
					message.content ||
					""
				);


			if (
				content
					.toLowerCase()
					.includes(search)
			) {

				messageSearchMatches.push(
					message.id
				);

			}

		}
	);


	console.log(
		"================================="
	);

	console.log(
		"SEARCH:",
		search
	);

	console.log(
		"MATCHES:",
		messageSearchMatches
	);

	console.log(
		"MATCH COUNT:",
		messageSearchMatches.length
	);

	console.log(
		"================================="
	);


	/*
	 * Nothing found
	 */

	if (
		messageSearchMatches.length ===
		0
	) {

		showSearchResultMessage(
			"No messages found"
		);

		return;

	}


	/*
	 * Show result count
	 */

	showSearchResultMessage(

		messageSearchMatches.length +
		(
			messageSearchMatches.length ===
				1
				? " message found"
				: " messages found"
		)

	);


	/*
	 * First result
	 */

	messageSearchIndex =
		0;


	scrollToSearchResult();

}


/* =====================================================
   SHOW SEARCH RESULT COUNT
===================================================== */

function showSearchResultMessage(
	text
) {

	let result =
		document.getElementById(
			"messageSearchResult"
		);


	if (!result) {

		const searchBar =
			document.getElementById(
				"messageSearchBar"
			);


		if (!searchBar) {

			return;

		}


		result =
			document.createElement(
				"div"
			);


		result.id =
			"messageSearchResult";


		result.style.cssText = `

            margin-top:5px;

            color:#777;

            font-size:12px;

        `;


		searchBar.appendChild(
			result
		);

	}


	result.textContent =
		text;

}


/* =====================================================
   SCROLL TO SEARCH RESULT
===================================================== */

function scrollToSearchResult() {

	if (
		messageSearchMatches.length ===
		0
	) {

		return;

	}


	if (
		messageSearchIndex < 0 ||
		messageSearchIndex >=
		messageSearchMatches.length
	) {

		return;

	}


	clearSearchHighlights();


	const messageId =
		messageSearchMatches[
		messageSearchIndex
		];


	const messageElement =
		document.getElementById(
			"message-" +
			messageId
		);


	if (!messageElement) {

		console.error(
			"Message element not found:",
			messageId
		);

		return;

	}


	/*
	 * Scroll to message
	 */

	messageElement.scrollIntoView({

		behavior:
			"smooth",

		block:
			"center"

	});


	/*
	 * Highlight entire message
	 */

	messageElement.style.outline =
		"2px solid #2196F3";


	messageElement.style.borderRadius =
		"10px";


	/*
	 * Highlight matching text
	 */

	highlightSearchText(
		messageElement,
		document
			.getElementById(
				"messageSearchInput"
			)
			?.value || ""
	);

}


/* =====================================================
   HIGHLIGHT SEARCH TEXT
===================================================== */

function highlightSearchText(
	messageElement,
	searchText
) {

	const content =
		messageElement.querySelector(
			".message-content"
		);


	if (!content) {

		return;

	}


	const search =
		searchText.trim();


	if (!search) {

		return;

	}


	/*
	 * Save original text once
	 */

	if (
		!content.dataset.originalText
	) {

		content.dataset.originalText =
			content.textContent;

	}


	const originalText =
		content.dataset.originalText;


	const escapedSearch =
		search.replace(
			/[.*+?^${}()|[\]\\]/g,
			"\\$&"
		);


	const regex =
		new RegExp(
			"(" +
			escapedSearch +
			")",
			"gi"
		);


	/*
	 * Don't use innerHTML directly
	 * with the user's search text.
	 */

	const highlighted =
		escapeHtml(
			originalText
		).replace(

			regex,

			`<mark
                style="
                    background:#ffeb3b;
                    color:#222;
                    padding:1px 2px;
                    border-radius:2px;
                "
            >$1</mark>`

		);


	content.innerHTML =
		highlighted;

}


/* =====================================================
   CLEAR SEARCH HIGHLIGHTS
===================================================== */

function clearSearchHighlights() {

	document
		.querySelectorAll(
			'[id^="message-"]'
		)
		.forEach(
			function(messageElement) {

				messageElement.style.outline =
					"";

				messageElement.style.borderRadius =
					"";


				const content =
					messageElement.querySelector(
						".message-content"
					);


				if (
					content &&
					content.dataset.originalText
				) {

					content.textContent =
						content.dataset.originalText;


					delete content.dataset
						.originalText;

				}

			}
		);

}


/* =====================================================
   NEXT RESULT
===================================================== */

function nextSearchResult() {

	if (
		messageSearchMatches.length ===
		0
	) {

		return;

	}


	messageSearchIndex++;


	if (
		messageSearchIndex >=
		messageSearchMatches.length
	) {

		messageSearchIndex =
			0;

	}


	scrollToSearchResult();

}


/* =====================================================
   PREVIOUS RESULT
===================================================== */

function previousSearchResult() {

	if (
		messageSearchMatches.length ===
		0
	) {

		return;

	}


	messageSearchIndex--;


	if (
		messageSearchIndex < 0
	) {

		messageSearchIndex =
			messageSearchMatches.length - 1;

	}


	scrollToSearchResult();

}

/* =====================================================
   IMAGE SELECTION
   -----------------------------------------------------
   Select image first.
   Image will be sent when user presses Enter.
===================================================== */

function uploadImage() {

	const input =
		document.getElementById("imageInput");

	if (!input) {
		console.error("imageInput not found");
		return;
	}

	const file =
		input.files[0];

	if (!file) {
		return;
	}

	if (!currentChatUser) {

		alert(
			"Please select a user first."
		);

		input.value = "";
		return;
	}

	if (!file.type.startsWith("image/")) {

		alert(
			"Please select an image."
		);

		input.value = "";
		return;
	}

	if (
		file.size >
		5 * 1024 * 1024
	) {

		alert(
			"Image must be less than 5 MB."
		);

		input.value = "";
		return;
	}

	/*
	 * Store selected image.
	 * Do NOT upload yet.
	 */

	selectedImageFile = file;

	console.log(
		"Image selected:",
		file.name
	);

	/*
	 * Optional small indication
	 * in message input.
	 */

	const messageInput =
		document.getElementById(
			"message"
		);

	if (messageInput) {

		messageInput.placeholder =
			"Press Enter to send image";

		messageInput.focus();

	}

}

/* =====================================================
   SEND SELECTED IMAGE
===================================================== */

function sendSelectedImage() {

    if (!selectedImageFile) {
        return;
    }

    const token =
        localStorage.getItem("token");

    if (!token) {

        alert(
            "Session expired. Please login again."
        );

        return;
    }

    if (
        !stompClient ||
        !stompClient.connected
    ) {

        alert(
            "WebSocket is not connected."
        );

        return;
    }

    if (!currentChatUser) {

        alert(
            "Please select a user first."
        );

        return;
    }

    const file =
        selectedImageFile;

    const formData =
        new FormData();

    formData.append(
        "file",
        file
    );

    console.log(
        "Uploading selected image:",
        file.name
    );

    fetch(
        "/files/upload-image",
        {
            method: "POST",

            headers: {
                "Authorization":
                    "Bearer " + token
            },

            body: formData
        }
    )
    .then(
        async response => {

            const text =
                await response.text();

            if (!response.ok) {

                throw new Error(
                    text ||
                    "Image upload failed"
                );

            }

            try {

                return JSON.parse(
                    text
                );

            }
            catch (error) {

                throw new Error(
                    "Invalid server response"
                );

            }

        }
    )
    .then(
        data => {

            console.log(
                "Image uploaded:",
                data
            );

            if (!data.fileUrl) {

                throw new Error(
                    "Image URL not received"
                );

            }

            /*
             * Send image through
             * WebSocket.
             */

            sendImageMessage(
                data.fileUrl
            );

            /*
             * Clear selected image.
             */

            selectedImageFile =
                null;

            const input =
                document.getElementById(
                    "imageInput"
                );

            if (input) {
                input.value = "";
            }

            /*
             * Restore normal input.
             */

            const messageInput =
                document.getElementById(
                    "message"
                );

            if (messageInput) {

                messageInput.placeholder =
                    "Type a message...";

                messageInput.value =
                    "";

                messageInput.focus();

            }

        }
    )
    .catch(
        error => {

            console.error(
                "Image upload error:",
                error
            );

            alert(
                "Image upload failed: " +
                error.message
            );

        }
    );

}

/* =====================================================
   SEND IMAGE MESSAGE
===================================================== */

function sendImageMessage(
	imageUrl
) {

	if (
		!stompClient ||
		!stompClient.connected
	) {

		alert(
			"WebSocket is not connected."
		);

		return;
	}


	if (!currentChatUser) {

		alert(
			"Please select a user."
		);

		return;
	}


	/*
	 * =========================================
	 * BUILD IMAGE MESSAGE
	 * =========================================
	 */

	const imageMessage = {

		receiver:
			currentChatUser,

		content:
			imageUrl,

		messageType:
			"IMAGE",

		replyToMessageId:
			replyingToMessage
				? replyingToMessage.messageId
				: null,

		replyToContent:
			replyingToMessage
				? replyingToMessage.content
				: null

	};


	console.log(
		"Sending image message:",
		imageMessage
	);


	/*
	 * =========================================
	 * SEND THROUGH EXISTING WEBSOCKET
	 * =========================================
	 */

	stompClient.send(

		"/app/send",

		{},

		JSON.stringify(
			imageMessage
		)

	);


	/*
	 * =========================================
	 * CLEAR REPLY
	 * =========================================
	 */

	if (
		typeof cancelReply ===
		"function"
	) {

		cancelReply();

	}

}

/* =====================================================
   ATTACHMENT MENU
===================================================== */

function toggleAttachmentMenu() {

	const menu =
		document.getElementById(
			"attachmentMenu"
		);

	if (!menu) {

		return;
	}


	if (
		menu.style.display ===
		"block"
	) {

		menu.style.display =
			"none";

	}
	else {

		menu.style.display =
			"block";

	}

}


/* =====================================================
   CLOSE ATTACHMENT MENU
===================================================== */

function closeAttachmentMenu() {

	const menu =
		document.getElementById(
			"attachmentMenu"
		);

	if (menu) {

		menu.style.display =
			"none";

	}

}


/* =====================================================
   CLOSE ATTACHMENT MENU
   WHEN CLICKING OUTSIDE
===================================================== */

document.addEventListener(
	"click",
	function(event) {

		const menu =
			document.getElementById(
				"attachmentMenu"
			);

		const button =
			document.getElementById(
				"attachmentButton"
			);


		if (!menu || !button) {

			return;
		}


		if (
			menu.contains(
				event.target
			)
		) {

			return;
		}


		if (
			button.contains(
				event.target
			)
		) {

			return;
		}


		menu.style.display =
			"none";

	}
);


/* =====================================================
   VOICE MESSAGE
   -----------------------------------------------------
   UI placeholder for now.
   Actual recording will be added later.
===================================================== */

function startVoiceRecording() {

	alert(
		"Voice recording will be added next."
	);

}

/* =====================================================
   RENDER MESSAGE CONTENT
===================================================== */

function renderMessageContent(message) {

	const messageType =
		message.messageType || "TEXT";

	const content =
		message.content || "";


	/* =================================================
	   IMAGE MESSAGE
	================================================= */

	if (
		messageType.toUpperCase() ===
		"IMAGE"
	) {

		const imageWrapper =
			document.createElement(
				"div"
			);


		imageWrapper.style.cssText = `
            max-width:280px;
            cursor:pointer;
        `;


		const image =
			document.createElement(
				"img"
			);


		image.src =
			content;


		image.alt =
			"Image";


		image.style.cssText = `
            display:block;

            max-width:280px;
            max-height:300px;

            width:auto;
            height:auto;

            border-radius:10px;

            object-fit:cover;
        `;


		/*
		 * Open full image
		 * when clicked.
		 */

		image.onclick =
			function() {

				window.open(
					content,
					"_blank"
				);

			};


		imageWrapper.appendChild(
			image
		);


		return imageWrapper;
	}


	/* =================================================
	   NORMAL TEXT MESSAGE
	================================================= */

	const text =
		document.createElement(
			"span"
		);


	text.textContent =
		content;


	return text;
}
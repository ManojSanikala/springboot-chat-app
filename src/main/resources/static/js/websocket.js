/* =====================================================
   websocket.js

   Features:
   - JWT authentication
   - SockJS
   - STOMP
   - Automatic reconnect
   - Live messages
   - Typing indicator
   - SENT / DELIVERED / READ
   - Online / Offline
   - Unread count
   - Delete for everyone
   - Edit message
   - Reply support
===================================================== */


/* =====================================================
   RECONNECT VARIABLES
===================================================== */

let reconnectTimer = null;

let reconnectAttempts = 0;

const MAX_RECONNECT_DELAY = 30000;


/* =====================================================
   SESSION EXPIRED / INVALID JWT
===================================================== */

function handleSessionExpired() {

    console.warn(
        "JWT expired or invalid. Logging out..."
    );


    /*
     * Stop reconnect timer
     */

    if (reconnectTimer) {

        clearTimeout(
            reconnectTimer
        );

        reconnectTimer = null;
    }


    /*
     * Stop reconnect attempts
     */

    reconnectAttempts = 0;


    /*
     * Disconnect STOMP
     */

    if (
        stompClient &&
        stompClient.connected
    ) {

        try {

            stompClient.disconnect(
                function () {

                    console.log(
                        "WebSocket disconnected because session expired."
                    );

                }
            );

        }
        catch (error) {

            console.error(
                "WebSocket disconnect error:",
                error
            );

        }

    }


    stompClient = null;


    /*
     * Remove JWT
     */

    localStorage.removeItem(
        "token"
    );


    /*
     * Remove current chat
     */

    localStorage.removeItem(
        "currentChatUser"
    );


    /*
     * Redirect to login
     */

    if (
        !window.location.pathname
            .endsWith(
                "/login.html"
            )
    ) {

        window.location.replace(
            "/login.html"
        );

    }

}

/* =====================================================
   CONNECT WEBSOCKET
===================================================== */

function connectWebSocket() {

    /*
     * Already connected
     */

    if (
        stompClient &&
        stompClient.connected
    ) {

        console.log(
            "WebSocket already connected."
        );

        return;

    }


    /*
     * JWT
     */

    const token =
        localStorage.getItem("token");


    if (!token) {

        console.error(
            "JWT token not found."
        );

        return;

    }


    console.log(
        "Connecting WebSocket..."
    );


    /*
     * SockJS
     */

    const socket =
        new SockJS("/chat");


    /*
     * STOMP
     */

    stompClient =
        Stomp.over(socket);


    /*
     * Disable debug logs
     */

    stompClient.debug = null;


    /*
     * JWT header
     */

    const headers = {

        Authorization:
            "Bearer " + token

    };


    /*
     * CONNECT
     */

    stompClient.connect(

        headers,

        function (frame) {

            console.log(
                "WebSocket Connected Successfully"
            );


            console.log(
                "STOMP Frame:",
                frame
            );


            reconnectAttempts = 0;


            if (reconnectTimer) {

                clearTimeout(
                    reconnectTimer
                );

                reconnectTimer = null;

            }


            /*
             * Subscribe
             */

            subscribeToMessages();

            subscribeToTyping();

            subscribeToStatus();

            subscribeToPresence();

            subscribeToUnread();

            subscribeToDelete();

            subscribeToEdit();


            console.log(
                "All WebSocket subscriptions completed"
            );

        },


       function (error) {

    console.error(
        "WebSocket connection error:",
        error
    );


    /*
     * If the server rejected the
     * connection because JWT is invalid,
     * stop reconnecting and logout.
     */

    const errorText =
        JSON.stringify(error)
            .toLowerCase();


    if (
        errorText.includes("401") ||
        errorText.includes("403") ||
        errorText.includes("unauthorized") ||
        errorText.includes("forbidden") ||
        errorText.includes("expired") ||
        errorText.includes("invalid")
    ) {

        handleSessionExpired();

        return;
    }


    /*
     * Normal network problem.
     * Keep existing reconnect behaviour.
     */

    stompClient = null;

    scheduleReconnect();

}

    );


    /*
     * SockJS close
     */

    socket.onclose = function () {

    console.warn(
        "WebSocket connection closed."
    );


    stompClient = null;


    /*
     * Do not reconnect if user
     * has already logged out.
     */

    const token =
        localStorage.getItem(
            "token"
        );


    if (!token) {

        return;
    }


    scheduleReconnect();

};
}


/* =====================================================
   AUTOMATIC RECONNECT
===================================================== */

function scheduleReconnect() {

    if (reconnectTimer) {

        return;

    }


    /*
     * Don't reconnect without JWT
     */

    const token =
        localStorage.getItem("token");


    if (!token) {

        return;

    }


    const delay =
        Math.min(

            1000 *
            Math.pow(
                2,
                reconnectAttempts
            ),

            MAX_RECONNECT_DELAY

        );


    reconnectAttempts++;


    console.log(
        "Reconnecting WebSocket in",
        delay,
        "ms"
    );


    reconnectTimer =
        setTimeout(

            function () {

                reconnectTimer =
                    null;


                connectWebSocket();

            },

            delay

        );

}


/* =====================================================
   1. LIVE MESSAGES
===================================================== */

function subscribeToMessages() {

    if (
        !stompClient ||
        !stompClient.connected
    ) {

        return;

    }


    console.log(
        "Subscribing to /user/queue/messages"
    );


    stompClient.subscribe(

        "/user/queue/messages",

        function (message) {

            let msg;


            try {

                msg =
                    JSON.parse(
                        message.body
                    );

            }
            catch (error) {

                console.error(
                    "Invalid message JSON:",
                    message.body
                );

                return;

            }


            console.log(
                "LIVE MESSAGE RECEIVED:",
                msg
            );


            /*
             * Store message.
             *
             * messages.js owns messageStore.
             */

            if (
                typeof messageStore !==
                "undefined"
            ) {

                messageStore[
                    msg.id
                ] = msg;

            }


            /*
             * Display only current conversation.
             */

            if (

                msg.sender ===
                currentChatUser

                ||

                msg.receiver ===
                currentChatUser

            ) {

                /*
                 * Prevent duplicate display.
                 */

                if (
                    !document.getElementById(
                        "message-" + msg.id
                    )
                ) {

                    if (
                        typeof appendMessage ===
                        "function"
                    ) {

                        appendMessage(
                            msg
                        );

                    }
                    /* =================================================
   IN-APP NOTIFICATION
   -------------------------------------------------
   Only notify when:
   - Message belongs to logged-in user
   - Sender is NOT current chat
================================================= */

if (
    msg.receiver ===
        loggedInUser &&

    msg.sender !==
        currentChatUser
) {

    showMessageNotification(
        msg.sender,
        msg.content,
        msg.sender
    );

}

                }

            }


            /*
             * Receiver logic
             */

            if (
                msg.receiver ===
                loggedInUser
            ) {

                if (
                    stompClient &&
                    stompClient.connected
                ) {

                    /*
                     * Receiver is currently
                     * viewing this conversation.
                     */

                    if (
                        currentChatUser ===
                        msg.sender
                    ) {

                        stompClient.send(

                            "/app/read",

                            {},

                            JSON.stringify({

                                sender:
                                    msg.sender

                            })

                        );


                        /*
                         * Immediately remove
                         * unread badge.
                         */

                        if (
                            typeof updateUnreadBadge ===
                            "function"
                        ) {

                            updateUnreadBadge(
                                msg.sender,
                                0
                            );

                        }


                        console.log(
                            "Message READ immediately:",
                            msg.id
                        );

                    }

                    /*
                     * Receiver is NOT viewing
                     * this conversation.
                     */

                    else {

                        stompClient.send(

                            "/app/delivered",

                            {},

                            JSON.stringify({

                                sender:
                                    msg.sender

                            })

                        );


                        console.log(
                            "Message DELIVERED:",
                            msg.id
                        );

                    }

                }

            }


            /*
             * Refresh user list.
             *
             * This also refreshes backend
             * unread count if users.js
             * loads it from /user/all.
             */

            if (
                typeof loadUsers ===
                "function"
            ) {

                loadUsers();

            }

        }

    );

}


/* =====================================================
   2. TYPING INDICATOR
===================================================== */

function subscribeToTyping() {

    if (
        !stompClient ||
        !stompClient.connected
    ) {

        return;

    }


    console.log(
        "Subscribing to /user/queue/typing"
    );


    stompClient.subscribe(

        "/user/queue/typing",

        function (message) {

            try {

                const typing =
                    JSON.parse(
                        message.body
                    );


                console.log(
                    "TYPING EVENT:",
                    typing
                );


                const typingDiv =
                    document.getElementById(
                        "typing"
                    );


                if (!typingDiv) {

                    return;

                }


                /*
                 * Only display typing
                 * for current conversation.
                 */

                if (
                    typing.sender !==
                    currentChatUser
                ) {

                    typingDiv.innerHTML =
                        "";

                    return;

                }


                if (
                    typing.typing ===
                    true
                ) {

                    typingDiv.innerHTML = `

                        <span
                            style="
                                color:#777;
                                font-size:12px;
                                font-style:italic;
                            "
                        >
                            ${escapeHtmlSafe(
                                typing.sender
                            )}
                            is typing...
                        </span>

                    `;

                }
                else {

                    typingDiv.innerHTML =
                        "";

                }

            }
            catch (error) {

                console.error(
                    "Typing event error:",
                    error
                );

            }

        }

    );

}

/* =====================================================
   SEND TYPING INDICATOR
===================================================== */

function sendTyping(isTyping) {

    if (
        !stompClient ||
        !stompClient.connected
    ) {

        return;
    }

    if (
        !currentChatUser
    ) {

        return;
    }

    const typingEvent = {

        receiver:
            currentChatUser,

        typing:
            isTyping

    };

    console.log(
        "SENDING TYPING:",
        typingEvent
    );

    stompClient.send(

        "/app/typing",

        {},

        JSON.stringify(
            typingEvent
        )

    );

}

/* =====================================================
   3. MESSAGE STATUS
===================================================== */

function subscribeToStatus() {

    if (
        !stompClient ||
        !stompClient.connected
    ) {

        return;

    }


    console.log(
        "Subscribing to /user/queue/status"
    );


    stompClient.subscribe(

        "/user/queue/status",

        function (message) {

            let statusEvent;


            try {

                statusEvent =
                    JSON.parse(
                        message.body
                    );

            }
            catch (error) {

                console.error(
                    "Invalid status event:",
                    message.body
                );

                return;

            }


            console.log(
                "STATUS UPDATE:",
                statusEvent
            );


            if (
                !statusEvent.messageId ||
                !statusEvent.status
            ) {

                return;

            }


            /*
             * Update local messageStore
             */

            if (
                typeof messageStore !==
                "undefined" &&
                messageStore[
                    statusEvent.messageId
                ]
            ) {

                messageStore[
                    statusEvent.messageId
                ].status =
                    statusEvent.status;

            }


            /*
             * Update status UI.
             */

            const statusElement =
                document.getElementById(

                    "status-" +
                    statusEvent.messageId

                );


            if (!statusElement) {

                return;

            }


            if (
                statusEvent.status ===
                "SENT"
            ) {

                statusElement.innerHTML =
                    "✓";

                statusElement.style.color =
                    "#777";

            }

            else if (
                statusEvent.status ===
                "DELIVERED"
            ) {

                statusElement.innerHTML =
                    "✓✓";

                statusElement.style.color =
                    "#777";

            }

            else if (
                statusEvent.status ===
                "READ"
            ) {

                statusElement.innerHTML =
                    "✓✓";

                statusElement.style.color =
                    "#2196F3";

            }

        }

    );

}


/* =====================================================
   4. PRESENCE
===================================================== */

function subscribeToPresence() {

    if (
        !stompClient ||
        !stompClient.connected
    ) {

        return;

    }


    console.log(
        "Subscribing to /topic/presence"
    );


    stompClient.subscribe(

        "/topic/presence",

        function (message) {

            let event;


            try {

                event =
                    JSON.parse(
                        message.body
                    );

            }
            catch (error) {

                console.error(
                    "Invalid presence event:",
                    message.body
                );

                return;

            }


            console.log(
                "PRESENCE UPDATE:",
                event
            );


            if (
                typeof loadUsers ===
                "function"
            ) {

                loadUsers();

            }

        }

    );

}


/* =====================================================
   5. UNREAD COUNT
===================================================== */

function subscribeToUnread() {

    if (
        !stompClient ||
        !stompClient.connected
    ) {

        return;

    }


    console.log(
        "Subscribing to /user/queue/unread"
    );


    stompClient.subscribe(

        "/user/queue/unread",

        function (message) {

            let event;


            try {

                event =
                    JSON.parse(
                        message.body
                    );

            }
            catch (error) {

                console.error(
                    "Invalid unread event:",
                    message.body
                );

                return;

            }


            console.log(
                "UNREAD COUNT UPDATE:",
                event
            );


            /*
             * IMPORTANT:
             *
             * Some backend versions send:
             *
             * event.username
             *
             * Other versions send:
             *
             * event.sender
             *
             * Accept both.
             */

            const username =
                event.username ||
                event.sender;


            /*
             * Accept multiple possible
             * backend property names.
             */

            const unreadCount =
                Number(
                    event.unreadCount ??
                    event.count ??
                    0
                );


            if (!username) {

                console.error(
                    "Unread event has no username/sender:",
                    event
                );

                return;

            }


            console.log(
                "Unread user:",
                username
            );


            console.log(
                "Unread count:",
                unreadCount
            );


            /*
             * If currently opened chat,
             * badge must always be zero.
             */

            if (
                username ===
                currentChatUser
            ) {

                if (
                    typeof updateUnreadBadge ===
                    "function"
                ) {

                    updateUnreadBadge(
                        username,
                        0
                    );

                }


                return;

            }


            /*
             * Update badge.
             */

            if (
                typeof updateUnreadBadge ===
                "function"
            ) {

                updateUnreadBadge(
                    username,
                    unreadCount
                );

            }


            /*
             * Also refresh user list if needed.
             */

            if (
                typeof loadUsers ===
                "function"
            ) {

                loadUsers();

            }

        }

    );

}


/* =====================================================
   6. DELETE FOR EVERYONE
===================================================== */

function subscribeToDelete() {

    if (
        !stompClient ||
        !stompClient.connected
    ) {

        return;

    }


    console.log(
        "Subscribing to /user/queue/deleteForEveryone"
    );


    stompClient.subscribe(

        "/user/queue/deleteForEveryone",

        function (message) {

            let deleted;


            try {

                deleted =
                    JSON.parse(
                        message.body
                    );

            }
            catch (error) {

                console.error(
                    "Invalid delete event:",
                    message.body
                );

                return;

            }


            console.log(
                "MESSAGE DELETED:",
                deleted
            );


            /*
             * Update UI through messages.js
             */

            if (
                typeof updateDeletedMessage ===
                "function"
            ) {

                updateDeletedMessage(
                    deleted.messageId
                );

            }
            else {

                /*
                 * Fallback UI
                 */

                const messageDiv =
                    document.getElementById(

                        "message-" +
                        deleted.messageId

                    );


                if (messageDiv) {

                    messageDiv.innerHTML = `

                        <div
                            style="
                                color:gray;
                                font-style:italic;
                                font-size:13px;
                            "
                        >
                            🗑 This message was deleted
                        </div>

                    `;

                }

            }


            /*
             * Update store
             */

            if (
                typeof messageStore !==
                "undefined" &&
                messageStore[
                    deleted.messageId
                ]
            ) {

                messageStore[
                    deleted.messageId
                ].content =
                    "This message was deleted";


                messageStore[
                    deleted.messageId
                ].status =
                    "DELETED";

            }

        }

    );

}


/* =====================================================
   7. EDIT MESSAGE
===================================================== */

function subscribeToEdit() {

    if (
        !stompClient ||
        !stompClient.connected
    ) {

        return;

    }


    console.log(
        "Subscribing to /user/queue/edit"
    );


    stompClient.subscribe(

        "/user/queue/edit",

        function (message) {

            let edited;


            try {

                edited =
                    JSON.parse(
                        message.body
                    );

            }
            catch (error) {

                console.error(
                    "Invalid edit event:",
                    message.body
                );

                return;

            }


            console.log(
                "EDIT EVENT RECEIVED:",
                edited
            );


            if (
                edited.messageId ===
                undefined ||
                edited.messageId ===
                null
            ) {

                console.error(
                    "Edit event has no messageId:",
                    edited
                );

                return;

            }


            /*
             * Update local messageStore.
             */

            if (
                typeof messageStore !==
                "undefined"
            ) {

                if (
                    !messageStore[
                        edited.messageId
                    ]
                ) {

                    messageStore[
                        edited.messageId
                    ] = {};

                }


                messageStore[
                    edited.messageId
                ].id =
                    edited.messageId;


                messageStore[
                    edited.messageId
                ].content =
                    edited.content;


                messageStore[
                    edited.messageId
                ].edited =
                    edited.edited !==
                    false;

            }


            /*
             * Let messages.js update
             * the actual HTML.
             */

            if (
                typeof updateEditedMessage ===
                "function"
            ) {

                updateEditedMessage(
                    edited
                );

            }
            else {

                console.error(
                    "updateEditedMessage() is not available"
                );

            }

        }

    );

}


/* =====================================================
   SAFE HTML ESCAPE
===================================================== */

function escapeHtmlSafe(value) {

    if (
        value ===
        null ||
        value ===
        undefined
    ) {

        return "";

    }


    /*
     * Use existing escapeHtml if
     * messages.js already provides it.
     */

    if (
        typeof escapeHtml ===
        "function"
    ) {

        return escapeHtml(
            String(value)
        );

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
   CONNECTION STATUS HELPER
===================================================== */

function isWebSocketConnected() {

    return (

        stompClient !==
        null &&

        stompClient !==
        undefined &&

        stompClient.connected ===
        true

    );

}

/* =====================================================
   REAL-TIME IN-APP MESSAGE NOTIFICATION
===================================================== */

let messageNotificationTimer = null;


/* =====================================================
   SHOW MESSAGE NOTIFICATION
===================================================== */

function showMessageNotification(
    sender,
    content,
    username
) {

    const notification =
        document.getElementById(
            "messageNotification"
        );

    const senderElement =
        document.getElementById(
            "messageNotificationSender"
        );

    const contentElement =
        document.getElementById(
            "messageNotificationContent"
        );


    if (
        !notification ||
        !senderElement ||
        !contentElement
    ) {

        console.warn(
            "Message notification elements not found."
        );

        return;
    }


    /*
     * Sender
     */

    senderElement.textContent =
        sender;


    /*
     * Message preview
     */

    let preview =
        content || "New message";


    /*
     * Image message
     */

    if (
        typeof preview === "string" &&
        preview.startsWith("/uploads/")
    ) {

        preview =
            "📷 Image";

    }


    /*
     * Limit preview length
     */

    if (
        preview.length > 80
    ) {

        preview =
            preview.substring(
                0,
                80
            ) + "...";

    }


    contentElement.textContent =
        preview;


    /*
     * Show notification
     */

    notification.style.display =
        "block";


    /*
     * Clear previous timer
     */

    if (
        messageNotificationTimer
    ) {

        clearTimeout(
            messageNotificationTimer
        );

    }


    /*
     * Automatically hide
     * after 4 seconds.
     */

    messageNotificationTimer =
        setTimeout(
            function() {

                hideMessageNotification();

            },
            4000
        );


    /*
     * Clicking notification
     * opens that conversation.
     */

    notification.onclick =
        function() {

            if (
                username &&
                typeof selectUser ===
                "function"
            ) {

                selectUser(
                    username
                );

            }


            hideMessageNotification();

        };

}


/* =====================================================
   HIDE MESSAGE NOTIFICATION
===================================================== */

function hideMessageNotification() {

    const notification =
        document.getElementById(
            "messageNotification"
        );


    if (
        messageNotificationTimer
    ) {

        clearTimeout(
            messageNotificationTimer
        );

        messageNotificationTimer =
            null;

    }


    if (notification) {

        notification.style.display =
            "none";

    }

}
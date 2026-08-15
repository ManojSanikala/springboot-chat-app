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


/* =====================================================
   SEND MESSAGE
===================================================== */

function sendMessage() {

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
    function () {

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
            function (event) {

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

                        sendMessage();

                    }

                }

            }
        );


        /*
         * Typing indicator
         */

        input.addEventListener(
            "input",
            function () {

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
                        function () {

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
        async function (response) {

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
        function (messages) {

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
                function (message) {

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
        function (error) {

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
                    position:absolute;
                    right:0;
                    bottom:32px;

                    width:180px;
                    max-width:calc(100vw - 40px);

                    background:#ffffff;

                    border:1px solid #ddd;

                    border-radius:8px;

                    box-shadow:
                        0 3px 12px
                        rgba(0,0,0,.20);

                    overflow:hidden;

                    z-index:99999;
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


                ${
                    isMyMessage
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
                    ${
                        isMyMessage
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
                        ${
                            isMyMessage
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

                    ${escapeHtml(
                        message.content
                    )}

                    ${
                        message.edited
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

    chat.scrollTop =
        chat.scrollHeight;

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
            function (menu) {

                menu.style.display =
                    "none";

            }
        );

}


/* =====================================================
   TOGGLE MESSAGE MENU
===================================================== */

function toggleMessageMenu(
    messageId
) {

    const menu =
        document.getElementById(
            "menu-" +
            messageId
        );


    if (!menu) {

        return;

    }


    const isOpen =
        menu.style.display ===
        "block";


    closeAllMessageMenus();


    if (!isOpen) {

        menu.style.display =
            "block";

    }

}


/* =====================================================
   CLOSE MENU WHEN CLICKING OUTSIDE
===================================================== */

document.addEventListener(
    "click",
    function (event) {

        if (
            event.target.closest(
                '[id^="menu-"]'
            )
        ) {

            return;

        }


        if (
            event.target.closest(
                'button[onclick*="toggleMessageMenu"]'
            )
        ) {

            return;

        }


        closeAllMessageMenus();

    }
);


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
        function (response) {

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
        function (error) {

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
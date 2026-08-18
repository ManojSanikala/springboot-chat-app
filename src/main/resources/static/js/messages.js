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

let selectedGeneralFile = null;
let selectedGeneralFileInputId = "fileInput";

/* =====================================================
   SEND MESSAGE
===================================================== */

function sendMessage() {

    if (
        typeof stompClient === "undefined" ||
        !stompClient ||
        !stompClient.connected
    ) {
        alert("Chat connection is not available");
        return;
    }

    if (
        typeof currentChatUser === "undefined" ||
        !currentChatUser
    ) {
        alert("Please select a user first");
        return;
    }

    const input =
        document.getElementById("message");

    if (!input) {
        return;
    }

    const content =
        input.value.trim();

    if (!content) {
        return;
    }

    const payload = {

        sender:
            typeof loggedInUser !== "undefined"
                ? loggedInUser
                : null,

        receiver:
            currentChatUser,

        content:
            content,

        messageType:
            "TEXT"

    };

    if (
        typeof replyingToMessage !== "undefined" &&
        replyingToMessage
    ) {

        payload.replyToMessageId =
            replyingToMessage.id;

        payload.replyToContent =
            replyingToMessage.content;
    }

    stompClient.send(
        "/app/send",
        {},
        JSON.stringify(payload)
    );

    input.value = "";

    if (
        typeof cancelReply === "function"
    ) {
        cancelReply();
    }
}

/* =====================================================
   ENTER KEY SEND
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const input =
            document.getElementById("message");

        if (!input) {
            return;
        }

        input.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    sendMessage();
                }
            }
        );
    }
);

/* =====================================================
   LOAD CONVERSATION
===================================================== */

async function loadConversation() {

    if (
        typeof currentChatUser === "undefined" ||
        !currentChatUser
    ) {
        return;
    }

    const token =
        localStorage.getItem("token");

    if (!token) {
        return;
    }

    try {

        const response =
            await fetch(
                "/messages/conversation?receiver="
                +
                encodeURIComponent(
                    currentChatUser
                ),
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );

        if (!response.ok) {

            if (
                response.status === 401
            ) {

                localStorage.removeItem(
                    "token"
                );

                window.location.replace(
                    "/login.html"
                );

                return;
            }

            throw new Error(
                "Unable to load conversation"
            );
        }

        const messages =
            await response.json();

        messageStore =
            {};

        const chat =
            document.getElementById("chat");

        if (!chat) {
            return;
        }

        chat.innerHTML = "";

        if (
            !messages ||
            messages.length === 0
        ) {

            chat.innerHTML = `
                <div class="empty-chat">
                    <div>
                        <i class="fa-regular fa-comments"></i>
                        <div>
                            No messages yet
                        </div>
                    </div>
                </div>
            `;

            return;
        }

        messages.forEach(
            function (message) {

                messageStore[
                    message.id
                ] = message;

                displayMessage(
                    message
                );
            }
        );

        scrollChatToBottom();

    }
    catch (error) {

        console.error(
            "Error loading conversation:",
            error
        );
    }
}

/* =====================================================
   DISPLAY MESSAGE
===================================================== */

function displayMessage(message) {

    if (!message) {
        return;
    }

    const chat =
        document.getElementById("chat");

    if (!chat) {
        return;
    }

    const currentUser =
        typeof loggedInUser !== "undefined"
            ? loggedInUser
            : null;

    const isSender =
        message.sender === currentUser;

    const wrapper =
        document.createElement("div");

    wrapper.className =
        isSender
            ? "message-wrapper sent"
            : "message-wrapper received";

    wrapper.dataset.messageId =
        message.id;

    const messageBubble =
        document.createElement("div");

    messageBubble.className =
        "message-bubble";

    let contentHtml = "";

    if (
        message.messageType ===
        "IMAGE"
    ) {

        contentHtml = `
            <img
                src="${escapeHtml(
                    message.content || ""
                )}"
                alt="Image"
                style="
                    max-width:260px;
                    max-height:300px;
                    border-radius:8px;
                    display:block;
                    cursor:pointer;
                "
                onclick="
                    window.open(
                        this.src,
                        '_blank'
                    )
                "
            >
        `;

    }
    else if (
        message.messageType ===
        "AUDIO"
    ) {

        contentHtml = `
            <audio
                controls
                style="max-width:260px;"
            >
                <source
                    src="${escapeHtml(
                        message.content || ""
                    )}"
                >
            </audio>
        `;

    }
    else if (
        message.messageType ===
            "DOCUMENT" ||
        message.messageType ===
            "FILE"
    ) {

        const fileName =
            message.fileName ||
            "Download file";

        contentHtml = `
            <a
                href="${escapeHtml(
                    message.content || ""
                )}"
                target="_blank"
                rel="noopener noreferrer"
                style="
                    display:flex;
                    align-items:center;
                    gap:8px;
                    text-decoration:none;
                "
            >
                <i class="fa-solid fa-file"></i>
                <span>
                    ${escapeHtml(fileName)}
                </span>
            </a>
        `;

    }
    else {

        contentHtml =
            escapeHtml(
                message.content || ""
            );
    }

    messageBubble.innerHTML =
        contentHtml;

   wrapper.appendChild(messageBubble);

addMessageActions(
    wrapper,
    message,
    isSender
);

chat.appendChild(wrapper);
}

/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(value) {

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
   SCROLL CHAT
===================================================== */

function scrollChatToBottom() {

    const chat =
        document.getElementById("chat");

    if (!chat) {
        return;
    }

    chat.scrollTop =
        chat.scrollHeight;
}

/* =====================================================
   MESSAGE ACTIONS
   BOTH SENT + RECEIVED

   ALWAYS:
   MESSAGE -> THREE DOTS
===================================================== */

function addMessageActions(wrapper, message, isSender) {

    const actions = document.createElement("div");

    actions.className = "message-actions";

    const menuButton = document.createElement("button");

    menuButton.type = "button";
    menuButton.className = "message-menu-button";
    menuButton.innerHTML = "⋮";
    menuButton.title = "Message options";

    actions.appendChild(menuButton);

    /*
     * ALWAYS:
     *
     * message bubble -> three dots
     *
     * for sender AND receiver
     */
    wrapper.appendChild(actions);

    menuButton.addEventListener("click", function(event) {

        event.preventDefault();
        event.stopPropagation();

        openMessageMenu(
            wrapper,
            message,
            isSender
        );

    });
}
/* =====================================================
   MESSAGE MENU
===================================================== */

function openMessageMenu(
    wrapper,
    message,
    isSender
) {

    closeAllMessageMenus();

    const actions =
        wrapper.querySelector(".message-actions");

    if (!actions) {
        console.error(
            "Message actions container not found"
        );
        return;
    }

    const menu =
        document.createElement("div");

    menu.className =
        "message-options-menu";

    menu.innerHTML = `
        <button
            type="button"
            class="message-option-button"
            data-action="reply"
        >
            ↩ Reply
        </button>

        <button
            type="button"
            class="message-option-button"
            data-action="react"
        >
            😊 React
        </button>

        <button
            type="button"
            class="message-option-button"
            data-action="forward"
        >
            ↗ Forward
        </button>

        ${
            isSender
                ? `
                    <button
                        type="button"
                        class="message-option-button"
                        data-action="edit"
                    >
                        ✏ Edit
                    </button>

                    <button
                        type="button"
                        class="message-option-button"
                        data-action="delete-me"
                    >
                        🗑 Delete for me
                    </button>

                    <button
                        type="button"
                        class="message-option-button"
                        data-action="delete-everyone"
                    >
                        🗑 Delete for everyone
                    </button>
                `
                : `
                    <button
                        type="button"
                        class="message-option-button"
                        data-action="delete-me"
                    >
                        🗑 Delete for me
                    </button>
                `
        }
    `;

    actions.appendChild(menu);

    /*
     * IMPORTANT:
     * Stop menu clicks from reaching document.
     */
    menu.addEventListener(
        "click",
        function(event) {

            event.preventDefault();
            event.stopPropagation();

            const button =
                event.target.closest(
                    ".message-option-button"
                );

            if (!button) {
                return;
            }

            const action =
                button.dataset.action;

            if (action === "reply") {

                replyToMessageById(
                    message.id
                );

            }

            else if (action === "react") {

                openReactionPicker(
                    message.id
                );

            }

            else if (action === "forward") {

                openForwardDialog(
                    message.id
                );

            }

            else if (action === "edit") {

                editMessageById(
                    message.id
                );

            }

            else if (action === "delete-me") {

                deleteMessageForMe(
                    message.id
                );

            }

            else if (
                action === "delete-everyone"
            ) {

                deleteMessageForEveryone(
                    message.id
                );

            }

            closeAllMessageMenus();

        }
    );
}
/* =====================================================
   CLOSE MESSAGE MENUS
===================================================== */

function closeAllMessageMenus() {

    document
        .querySelectorAll(
            ".message-options-menu"
        )
        .forEach(
            function (menu) {

                menu.remove();
            }
        );
}

document.addEventListener(
    "click",
    function () {

        closeAllMessageMenus();
    }
);

/* =====================================================
   REPLY
===================================================== */

function replyToMessageById(
    messageId
) {

    const message =
        messageStore[
            messageId
        ];

    if (!message) {
        return;
    }

    if (
        typeof setReplyMessage ===
        "function"
    ) {

        setReplyMessage(
            message
        );

        return;
    }

    if (
        typeof replyingToMessage !==
        "undefined"
    ) {

        replyingToMessage =
            message;
    }

    const preview =
        document.getElementById(
            "replyPreview"
        );

    const previewContent =
        document.getElementById(
            "replyPreviewContent"
        );

    if (
        preview &&
        previewContent
    ) {

        previewContent.textContent =
            message.content || "";

        preview.style.display =
            "block";
    }
}

/* =====================================================
   EDIT MESSAGE
===================================================== */

async function editMessageById(
    messageId
) {

    const message =
        messageStore[
            messageId
        ];

    if (!message) {
        return;
    }

    const newContent =
        prompt(
            "Edit message:",
            message.content || ""
        );

    if (
        newContent === null
    ) {
        return;
    }

    const trimmed =
        newContent.trim();

    if (!trimmed) {
        return;
    }

    const token =
        localStorage.getItem(
            "token"
        );

    if (!token) {
        return;
    }

    try {

        const response =
            await fetch(
                "/messages/edit/"
                + messageId,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " + token
                    },

                    body:
                        JSON.stringify({
                            content:
                                trimmed
                        })
                }
            );

        if (!response.ok) {

            throw new Error(
                "Edit failed"
            );
        }

        await loadConversation();

    }
    catch (error) {

        console.error(
            "Edit message error:",
            error
        );

        alert(
            "Unable to edit message"
        );
    }
}

/* =====================================================
   DELETE FOR ME
===================================================== */

async function deleteMessageForMe(
    messageId
) {

    const token =
        localStorage.getItem(
            "token"
        );

    if (!token) {
        return;
    }

    try {

        const response =
            await fetch(
                "/messages/delete/"
                + messageId,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );

        if (!response.ok) {

            throw new Error(
                "Delete failed"
            );
        }

        await loadConversation();

    }
    catch (error) {

        console.error(
            "Delete message error:",
            error
        );

        alert(
            "Unable to delete message"
        );
    }
}

/* =====================================================
   DELETE FOR EVERYONE
===================================================== */

async function deleteMessageForEveryone(
    messageId
) {

    const confirmed =
        confirm(
            "Delete this message for everyone?"
        );

    if (!confirmed) {
        return;
    }

    const token =
        localStorage.getItem(
            "token"
        );

    if (!token) {
        return;
    }

    try {

        const response =
            await fetch(
                "/messages/delete-everyone/"
                + messageId,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );

        if (!response.ok) {

            throw new Error(
                "Delete for everyone failed"
            );
        }

        await loadConversation();

    }
    catch (error) {

        console.error(
            "Delete for everyone error:",
            error
        );

        alert(
            "Unable to delete message"
        );
    }
}

/* =====================================================
   MESSAGE SEARCH
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

    if (!searchBar) {
        return;
    }

    searchBar.style.display =
        "block";

    if (input) {
        input.focus();
    }
}

function closeMessageSearch() {

    const searchBar =
        document.getElementById(
            "messageSearchBar"
        );

    const input =
        document.getElementById(
            "messageSearchInput"
        );

    if (searchBar) {
        searchBar.style.display =
            "none";
    }

    if (input) {
        input.value = "";
    }

    clearMessageSearch();
}

function clearMessageSearch() {

    document
        .querySelectorAll(
            "[data-message-search-hidden]"
        )
        .forEach(
            function (element) {

                element.style.display =
                    "";

                element.removeAttribute(
                    "data-message-search-hidden"
                );
            }
        );
}

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const input =
            document.getElementById(
                "messageSearchInput"
            );

        if (!input) {
            return;
        }

        input.addEventListener(
            "input",
            function () {

                const searchText =
                    input.value
                        .trim()
                        .toLowerCase();

                const messages =
                    document.querySelectorAll(
                        "[data-message-id]"
                    );

                messages.forEach(
                    function (element) {

                        const text =
                            element.textContent
                                .toLowerCase();

                        if (
                            !searchText ||
                            text.includes(
                                searchText
                            )
                        ) {

                            element.style.display =
                                "";

                            element.removeAttribute(
                                "data-message-search-hidden"
                            );

                        }
                        else {

                            element.style.display =
                                "none";

                            element.setAttribute(
                                "data-message-search-hidden",
                                "true"
                            );
                        }
                    }
                );
            }
        );
    }
);

/* =====================================================
   BLOCK / UNBLOCK + DISAPPEARING MESSAGES
   -----------------------------------------------------
   These functions are used by the receiver three-dot
   menu in index.html.

   Backend endpoints:
     GET  /messages/block-status?username=
     POST /messages/block
     POST /messages/unblock
     POST /messages/disappearing
===================================================== */

/* =====================================================
   BLOCK / UNBLOCK RECEIVER
===================================================== */

let currentReceiverBlocked = false;


/* =====================================================
   LOAD BLOCK STATUS
===================================================== */

async function loadBlockStatus(username) {

    if (!username) {
        return;
    }

    const token =
        localStorage.getItem("token");

    if (!token) {
        return;
    }

    try {

        const response =
            await fetch(
                "/blocks/status?username=" +
                encodeURIComponent(username),
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        currentReceiverBlocked =
            Boolean(data.blocked);

        applyBlockedInputState(
            currentReceiverBlocked
        );

        updateBlockMenu(
            currentReceiverBlocked
        );

        if (
            typeof updateProfileBlockButton ===
            "function"
        ) {
            updateProfileBlockButton(
                currentReceiverBlocked
            );
        }

    }
    catch (error) {

        console.error(
            "Block status error:",
            error
        );
    }
}


/* =====================================================
   UPDATE THREE-DOT BLOCK BUTTON
===================================================== */

function updateBlockMenu(blocked) {

    const button =
        document.getElementById(
            "receiverBlockButton"
        );

    if (!button) {
        return;
    }

    if (blocked) {

        button.innerHTML =
            "🔓 Unblock";

        button.dataset.action =
            "unblock";

    }
    else {

        button.innerHTML =
            "🚫 Block";

        button.dataset.action =
            "block";
    }
}


/* =====================================================
   BLOCK / UNBLOCK
===================================================== */

async function toggleReceiverBlock() {

    if (
        typeof currentChatUser ===
            "undefined" ||
        !currentChatUser
    ) {
        return;
    }

    const token =
        localStorage.getItem("token");

    if (!token) {
        return;
    }

    const wasBlocked =
        currentReceiverBlocked;

    const endpoint =
        wasBlocked
            ? "/blocks/unblock"
            : "/blocks/block";

    try {

        const response =
            await fetch(
                endpoint,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " + token
                    },

                    body:
                        JSON.stringify({
                            username:
                                currentChatUser
                        })
                }
            );

        if (!response.ok) {

            const text =
                await response.text();

            alert(
                text ||
                "Unable to update block status"
            );

            return;
        }

        currentReceiverBlocked =
            !wasBlocked;

        applyBlockedInputState(
            currentReceiverBlocked
        );

        updateBlockMenu(
            currentReceiverBlocked
        );

        if (
            typeof updateProfileBlockButton ===
            "function"
        ) {
            updateProfileBlockButton(
                currentReceiverBlocked
            );
        }

        closeReceiverMenu();

    }
    catch (error) {

        console.error(
            "Block/unblock error:",
            error
        );

        alert(
            "Unable to update block status"
        );
    }
}


/* =====================================================
   BLOCKED INPUT STATE
===================================================== */

function applyBlockedInputState(blocked) {

    const input =
        document.getElementById(
            "message"
        );

    const sendButton =
        document.getElementById(
            "sendButton"
        );

    const micButton =
        document.getElementById(
            "micButton"
        );

    const attachmentButton =
        document.getElementById(
            "attachmentButton"
        );


    if (input) {

        input.disabled =
            Boolean(blocked);

        input.placeholder =
            blocked
                ? "User blocked"
                : "Type a message...";
    }


    if (sendButton) {

        sendButton.disabled =
            Boolean(blocked);

        sendButton.style.opacity =
            blocked
                ? "0.5"
                : "1";
    }


    if (micButton) {

        micButton.disabled =
            Boolean(blocked);

        micButton.style.opacity =
            blocked
                ? "0.5"
                : "1";
    }


    if (attachmentButton) {

        attachmentButton.disabled =
            Boolean(blocked);

        attachmentButton.style.opacity =
            blocked
                ? "0.5"
                : "1";
    }
}


/* =====================================================
   INITIALIZE RECEIVER OPTIONS
===================================================== */

async function initializeReceiverChatOptions(username) {

    if (!username) {
        return;
    }

    currentChatUser =
        username;

    currentReceiverBlocked =
        false;

    applyBlockedInputState(false);

    updateBlockMenu(false);

    await loadBlockStatus(
        username
    );

    if (
        typeof loadDisappearingSetting ===
        "function"
    ) {
        await loadDisappearingSetting(
            username
        );
    }
}
/* =====================================================
   DISAPPEARING MESSAGE SETTING
===================================================== */

async function saveDisappearingSetting(
    durationMs
) {

    if (
        typeof currentChatUser ===
            "undefined" ||
        !currentChatUser
    ) {

        return;
    }

    try {

        const response =
            await fetch(
                CHAT_FEATURE_ENDPOINTS.disappearing,
                {
                    method: "POST",

                    headers:
                        chatFeatureHeaders(),

                    body:
                        JSON.stringify({

                            receiver:
                                currentChatUser,

                            durationMs:
                                durationMs
                        })
                }
            );

        if (!response.ok) {

            const message =
                await response.text();

            alert(
                message ||
                "Unable to save disappearing message setting"
            );

            return;
        }

        if (
            typeof closeReceiverMenu ===
            "function"
        ) {

            closeReceiverMenu();
        }

    }
    catch (error) {

        console.error(
            "Unable to save disappearing setting",
            error
        );

        alert(
            "Unable to save disappearing message setting"
        );
    }
}


/* =====================================================
   BLOCKED INPUT STATE
===================================================== */

function applyBlockedInputState(
    blocked
) {

    const input =
        document.getElementById(
            "message"
        );

    const send =
        document.getElementById(
            "sendButton"
        );

    const mic =
        document.getElementById(
            "micButton"
        );

    const attachment =
        document.getElementById(
            "attachmentButton"
        );

    if (input) {

        input.disabled =
            blocked;

        input.placeholder =
            blocked
                ? "You blocked this user"
                : "Type a message...";
    }

    if (send) {

        send.disabled =
            blocked;

        send.style.opacity =
            blocked
                ? "0.45"
                : "1";

        send.style.cursor =
            blocked
                ? "not-allowed"
                : "pointer";
    }

    if (mic) {

        mic.disabled =
            blocked;

        mic.style.opacity =
            blocked
                ? "0.45"
                : "1";
    }

    if (attachment) {

        attachment.disabled =
            blocked;

        attachment.style.opacity =
            blocked
                ? "0.45"
                : "1";
    }
}
/* =====================================================
   REPLY PREVIEW
===================================================== */

function setReplyMessage(message) {

    if (!message) {
        return;
    }

    if (
        typeof replyingToMessage !==
        "undefined"
    ) {

        replyingToMessage =
            message;
    }

    const preview =
        document.getElementById(
            "replyPreview"
        );

    const previewContent =
        document.getElementById(
            "replyPreviewContent"
        );

    if (
        preview &&
        previewContent
    ) {

        previewContent.textContent =
            message.content || "";

        preview.style.display =
            "block";
    }
}

/* =====================================================
   CANCEL REPLY
===================================================== */

function cancelReply() {

    if (
        typeof replyingToMessage !==
        "undefined"
    ) {

        replyingToMessage =
            null;
    }

    const preview =
        document.getElementById(
            "replyPreview"
        );

    const previewContent =
        document.getElementById(
            "replyPreviewContent"
        );

    if (preview) {

        preview.style.display =
            "none";
    }

    if (previewContent) {

        previewContent.textContent =
            "";
    }
}

/* =====================================================
   REACTION PICKER
===================================================== */

const QUICK_REACTIONS = [
    "👍",
    "❤️",
    "😂",
    "😮",
    "😢"
];

const MORE_REACTIONS = [
    "👍","❤️","😂","😮","😢",
    "👏","🔥","🎉","😍","😘",
    "🥰","😊","😁","🤣","😎",
    "🤔","😐","🙄","😢","😭",
    "😡","🤬","🤯","😱","🤗",
    "🙏","💯","✨","💔","❤️‍🔥",
    "👎","👌","✌️","🤝","💪",
    "🎂","🥳","🚀","⭐","🌟"
];

function openReactionPicker(
    messageId
) {

    closeAllMessageMenus();

    const messageElement =
        document.querySelector(
            '[data-message-id="' +
            messageId +
            '"]'
        );

    if (!messageElement) {
        return;
    }

    const existing =
        document.getElementById(
            "reactionPicker"
        );

    if (existing) {
        existing.remove();
    }

    const picker =
        document.createElement(
            "div"
        );

    picker.id =
        "reactionPicker";

    picker.style.cssText = `
        position:absolute;
        z-index:99999;
        background:#ffffff;
        border:1px solid #ddd;
        border-radius:12px;
        padding:7px;
        box-shadow:0 5px 20px rgba(0,0,0,.18);
        display:flex;
        align-items:center;
        gap:4px;
    `;

    QUICK_REACTIONS.forEach(
        function (reaction) {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.textContent =
                reaction;

            button.style.cssText = `
                width:34px;
                height:34px;
                border:none;
                background:transparent;
                border-radius:8px;
                cursor:pointer;
                font-size:20px;
            `;

            button.onclick =
                function (event) {

                    event.stopPropagation();

                    addMessageReaction(
                        messageId,
                        reaction
                    );

                    picker.remove();
                };

            picker.appendChild(
                button
            );
        }
    );

    const moreButton =
        document.createElement(
            "button"
        );

    moreButton.type =
        "button";

    moreButton.textContent =
        "+";

    moreButton.title =
        "More reactions";

    moreButton.style.cssText = `
        width:34px;
        height:34px;
        border:none;
        background:#f1f3f5;
        border-radius:8px;
        cursor:pointer;
        font-size:20px;
    `;

    moreButton.onclick =
        function (event) {

            event.stopPropagation();

            openMoreReactions(
                messageId,
                picker
            );
        };

    picker.appendChild(
        moreButton
    );

    messageElement.style.position =
        "relative";

    messageElement.appendChild(
        picker
    );
}

/* =====================================================
   MORE REACTIONS
===================================================== */

function openMoreReactions(
    messageId,
    parentPicker
) {

    const existing =
        document.getElementById(
            "moreReactionPicker"
        );

    if (existing) {
        existing.remove();
    }

    const morePicker =
        document.createElement(
            "div"
        );

    morePicker.id =
        "moreReactionPicker";

    morePicker.style.cssText = `
        position:absolute;
        z-index:100000;
        width:270px;
        max-height:230px;
        overflow-y:auto;
        background:#ffffff;
        border:1px solid #ddd;
        border-radius:12px;
        padding:8px;
        box-shadow:0 6px 22px rgba(0,0,0,.2);
        display:grid;
        grid-template-columns:repeat(8,1fr);
        gap:4px;
    `;

    MORE_REACTIONS.forEach(
        function (reaction) {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.textContent =
                reaction;

            button.style.cssText = `
                width:28px;
                height:28px;
                border:none;
                background:transparent;
                border-radius:6px;
                cursor:pointer;
                font-size:19px;
            `;

            button.onclick =
                function (event) {

                    event.stopPropagation();

                    addMessageReaction(
                        messageId,
                        reaction
                    );

                    morePicker.remove();

                    if (parentPicker) {
                        parentPicker.remove();
                    }
                };

            morePicker.appendChild(
                button
            );
        }
    );

    const messageElement =
        document.querySelector(
            '[data-message-id="' +
            messageId +
            '"]'
        );

    if (!messageElement) {
        return;
    }

    messageElement.style.position =
        "relative";

    messageElement.appendChild(
        morePicker
    );
}

/* =====================================================
   ADD REACTION
===================================================== */

async function addMessageReaction(
    messageId,
    reaction
) {

    if (!messageId || !reaction) {
        return;
    }

    const token =
        localStorage.getItem(
            "token"
        );

    if (!token) {
        return;
    }

    try {

        const response =
            await fetch(
                "/reactions/" +
                messageId,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " + token
                    },

                    body:
                        JSON.stringify({
                            reaction:
                                reaction
                        })
                }
            );

        if (!response.ok) {

            throw new Error(
                "Unable to add reaction"
            );
        }

        await loadMessageReactions(
            messageId
        );

    }
    catch (error) {

        console.error(
            "Reaction error:",
            error
        );
    }
}

/* =====================================================
   LOAD REACTIONS
===================================================== */

async function loadMessageReactions(
    messageId
) {

    if (!messageId) {
        return;
    }

    try {

        const response =
            await fetch(
                "/reactions/" +
                messageId
            );

        if (!response.ok) {
            return;
        }

        const reactions =
            await response.json();

        renderMessageReactions(
            messageId,
            reactions
        );

    }
    catch (error) {

        console.error(
            "Unable to load reactions:",
            error
        );
    }
}

/* =====================================================
   RENDER REACTIONS
===================================================== */

function renderMessageReactions(
    messageId,
    reactions
) {

    const messageElement =
        document.querySelector(
            '[data-message-id="' +
            messageId +
            '"]'
        );

    if (!messageElement) {
        return;
    }

    const old =
        messageElement.querySelector(
            ".message-reactions"
        );

    if (old) {
        old.remove();
    }

    if (
        !reactions ||
        reactions.length === 0
    ) {
        return;
    }

    const reactionContainer =
        document.createElement(
            "div"
        );

    reactionContainer.className =
        "message-reactions";

    reactionContainer.style.cssText = `
        display:flex;
        flex-wrap:wrap;
        gap:4px;
        margin-top:5px;
    `;

    const grouped = {};

    reactions.forEach(
        function (item) {

            const reaction =
                item.reaction;

            if (!grouped[reaction]) {

                grouped[reaction] =
                    0;
            }

            grouped[reaction]++;
        }
    );

    Object.keys(grouped)
        .forEach(
            function (reaction) {

                const item =
                    document.createElement(
                        "span"
                    );

                item.textContent =
                    reaction +
                    (
                        grouped[reaction] > 1
                            ? " " +
                              grouped[reaction]
                            : ""
                    );

                item.style.cssText = `
                    background:#ffffff;
                    border:1px solid #ddd;
                    border-radius:12px;
                    padding:2px 7px;
                    font-size:13px;
                    cursor:pointer;
                `;

                item.onclick =
                    function () {

                        addMessageReaction(
                            messageId,
                            reaction
                        );
                    };

                reactionContainer.appendChild(
                    item
                );
            }
        );

    messageElement.appendChild(
        reactionContainer
    );
}

/* =====================================================
   FORWARD DIALOG
===================================================== */

function openForwardDialog(
    messageId
) {

    const message =
        messageStore[
            messageId
        ];

    if (!message) {
        return;
    }

    const existing =
        document.getElementById(
            "forwardDialog"
        );

    if (existing) {
        existing.remove();
    }

    const dialog =
        document.createElement(
            "div"
        );

    dialog.id =
        "forwardDialog";

    dialog.style.cssText = `
        position:fixed;
        inset:0;
        z-index:999999;
        background:rgba(0,0,0,.35);
        display:flex;
        align-items:center;
        justify-content:center;
    `;

    dialog.innerHTML = `
        <div
            style="
                width:360px;
                max-width:calc(100vw - 30px);
                max-height:80vh;
                background:#ffffff;
                border-radius:14px;
                overflow:hidden;
                box-shadow:0 8px 30px rgba(0,0,0,.25);
            "
        >

            <div
                style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    padding:14px 16px;
                    border-bottom:1px solid #eee;
                "
            >

                <strong>
                    Forward message
                </strong>

                <button
                    type="button"
                    id="closeForwardDialog"
                    style="
                        border:none;
                        background:transparent;
                        font-size:22px;
                        cursor:pointer;
                    "
                >
                    ×
                </button>

            </div>

            <div
                style="
                    padding:12px 16px;
                    border-bottom:1px solid #eee;
                    color:#555;
                    font-size:13px;
                "
            >
                ${escapeHtml(
                    message.content || ""
                )}
            </div>

            <div
                id="forwardUserList"
                style="
                    max-height:350px;
                    overflow-y:auto;
                "
            >
                Loading users...
            </div>

        </div>
    `;

    document.body.appendChild(
        dialog
    );

    document
        .getElementById(
            "closeForwardDialog"
        )
        .onclick =
            function () {

                dialog.remove();
            };

    loadForwardUsers(
        message
    );
}

/* =====================================================
   LOAD USERS FOR FORWARD
===================================================== */

async function loadForwardUsers(
    message
) {

    const list =
        document.getElementById(
            "forwardUserList"
        );

    if (!list) {
        return;
    }

    const token =
        localStorage.getItem(
            "token"
        );

    if (!token) {
        return;
    }

    try {

        const response =
            await fetch(
                "/users",
                {
                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );

        if (!response.ok) {

            throw new Error(
                "Unable to load users"
            );
        }

        const users =
            await response.json();

        list.innerHTML =
            "";

        users.forEach(
            function (user) {

                const username =
                    user.username ||
                    user.name;

                if (!username) {
                    return;
                }

                if (
                    typeof loggedInUser !==
                    "undefined" &&
                    username ===
                        loggedInUser
                ) {

                    return;
                }

                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.style.cssText = `
                    width:100%;
                    border:none;
                    background:#ffffff;
                    padding:12px 16px;
                    display:flex;
                    align-items:center;
                    gap:10px;
                    cursor:pointer;
                    text-align:left;
                `;

                button.innerHTML = `
                    <span
                        style="
                            width:36px;
                            height:36px;
                            border-radius:50%;
                            background:#2196f3;
                            color:#ffffff;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                        "
                    >
                        <i class="fa-solid fa-user"></i>
                    </span>

                    <span>
                        ${escapeHtml(
                            username
                        )}
                    </span>
                `;

                button.onclick =
                    function () {

                        forwardMessage(
                            message,
                            username
                        );
                    };

                list.appendChild(
                    button
                );
            }
        );

    }
    catch (error) {

        console.error(
            "Forward users error:",
            error
        );

        list.textContent =
            "Unable to load users";
    }
}

/* =====================================================
   FORWARD MESSAGE
===================================================== */

async function forwardMessage(
    message,
    receiver
) {

    if (
        !message ||
        !receiver
    ) {
        return;
    }

    const token =
        localStorage.getItem(
            "token"
        );

    if (!token) {
        return;
    }

    try {

        const response =
            await fetch(
                "/messages/forward",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " + token
                    },

                    body:
                        JSON.stringify({

                            receiver:
                                receiver,

                            content:
                                message.content,

                            messageType:
                                message.messageType ||
                                "TEXT",

                            fileName:
                                message.fileName ||
                                null,

                            forwarded:
                                true
                        })
                }
            );

        if (!response.ok) {

            throw new Error(
                "Forward failed"
            );
        }

        const dialog =
            document.getElementById(
                "forwardDialog"
            );

        if (dialog) {
            dialog.remove();
        }

    }
    catch (error) {

        console.error(
            "Forward message error:",
            error
        );

        alert(
            "Unable to forward message"
        );
    }
}

/* =====================================================
   MESSAGE DATE
===================================================== */

function formatMessageDate(
    timestamp
) {

    if (!timestamp) {
        return "";
    }

    const date =
        new Date(timestamp);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    const today =
        new Date();

    const yesterday =
        new Date();

    yesterday.setDate(
        yesterday.getDate() - 1
    );

    if (
        date.toDateString() ===
        today.toDateString()
    ) {

        return "Today";
    }

    if (
        date.toDateString() ===
        yesterday.toDateString()
    ) {

        return "Yesterday";
    }

    return date.toLocaleDateString(
        undefined,
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

/* =====================================================
   MESSAGE TIME
===================================================== */

function formatMessageTime(
    timestamp
) {

    if (!timestamp) {
        return "";
    }

    const date =
        new Date(timestamp);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date.toLocaleTimeString(
        undefined,
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

/* =====================================================
   MESSAGE STATUS
===================================================== */

function getMessageStatusIcon(
    status
) {

    if (
        status === "READ"
    ) {

        return "✓✓";
    }

    if (
        status === "DELIVERED"
    ) {

        return "✓✓";
    }

    if (
        status === "SENT"
    ) {

        return "✓";
    }

    return "";
}

/* =====================================================
   DISAPPEARING MESSAGE MENU
===================================================== */

function openDisappearingMessageMenu() {

    const existing =
        document.getElementById(
            "disappearingMenu"
        );

    if (existing) {
        existing.remove();
    }

    const menu =
        document.createElement(
            "div"
        );

    menu.id =
        "disappearingMenu";

    menu.style.cssText = `
        position:fixed;
        z-index:1000001;
        background:#ffffff;
        border:1px solid #ddd;
        border-radius:12px;
        box-shadow:0 6px 25px rgba(0,0,0,.2);
        padding:6px;
        width:240px;
    `;

    menu.innerHTML = `
        <div
            style="
                padding:10px 12px;
                font-weight:600;
                border-bottom:1px solid #eee;
            "
        >
            Disappearing messages
        </div>

        <button
            type="button"
            onclick="setDisappearingDuration(0)"
        >
            Off
        </button>

        <button
            type="button"
            onclick="setDisappearingDuration(30 * 60 * 1000)"
        >
            30 minutes
        </button>

        <button
            type="button"
            onclick="setDisappearingDuration(60 * 60 * 1000)"
        >
            1 hour
        </button>

        <button
            type="button"
            onclick="setDisappearingDuration(2 * 60 * 60 * 1000)"
        >
            2 hours
        </button>

        <button
            type="button"
            onclick="openCustomDisappearingDuration()"
        >
            Custom
        </button>
    `;

    menu.querySelectorAll(
        "button"
    ).forEach(
        function (button) {

            button.style.cssText = `
                width:100%;
                border:none;
                background:#ffffff;
                padding:11px 12px;
                text-align:left;
                cursor:pointer;
                border-radius:7px;
                font-size:14px;
            `;
        }
    );

    document.body.appendChild(
        menu
    );

    const rect =
        menu.getBoundingClientRect();

    menu.style.left =
        Math.max(
            10,
            (
                window.innerWidth -
                rect.width
            ) / 2
        ) + "px";

    menu.style.top =
        Math.max(
            10,
            (
                window.innerHeight -
                rect.height
            ) / 2
        ) + "px";
}

/* =====================================================
   SET DISAPPEARING DURATION
===================================================== */

function setDisappearingDuration(
    durationMs
) {

    saveDisappearingSetting(
        durationMs
    );

    const menu =
        document.getElementById(
            "disappearingMenu"
        );

    if (menu) {
        menu.remove();
    }
}

/* =====================================================
   CUSTOM DISAPPEARING DURATION
===================================================== */

function openCustomDisappearingDuration() {

    const value =
        prompt(
            "Enter duration number:"
        );

    if (
        value === null ||
        value.trim() === ""
    ) {
        return;
    }

    const number =
        Number(
            value
        );

    if (
        !Number.isFinite(
            number
        ) ||
        number <= 0
    ) {

        alert(
            "Enter a valid duration"
        );

        return;
    }

    const unit =
        prompt(
            "Enter unit: minutes, hours, days, or months"
        );

    if (!unit) {
        return;
    }

    let multiplier;

    switch (
        unit
            .trim()
            .toLowerCase()
    ) {

        case "minute":
        case "minutes":

            multiplier =
                60 * 1000;

            break;

        case "hour":
        case "hours":

            multiplier =
                60 * 60 * 1000;

            break;

        case "day":
        case "days":

            multiplier =
                24 *
                60 *
                60 *
                1000;

            break;

        case "month":
        case "months":

            multiplier =
                30 *
                24 *
                60 *
                60 *
                1000;

            break;

        default:

            alert(
                "Use minutes, hours, days, or months"
            );

            return;
    }

    setDisappearingDuration(
        number * multiplier
    );
}

/* =====================================================
   DISAPPEARING MESSAGE LOCAL TIMER
   -----------------------------------------------------
   Backend remains responsible for actual expiration.
===================================================== */

function scheduleLocalMessageExpiry(
    messageId,
    expiresAt
) {

    if (
        !messageId ||
        !expiresAt
    ) {
        return;
    }

    const expiryTime =
        new Date(
            expiresAt
        ).getTime();

    if (
        Number.isNaN(
            expiryTime
        )
    ) {
        return;
    }

    const delay =
        expiryTime -
        Date.now();

    if (
        delay <= 0
    ) {

        removeMessageFromUI(
            messageId
        );

        return;
    }

    setTimeout(
        function () {

            removeMessageFromUI(
                messageId
            );

        },
        delay
    );
}

/* =====================================================
   REMOVE MESSAGE FROM UI
===================================================== */

function removeMessageFromUI(
    messageId
) {

    const element =
        document.querySelector(
            '[data-message-id="' +
            messageId +
            '"]'
        );

    if (element) {
        element.remove();
    }

    if (
        messageStore &&
        messageStore[messageId]
    ) {

        delete messageStore[
            messageId
        ];
    }
}
/* =====================================================
   RECEIVER PROFILE / THREE-DOT MENU
===================================================== */

function openReceiverOptionsMenu() {

    const existing =
        document.getElementById(
            "receiverOptionsMenu"
        );

    if (existing) {

        existing.remove();

        return;
    }

    if (
        typeof currentChatUser ===
            "undefined" ||
        !currentChatUser
    ) {

        return;
    }

    const menu =
        document.createElement(
            "div"
        );

    menu.id =
        "receiverOptionsMenu";

    menu.style.cssText = `
        position:fixed;
        top:70px;
        right:20px;
        width:240px;
        background:#ffffff;
        border:1px solid #ddd;
        border-radius:12px;
        box-shadow:0 6px 25px rgba(0,0,0,.2);
        z-index:999999;
        overflow:hidden;
    `;

    menu.innerHTML = `

        <div
            style="
                padding:13px 15px;
                border-bottom:1px solid #eee;
                font-weight:600;
                color:#222;
            "
        >
            ${escapeHtml(
                currentChatUser
            )}
        </div>

        <button
            type="button"
            id="receiverSearchButton"
        >
            <i class="fa-solid fa-magnifying-glass"></i>
            Search
        </button>

        <button
            type="button"
            id="receiverBlockButton"
            data-action="block"
        >
            🚫 Block
        </button>

        <button
            type="button"
            id="receiverDisappearButton"
        >
            ⏱ Disappearing messages
        </button>

        <button
            type="button"
            id="receiverMediaButton"
        >
            🖼 Media
        </button>

        <button
            type="button"
            id="receiverLinksButton"
        >
            🔗 Links
        </button>

        <button
            type="button"
            id="receiverDocumentsButton"
        >
            📄 Documents
        </button>
    `;

    menu.querySelectorAll(
        "button"
    ).forEach(
        function (button) {

            button.style.cssText = `
                width:100%;
                display:flex;
                align-items:center;
                gap:12px;
                border:none;
                border-bottom:1px solid #eee;
                background:#ffffff;
                padding:12px 15px;
                cursor:pointer;
                text-align:left;
                font-size:14px;
                color:#333;
            `;

            button.addEventListener(
                "mouseenter",
                function () {

                    button.style.background =
                        "#f5f7fb";
                }
            );

            button.addEventListener(
                "mouseleave",
                function () {

                    button.style.background =
                        "#ffffff";
                }
            );
        }
    );

    document.body.appendChild(
        menu
    );

    const searchButton =
        document.getElementById(
            "receiverSearchButton"
        );

    if (searchButton) {

        searchButton.onclick =
            function () {

                menu.remove();

                if (
                    typeof openMessageSearch ===
                    "function"
                ) {

                    openMessageSearch();
                }
            };
    }

    const blockButton =
        document.getElementById(
            "receiverBlockButton"
        );

    if (blockButton) {

        updateBlockMenu(
            currentReceiverBlocked
        );

        blockButton.onclick =
            async function () {

                await toggleReceiverBlock();
            };
    }

    const disappearButton =
        document.getElementById(
            "receiverDisappearButton"
        );

    if (disappearButton) {

        disappearButton.onclick =
            function () {

                menu.remove();

                openDisappearingMessageMenu();
            };
    }

    const mediaButton =
        document.getElementById(
            "receiverMediaButton"
        );

    if (mediaButton) {

        mediaButton.onclick =
            function () {

                menu.remove();

                showChatMedia();
            };
    }

    const linksButton =
        document.getElementById(
            "receiverLinksButton"
        );

    if (linksButton) {

        linksButton.onclick =
            function () {

                menu.remove();

                showChatLinks();
            };
    }

    const documentsButton =
        document.getElementById(
            "receiverDocumentsButton"
        );

    if (documentsButton) {

        documentsButton.onclick =
            function () {

                menu.remove();

                showChatDocuments();
            };
    }

    loadBlockStatus(
        currentChatUser
    );
}

/* =====================================================
   CLOSE RECEIVER MENU
===================================================== */

function closeReceiverMenu() {

    const menu =
        document.getElementById(
            "receiverOptionsMenu"
        );

    if (menu) {
        menu.remove();
    }
}

/* =====================================================
   CLOSE MENUS WHEN CLICKING OUTSIDE
===================================================== */

document.addEventListener(
    "click",
    function (event) {

        const menu =
            document.getElementById(
                "receiverOptionsMenu"
            );

        if (
            menu &&
            !menu.contains(
                event.target
            )
        ) {

            const button =
                document.getElementById(
                    "receiverOptionsButton"
                );

            if (
                !button ||
                !button.contains(
                    event.target
                )
            ) {

                menu.remove();
            }
        }

        const disappearingMenu =
            document.getElementById(
                "disappearingMenu"
            );

        if (
            disappearingMenu &&
            !disappearingMenu.contains(
                event.target
            )
        ) {

            disappearingMenu.remove();
        }
    }
);

/* =====================================================
   CHAT MEDIA
===================================================== */

function showChatMedia() {

    const mediaMessages =
        Object.values(
            messageStore || {}
        )
        .filter(
            function (message) {

                return (
                    message.messageType ===
                    "IMAGE"
                );
            }
        );

    openChatContentPanel(
        "Media",
        mediaMessages
    );
}

/* =====================================================
   CHAT LINKS
===================================================== */

function showChatLinks() {

    const linkMessages =
        Object.values(
            messageStore || {}
        )
        .filter(
            function (message) {

                const content =
                    message.content || "";

                return (
                    /https?:\/\/[^\s]+/i
                        .test(content)
                );
            }
        );

    openChatContentPanel(
        "Links",
        linkMessages
    );
}

/* =====================================================
   CHAT DOCUMENTS
===================================================== */

function showChatDocuments() {

    const documentMessages =
        Object.values(
            messageStore || {}
        )
        .filter(
            function (message) {

                return (
                    message.messageType ===
                        "DOCUMENT" ||
                    message.messageType ===
                        "FILE"
                );
            }
        );

    openChatContentPanel(
        "Documents",
        documentMessages
    );
}

/* =====================================================
   CHAT CONTENT PANEL
===================================================== */

function openChatContentPanel(
    title,
    messages
) {

    const existing =
        document.getElementById(
            "chatContentPanel"
        );

    if (existing) {
        existing.remove();
    }

    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "chatContentPanel";

    panel.style.cssText = `
        position:fixed;
        top:0;
        right:0;
        width:360px;
        max-width:90vw;
        height:100vh;
        background:#ffffff;
        z-index:1000000;
        box-shadow:-5px 0 25px rgba(0,0,0,.2);
        display:flex;
        flex-direction:column;
    `;

    const header =
        document.createElement(
            "div"
        );

    header.style.cssText = `
        height:60px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:0 16px;
        border-bottom:1px solid #ddd;
        flex-shrink:0;
    `;

    header.innerHTML = `
        <strong>
            ${escapeHtml(title)}
        </strong>

        <button
            type="button"
            id="closeChatContentPanel"
            style="
                border:none;
                background:transparent;
                font-size:22px;
                cursor:pointer;
            "
        >
            ×
        </button>
    `;

    panel.appendChild(
        header
    );

    const body =
        document.createElement(
            "div"
        );

    body.style.cssText = `
        flex:1;
        overflow-y:auto;
        padding:12px;
    `;

    if (
        !messages ||
        messages.length === 0
    ) {

        body.innerHTML = `
            <div
                style="
                    text-align:center;
                    color:#888;
                    padding:40px 10px;
                "
            >
                No ${escapeHtml(
                    title.toLowerCase()
                )} found
            </div>
        `;

    }
    else {

        messages.forEach(
            function (message) {

                const item =
                    document.createElement(
                        "div"
                    );

                item.style.cssText = `
                    padding:10px;
                    border-bottom:1px solid #eee;
                    cursor:pointer;
                `;

                if (
                    message.messageType ===
                    "IMAGE"
                ) {

                    item.innerHTML = `
                        <img
                            src="${escapeHtml(
                                message.content || ""
                            )}"
                            style="
                                width:90px;
                                height:90px;
                                object-fit:cover;
                                border-radius:8px;
                            "
                        >
                    `;

                }
                else {

                    item.innerHTML = `
                        <div
                            style="
                                font-size:13px;
                                color:#333;
                                word-break:break-word;
                            "
                        >
                            ${escapeHtml(
                                message.fileName ||
                                message.content ||
                                ""
                            )}
                        </div>
                    `;
                }

                item.onclick =
                    function () {

                        closeChatContentPanel();

                        scrollToMessage(
                            message.id
                        );
                    };

                body.appendChild(
                    item
                );
            }
        );
    }

    panel.appendChild(
        body
    );

    document.body.appendChild(
        panel
    );

    const closeButton =
        document.getElementById(
            "closeChatContentPanel"
        );

    if (closeButton) {

        closeButton.onclick =
            function () {

                closeChatContentPanel();
            };
    }
}

/* =====================================================
   CLOSE CHAT CONTENT PANEL
===================================================== */

function closeChatContentPanel() {

    const panel =
        document.getElementById(
            "chatContentPanel"
        );

    if (panel) {
        panel.remove();
    }
}

/* =====================================================
   SCROLL TO MESSAGE
===================================================== */

function scrollToMessage(
    messageId
) {

    const element =
        document.querySelector(
            '[data-message-id="' +
            messageId +
            '"]'
        );

    const chat =
        document.getElementById(
            "chat"
        );

    if (
        !element ||
        !chat
    ) {
        return;
    }

    element.scrollIntoView({
        behavior:
            "smooth",
        block:
            "center"
    });

    element.style.transition =
        "background .3s ease";

    const originalBackground =
        element.style.background;

    element.style.background =
        "#fff3cd";

    setTimeout(
        function () {

            element.style.background =
                originalBackground;

        },
        1200
    );
}

/* =====================================================
   RECEIVER PROFILE
===================================================== */

function openChatProfile() {

    if (
        typeof currentChatUser ===
            "undefined" ||
        !currentChatUser
    ) {

        return;
    }

    const existing =
        document.getElementById(
            "receiverProfilePanel"
        );

    if (existing) {
        existing.remove();

        return;
    }

    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "receiverProfilePanel";

    panel.style.cssText = `
        position:fixed;
        top:0;
        right:0;
        width:360px;
        max-width:90vw;
        height:100vh;
        background:#ffffff;
        z-index:1000000;
        box-shadow:-5px 0 25px rgba(0,0,0,.2);
        overflow-y:auto;
    `;

    panel.innerHTML = `

        <div
            style="
                height:60px;
                display:flex;
                align-items:center;
                gap:10px;
                padding:0 16px;
                border-bottom:1px solid #ddd;
            "
        >

            <button
                type="button"
                id="closeReceiverProfile"
                style="
                    border:none;
                    background:transparent;
                    font-size:22px;
                    cursor:pointer;
                "
            >
                ←
            </button>

            <strong>
                Profile
            </strong>

        </div>

        <div
            style="
                text-align:center;
                padding:28px 15px;
                border-bottom:1px solid #eee;
            "
        >

            <div
                style="
                    width:80px;
                    height:80px;
                    margin:0 auto 12px;
                    border-radius:50%;
                    background:#2196f3;
                    color:white;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:30px;
                "
            >
                <i class="fa-solid fa-user"></i>
            </div>

            <div
                style="
                    font-size:18px;
                    font-weight:600;
                "
            >
                ${escapeHtml(
                    currentChatUser
                )}
            </div>

        </div>

        <div
            style="
                padding:10px;
            "
        >

            <button
                type="button"
                onclick="
                    openDisappearingMessageMenu()
                "
                style="
                    width:100%;
                    border:none;
                    background:white;
                    padding:14px;
                    text-align:left;
                    cursor:pointer;
                    border-radius:8px;
                "
            >
                ⏱ Disappearing messages
            </button>

            <button
                type="button"
                onclick="
                    showChatMedia()
                "
                style="
                    width:100%;
                    border:none;
                    background:white;
                    padding:14px;
                    text-align:left;
                    cursor:pointer;
                    border-radius:8px;
                "
            >
                🖼 Media
            </button>

            <button
                type="button"
                onclick="
                    showChatLinks()
                "
                style="
                    width:100%;
                    border:none;
                    background:white;
                    padding:14px;
                    text-align:left;
                    cursor:pointer;
                    border-radius:8px;
                "
            >
                🔗 Links
            </button>

            <button
                type="button"
                onclick="
                    showChatDocuments()
                "
                style="
                    width:100%;
                    border:none;
                    background:white;
                    padding:14px;
                    text-align:left;
                    cursor:pointer;
                    border-radius:8px;
                "
            >
                📄 Documents
            </button>

            <button
                type="button"
                id="profileBlockButton"
                style="
                    width:100%;
                    border:none;
                    background:white;
                    padding:14px;
                    text-align:left;
                    cursor:pointer;
                    border-radius:8px;
                    color:#d32f2f;
                "
            >
                🚫 Block
            </button>

        </div>
    `;

    document.body.appendChild(
        panel
    );

    const closeButton =
        document.getElementById(
            "closeReceiverProfile"
        );

    if (closeButton) {

        closeButton.onclick =
            function () {

                panel.remove();
            };
    }

    const profileBlockButton =
        document.getElementById(
            "profileBlockButton"
        );

    if (profileBlockButton) {

        profileBlockButton.onclick =
            async function () {

                await toggleReceiverBlock();

                updateProfileBlockButton(
                    currentReceiverBlocked
                );
            };
    }

    loadBlockStatus(
        currentChatUser
    );

    updateProfileBlockButton(
        currentReceiverBlocked
    );
}

/* =====================================================
   PROFILE BLOCK BUTTON
===================================================== */

function updateProfileBlockButton(
    blocked
) {

    const button =
        document.getElementById(
            "profileBlockButton"
        );

    if (!button) {
        return;
    }

    if (blocked) {

        button.innerHTML =
            "🔓 Unblock";

        button.style.color =
            "#2e7d32";

    }
    else {

        button.innerHTML =
            "🚫 Block";

        button.style.color =
            "#d32f2f";
    }
}

/* =====================================================
   CURRENT USER PROFILE
===================================================== */

function openLoggedUserProfile() {

    const existing =
        document.getElementById(
            "loggedUserProfilePanel"
        );

    if (existing) {

        existing.remove();

        return;
    }

    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "loggedUserProfilePanel";

    panel.style.cssText = `
        position:fixed;
        top:0;
        left:0;
        width:320px;
        max-width:90vw;
        height:100vh;
        background:#ffffff;
        z-index:1000000;
        box-shadow:5px 0 25px rgba(0,0,0,.2);
    `;

    panel.innerHTML = `

        <div
            style="
                height:60px;
                display:flex;
                align-items:center;
                justify-content:space-between;
                padding:0 16px;
                border-bottom:1px solid #ddd;
            "
        >

            <strong>
                My Profile
            </strong>

            <button
                type="button"
                id="closeLoggedUserProfile"
                style="
                    border:none;
                    background:transparent;
                    font-size:22px;
                    cursor:pointer;
                "
            >
                ×
            </button>

        </div>

        <div
            style="
                text-align:center;
                padding:25px 15px;
                border-bottom:1px solid #eee;
            "
        >

            <div
                style="
                    width:75px;
                    height:75px;
                    margin:0 auto 10px;
                    border-radius:50%;
                    background:#2196f3;
                    color:white;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:28px;
                "
            >
                <i class="fa-solid fa-user"></i>
            </div>

            <div
                style="
                    font-weight:600;
                    font-size:17px;
                "
            >
                ${escapeHtml(
                    typeof loggedInUser !==
                    "undefined"
                        ? loggedInUser
                        : "User"
                )}
            </div>

        </div>

        <div
            style="
                padding:10px;
            "
        >

            <button
                type="button"
                onclick="openSettings()"
                style="
                    width:100%;
                    border:none;
                    background:white;
                    padding:14px;
                    text-align:left;
                    cursor:pointer;
                "
            >
                ⚙ Settings
            </button>

            <button
                type="button"
                onclick="logout()"
                style="
                    width:100%;
                    border:none;
                    background:white;
                    padding:14px;
                    text-align:left;
                    cursor:pointer;
                    color:#d32f2f;
                "
            >
                🚪 Logout
            </button>

        </div>
    `;

    document.body.appendChild(
        panel
    );

    const closeButton =
        document.getElementById(
            "closeLoggedUserProfile"
        );

    if (closeButton) {

        closeButton.onclick =
            function () {

                panel.remove();
            };
    }
}

/* =====================================================
   SETTINGS
===================================================== */

function openSettings() {

    const existing =
        document.getElementById(
            "settingsPanel"
        );

    if (existing) {

        existing.remove();

        return;
    }

    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "settingsPanel";

    panel.style.cssText = `
        position:fixed;
        top:0;
        right:0;
        width:340px;
        max-width:90vw;
        height:100vh;
        background:#ffffff;
        z-index:1000001;
        box-shadow:-5px 0 25px rgba(0,0,0,.2);
    `;

    panel.innerHTML = `

        <div
            style="
                height:60px;
                display:flex;
                align-items:center;
                gap:10px;
                padding:0 16px;
                border-bottom:1px solid #ddd;
            "
        >

            <button
                type="button"
                id="closeSettingsPanel"
                style="
                    border:none;
                    background:transparent;
                    font-size:22px;
                    cursor:pointer;
                "
            >
                ←
            </button>

            <strong>
                Settings
            </strong>

        </div>

        <div
            style="
                padding:15px;
                color:#666;
                font-size:14px;
            "
        >
            Chat settings
        </div>
    `;

    document.body.appendChild(
        panel
    );

    const closeButton =
        document.getElementById(
            "closeSettingsPanel"
        );

    if (closeButton) {

        closeButton.onclick =
            function () {

                panel.remove();
            };
    }
}

/* =====================================================
   INITIALIZE RECEIVER OPTIONS WHEN CHAT CHANGES
===================================================== */

function refreshReceiverChatOptions() {

    if (
        typeof currentChatUser ===
            "undefined" ||
        !currentChatUser
    ) {

        return;
    }

    initializeReceiverChatOptions(
        currentChatUser
    );
}

/* =====================================================
   OBSERVE CHAT HEADER
   -----------------------------------------------------
   If users.js changes the selected receiver,
   refresh block state.
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const chatWith =
            document.getElementById(
                "chatWith"
            );

        if (!chatWith) {
            return;
        }

        let previousReceiver =
            chatWith.textContent
                .trim();

        setInterval(
            function () {

                const receiver =
                    chatWith.textContent
                        .trim();

                if (
                    receiver &&
                    receiver !==
                        previousReceiver &&
                    receiver !==
                        "Select User"
                ) {

                    previousReceiver =
                        receiver;

                    if (
                        typeof currentChatUser ===
                        "undefined" ||
                        !currentChatUser
                    ) {

                        return;
                    }

                    refreshReceiverChatOptions();
                }

            },
            500
        );
    }
);

/* =====================================================
   RECEIVER BLOCK MESSAGE GUARD
===================================================== */

function canSendToCurrentReceiver() {

    if (
        currentReceiverBlocked
    ) {

        alert(
            "You blocked this user. Unblock them to send messages."
        );

        return false;
    }

    return true;
}

/* =====================================================
   UPDATE SEND GUARD
===================================================== */

const originalSendMessage =
    typeof sendMessage ===
    "function"
        ? sendMessage
        : null;

if (originalSendMessage) {

    window.sendMessage =
        function () {

            if (
                !canSendToCurrentReceiver()
            ) {

                return;
            }

            return originalSendMessage();
        };
}

/* =====================================================
   MESSAGE INPUT BLOCK GUARD
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

        input.addEventListener(
            "keydown",
            function (event) {

                if (
                    currentReceiverBlocked &&
                    event.key ===
                        "Enter"
                ) {

                    event.preventDefault();

                    alert(
                        "You blocked this user."
                    );
                }
            }
        );
    }
);

/* =====================================================
   MESSAGE REACTION LOADING
===================================================== */

function loadAllVisibleMessageReactions() {

    const elements =
        document.querySelectorAll(
            "[data-message-id]"
        );

    elements.forEach(
        function (element) {

            const messageId =
                element.dataset.messageId;

            if (messageId) {

                loadMessageReactions(
                    messageId
                );
            }
        }
    );
}

/* =====================================================
   RELOAD REACTIONS AFTER CHAT HISTORY
===================================================== */

const originalLoadConversation =
    typeof loadConversation ===
    "function"
        ? loadConversation
        : null;

if (originalLoadConversation) {

    window.loadConversation =
        async function () {

            const result =
                await originalLoadConversation();

            setTimeout(
                function () {

                    loadAllVisibleMessageReactions();

                },
                300
            );

            return result;
        };
}

/* =====================================================
   MESSAGE SCROLL TRACKING
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const chat =
            document.getElementById(
                "chat"
            );

        if (!chat) {
            return;
        }

        chat.addEventListener(
            "scroll",
            function () {

                const distance =
                    chat.scrollHeight -
                    (
                        chat.scrollTop +
                        chat.clientHeight
                    );

                userIsNearBottom =
                    distance < 120;
            }
        );
    }
);

/* =====================================================
   AUTO SCROLL WHEN MESSAGE ARRIVES
===================================================== */

function scrollIfNearBottom() {

    if (
        userIsNearBottom
    ) {

        scrollChatToBottom();
    }
}

/* =====================================================
   DISPLAY MESSAGE DATE SEPARATOR
===================================================== */

let lastRenderedDate =
    null;

function addDateSeparator(
    timestamp
) {

    const dateLabel =
        formatMessageDate(
            timestamp
        );

    if (!dateLabel) {
        return;
    }

    if (
        dateLabel ===
        lastRenderedDate
    ) {

        return;
    }

    lastRenderedDate =
        dateLabel;

    const chat =
        document.getElementById(
            "chat"
        );

    if (!chat) {
        return;
    }

    const separator =
        document.createElement(
            "div"
        );

    separator.className =
        "message-date-separator";

    separator.style.cssText = `
        text-align:center;
        margin:12px 0;
        color:#777;
        font-size:11px;
    `;

    separator.innerHTML = `
        <span
            style="
                background:#e9eef5;
                padding:5px 10px;
                border-radius:12px;
            "
        >
            ${escapeHtml(
                dateLabel
            )}
        </span>
    `;

    chat.appendChild(
        separator
    );
}
/* =====================================================
   WEBSOCKET MESSAGE HANDLER SUPPORT
===================================================== */

function handleIncomingChatMessage(
    message
) {

    if (!message) {
        return;
    }

    /*
     * Ignore messages that are not part
     * of the currently selected conversation.
     */

    if (
        typeof currentChatUser !==
        "undefined" &&
        currentChatUser
    ) {

        const currentUser =
            typeof loggedInUser !==
            "undefined"
                ? loggedInUser
                : null;

        const belongsToCurrentChat =
            (
                message.sender ===
                    currentChatUser &&
                message.receiver ===
                    currentUser
            )
            ||
            (
                message.sender ===
                    currentUser &&
                message.receiver ===
                    currentChatUser
            );

        if (
            !belongsToCurrentChat
        ) {

            showIncomingMessageNotification(
                message
            );

            return;
        }
    }

    /*
     * Save message locally.
     */

    if (message.id) {

        messageStore[
            message.id
        ] = message;
    }

    /*
     * Display message.
     */

    displayMessage(
        message
    );

    /*
     * Load reactions if the
     * message already has an ID.
     */

    if (message.id) {

        setTimeout(
            function () {

                loadMessageReactions(
                    message.id
                );

            },
            200
        );
    }

    /*
     * Auto-scroll.
     */

    scrollIfNearBottom();
}

/* =====================================================
   INCOMING MESSAGE NOTIFICATION
===================================================== */

function showIncomingMessageNotification(
    message
) {

    const notification =
        document.getElementById(
            "messageNotification"
        );

    if (!notification) {
        return;
    }

    const sender =
        document.getElementById(
            "messageNotificationSender"
        );

    const content =
        document.getElementById(
            "messageNotificationContent"
        );

    if (sender) {

        sender.textContent =
            message.sender ||
            "New message";
    }

    if (content) {

        content.textContent =
            message.content ||
            "You received a new message.";
    }

    notification.style.display =
        "block";

    /*
     * Automatically hide after
     * a few seconds.
     */

    clearTimeout(
        window.messageNotificationTimer
    );

    window.messageNotificationTimer =
        setTimeout(
            function () {

                hideMessageNotification();

            },
            5000
        );

    notification.onclick =
        function () {

            if (
                message.sender &&
                typeof selectUser ===
                "function"
            ) {

                selectUser(
                    message.sender
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

    if (notification) {

        notification.style.display =
            "none";
    }
}

/* =====================================================
   MARK MESSAGE AS READ
===================================================== */

async function markCurrentChatAsRead() {

    if (
        typeof currentChatUser ===
            "undefined" ||
        !currentChatUser
    ) {

        return;
    }

    const token =
        localStorage.getItem(
            "token"
        );

    if (!token) {
        return;
    }

    try {

        const response =
            await fetch(
                "/messages/read",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " + token
                    },

                    body:
                        JSON.stringify({
                            sender:
                                currentChatUser
                        })
                }
            );

        if (!response.ok) {
            return;
        }

    }
    catch (error) {

        console.error(
            "Unable to mark messages as read:",
            error
        );
    }
}

/* =====================================================
   MARK CURRENT CHAT DELIVERED
===================================================== */

async function markCurrentChatAsDelivered() {

    if (
        typeof currentChatUser ===
            "undefined" ||
        !currentChatUser
    ) {

        return;
    }

    const token =
        localStorage.getItem(
            "token"
        );

    if (!token) {
        return;
    }

    try {

        const response =
            await fetch(
                "/messages/delivered",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " + token
                    },

                    body:
                        JSON.stringify({
                            sender:
                                currentChatUser
                        })
                }
            );

        if (!response.ok) {
            return;
        }

    }
    catch (error) {

        console.error(
            "Unable to mark messages as delivered:",
            error
        );
    }
}

/* =====================================================
   REPLY CONTENT RENDERING
===================================================== */

function createReplyPreviewElement(
    message
) {

    if (
        !message ||
        !message.replyToMessageId
    ) {

        return null;
    }

    const reply =
        document.createElement(
            "div"
        );

    reply.className =
        "message-reply-preview";

    reply.style.cssText = `
        border-left:3px solid #2196f3;
        background:rgba(33,150,243,.08);
        border-radius:6px;
        padding:6px 8px;
        margin-bottom:6px;
        font-size:12px;
        color:#555;
        cursor:pointer;
    `;

    reply.innerHTML = `
        <div
            style="
                color:#2196f3;
                font-weight:600;
                margin-bottom:2px;
            "
        >
            Reply
        </div>

        <div
            style="
                white-space:nowrap;
                overflow:hidden;
                text-overflow:ellipsis;
            "
        >
            ${escapeHtml(
                message.replyToContent ||
                ""
            )}
        </div>
    `;

    reply.onclick =
        function () {

            scrollToMessage(
                message.replyToMessageId
            );
        };

    return reply;
}

/* =====================================================
   REBUILD MESSAGE WITH REPLY
===================================================== */

function renderMessageContent(
    message
) {

    const container =
        document.createElement(
            "div"
        );

    container.className =
        "message-content";

    const reply =
        createReplyPreviewElement(
            message
        );

    if (reply) {

        container.appendChild(
            reply
        );
    }

    const body =
        document.createElement(
            "div"
        );

    body.className =
        "message-body";

    /*
     * Forwarded label.
     */

    if (
        message.forwarded ===
        true
    ) {

        const forwardedLabel =
            document.createElement(
                "div"
            );

        forwardedLabel.style.cssText = `
            font-size:11px;
            color:#777;
            font-style:italic;
            margin-bottom:4px;
        `;

        forwardedLabel.innerHTML =
            `
                <i class="fa-solid fa-share"></i>
                Forwarded
            `;

        body.appendChild(
            forwardedLabel
        );
    }

    /*
     * Normal message content.
     */

    if (
        message.messageType ===
        "IMAGE"
    ) {

        const image =
            document.createElement(
                "img"
            );

        image.src =
            message.content || "";

        image.alt =
            message.fileName ||
            "Image";

        image.style.cssText = `
            max-width:260px;
            max-height:320px;
            border-radius:9px;
            display:block;
            cursor:pointer;
        `;

        image.onclick =
            function () {

                window.open(
                    image.src,
                    "_blank"
                );
            };

        body.appendChild(
            image
        );

    }
    else if (
        message.messageType ===
        "AUDIO"
    ) {

        const audio =
            document.createElement(
                "audio"
            );

        audio.controls =
            true;

        audio.src =
            message.content || "";

        audio.style.maxWidth =
            "260px";

        body.appendChild(
            audio
        );

    }
    else if (
        message.messageType ===
            "DOCUMENT" ||
        message.messageType ===
            "FILE"
    ) {

        const fileLink =
            document.createElement(
                "a"
            );

        fileLink.href =
            message.content || "";

        fileLink.target =
            "_blank";

        fileLink.rel =
            "noopener noreferrer";

        fileLink.style.cssText = `
            display:flex;
            align-items:center;
            gap:8px;
            text-decoration:none;
            color:inherit;
        `;

        fileLink.innerHTML = `
            <i class="fa-solid fa-file"></i>
            <span>
                ${escapeHtml(
                    message.fileName ||
                    "Download file"
                )}
            </span>
        `;

        body.appendChild(
            fileLink
        );

    }
    else {

        const text =
            document.createElement(
                "div"
            );

        text.textContent =
            message.content || "";

        text.style.whiteSpace =
            "pre-wrap";

        text.style.wordBreak =
            "break-word";

        body.appendChild(
            text
        );
    }

    container.appendChild(
        body
    );

    return container;
}

/* =====================================================
   MESSAGE FOOTER
===================================================== */

function createMessageFooter(
    message,
    isSender
) {

    const footer =
        document.createElement(
            "div"
        );

    footer.className =
        "message-footer";

    footer.style.cssText = `
        display:flex;
        align-items:center;
        justify-content:flex-end;
        gap:5px;
        margin-top:4px;
        font-size:10px;
        color:#777;
    `;

    const time =
        document.createElement(
            "span"
        );

    time.textContent =
        formatMessageTime(
            message.timestamp
        );

    footer.appendChild(
        time
    );

    if (message.edited) {

        const edited =
            document.createElement(
                "span"
            );

        edited.textContent =
            "Edited";

        footer.appendChild(
            edited
        );
    }

    if (isSender) {

        const status =
            document.createElement(
                "span"
            );

        status.textContent =
            getMessageStatusIcon(
                message.status
            );

        if (
            message.status ===
            "READ"
        ) {

            status.style.color =
                "#2196f3";
        }

        footer.appendChild(
            status
        );
    }

    return footer;
}

/* =====================================================
   IMPROVED MESSAGE DISPLAY
===================================================== */

function renderCompleteMessage(
    message
) {

    if (!message) {
        return;
    }

    const chat =
        document.getElementById(
            "chat"
        );

    if (!chat) {
        return;
    }

    const currentUser =
        typeof loggedInUser !==
        "undefined"
            ? loggedInUser
            : null;

    const isSender =
        message.sender ===
        currentUser;

    /*
     * Avoid duplicate message.
     */

    if (
        message.id &&
        document.querySelector(
            '[data-message-id="' +
            message.id +
            '"]'
        )
    ) {

        return;
    }

    /*
     * Store message.
     */

    if (message.id) {

        messageStore[
            message.id
        ] = message;
    }

    /*
     * Date separator.
     */

    addDateSeparator(
        message.timestamp
    );

    /*
     * Wrapper.
     */

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        isSender
            ? "message-wrapper sent"
            : "message-wrapper received";

    wrapper.dataset.messageId =
        message.id || "";

   wrapper.style.cssText = `
    display:flex;
    flex-direction:row;
    align-items:flex-end;
    justify-content:${isSender ? "flex-end" : "flex-start"};
    gap:4px;
    width:100%;
    margin-bottom:10px;
    position:relative;
`;

    /*
     * Bubble.
     */

    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "message-bubble";

    bubble.style.cssText = `
        max-width:75%;
        padding:9px 11px;
        border-radius:12px;
        position:relative;
        word-break:break-word;
        background:${isSender ? "#d9fdd3" : "#ffffff"};
        box-shadow:0 1px 2px rgba(0,0,0,.08);
    `;

    const content =
        renderMessageContent(
            message
        );

    bubble.appendChild(
        content
    );

    const footer =
        createMessageFooter(
            message,
            isSender
        );

    bubble.appendChild(
        footer
    );

    wrapper.appendChild(
        bubble
    );

    /*
     * Actions.
     */

    addMessageActions(
        wrapper,
        message,
        isSender
    );

    chat.appendChild(
        wrapper
    );

    /*
     * Reactions.
     */

    if (message.id) {

        setTimeout(
            function () {

                loadMessageReactions(
                    message.id
                );

            },
            100
        );
    }

    /*
     * Disappearing message.
     */

    if (
        message.expiresAt
    ) {

        scheduleLocalMessageExpiry(
            message.id,
            message.expiresAt
        );
    }

    scrollIfNearBottom();
}

/* =====================================================
   PATCH DISPLAY FUNCTION
===================================================== */

const basicDisplayMessage =
    displayMessage;

window.displayMessage =
    function (message) {

        /*
         * Use complete renderer.
         */

        renderCompleteMessage(
            message
        );
    };

/* =====================================================
   REFRESH CURRENT CHAT
===================================================== */

async function refreshCurrentChat() {

    lastRenderedDate =
        null;

    await loadConversation();

    setTimeout(
        function () {

            loadAllVisibleMessageReactions();

            markCurrentChatAsDelivered();

            markCurrentChatAsRead();

        },
        300
    );
}

/* =====================================================
   MESSAGE INPUT STATE
===================================================== */

function refreshMessageInputState() {

    applyBlockedInputState(
        currentReceiverBlocked
    );
}

/* =====================================================
   SELECTED USER CHANGE HELPER
===================================================== */

function onReceiverSelected(
    receiverUsername
) {

    if (!receiverUsername) {
        return;
    }

    currentReceiverBlocked =
        false;

    applyBlockedInputState(
        false
    );

    initializeReceiverChatOptions(
        receiverUsername
    );

    refreshCurrentChat();
}

/* =====================================================
   TYPING INDICATOR
===================================================== */

function sendTypingIndicator() {

    if (
        typeof stompClient ===
            "undefined" ||
        !stompClient ||
        !stompClient.connected
    ) {

        return;
    }

    if (
        typeof currentChatUser ===
            "undefined" ||
        !currentChatUser
    ) {

        return;
    }

    const sender =
        typeof loggedInUser !==
        "undefined"
            ? loggedInUser
            : null;

    if (!sender) {
        return;
    }

    stompClient.send(
        "/app/typing",
        {},
        JSON.stringify({

            sender:
                sender,

            receiver:
                currentChatUser,

            typing:
                true
        })
    );
}

/* =====================================================
   STOP TYPING INDICATOR
===================================================== */

function sendStopTypingIndicator() {

    if (
        typeof stompClient ===
            "undefined" ||
        !stompClient ||
        !stompClient.connected
    ) {

        return;
    }

    if (
        typeof currentChatUser ===
            "undefined" ||
        !currentChatUser
    ) {

        return;
    }

    const sender =
        typeof loggedInUser !==
        "undefined"
            ? loggedInUser
            : null;

    if (!sender) {
        return;
    }

    stompClient.send(
        "/app/typing",
        {},
        JSON.stringify({

            sender:
                sender,

            receiver:
                currentChatUser,

            typing:
                false
        })
    );
}

/* =====================================================
   TYPING EVENT
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

        let typingTimeout =
            null;

        input.addEventListener(
            "input",
            function () {

                if (
                    currentReceiverBlocked
                ) {

                    return;
                }

                sendTypingIndicator();

                clearTimeout(
                    typingTimeout
                );

                typingTimeout =
                    setTimeout(
                        function () {

                            sendStopTypingIndicator();

                        },
                        1000
                    );
            }
        );

        input.addEventListener(
            "blur",
            function () {

                clearTimeout(
                    typingTimeout
                );

                sendStopTypingIndicator();
            }
        );
    }
);

/* =====================================================
   UPDATE TYPING TEXT
===================================================== */

function updateTypingIndicator(
    username,
    typing
) {

    if (
        typeof currentChatUser ===
            "undefined" ||
        username !==
            currentChatUser
    ) {

        return;
    }

    const element =
        document.getElementById(
            "typing"
        );

    if (!element) {
        return;
    }

    if (typing) {

        element.textContent =
            "typing...";

        element.style.display =
            "block";

    }
    else {

        element.textContent =
            "";

        element.style.display =
            "none";
    }
}

/* =====================================================
   MESSAGE CONTENT LINKIFY
===================================================== */

function linkifyMessageText(
    text
) {

    if (!text) {
        return "";
    }

    const escaped =
        escapeHtml(
            text
        );

    return escaped.replace(
        /(https?:\/\/[^\s]+)/g,
        function (url) {

            return `
                <a
                    href="${url}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="
                        color:#1976d2;
                        text-decoration:underline;
                    "
                >
                    ${url}
                </a>
            `;
        }
    );
}

/* =====================================================
   GET MESSAGE TYPE ICON
===================================================== */

function getFileIcon(
    messageType
) {

    switch (
        String(
            messageType || ""
        ).toUpperCase()
    ) {

        case "IMAGE":

            return "fa-image";

        case "DOCUMENT":

            return "fa-file-lines";

        case "FILE":

            return "fa-paperclip";

        case "AUDIO":

            return "fa-microphone";

        default:

            return "fa-file";
    }
}

/* =====================================================
   MESSAGE TYPE LABEL
===================================================== */

function getMessageTypeLabel(
    messageType
) {

    switch (
        String(
            messageType || ""
        ).toUpperCase()
    ) {

        case "IMAGE":

            return "Image";

        case "DOCUMENT":

            return "Document";

        case "FILE":

            return "File";

        case "AUDIO":

            return "Voice message";

        default:

            return "Message";
    }
}
/* =====================================================
   MESSAGE HELPERS
===================================================== */

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    const div =
        document.createElement("div");

    div.textContent =
        String(value);

    return div.innerHTML;
}

/* =====================================================
   FORMAT MESSAGE TIME
===================================================== */

function formatMessageTime(
    timestamp
) {

    if (!timestamp) {
        return "";
    }

    try {

        const date =
            new Date(timestamp);

        if (isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }
    catch (error) {

        return "";
    }
}

/* =====================================================
   FORMAT MESSAGE DATE
===================================================== */

function formatMessageDate(
    timestamp
) {

    if (!timestamp) {
        return "";
    }

    try {

        const date =
            new Date(timestamp);

        if (isNaN(date.getTime())) {
            return "";
        }

        const today =
            new Date();

        const yesterday =
            new Date();

        yesterday.setDate(
            yesterday.getDate() - 1
        );

        if (
            date.toDateString() ===
            today.toDateString()
        ) {

            return "Today";
        }

        if (
            date.toDateString() ===
            yesterday.toDateString()
        ) {

            return "Yesterday";
        }

        return date.toLocaleDateString(
            [],
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    }
    catch (error) {

        return "";
    }
}

/* =====================================================
   MESSAGE STATUS ICON
===================================================== */

function getMessageStatusIcon(
    status
) {

    switch (
        String(
            status || ""
        ).toUpperCase()
    ) {

        case "READ":

            return "✓✓";

        case "DELIVERED":

            return "✓✓";

        case "SENT":

            return "✓";

        case "DELETED":

            return "";

        default:

            return "";
    }
}

/* =====================================================
   MESSAGE STORE
===================================================== */

if (
    typeof messageStore ===
    "undefined"
) {

    window.messageStore = {};
}

/* =====================================================
   BLOCK STATE
===================================================== */

if (
    typeof currentReceiverBlocked ===
    "undefined"
) {

    window.currentReceiverBlocked =
        false;
}

/* =====================================================
   DISAPPEARING MESSAGE SETTINGS
===================================================== */

if (
    typeof disappearingSettings ===
    "undefined"
) {

    window.disappearingSettings =
        {};
}

/* =====================================================
   LOAD BLOCK STATUS
===================================================== */

async function loadBlockStatus(
    username
) {

    if (!username) {
        return;
    }

    const token =
        localStorage.getItem(
            "token"
        );

    if (!token) {
        return;
    }

    try {

        const response =
            await fetch(
                "/blocks/status?username=" +
                encodeURIComponent(
                    username
                ),
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            "Bearer " +
                            token
                    }
                }
            );

        if (
            response.status ===
            404
        ) {

            /*
             * Backend block API has not
             * been added yet.
             *
             * Keep UI unblocked.
             */

            currentReceiverBlocked =
                false;

            return;
        }

        if (!response.ok) {

            return;
        }

        const data =
            await response.json();

        currentReceiverBlocked =
            Boolean(
                data.blocked
            );

        applyBlockedInputState(
            currentReceiverBlocked
        );

        updateBlockMenu(
            currentReceiverBlocked
        );

        updateProfileBlockButton(
            currentReceiverBlocked
        );

    }
    catch (error) {

        console.error(
            "Block status error:",
            error
        );
    }
}

/* =====================================================
   TOGGLE BLOCK
===================================================== */

async function toggleReceiverBlock() {

    if (
        typeof currentChatUser ===
        "undefined" ||
        !currentChatUser
    ) {

        return;
    }

    const token =
        localStorage.getItem(
            "token"
        );

    if (!token) {
        return;
    }

    const wasBlocked =
        currentReceiverBlocked;

    const endpoint =
        wasBlocked
            ? "/blocks/unblock"
            : "/blocks/block";

    try {

        const response =
            await fetch(
                endpoint,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " +
                            token
                    },

                    body:
                        JSON.stringify({
                            username:
                                currentChatUser
                        })
                }
            );

        if (
            !response.ok
        ) {

            const text =
                await response.text();

            alert(
                text ||
                "Unable to update block status"
            );

            return;
        }

        currentReceiverBlocked =
            !wasBlocked;

        applyBlockedInputState(
            currentReceiverBlocked
        );

        updateBlockMenu(
            currentReceiverBlocked
        );

        updateProfileBlockButton(
            currentReceiverBlocked
        );

        const receiverMenu =
            document.getElementById(
                "receiverOptionsMenu"
            );

        if (receiverMenu) {
            receiverMenu.remove();
        }

        const profilePanel =
            document.getElementById(
                "receiverProfilePanel"
            );

        if (profilePanel) {

            updateProfileBlockButton(
                currentReceiverBlocked
            );
        }

    }
    catch (error) {

        console.error(
            "Block/unblock error:",
            error
        );

        alert(
            "Unable to update block status"
        );
    }
}

/* =====================================================
   BLOCK MENU BUTTON
===================================================== */

function updateBlockMenu(
    blocked
) {

    const button =
        document.getElementById(
            "receiverBlockButton"
        );

    if (!button) {
        return;
    }

    if (blocked) {

        button.innerHTML =
            "🔓 Unblock";

        button.dataset.action =
            "unblock";

        button.style.color =
            "#2e7d32";

    }
    else {

        button.innerHTML =
            "🚫 Block";

        button.dataset.action =
            "block";

        button.style.color =
            "#d32f2f";
    }
}

/* =====================================================
   BLOCKED INPUT STATE
===================================================== */

function applyBlockedInputState(
    blocked
) {

    const input =
        document.getElementById(
            "message"
        );

    const sendButton =
        document.getElementById(
            "sendButton"
        );

    const micButton =
        document.getElementById(
            "micButton"
        );

    const attachmentButton =
        document.getElementById(
            "attachmentButton"
        );

    if (input) {

        input.disabled =
            Boolean(blocked);

        input.placeholder =
            blocked
                ? "User blocked"
                : "Type a message...";
    }

    if (sendButton) {

        sendButton.disabled =
            Boolean(blocked);

        sendButton.style.opacity =
            blocked
                ? "0.5"
                : "1";
    }

    if (micButton) {

        micButton.disabled =
            Boolean(blocked);

        micButton.style.opacity =
            blocked
                ? "0.5"
                : "1";
    }

    if (attachmentButton) {

        attachmentButton.disabled =
            Boolean(blocked);

        attachmentButton.style.opacity =
            blocked
                ? "0.5"
                : "1";
    }
}

/* =====================================================
   DISAPPEARING MESSAGE MENU
===================================================== */

function openDisappearingMessageMenu() {

    const existing =
        document.getElementById(
            "disappearingMenu"
        );

    if (existing) {

        existing.remove();

        return;
    }

    const menu =
        document.createElement(
            "div"
        );

    menu.id =
        "disappearingMenu";

    menu.style.cssText = `
        position:fixed;
        top:50%;
        left:50%;
        transform:translate(-50%,-50%);
        width:320px;
        max-width:90vw;
        background:#ffffff;
        border-radius:14px;
        box-shadow:0 8px 30px rgba(0,0,0,.25);
        z-index:1000002;
        overflow:hidden;
    `;

    menu.innerHTML = `

        <div
            style="
                padding:16px;
                border-bottom:1px solid #eee;
                font-weight:600;
            "
        >
            Disappearing messages
        </div>

        <button
            type="button"
            data-duration="0"
        >
            Off
        </button>

        <button
            type="button"
            data-duration="1800"
        >
            30 minutes
        </button>

        <button
            type="button"
            data-duration="3600"
        >
            1 hour
        </button>

        <button
            type="button"
            data-duration="7200"
        >
            2 hours
        </button>

        <button
            type="button"
            data-duration="86400"
        >
            1 day
        </button>

        <button
            type="button"
            data-duration="604800"
        >
            7 days
        </button>

        <button
            type="button"
            data-duration="2592000"
        >
            30 days
        </button>

        <button
            type="button"
            id="customDisappearButton"
        >
            Custom
        </button>

        <button
            type="button"
            id="closeDisappearButton"
        >
            Cancel
        </button>
    `;

    menu.querySelectorAll(
        "button"
    ).forEach(
        function (button) {

            button.style.cssText = `
                width:100%;
                padding:13px 16px;
                border:none;
                border-bottom:1px solid #eee;
                background:#ffffff;
                text-align:left;
                cursor:pointer;
                font-size:14px;
            `;

            button.addEventListener(
                "mouseenter",
                function () {

                    button.style.background =
                        "#f5f7fb";
                }
            );

            button.addEventListener(
                "mouseleave",
                function () {

                    button.style.background =
                        "#ffffff";
                }
            );
        }
    );

    document.body.appendChild(
        menu
    );

    menu.querySelectorAll(
        "[data-duration]"
    ).forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const seconds =
                        Number(
                            button.dataset.duration
                        );

                    setDisappearingDuration(
                        seconds
                    );

                    menu.remove();
                }
            );
        }
    );

    const customButton =
        document.getElementById(
            "customDisappearButton"
        );

    if (customButton) {

        customButton.onclick =
            function () {

                openCustomDisappearDialog();

                menu.remove();
            };
    }

    const closeButton =
        document.getElementById(
            "closeDisappearButton"
        );

    if (closeButton) {

        closeButton.onclick =
            function () {

                menu.remove();
            };
    }
}

/* =====================================================
   CUSTOM DISAPPEARING TIME
===================================================== */

function openCustomDisappearDialog() {

    const existing =
        document.getElementById(
            "customDisappearDialog"
        );

    if (existing) {
        existing.remove();
    }

    const dialog =
        document.createElement(
            "div"
        );

    dialog.id =
        "customDisappearDialog";

    dialog.style.cssText = `
        position:fixed;
        top:50%;
        left:50%;
        transform:translate(-50%,-50%);
        width:330px;
        max-width:90vw;
        background:#ffffff;
        border-radius:14px;
        box-shadow:0 8px 30px rgba(0,0,0,.25);
        z-index:1000003;
        padding:18px;
    `;

    dialog.innerHTML = `

        <div
            style="
                font-weight:600;
                margin-bottom:14px;
            "
        >
            Custom disappearing time
        </div>

        <input
            id="customDisappearValue"
            type="number"
            min="1"
            value="1"
            style="
                width:100%;
                padding:10px;
                border:1px solid #ccc;
                border-radius:8px;
                margin-bottom:10px;
            "
        >

        <select
            id="customDisappearUnit"
            style="
                width:100%;
                padding:10px;
                border:1px solid #ccc;
                border-radius:8px;
                margin-bottom:15px;
            "
        >
            <option value="60">
                Minutes
            </option>

            <option value="3600">
                Hours
            </option>

            <option value="86400">
                Days
            </option>

            <option value="604800">
                Weeks
            </option>

            <option value="2592000">
                Months
            </option>
        </select>

        <div
            style="
                display:flex;
                gap:8px;
            "
        >

            <button
                type="button"
                id="cancelCustomDisappear"
            >
                Cancel
            </button>

            <button
                type="button"
                id="saveCustomDisappear"
            >
                Save
            </button>

        </div>
    `;

    document.body.appendChild(
        dialog
    );

    [
        "cancelCustomDisappear",
        "saveCustomDisappear"
    ].forEach(
        function (id) {

            const button =
                document.getElementById(
                    id
                );

            if (button) {

                button.style.cssText = `
                    flex:1;
                    padding:10px;
                    border:none;
                    border-radius:8px;
                    cursor:pointer;
                    background:#2196f3;
                    color:white;
                `;
            }
        }
    );

    document.getElementById(
        "cancelCustomDisappear"
    ).onclick =
        function () {

            dialog.remove();
        };

    document.getElementById(
        "saveCustomDisappear"
    ).onclick =
        function () {

            const value =
                Number(
                    document.getElementById(
                        "customDisappearValue"
                    ).value
                );

            const unit =
                Number(
                    document.getElementById(
                        "customDisappearUnit"
                    ).value
                );

            if (
                !value ||
                value <= 0
            ) {

                alert(
                    "Enter a valid time"
                );

                return;
            }

            setDisappearingDuration(
                value * unit
            );

            dialog.remove();
        };
}

/* =====================================================
   SET DISAPPEARING DURATION
===================================================== */

async function setDisappearingDuration(
    seconds
) {

    if (
        typeof currentChatUser ===
            "undefined" ||
        !currentChatUser
    ) {

        return;
    }

    disappearingSettings[
        currentChatUser
    ] = seconds;

    /*
     * Try backend persistence.
     *
     * If endpoint is not available yet,
     * keep the setting locally.
     */

    const token =
        localStorage.getItem(
            "token"
        );

    if (token) {

        try {

            await fetch(
                "/messages/disappearing",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " +
                            token
                    },

                    body:
                        JSON.stringify({

                            receiver:
                                currentChatUser,

                            durationSeconds:
                                seconds
                        })
                }
            );

        }
        catch (error) {

            console.warn(
                "Disappearing setting backend unavailable; using local setting.",
                error
            );
        }
    }

    if (
        seconds === 0
    ) {

        alert(
            "Disappearing messages turned off."
        );

    }
    else {

        alert(
            "Disappearing messages set for " +
            formatDuration(
                seconds
            ) +
            "."
        );
    }
}

/* =====================================================
   FORMAT DURATION
===================================================== */

function formatDuration(
    seconds
) {

    if (
        seconds < 60
    ) {

        return (
            seconds +
            " seconds"
        );
    }

    if (
        seconds < 3600
    ) {

        return (
            Math.floor(
                seconds / 60
            ) +
            " minutes"
        );
    }

    if (
        seconds < 86400
    ) {

        return (
            Math.floor(
                seconds / 3600
            ) +
            " hours"
        );
    }

    if (
        seconds < 604800
    ) {

        return (
            Math.floor(
                seconds / 86400
            ) +
            " days"
        );
    }

    if (
        seconds < 2592000
    ) {

        return (
            Math.floor(
                seconds / 604800
            ) +
            " weeks"
        );
    }

    return (
        Math.floor(
            seconds / 2592000
        ) +
        " months"
    );
}

/* =====================================================
   LOCAL MESSAGE EXPIRY
===================================================== */

function scheduleLocalMessageExpiry(
    messageId,
    expiresAt
) {

    if (!messageId) {
        return;
    }

    const expiry =
        new Date(
            expiresAt
        ).getTime();

    if (
        isNaN(expiry)
    ) {

        return;
    }

    const remaining =
        expiry -
        Date.now();

    if (
        remaining <= 0
    ) {

        removeMessageFromScreen(
            messageId
        );

        return;
    }

    setTimeout(
        function () {

            removeMessageFromScreen(
                messageId
            );

        },
        remaining
    );
}

/* =====================================================
   REMOVE MESSAGE FROM SCREEN
===================================================== */

function removeMessageFromScreen(
    messageId
) {

    const element =
        document.querySelector(
            '[data-message-id="' +
            messageId +
            '"]'
        );

    if (element) {

        element.style.transition =
            "opacity .3s ease";

        element.style.opacity =
            "0";

        setTimeout(
            function () {

                element.remove();

            },
            300
        );
    }

    if (
        typeof messageStore !==
        "undefined"
    ) {

        delete messageStore[
            messageId
        ];
    }
}

/* =====================================================
   APPLY DISAPPEARING TIME TO NEW MESSAGE
===================================================== */

function getCurrentDisappearDuration() {

    if (
        typeof currentChatUser ===
            "undefined" ||
        !currentChatUser
    ) {

        return 0;
    }

    return Number(
        disappearingSettings[
            currentChatUser
        ] || 0
    );
}

/* =====================================================
   CREATE EXPIRY TIME
===================================================== */

function getMessageExpiryTime() {

    const duration =
        getCurrentDisappearDuration();

    if (
        !duration ||
        duration <= 0
    ) {

        return null;
    }

    return new Date(
        Date.now() +
        duration * 1000
    ).toISOString();
}

/* =====================================================
   APPLY EXPIRY TO MESSAGE
===================================================== */

function applyMessageExpiry(
    message
) {

    if (!message) {
        return message;
    }

    const duration =
        getCurrentDisappearDuration();

    if (
        duration > 0
    ) {

        message.expiresAt =
            getMessageExpiryTime();
    }

    return message;
}

/* =====================================================
   LOAD DISAPPEARING SETTING
===================================================== */

async function loadDisappearingSetting(
    username
) {

    if (!username) {
        return;
    }

    const token =
        localStorage.getItem(
            "token"
        );

    if (!token) {
        return;
    }

    try {

        const response =
            await fetch(
                "/messages/disappearing?receiver=" +
                encodeURIComponent(
                    username
                ),
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            "Bearer " +
                            token
                    }
                }
            );

        if (
            !response.ok
        ) {

            return;
        }

        const data =
            await response.json();

        disappearingSettings[
            username
        ] =
            Number(
                data.durationSeconds ||
                0
            );

    }
    catch (error) {

        console.warn(
            "Unable to load disappearing setting:",
            error
        );
    }
}

/* =====================================================
   INITIALIZE RECEIVER CHAT OPTIONS
===================================================== */

async function initializeReceiverChatOptions(
    username
) {

    if (!username) {
        return;
    }

    currentChatUser =
        username;

    await Promise.all([
        loadBlockStatus(
            username
        ),
        loadDisappearingSetting(
            username
        )
    ]);

    applyBlockedInputState(
        currentReceiverBlocked
    );

    updateBlockMenu(
        currentReceiverBlocked
    );

    updateProfileBlockButton(
        currentReceiverBlocked
    );
}

/* =====================================================
   SAFE SEND WRAPPER
===================================================== */

function isCurrentReceiverBlocked() {

    return Boolean(
        currentReceiverBlocked
    );
}

/* =====================================================
   PREVENT ATTACHMENT WHEN BLOCKED
===================================================== */

document.addEventListener(
    "click",
    function (event) {

        if (
            !currentReceiverBlocked
        ) {

            return;
        }

        const attachmentButton =
            event.target.closest(
                "#attachmentButton"
            );

        if (attachmentButton) {

            event.preventDefault();

            event.stopPropagation();

            alert(
                "You blocked this user."
            );
        }

        const micButton =
            event.target.closest(
                "#micButton"
            );

        if (micButton) {

            event.preventDefault();

            event.stopPropagation();

            alert(
                "You blocked this user."
            );
        }
    },
    true
);

/* =====================================================
   CLEANUP ON PAGE UNLOAD
===================================================== */

window.addEventListener(
    "beforeunload",
    function () {

        try {

            sendStopTypingIndicator();

        }
        catch (error) {

        }
    }
);

/* =====================================================
   FINAL INITIALIZATION
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /*
         * Make sure the current input state
         * is correct when the page opens.
         */

        applyBlockedInputState(
            currentReceiverBlocked
        );

        /*
         * Load reactions already visible.
         */

        setTimeout(
            function () {

                loadAllVisibleMessageReactions();

            },
            500
        );
    }
);

/* =====================================================
   END OF MESSAGES.JS
===================================================== */
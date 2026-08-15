/* =====================================================
   users.js

   Features:
   - Load logged-in user
   - Load all users
   - Hide logged-in user
   - Hide admin
   - Online / Offline
   - Last Seen
   - Unread message count
   - Remove unread count when chat is opened
   - Mark messages as READ
   - Select user
===================================================== */


/* =====================================================
   LOAD LOGGED-IN USER
===================================================== */

function loadCurrentUser() {

    let token =
        localStorage.getItem("token");


    if (!token) {

        console.error(
            "JWT token not found"
        );

        return;
    }


    fetch(
        "/user/me",
        {

            headers: {

                "Authorization":
                    "Bearer " + token

            }

        }
    )

    .then(response => {

        if (!response.ok) {

            throw new Error(
                "Failed to load current user"
            );

        }

        return response.json();

    })

    .then(user => {

        loggedInUser =
            user.username;


        console.log(
            "Logged in user:",
            loggedInUser
        );


        /*
         * Now load users.
         */

        loadUsers();

    })

    .catch(error => {

        console.error(
            "Error loading current user:",
            error
        );

    });

}


/* =====================================================
   LOAD ALL USERS
===================================================== */

function loadUsers() {

    let token =
        localStorage.getItem("token");


    if (!token) {

        console.error(
            "JWT token not found"
        );

        return;

    }


    fetch(
        "/user/all",
        {

            headers: {

                "Authorization":
                    "Bearer " + token

            }

        }
    )

    .then(response => {

        if (!response.ok) {

            throw new Error(
                "Failed to load users"
            );

        }

        return response.json();

    })

    .then(users => {


        let usersDiv =
            document.getElementById(
                "users"
            );


        if (!usersDiv) {

            console.error(
                "Users container not found"
            );

            return;

        }


        /*
         * Clear old users
         */

        usersDiv.innerHTML =
            "<h3>Users</h3>";


        /*
         * Loop through users
         */

        users.forEach(user => {


            /* =========================================
               HIDE LOGGED-IN USER
            ========================================= */

            if (
                user.username ===
                loggedInUser
            ) {

                return;

            }


            /* =========================================
               HIDE ADMIN
            ========================================= */

            if (
                user.username.toLowerCase() ===
                "admin"
            ) {

                return;

            }


            /* =========================================
               ONLINE / OFFLINE
            ========================================= */

            let statusHTML;


            if (user.online) {

                statusHTML = `

                    <div style="
                        color:green;
                        font-size:13px;
                        margin-top:3px;
                    ">

                        🟢 Online

                    </div>

                `;

            }

            else {

                let lastSeenText =
                    user.lastSeen
                        ? new Date(
                            user.lastSeen
                          ).toLocaleString()
                        : "Not available";


                statusHTML = `

                    <div style="
                        color:gray;
                        font-size:13px;
                        margin-top:3px;
                    ">

                        🔴 Offline

                    </div>

                    <div style="
                        color:#666;
                        font-size:12px;
                        margin-top:2px;
                    ">

                        Last Seen:
                        ${lastSeenText}

                    </div>

                `;

            }


            /* =========================================
               UNREAD COUNT
            ========================================= */

            let unreadCount =
                user.unreadCount || 0;


            /*
             * IMPORTANT
             *
             * If this user is currently open,
             * don't show unread badge.
             */

            if (
                user.username ===
                currentChatUser
            ) {

                unreadCount = 0;

            }


            let unreadHTML = "";


            if (
                unreadCount > 0
            ) {

                unreadHTML = `

                    <span
                        id="badge-${user.username}"

                        style="
                            background:red;
                            color:white;
                            border-radius:50%;
                            padding:4px 8px;
                            font-size:12px;
                            font-weight:bold;
                        "
                    >

                        ${unreadCount}

                    </span>

                `;

            }


            /* =========================================
               USER CARD
            ========================================= */

            usersDiv.innerHTML += `

                <div

                    onclick="
                        selectUser(
                            '${user.username}'
                        )
                    "

                    id="
                        user-${user.username}
                    "

                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        padding:12px;
                        border-bottom:1px solid #ddd;
                        cursor:pointer;
                    "
                >

                    <div>

                        <div style="
                            font-weight:bold;
                            font-size:15px;
                        ">

                            👤 ${user.username}

                        </div>


                        ${statusHTML}

                    </div>


                    <div
                        id="
                            badge-container-${user.username}
                        "
                    >

                        ${unreadHTML}

                    </div>

                </div>

            `;

        });

    })

    .catch(error => {

        console.error(
            "Error loading users:",
            error
        );

    });

}


/* =====================================================
   UPDATE UNREAD BADGE LIVE
===================================================== */

function updateUnreadBadge(
    username,
    unreadCount
) {


    /*
     * If this is the currently open chat,
     * unread must always be zero.
     */

    if (
        username ===
        currentChatUser
    ) {

        unreadCount = 0;

    }


    /*
     * Find existing badge
     */

    let badge =
        document.getElementById(
            "badge-" + username
        );


    /* =========================================
       NO UNREAD
    ========================================= */

    if (
        unreadCount <= 0
    ) {

        if (badge) {

            badge.remove();

        }

        return;

    }


    /* =========================================
       BADGE ALREADY EXISTS
    ========================================= */

    if (badge) {

        badge.innerHTML =
            unreadCount;

        return;

    }


    /* =========================================
       CREATE NEW BADGE
    ========================================= */

    let container =
        document.getElementById(
            "badge-container-" +
            username
        );


    if (!container) {

        return;

    }


    container.innerHTML = `

        <span

            id="
                badge-${username}
            "

            style="
                background:red;
                color:white;
                border-radius:50%;
                padding:4px 8px;
                font-size:12px;
                font-weight:bold;
            "
        >

            ${unreadCount}

        </span>

    `;

}


/* =====================================================
   SELECT USER
===================================================== */

function selectUser(username) {

    console.log(
        "================================="
    );

    console.log(
        "USER CLICKED:",
        username
    );

    console.log(
        "================================="
    );


    currentChatUser =
        username;


    document.getElementById(
        "chatWith"
    ).innerHTML =
        "Chat with " + username;


    /*
     * LOAD OLD MESSAGES
     */

    loadConversation(
        username
    );


    /*
     * MARK MESSAGES READ
     */

    markAsRead();


    /*
     * REMOVE UNREAD BADGE
     */

    const badge =
        document.getElementById(
            "badge-" + username
        );


    if (badge) {

        badge.remove();

    }

}
    /*
     * Also clear badge container.
     */

    let badgeContainer =
        document.getElementById(
            "badge-container-" +
            username
        );


    if (badgeContainer) {

        badgeContainer.innerHTML =
            "";

    }


    /* =========================================
       LOAD CHAT HISTORY
    ========================================= */

    if (
        typeof loadConversation ===
        "function"
    ) {

        loadConversation(
            username
        );

    }

    else {

        console.error(
            "loadConversation() is not defined. Check messages.js"
        );

    }


    /* =========================================
       MARK MESSAGES AS READ
    ========================================= */

    if (
        typeof markAsRead ===
        "function"
    ) {

        markAsRead();

    }




/* =====================================================
   CLEAR CURRENT CHAT
===================================================== */

function clearCurrentChat() {

    currentChatUser = "";


    let chatWith =
        document.getElementById(
            "chatWith"
        );


    if (chatWith) {

        chatWith.innerHTML =
            "Select User";

    }


    let typing =
        document.getElementById(
            "typing"
        );


    if (typing) {

        typing.innerHTML =
            "";

    }

}


/* =====================================================
   AUTO LOAD USER AFTER PAGE LOAD
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadCurrentUser();

    }
);
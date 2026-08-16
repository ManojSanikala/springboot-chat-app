/* =====================================================
   Global Application Variables
===================================================== */

let stompClient = null;
let loggedInUser = "";
let currentChatUser = "";
let typingTimer = null;
let replyingToMessage = null;
let lastDisplayedMessageDate = null;


/* =====================================================
   JWT SESSION CHECK
===================================================== */

function isJwtExpired() {

    const token =
        localStorage.getItem("token");

    /*
     * No token
     */

    if (!token) {

        return true;
    }


    try {

        const parts =
            token.split(".");


        /*
         * Invalid JWT structure
         */

        if (parts.length !== 3) {

            return true;
        }


        const payload =
            JSON.parse(
                atob(parts[1])
            );


        /*
         * JWT must contain expiration
         */

        if (!payload.exp) {

            return true;
        }


        /*
         * JWT exp = seconds
         * Date.now() = milliseconds
         */

        return (
            payload.exp * 1000
        ) <= Date.now();

    }
    catch (error) {

        console.error(
            "JWT validation error:",
            error
        );

        return true;
    }

}


/* =====================================================
   REDIRECT TO LOGIN
===================================================== */

function redirectToLogin() {

    /*
     * Prevent repeated redirects
     */

    if (
        window.location.pathname
            .endsWith("/login.html")
    ) {

        return;
    }


    window.location.replace(
        "/login.html"
    );

}


/* =====================================================
   SESSION EXPIRED
===================================================== */

function handleSessionExpired() {

    console.warn(
        "Session expired or JWT is invalid."
    );


    /*
     * Stop typing timer
     */

    if (typingTimer) {

        clearTimeout(
            typingTimer
        );

        typingTimer = null;

    }


    /*
     * Clear reply state
     */

    replyingToMessage =
        null;


    /*
     * Clear current chat
     */

    currentChatUser =
        "";


    /*
     * Disconnect WebSocket
     */

    if (
        stompClient &&
        stompClient.connected
    ) {

        try {

            stompClient.disconnect();

        }
        catch (error) {

            console.error(
                "WebSocket disconnect error:",
                error
            );

        }

    }


    stompClient =
        null;


    /*
     * Remove authentication
     */

    localStorage.removeItem(
        "token"
    );


    localStorage.removeItem(
        "currentChatUser"
    );


    /*
     * Clear temporary session data
     */

    sessionStorage.clear();


    /*
     * Redirect
     */

    redirectToLogin();

}


/* =====================================================
   APPLICATION START
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "Application started"
        );


        /*
         * Never perform chat session
         * validation on login page.
         */

        if (
            window.location.pathname
                .endsWith("/login.html")
        ) {

            return;
        }


        /*
         * Check JWT
         */

        if (
            isJwtExpired()
        ) {

            handleSessionExpired();

            return;
        }


        console.log(
            "JWT is valid."
        );


        /*
         * Load logged-in user
         */

        if (
            typeof loadCurrentUser ===
            "function"
        ) {

            loadCurrentUser();

        }
        else {

            console.error(
                "loadCurrentUser() is not defined."
            );

        }


        /*
         * Connect WebSocket
         */

        if (
            typeof connectWebSocket ===
            "function"
        ) {

            connectWebSocket();

        }
        else {

            console.error(
                "connectWebSocket() is not defined."
            );

        }

    }
);


/* =====================================================
   LOGOUT
===================================================== */

function logout() {

    console.log(
        "Logging out..."
    );


    /*
     * Stop typing timer
     */

    if (typingTimer) {

        clearTimeout(
            typingTimer
        );

        typingTimer =
            null;

    }


    /*
     * Clear reply state
     */

    replyingToMessage =
        null;


    /*
     * Clear current chat
     */

    currentChatUser =
        "";


    /*
     * Disconnect WebSocket
     */

    if (
        stompClient &&
        stompClient.connected
    ) {

        try {

            stompClient.disconnect(
                function () {

                    console.log(
                        "WebSocket disconnected."
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


    stompClient =
        null;


    /*
     * Remove JWT
     */

    localStorage.removeItem(
        "token"
    );


    /*
     * Remove selected chat
     */

    localStorage.removeItem(
        "currentChatUser"
    );


    /*
     * Clear temporary session data
     */

    sessionStorage.clear();


    /*
     * Redirect to login
     */

    window.location.replace(
        "/login.html"
    );

}


/* =====================================================
   BROWSER BACK / FORWARD CACHE PROTECTION
===================================================== */

window.addEventListener(
    "pageshow",
    function (event) {

        /*
         * This can happen when the browser
         * restores the previous page from
         * its back-forward cache.
         */

        if (
            event.persisted
        ) {

            console.log(
                "Page restored from browser cache."
            );


            if (
                isJwtExpired()
            ) {

                handleSessionExpired();

            }

        }

    }
);


/* =====================================================
   PERIODIC SESSION CHECK
   -----------------------------------------------------
   Checks every 30 seconds.
===================================================== */

setInterval(
    function () {

        /*
         * Don't check login page.
         */

        if (
            window.location.pathname
                .endsWith("/login.html")
        ) {

            return;
        }


        /*
         * Check current JWT.
         */

        if (
            isJwtExpired()
        ) {

            handleSessionExpired();

        }

    },
    30000
);
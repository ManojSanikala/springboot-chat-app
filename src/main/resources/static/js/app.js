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
   Application Start
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    console.log("Application started");

    loadCurrentUser();

    connectWebSocket();

});

function logout() {

    console.log("Logging out...");

    // Remove JWT
    localStorage.removeItem("token");

    // Clear current chat data if you have it
    localStorage.removeItem("currentChatUser");

    // Go back to login page
    window.location.href = "/login.html";
}
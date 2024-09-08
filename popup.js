let actionButton;
let messageDiv;

document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];
    if (activeTab) {
      var url = new URL(activeTab.url);
      actionButton = document.getElementById('actionButton');
      messageDiv = document.getElementById('message');

      if (url.hostname === 'kick.com') {
        actionButton.style.display = 'block';
        actionButton.innerText = 'Connect your account';
        actionButton.onclick = function() {
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: getCookies
          }, (results) => {
            if (results && results[0] && results[0].result) {
              const cookies = results[0].result;
              if (cookies && cookies.includes('session_token')) {
                sendCookiesToElectron(cookies);
              } else {
                messageDiv.innerText = 'Cookies not found or session_token missing. Please log in to your account or manually log in via Kichat.';
              }
            } else {
              messageDiv.innerText = 'Cookies not found. Please log in to your account or manually log in via Kichat.';
            }
          });
        };
      } else {
        messageDiv.innerText = 'This extension only works on kick.com.';
        actionButton.style.display = 'block';
        actionButton.innerText = 'Go to kick.com';
        actionButton.onclick = function() {
          chrome.tabs.create({ url: 'https://kick.com' });
        };
      }
    } else {
      document.getElementById('message').innerText = 'No active tab found.';
    }
  });
});

function getCookies() {
  return document.cookie;
}

function sendCookiesToElectron(cookies) {
  fetch('http://localhost:53340/login/cookies', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ cookies: cookies })
  })
  .then(response => response.text())
  .then(data => {
    console.log('Success:', data);
    messageDiv.innerText = data || "Cookies sent to Kichat.";
    actionButton.style.display = 'none'; // Hide the button on success
  })
  .catch((error) => {
    console.error('Error:', error);
    messageDiv.innerText =  "Failed to send cookies. Make sure you have installed kichat and try again.";
  });
}

(function() {
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  const originalFetch = window.fetch;

  window.headersList = [];
  window.cookiesList = "";

  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    this._url = url;
    this._method = method;
    this._headers = {};
    this.setRequestHeader = (name, value) => {
      this._headers[name] = value;
      XMLHttpRequest.prototype.setRequestHeader.call(this, name, value);
    };
    return originalXHROpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function(body) {
    this.addEventListener('readystatechange', function() {
      if (this.readyState === 4 && this._url.includes('kick.com')) {
        if (this._headers['X-XSRF-TOKEN']) {
          window.headersList.push({
            url: this._url,
            method: this._method,
            x_xsrf_token: this._headers['X-XSRF-TOKEN'],
            x_mobile_token: this._headers['X-Mobile-Token']
          });
        }
      }
    });
    return originalXHRSend.apply(this, arguments);
  };

  window.fetch = function(input, init) {
    return originalFetch.apply(this, arguments).then(response => {
      const url = typeof input === 'string' ? input : input.url;
      const headers = init && init.headers ? init.headers : {};

      if (url.includes('kick.com') && headers['X-XSRF-TOKEN']) {
        window.headersList.push({
          url: url,
          method: (init && init.method) || 'GET',
          x_xsrf_token: headers['X-XSRF-TOKEN'],
          x_mobile_token: headers['X-Mobile-Token']
        });
      }
      return response;
    });
  };

  window.startListening = function() {
    window.headersList = [];
    window.cookiesList = document.cookie;
  };

  window.stopListening = function() {
    return { headersList: window.headersList, cookiesList: window.cookiesList };
  };

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startListening') {
      window.startListening();
      sendResponse({ status: 'Listening started' });
    } else if (request.action === 'injectMessage') {
      injectMessage(request.message);
      sendResponse({ status: 'Message injected' });
    } else if (request.action === 'stopListening') {
      sendResponse(window.stopListening());
    }
  });

  function injectMessage(message) {
    const chatroomfooter = document.getElementById('chatroom-footer');
    if (!chatroomfooter) {
      return;
    }

    const input = chatroomfooter.querySelector('#message-input');
    if (input) {
      input.setAttribute('contenteditable', 'true');
      input.innerText = message;
      const sendRow = chatroomfooter.getElementsByClassName('send-row');
      const sendButton = sendRow[0].children[1];
      if (sendButton) {
        sendButton.removeAttribute('disabled');
        sendButton.click();
      }
    }
  }
})();

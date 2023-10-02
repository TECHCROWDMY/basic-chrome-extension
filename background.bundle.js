let storedPrompt = '';

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  let messageType = request.type || request.action;

  switch(messageType) {
    case "OPEN_NEW_TAB":
      chrome.tabs.create({ url: 'https://chat.openai.com/' });
      break;
    case "setPrompt":
      storedPrompt = request.prompt;
      break;
    case "getPrompt":
      sendResponse({prompt: storedPrompt});
      break;
    default:
      console.error("Unsupported request type sent:", messageType, "Full request:", JSON.stringify(request));
  }
});

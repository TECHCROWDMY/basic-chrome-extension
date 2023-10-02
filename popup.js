window.onload = function() {
  document.getElementById('pasteButton').addEventListener('click', function() {

    // Read clipboard text
    navigator.clipboard.readText().then(clipboardText => {
      
      // Open new tab
      chrome.tabs.create({url: 'https://www.google.com/'}, (tab) => {

        // Wait for the tab to finish loading
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (info.status === 'complete' && tabId === tab.id) {

            // Inject code to set textarea value after a slight delay
            setTimeout(() => {
              chrome.tabs.executeScript(tabId, {
                code: `document.getElementById('APjFqb').value = ${JSON.stringify(clipboardText)};`
              });
            }, 2000);  // 2 seconds delay to ensure the element is accessible

            // Remove listener to avoid multiple injections
            chrome.tabs.onUpdated.removeListener(listener);
          }
        });
      });

    }).catch(error => {
      console.error("Error reading clipboard:", error);
    });
  });
}

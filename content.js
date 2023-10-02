  async function pasteIntoTextarea() {
    const textarea = document.querySelector('#prompt-textarea');
    const textFromClipboard = await navigator.clipboard.readText();
    const textToPopulate = textFromClipboard.replace(/&#39;/g, "'") || 'default content';

    setTimeout(() => {
      if (textarea) {
        textarea.textContent = textToPopulate;
        textarea.focus();
        textarea.value = 'Summarise this for me \n' + textToPopulate;
        textarea.dispatchEvent(new Event("input", { bubbles: !0 }));
        const runButton = document.getElementsByTagName("textarea")[0].nextElementSibling;
        runButton.click();
      } else {
        console.error('Textarea element not found.');
      }
    }, 500);
  }
  function injectButton() {
    setTimeout(() => {
      const targetDiv = document.querySelector('ytd-watch-flexy #secondary');
        if (targetDiv && "www.youtube.com" === window.location.hostname) {
            const buttonElement = createButton();
            targetDiv.insertBefore(buttonElement, targetDiv.firstChild);
        } else if("chat.openai.com" === window.location.hostname){
            pasteIntoTextarea()
        }
    }, 500); // Adjust the delay as needed (in milliseconds)
  }
  function getYouTubeVideoId(url) {
    const urlParams = new URLSearchParams(new URL(url).search);
    const videoId = urlParams.get('v');
    return videoId ? videoId : null;
  }
  function createButton() {
    const button = document.createElement('button');
    button.textContent = 'Summarise Video';
    button.className = 'summies_yt_summary_btn';
    button.addEventListener('click', () => { summariseContent() });
    return button;
  }
  async function fetchTranscript() {

    // 1. FETCH VIDEO_ID VIA URL
    let videoId = ''
    const videoUrlElement = document.querySelector('link[itemprop=url]');
    if (videoUrlElement) {
      const videoUrl = videoUrlElement.getAttribute('href');
      videoId = getYouTubeVideoId(videoUrl);
    } 

    // 2. USE VIDEO_ID TO FETCH VIDEO DETAILS
    const t = await fetch("https://www.youtube.com/watch?v=" + videoId),
    n = await t.text(),
    r = n.split('"captions":'),
    i = n.split('"title":"');

    if (r.length < 2) return;
    if (i.length < 2) return;
    const a = JSON.parse(r[1].split(',"videoDetails')[0].replace("\n", "")).playerCaptionsTracklistRenderer.captionTracks,
      o = Array.from(a).map((e) => e.name.simpleText),
      s = i[1].split('","lengthSeconds"')[0] ?? "",
      l = "English";

    // 2.1 RAW TRANSCRIPT
    // console.log(`👇 VIDEO TRANSCRIPT RAW 👇\n ${a[0].baseUrl}`)

    // XML TO TEXT
    const xmlUrl = a[0].baseUrl;

    // 3: Fetch the XML File
    return fetch(xmlUrl)
      .then(response => response.text())
      .then(xmlData => {
        // Step 2: Parse the XML File
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlData, 'text/xml');

        // Step 3: Extract Text Content
        const extractText = (element) => {
          // If the element doesn't have children, return its textContent
          if (element.children.length === 0) {
            return element.textContent || '';
          }
        
          let text = '';
          for (let i = 0; i < element.children.length; i++) {
            text += extractText(element.children[i]);
          }
          return text;
        };
        const textContent = extractText(xmlDoc.documentElement);
        console.error(textContent);

        return textContent;
      })
      .catch(error => console.error('Error fetching or parsing XML:', error));

  }
  function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  // STEP 1: INJECT BUTTON ON PAGE LOAD
  window.addEventListener('load', () => {
    injectButton();
  });

  async function summariseContent() {
    // STEP 2 GET TRANSCRIPT ✅
    const transcript = await fetchTranscript();

    // STEP 3 COPY TRANSCRIPT TO CLIPBOARD ✅
    copyToClipboard(transcript);

    // STEP 4 OPEN CHATGPT IN NEW TAB ✅
    // Send a message to background script
    chrome.runtime.sendMessage({ type: 'OPEN_NEW_TAB' });

}


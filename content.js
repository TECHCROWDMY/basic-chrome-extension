  const style = document.createElement('style');
  style.textContent = `
    .summies_yt_summary_btn,
    .summies_yt_summary_btn_white {
      border-radius: 50px;
      border:none;
      font-size: 12px;
      line-height: 17px;
      color: #FFFFFF;
      padding: 10px 15px;
      font-weight: bold;
      letter-spacing:0.75px;
    }
    .summies_yt_summary_btn {
      background: linear-gradient(102.34deg, #4658FF 5.72%, #49B9D9 113.86%);
      color: #FFFFFF;
    }
    .summies_yt_summary_btn_white {
      background: #fff;
      color: rgba(33, 33, 33, 0.65);
    }
    .summies_yt_summary_btn:hover,
    .summies_yt_summary_btn_white:hover {
      cursor: pointer;
    }
    .summies_yt_container {
      background: rgb(255, 255, 255, 0.17);
      border-radius: 10px;
      width:100%;
      padding: 10px 10px;
      display:flex;
      justify-content: space-between;
    }
  `;
  document.head.appendChild(style);
  function createButton() {
    const button = document.createElement('button');
    button.textContent = 'Summarise Video';
    button.className = 'summies_yt_summary_btn';
    button.addEventListener('click', () => { summariseContent() });
    return button;
  }
  function createHTML() {
    //DIV CONTAINER
    const div = document.createElement('div');
    div.id = 'my-div';
    div.className = 'summies_yt_container';
    
    //SUMMIES LOGO
    const img = document.createElement('img');
    img.src = 'https://cdn-images-1.medium.com/v2/resize:fit:1280/1*jYKuDOUj7w8ABAPYLqd0CQ.png';
    img.width = 35;
    div.appendChild(img);
    
    //SUMMARISE BUTTON
    const button = document.createElement('button');
    button.className = 'summies_yt_summary_btn_white';
    button.textContent = 'Summarise this content';
    button.addEventListener('click', summariseContent);
    div.appendChild(button);

    return div;
  }
  function injectButton() {
    setTimeout(() => {
        const targetDiv = document.querySelector('ytd-watch-flexy #secondary');
        if (targetDiv && "www.youtube.com" === window.location.hostname) {
            // const buttonElement = createButton();
            const buttonElement = createHTML();
            targetDiv.insertBefore(buttonElement, targetDiv.firstChild);
        } else if ("chat.openai.com" === window.location.hostname) {
            pasteIntoTextarea()
        }
    }, 200);
  }
  async function fetchTranscript() {
    // 1. FETCH VIDEO_ID VIA URL
    const videoId = new URL(window.location.href).searchParams.get('v');

    // 2. USE VIDEO_ID TO FETCH VIDEO DETAILS
    const t = await fetch("https://www.youtube.com/watch?v=" + videoId),
    n = await t.text(),
    r = n.split('"captions":'),
    i = n.split('"title":"');

    if (r.length < 2) return;
    if (i.length < 2) return;
    const a = JSON.parse(r[1].split(',"videoDetails')[0].replace("\n", "")).playerCaptionsTracklistRenderer.captionTracks;

    // RAW TRANSCRIPT
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
  async function pasteIntoTextarea() {
    const textarea = document.querySelector('#prompt-textarea');
    const textFromClipboard = await navigator.clipboard.readText();
    const textToPopulate = textFromClipboard.replace(/&#39;/g, "'") || 'default content';

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
  }
  function getYouTubeVideoId(url) {
    const urlParams = new URLSearchParams(new URL(url).search);
    const videoId = urlParams.get('v');
    return videoId ? videoId : null;
  }
  async function summariseContent() {
    // STEP 2 GET TRANSCRIPT ✅
    const transcript = await fetchTranscript();

    // STEP 3 COPY TRANSCRIPT TO CLIPBOARD ✅
    copyToClipboard(transcript);

    // STEP 4 OPEN CHATGPT IN A NEW TAB ✅
    chrome.runtime.sendMessage({ type: 'OPEN_NEW_TAB' });
  }

  window.addEventListener('load', () => {
    // STEP 1: INJECT BUTTON IN YOUTUBE ON PAGE LOAD
    injectButton();
  });
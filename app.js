/**
 * ShareTXT - Frontend Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Screens
  const screenSelection = document.getElementById('screen-selection');
  const screenSend = document.getElementById('screen-send');
  const screenReceive = document.getElementById('screen-receive');

  // DOM Elements - Selection Buttons
  const cardSend = document.getElementById('card-choose-send');
  const cardReceive = document.getElementById('card-choose-receive');
  const logoBtn = document.getElementById('logo-btn');

  // DOM Elements - Send Screen
  const btnBackSend = document.getElementById('btn-back-send');
  const sendTextInput = document.getElementById('send-text-input');
  const charCount = document.getElementById('char-count');
  const charCounterWrapper = document.getElementById('char-counter-wrapper');
  const btnPasteSend = document.getElementById('btn-paste-send');
  const btnClearSend = document.getElementById('btn-clear-send');
  const btnSubmitSend = document.getElementById('btn-submit-send');
  const sendBtnText = document.getElementById('send-btn-text');
  const sendResultCard = document.getElementById('send-result-card');
  const generatedCode = document.getElementById('generated-code');
  const btnCopyCode = document.getElementById('btn-copy-code');

  // DOM Elements - Receive Screen
  const btnBackReceive = document.getElementById('btn-back-receive');
  const receiveForm = document.getElementById('receive-form');
  const receiveCodeInput = document.getElementById('receive-code-input');
  const btnSubmitReceive = document.getElementById('btn-submit-receive');
  const receiveBtnText = document.getElementById('receive-btn-text');
  const receiveResultCard = document.getElementById('receive-result-card');
  const receiveSuccessBox = document.getElementById('receive-success-box');
  const receivedTextContent = document.getElementById('received-text-content');
  const btnCopyReceived = document.getElementById('btn-copy-received');
  const receiveErrorBox = document.getElementById('receive-error-box');

  // DOM Elements - Settings Modal & Toast
  const btnSettings = document.getElementById('btn-settings');
  const modalSettings = document.getElementById('modal-settings');
  const apiUrlInput = document.getElementById('api-url-input');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const toastContainer = document.getElementById('toast-container');

  // App State - Spring Boot Endpoint: /transfer
  let rawApiUrl = localStorage.getItem('sharetxt_api_url') || 'http://localhost:8080/transfer';
  
  // Helper to ensure the base URL points to the backend /transfer mapping
  function getTransferEndpoint() {
    let url = rawApiUrl.trim().replace(/\/+$/, '');
    if (!url.endsWith('/transfer')) {
      url += '/transfer';
    }
    return url;
  }

  apiUrlInput.value = rawApiUrl;

  // Navigation Logic
  function showScreen(screenToShow) {
    [screenSelection, screenSend, screenReceive].forEach(screen => {
      screen.classList.remove('active');
    });
    screenToShow.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cardSend.addEventListener('click', () => {
    showScreen(screenSend);
    sendTextInput.focus();
  });

  cardReceive.addEventListener('click', () => {
    showScreen(screenReceive);
    receiveCodeInput.focus();
  });

  btnBackSend.addEventListener('click', () => showScreen(screenSelection));
  btnBackReceive.addEventListener('click', () => showScreen(screenSelection));
  logoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showScreen(screenSelection);
  });

  // Settings Modal Logic
  btnSettings.addEventListener('click', () => modalSettings.classList.add('active'));
  btnCloseModal.addEventListener('click', () => modalSettings.classList.remove('active'));
  modalSettings.addEventListener('click', (e) => {
    if (e.target === modalSettings) modalSettings.classList.remove('active');
  });

  btnSaveSettings.addEventListener('click', () => {
    let url = apiUrlInput.value.trim();
    if (!url) url = 'http://localhost:8080/transfer';
    rawApiUrl = url;
    localStorage.setItem('sharetxt_api_url', rawApiUrl);
    modalSettings.classList.remove('active');
    showToast('Backend API URL updated: ' + getTransferEndpoint(), 'success');
  });

  // Character Counter & Max Length Enforcement (4,999 Chars)
  sendTextInput.addEventListener('input', () => {
    const length = sendTextInput.value.length;
    charCount.textContent = length;

    if (length >= 4999) {
      charCounterWrapper.className = 'char-counter limit';
    } else if (length >= 4500) {
      charCounterWrapper.className = 'char-counter warning';
    } else {
      charCounterWrapper.className = 'char-counter';
    }
  });

  // Helper Tool Buttons (Paste / Clear)
  btnPasteSend.addEventListener('click', async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        sendTextInput.value = clipboardText.slice(0, 4999);
        sendTextInput.dispatchEvent(new Event('input'));
        showToast('Text pasted from clipboard', 'success');
      }
    } catch (err) {
      showToast('Clipboard permission denied or unavailable', 'error');
    }
  });

  btnClearSend.addEventListener('click', () => {
    sendTextInput.value = '';
    sendTextInput.dispatchEvent(new Event('input'));
    sendResultCard.style.display = 'none';
    showToast('Text area cleared', 'success');
  });

  // SEND FLOW: Hit POST /transfer?text={text} -> Display Code & Instructions
  btnSubmitSend.addEventListener('click', async () => {
    const textValue = sendTextInput.value.trim();

    if (!textValue) {
      showToast('Please enter some text to send', 'error');
      sendTextInput.focus();
      return;
    }

    setButtonLoading(btnSubmitSend, sendBtnText, 'Sending...');
    sendResultCard.style.display = 'none';

    try {
      const endpoint = getTransferEndpoint();
      // Spring Boot Backend Controller API mapping:
      // @PostMapping("/transfer") public String data(@RequestParam String text)
      const postUrl = `${endpoint}?text=${encodeURIComponent(textValue)}`;

      const response = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: new URLSearchParams({ text: textValue })
      });

      if (response.ok) {
        const code = await response.text();
        generatedCode.textContent = code || 'N/A';
        sendResultCard.style.display = 'block';
        sendResultCard.scrollIntoView({ behavior: 'smooth' });
        showToast('Transfer code generated!', 'success');
      } else {
        throw new Error(`Server status ${response.status}`);
      }
    } catch (error) {
      console.error('Send Error:', error);
      showToast(`API Error: ${error.message}`, 'error');
    } finally {
      resetButtonLoading(btnSubmitSend, sendBtnText, 'Generate Code & Send');
    }
  });

  // Copy Code Helper
  btnCopyCode.addEventListener('click', () => {
    const codeToCopy = generatedCode.textContent;
    if (codeToCopy && codeToCopy !== '------') {
      navigator.clipboard.writeText(codeToCopy);
      showToast(`Code ${codeToCopy} copied to clipboard!`, 'success');
    }
  });

  // RECEIVE FLOW: Hit GET /transfer?i={code} -> Display Text or "Data not found"
  async function handleReceive() {
    const code = receiveCodeInput.value.trim();

    if (!code) {
      showToast('Please enter a transfer code', 'error');
      receiveCodeInput.focus();
      return;
    }

    setButtonLoading(btnSubmitReceive, receiveBtnText, 'Fetching...');
    receiveResultCard.style.display = 'none';
    receiveSuccessBox.style.display = 'none';
    receiveErrorBox.style.display = 'none';

    try {
      const endpoint = getTransferEndpoint();
      // Spring Boot Backend Controller API mapping:
      // @GetMapping("/transfer") public String recieve(@RequestParam String i)
      const getUrl = `${endpoint}?i=${encodeURIComponent(code)}`;

      const response = await fetch(getUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain, application/json, */*'
        }
      });

      if (response.status === 200) {
        const returnedText = await response.text();
        
        // If status 200 and text exists
        if (returnedText && returnedText.trim() !== '' && !returnedText.includes('Internal Server Error')) {
          receivedTextContent.textContent = returnedText;
          receiveResultCard.style.display = 'block';
          receiveSuccessBox.style.display = 'block';
          receiveResultCard.scrollIntoView({ behavior: 'smooth' });
          showToast('Text received successfully!', 'success');
        } else {
          showReceiveError();
        }
      } else {
        // Non-200 status (e.g. 404) -> Data not found
        showReceiveError();
      }
    } catch (error) {
      console.error('Receive Error:', error);
      showReceiveError();
    } finally {
      resetButtonLoading(btnSubmitReceive, receiveBtnText, 'Fetch Text');
    }
  }

  function showReceiveError() {
    receiveResultCard.style.display = 'block';
    receiveErrorBox.style.display = 'flex';
    receiveResultCard.scrollIntoView({ behavior: 'smooth' });
    showToast('Data not found', 'error');
  }

  btnSubmitReceive.addEventListener('click', handleReceive);
  receiveForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleReceive();
  });

  // Copy Received Text Helper
  btnCopyReceived.addEventListener('click', () => {
    const textToCopy = receivedTextContent.textContent;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      showToast('Received text copied to clipboard!', 'success');
    }
  });

  // UI Utilities
  function setButtonLoading(btn, textSpan, loadingText) {
    btn.disabled = true;
    textSpan.innerHTML = `<span class="spinner"></span> ${loadingText}`;
  }

  function resetButtonLoading(btn, textSpan, originalText) {
    btn.disabled = false;
    textSpan.textContent = originalText;
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <svg width="18" height="18" fill="none" stroke="${type === 'success' ? '#10b981' : '#ef4444'}" viewBox="0 0 24 24">
        ${type === 'success' 
          ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>'
          : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
        }
      </svg>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
});

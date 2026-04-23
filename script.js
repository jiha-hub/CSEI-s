document.addEventListener('DOMContentLoaded', () => {
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const chatMessages = document.getElementById('chatMessages');
  const breathingCircle = document.querySelector('.breathing-circle');
  const suggestionChips = document.querySelectorAll('.chip');
  
  // Keep scrolling to bottom when new messages appear
  const scrollToBottom = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
  };

  // Add a new message to the chat
  const addMessage = (text, sender) => {
    const messageRow = document.createElement('div');
    messageRow.className = `message-row ${sender === 'user' ? 'user-message' : 'bot-message'}`;
    
    // Create inner HTML based on sender
    if (sender === 'user') {
      messageRow.innerHTML = `
        <div class="bubble user-bubble">${text}</div>
        <div class="avatar">
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
             <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
          </svg>
        </div>
      `;
    } else {
      messageRow.innerHTML = `
        <div class="avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="#5A6A62" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div class="bubble bot-bubble">${text}</div>
      `;
    }
    
    // Remove suggestion chips if they exist
    const suggestions = document.querySelector('.chat-suggestions');
    if (suggestions) {
      suggestions.style.display = 'none';
    }
    
    // Remove delay for new dynamically added messages so they animate immediately
    messageRow.style.animationDelay = '0s';
    
    chatMessages.appendChild(messageRow);
    scrollToBottom();
  };

  // Handle send action
  const handleSend = () => {
    const text = chatInput.value.trim();
    if (!text) return;
    
    // 1. Add User Message
    addMessage(text, 'user');
    chatInput.value = '';
    
    // 2. Add loading animation state (pulse)
    breathingCircle.classList.add('pulse-anim');
    
    // 3. Simulate bot typing / loading
    setTimeout(() => {
      // Remove loading pulse
      breathingCircle.classList.remove('pulse-anim');
      
      // Add Bot Message
      addMessage("당신의 마음에 귀 기울이고 있습니다. 언제든 편안히 말씀해주세요.", 'bot');
    }, 1500);
  };

  // Event Listeners
  sendBtn.addEventListener('click', handleSend);
  
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  });

  // Suggestion chips logic
  suggestionChips.forEach(chip => {
    chip.addEventListener('click', () => {
      chatInput.value = chip.textContent;
      handleSend();
    });
  });
  
  // Initially only pulse when waiting for interaction or loading.
  // The CSS has infinite pulse, but let's toggle it off initially after 4 seconds 
  // to show the "pulse when loading" requirement nicely.
  setTimeout(() => {
    breathingCircle.classList.remove('pulse-anim');
  }, 4000);
});

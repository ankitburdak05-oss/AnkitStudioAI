// ============================================================
//  ANKITSTUDIO ASSISTANT ENGINE (MODULAR)
// ============================================================

function getAiResponseText(userText) {
    const text = userText.toLowerCase().trim();
    
    // 1. GREETINGS & INTRO
    if (text === 'hi' || text === 'hello' || text === 'hey' || text === 'hii' || text === 'hiii' || text === 'yo' || text === 'hola') {
        return "Hello! Main AnkitStudio Assistant hoon. Main aapko is Instagram clone ke features use karne aur settings customize karne me help kar sakta hoon. Aap kya jaan na chahte hain? 😊\n\n💡 Try asking:\n- How to upload a Reel?\n- How to toggle Dark Mode?\n- How to create a saved folder?";
    }
    if (text.includes('kya haal') || text.includes('kaise ho') || text.includes('how are you') || text.includes('how r u')) {
        return "Main bilkul fresh aur badhiya hoon! Aap batayein, aaj aapka din kaisa chal raha hai? Aaj koi nayi Reel ya photo upload karne ka plan hai kya? 🎬";
    }
    if (text.includes('who are you') || text.includes('kaun ho') || text.includes('tumhara naam') || text.includes('your name') || text.includes('introduce')) {
        return "Main hoon **AnkitStudio Assistant**! Mujhe AnkitStudio team ne design kiya hai taaki main is premium social media platform par aapko smooth experience de sakoon. Main aapka chat companion aur support guide dono hoon. 💬";
    }
    if (text.includes('creator') || text.includes('developer') || text.includes('ankit') || text.includes('kisne banaya')) {
        return "AnkitStudio ko **Ankit** (AnkitStudioAI Creator) ne develop kiya hai! Yeh ek state-of-the-art Instagram clone hai jisme social sharing, interactive chat bot, direct calling aur custom Reels player features shamil hain. 😎";
    }

    // 2. REELS
    if (text.includes('reel') || text.includes('video') || text.includes('scroll') || text.includes('music') || text.includes('song') || text.includes('vinyl') || text.includes('audio')) {
        if (text.includes('upload') || text.includes('post') || text.includes('create') || text.includes('nayi') || text.includes('banana')) {
            return "🎬 **Nayi Reel post karne ke liye:**\n1. Feed page ke top bar me ya niche navigation panel me **'+' (Plus)** icon par click karein.\n2. Option grid me se **'Reel'** choose karein.\n3. Apni video ka URL/file select karein, background music name add karein, aur exciting description likhein!\n4. 'Post' button dabaate hi aapki Reel dynamic player me publish ho jayegi!";
        }
        if (text.includes('scroll') || text.includes('auto')) {
            return "🔄 **Auto-Scroll Feature:**\nReels player viewport ke top-right corner me ek floating toggle button hai. Jab aap use active karenge, toh har Reel khatam hote hi agri Reel automatic scroll ho jayegi (hands-free viewing)!";
        }
        if (text.includes('music') || text.includes('song') || text.includes('vinyl') || text.includes('marquee')) {
            return "🎵 **Reels Music Player:**\nHar Reel ke sath niche ek horizontal scrolling song name marquee dikhta hai. Iske sath side me ek spinning rotating Vinyl Record dikhta hai, jo song playback hone par spin hota hai aur pause hone par stop ho jata hai. Aap center tap karke mute/unmute kar sakte hain!";
        }
        return "🎬 **Reels Feature Highlights:**\n- **Auto-Scroll**: Hands-free auto playback loop.\n- **Vinyl Record Anim**: Track playback visualizer disk.\n- **Song Marquee**: Live track display.\n- Naya video upload karne ke liye home window ke '+' button ka use karein!";
    }

    // 3. STORIES
    if (text.includes('story') || text.includes('stories') || text.includes('status') || text.includes('24 hour') || text.includes('24 ghante')) {
        if (text.includes('upload') || text.includes('post') || text.includes('add') || text.includes('lagaye')) {
            return "📸 **Nayi Story upload karne ke liye:**\n1. Main home feed par top menu me '+' icon ya navigation panel me '+' tap karein.\n2. Select screen par **'Story'** select karein.\n3. Apni photo ya graphic link upload karein aur submit karein.\n4. Aapki story home view ke top bar circle list me show hone lagegi aur 24 hours baad automatic remove ho jayegi!";
        }
        return "📸 **Stories in AnkitStudio:**\n- Stories dashboard ke top round bars me circular borders ke roop me dikhti hain.\n- Kisi bhi user ke story circle par click karke aap unki stories slide view me check kar sakte hain.\n- Stories upload karne ke liye upload modal me 'Story' mode choose karein.";
    }

    // 4. DIRECT MESSAGES & CALLS
    if (text.includes('message') || text.includes('chat') || text.includes('dm') || text.includes('call') || text.includes('phone') || text.includes('video call') || text.includes('voice call')) {
        if (text.includes('call') || text.includes('phone') || text.includes('audio') || text.includes('video')) {
            return "📞 **Calling Feature:**\nAnkitStudio DMs ke top bar me direct Voice aur Video calling icons hain! Jab aap call initiate karenge, toh centered pop-up screen aayegi. Aap call disconnect karne ke liye red hang-up button dabayein.";
        }
        if (text.includes('photo') || text.includes('image') || text.includes('bheje') || text.includes('send')) {
            return "🖼️ **Sending Photos in Chat:**\nChat window ke chat input bar me left side par ek camera/attachment icon hai. Use click karke aap local media select karke direct image upload karke friend ko DM me send kar sakte hain!";
        }
        return "💬 **Direct Messaging (DMs) in AnkitStudio:**\n- Real-time conversation tracking via Firebase Database.\n- **Typing Indicators**: Friend type karega toh live status dikhega.\n- **Online Status**: User profile name ke side me green online indicator dot show hoti hai.\n- Naya chat start karne ke liye 'New Chat' button click karein aur user email add karein.";
    }

    // 5. PROFILE & CUSTOMIZATION
    if (text.includes('profile') || text.includes('bio') || text.includes('edit') || text.includes('photo') || text.includes('avatar') || text.includes('follow')) {
        if (text.includes('edit') || text.includes('change') || text.includes('bio') || text.includes('photo') || text.includes('avatar')) {
            return "👤 **Profile customization kaise karein:**\n1. Bottom navigation bar me extreme-right profile icon par tap karke apne Profile Page par jayein.\n2. **'Edit Profile'** button par click karein.\n3. Yahan aap apna Display Name, Bio Description, personal website URL aur profile photo photoURL link edit kar sakte hain.\n4. 'Save' click karte hi aapki profile real-time update ho jayegi!";
        }
        if (text.includes('follow') || text.includes('unfollow') || text.includes('follower')) {
            return "🤝 **Follow & Unfollow System:**\n- Kisi bhi creator ki profile page par jakar 'Follow' button par click karke aap unhe subscribe kar sakte hain.\n- Aapki dynamic follower and following counters instantly sync ho jayengi aur search options me unki posts visible rahengi.";
        }
        return "👤 **Profile Features:**\n- Edit Name, Website link, Avatar image URL and customized Bios.\n- Grid and saved collections navigation tabs.\n- Real-time Follow/Unfollow interaction tracking.";
    }

    // 6. SAVED COLLECTIONS
    if (text.includes('save') || text.includes('collection') || text.includes('bookmark') || text.includes('folder')) {
        return "📁 **Saved Collections System:**\n- Kisi bhi post ko save karne ke liye post card ke bottom right me **Bookmark** icon par tap karein.\n- Tab aapke samne custom folders load honge. Aap direct default 'All Saved Posts' select kar sakte hain ya **'Create New Folder'** click karke custom folder (e.g. 'Travel', 'Art') bana sakte hain.\n- Apne saved folders ko dekhne ke liye profile page ke bookmark tab par click karein!";
    }

    // 7. SETTINGS & THEMING
    if (text.includes('theme') || text.includes('dark') || text.includes('night') || text.includes('light') || text.includes('settings') || text.includes('mode')) {
        return "🌗 **Dark Mode & Themes:**\n- Aap settings page par jakar dark mode toggle click karke instant Sleek Dark Theme ya Bright Light Theme apply kar sakte hain.\n- Platform aapke theme parameters ko dynamic CSS styles me load karta hai, jisse dynamic gradients aur eye-friendly visuals apply ho sakein!";
    }

    // 8. FUN / CASUAL / ADVICE
    if (text.includes('viral') || text.includes('growth') || text.includes('views') || text.includes('popular')) {
        return "🚀 **Reels ko viral kaise karein - Pro Tips:**\n1. **High Quality Video**: Achhe lighting aur clear video content ka use karein.\n2. **Trending Audio**: Reels music player section se trending song choose karein.\n3. **Engaging Caption**: Caption me interactive sawal poochein taaki comments badhein.\n4. **Consistent Uploads**: Rozana 1-2 content posts share karne se platform algorithm support karta hai!";
    }
    if (text.includes('joke') || text.includes('chutkula') || text.includes('hasao') || text.includes('funny')) {
        return "Humor time! 😄\n\n*Admin: Aaj humara website download count 10 Million cross ho gaya!*\n*User: Wow! Kitne accounts active hain?*\n*Admin: Do hi hain... Main aur mera duplicate Firebase database test account!* 😂";
    }
    if (text.includes('shayari') || text.includes('poetry') || text.includes('kavita')) {
        return "Kuch lines aapke liye creators! ✍️\n\n*Social media ka ye ajeeb mela hai,*\n*Har koi posts ke clicks me akela hai.*\n*Naya content upload karke toh dekho,*\n*AnkitStudio me reels ka hi bas khela hai!* 🌟";
    }

    // 9. DEFAULT SMART RESPONSE
    return "Main aapke sawal par thoda aur detail me search kar sakta hoon! 💬\n\nKya aap mujhe thoda specify karenge ki aap kis feature (Reels, Story upload, DM Voice/Video calls, Profile edit, Dark Mode settings) ke baare me jaan na chahte hain? Main aapko complete step-by-step guide karunga.";
}

function showTypingIndicatorUnified(isSPA) {
    const containerId = isSPA ? 'chatMsgs' : 'chatMessages';
    const indicatorId = isSPA ? 'aiIndexTypingIndicator' : 'aiTypingIndicator';
    const container = document.getElementById(containerId);
    if (!container) return;
    if (document.getElementById(indicatorId)) return;
    
    // Inject animation style once
    if (!document.getElementById('typing-animation-style-unified')) {
        const style = document.createElement('style');
        style.id = 'typing-animation-style-unified';
        style.innerHTML = `
            @keyframes unified-typing-bounce {
                0%, 80%, 100% { transform: scale(0.3); opacity: 0.4; }
                40% { transform: scale(1.0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    const typingDiv = document.createElement('div');
    typingDiv.id = indicatorId;
    typingDiv.className = isSPA ? 'msg-bubble msg-recv' : 'msg-bubble msg-received';
    typingDiv.style.display = 'flex';
    typingDiv.style.alignItems = 'center';
    typingDiv.style.gap = '4px';
    typingDiv.style.width = 'fit-content';
    typingDiv.style.alignSelf = 'flex-start';
    typingDiv.style.padding = isSPA ? '8px 12px' : '12px 18px';
    typingDiv.style.borderRadius = isSPA ? '16px' : '20px';
    if (!isSPA) typingDiv.style.borderBottomLeftRadius = '4px';
    typingDiv.style.background = isSPA ? '#f1f0f0' : 'var(--ig-secondary-background)';
    if (!isSPA) typingDiv.style.border = '1px solid var(--ig-stroke)';
    
    const dotColor = isSPA ? '#8e8e8e' : 'var(--ig-secondary-text)';
    typingDiv.innerHTML = `
        <span style="width: 6px; height: 6px; background: ${dotColor}; border-radius: 50%; display: inline-block; animation: unified-typing-bounce 1.4s infinite ease-in-out both; animation-delay: -0.32s;"></span>
        <span style="width: 6px; height: 6px; background: ${dotColor}; border-radius: 50%; display: inline-block; animation: unified-typing-bounce 1.4s infinite ease-in-out both; animation-delay: -0.16s;"></span>
        <span style="width: 6px; height: 6px; background: ${dotColor}; border-radius: 50%; display: inline-block; animation: unified-typing-bounce 1.4s infinite ease-in-out both;"></span>
    `;
    
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;
}

function hideTypingIndicatorUnified(isSPA) {
    const indicatorId = isSPA ? 'aiIndexTypingIndicator' : 'aiTypingIndicator';
    const indicator = document.getElementById(indicatorId);
    if (indicator) indicator.remove();
}

function triggerAiResponseUnified(userText, isSPA) {
    showTypingIndicatorUnified(isSPA);
    
    const delay = 1000 + Math.random() * 1500;
    setTimeout(() => {
        hideTypingIndicatorUnified(isSPA);
        
        const aiResponseText = getAiResponseText(userText);
        const myUid = firebase.auth().currentUser ? firebase.auth().currentUser.uid : null;
        if (!myUid) return;
        
        const chatId = isSPA ? [myUid, 'ankitstudio_ai_bot'].sort().join('_') : (typeof getChatId === 'function' ? getChatId(myUid, 'ankitstudio_ai_bot') : [myUid, 'ankitstudio_ai_bot'].sort().join('_'));
        const dbRef = isSPA ? db : firebase.database();
        
        dbRef.ref('chats/' + chatId + '/messages').push({
            text: aiResponseText,
            senderId: myUid,
            isBot: true,
            timestamp: Date.now(),
            read: true,
            type: 'text'
        }).then(() => {
            dbRef.ref('users/' + myUid + '/chats/ankitstudio_ai_bot').update({
                partnerUid: 'ankitstudio_ai_bot',
                partnerName: 'AnkitStudio Assistant',
                lastMessage: aiResponseText,
                lastMessageTime: Date.now(),
                lastSender: 'ankitstudio_ai_bot',
                unreadCount: 0
            });
        });
    }, delay);
}

let activeCategory = '';
let activeAi = '';
let searchQuery = '';

function renderCards(data) {
    const grid = document.getElementById('promptGrid');
    const noResults = document.getElementById('noResults');
    if (data.length === 0) {
        grid.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    noResults.style.display = 'none';
    grid.innerHTML = data.map(p => `
        <div class="prompt-card" onclick="openModal(${p.id})">
            <div class="prompt-thumb" style="background:${p.thumbGrad}">
                <span class="thumb-icon">${p.emoji}</span>
                ${p.badge ? `<div class="prompt-badge ${p.badgeClass}">${p.badge}</div>` : ''}
            </div>
            <div class="prompt-body">
                <div class="prompt-ai-tag ${p.aiClass}">${p.ai}</div>
                <div class="prompt-title">${p.title}</div>
                <div class="prompt-preview">${p.prompt}</div>
                <div class="prompt-footer">
                    <div class="prompt-author">
                        <div class="author-avatar">${p.author[0]}</div>
                        ${p.author}
                    </div>
                    <div class="prompt-rating"><i class="fas fa-star"></i> ${p.rating}</div>
                </div>
                <div class="prompt-footer" style="margin-top:10px; border-top:1px solid rgba(255,255,255,0.05); padding-top:8px;">
                    <span class="${p.free ? 'price-free prompt-price' : 'price-paid prompt-price'}">${p.free ? 'FREE' : '₹49'}</span>
                    <span style="font-size:11px;color:var(--muted); font-weight:600;"><i class="fas fa-download"></i> ${p.downloads}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function getFiltered() {
    return prompts.filter(p => {
        const matchCat = !activeCategory || p.category === activeCategory || p.ai.includes(activeCategory) || p.title.toLowerCase().includes(activeCategory.toLowerCase());
        const matchAi  = !activeAi || p.ai === activeAi;
        const q = searchQuery.toLowerCase();
        const matchQ   = !q || p.title.toLowerCase().includes(q) || p.prompt.toLowerCase().includes(q) || p.ai.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
        return matchCat && matchAi && matchQ;
    });
}

function filterPrompts() {
    const h = document.getElementById('heroSearch').value;
    const n = document.getElementById('navSearch').value;
    searchQuery = h || n;
    renderCards(getFiltered());
}

function setCategoryFilter(cat) {
    activeCategory = cat;
    document.getElementById('clearFilter').style.display = cat ? 'block' : 'none';
    renderCards(getFiltered());
    document.getElementById('featured').scrollIntoView({behavior:'smooth'});
}

function setAiFilter(ai, btn) {
    activeAi = ai;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderCards(getFiltered());
}

function openModal(id) {
    const p = prompts.find(x => x.id === id);
    if (!p) return;
    document.getElementById('modalAiTag').textContent = p.ai;
    document.getElementById('modalAiTag').className = 'modal-ai-tag ' + p.aiClass;
    document.getElementById('modalTitle').textContent = p.title;
    document.getElementById('modalPrompt').textContent = p.prompt;
    document.getElementById('modalMeta').innerHTML = `
        <div class="modal-meta-item"><i class="fas fa-star"></i> ${p.rating} Rating</div>
        <div class="modal-meta-item"><i class="fas fa-download"></i> ${p.downloads} Downloads</div>
        <div class="modal-meta-item"><i class="fas fa-tag"></i> ${p.free ? 'FREE' : '₹49'}</div>
        <div class="modal-meta-item"><i class="fas fa-user"></i> ${p.author}</div>
    `;
    const btn = document.getElementById('modalCopyBtn');
    btn.innerHTML = '<i class="fas fa-copy"></i> &nbsp; COPY PROMPT';
    btn.className = 'modal-copy-btn';
    document.getElementById('modalOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal(e) {
    if (e.target === document.getElementById('modalOverlay')) closeModalDirect();
}
function closeModalDirect() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

function copyModalPrompt() {
    const text = document.getElementById('modalPrompt').textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('modalCopyBtn');
        btn.innerHTML = '<i class="fas fa-check"></i> &nbsp; COPIED!';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-copy"></i> &nbsp; COPY PROMPT';
            btn.classList.remove('copied');
        }, 2500);
    });
}

function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({behavior:'smooth'});
}

// ===== AUTH SYSTEM AGENTS =====
let currentTab = 'create';
let emailEntered = false;

// Google Sign-In Function
function loginWithGoogle() {
    const provider = new window.GoogleAuthProvider();
    window.signInWithPopup(window.auth, provider)
        .then((result) => {
            console.log('User signed in:', result.user);
            const userName = result.user.displayName || result.user.email;
            document.getElementById('userDisplay').textContent = userName;
            document.getElementById('userDisplay').style.display = 'inline-block';
            document.getElementById('loginBtn').style.display = 'none';
            closeAuth();
        })
        .catch((error) => {
            console.error('Sign-in error:', error.message);
            alert('Sign-in failed: ' + error.message);
        });
}
// Expose immediately after definition to ensure availability for inline handlers
window.loginWithGoogle = loginWithGoogle;

function openAuthModal() {
    document.getElementById('authOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    document.getElementById('authSuccess').classList.remove('show');
    document.getElementById('authForm').style.display = 'block';
}

function closeAuth() {
    document.getElementById('authOverlay').classList.remove('open');
    document.body.style.overflow = '';
    emailEntered = false;
    document.getElementById('authEmail').value = '';
    document.getElementById('authPassword').value = '';
    document.getElementById('authPassword').style.display = 'none';
    document.getElementById('continueText').textContent = 'CONTINUE';
}

function closeAuthOutside(e) {
    if (e.target === document.getElementById('authOverlay')) closeAuth();
}

function switchTab(tab) {
    currentTab = tab;
    emailEntered = false;
    document.getElementById('authPassword').style.display = 'none';
    document.getElementById('authEmail').value = '';
    document.getElementById('authPassword').value = '';
    document.getElementById('continueText').textContent = 'CONTINUE';

    document.getElementById('tabCreate').classList.toggle('active', tab === 'create');
    document.getElementById('tabLogin').classList.toggle('active', tab === 'login');

    if (tab === 'create') {
        document.getElementById('authTitle').textContent = 'CREATE ACCOUNT';
        document.getElementById('authSub').textContent = 'Join 10,000+ AI enthusiasts & creators';
        document.getElementById('authCheckboxRow').style.display = 'flex';
        document.getElementById('authSwitch').innerHTML = 'Already have an account? <span>Login here</span>';
        document.getElementById('authSwitch').onclick = () => switchTab('login');
    } else {
        document.getElementById('authTitle').textContent = 'WELCOME BACK';
        document.getElementById('authSub').textContent = 'Login to your ANKITSTUDIOAI account';
        document.getElementById('authCheckboxRow').style.display = 'none';
        document.getElementById('authSwitch').innerHTML = "Don't have an account? <span>Sign up free</span>";
        document.getElementById('authSwitch').onclick = () => switchTab('create');
    }
}

function handleContinue() {
    const email = document.getElementById('authEmail').value.trim();
    if (!email || !email.includes('@')) {
        document.getElementById('authEmail').style.borderColor = 'var(--red)';
        document.getElementById('authEmail').style.boxShadow = '0 0 0 3px var(--red-glow)';
        document.getElementById('authEmail').focus();
        setTimeout(() => {
            document.getElementById('authEmail').style.borderColor = '';
            document.getElementById('authEmail').style.boxShadow = '';
        }, 1500);
        return;
    }
    if (!emailEntered) {
        emailEntered = true;
        const pwField = document.getElementById('authPassword');
        pwField.style.display = 'block';
        document.getElementById('continueText').textContent = currentTab === 'create' ? 'CREATE ACCOUNT' : 'LOGIN';
        pwField.focus();
        return;
    }
    fakeLogin();
}

function fakeLogin() {
    document.getElementById('authForm').style.display = 'none';
    document.getElementById('authSuccess').classList.add('show');
    setTimeout(() => closeAuth(), 2500);
}

renderCards(prompts);
// ===== PERFECT SELECTOR MATCH ENGINE =====
window.getDbSnapshot("layout_settings", "main_config", (doc) => {
    if(doc.exists()) {
        let data = doc.data();
        
        // 1. Text Update (Main Title)
        let mainHeading = document.querySelector(".hero-container h1") || document.querySelector("h1");
        if(mainHeading && data.heroTitle) {
            if(mainHeading.childNodes.length > 0) {
                mainHeading.childNodes[0].textContent = data.heroTitle + " ";
            } else {
                mainHeading.textContent = data.heroTitle;
            }
        }
        
        // 2. Highlight Text (Gold Color)
        let highlightText = document.querySelector(".hero-container h1 span") || document.querySelector(".highlight");
        if(highlightText && data.heroHighlight) {
            highlightText.innerText = data.heroHighlight;
        }
        
        // 3. Position Data Parsing
        let imgX = Number(data.imgLeft) || 0;
        let imgY = Number(data.imgTop) || 0;
        let textY = Number(data.textTop) || 0;
        
        // 4. Photo Hex Frame Movement
        // Tere layout me jo round red glow wali photo hai use track karega
        let profileBox = document.querySelector(".hero-container img") || document.querySelector(".hero-profile-wrapper");
        if(profileBox) {
            profileBox.style.transform = `translate(${imgX}px, ${imgY}px)`;
        }
        
        // 5. Whole Text Block & Search Bar Movement (Home Content)
        // Ye poore text wrapper aur buttons ko ek saath upar-neeche adjust karega
        let textBox = document.querySelector(".hero-container") || document.querySelector(".hero");
        if(textBox) {
            // Sirf Text aur buttons wale box ko adjust karne ke liye vertical movement apply ki hai
            textBox.style.transform = `translate(0px, ${textY}px)`;
        }
    }
}, (err) => {
    console.log("Sync error: ", err);
});

// Expose commonly used UI functions to `window` so they're available
// when the site is served from GitHub Pages or other hosts.
window.loginWithGoogle = loginWithGoogle;
window.openAuthModal = openAuthModal;
window.closeAuth = closeAuth;
window.closeModalDirect = closeModalDirect;
window.copyModalPrompt = copyModalPrompt;
window.scrollToSection = scrollToSection;
window.filterPrompts = filterPrompts;
window.setCategoryFilter = setCategoryFilter;
window.setAiFilter = setAiFilter;
window.openModal = openModal;
window.handleContinue = handleContinue;
window.switchTab = switchTab;

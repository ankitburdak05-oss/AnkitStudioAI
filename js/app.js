const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

function loginWithGoogle() {
    auth.signInWithPopup(provider).then((result) => {
        const user = result.user;
        alert("Welcome " + user.displayName + "! Login successful to AnkitStudio ✔");
        closeAuth();
    }).catch((error) => {
        console.error("Authentication Fail:", error);
        alert("Login block or cancelled! Make sure domain is authorized in Firebase console settings tab.");
    });
}

auth.onAuthStateChanged((user) => {
    const loginBtn = document.getElementById('loginBtn');
    const userDisplay = document.getElementById('userDisplay');
    if (user) {
        if(loginBtn) loginBtn.style.display = 'none';
        if(userDisplay) {
            // Safe check: Agar name nahi hai toh email ka pehla part ya 'CREATOR' dikhayega
            const nameToShow = user.displayName || user.email.split('@')[0] || "CREATOR";
            userDisplay.textContent = nameToShow.toUpperCase();
            userDisplay.style.display = 'inline-block';
        }
    } else {
        if(loginBtn) loginBtn.style.display = 'inline-block';
        if(userDisplay) userDisplay.style.display = 'none';
    }
});

function toggleTagsSubmenu(event) {
    event.preventDefault();
    const submenu = document.getElementById('tagsSubmenu');
    const arrowIcon = document.getElementById('tagsArrowIcon');
    
    submenu.classList.toggle('open');
    arrowIcon.classList.toggle('open');
}

document.querySelectorAll('.sub-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.sub-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
    });
});

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

let currentTab = 'create';
let emailEntered = false;

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

// Master layout config with error handling
db.collection("layout_settings").doc("main_config").onSnapshot((doc) => {
    if(doc.exists) {
        let data = doc.data();
        
        // 1. Header Module Links
        let brand = document.querySelector(".logo") || document.querySelector(".nav-brand") || document.querySelector("header h1");
        if(brand && data.navLogoText) brand.innerText = data.navLogoText;
        
        let m1 = document.querySelectorAll("nav a")[0] || document.querySelector(".nav-link-1");
        if(m1 && data.mTxt1) m1.innerText = data.mTxt1;
        
        let m2 = document.querySelectorAll("nav a")[1] || document.querySelector(".nav-link-2");
        if(m2 && data.mTxt2) m2.innerText = data.mTxt2;

        // 2. Hero Component Controls
        let mainHeading = document.querySelector(".hero-container h1") || document.querySelector("h1");
        if(mainHeading && data.heroTitle) {
            if(mainHeading.childNodes.length > 0) {
                mainHeading.childNodes[0].textContent = data.heroTitle + " ";
            } else {
                mainHeading.textContent = data.heroTitle;
            }
        }
        let highlightText = document.querySelector(".hero-container h1 span") || document.querySelector(".highlight") || document.querySelector("h1 span");
        if(highlightText && data.heroHighlight) highlightText.innerText = data.heroHighlight;
        
        let imgX = Number(data.imgLeft) || 0;
        let imgY = Number(data.imgTop) || 0;
        let textY = Number(data.textTop) || 0;
        
        let profileBox = document.querySelector(".hero-profile-wrapper") || document.querySelector(".hero-container img") || document.querySelector("img");
        if(profileBox) profileBox.style.transform = `translate(${imgX}px, ${imgY}px)`;
        
        let textBox = document.querySelector(".hero-content-move-box") || document.querySelector(".hero-container") || document.querySelector(".hero");
        if(textBox) textBox.style.transform = `translate(0px, ${textY}px)`;

        // 3. Search Engine Layout
        let inputField = document.querySelector(".search-box input") || document.querySelector("input[type='text']");
        if(inputField && data.searchHint) inputField.placeholder = data.searchHint;

        let inputBtn = document.querySelector(".search-box button") || document.querySelector(".search-btn") || document.querySelector(".search-container button");
        if(inputBtn && data.searchBtn) inputBtn.innerText = data.searchBtn;

        // 4. Statistics Row Counter
        let boxes = document.querySelectorAll(".stat-box") || document.querySelectorAll(".stats-grid div");
        if(boxes.length >= 3) {
            if(data.st1) { let h1 = boxes[0].querySelector("h3") || boxes[0]; h1.innerText = data.st1; }
            if(data.st2) { let h2 = boxes[1].querySelector("h3") || boxes[1]; h2.innerText = data.st2; }
            if(data.st3) { let h3 = boxes[2].querySelector("h3") || boxes[2]; h3.innerText = data.st3; }
        }

        // 5. Tool Grid Items
        let cardTools = document.querySelectorAll(".tool-card h3") || document.querySelectorAll(".grid-item h4");
        if(cardTools.length >= 2) {
            if(data.tool1) cardTools[0].innerText = data.tool1;
            if(data.tool2) cardTools[1].innerText = data.tool2;
        }

        // 6. Featured Prompt Grid Items
        let promptTitles = document.querySelectorAll(".prompt-card h3") || document.querySelectorAll(".prompt-title");
        if(promptTitles.length >= 2) {
            if(data.pCard1) promptTitles[0].innerText = data.pCard1;
            if(data.pCard2) promptTitles[1].innerText = data.pCard2;
        }

        // 7. Submit Prompt Banner Strip
        let sTitle = document.querySelector(".submit-banner h2") || document.querySelector(".submit-section h3");
        if(sTitle && data.subTitle) sTitle.innerText = data.subTitle;

        let sBtn = document.querySelector(".submit-banner button") || document.querySelector(".submit-btn-action");
        if(sBtn && data.subBtn) sBtn.innerText = data.subBtn;

        // 8. Footer Areas Content
        let footB = document.querySelector("footer p") || document.querySelector(".footer-copyright");
        if(footB && data.footBr) footB.innerText = data.footBr;

        // 9. Auth Top Action Trigger Label
        let authBtn = document.querySelector(".login-btn") || document.querySelector("#loginBtn") || document.querySelector(".top-login-action");
        if(authBtn && data.loginTxt) authBtn.innerText = data.loginTxt;
    }
}, (err) => {
    console.error("Sync error: ", err);
});
// Global State Matrix Management
let activeCategory = '';
let activeAi = '';
let searchQuery = '';
let currentTab = 'create';
let emailEntered = false;

// Real-Time Event Debouncing System Engine 
function debounce(func, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Memory-Optimized Document Fragment Rendering Runner Matrix
function renderCards(data) {
    const grid = document.getElementById('promptGrid');
    const noResults = document.getElementById('noResults');
    if (!grid) return;

    if (data.length === 0) {
        grid.innerHTML = '';
        if (noResults) noResults.style.display = 'block';
        return;
    }
    if (noResults) noResults.style.display = 'none';

    // Anti-Reflow Pattern Initialization via DocumentFragments
    const fragment = document.createDocumentFragment();
    
    data.forEach(p => {
        const card = document.createElement('div');
        card.className = 'prompt-card';
        card.addEventListener('click', () => openModal(p.id));
        
        card.innerHTML = `
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
        `;
        fragment.appendChild(card);
    });

    grid.innerHTML = '';
    fragment.appendChild(document.createComment("ANKITSTUDIOAI Core Engine Hydrated"));
    grid.appendChild(fragment);
}

function getFiltered() {
    const dataset = (typeof prompts !== 'undefined') ? prompts : [];
    return dataset.filter(p => {
        const matchCat = !activeCategory || p.category === activeCategory || p.ai.includes(activeCategory) || p.title.toLowerCase().includes(activeCategory.toLowerCase());
        const matchAi  = !activeAi || p.ai === activeAi;
        const q = searchQuery.toLowerCase();
        const matchQ   = !q || p.title.toLowerCase().includes(q) || p.prompt.toLowerCase().includes(q) || p.ai.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
        return matchCat && matchAi && matchQ;
    });
}

const filterPromptsProcessor = () => {
    const h = document.getElementById('heroSearch')?.value || '';
    const n = document.getElementById('navSearch')?.value || '';
    searchQuery = h || n;
    renderCards(getFiltered());
};

const optimizedSearchHandler = debounce(filterPromptsProcessor, 250);

// Client UI State Engine Interaction Management
function openModal(id) {
    const dataset = (typeof prompts !== 'undefined') ? prompts : [];
    const p = dataset.find(x => x.id === id);
    if (!p) return;
    
    if(!firebase.auth().currentUser && !p.free) {
        alert("Authentication Required! Please login to copy premium prompts.");
        openAuthModal();
        return;
    }

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
    } else {
        document.getElementById('authTitle').textContent = 'WELCOME BACK';
        document.getElementById('authSub').textContent = 'Login to your ANKITSTUDIOAI account';
        document.getElementById('authCheckboxRow').style.display = 'none';
        document.getElementById('authSwitch').innerHTML = "Don't have an account? <span>Sign up free</span>";
    }
}

function handleAuthValidationSubmit(e) {
    e.preventDefault();
    const emailField = document.getElementById('authEmail');
    const passwordField = document.getElementById('authPassword');

    if (!emailField.checkValidity()) {
        emailField.style.borderColor = 'var(--red)';
        emailField.focus();
        return;
    } else { emailField.style.borderColor = ''; }

    if (!emailEntered) {
        emailEntered = true;
        passwordField.style.display = 'block';
        passwordField.focus();
        document.getElementById('continueText').textContent = currentTab === 'create' ? 'CREATE ACCOUNT' : 'LOGIN';
        return;
    }

    if (!passwordField.checkValidity()) {
        passwordField.style.borderColor = 'var(--red)';
        passwordField.focus();
        return;
    } else { passwordField.style.borderColor = ''; }

    document.getElementById('authForm').style.display = 'none';
    document.getElementById('authSuccess').classList.add('show');
    setTimeout(() => closeAuth(), 2200);
}

// COMPLETE REALTIME DATABASE SYNC ENGINE
if (typeof firebase !== 'undefined') {
    firebase.database().ref("layout_settings/main_config").on("value", (snapshot) => {
        if(snapshot.exists()) {
            let data = snapshot.val();
            
            if(data.navLogoText) {
                let logo = document.querySelector(".nav-logo");
                if(logo) logo.childNodes[0].textContent = data.navLogoText;
            }
            if(data.heroTitle) {
                let mainHeading = document.querySelector(".hero h1");
                if(mainHeading && mainHeading.childNodes.length > 0) mainHeading.childNodes[0].textContent = data.heroTitle + " ";
            }
            if(data.heroHighlight) {
                let highlightText = document.querySelector(".highlight");
                if(highlightText) highlightText.innerText = data.heroHighlight;
            }
            
            if(data.trustRatingCounter) {
                document.getElementById('trustRating').innerText = data.trustRatingCounter;
            }
            if(data.trustPromptCounter) {
                document.getElementById('trustCount').innerText = data.trustPromptCounter;
                document.getElementById('statPrompts').innerText = data.trustPromptCounter;
            }
            if(data.trustUserCounter) {
                document.getElementById('trustUsers').innerText = data.trustUserCounter;
                document.getElementById('statDownloads').innerText = data.trustUserCounter;
            }
            if(data.totalCategoriesCounter) {
                document.getElementById('statCategories').innerText = data.totalCategoriesCounter;
            }

            let imgX = Number(data.imgLeft) || 0; let imgY = Number(data.imgTop) || 0;
            let profileBox = document.querySelector(".hero-profile-wrapper");
            if(profileBox) profileBox.style.transform = `translate(${imgX}px, ${imgY}px)`;
        }
    }, (err) => {
        console.error("Realtime Database Core Connection Fail: Check Security Rules.", err);
    });
}

// Complete Secure Runtime DOM Event Observers Initialization
document.addEventListener("DOMContentLoaded", () => {
    // Search bindings
    document.getElementById('heroSearch')?.addEventListener('input', optimizedSearchHandler);
    document.getElementById('navSearch')?.addEventListener('input', optimizedSearchHandler);
    document.getElementById('heroSearchBtn')?.addEventListener('click', filterPromptsProcessor);

    // Authentication triggers (Fixed target definitions mapping)
    document.getElementById('loginBtn')?.addEventListener('click', openAuthModal);
    document.getElementById('authCloseBtn')?.addEventListener('click', closeAuth);
    document.getElementById('modalCloseBtn')?.addEventListener('click', closeAuth); // Layout support
    document.getElementById('authForm')?.addEventListener('submit', handleAuthValidationSubmit);
    document.getElementById('googleAuthBtn')?.addEventListener('click', () => {
        if(typeof loginWithGoogle === 'function') loginWithGoogle();
    });
    
    document.getElementById('authSwitch')?.addEventListener('click', () => {
        switchTab(currentTab === 'create' ? 'login' : 'create');
    });
    document.getElementById('tabCreate')?.addEventListener('click', () => switchTab('create'));
    document.getElementById('tabLogin')?.addEventListener('click', () => switchTab('login'));

    // Dynamic Context Interactivity Interceptors
    document.getElementById('submitPromptBtn')?.addEventListener('click', () => {
        if(!firebase.auth().currentUser) {
            alert("Please login to submit your custom prompts to marketplace.");
            openAuthModal();
        } else {
            alert("Redirection initiated to upload verification console...");
        }
    });

    // Native Semantic Navigation Categories Observers Bindings
    document.querySelectorAll('.cat-grid .cat-card').forEach(card => {
        card.addEventListener('click', () => {
            activeCategory = card.getAttribute('data-cat') || '';
            document.getElementById('clearFilter').style.display = activeCategory ? 'block' : 'none';
            renderCards(getFiltered());
        });
    });

    document.getElementById('viewAllCats')?.addEventListener('click', () => {
        activeCategory = '';
        document.getElementById('clearFilter').style.display = 'none';
        renderCards(getFiltered());
    });

    document.getElementById('clearFilter')?.addEventListener('click', () => {
        activeCategory = '';
        document.getElementById('clearFilter').style.display = 'none';
        renderCards(getFiltered());
    });

    // AI Tab Filter Elements Row Logic Engine
    document.querySelectorAll('#aiFilterBar .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#aiFilterBar .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeAi = btn.getAttribute('data-ai') || '';
            renderCards(getFiltered());
        });
    });

    // Submenu execution
    document.getElementById('tagsMenuTrigger')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('tagsSubmenu')?.classList.toggle('open');
        document.getElementById('tagsArrowIcon')?.classList.toggle('open');
    });

    document.querySelectorAll('#tagsSubmenu .sub-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('#tagsSubmenu .sub-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            activeCategory = link.getAttribute('data-cat') || '';
            renderCards(getFiltered());
        });
    });

    // Modal close hooks (Fixed fallback layouts mappings alignment)
    document.getElementById('modalCloseDirectBtn')?.addEventListener('click', () => {
        document.getElementById('modalOverlay').classList.remove('open');
        document.body.style.overflow = '';
    });
    document.getElementById('modalCloseBtn')?.addEventListener('click', () => {
        document.getElementById('modalOverlay').classList.remove('open');
        document.body.style.overflow = '';
    });
    
    document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
        if(e.target === document.getElementById('modalOverlay')) {
            document.getElementById('modalOverlay').classList.remove('open');
            document.body.style.overflow = '';
        }
    });

    document.getElementById('modalCopyBtn')?.addEventListener('click', () => {
        const text = document.getElementById('modalPrompt').textContent;
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById('modalCopyBtn');
            btn.innerHTML = '<i class="fas fa-check"></i> &nbsp; COPIED!';
            btn.classList.add('copied');
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-copy"></i> &nbsp; COPY PROMPT';
                btn.classList.remove('copied');
            }, 2000);
        });
    });

    // Initial Engine Boot Hydration Run
    if (typeof prompts !== 'undefined' && prompts) {
        renderCards(prompts);
    } else if (window.prompts) {
        renderCards(window.prompts);
    } else {
        console.warn("AnkitStudioAI Warn: prompts array missing from runtime snapshot.");
    }
});

// Firebase User Instance Auth Status State Pipeline Listener
if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged((user) => {
        const loginBtn = document.getElementById('loginBtn');
        const userProfileWrapper = document.getElementById('userProfileWrapper');
        const userDisplay = document.getElementById('userDisplay');
        const dropdownUserName = document.getElementById('dropdownUserName');
        const dropdownUserEmail = document.getElementById('dropdownUserEmail');
        
        if (user) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (userProfileWrapper) userProfileWrapper.style.display = 'inline-block';
            
            const nameToShow = user.displayName || user.email.split('@')[0] || "CREATOR";
            if (userDisplay) userDisplay.textContent = nameToShow.toUpperCase();
            if (dropdownUserName) dropdownUserName.textContent = nameToShow.toUpperCase();
            if (dropdownUserEmail) dropdownUserEmail.textContent = user.email;
            
        } else {
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (userProfileWrapper) userProfileWrapper.style.display = 'none';
        }
    });

    // Logout Button Event Listener
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        firebase.auth().signOut().then(() => {
            console.log("AnkitStudioAI: User Logged Out Successfully.");
            window.location.reload();
        }).catch((error) => {
            console.error("Logout Error:", error);
        });
    });
}
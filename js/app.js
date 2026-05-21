// Global State Matrix Management
let activeCategory = '';
let activeAi = '';
let searchQuery = '';
let currentTab = 'create';
let showOnlyFavorites = false; // Favorites mode toggle engine state

// Real-Time Event Debouncing System Engine 
function debounce(func, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// FIXED: Added defensive try/catch architecture against malformed storage contents
function getFavoritesFromStorage() {
    let key = 'fav_prompts_guest'; // Fallback guest key representation vector mapping
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
        const user = firebase.auth().currentUser;
        key = `fav_prompts_${user.uid}`;
    }
    
    try {
        const data = localStorage.getItem(key);
        const parsed = data ? JSON.parse(data) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error("AnkitStudioAI Storage Validation Fail - Resetting local stream context:", e);
        return [];
    }
}

// FIXED: Allows guest users to collect favorites locally and seamlessly migrates them after login
function toggleFavoriteState(promptId) {
    let key = 'fav_prompts_guest';
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
        const user = firebase.auth().currentUser;
        key = `fav_prompts_${user.uid}`;
    }
    
    let favs = getFavoritesFromStorage();
    
    if (favs.includes(promptId)) {
        favs = favs.filter(id => id !== promptId);
    } else {
        favs.push(promptId);
    }
    localStorage.setItem(key, JSON.stringify(favs));
    renderCards(getFiltered()); // Core UI hydration refresh
}

// NEW: Automatically migrate local guest records to user account space upon success authentication state pipeline trigger
function migrateGuestFavoritesToUser(userUid) {
    try {
        const guestFavs = JSON.parse(localStorage.getItem('fav_prompts_guest')) || [];
        if (guestFavs.length > 0) {
            const userKey = `fav_prompts_${userUid}`;
            let userFavs = JSON.parse(localStorage.getItem(userKey)) || [];
            
            // Deduplicate lists array intersection variables matrix
            let merged = Array.from(new Set([...userFavs, ...guestFavs]));
            localStorage.setItem(userKey, JSON.stringify(merged));
            localStorage.removeItem('fav_prompts_guest'); // Flush temporary buffer
            console.log("AnkitStudioAI Engine: Local guest bookmarks migrated successfully.");
        }
    } catch (e) {
        console.error("Migration runtime validation failed:", e);
    }
}

// Toggle Full-Screen Favorites Page View Layout Matrix
function toggleFavoritesPageView(enable) {
    showOnlyFavorites = enable;
    
    const heroContainer = document.querySelector('.hero-container');
    const trustBar = document.querySelector('.trust-bar');
    const categoriesSection = document.getElementById('categories');
    const featuredSection = document.getElementById('featured');
    const bannerSection = document.querySelector('.featured-banner')?.parentNode;
    const redirectBox = document.querySelector('.prompt-redirect-box-wrapper')?.parentNode;
    const toolsGrid = document.querySelector('.tools-grid')?.parentNode;
    const sectionHead = document.querySelector('#featured .section-head');

    if (enable) {
        if (heroContainer) heroContainer.style.display = 'none';
        if (trustBar) trustBar.style.display = 'none';
        if (categoriesSection) categoriesSection.style.display = 'none';
        if (bannerSection) bannerSection.style.display = 'none';
        if (redirectBox) redirectBox.style.display = 'none';
        if (toolsGrid) toolsGrid.style.display = 'none';
        
        if (featuredSection) featuredSection.style.paddingTop = '40px';
        if (sectionHead) {
            sectionHead.innerHTML = `
                <div class="section-title" id="favBackBtn" style="cursor:pointer; color:var(--red); font-family:'Orbitron',sans-serif; font-size:16px; letter-spacing:2px; display:flex; align-items:center; gap:10px; transition:0.2s;">
                    <i class="fas fa-arrow-left"></i> BACK TO HOME
                </div>
                <div class="see-all" style="color:var(--muted); font-family:'Orbitron',sans-serif; font-size:12px;">🌟 MY FAVORITES PORTAL</div>
            `;
            document.getElementById('favBackBtn')?.addEventListener('click', () => {
                toggleFavoritesPageView(false);
            });
        }
    } else {
        if (heroContainer) heroContainer.style.display = 'block';
        if (trustBar) trustBar.style.display = 'flex';
        if (categoriesSection) categoriesSection.style.display = 'block';
        if (bannerSection) bannerSection.style.display = 'block';
        if (redirectBox) redirectBox.style.display = 'block';
        if (toolsGrid) toolsGrid.style.display = 'block';
        
        if (featuredSection) featuredSection.style.paddingTop = '0';
        if (sectionHead) {
            sectionHead.innerHTML = `
                <div class="section-title"><i class="fas fa-fire"></i> Featured Prompts</div>
                <div class="see-all" id="clearFilter" style="display:none;color:var(--red)">Clear Filter ✕</div>
            `;
        }
        document.querySelectorAll('.sidebar .side-link').forEach(l => l.classList.remove('active'));
        document.querySelector('.sidebar .side-link [class*="fa-home"]')?.parentNode?.classList.add('active');
        
        activeCategory = '';
        activeAi = '';
    }
    renderCards(getFiltered());
}

// Memory-Optimized Document Fragment Rendering Runner Matrix (WITH FALLBACK UI INTERCEPTOR)
function renderCards(data) {
    const grid = document.getElementById('promptGrid');
    const noResults = document.getElementById('noResults');
    if (!grid) return;

    // FIXED: Render highly immersive custom fallback UI whenever the active favorite collection is fully vacant instead of basic empty list
    if (data.length === 0) {
        grid.innerHTML = '';
        if (showOnlyFavorites) {
            if (noResults) noResults.style.display = 'none';
            grid.innerHTML = `
                <div class="favorites-empty-fallback" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--muted); border: 1px dashed rgba(255,255,255,0.05); border-radius: 12px; background: rgba(15,10,30,0.2);">
                    <i class="far fa-heart" style="font-size: 3rem; color: var(--red); margin-bottom: 15px; display: block; animation: pulse 2s infinite;"></i>
                    <h4 style="font-family: 'Orbitron', sans-serif; font-size: 14px; letter-spacing: 2px; color: #fff; margin-bottom: 8px;">PORTAL EMPTY</h4>
                    <p style="font-size: 12px; max-width: 400px; margin: 0 auto 20px; line-height: 1.6;">Bhai, tumne abhi tak koi bhi prompt bookmark nahi kiya hai! Home par jaakar kisi bhi card ke heart icon par click karo.</p>
                    <button class="nav-link primary" id="backToHomeFromEmpty" style="margin: 0 auto; padding: 10px 24px; font-size: 11px; letter-spacing: 2px;">DISCOVER PROMPTS</button>
                </div>
            `;
            document.getElementById('backToHomeFromEmpty')?.addEventListener('click', () => {
                toggleFavoritesPageView(false);
            });
            return;
        }
        
        if (noResults) noResults.style.display = 'block';
        return;
    }
    if (noResults) noResults.style.display = 'none';

    const fragment = document.createDocumentFragment();
    const favs = getFavoritesFromStorage();
    
    data.forEach(p => {
        const card = document.createElement('div');
        card.className = 'prompt-card';
        
        const isFav = favs.includes(p.id);
        const heartClass = isFav ? 'fas fa-heart fav-active' : 'far fa-heart';
        
        card.innerHTML = `
            <div class="prompt-thumb" style="background:${p.thumbGrad}">
                <span class="thumb-icon">${p.emoji}</span>
                ${p.badge ? `<div class="prompt-badge ${p.badgeClass}">${p.badge}</div>` : ''}
                <button class="card-fav-btn" data-id="${p.id}" style="position: absolute; top: 12px; right: 12px; background: rgba(15, 10, 30, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); width: 32px; height: 32px; border-radius: 50%; color: #ff3366; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(4px); transition: transform 0.2s; z-index: 5;"><i class="${heartClass}"></i></button>
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
        
        card.querySelector('.prompt-body').addEventListener('click', () => openModal(p.id));
        card.querySelector('.card-fav-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavoriteState(p.id);
        });
        
        fragment.appendChild(card);
    });

    grid.innerHTML = '';
    fragment.appendChild(document.createComment("ANKITSTUDIOAI Core Engine Hydrated"));
    grid.appendChild(fragment);
}

function getFiltered() {
    let dataset = (typeof prompts !== 'undefined') ? prompts : [];
    
    if (showOnlyFavorites) {
        const favs = getFavoritesFromStorage();
        dataset = dataset.filter(p => favs.includes(p.id));
    }
    
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

function openModal(id) {
    const dataset = (typeof prompts !== 'undefined') ? prompts : [];
    const p = dataset.find(x => x.id === id);
    if (!p) return;
    
    if (typeof firebase !== 'undefined' && firebase.auth && !firebase.auth().currentUser && !p.free) {
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
    switchTab(currentTab);
}

function closeAuth() {
    document.getElementById('authOverlay').classList.remove('open');
    document.body.style.overflow = '';
    document.getElementById('authEmail').value = '';
    document.getElementById('authPassword').value = '';
}

function switchTab(tab) {
    currentTab = tab;
    document.getElementById('authEmail').value = '';
    document.getElementById('authPassword').value = '';
    document.getElementById('tabCreate').classList.toggle('active', tab === 'create');
    document.getElementById('tabLogin').classList.toggle('active', tab === 'login');

    const authTitle = document.getElementById('authTitle');
    const authSub = document.getElementById('authSub');
    const authCheckboxRow = document.getElementById('authCheckboxRow');
    const continueText = document.getElementById('continueText');
    const authPassword = document.getElementById('authPassword');

    if (authPassword) authPassword.style.display = 'block';

    if (tab === 'create') {
        if (authTitle) authTitle.textContent = 'CREATE ACCOUNT';
        if (authSub) authSub.textContent = 'Join 10,000+ AI enthusiasts & creators';
        if (authCheckboxRow) authCheckboxRow.style.display = 'flex';
        document.getElementById('authSwitch').innerHTML = 'Already have an account? <span>Login here</span>';
        if (continueText) continueText.textContent = 'CONTINUE';
    } else {
        if (authTitle) authTitle.textContent = 'WELCOME BACK';
        if (authSub) authSub.textContent = 'Login to your ANKITSTUDIOAI account';
        if (authCheckboxRow) authCheckboxRow.style.display = 'none';
        document.getElementById('authSwitch').innerHTML = "Don't have an account? <span>Sign up free</span>";
        if (continueText) continueText.textContent = 'LOGIN';
    }
}

function handleRealAuthSubmit(e) {
    e.preventDefault();
    if (typeof firebase === 'undefined' || !firebase.auth) {
        alert("Firebase Service Unavailable. Please try again later.");
        return;
    }
    
    const emailField = document.getElementById('authEmail');
    const passwordField = document.getElementById('authPassword');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    
    const email = emailField.value.trim();
    const password = passwordField.value;
    const isLoginMode = currentTab === 'login';

    if (!email || !password) {
        alert("Validation Error: Email and password fields are required.");
        return;
    }

    if (password.length < 6) {
        alert("Security Alert: Password must be at least 6 characters long.");
        return;
    }

    if (authSubmitBtn) authSubmitBtn.disabled = true;

    if (isLoginMode) {
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                console.log("Firebase Email Login Success:", userCredential.user);
                migrateGuestFavoritesToUser(userCredential.user.uid); // Trigger auto storage sync migration
                closeAuth();
                applyAuthState(userCredential.user);
            })
            .catch((error) => {
                console.error("Firebase Login Error:", error.message);
                alert("Login Error: " + error.message);
                if (authSubmitBtn) authSubmitBtn.disabled = false;
            });
    } else {
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                console.log("Firebase Account Created:", userCredential.user);
                migrateGuestFavoritesToUser(userCredential.user.uid); // Trigger auto storage sync migration
                document.getElementById('authForm').style.display = 'none';
                document.getElementById('authSuccess').classList.add('show');
                setTimeout(() => {
                    closeAuth();
                    applyAuthState(userCredential.user);
                }, 2000);
            })
            .catch((error) => {
                console.error("Firebase Signup Error:", error.message);
                alert("Registration Error: " + error.message);
                if (authSubmitBtn) authSubmitBtn.disabled = false;
            });
    }
}

// COMPLETE REALTIME DATABASE SYNC ENGINE
if (typeof firebase !== 'undefined' && firebase.database) {
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
            
            if(data.trustRatingCounter) document.getElementById('trustRating').innerText = data.trustRatingCounter;
            if(data.trustPromptCounter) {
                document.getElementById('trustCount').innerText = data.trustPromptCounter;
                document.getElementById('statPrompts').innerText = data.trustPromptCounter;
            }
            if(data.trustUserCounter) {
                document.getElementById('trustUsers').innerText = data.trustUserCounter;
                document.getElementById('statDownloads').innerText = data.trustUserCounter;
            }
            if(data.totalCategoriesCounter) document.getElementById('statCategories').innerText = data.totalCategoriesCounter;

            let imgX = Number(data.imgLeft) || 0; let imgY = Number(data.imgTop) || 0;
            let profileBox = document.querySelector(".hero-profile-wrapper");
            if(profileBox) profileBox.style.transform = `translate(${imgX}px, ${imgY}px)`;
        }
    }, (err) => {
        console.error("Realtime Database Core Connection Fail:", err);
    });
}

// Complete Secure Runtime DOM Event Observers Initialization
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('heroSearch')?.addEventListener('input', optimizedSearchHandler);
    document.getElementById('navSearch')?.addEventListener('input', optimizedSearchHandler);
    document.getElementById('heroSearchBtn')?.addEventListener('click', filterPromptsProcessor);

    document.getElementById('loginBtn')?.addEventListener('click', openAuthModal);
    document.getElementById('authCloseBtn')?.addEventListener('click', closeAuth);
    document.getElementById('authForm')?.addEventListener('submit', handleRealAuthSubmit);
    document.getElementById('googleAuthBtn')?.addEventListener('click', () => {
        if(typeof loginWithGoogle === 'function') loginWithGoogle();
    });
    
    document.getElementById('authSwitch')?.addEventListener('click', () => {
        switchTab(currentTab === 'create' ? 'login' : 'create');
    });
    document.getElementById('tabCreate')?.addEventListener('click', () => switchTab('create'));
    document.getElementById('tabLogin')?.addEventListener('click', () => switchTab('login'));

    document.getElementById('submitPromptBtn')?.addEventListener('click', () => {
        if(typeof firebase === 'undefined' || !firebase.auth || !firebase.auth().currentUser) {
            alert("Please login to submit your custom prompts to marketplace.");
            openAuthModal();
        } else {
            alert("Redirection initiated to upload verification console...");
        }
    });

    document.querySelectorAll('.cat-grid .cat-card').forEach(card => {
        card.addEventListener('click', () => {
            if (showOnlyFavorites) toggleFavoritesPageView(false);
            activeCategory = card.getAttribute('data-cat') || '';
            document.getElementById('clearFilter').style.display = activeCategory ? 'block' : 'none';
            renderCards(getFiltered());
        });
    });

    document.getElementById('viewAllCats')?.addEventListener('click', () => {
        if (showOnlyFavorites) toggleFavoritesPageView(false);
        activeCategory = '';
        document.getElementById('clearFilter').style.display = 'none';
        renderCards(getFiltered());
    });

    document.getElementById('clearFilter')?.addEventListener('click', () => {
        if (showOnlyFavorites) toggleFavoritesPageView(false);
        activeCategory = '';
        document.getElementById('clearFilter').style.display = 'none';
        renderCards(getFiltered());
    });

    document.querySelectorAll('#aiFilterBar .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#aiFilterBar .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeAi = btn.getAttribute('data-ai') || '';
            renderCards(getFiltered());
        });
    });

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
            if (showOnlyFavorites) toggleFavoritesPageView(false);
            activeCategory = link.getAttribute('data-cat') || '';
            renderCards(getFiltered());
        });
    });

    // Sidebar View Routing Observers Strategy Configuration
    const sidebarHistoryLink = document.querySelector('.sidebar a[href="#"]') ? document.querySelector('.sidebar a[href="#"]').parentNode : null;
    if (sidebarHistoryLink) {
        sidebarHistoryLink.querySelectorAll('.side-link').forEach((link, idx) => {
            if (idx === 3) { 
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    document.querySelectorAll('.sidebar .side-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    toggleFavoritesPageView(true);
                });
            }
            if (idx === 0) { 
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    toggleFavoritesPageView(false);
                });
            }
        });
    }

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

    if (typeof prompts !== 'undefined' && prompts) {
        renderCards(prompts);
    }
});

// Helper to apply authentication state changes in-place (no full reload)
function applyAuthState(user) {
    const loginBtn = document.getElementById('loginBtn');
    const userProfileWrapper = document.getElementById('userProfileWrapper');
    const userDisplay = document.getElementById('userDisplay');
    const dropdownUserName = document.getElementById('dropdownUserName');
    const dropdownUserEmail = document.getElementById('dropdownUserEmail');

    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (userProfileWrapper) userProfileWrapper.style.display = 'inline-block';

        const nameToShow = user.displayName || (user.email ? user.email.split('@')[0] : '') || "CREATOR";
        if (userDisplay) userDisplay.textContent = nameToShow.toUpperCase();
        if (dropdownUserName) dropdownUserName.textContent = nameToShow.toUpperCase();
        if (dropdownUserEmail) dropdownUserEmail.textContent = user.email || '';

        try { migrateGuestFavoritesToUser(user.uid); } catch (e) { console.error(e); }
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (userProfileWrapper) userProfileWrapper.style.display = 'none';
        if (showOnlyFavorites) toggleFavoritesPageView(false);
    }

    renderCards(getFiltered());
}

// Firebase User Instance Auth Status State Pipeline Listener
if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged((user) => { applyAuthState(user); });

    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        firebase.auth().signOut().then(() => {
            applyAuthState(null);
        }).catch((error) => {
            console.error("Logout Error:", error);
        });
    });
}

// Quick browser smoke-test for favorites, migration and fallback UI
window.runFavoritesSmokeTest = async function() {
    console.log('Running ANKITSTUDIOAI favorites smoke test...');

    const originalShowOnlyFavorites = showOnlyFavorites;
    const originalUser = (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) ? firebase.auth().currentUser : null;
    const originalGuestData = localStorage.getItem('fav_prompts_guest');
    const originalUserData = originalUser ? localStorage.getItem(`fav_prompts_${originalUser.uid}`) : null;

    const cleanupTempKeys = () => {
        localStorage.removeItem('fav_prompts_guest_test');
        localStorage.removeItem('fav_prompts_TEST_UID');
    };

    const restoreStorage = () => {
        if (originalGuestData !== null) {
            localStorage.setItem('fav_prompts_guest', originalGuestData);
        } else {
            localStorage.removeItem('fav_prompts_guest');
        }

        if (originalUser && originalUserData !== null) {
            localStorage.setItem(`fav_prompts_${originalUser.uid}`, originalUserData);
        }
    };

    try {
        const promptsArr = (typeof prompts !== 'undefined') ? prompts : window.prompts || [];
        const grid = document.getElementById('promptGrid');
        if (!grid) {
            console.warn('promptGrid element not found — aborting smoke test.');
            return;
        }
        if (!promptsArr || promptsArr.length === 0) {
            console.warn('No prompts found — smoke test requires at least one prompt.');
            return;
        }

        const testId = promptsArr[0].id;
        cleanupTempKeys();

        // Ensure guest flow: clear test data and set guest favorite
        localStorage.removeItem('fav_prompts_guest');
        if (!originalUser) {
            toggleFavoriteState(testId);
        } else {
            localStorage.setItem('fav_prompts_guest', JSON.stringify([testId]));
        }
        const guestFavs = JSON.parse(localStorage.getItem('fav_prompts_guest') || '[]');
        console.log('Guest favs after toggle:', guestFavs);

        // Enter favorites portal (guest)
        toggleFavoritesPageView(true);
        await new Promise(r => setTimeout(r, 150));
        console.log('Favorites portal (guest) dataset count:', getFiltered().length);

        // Migrate guest to simulated user
        migrateGuestFavoritesToUser('TEST_UID');
        const userFavs = JSON.parse(localStorage.getItem('fav_prompts_TEST_UID') || '[]');
        console.log('User favs after migration:', userFavs);

        // Simulate auth state apply
        applyAuthState({ uid: 'TEST_UID', email: 'test@example.com', displayName: 'Tester' });
        console.log('applyAuthState simulated — UI should show logged-in state.');

        console.log('Smoke test completed successfully.');
    } catch (e) {
        console.error('Smoke test failed:', e);
    } finally {
        cleanupTempKeys();
        restoreStorage();

        if (showOnlyFavorites !== originalShowOnlyFavorites) {
            toggleFavoritesPageView(originalShowOnlyFavorites);
        } else {
            renderCards(getFiltered());
        }

        applyAuthState(originalUser);
        console.log('Smoke test cleanup complete. UI restored to original state.');
    }
};
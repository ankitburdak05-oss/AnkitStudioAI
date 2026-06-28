// Global State Matrix Management
let activeCategory = '';
let activeAi = '';
let searchQuery = '';
let currentTab = 'create';
let showOnlyFavorites = false; // Favorites mode toggle engine state
let heroProfileCoords = { x: null, y: null }; // Persist latest hero profile layout coordinates
let profileRepositionTimeout = null; // Anti-race condition timer state

// 🔥 DARK MODE: Auto-apply on page load
(function() {
    const savedDark = localStorage.getItem('ankitstudio_darkmode');
    if (savedDark === 'true') {
        document.documentElement.classList.add('dark-mode');
        document.body?.classList.add('dark-mode');
    }
})();
// Also apply when body loads
document.addEventListener('DOMContentLoaded', function() {
    const savedDark = localStorage.getItem('ankitstudio_darkmode');
    if (savedDark === 'true') {
        document.body.classList.add('dark-mode');
    }
});

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
    let key = 'fav_posts_guest'; // Fallback guest key representation vector mapping
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
        const user = firebase.auth().currentUser;
        key = `fav_posts_${user.uid}`;
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
function toggleFavoriteState(postId) {
    let key = 'fav_posts_guest';
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
        const user = firebase.auth().currentUser;
        key = `fav_posts_${user.uid}`;
    }
    
    let favs = getFavoritesFromStorage();
    
    if (favs.includes(postId)) {
        favs = favs.filter(id => id !== postId);
    } else {
        favs.push(postId);
    }
    localStorage.setItem(key, JSON.stringify(favs));
    
    // 🔥 UI REFRESH FIX: Purane aur naye dono (Firebase) cards ko refresh karega
    if (typeof renderCards === 'function') {
        renderCards(getFiltered());
    }
    if (typeof loadCommunityPosts === 'function') {
        loadCommunityPosts();
    }
}

// NEW: Automatically migrate local guest records to user account space upon success authentication state pipeline trigger
function migrateGuestFavoritesToUser(userUid) {
    try {
        const guestFavs = JSON.parse(localStorage.getItem('fav_posts_guest')) || [];
        if (guestFavs.length > 0) {
            const userKey = `fav_posts_${userUid}`;
            let userFavs = JSON.parse(localStorage.getItem(userKey)) || [];
            
            // Deduplicate lists array intersection variables matrix
            let merged = Array.from(new Set([...userFavs, ...guestFavs]));
            localStorage.setItem(userKey, JSON.stringify(merged));
            localStorage.removeItem('fav_posts_guest'); // Flush temporary buffer
            console.log("AnkitStudioAI Engine: Local guest bookmarks migrated successfully.");
        }
    } catch (e) {
        console.error("Migration runtime validation failed:", e);
    }
}

function repositionHeroProfileWrapper() {
    const profileBox = document.querySelector('.hero-profile-wrapper');
    
    // Safety Lock: Agar box mil gaya AUR coordinates null nahi hain, tabhi photo ko hila
    if (profileBox && heroProfileCoords.x !== null && heroProfileCoords.y !== null) {
        profileBox.style.transform = `translate(${heroProfileCoords.x}px, ${heroProfileCoords.y}px)`;
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
    const redirectBox = document.querySelector('.post-redirect-box-wrapper')?.parentNode;
    const toolsGrid = document.querySelector('.tools-grid')?.parentNode;
    const sectionHead = document.querySelector('#featured .section-head');
    
    // 🔥 NAYI LINE: Jo patli lines (dividers) reh jati hain unhe pakadne ke liye
    const dividers = document.querySelectorAll('.divider');

    if (enable) {
        if (heroContainer) heroContainer.style.display = 'none';
        if (trustBar) trustBar.style.display = 'none';
        if (categoriesSection) categoriesSection.style.display = 'none';
        if (bannerSection) bannerSection.style.display = 'none';
        if (redirectBox) redirectBox.style.display = 'none';
        if (toolsGrid) toolsGrid.style.display = 'none';
        
        // Lines hide karo
        dividers.forEach(d => d.style.display = 'none');
        
        if (featuredSection) featuredSection.style.paddingTop = '40px';
        if (sectionHead) {
            sectionHead.innerHTML = `
                <div class="section-title" id="favBackBtn" style="cursor:pointer; color:var(--red); font-family: inherit; font-size:16px; letter-spacing:2px; display:flex; align-items:center; gap:10px; transition:0.2s;">
                    <i class="fas fa-arrow-left"></i> BACK TO HOME
                </div>
                <div class="see-all" style="color:var(--muted); font-family: inherit; font-size:12px;">🌟 SAVED POSTS</div>
            `;
            document.getElementById('favBackBtn')?.addEventListener('click', () => {
                toggleFavoritesPageView(false);
            });
        }
    } else {
        if (heroContainer) heroContainer.style.display = '';
        if (trustBar) trustBar.style.display = '';
        if (categoriesSection) categoriesSection.style.display = '';
        if (bannerSection) bannerSection.style.display = '';
        if (redirectBox) redirectBox.style.display = '';
        if (toolsGrid) toolsGrid.style.display = '';
        
        // Lines wapas show karo
        dividers.forEach(d => d.style.display = '');
        
        if (featuredSection) featuredSection.style.paddingTop = '0';
        if (sectionHead) {
            sectionHead.innerHTML = `
                <div class="section-title"><i class="fas fa-fire"></i> Featured Posts</div>
                <div class="see-all" id="clearFilter" style="display:none;color:var(--red)">Clear Filter ✕</div>
            `;
        }
        document.querySelectorAll('.sidebar .side-link').forEach(l => l.classList.remove('active'));
        document.querySelector('.sidebar .side-link [class*="fa-home"]')?.parentNode?.classList.add('active');
        
        activeCategory = '';
        activeAi = '';

        if (profileRepositionTimeout) {
            clearTimeout(profileRepositionTimeout);
        }
        
        profileRepositionTimeout = setTimeout(() => {
            if (typeof repositionHeroProfileWrapper === 'function' && !showOnlyFavorites) {
                repositionHeroProfileWrapper();
            }
        }, 100);
    }
    
    // 🔥 MAIN FIX: Ab tere purane cards aur naye Firebase wale cards, DONO turant refresh honge
    if (typeof renderCards === 'function') {
        renderCards(getFiltered());
    }
    if (typeof loadCommunityPosts === 'function') {
        loadCommunityPosts();
    }
}

// Memory-Optimized Document Fragment Rendering Runner Matrix (WITH FALLBACK UI INTERCEPTOR)
function renderCards(data) {
    const grid = document.getElementById('postGrid');
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
                    <h4 style="font-family: inherit; font-size: 14px; letter-spacing: 2px; color: #fff; margin-bottom: 8px;">No Saved Posts</h4>
                    <p style="font-size: 12px; max-width: 400px; margin: 0 auto 20px; line-height: 1.6;">Bhai, tumne abhi tak koi bhi post bookmark nahi kiya hai! Home par jaakar kisi bhi card ke heart icon par click karo.</p>
                    <button class="nav-link primary" id="backToHomeFromEmpty" style="margin: 0 auto; padding: 10px 24px; font-size: 11px; letter-spacing: 2px;">DISCOVER POSTS</button>
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
        card.className = 'post-card';
        
        const isFav = favs.includes(p.id);
        const heartClass = isFav ? 'fas fa-heart fav-active' : 'far fa-heart';
        
        card.innerHTML = `
            <div class="post-thumb" style="background:${p.thumbGrad}">
                <span class="thumb-icon">${p.emoji}</span>
                ${p.badge ? `<div class="post-badge ${p.badgeClass}">${p.badge}</div>` : ''}
                <button class="card-fav-btn" data-id="${p.id}" style="position: absolute; top: 12px; right: 12px; background: rgba(15, 10, 30, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); width: 32px; height: 32px; border-radius: 50%; color: #ff3366; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(4px); transition: transform 0.2s; z-index: 5;"><i class="${heartClass}"></i></button>
            </div>
            <div class="post-body">
                <div class="post-ai-tag ${p.aiClass}">${p.ai}</div>
                <div class="post-title">${p.title}</div>
                <div class="post-preview">${p.post}</div>
                <div class="post-footer">
                    <div class="post-author">
                        <div class="author-avatar">${p.author[0]}</div>
                        ${p.author}
                    </div>
                    <div class="post-rating"><i class="fas fa-star"></i> ${p.rating}</div>
                </div>
                <div class="post-footer" style="margin-top:10px; border-top:1px solid rgba(255,255,255,0.05); padding-top:8px;">
                    <span class="${p.free ? 'price-free post-price' : 'price-paid post-price'}">${p.free ? 'FREE' : '₹49'}</span>
                    <span style="font-size:11px;color:var(--muted); font-weight:600;" id="download-count-${p.id}"><i class="fas fa-download"></i> ${p.downloads}</span>
                </div>
            </div>
        `;
        
        card.querySelector('.post-body').addEventListener('click', () => openModal(p.id));
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
    let dataset = (typeof posts !== 'undefined') ? posts : [];
    
    if (showOnlyFavorites) {
        const favs = getFavoritesFromStorage();
        dataset = dataset.filter(p => favs.includes(p.id));
    }
    
    return dataset.filter(p => {
        const matchCat = !activeCategory || p.category === activeCategory || p.ai.includes(activeCategory) || p.title.toLowerCase().includes(activeCategory.toLowerCase());
        const matchAi  = !activeAi || p.ai === activeAi;
        const q = searchQuery.toLowerCase();
        const matchQ   = !q || p.title.toLowerCase().includes(q) || p.post.toLowerCase().includes(q) || p.ai.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
        return matchCat && matchAi && matchQ;
    });
}

const filterPostsProcessor = () => {
    const h = document.getElementById('heroSearch')?.value || '';
    const n = document.getElementById('navSearch')?.value || '';
    searchQuery = h || n;
    renderCards(getFiltered());
};

const optimizedSearchHandler = debounce(filterPostsProcessor, 250);

// NEW FEATURE FEATURE 2: Dynamic Copy Tracker Database Trigger Function
function trackPostCopyAnalytics(postId) {
    if (typeof firebase === 'undefined' || !firebase.database) return;

    const userId = (firebase.auth && firebase.auth().currentUser) ? firebase.auth().currentUser.uid : 'guest';
    
    // 1. Browser Memory (LocalStorage) check karo
    let localRegister = JSON.parse(localStorage.getItem('haziri_register') || '{}');
    if (localRegister[postId]) {
        console.log("Spam Blocked: Bhai tu is post ko pehle hi copy kar chuka hai.");
        return;
    }

    // 2. Agar GUEST banda hai
    if (userId === 'guest') {
        localRegister[postId] = true;
        localStorage.setItem('haziri_register', JSON.stringify(localRegister));
        bumpCounterInDB(postId);
    } 
    // 3. Agar LOGIN hai (Database verification)
    else {
        const userRef = firebase.database().ref(`post_analytics/post_${postId}/users/${userId}`);
        userRef.once('value', snapshot => {
            if (!snapshot.exists()) {
                userRef.set(true);
                localRegister[postId] = true;
                localStorage.setItem('haziri_register', JSON.stringify(localRegister));
                bumpCounterInDB(postId);
            } else {
                console.log("Spam Blocked: Database me haziri pehle se hai!");
            }
        });
    }
}

function bumpCounterInDB(postId) {
    const metricsRef = firebase.database().ref(`post_analytics/post_${postId}/copyCount`);
    metricsRef.transaction((currentCount) => {
        return (currentCount || 0) + 1;
    }, (error, committed, snapshot) => {
        if (committed) {
            const countContainer = document.getElementById(`download-count-${postId}`);
            if (countContainer) countContainer.innerHTML = `<i class="fas fa-download"></i> ${snapshot.val()}`;
        }
    });
}

// NEW ADVANCED OPEN MODAL FUNCTION
function openModal(id) {
    const dataset = (typeof posts !== 'undefined') ? posts : [];
    const p = dataset.find(x => x.id === id);
    if (!p) return;
    
    let photoArray = p.images || []; 
    if (photoArray.length === 0) {
        photoArray = [p.imageUrl || 'https://via.placeholder.com/800x600?text=No+Image'];
    }

    // 1. DYNAMIC UI ELEMENTS
    const counterEl = document.getElementById('modalImageCounter');
    const thumbsEl = document.getElementById('modalThumbnails');
    const mainImgEl = document.getElementById('modalMainImage');

    // 🔴 CONDITIONAL LOGIC (1 Photo vs Multiple Photos)
    if (photoArray.length > 1) {
        counterEl.style.display = 'block';
        counterEl.innerText = `1 / ${photoArray.length}`;
        thumbsEl.style.display = 'flex';
        thumbsEl.innerHTML = '';

        photoArray.forEach((imgSrc, index) => {
            const img = document.createElement('img');
            img.src = imgSrc;
            if(index === 0) img.classList.add('active');
            
            img.onclick = () => {
                mainImgEl.src = imgSrc;
                counterEl.innerText = `${index + 1} / ${photoArray.length}`;
                document.querySelectorAll('.gallery-thumbnails img').forEach(t => t.classList.remove('active'));
                img.classList.add('active');
            };
            thumbsEl.appendChild(img);
        });
    } else {
        counterEl.style.display = 'none';
        thumbsEl.style.display = 'none';
    }

    // Main image pehli wali set karo
    mainImgEl.src = photoArray[0];

    // 2. AUTHOR & META DETAILS
    document.getElementById('modalAuthorAvatar').textContent = p.author ? p.author[0].toUpperCase() : 'U';
    document.getElementById('modalAuthorName').textContent = p.author || 'User';
    document.getElementById('modalAuthorHandle').textContent = '@' + (p.author ? p.author.toLowerCase().replace(/\s/g, '') : 'user');
    document.getElementById('modalAiTag').innerHTML = `<i class="fas fa-robot"></i> ${p.ai || 'AI Image'}`;
    document.getElementById('modalLikeCount').textContent = p.likes || Math.floor(Math.random() * 50) + 10;

    // 3. POSTS LIST GENERATION
    const postsListEl = document.getElementById('modalPostsList');
    let captionsArray = p.posts || [p.post || p.caption];
    postsListEl.innerHTML = '';

    captionsArray.forEach((text, index) => {
        const postBox = `
            <div class="post-box-item">
                <div class="post-box-header">
                    <i class="far fa-image"></i> IMAGE - ${index + 1}
                </div>
                <div class="post-box-text">${text}</div>
                <div class="post-box-actions">
                    <button class="post-action-btn"><i class="fas fa-language"></i> Translate</button>
                    <button class="post-action-btn" onclick="copyModalPostText('${text.replace(/'/g, "\\'")}', this)">
                        <i class="far fa-copy"></i> Copy
                    </button>
                </div>
            </div>
        `;
        postsListEl.innerHTML += postBox;
    });

    // 4. MODAL OPEN KARO
    document.getElementById('modalOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

// Naya Copy Function sirf is modal ke boxes ke liye
window.copyModalPostText = function(text, btnElement) {
    navigator.clipboard.writeText(text).then(() => {
        const originalHtml = btnElement.innerHTML;
        btnElement.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btnElement.style.color = '#00e676';
        setTimeout(() => {
            btnElement.innerHTML = originalHtml;
            btnElement.style.color = '';
        }, 2000);
    });
};

// Modal Close button ka Event Listener
document.getElementById('modalCloseDirectBtn')?.addEventListener('click', () => {
    document.getElementById('modalOverlay').classList.remove('open');
    document.body.style.overflow = '';
});

function openAuthModal() {
    document.getElementById('authOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    document.getElementById('authSuccess').classList.remove('show');
    document.getElementById('authForm').style.display = 'block';
    switchTab(currentTab);
}

// REALTIME BROADCAST LISTENER: Sync real copies data across any user visiting the ecosystem
if (typeof firebase !== 'undefined' && firebase.database) {
    firebase.database().ref("post_analytics").on("value", (snapshot) => {
        if (snapshot.exists()) {
            const analyticsData = snapshot.val();
            Object.keys(analyticsData).forEach(key => {
                const postId = key.replace('post_', '');
                const liveCount = analyticsData[key].copyCount;
                
                const countContainer = document.getElementById(`download-count-${postId}`);
                if (countContainer && liveCount) {
                    countContainer.innerHTML = `<i class="fas fa-download"></i> ${liveCount}`;
                }
                
                const internalPosts = (typeof posts !== 'undefined') ? posts : [];
                const localPostObj = internalPosts.find(p => p.id == postId);
                if (localPostObj) {
                    localPostObj.downloads = liveCount;
                }
            });
        }
    });
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
                migrateGuestFavoritesToUser(userCredential.user.uid);
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
                migrateGuestFavoritesToUser(userCredential.user.uid);
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
            if(data.trustPostCounter) {
                document.getElementById('trustCount').innerText = data.trustPostCounter;
                document.getElementById('statPosts').innerText = data.trustPostCounter;
            }
            if(data.trustUserCounter) {
                document.getElementById('trustUsers').innerText = data.trustUserCounter;
                document.getElementById('statDownloads').innerText = data.trustUserCounter;
            }
            if(data.totalCategoriesCounter) document.getElementById('statCategories').innerText = data.totalCategoriesCounter;

            let imgX = Number(data.imgLeft) || 0; let imgY = Number(data.imgTop) || 0;
            heroProfileCoords.x = imgX;
            heroProfileCoords.y = imgY;
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
    document.getElementById('heroSearchBtn')?.addEventListener('click', filterPostsProcessor);

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
        const text = document.getElementById('modalPost').textContent;
        const currentPostId = document.getElementById('modalCopyBtn').getAttribute('data-active-id');
        
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById('modalCopyBtn');
            btn.innerHTML = '<i class="fas fa-check"></i> &nbsp; COPIED!';
            btn.classList.add('copied');
            
            if (currentPostId) {
                trackPostCopyAnalytics(currentPostId);
            }

            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-copy"></i> &nbsp; COPY POST';
                btn.classList.remove('copied');
            }, 2000);
        });
    });

    if (typeof posts !== 'undefined' && posts) {
        renderCards(posts);
    }
});


// Helper to apply authentication state changes in-place (no full reload)
function applyAuthState(user) {
    const loginBtn = document.getElementById('loginBtn');
    const userProfileWrapper = document.getElementById('userProfileWrapper');
    const userDisplay = document.getElementById('userDisplay');
    const dropdownUserName = document.getElementById('dropdownUserName');
    const dropdownUserEmail = document.getElementById('dropdownUserEmail');

    // 🔥 INSTAGRAM ELEMENTS SELECT KARO 🔥
    const igUsernameEl = document.querySelector('.ig-username');
    const igNameEl = document.querySelector('.ig-name');
    const igAvatarEl = document.querySelector('.ig-avatar-box img');
    const igNavProfileEl = document.querySelector('.ig-nav-profile');

    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (userProfileWrapper) userProfileWrapper.style.display = 'inline-block';

        const nameToShow = user.displayName || (user.email ? user.email.split('@')[0] : '') || "CREATOR";
        if (userDisplay) userDisplay.textContent = nameToShow.toUpperCase();
        if (dropdownUserName) dropdownUserName.textContent = nameToShow.toUpperCase();
        if (dropdownUserEmail) dropdownUserEmail.textContent = user.email || '';

        // 🔥 GOOGLE/FIREBASE DATA SE INSTAGRAM PROFILE SYNC KARO 🔥
        const googleUsername = user.email ? user.email.split('@')[0].toLowerCase() : 'ankitburdakk';
        const googleName = user.displayName || nameToShow;
        const googlePhoto = user.photoURL || 'https://via.placeholder.com/150'; 

        if (igUsernameEl) {
            igUsernameEl.innerHTML = `${googleUsername} <i class="fas fa-chevron-down" style="font-size: 12px; margin-left: 4px; cursor: pointer;"></i>`;
        }
        if (igNameEl) igNameEl.textContent = googleName;
        if (igAvatarEl) igAvatarEl.src = googlePhoto;
        if (igNavProfileEl) igNavProfileEl.src = googlePhoto; 

        try { migrateGuestFavoritesToUser(user.uid); } catch (e) { console.error(e); }
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (userProfileWrapper) userProfileWrapper.style.display = 'none';
        if (showOnlyFavorites) toggleFavoritesPageView(false);

        // 🔥 LOGOUT HONE PAR WAPAS DEFAULT SETUP 🔥
        if (igUsernameEl) {
            igUsernameEl.innerHTML = `guest <i class="fas fa-chevron-down" style="font-size: 12px; margin-left: 4px; cursor: pointer;"></i>`;
        }
        if (igNameEl) igNameEl.textContent = 'Guest';
        if (igAvatarEl) igAvatarEl.src = '';
        if (igNavProfileEl) igNavProfileEl.src = '';
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
    const originalGuestData = localStorage.getItem('fav_posts_guest');
    const originalUserData = originalUser ? localStorage.getItem(`fav_posts_${originalUser.uid}`) : null;

    const cleanupTempKeys = () => {
        localStorage.removeItem('fav_posts_guest_test');
        localStorage.removeItem('fav_posts_TEST_UID');
    };

    const restoreStorage = () => {
        if (originalGuestData !== null) {
            localStorage.setItem('fav_posts_guest', originalGuestData);
        } else {
            localStorage.removeItem('fav_posts_guest');
        }

        if (originalUser && originalUserData !== null) {
            localStorage.setItem(`fav_posts_${originalUser.uid}`, originalUserData);
        }
    };

    try {
        const postsArr = (typeof posts !== 'undefined') ? posts : window.posts || [];
        const grid = document.getElementById('postGrid');
        if (!grid) {
            console.warn('postGrid element not found — aborting smoke test.');
            return;
        }
        if (!postsArr || postsArr.length === 0) {
            console.warn('No posts found — smoke test requires at least one post.');
            return;
        }

        const testId = postsArr[0].id;
        cleanupTempKeys();

        localStorage.removeItem('fav_posts_guest');
        if (!originalUser) {
            toggleFavoriteState(testId);
        } else {
            localStorage.setItem('fav_posts_guest', JSON.stringify([testId]));
        }
        const guestFavs = JSON.parse(localStorage.getItem('fav_posts_guest') || '[]');
        console.log('Guest favs after toggle:', guestFavs);

        toggleFavoritesPageView(true);
        await new Promise(r => setTimeout(r, 150));
        console.log('Favorites portal (guest) dataset count:', getFiltered().length);

        migrateGuestFavoritesToUser('TEST_UID');
        const userFavs = JSON.parse(localStorage.getItem('fav_posts_TEST_UID') || '[]');
        console.log('User favs after migration:', userFavs);

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

// 🔥 3. DISPLAY WALA CODE (REAL FIREBASE LIKES KE SATH) — Original fallback version
function loadCommunityPostsOriginal() {
    const container = document.getElementById('community-posts-container');
    if (!container) return; 

    let myFavorites = JSON.parse(localStorage.getItem('community_favs') || '[]');

    firebase.database().ref('posts').on('value', (snapshot) => {
        container.innerHTML = ''; 
        const data = snapshot.val();
        if (!data) return;

        const currentUser = firebase.auth().currentUser;
        const currentUserId = currentUser ? currentUser.uid : null;
        const favs = getFavoritesFromStorage();
        let visibleCount = 0;

        for (let key in data) {
            const post = data[key];

            if (showOnlyFavorites && !favs.includes(key)) continue;
            visibleCount++;

            const realLikes = post.likeCount || 0;

            if (typeof posts !== 'undefined') {
                let existingPost = posts.find(x => x.id === key);
                if (!existingPost) {
                    posts.push({
                        id: key,
                        images: [post.imageUrl], 
                        author: post.authorName || (post.authorEmail ? post.authorEmail.split('@')[0] : "User"),
                        ai: post.aiTool || 'AI Image',
                        posts: [post.caption], 
                        likes: realLikes
                    });
                } else {
                    existingPost.likes = realLikes;
                }
            }

            const displayAuthor = post.authorName || (post.authorEmail ? post.authorEmail.split('@')[0] : "User");
            const authorInitial = displayAuthor.charAt(0).toUpperCase();
            
            let deleteBtnHTML = '';
            if (currentUserId === post.authorId) {
                deleteBtnHTML = `<button onclick="event.stopPropagation(); deleteMyPost('${key}')" style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; backdrop-filter: blur(4px);" onmouseover="this.style.background='#ff4444'" onmouseout="this.style.background='rgba(0,0,0,0.5)'" title="Delete"><i class="fas fa-times"></i></button>`;
            }

            const isFav = myFavorites.includes(key);
            const heartIcon = isFav ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
            const heartColor = isFav ? '#ff4444' : 'white';

            const isBookmarked = favs.includes(key);
            const bookmarkIcon = isBookmarked ? '<i class="fas fa-bookmark"></i>' : '<i class="far fa-bookmark"></i>';
            const bookmarkColor = isBookmarked ? '#ffaa00' : 'white';

            const card = `
                <div class="hover-card-wrapper" onmouseenter="this.querySelector('.hover-overlay').style.opacity='1'" onmouseleave="this.querySelector('.hover-overlay').style.opacity='0'" onclick="openModal('${key}')" style="position: relative; break-inside: avoid; margin-bottom: 24px; display: inline-block; width: 100%; border-radius: 16px; overflow: hidden; cursor: zoom-in; box-shadow: 0 4px 15px rgba(0,0,0,0.15);">
                    
                    <img src="${post.imageUrl}" style="width: 100%; height: auto; display: block; transition: transform 0.4s ease;" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
                    
                    <button onclick="event.stopPropagation(); toggleFavoriteState('${key}');" style="position: absolute; top: 14px; right: 14px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: ${bookmarkColor}; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; backdrop-filter: blur(4px); z-index: 20;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(0,0,0,0.5)'" title="Save to Favorites">
                        ${bookmarkIcon}
                    </button>

                    <div class="hover-overlay" style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 40px 16px 16px 16px; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%); opacity: 0; transition: opacity 0.3s ease; display: flex; flex-direction: column; justify-content: flex-end; pointer-events: none;">
                        
                        <div style="pointer-events: auto;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                                <div style="background: linear-gradient(135deg, #ff9900, #ff00cc); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">${authorInitial}</div>
                                <div style="display: flex; flex-direction: column;">
                                    <span style="color: white; font-size: 14px; font-weight: 700; line-height: 1.1;">${displayAuthor}</span>
                                    <span style="color: #ccc; font-size: 11px;">@${post.authorName ? post.authorName.toLowerCase().replace(/\s/g, '') : 'user'}</span>
                                </div>
                            </div>

                            <div style="display: flex; align-items: center; gap: 8px;">
                                <button onclick="event.stopPropagation(); navigator.clipboard.writeText('${post.caption.replace(/'/g, "\\'")}'); this.innerHTML='<i class=\\'fas fa-check\\'></i> Copied'; this.style.color='#000'; setTimeout(() => { this.innerHTML='<i class=\\'fas fa-retweet\\'></i> Use Idea'; this.style.color='#000'; }, 2000);" style="background: white; border: none; color: black; padding: 8px 16px; border-radius: 20px; font-size: 12px; cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 6px; flex: 1; justify-content: center; transition: 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.3);" onmouseover="this.style.background='#eee'" onmouseout="this.style.background='white'">
                                    <i class="fas fa-retweet"></i> Use Idea
                                </button>

                                <button onclick="event.stopPropagation(); toggleLikePost('${key}')" style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: ${heartColor}; padding: 8px 12px; border-radius: 20px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 600; backdrop-filter: blur(4px); transition: 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(0,0,0,0.5)'">
                                    ${heartIcon} ${realLikes}
                                </button>

                                ${deleteBtnHTML}
                            </div>
                        </div>

                    </div>
                </div>
            `;
            container.innerHTML = card + container.innerHTML; 
        }

        if (showOnlyFavorites && visibleCount === 0) {
            container.innerHTML = `
            <div style="text-align: center; padding: 80px 20px; width: 100%; grid-column: 1/-1;">
                <i class="far fa-bookmark" style="font-size: 4rem; color: #ffaa00; margin-bottom: 20px; display: block;"></i>
                <h4 style="font-family: inherit; font-size: 18px; letter-spacing: 2px; color: #fff; margin-bottom: 12px;">NO SAVED POSTS</h4>
                <p style="font-size: 14px; max-width: 400px; margin: 0 auto 24px; line-height: 1.6; color: #6a7090;">Tumne abhi tak koi post save nahi kiya hai! Home par jaakar kisi bhi card ke bookmark icon par click karo.</p>
                <button onclick="toggleFavoritesPageView(false)" style="background: #0095f6; color: white; border: none; padding: 12px 28px; border-radius: 8px; cursor: pointer; font-weight: bold; letter-spacing: 1px; transition: 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">BROWSE POSTS</button>
            </div>`;
        }
    });
}


// 🔥 5. DELETE KARNE KA LOGIC
window.deleteMyPost = function(postKey) {
    if (confirm("Sach me delete karna hai?")) {
        firebase.database().ref('posts/' + postKey).remove();
    }
}

// ==========================================
// 🔥 COMMENTS SYSTEM ENGINE 🔥
// ==========================================

// Global: Currently open post key for comments
let _currentCommentPostKey = null;
let _commentsListenerRef = null;

// --- 1. ESCAPE HTML (XSS Protection) ---
function escHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// --- 2. RELATIVE TIME FORMAT ---
function formatCommentTime(timestamp) {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 10) return 'just now';
    if (seconds < 60) return seconds + 's ago';
    if (minutes < 60) return minutes + 'm ago';
    if (hours < 24) return hours + 'h ago';
    if (days < 7) return days + 'd ago';
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// --- 3. DETACH PREVIOUS COMMENTS LISTENER ---
function detachCommentsListener() {
    if (_commentsListenerRef) {
        _commentsListenerRef.off();
        _commentsListenerRef = null;
    }
    _currentCommentPostKey = null;
}

// --- 4. LOAD & LISTEN COMMENTS FOR A POST ---
function loadCommentsForPost(postKey) {
    if (!postKey) return;

    detachCommentsListener();
    _currentCommentPostKey = postKey;

    const commentsRef = firebase.database().ref('posts/' + postKey + '/comments').orderByChild('timestamp');
    _commentsListenerRef = commentsRef;

    const listEl = document.getElementById('modalCommentsList');
    const countEl = document.getElementById('modalCommentCount');
    const currentUser = firebase.auth().currentUser;

    commentsRef.on('value', (snap) => {
        if (!listEl || !countEl) return;

        if (!snap.exists()) {
            listEl.innerHTML = '<div class="comments-empty"><i class="far fa-comment"></i> Koi comment nahi hai. Pehla comment karo!</div>';
            countEl.textContent = '0';
            return;
        }

        let comments = [];
        snap.forEach(child => {
            comments.push({ key: child.key, ...child.val() });
        });

        comments.reverse();
        countEl.textContent = comments.length;

        let html = '';
        comments.forEach(c => {
            const initial = (c.authorName || 'U').charAt(0).toUpperCase();
            const timeStr = formatCommentTime(c.timestamp);
            const isOwner = currentUser && c.authorId === currentUser.uid;

            html += `
                <div class="comment-item" data-comment-key="${c.key}">
                    <div class="comment-avatar">${escHTML(initial)}</div>
                    <div class="comment-body">
                        <div class="comment-meta">
                            <span class="comment-author">${escHTML(c.authorName || 'User')}</span>
                            <span class="comment-time">${timeStr}</span>
                        </div>
                        <div class="comment-text">${escHTML(c.text || '')}</div>
                    </div>
                    ${isOwner ? `<button class="comment-delete-btn" onclick="deleteComment('${escHTML(postKey)}', '${escHTML(c.key)}')" title="Delete"><i class="fas fa-trash-alt"></i></button>` : ''}
                </div>
            `;
        });

        listEl.innerHTML = html;
        listEl.scrollTop = listEl.scrollHeight;
    });
}

// --- 5. SUBMIT A NEW COMMENT ---
window.submitComment = function(postKey) {
    const input = document.getElementById('modalCommentInput');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Comment karne ke liye pehle login karo!');
        if (typeof openAuthModal === 'function') openAuthModal();
        return;
    }

    if (!postKey) return;

    const sendBtn = document.getElementById('modalCommentSendBtn');
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    const authorName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');

    console.log('🔥 [COMMENT] Submitting comment on post:', postKey, 'by user:', user.uid);

    firebase.database().ref('posts/' + postKey + '/comments').push({
        text: text,
        authorId: user.uid,
        authorName: authorName,
        authorEmail: user.email || '',
        timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        input.value = '';
        console.log('🔥 [COMMENT] Comment saved successfully!');

        // 🔥 NOTIFICATION: Post author ko notify karo
        firebase.database().ref('posts/' + postKey).once('value', snap => {
            const pData = snap.val();
            console.log('🔥 [NOTIF] Post data:', pData ? { authorId: pData.authorId, title: pData.title } : 'NULL');
            console.log('🔥 [NOTIF] Commenter UID:', user.uid, '| Post Author UID:', pData?.authorId);
            
            if (pData && pData.authorId && pData.authorId !== user.uid) {
                console.log('🔥 [NOTIF] Sending notification to:', pData.authorId);
                
                const notifRef = firebase.database().ref('users/' + pData.authorId + '/notifications');
                notifRef.push({
                    type: 'comment',
                    postId: postKey,
                    fromUid: user.uid,
                    fromName: authorName,
                    commentText: text.substring(0, 60),
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    read: false
                }).then(() => {
                    console.log('🔥 [NOTIF] ✅ Notification SENT successfully to:', pData.authorId);
                }).catch(err => {
                    console.error('🔥 [NOTIF] ❌ Notification FAILED to send:', err);
                    console.error('🔥 [NOTIF] This is likely a Firebase Security Rules issue!');
                    console.error('🔥 [NOTIF] Check: Firebase Console > Realtime Database > Rules');
                });
            } else if (pData && pData.authorId === user.uid) {
                console.log('🔥 [NOTIF] ⚠️ Self-comment — no notification sent (same user)');
            } else {
                console.log('🔥 [NOTIF] ⚠️ No authorId found on post — cannot send notification');
            }
        }).catch(err => {
            console.error('🔥 [NOTIF] ❌ Failed to read post data:', err);
        });

        // 🔥 UPDATE COMMENT COUNT on the post
        firebase.database().ref('posts/' + postKey + '/commentCount').transaction(count => (count || 0) + 1);

    }).catch(err => {
        console.error('🔥 [COMMENT] Submit error:', err);
        alert('Comment post nahi hua. Try again!');
    }).finally(() => {
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
    });
};

// --- 6. DELETE OWN COMMENT ---
window.deleteComment = function(postKey, commentKey) {
    if (!confirm('Yeh comment delete karna hai?')) return;

    firebase.database().ref('posts/' + postKey + '/comments/' + commentKey).remove().then(() => {
        firebase.database().ref('posts/' + postKey + '/commentCount').transaction(count => (count || 1) - 1);
    }).catch(err => {
        console.error('Comment delete error:', err);
    });
};

// --- 7. UPDATE COMMENT INPUT AVATAR ON AUTH ---
function updateCommentInputAvatar() {
    const user = firebase.auth().currentUser;
    const avatarEl = document.getElementById('commentInputAvatar');
    if (!avatarEl) return;

    if (user) {
        const name = user.displayName || (user.email ? user.email.split('@')[0] : 'U');
        avatarEl.textContent = name.charAt(0).toUpperCase();
    } else {
        avatarEl.textContent = 'G';
    }
}

// --- 8. HOOK INTO EXISTING openModal() FUNCTION ---
const _originalOpenModal = window.openModal || openModal;
window.openModal = function(id) {
    _originalOpenModal(id);
    loadCommentsForPost(id);
    updateCommentInputAvatar();

    const commentInput = document.getElementById('modalCommentInput');
    if (commentInput && !commentInput._commentEnterHooked) {
        commentInput._commentEnterHooked = true;
        commentInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitComment(_currentCommentPostKey);
            }
        });
    }

    const sendBtn = document.getElementById('modalCommentSendBtn');
    if (sendBtn && !sendBtn._commentSendHooked) {
        sendBtn._commentSendHooked = true;
        sendBtn.addEventListener('click', () => {
            submitComment(_currentCommentPostKey);
        });
    }
};

// --- 9. DETACH COMMENTS WHEN MODAL CLOSES ---
const _origCloseModal = function() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.body.style.overflow = '';
};
document.getElementById('modalCloseDirectBtn')?.removeEventListener('click', _origCloseModal);
document.getElementById('modalCloseDirectBtn')?.addEventListener('click', () => {
    detachCommentsListener();
});

document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalOverlay')) {
        detachCommentsListener();
    }
});

// --- 10. UPDATE COMMENT INPUT AVATAR ON AUTH STATE CHANGE ---
firebase.auth().onAuthStateChanged(() => {
    updateCommentInputAvatar();
});

// --- 11. SHOW COMMENT COUNT ON COMMUNITY CARDS ---
// Patched loadCommunityPosts with comment count display
const _originalLoadCommunityPosts = loadCommunityPostsOriginal;
loadCommunityPosts = function() {
    const container = document.getElementById('community-posts-container');
    if (!container) return;

    let myFavorites = JSON.parse(localStorage.getItem('community_favs') || '[]');

    firebase.database().ref('posts').on('value', (snapshot) => {
        container.innerHTML = '';
        const data = snapshot.val();
        if (!data) return;

        const currentUser = firebase.auth().currentUser;
        const currentUserId = currentUser ? currentUser.uid : null;
        const favs = getFavoritesFromStorage();
        let visibleCount = 0;

        for (let key in data) {
            const post = data[key];

            if (showOnlyFavorites && !favs.includes(key)) continue;
            visibleCount++;

            const realLikes = post.likeCount || 0;
            const commentCount = post.commentCount || 0;

            if (typeof posts !== 'undefined') {
                let existingPost = posts.find(x => x.id === key);
                if (!existingPost) {
                    posts.push({
                        id: key,
                        images: [post.imageUrl],
                        author: post.authorName || (post.authorEmail ? post.authorEmail.split('@')[0] : "User"),
                        ai: post.aiTool || 'AI Image',
                        posts: [post.caption],
                        likes: realLikes
                    });
                } else {
                    existingPost.likes = realLikes;
                }
            }

            const displayAuthor = post.authorName || (post.authorEmail ? post.authorEmail.split('@')[0] : "User");
            const authorInitial = displayAuthor.charAt(0).toUpperCase();

            let deleteBtnHTML = '';
            if (currentUserId === post.authorId) {
                deleteBtnHTML = `<button onclick="event.stopPropagation(); deleteMyPost('${key}')" style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; backdrop-filter: blur(4px);" onmouseover="this.style.background='#ff4444'" onmouseout="this.style.background='rgba(0,0,0,0.5)'" title="Delete"><i class="fas fa-times"></i></button>`;
            }

            const isFav = myFavorites.includes(key);
            const heartIcon = isFav ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
            const heartColor = isFav ? '#ff4444' : 'white';

            const isBookmarked = favs.includes(key);
            const bookmarkIcon = isBookmarked ? '<i class="fas fa-bookmark"></i>' : '<i class="far fa-bookmark"></i>';
            const bookmarkColor = isBookmarked ? '#ffaa00' : 'white';

            const card = `
                <div class="hover-card-wrapper" onmouseenter="this.querySelector('.hover-overlay').style.opacity='1'" onmouseleave="this.querySelector('.hover-overlay').style.opacity='0'" onclick="openModal('${key}')" style="position: relative; break-inside: avoid; margin-bottom: 24px; display: inline-block; width: 100%; border-radius: 16px; overflow: hidden; cursor: zoom-in; box-shadow: 0 4px 15px rgba(0,0,0,0.15);">
                    
                    <img src="${post.imageUrl}" style="width: 100%; height: auto; display: block; transition: transform 0.4s ease;" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
                    
                    <button onclick="event.stopPropagation(); toggleFavoriteState('${key}');" style="position: absolute; top: 14px; right: 14px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: ${bookmarkColor}; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; backdrop-filter: blur(4px); z-index: 20;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(0,0,0,0.5)'" title="Save to Favorites">
                        ${bookmarkIcon}
                    </button>

                    <div class="hover-overlay" style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 40px 16px 16px 16px; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%); opacity: 0; transition: opacity 0.3s ease; display: flex; flex-direction: column; justify-content: flex-end; pointer-events: none;">
                        
                        <div style="pointer-events: auto;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                                <div style="background: linear-gradient(135deg, #ff9900, #ff00cc); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">${authorInitial}</div>
                                <div style="display: flex; flex-direction: column;">
                                    <span style="color: white; font-size: 14px; font-weight: 700; line-height: 1.1;">${displayAuthor}</span>
                                    <span style="color: #ccc; font-size: 11px;">@${post.authorName ? post.authorName.toLowerCase().replace(/\s/g, '') : 'user'}</span>
                                </div>
                            </div>

                            <div style="display: flex; align-items: center; gap: 8px;">
                                <button onclick="event.stopPropagation(); navigator.clipboard.writeText('${post.caption.replace(/'/g, "\\'")}'); this.innerHTML='<i class=\\'fas fa-check\\'></i> Copied'; this.style.color='#000'; setTimeout(() => { this.innerHTML='<i class=\\'fas fa-retweet\\'></i> Use Idea'; this.style.color='#000'; }, 2000);" style="background: white; border: none; color: black; padding: 8px 16px; border-radius: 20px; font-size: 12px; cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 6px; flex: 1; justify-content: center; transition: 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.3);" onmouseover="this.style.background='#eee'" onmouseout="this.style.background='white'">
                                    <i class="fas fa-retweet"></i> Use Idea
                                </button>

                                <button onclick="event.stopPropagation(); toggleLikePost('${key}')" style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: ${heartColor}; padding: 8px 12px; border-radius: 20px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 600; backdrop-filter: blur(4px); transition: 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(0,0,0,0.5)'">
                                    ${heartIcon} ${realLikes}
                                </button>

                                <button onclick="event.stopPropagation(); openModal('${key}')" class="card-comment-count" style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 20px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 600; backdrop-filter: blur(4px); transition: 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(0,0,0,0.5)'">
                                    <i class="far fa-comment"></i> ${commentCount}
                                </button>

                                ${deleteBtnHTML}
                            </div>
                        </div>

                    </div>
                </div>
            `;
            container.innerHTML = card + container.innerHTML;
        }

        if (showOnlyFavorites && visibleCount === 0) {
            container.innerHTML = `
            <div style="text-align: center; padding: 80px 20px; width: 100%; grid-column: 1/-1;">
                <i class="far fa-bookmark" style="font-size: 4rem; color: #ffaa00; margin-bottom: 20px; display: block;"></i>
                <h4 style="font-family: inherit; font-size: 18px; letter-spacing: 2px; color: #fff; margin-bottom: 12px;">NO SAVED POSTS</h4>
                <p style="font-size: 14px; max-width: 400px; margin: 0 auto 24px; line-height: 1.6; color: #6a7090;">Tumne abhi tak koi post save nahi kiya hai! Home par jaakar kisi bhi card ke bookmark icon par click karo.</p>
                <button onclick="toggleFavoritesPageView(false)" style="background: #0095f6; color: white; border: none; padding: 12px 28px; border-radius: 8px; cursor: pointer; font-weight: bold; letter-spacing: 1px; transition: 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">BROWSE POSTS</button>
            </div>`;
        }
    });
};

// 🔥 6. PAGE LOAD HOTE HI DATA DIKHAO
firebase.auth().onAuthStateChanged(() => { loadCommunityPosts(); });

// ==========================================
// 🔥 FULL PAGE NOTIFICATION SYSTEM 🔥
// ==========================================

window.toggleNotificationsPageView = function(enable) {
    const heroContainer = document.querySelector('.hero-container');
    const trustBar = document.querySelector('.trust-bar');
    const categoriesSection = document.getElementById('categories');
    const featuredSection = document.getElementById('featured');
    const bannerSection = document.querySelector('.featured-banner')?.parentNode;
    const redirectBox = document.querySelector('.post-redirect-box-wrapper')?.parentNode;
    const toolsGrid = document.querySelector('.tools-grid')?.parentNode;
    const dividers = document.querySelectorAll('.divider');
    const communityContainer = document.getElementById('community-posts-container');
    const notifPage = document.getElementById('full-notifications-page');

    if (enable) {
        if (heroContainer) heroContainer.style.display = 'none';
        if (trustBar) trustBar.style.display = 'none';
        if (categoriesSection) categoriesSection.style.display = 'none';
        if (bannerSection) bannerSection.style.display = 'none';
        if (redirectBox) redirectBox.style.display = 'none';
        if (toolsGrid) toolsGrid.style.display = 'none';
        if (featuredSection) featuredSection.style.display = 'none';
        if (communityContainer) communityContainer.style.display = 'none';
        dividers.forEach(d => d.style.display = 'none');
        
        if (notifPage) notifPage.style.display = 'block';
        window.scrollTo(0, 0);
    } else {
        if (heroContainer) heroContainer.style.display = '';
        if (trustBar) trustBar.style.display = '';
        if (categoriesSection) categoriesSection.style.display = '';
        if (bannerSection) bannerSection.style.display = '';
        if (redirectBox) redirectBox.style.display = '';
        if (toolsGrid) toolsGrid.style.display = '';
        if (featuredSection) featuredSection.style.display = '';
        if (communityContainer) communityContainer.style.display = '';
        dividers.forEach(d => d.style.display = '');
        
        if (notifPage) notifPage.style.display = 'none';
    }
};

// 🔥 NOTIFICATION LISTENER — with debug logging + duplicate protection
let _notifListenerAttached = false;

function listenForNotifications(uid) {
    if (_notifListenerAttached) {
        console.log('🔥 [NOTIF-LISTEN] Already attached, skipping duplicate for UID:', uid);
        return;
    }
    _notifListenerAttached = true;

    console.log('🔥 [NOTIF-LISTEN] Attaching listener for UID:', uid);
    
    const notifRef = firebase.database().ref('users/' + uid + '/notifications');
    notifRef.limitToLast(50).on('value', snap => {
        const notifList = document.getElementById('fullNotifList');
        
        console.log('🔥 [NOTIF-LISTEN] Firebase callback fired. Data exists:', snap.exists(), '| Element found:', !!notifList);
        
        if (!notifList) {
            console.log('🔥 [NOTIF-LISTEN] ⚠️ fullNotifList element NOT found in DOM!');
            return;
        }

        if (!snap.exists()) {
            console.log('🔥 [NOTIF-LISTEN] No notifications in database for this user');
            notifList.innerHTML = '<div style="text-align: center; padding: 60px 20px; color: var(--muted);"><i class="far fa-bell" style="font-size: 40px; margin-bottom: 16px; color: var(--border2);"></i><br><span style="font-size:15px; font-weight:600;">No new notifications</span><br><span style="font-size:13px; color:#888;">When someone likes your post, comments, or follows you — it will show here.</span></div>';
            return;
        }

        let html = '';
        let unreadCount = 0;
        let notifs = [];
        snap.forEach(child => { notifs.push({ key: child.key, ...child.val() }); });
        notifs.reverse();

        console.log('🔥 [NOTIF-LISTEN] ✅ Found', notifs.length, 'notifications! Unread:', notifs.filter(n => !n.read).length);

        notifs.forEach(n => {
            if (!n.read) unreadCount++;
            let isLike = n.type === 'like';
            let isComment = n.type === 'comment';
            let isFollow = n.type === 'follow';
            let icon = isLike ? '<i class="fas fa-heart" style="color:#ed4956"></i>' : isComment ? '<i class="fas fa-comment" style="color:#4285f4"></i>' : '<i class="fas fa-user-plus" style="color:#0095f6"></i>';
            let text = isLike ? 'liked your post.' : isComment ? 'commented on your post.' : 'started following you.';
            
            // 🔥 Comment preview with styled box
            let preview = '';
            if (isComment && n.commentText) {
                preview = '<div style="font-size:12px; color:#6b7280; margin-top:4px; font-style:italic; background:rgba(0,0,0,0.03); padding:6px 10px; border-radius:8px; border-left:3px solid #4285f4;">"' + escHTML(n.commentText) + (n.commentText.length >= 60 ? '...' : '') + '"</div>';
            }

            // 🔥 User handle extract karo
            let fromHandle = '@user';
            if (n.fromName) {
                fromHandle = '@' + n.fromName.toLowerCase().replace(/\s+/g, '');
            } else if (n.fromUid) {
                fromHandle = '@' + n.fromUid.substring(0, 8);
            }

            // 🔥 Click to go to user profile
            let clickAction = '';
            if (n.fromUid) {
                clickAction = ' onclick="goToUserProfileFromNotif(\'' + escHTML(n.fromUid) + '\', \'' + escHTML(n.fromName || 'User') + '\')"';
            }

            // 🔥 Follow notification ke liye UID display
            let uidDisplay = '';
            if (isFollow && n.fromUid) {
                uidDisplay = '<div style="font-size:11px; color:#9ca3af; font-family:monospace; margin-top:2px;">ID: ' + escHTML(n.fromUid.substring(0, 12)) + '...</div>';
            }

            html += '<div style="display:flex; align-items:center; gap:16px; padding:16px 20px; border-bottom:1px solid var(--border); background:' + (n.read ? 'transparent' : 'rgba(255,34,51,0.04)') + '; transition:all 0.2s; cursor:pointer; position:relative;"' + clickAction + ' onmouseover="this.style.background=\'var(--glass2)\'" onmouseout="this.style.background=\'' + (n.read ? 'transparent' : 'rgba(255,34,51,0.04)') + '\'">'
                + '<div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg,#f09433,#bc1888); color:white; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:bold; flex-shrink:0;">'
                + (n.fromName ? n.fromName.charAt(0).toUpperCase() : 'U')
                + '</div>'
                + '<div style="flex:1; font-size:15px; color:var(--text); line-height:1.4; min-width:0;">'
                + '<div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">'
                + '<strong style="color:var(--text); font-weight:700;">' + (n.fromName || 'Someone') + '</strong>'
                + '<span style="font-size:11px; color:#9ca3af; font-weight:500;">' + escHTML(fromHandle) + '</span>'
                + '</div>'
                + '<div style="margin-top:2px;">' + text + '</div>'
                + preview
                + uidDisplay
                + '<div style="font-size:11px; color:var(--red); font-weight:600; margin-top:5px; display:flex; align-items:center; gap:4px;">'
                + '<i class="fas fa-external-link-alt" style="font-size:9px;"></i> View Profile'
                + '</div>'
                + '</div>'
                + '<div style="font-size:20px; width:24px; text-align:center; flex-shrink:0; opacity:0.6;">' + icon + '</div>'
                + '</div>';
        });

        notifList.innerHTML = html;
    }, (error) => {
        console.error('🔥 [NOTIF-LISTEN] ❌ Firebase listener ERROR:', error);
        console.error('🔥 [NOTIF-LISTEN] This is likely a Firebase Security Rules issue!');
    });
}

window.markNotificationsRead = function() {
    const user = firebase.auth().currentUser;
    if(!user) return;
    firebase.database().ref('users/' + user.uid + '/notifications').once('value', snap => {
        if(snap.exists()){
            let updates = {};
            snap.forEach(child => {
                if(!child.val().read) updates[child.key + '/read'] = true;
            });
            if(Object.keys(updates).length > 0) {
                firebase.database().ref('users/' + user.uid + '/notifications').update(updates);
            }
        }
    });
};

// 🔥 Notification click se user profile pe jao
window.goToUserProfileFromNotif = function(uid, name) {
    if (!uid) return;
    if (typeof toggleNotificationsPageView === 'function') toggleNotificationsPageView(false);
    window.location.href = 'profile.html?viewUid=' + encodeURIComponent(uid) + '&viewName=' + encodeURIComponent(name || 'User');
};

// ==========================================
// 🔥 TEST NOTIFICATION — Debug Tool 🔥
// ==========================================
// Browser console mein run karo: testNotification()
// Yeh manually ek test notification bhejega currently logged-in user ko
window.testNotification = function() {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.error('🔥 [TEST] Pehle login karo!');
        alert('Pehle login karo!');
        return;
    }
    
    console.log('🔥 [TEST] Sending test notification to:', user.uid);
    
    firebase.database().ref('users/' + user.uid + '/notifications').push({
        type: 'comment',
        postId: 'test-post',
        fromUid: 'test-uid-123',
        fromName: 'Test User',
        commentText: 'Yeh ek test notification hai!',
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        read: false
    }).then(() => {
        console.log('🔥 [TEST] ✅ Test notification SENT!');
        alert('✅ Test notification bhej diya! Notification page check karo.');
    }).catch(err => {
        console.error('🔥 [TEST] ❌ Test notification FAILED:', err);
        alert('❌ Notification nahi gaya! Error: ' + err.message + '\n\nFirebase Security Rules check karo!');
    });
};

// 🔥 DEBUG: Check current user's notifications count
window.debugNotifs = function() {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.error('🔥 [DEBUG] Not logged in!');
        return;
    }
    console.log('🔥 [DEBUG] Current UID:', user.uid);
    firebase.database().ref('users/' + user.uid + '/notifications').once('value', snap => {
        if (snap.exists()) {
            console.log('🔥 [DEBUG] ✅ Notifications found:', snap.numChildren());
            snap.forEach(child => {
                console.log('  →', child.key, ':', JSON.stringify(child.val()));
            });
        } else {
            console.log('🔥 [DEBUG] ❌ No notifications at path: users/' + user.uid + '/notifications');
            console.log('🔥 [DEBUG] Check: Firebase Console > Realtime Database > users/' + user.uid);
        }
    });
};

// Login hone par notifications load karo
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        listenForNotifications(user.uid);
    }
});

// 🔥 4. REAL FIREBASE LIKE / UNLIKE LOGIC (With Notifications)
window.toggleLikePost = function(postKey) {
    let myFavorites = JSON.parse(localStorage.getItem('community_favs') || '[]');
    const dbRef = firebase.database().ref('posts/' + postKey + '/likeCount');
    const currentUser = firebase.auth().currentUser;

    if (myFavorites.includes(postKey)) {
        // UNLIKE KAR RAHA HAI
        myFavorites = myFavorites.filter(id => id !== postKey);
        dbRef.transaction(currentLikes => (currentLikes || 0) > 0 ? currentLikes - 1 : 0);
    } else {
        // LIKE KAR RAHA HAI
        myFavorites.push(postKey);
        dbRef.transaction(currentLikes => (currentLikes || 0) + 1);

        // 🔥 NOTIFICATION BHEJNE KA LOGIC 🔥
        if (currentUser) {
            firebase.database().ref('posts/' + postKey).once('value', snap => {
                let pData = snap.val();
                console.log('🔥 [LIKE-NOTIF] Post authorId:', pData?.authorId, '| Liker UID:', currentUser.uid);
                // Khud ke post par like ka notification nahi jayega
                if (pData && pData.authorId && pData.authorId !== currentUser.uid) {
                    firebase.database().ref('users/' + pData.authorId + '/notifications').push({
                        type: 'like',
                        postId: postKey,
                        fromUid: currentUser.uid,
                        fromName: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'User'),
                        timestamp: firebase.database.ServerValue.TIMESTAMP,
                        read: false
                    }).then(() => {
                        console.log('🔥 [LIKE-NOTIF] ✅ Like notification sent!');
                    }).catch(err => {
                        console.error('🔥 [LIKE-NOTIF] ❌ Failed:', err);
                    });
                } else if (pData && pData.authorId === currentUser.uid) {
                    console.log('🔥 [LIKE-NOTIF] ⚠️ Self-like — no notification');
                }
            });
        }
    }

    // 3. Local memory update kar do taaki dil (heart) turant apna color badle
    localStorage.setItem('community_favs', JSON.stringify(myFavorites));
    
    // 4. Screen ko turant refresh karo
    loadCommunityPosts();
};
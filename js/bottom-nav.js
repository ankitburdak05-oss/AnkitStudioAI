// ============================================================
//  🔥 SHARED BOTTOM NAVIGATION — Har page mein same
//  Instagram-style MPA navigation
// ============================================================

(function() {
    'use strict';

    // Bottom nav HTML template
    const BOTTOM_NAV_HTML = `
        <div class="ig-bottom-nav" id="sharedBottomNav">
            <div class="nav-item" data-view="homeView">
                <i class="fas fa-home"></i>
            </div>
            <div class="nav-item" data-view="searchView">
                <i class="fas fa-search"></i>
            </div>
            <div class="nav-item" data-action="add">
                <i class="far fa-plus-square"></i>
            </div>
            <div class="nav-item" data-view="reelsView">
                <i class="fas fa-film"></i>
            </div>
            <div class="nav-item" data-view="profileView">
                <img src="" alt="Profile" class="ig-nav-profile" id="navProfilePic">
            </div>
        </div>
    `;

    // Active view per page
    const PAGE_TO_VIEW = {
        'index.html':    'homeView',
        'messages.html': 'messagesView',
        'dashboard.html':'profileView',
        'profile.html':  'profileView',
        'reels.html':    'reelsView',
        'stories.html':  'homeView',
        'settings.html': 'profileView'
    };

    // Nav destinations
    const DESTINATIONS = {
        'homeView':     'index.html',
        'searchView':   'index.html?view=searchView',
        'reelsView':    'reels.html',
        'profileView':  'profile.html',
        'messagesView': 'messages.html'
    };

    function getCurrentPage() {
        var path = window.location.pathname;
        return path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    }

    function injectBottomNav() {
        // Agar pehle se exist karta hai toh inject mat karo
        if (document.getElementById('sharedBottomNav') || document.querySelector('.ig-bottom-nav')) return;

        var div = document.createElement('div');
        div.innerHTML = BOTTOM_NAV_HTML;
        document.body.appendChild(div.firstChild);
        injectBottomNavCSS();
    }

    function injectBottomNavCSS() {
        if (document.getElementById('sharedBottomNavCSS')) return;
        var style = document.createElement('style');
        style.id = 'sharedBottomNavCSS';
        style.textContent = `
            .ig-bottom-nav {
                position: fixed;
                bottom: 0; left: 0;
                width: 100%;
                background: #fff;
                border-top: 1px solid #dbdbdb;
                display: flex;
                justify-content: space-around;
                align-items: center;
                padding: 10px 0 12px;
                z-index: 9999;
                transform: translateZ(0);
                will-change: transform;
            }
            .ig-bottom-nav .nav-item {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 48px;
                height: 40px;
                cursor: pointer;
                position: relative;
                -webkit-tap-highlight-color: transparent;
            }
            .ig-bottom-nav .nav-item i {
                font-size: 24px;
                color: #262626;
                transition: transform .12s;
            }
            .ig-bottom-nav .nav-item:active i {
                transform: scale(.78);
            }
            .ig-bottom-nav .nav-item.active i {
                color: #0095f6;
            }
            .ig-nav-profile {
                width: 26px;
                height: 26px;
                border-radius: 50%;
                object-fit: cover;
                cursor: pointer;
                background: linear-gradient(135deg,#f09433,#bc1888);
            }
            .ig-nav-profile.active-nav {
                border: 2px solid #262626;
                padding: 2px;
            }
            /* Dark mode */
            body.dark-mode .ig-bottom-nav {
                background: #000;
                border-top-color: #262626;
            }
            body.dark-mode .ig-bottom-nav .nav-item i {
                color: #fff;
            }
            body.dark-mode .ig-bottom-nav .nav-item.active i {
                color: #0095f6;
            }
            body.dark-mode .ig-nav-profile.active-nav {
                border-color: #fff;
            }
        `;
        document.head.appendChild(style);
    }

    function updateActiveState() {
        var currentPage = getCurrentPage();
        var activeView = PAGE_TO_VIEW[currentPage] || null;

        // URL param se override (e.g., ?view=searchView)
        var urlParams = new URLSearchParams(window.location.search);
        var viewParam = urlParams.get('view');
        if (viewParam) activeView = viewParam;

        document.querySelectorAll('#sharedBottomNav .nav-item').forEach(function(item) {
            var view = item.getAttribute('data-view');
            item.classList.toggle('active', !!(activeView && view === activeView));
        });
    }

    function handleAddAction() {
        var user = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth().currentUser : null;

        if (!user) {
            var loginScreen = document.getElementById('loginScreen');
            if (loginScreen) loginScreen.classList.add('show');
            else window.location.href = 'index.html';
            return;
        }

        if (typeof window.openMediaPicker === 'function') {
            window.openMediaPicker();
            return;
        }

        window.location.href = 'index.html?openMediaPicker=1';
    }

    function bindNavClicks() {
        document.querySelectorAll('#sharedBottomNav .nav-item').forEach(function(item) {
            if (item.hasAttribute('data-spa-bound')) return;
            if (item.hasAttribute('data-nav-bound')) return;
            item.setAttribute('data-nav-bound', 'true');

            item.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                var action = this.getAttribute('data-action');
                if (action === 'add') {
                    handleAddAction();
                    return;
                }

                var view = this.getAttribute('data-view');
                var currentPage = getCurrentPage();

                if (view === PAGE_TO_VIEW[currentPage]) return;

                var dest = DESTINATIONS[view] || 'index.html';
                window.location.href = dest;
            });
        });
    }

    function updateNavProfile() {
        if (typeof firebase === 'undefined' || !firebase.auth) return;
        var user = firebase.auth().currentUser;
        var navPic = document.getElementById('navProfilePic');
        if (!navPic) return;

        if (user && user.photoURL) {
            navPic.src = user.photoURL;
        } else {
            navPic.src = '';
            navPic.style.background = 'linear-gradient(135deg,#f09433,#bc1888)';
        }
    }

    function setupAuthListener() {
        if (typeof firebase === 'undefined' || !firebase.auth) return;
        if (window._spaInitialized) return;

        firebase.auth().onAuthStateChanged(function() {
            updateNavProfile();
        });
    }

    function initialize() {
        if (!document.getElementById('sharedBottomNav')) {
            injectBottomNav();
        }
        bindNavClicks();
        updateActiveState();
        updateNavProfile();
        setupAuthListener();
    }

    function safeInitialize() {
        try {
            initialize();
            console.log('✅ SharedNav initialized');
        } catch (e) {
            console.error('❌ SharedNav init error:', e);
        }
    }

    window.addEventListener('spa:ready', safeInitialize);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', safeInitialize);
    } else {
        safeInitialize();
    }

    window.SharedNav = {
        refresh: function() {
            updateActiveState();
            updateNavProfile();
        },
        setActive: function(viewName) {
            document.querySelectorAll('#sharedBottomNav .nav-item').forEach(function(item) {
                item.classList.toggle('active', item.getAttribute('data-view') === viewName);
            });
        }
    };

})();
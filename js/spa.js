// ============================================================
//  🔥 SPA Router + View Manager — index.html ke liye
// ============================================================

const SPA = {
    currentView: 'homeView',
    currentUser: null,
    views: {},
    listeners: {},
    state: {},

    init() {
        // Single global auth listener
        firebase.auth().onAuthStateChanged((user) => this.onAuthChange(user));

        // Browser back/forward
        window.addEventListener('popstate', (e) => this.handlePopState(e));

        // Bottom nav clicks
        this.bindBottomNav();

        // Initial route
        this.parseInitialRoute();
    },

    // ============================================================
    //  AUTH
    // ============================================================
    onAuthChange(user) {
        const wasLoggedIn = !!this.currentUser;
        this.currentUser = user;

        var splash = document.getElementById('splashScreen');
        if (splash) splash.classList.add('hide');

        if (user) {
            var login = document.getElementById('loginScreen');
            if (login) login.classList.remove('show');

            // Nav profile pic update
            var navPic = document.getElementById('navProfilePic');
            if (navPic) {
                if (user.photoURL) {
                    navPic.src = user.photoURL;
                } else {
                    navPic.src = '';
                    navPic.style.background = 'linear-gradient(135deg,#f09433,#bc1888)';
                    navPic.style.borderRadius = '50%';
                }
            }

            // Story initial
            var storyInit = document.getElementById('myStoryInitial');
            if (storyInit) {
                var name = user.displayName || (user.email ? user.email.split('@')[0] : 'U');
                storyInit.textContent = name.charAt(0).toUpperCase();
            }

            // Views ko notify karo
            if (!wasLoggedIn) {
                Object.values(this.views).forEach(v => {
                    if (v.onLogin) {
                        try { v.onLogin(user); } catch (e) { console.error('View onLogin error:', v.name, e); }
                    }
                });
            }

            this.navigate(this.currentView, {}, true);
        } else {
            var login = document.getElementById('loginScreen');
            if (login) login.classList.add('show');
            this.cleanupAllListeners();
        }
    },

    // ============================================================
    //  NAVIGATION
    // ============================================================
    navigate(viewName, params = {}, replaceState = false) {
        if (!viewName) return;

        // Sab views hide karo
        document.querySelectorAll('.spa-view').forEach(v => v.classList.remove('active'));

        // Target view show karo
        var viewEl = document.getElementById(viewName);
        if (!viewEl) {
            console.warn('View not found:', viewName);
            return;
        }
        viewEl.classList.add('active');

        // Bottom nav active state update
        if (window.SharedNav && SharedNav.setActive) {
            SharedNav.setActive(viewName);
        } else {
            document.querySelectorAll('.ig-bottom-nav .nav-item').forEach(n => n.classList.remove('active'));
            var navItem = document.querySelector('.nav-item[data-view="' + viewName + '"]');
            if (navItem) navItem.classList.add('active');
        }

        // URL update (no reload)
        var url = this.buildUrl(viewName, params);
        var state = { view: viewName, params: params };

        if (replaceState) {
            history.replaceState(state, '', url);
        } else {
            history.pushState(state, '', url);
        }

        // Scroll position save/restore
        if (this.currentView && this.currentView !== viewName) {
            var prevEl = document.getElementById(this.currentView);
            if (prevEl) this.state[this.currentView] = prevEl.scrollTop;
        }

        setTimeout(() => {
            viewEl.scrollTop = this.state[viewName] || 0;
        }, 0);

        // Previous view listeners cleanup
        if (this.currentView && this.currentView !== viewName) {
            this.cleanupViewListeners(this.currentView);
        }

        // View ko notify karo
        if (this.views[viewName] && this.views[viewName].onShow) {
            try { this.views[viewName].onShow(params); } catch (e) { console.error('View onShow error:', viewName, e); }
        }

        this.currentView = viewName;
    },

    // ============================================================
    //  URL HELPERS
    // ============================================================
    buildUrl(viewName, params) {
        var path = '/';
        switch (viewName) {
            case 'homeView':    path = '/'; break;
            case 'searchView':  path = '/explore'; break;
            case 'reelsView':   path = '/reels'; break;
            case 'profileView':
                path = params.viewUid ? '/u/' + encodeURIComponent(params.viewUid) : '/profile';
                break;
        }

        var qsArr = Object.keys(params)
            .filter(k => params[k] !== null && params[k] !== undefined && params[k] !== '')
            .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));

        return path + (qsArr.length ? '?' + qsArr.join('&') : '');
    },

    parseInitialRoute() {
        var path = window.location.pathname;
        var params = this.parseQueryString(window.location.search);
        var view = 'homeView';

        // URL query param 'view' check (shared nav redirect se aata hai)
        if (params.view && ['homeView', 'searchView', 'reelsView', 'profileView'].includes(params.view)) {
            view = params.view;
            delete params.view;
            var newUrl = path + (Object.keys(params).length ? '?' + this.buildQueryString(params) : '');
            history.replaceState({ view, params }, '', newUrl);
        } else if (path === '/reels') {
            view = 'reelsView';
        } else if (path === '/explore' || path === '/search') {
            view = 'searchView';
        } else if (path === '/profile') {
            view = 'profileView';
        } else if (path.startsWith('/u/')) {
            view = 'profileView';
            params.viewUid = decodeURIComponent(path.substring(3));
        }

        // ?openMediaPicker=1 handle karo
        if (params.openMediaPicker === '1') {
            delete params.openMediaPicker;
            history.replaceState({ view, params }, '', path);
            // Auth ke baad media picker open karo
            firebase.auth().onAuthStateChanged((user) => {
                if (user && typeof window.openMediaPicker === 'function') {
                    window.openMediaPicker();
                }
            });
        }

        this.currentView = view;
    },

    buildQueryString(params) {
        return Object.keys(params)
            .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
            .join('&');
    },

    parseQueryString(qs) {
        var params = {};
        if (!qs || qs.length < 2) return params;
        qs.substring(1).split('&').forEach(function(pair) {
            var parts = pair.split('=');
            if (parts[0]) params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
        });
        return params;
    },

    handlePopState(e) {
        var state = e.state || {};
        this.navigate(state.view || 'homeView', state.params || {}, true);
    },

    // ============================================================
    //  BOTTOM NAV — index.html ke liye click handlers
    // ============================================================
    bindBottomNav() {
        var self = this;

        // '+' button — single capture listener (no duplicate with bottom-nav.js)
        if (!window.__spaAddCaptureBound) {
            window.__spaAddCaptureBound = true;
            document.addEventListener('click', function(e) {
                var plusBtn = e.target.closest && e.target.closest('.ig-bottom-nav [data-action="add"]');
                if (!plusBtn) return;

                e.preventDefault();
                e.stopPropagation();
                if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();

                if (!self.currentUser) {
                    var login = document.getElementById('loginScreen');
                    if (login) login.classList.add('show');
                    return;
                }
                if (typeof window.openMediaPicker === 'function') {
                    window.openMediaPicker();
                } else {
                    console.warn('openMediaPicker() not found');
                }
            }, true);
        }

        // Regular nav items
        var navItems = document.querySelectorAll('.ig-bottom-nav .nav-item[data-view]');
        navItems.forEach(function(item) {
            if (item.hasAttribute('data-spa-bound')) return;
            item.setAttribute('data-spa-bound', 'true');

            item.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                var view = this.getAttribute('data-view');
                if (!view) return;

                if (view === 'profileView') {
                    if (!self.currentUser) {
                        var login = document.getElementById('loginScreen');
                        if (login) login.classList.add('show');
                        return;
                    }
                    self.navigate('profileView', {});
                } else {
                    self.navigate(view);
                }
            });
        });

        if (navItems.length > 0) {
            console.log('✅ SPA Bottom nav bound: ' + navItems.length + ' items');
        }
    },

    // ============================================================
    //  VIEW REGISTRATION
    // ============================================================
    register(name, viewObj) {
        viewObj.name = name;
        this.views[name] = viewObj;
    },

    // ============================================================
    //  LISTENER MANAGEMENT
    // ============================================================
    addListener(key, ref) {
        if (!this.listeners[key]) this.listeners[key] = [];
        this.listeners[key].push(ref);
    },

    cleanupViewListeners(viewName) {
        if (!this.listeners[viewName]) return;
        this.listeners[viewName].forEach(function(ref) {
            try { if (ref && typeof ref.off === 'function') ref.off(); } catch (e) {}
        });
        this.listeners[viewName] = [];
    },

    cleanupAllListeners() {
        Object.keys(this.listeners).forEach(v => this.cleanupViewListeners(v));
    }
};

window.SPA = SPA;

// ============================================================
//  INIT
// ============================================================
function initSPA() {
    try {
        SPA.init();
        window._spaInitialized = true;
        console.log('✅ SPA initialized');
        window.dispatchEvent(new Event('spa:ready'));
    } catch (e) {
        console.error('❌ SPA init error:', e);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSPA);
} else {
    initSPA();
}
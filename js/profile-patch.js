(function(){
  if (typeof firebase === 'undefined' || !firebase.auth || !firebase.database) return;
  const db = firebase.database();
  let activeUid = null;
  let activeName = 'User';
  let currentFollowTab = 'followers';

  const esc = (s) => {
    const div = document.createElement('div');
    div.textContent = s == null ? '' : String(s);
    return div.innerHTML;
  };
  const escJS = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const toast = (msg) => {
    const fn = window.showToast || window.alert;
    try { fn(String(msg)); } catch (e) { alert(String(msg)); }
  };

  function setProfilePhoto(imgEl, initialEl, photoUrl, name) {
    if (!imgEl || !initialEl) return;
    if (photoUrl) {
      imgEl.src = photoUrl;
      imgEl.style.display = 'block';
      initialEl.style.display = 'none';
    } else {
      imgEl.style.display = 'none';
      initialEl.style.display = 'flex';
      initialEl.textContent = (name || 'U').charAt(0).toUpperCase();
    }
  }

  function showSection(isOwn) {
    document.getElementById('profile-content-wrap') && (document.getElementById('profile-content-wrap').style.display = 'block');
    document.getElementById('search-content-wrap') && (document.getElementById('search-content-wrap').style.display = 'none');
    const dashboard = document.getElementById('pro-dashboard');
    if (dashboard) dashboard.style.display = isOwn ? 'block' : 'none';
    const left = document.getElementById('top-left-icon');
    const right = document.getElementById('top-right-icon');
    if (left) left.style.display = isOwn ? 'block' : 'none';
    if (right) right.style.display = isOwn ? 'block' : 'none';
    const nav = document.getElementById('bottom-nav-bar');
    if (nav) nav.style.display = 'flex';
  }

  function renderTopTitle(title, isOwn) {
    const top = document.getElementById('top-title');
    const titleText = document.getElementById('top-title-text');
    if (top) {
      if (isOwn) {
        top.innerHTML = `<span id="top-title-text">${esc(title)}</span> <i class="fas fa-chevron-down" style="font-size:12px"></i>`;
      } else {
        top.innerHTML = `<i class="fas fa-arrow-left" onclick="history.back()" style="margin-right:12px;cursor:pointer"></i><span id="top-title-text">${esc(title)}</span>`;
      }
    } else if (titleText) {
      titleText.textContent = title;
    }
  }

  function renderPosts(uid) {
    const grid = document.getElementById('profile-photo-grid');
    const countEl = document.getElementById('igRealPosts');
    if (!grid) return;

    db.ref('posts').once('value').then((snap) => {
      let count = 0;
      let html = '';
      if (snap.exists()) {
        snap.forEach((child) => {
          const p = child.val() || {};
          if (p.authorId === uid) {
            count++;
            const url = p.imageUrl || 'https://via.placeholder.com/300?text=Post';
            html += `<img src="${esc(url)}" loading="lazy" onclick="window.open('${escJS(url)}','_blank')" alt="post">`;
          }
        });
      }
      if (countEl) countEl.textContent = String(count);
      grid.innerHTML = count ? html : `<div class="grid-empty"><i class="fas fa-camera" style="font-size:30px;margin-bottom:10px;display:block"></i>No posts yet.</div>`;
    });
  }

  function renderStats(uid) {
    const followersEl = document.getElementById('igRealFollowers');
    const followingEl = document.getElementById('igRealFollowing');
    db.ref(`users/${uid}/followers`).once('value').then((snap) => {
      if (followersEl) followersEl.textContent = String(snap.exists() ? snap.numChildren() : 0);
    });
    db.ref(`users/${uid}/following`).once('value').then((snap) => {
      if (followingEl) followingEl.textContent = String(snap.exists() ? snap.numChildren() : 0);
    });
  }

  function renderButtonsForOwn() {
    const c = document.getElementById('dynamic-action-buttons');
    if (!c) return;
    c.innerHTML = `<button onclick="openSettingsSPA()">Edit profile</button><button onclick="shareProfile()">Share profile</button>`;
  }

  function renderButtonsForOther(uid, name) {
    const c = document.getElementById('dynamic-action-buttons');
    if (!c) return;
    c.innerHTML = `<button type="button" id="followToggleBtn" class="btn-primary">Follow</button><button type="button" onclick="openUserProfile('${escJS(uid)}','${escJS(name)}')" class="btn-gray">Message</button>`;

    const followBtn = document.getElementById('followToggleBtn');
    const myUid = firebase.auth().currentUser && firebase.auth().currentUser.uid;
    if (!followBtn || !myUid) return;

    db.ref(`users/${myUid}/following/${uid}`).once('value').then((snap) => {
      followBtn.textContent = snap.exists() ? 'Following' : 'Follow';
    });

    followBtn.onclick = async () => {
      const me = firebase.auth().currentUser;
      if (!me) return;
      const followingRef = db.ref(`users/${me.uid}/following/${uid}`);
      const followersRef = db.ref(`users/${uid}/followers/${me.uid}`);
      const isFollowing = followBtn.textContent === 'Following';
      if (isFollowing) {
        await followingRef.remove();
        await followersRef.remove();
        followBtn.textContent = 'Follow';
      } else {
        await followingRef.set({ createdAt: firebase.database.ServerValue.TIMESTAMP });
        await followersRef.set({ createdAt: firebase.database.ServerValue.TIMESTAMP });
        followBtn.textContent = 'Following';
      }
    };
  }

  function loadProfile(uid, fallbackName, isOwn) {
    activeUid = uid;
    activeName = fallbackName || 'User';

    showSection(isOwn);
    renderTopTitle(isOwn ? (firebase.auth().currentUser?.email ? firebase.auth().currentUser.email.split('@')[0].toLowerCase() : 'user') : activeName, isOwn);

    db.ref(`users/${uid}`).once('value').then((snap) => {
      const uData = snap.val() || {};
      const prof = uData.profile || {};
      const name = prof.displayName || uData.displayName || fallbackName || 'User';
      const bio = prof.bio || (isOwn ? 'Welcome to ANKITSTUDIOAI ✨' : 'AI creator on ANKITSTUDIOAI');
      const photoUrl = prof.photoURL || uData.photoURL || null;
      const website = prof.website || '';

      const nameEl = document.getElementById('main-profile-name');
      const bioEl = document.getElementById('main-profile-bio');
      const catEl = document.getElementById('main-profile-category');
      const imgEl = document.getElementById('main-profile-pic');
      const initialEl = document.getElementById('main-profile-initial');
      const navPic = document.getElementById('ig-profile-btn');

      if (nameEl) nameEl.textContent = name;
      if (bioEl) bioEl.textContent = bio;
      if (catEl) catEl.innerHTML = website ? `<a href="${esc(website)}" target="_blank" style="color:#0095f6;text-decoration:none">${esc(website)}</a>` : '';
      setProfilePhoto(imgEl, initialEl, photoUrl, name);
      if (navPic && isOwn && photoUrl) navPic.src = photoUrl;

      if (isOwn) {
        renderButtonsForOwn();
      } else {
        renderButtonsForOther(uid, name);
      }

      renderStats(uid);
      renderPosts(uid);
    });
  }

  function showOwnProfile(user) {
    if (!user) return;
    loadProfile(user.uid, user.displayName || (user.email ? user.email.split('@')[0] : 'User'), true);
  }

  function showOtherUserProfile(uid, fallbackName) {
    if (!uid) return;
    loadProfile(uid, fallbackName || 'User', false);
  }

  function openUserProfile(uid, name) {
    if (!uid) return;
    window.location.href = `profile.html?viewUid=${encodeURIComponent(uid)}&viewName=${encodeURIComponent(name || 'User')}`;
  }

  function shareProfile() {
    const uid = activeUid || (firebase.auth().currentUser && firebase.auth().currentUser.uid) || '';
    const url = `${window.location.origin + window.location.pathname}?viewUid=${encodeURIComponent(uid)}&viewName=${encodeURIComponent(activeName || 'User')}`;
    if (navigator.share) navigator.share({ title: 'Check my profile', url }).catch(() => {});
    else navigator.clipboard.writeText(url).then(() => toast('Profile link copied!')).catch(() => toast(url));
  }

  function openFollowModal(type) {
    currentFollowTab = type === 'following' ? 'following' : 'followers';
    const modal = document.getElementById('followListModal');
    const title = document.getElementById('followModalTitle');
    const body = document.getElementById('followModalBody');
    const tabFollowers = document.getElementById('ftab-followers');
    const tabFollowing = document.getElementById('ftab-following');
    if (!modal || !body || !activeUid) return;
    if (title) title.textContent = currentFollowTab === 'followers' ? 'Followers' : 'Following';
    if (tabFollowers) tabFollowers.className = 'follow-tab ' + (currentFollowTab === 'followers' ? 'active' : 'inactive');
    if (tabFollowing) tabFollowing.className = 'follow-tab ' + (currentFollowTab === 'following' ? 'active' : 'inactive');
    modal.classList.add('open');

    body.innerHTML = '<div class="follow-empty"><i class="fas fa-circle-notch fa-spin" style="color:#0095f6"></i><br><br>Loading...</div>';
    db.ref(`users/${activeUid}/${currentFollowTab}`).once('value').then(async (snap) => {
      const data = snap.val() || {};
      const ids = Object.keys(data);
      if (!ids.length) {
        body.innerHTML = `<div class="follow-empty"><i class="far fa-user"></i>${currentFollowTab === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}</div>`;
        return;
      }
      let html = '';
      for (const uid of ids) {
        let name = 'User';
        let photo = null;
        const usnap = await db.ref(`users/${uid}`).once('value');
        const ud = usnap.val() || {};
        const p = ud.profile || {};
        name = p.displayName || ud.displayName || ud.name || (ud.email ? ud.email.split('@')[0] : 'User');
        photo = p.photoURL || ud.photoURL || null;
        const avatar = photo ? `<img src="${esc(photo)}" alt="">` : esc(name.charAt(0).toUpperCase());
        html += `<div class="follow-user-row" onclick="openUserProfile('${escJS(uid)}','${escJS(name)}')" style="cursor:pointer">
          <div class="follow-user-avatar">${avatar}</div>
          <div class="follow-user-info">
            <div class="rname">${esc(name)}</div>
            <div style="font-size:12px;color:#8e8e8e">ID: ${esc(uid)}</div>
          </div>
        </div>`;
      }
      body.innerHTML = html;
    });
  }

  function closeFollowModal() {
    const modal = document.getElementById('followListModal');
    if (modal) modal.classList.remove('open');
  }

  function switchFollowTab(type) {
    openFollowModal(type);
  }

  function closeSearch() {
    const searchWrap = document.getElementById('search-content-wrap');
    const profileWrap = document.getElementById('profile-content-wrap');
    if (searchWrap) searchWrap.style.display = 'none';
    if (profileWrap) profileWrap.style.display = 'block';
  }

  function setupSearch() {
    const input = document.getElementById('ig-search-input');
    const results = document.getElementById('ig-search-results-list');
    const grid = document.getElementById('exploreGrid');
    if (!input || !results || !grid) return;

    input.addEventListener('input', async (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        grid.style.display = 'grid';
        results.style.display = 'none';
        return;
      }
      grid.style.display = 'none';
      results.style.display = 'block';
      let html = '';
      let found = false;
      const snap = await db.ref('users').once('value');
      snap.forEach((child) => {
        const uid = child.key;
        if (uid === (firebase.auth().currentUser && firebase.auth().currentUser.uid)) return;
        const ud = child.val() || {};
        const p = ud.profile || {};
        const name = p.displayName || ud.displayName || ud.name || (ud.email ? ud.email.split('@')[0] : 'User');
        const hay = `${name} ${(ud.email || '')}`.toLowerCase();
        if (!hay.includes(q)) return;
        found = true;
        const photo = p.photoURL || ud.photoURL || null;
        const avatar = photo ? `<img src="${esc(photo)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : esc(name.charAt(0).toUpperCase());
        html += `<div onclick="openUserProfile('${escJS(uid)}','${escJS(name)}')" style="display:flex;align-items:center;padding:10px 0;gap:14px;cursor:pointer">
          <div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,#f09433,#bc1888);color:#fff;font-size:18px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">${avatar}</div>
          <div style="flex:1;border-bottom:1px solid #efefef;padding-bottom:10px">
            <div style="font-size:14px;font-weight:600;color:#000">${esc(name)}</div>
            <div style="font-size:12px;color:#8e8e8e">ID: ${esc(uid)}</div>
          </div>
        </div>`;
      });
      results.innerHTML = found ? html : '<div style="text-align:center;color:#8e8e8e;padding:40px;font-size:14px">No user found</div>';
    });
  }

  window.showOwnProfile = showOwnProfile;
  window.showOtherUserProfile = showOtherUserProfile;
  window.openUserProfile = openUserProfile;
  window.shareProfile = shareProfile;
  window.openFollowModal = openFollowModal;
  window.switchFollowTab = switchFollowTab;
  window.closeFollowModal = closeFollowModal;
  window.closeSearch = closeSearch;

  firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const viewUid = params.get('viewUid');
    const viewName = params.get('viewName');

    if (viewUid && viewUid !== user.uid) {
      showOtherUserProfile(viewUid, viewName || 'User');
    } else {
      showOwnProfile(user);
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    setupSearch();

    const searchBtn = document.getElementById('ig-search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const searchWrap = document.getElementById('search-content-wrap');
        const profileWrap = document.getElementById('profile-content-wrap');
        if (searchWrap) searchWrap.style.display = 'block';
        if (profileWrap) profileWrap.style.display = 'none';
        const t = document.getElementById('top-title');
        if (t) t.innerHTML = `<i class="fas fa-arrow-left" onclick="closeSearch()" style="margin-right:12px;cursor:pointer"></i><span>Explore</span>`;
      });
    }

    const title = document.getElementById('top-title');
    if (title) {
      title.addEventListener('click', () => {
        if (activeUid) return;
      });
    }
  });
})();

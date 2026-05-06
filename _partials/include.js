// Tiny client-side include loader. Looks for <div data-include="navbar"></div>
// and replaces with the contents of /_partials/navbar.html (etc).
// Also stamps an "active" class on the nav-link matching the current path,
// and fills #last-updated from the GitHub API (cached 1h in localStorage).
(function () {
    const placeholders = document.querySelectorAll('[data-include]');
    const tasks = Array.from(placeholders).map(el => {
        const name = el.dataset.include;
        return fetch(`/_partials/${name}.html`)
            .then(r => r.text())
            .then(html => {
                const tmp = document.createElement('div');
                tmp.innerHTML = html.trim();
                el.replaceWith(...tmp.childNodes);
                return name;
            })
            .catch(err => console.error(`Failed to include ${name}:`, err));
    });

    Promise.all(tasks).then(names => {
        if (names.includes('navbar')) {
            markActiveNav();
            wireThemeToggle();
        }
        if (names.includes('footer')) fillLastUpdated();
    });

    function wireThemeToggle() {
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;
        btn.addEventListener('click', () => {
            const root = document.documentElement;
            const explicit = root.dataset.theme;
            // What's currently being shown? (explicit overrides OS preference)
            const isDark = explicit === 'dark'
                || (!explicit && window.matchMedia('(prefers-color-scheme: dark)').matches);
            const next = isDark ? 'light' : 'dark';
            root.dataset.theme = next;
            try { localStorage.setItem('theme', next); } catch (_) {}
        });
    }

    function markActiveNav() {
        const path = window.location.pathname;
        let section = null;
        if (path.startsWith('/research/'))  section = 'research';
        else if (path.startsWith('/teaching/')) section = 'teaching';
        else if (path.startsWith('/tools/'))    section = 'tools';
        if (!section) return;
        const link = document.querySelector(`.nav-link[data-section="${section}"]`);
        if (link) link.classList.add('active');
    }

    function fillLastUpdated() {
        const el = document.getElementById('last-updated');
        if (!el) return;
        const CACHE_KEY = 'last_commit_date_v1';
        const TTL = 3600000; // 1 hour
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (raw) {
                const { ts, date } = JSON.parse(raw);
                if (Date.now() - ts < TTL) {
                    el.textContent = `Last updated ${date}`;
                    return;
                }
            }
        } catch (_) {}
        fetch('https://api.github.com/repos/gblane/gblane.github.io/commits?per_page=1')
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(commits => {
                if (!commits || !commits[0]) return;
                const date = new Date(commits[0].commit.committer.date)
                    .toISOString().split('T')[0];
                el.textContent = `Last updated ${date}`;
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), date }));
                } catch (_) {}
            })
            .catch(() => { /* silent — footer just omits the line */ });
    }
})();

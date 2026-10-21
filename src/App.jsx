import { useCallback, useEffect, useMemo, useState } from "react";
const API = "https://api.chess.com/pub";
const CLUB = "arches-net";
function Icon({ name, size = 18 }) {
    const paths = {
        home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-7h6v7"/></>,
        chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></>,
        calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></>,
        users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
        points: <><path d="M12 2 15 8l6.5 1-4.75 4.6 1.1 6.4L12 17l-5.85 3 1.1-6.4L2.5 9 9 8l3-6Z"/></>,
        shop: <><path d="M3 9h18l-1 12H4L3 9Z"/><path d="m3 9 2-5h14l2 5M9 13v4M15 13v4"/></>,
        settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2.83 2.83-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21h-4v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06-2.83-2.83.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3v-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06L7.04 4.3l.06.06A1.65 1.65 0 0 0 8.92 4a1.65 1.65 0 0 0 1-1.51V2h4v.49A1.65 1.65 0 0 0 15 4a1.65 1.65 0 0 0 1.82.33l.06-.06 2.83 2.83-.06.06A1.65 1.65 0 0 0 19.4 9c.12.61.66 1.05 1.28 1.05H21v4h-.32c-.62 0-1.16.44-1.28 1Z"/></>,
        shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
        refresh: <><path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5"/></>,
        arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
        clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
        search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
        menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
        close: <><path d="m6 6 12 12M18 6 6 18"/></>,
        external: <><path d="M14 3h7v7M10 14 21 3M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6"/></>,
        check: <path d="m5 12 4 4L19 6"/>,
        music: <><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></>,
    };
    return (<svg aria-hidden="true" className="icon" fill="none" height={size} viewBox="0 0 24 24" width={size}>
      {paths[name]}
    </svg>);
}
const navItems = [
    { id: "overview", label: "Overview", icon: "home" },
    { id: "leaderboards", label: "Leaderboards", icon: "chart" },
    { id: "calendar", label: "Club calendar", icon: "calendar" },
    { id: "members", label: "Members", icon: "users" },
    { id: "points", label: "Arches Points", icon: "points" },
    { id: "shop", label: "Arches Shop", icon: "shop" },
    { id: "archsound", label: "ArchSound", icon: "music" },
    { id: "settings", label: "Settings", icon: "settings" },
    { id: "admin", label: "Super Admin", icon: "shield" },
];
function formatDate(timestamp) {
    if (!timestamp)
        return "Date TBA";
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(timestamp * 1000);
}
function timeAgo(timestamp) {
    if (!timestamp)
        return "syncing…";
    const minutes = Math.max(1, Math.floor((Date.now() / 1000 - timestamp) / 60));
    if (minutes < 60)
        return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}
function isOnlineNow(timestamp) {
    return !!timestamp && Date.now() / 1000 - timestamp < 300;
}
async function fetchGameSummary(username, joinedClub) {
    const archivesResponse = await fetch(`${API}/player/${encodeURIComponent(username)}/games/archives`);
    if (!archivesResponse.ok)
        throw new Error("Game archives unavailable");
    const { archives = [] } = await archivesResponse.json();
    const joined = joinedClub || 0;
    const relevantArchives = archives.filter((url) => {
        const match = url.match(/\/(\d{4})\/(\d{2})$/);
        if (!match || !joined)
            return true;
        const monthEnd = new Date(Number(match[1]), Number(match[2]), 0, 23, 59, 59).getTime() / 1000;
        return monthEnd >= joined;
    });
    const queue = [...relevantArchives];
    const games = [];
    async function worker() {
        while (queue.length) {
            const url = queue.shift();
            if (!url)
                return;
            try {
                const response = await fetch(url);
                if (response.ok)
                    games.push(...((await response.json()).games || []));
            }
            catch {
                // Continue through the remaining monthly archives.
            }
        }
    }
    await Promise.all(Array.from({ length: 4 }, worker));
    const cutoff = Date.now() / 1000 - 30 * 86400;
    const normalized = username.toLowerCase();
    const clubGames = games.filter((game) => (game.end_time || 0) >= joined);
    const recentGames = clubGames.filter((game) => (game.end_time || 0) >= cutoff);
    const won30 = recentGames.filter((game) => {
        const side = game.white?.username?.toLowerCase() === normalized ? game.white : game.black;
        return side?.result === "win";
    }).length;
    return { played30: recentGames.length, won30, totalSinceJoining: clubGames.length };
}
function Avatar({ username, rank, avatar }) {
    return (<div className="avatar-wrap">
      {rank && <span className={`rank-badge rank-${rank}`}>{rank}</span>}
      <span className="avatar"><img src={avatar || "https://www.chess.com/bundles/web/images/noavatar_l.84a92436.gif"} alt={`${username}'s Chess.com profile`}/></span>
    </div>);
}
function readStoredProfile() {
    try {
        return JSON.parse(localStorage.getItem("arches-user") || "null");
    }
    catch {
        return null;
    }
}
function PageHeader({ eyebrow, title, description, action, }) {
    return (<header className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>);
}
function SignIn({ onSignIn }) {
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const [checking, setChecking] = useState(false);
    const submit = async (event) => {
        event.preventDefault();
        const cleanUsername = username.trim();
        if (!cleanUsername)
            return;
        setChecking(true);
        setError("");
        try {
            const [profileResponse, membersResponse] = await Promise.all([
                fetch(`${API}/player/${encodeURIComponent(cleanUsername)}`),
                fetch(`${API}/club/${CLUB}/members`),
            ]);
            if (!profileResponse.ok || !membersResponse.ok)
                throw new Error("Player not found");
            const profile = await profileResponse.json();
            const memberData = await membersResponse.json();
            const clubMembers = ["weekly", "monthly", "all_time"].flatMap((group) => memberData[group] || []);
            if (!clubMembers.some((member) => member.username.toLowerCase() === profile.username.toLowerCase())) {
                setError("That Chess.com account is not currently a member of The Arches Server.");
                return;
            }
            onSignIn(profile);
        }
        catch {
            setError("We couldn't find that Chess.com username. Check the spelling and try again.");
        }
        finally {
            setChecking(false);
        }
    };
    return (<main className="signin-shell">
      <div className="signin-grid"/>
      <section className="signin-card">
        <img src="./arches-logo.png" alt="The Arches Server"/>
        <span className="eyebrow">MEMBER ACCESS</span>
        <h1>Your club. Your game.</h1>
        <p>Enter your Chess.com username to verify your membership and personalize ratings, activity, games, and rewards.</p>
        <form onSubmit={submit}>
          <label className="form-label">
            CHESS.COM USERNAME
            <span className="signin-input"><span>chess.com/member/</span><input autoFocus autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="your_username"/></span>
          </label>
          {error && <span className="form-error">{error}</span>}
          <button className="button primary" disabled={checking || !username.trim()} type="submit">
            {checking ? <><span className="spinner"/>Finding your profile…</> : <>Continue to Arches <Icon name="arrow"/></>}
          </button>
        </form>
        <div className="signin-trust"><Icon name="shield"/><span><strong>Public data only</strong>No Chess.com password is requested. Your username is verified through the public API and saved only in this browser.</span></div>
      </section>
      <p className="signin-footer">UNITED BY CHESS <i /> DRIVEN BY STRATEGY</p>
    </main>);
}
function App() {
    const initialPage = (window.location.hash.replace("#/", "") || "overview");
    const [page, setPage] = useState(navItems.some((item) => item.id === initialPage) ? initialPage : "overview");
    const [mobileOpen, setMobileOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(readStoredProfile);
    const [userStats, setUserStats] = useState(null);
    const [gameSummary, setGameSummary] = useState({ played30: 0, won30: 0, totalSinceJoining: 0 });
    const [theme, setTheme] = useState(() => (localStorage.getItem("arches-theme") === "chess" ? "chess" : "arches"));
    const [memberCount, setMemberCount] = useState(0);
    const [members, setMembers] = useState([]);
    const [activeMembers, setActiveMembers] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ratingLoading, setRatingLoading] = useState(false);
    const [ratingsAttempted, setRatingsAttempted] = useState(false);
    const [lastSync, setLastSync] = useState(null);
    const [apiOnline, setApiOnline] = useState(true);
    const [points, setPoints] = useState(0);
    const loadMemberActivity = useCallback(async (roster) => {
        const queue = [...roster];
        const profiles = [];
        async function worker() {
            while (queue.length) {
                const member = queue.shift();
                if (!member)
                    return;
                try {
                    const response = await fetch(`${API}/player/${encodeURIComponent(member.username)}`);
                    if (!response.ok)
                        continue;
                    const profile = await response.json();
                    profiles.push({
                        username: profile.username,
                        joined: member.joined,
                        last_online: profile.last_online,
                        avatar: profile.avatar,
                        role: member.role,
                    });
                }
                catch {
                    // Keep syncing other profiles if one record is unavailable.
                }
            }
        }
        await Promise.all(Array.from({ length: 6 }, worker));
        const profileMap = new Map(profiles.map((profile) => [profile.username.toLowerCase(), profile]));
        setActiveMembers(roster
            .map((member) => ({ ...member, ...(profileMap.get(member.username.toLowerCase()) || {}) }))
            .sort((a, b) => (b.last_online || 0) - (a.last_online || 0)));
    }, []);
    const syncClub = useCallback(async () => {
        setLoading(true);
        try {
            const [clubResponse, membersResponse, matchesResponse] = await Promise.all([
                fetch(`${API}/club/${CLUB}`),
                fetch(`${API}/club/${CLUB}/members`),
                fetch(`${API}/club/${CLUB}/matches`),
            ]);
            if (!clubResponse.ok || !membersResponse.ok)
                throw new Error("Club data unavailable");
            const club = await clubResponse.json();
            const memberData = await membersResponse.json();
            const matchData = matchesResponse.ok ? await matchesResponse.json() : {};
            const memberMap = new Map();
            ["weekly", "monthly", "all_time"].forEach((group) => {
                (memberData[group] || []).forEach((member) => memberMap.set(member.username.toLowerCase(), member));
            });
            const admins = new Set((club.admin || []).map((url) => url.split("/").filter(Boolean).pop()?.toLowerCase()));
            const liveMembers = Array.from(memberMap.values()).map((member) => ({
                ...member,
                role: admins.has(member.username.toLowerCase()) ? "Club Admin" : undefined,
            }));
            if (liveMembers.length) {
                setMembers(liveMembers);
                void loadMemberActivity(liveMembers);
            }
            setMemberCount(Number(club.members_count) || liveMembers.length);
            const allMatches = [
                ...(matchData.registered || []),
                ...(matchData.in_progress || []),
                ...(matchData.finished || []),
            ];
            setMatches(allMatches);
            setApiOnline(true);
            setLastSync(new Date());
        }
        catch (error) {
            console.warn("Using cached club preview:", error);
            setApiOnline(false);
        }
        finally {
            setLoading(false);
        }
    }, [loadMemberActivity]);
    useEffect(() => {
        syncClub();
        const interval = window.setInterval(syncClub, 5 * 60 * 1000);
        return () => window.clearInterval(interval);
    }, [syncClub]);
    useEffect(() => {
        const onHashChange = () => {
            const next = window.location.hash.replace("#/", "");
            if (navItems.some((item) => item.id === next))
                setPage(next);
        };
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);
    useEffect(() => {
        document.body.dataset.theme = theme;
        localStorage.setItem("arches-theme", theme);
    }, [theme]);
    useEffect(() => {
        if (!currentUser)
            return;
        const username = currentUser.username.toLowerCase();
        fetch(`${API}/player/${encodeURIComponent(username)}/stats`)
            .then((response) => response.ok ? response.json() : null)
            .then((data) => data && setUserStats(data))
            .catch(() => setUserStats(null));
    }, [currentUser]);
    useEffect(() => {
        if (!currentUser || !members.length)
            return;
        const member = members.find((item) => item.username.toLowerCase() === currentUser.username.toLowerCase());
        if (!member)
            return;
        let cancelled = false;
        fetchGameSummary(currentUser.username, member.joined)
            .then((summary) => {
            if (cancelled)
                return;
            const spent = Number(localStorage.getItem(`arches-spent-${currentUser.username.toLowerCase()}`)) || 0;
            setGameSummary(summary);
            setPoints(Math.max(0, summary.totalSinceJoining - spent));
        })
            .catch(() => !cancelled && setGameSummary({ played30: 0, won30: 0, totalSinceJoining: 0 }));
        return () => { cancelled = true; };
    }, [currentUser, members]);
    useEffect(() => {
        if (!currentUser || !members.length)
            return;
        const isMember = members.some((member) => member.username.toLowerCase() === currentUser.username.toLowerCase());
        if (!isMember) {
            localStorage.removeItem("arches-user");
            setCurrentUser(null);
        }
    }, [currentUser, members]);
    const navigate = (next) => {
        setPage(next);
        setMobileOpen(false);
        window.location.hash = `/${next}`;
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const loadRatings = useCallback(async () => {
        setRatingLoading(true);
        setRatingsAttempted(true);
        const queue = [...members];
        const results = [];
        async function worker() {
            while (queue.length) {
                const member = queue.shift();
                if (!member)
                    return;
                try {
                    const [statsResponse, profileResponse] = await Promise.all([
                        fetch(`${API}/player/${encodeURIComponent(member.username)}/stats`),
                        fetch(`${API}/player/${encodeURIComponent(member.username)}`),
                    ]);
                    const stats = statsResponse.ok ? await statsResponse.json() : {};
                    const profile = profileResponse.ok ? await profileResponse.json() : null;
                    results.push({
                        ...member,
                        avatar: profile?.avatar,
                        last_online: profile?.last_online,
                        rapid: stats.chess_rapid?.last?.rating || 0,
                        blitz: stats.chess_blitz?.last?.rating || 0,
                        bullet: stats.chess_bullet?.last?.rating || 0,
                        daily: stats.chess_daily?.last?.rating || 0,
                    });
                }
                catch {
                    results.push({
                        ...member,
                        rapid: 0,
                        blitz: 0,
                        bullet: 0,
                        daily: 0,
                    });
                }
            }
        }
        await Promise.all(Array.from({ length: 5 }, worker));
        setRatings(results);
        setRatingLoading(false);
    }, [members]);
    useEffect(() => {
        if (currentUser && members.length && !ratingsAttempted)
            loadRatings();
    }, [currentUser, members, ratingsAttempted, loadRatings]);
    const spendPoints = (amount) => {
        if (points < amount)
            return false;
        const next = points - amount;
        setPoints(next);
        if (currentUser) {
            const key = `arches-spent-${currentUser.username.toLowerCase()}`;
            localStorage.setItem(key, String((Number(localStorage.getItem(key)) || 0) + amount));
        }
        return true;
    };
    const signIn = (profile) => {
        localStorage.setItem("arches-user", JSON.stringify(profile));
        setCurrentUser(profile);
    };
    const signOut = () => {
        localStorage.removeItem("arches-user");
        setCurrentUser(null);
        setUserStats(null);
        setGameSummary({ played30: 0, won30: 0, totalSinceJoining: 0 });
        setPoints(0);
    };
    if (!currentUser)
        return <SignIn onSignIn={signIn}/>;
    const content = {
        overview: <Overview memberCount={memberCount} members={activeMembers.length ? activeMembers : members} loading={loading} matches={matches} navigate={navigate} apiOnline={apiOnline} currentUser={currentUser} userStats={userStats} gameSummary={gameSummary} points={points}/>,
        leaderboards: <Leaderboards ratings={ratings} loading={ratingLoading} onRefresh={loadRatings}/>,
        calendar: <CalendarPage matches={matches}/>,
        members: <MembersPage members={activeMembers.length ? activeMembers : members} loading={loading} onRefresh={syncClub}/>,
        points: <PointsPage points={points}/>,
        shop: <ShopPage points={points} onBuy={spendPoints}/>,
        archsound: <ArchSound />,
        settings: <SettingsPage currentUser={currentUser} theme={theme} setTheme={setTheme} onSignOut={signOut}/>,
        admin: <AdminPage members={members}/>,
    }[page];
    return (<div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="brand">
          <img className="brand-logo" src="./arches-logo.png" alt="The Arches Server"/>
        </div>
        <nav aria-label="Primary navigation">
          <span className="nav-label">CLUBHOUSE</span>
          {navItems.slice(0, 4).map((item) => (<button className={page === item.id ? "active" : ""} key={item.id} onClick={() => navigate(item.id)}>
              <Icon name={item.icon}/>{item.label}
            </button>))}
          <span className="nav-label nav-group">REWARDS</span>
          {navItems.slice(4, 6).map((item) => (<button className={page === item.id ? "active" : ""} key={item.id} onClick={() => navigate(item.id)}>
              <Icon name={item.icon}/>{item.label}
              {item.id === "points" && <span className="nav-count">{points}</span>}
            </button>))}
          <span className="nav-label nav-group">ACCOUNT</span>
          {navItems.slice(6).map((item) => (<button className={page === item.id ? "active" : ""} key={item.id} onClick={() => navigate(item.id)}>
              <Icon name={item.icon}/>{item.label}
            </button>))}
        </nav>
        <div className="sidebar-profile">
          <Avatar username={currentUser.username} avatar={currentUser.avatar}/>
          <div><strong>{currentUser.username}</strong><span>{gameSummary.won30} wins / {gameSummary.played30} games</span></div>
        </div>
        <button className="sidebar-signout" onClick={signOut}>Sign out</button>
        <div className="sidebar-card">
          <div className="status-line"><i className={apiOnline ? "online" : "offline"}/> {apiOnline ? "CHESS.COM API LIVE" : "CACHED PREVIEW"}</div>
          <p>{lastSync ? `Synced ${lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Connecting to club…"}</p>
        </div>
      </aside>
      {mobileOpen && <button className="scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)}/>}
      <main className="main">
        <div className="mobile-bar">
          <button className="icon-button" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Icon name="menu"/></button>
          <strong>THE ARCHES SERVER</strong>
          <span className={`api-dot ${apiOnline ? "" : "off"}`}/>
        </div>
        <div className="content">{content}</div>
      </main>
    </div>);
}
function Overview({ memberCount, members, loading, matches, navigate, apiOnline, currentUser, userStats, gameSummary, points }) {
    const capacity = 100;
    const percentage = Math.min(100, Math.round((memberCount / capacity) * 100));
    const nextMatch = [...matches]
        .filter((match) => match.start_time && match.start_time * 1000 > Date.now())
        .sort((a, b) => (a.start_time || 0) - (b.start_time || 0))[0];
    return (<>
      <section className="hero">
        <div className="hero-grid"/>
        <div className="hero-copy">
          <span className="hero-kicker"><i /> WELCOME BACK, {currentUser.username.toUpperCase()}</span>
          <h1>Make today’s move<br /><em>count.</em></h1>
          <p>The Arches Server is live. Follow the team, review your recent form, and prepare for the next challenge.</p>
          <div className="hero-actions">
            <a className="button primary chess-link" href="https://www.chess.com/club/arches-net" target="_blank" rel="noreferrer">Visit Chess.com club <Icon name="external" size={16}/></a>
            <button className="button secondary" onClick={() => navigate("calendar")}>View club calendar</button>
          </div>
        </div>
      </section>

      <div className="personal-strip">
        <div className="personal-identity"><Avatar username={currentUser.username} avatar={currentUser.avatar}/><span><small>SIGNED IN AS</small><strong>{currentUser.name || currentUser.username}</strong></span></div>
        <div><small>LAST 30 DAYS</small><strong className="gold">{gameSummary.won30} <span>wins / {gameSummary.played30} played</span></strong></div>
        <div><small>ARCHES POINTS</small><strong>{points} <span>AP</span></strong></div>
        <div><small>RAPID RATING</small><strong>{userStats?.chess_rapid?.last?.rating || "—"}</strong></div>
        <a href={`https://www.chess.com/member/${currentUser.username}`} target="_blank" rel="noreferrer">View profile <Icon name="external" size={14}/></a>
      </div>

      <div className="stat-grid">
        <article className="stat-card feature-stat">
          <div className="stat-top"><span>CLUB MEMBERS</span><span className={`live-pill ${apiOnline ? "" : "cached"}`}>{apiOnline ? "LIVE" : "CACHED"}</span></div>
          <div className="big-number">{loading ? "—" : memberCount}<small>/ {capacity}</small></div>
          <div className="progress"><span style={{ width: `${percentage}%` }}/></div>
          <div className="stat-foot"><span>{percentage}% capacity</span><strong>{Math.max(0, capacity - memberCount)} spots remain</strong></div>
        </article>
        <article className="stat-card">
          <span className="stat-icon"><Icon name="calendar"/></span>
          <span className="stat-label">NEXT EVENT</span>
          <strong className="stat-title">{nextMatch?.name || "No Event Planned"}</strong>
          <p>{nextMatch?.start_time ? formatDate(nextMatch.start_time) : "Check back for the next club event"}</p>
        </article>
        <article className="stat-card">
          <span className="stat-icon"><Icon name="points"/></span>
          <span className="stat-label">GAMES SINCE JOINING</span>
          <strong className="stat-title">{gameSummary.totalSinceJoining}</strong>
          <p>Verified public games played</p>
        </article>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div><span className="eyebrow">CLUB PULSE</span><h2>Recently active</h2></div>
            <button className="text-button" onClick={() => navigate("members")}>All members <Icon name="arrow" size={16}/></button>
          </div>
          <div className="member-stack">
            {members.slice(0, 5).map((member) => (<div className="member-row" key={member.username}>
                <Avatar username={member.username} avatar={member.avatar}/>
                <div><strong>{member.username}</strong><span>Club member</span></div>
                <div className="activity"><i className={isOnlineNow(member.last_online) ? "online" : "offline"}/> {isOnlineNow(member.last_online) ? "Online now" : timeAgo(member.last_online)}</div>
              </div>))}
          </div>
        </section>
        <section className="panel mission-panel">
          <span className="eyebrow">THE MISSION</span>
          <div className="quote-mark">“</div>
          <blockquote>Build your skills.<br />Master your strategy.<br /><em>Make every move count.</em></blockquote>
          <div className="rule"/>
          <p>ONE CLUB. ONE LEGACY.</p>
        </section>
      </div>
    </>);
}
function Leaderboards({ ratings, loading, onRefresh }) {
    const [mode, setMode] = useState("rapid");
    const sorted = useMemo(() => [...ratings].sort((a, b) => b[mode] - a[mode]), [ratings, mode]);
    const rated = sorted.filter((member) => member[mode] > 0);
    return (<>
      <PageHeader eyebrow="THE RANKINGS" title="Club leaderboards" description="Live ratings pulled from public Chess.com player records." action={<button className="button secondary" onClick={onRefresh} disabled={loading}><Icon name="refresh"/>{loading ? "Syncing ratings…" : "Refresh ratings"}</button>}/>
      <div className="segmented" role="tablist" aria-label="Rating type">
        {["rapid", "blitz", "bullet", "daily"].map((item) => <button className={mode === item ? "active" : ""} key={item} onClick={() => setMode(item)}>{item}</button>)}
      </div>
      <div className="podium">
        {[1, 0, 2].map((position, displayIndex) => {
            const member = rated[position];
            if (!member)
                return null;
            const rank = position + 1;
            return <div className={`podium-card place-${rank}`} key={member.username}>
            <span className="podium-label">{displayIndex === 1 ? "CLUB LEADER" : `RANK ${rank}`}</span>
            <Avatar username={member.username} avatar={member.avatar} rank={rank}/>
            <strong>{member.username}</strong>
            <span className="rating">{member[mode].toLocaleString()}</span>
            <span className="rating-mode">{mode} rating</span>
          </div>;
        })}
      </div>
      <section className="panel table-panel">
        <div className="panel-heading"><div><span className="eyebrow">FULL STANDINGS</span><h2>{mode[0].toUpperCase() + mode.slice(1)} ratings</h2></div><span className="muted">{sorted.length} club members synced</span></div>
        <div className="data-table">
          <div className="table-row table-head"><span>RANK</span><span>PLAYER</span><span>RATING</span><span>STATUS</span></div>
          {sorted.map((member, index) => (<div className="table-row" key={member.username}>
              <span className="table-rank">{member[mode] ? String(index + 1).padStart(2, "0") : "—"}</span>
              <span className="player-cell"><Avatar username={member.username} avatar={member.avatar}/><strong>{member.username}</strong></span>
              <strong className="cyan">{member[mode] ? member[mode].toLocaleString() : "—"}</strong>
              <span><i className={isOnlineNow(member.last_online) ? "online" : "offline"}/> {isOnlineNow(member.last_online) ? "Online" : "Offline"}</span>
            </div>))}
          {!loading && !sorted.length && <div className="leaderboard-empty"><span>—</span><strong>Ratings could not be synced</strong><button className="text-button" onClick={onRefresh}>Try again</button></div>}
        </div>
        {loading && <div className="loading-overlay"><span className="spinner"/> Loading live ratings…</div>}
      </section>
      <p className="data-note">Every club member is listed. A dash means the player is unrated or the public record was unavailable for that division.</p>
    </>);
}
function CalendarPage({ matches }) {
    const [monthOffset, setMonthOffset] = useState(0);
    const [eventView, setEventView] = useState("upcoming");
    const [selectedDay, setSelectedDay] = useState(null);
    const focus = new Date();
    focus.setMonth(focus.getMonth() + monthOffset);
    const monthName = focus.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const firstDay = new Date(focus.getFullYear(), focus.getMonth(), 1).getDay();
    const days = new Date(focus.getFullYear(), focus.getMonth() + 1, 0).getDate();
    const monthMatches = matches.filter((match) => {
        if (!match.start_time)
            return false;
        const date = new Date(match.start_time * 1000);
        return date.getMonth() === focus.getMonth() && date.getFullYear() === focus.getFullYear();
    });
    const now = Date.now() / 1000;
    const visibleMatches = (selectedDay
        ? monthMatches.filter((match) => new Date((match.start_time || 0) * 1000).getDate() === selectedDay)
        : [...matches]
            .filter((match) => eventView === "upcoming"
            ? (match.end_time || match.start_time || Infinity) >= now
            : (match.end_time || match.start_time || Infinity) < now))
        .sort((a, b) => eventView === "upcoming"
        ? (a.start_time || Infinity) - (b.start_time || Infinity)
        : (b.start_time || 0) - (a.start_time || 0));
    return (<>
      <PageHeader eyebrow="CLUB SCHEDULE" title="Calendar" description="Upcoming and recent club matches from Chess.com." action={<a className="button secondary" href="https://www.chess.com/clubs/events/arches-net" target="_blank" rel="noreferrer">Chess.com events <Icon name="external"/></a>}/>
      <div className="calendar-layout">
        <section className="panel calendar-panel">
          <div className="calendar-toolbar">
            <button className="icon-button" onClick={() => { setMonthOffset(monthOffset - 1); setSelectedDay(null); }} aria-label="Previous month">‹</button>
            <h2>{monthName}</h2>
            <button className="icon-button" onClick={() => { setMonthOffset(monthOffset + 1); setSelectedDay(null); }} aria-label="Next month">›</button>
          </div>
          <div className="calendar-grid calendar-labels">{["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid">
            {Array.from({ length: firstDay }, (_, i) => <span className="calendar-day empty" key={`empty-${i}`}/>)}
            {Array.from({ length: days }, (_, i) => {
            const day = i + 1;
            const dayEvents = monthMatches.filter((match) => new Date((match.start_time || 0) * 1000).getDate() === day);
            const today = focus.getMonth() === new Date().getMonth() && day === new Date().getDate();
            return <button className={`calendar-day ${today ? "today" : ""} ${dayEvents.length ? "has-event" : ""} ${selectedDay === day ? "selected" : ""}`} onClick={() => setSelectedDay(day)} key={day}>
                <b>{day}</b>{dayEvents.length > 0 && <i title={`${dayEvents.length} club event${dayEvents.length === 1 ? "" : "s"}`}/>}
              </button>;
        })}
          </div>
        </section>
        <aside className="panel agenda">
          <span className="eyebrow">LIVE MATCH FEED</span><h2>{selectedDay ? `${monthName.split(" ")[0]} ${selectedDay} events` : "Club events"}</h2>
          <div className="agenda-tabs">
            {selectedDay ? <button className="active" onClick={() => setSelectedDay(null)}>Show all events</button> : <>
              <button className={eventView === "upcoming" ? "active" : ""} onClick={() => setEventView("upcoming")}>Upcoming</button>
              <button className={eventView === "past" ? "active" : ""} onClick={() => setEventView("past")}>Past events</button>
            </>}
          </div>
          <div className="agenda-list">
            {visibleMatches.map((match, index) => (<a className="agenda-item" href={match.url || "https://www.chess.com/clubs/events/arches-net"} target="_blank" rel="noreferrer" key={`${match.name}-${index}`}>
                <span className="date-box"><strong>{match.start_time ? new Date(match.start_time * 1000).getDate() : "—"}</strong><small>{match.start_time ? new Date(match.start_time * 1000).toLocaleString("en", { month: "short" }) : "TBA"}</small></span>
                <span><strong>{match.name || "Arches team match"}</strong><small>{match.status || "Chess.com club event"}</small><b>Open event</b></span>
              </a>))}
            {visibleMatches.length === 0 && <div className="empty-state"><Icon name="calendar"/><strong>No events found</strong><span>{selectedDay ? "No public club matches were scheduled for this day." : `No ${eventView} club matches are currently published.`}</span></div>}
          </div>
        </aside>
      </div>
      <p className="data-note">Team matches refresh automatically from Chess.com every five minutes. Social events remain available on the linked official calendar.</p>
    </>);
}
function MembersPage({ members, loading, onRefresh }) {
    const [query, setQuery] = useState("");
    const filtered = members.filter((member) => member.username.toLowerCase().includes(query.toLowerCase()));
    return (<>
      <PageHeader eyebrow="OUR COMMUNITY" title={`${members.length} club members`} description="The live public roster of The Arches Server." action={<button className="button secondary" onClick={onRefresh} disabled={loading}><Icon name="refresh"/>{loading ? "Syncing…" : "Sync roster"}</button>}/>
      <section className="panel">
        <div className="member-tools">
          <label className="search-field"><Icon name="search"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search members…"/></label>
          <span className="muted">{filtered.length} results</span>
        </div>
        <div className="member-grid">
          {filtered.map((member, index) => (<a className="member-card" href={`https://www.chess.com/member/${member.username}`} target="_blank" rel="noreferrer" key={member.username}>
              <Avatar username={member.username} avatar={member.avatar}/>
              <div><strong>{member.username}{member.role && <b className="role-badge">{member.role}</b>}</strong><span>Member since {formatDate(member.joined)}</span></div>
              <span className="member-status"><i className={isOnlineNow(member.last_online) ? "online" : "offline"}/>{isOnlineNow(member.last_online) ? "Online" : "Offline"}</span>
            </a>))}
        </div>
        <p className="roster-note">Chess.com’s public club API publishes one combined administrator list. Owner, Super Admin, and Coordinator distinctions are not exposed separately, so published staff are labeled “Club Admin” without guessing private roles.</p>
      </section>
    </>);
}
function PointsPage({ points }) {
    const ways = [
        ["Play a Chess.com game", "+1", "Every completed public game after joining the club adds one earned point."],
        ["Stay in the club", "REQUIRED", "Points update only while your username remains on the live club roster."],
        ["Save for a reward", "LONG TERM", "High shop prices make the rare club perks meaningful."],
        ["Automatic sync", "LIVE", "Your public monthly game archives are checked whenever you sign in."],
    ];
    return (<>
      <PageHeader eyebrow="CLUB REWARDS" title="Arches Points" description="One point for every public game played since you joined The Arches Server."/>
      <section className="points-hero">
        <div><span>YOUR AVAILABLE BALANCE</span><strong>{points}</strong><small>ARCHES POINTS</small></div>
        <div className="points-copy"><h2>Every game moves you forward.</h2><p>Your earned total comes directly from Chess.com game archives beginning on your club join date. Redeemed rewards are deducted locally from that total.</p><div className="level-track"><span style={{ width: `${Math.min(100, points / 2)}%` }}/></div><small>{200 - points > 0 ? `${200 - points} points to Vanguard tier` : "Vanguard tier unlocked"}</small></div>
      </section>
      <div className="section-heading"><span className="eyebrow">EARNING GUIDE</span><h2>How points are earned</h2></div>
      <div className="earning-grid">
        {ways.map(([title, value, description], index) => <article className="earning-card" key={title}><span className="step">0{index + 1}</span><strong>{title}</strong><b>{value}</b><p>{description}</p></article>)}
      </div>
      <div className="notice"><Icon name="shield"/><div><strong>API verified games</strong><p>Earned points are counted from your public Chess.com archives. Shop spending remains browser-local because GitHub Pages does not provide a shared database.</p></div></div>
    </>);
}
function ShopPage({ points, onBuy }) {
    const [message, setMessage] = useState("");
    const products = [
        { title: "Club shoutout", price: 500, tag: "SOCIAL", description: "A personal mention in the next club announcement.", icon: "◒" },
        { title: "Member bar feature", price: 850, tag: "7 DAYS", description: "Take the featured position on the club member bar for one week.", icon: "◇" },
        { title: "Profile spotlight", price: 1200, tag: "PREMIUM", description: "A full player spotlight with your best game and story.", icon: "♜" },
        { title: "Event naming rights", price: 2000, tag: "LEGENDARY", description: "Name one eligible monthly Arches arena.", icon: "♛" },
    ];
    const buy = (title, price) => {
        if (onBuy(price))
            setMessage(`${title} reserved locally. An admin must approve fulfillment.`);
        else
            setMessage(`You need ${price - points} more points for ${title}.`);
    };
    return (<>
      <PageHeader eyebrow="REWARD VAULT" title="Arches Shop" description="Rare club perks for the members who show up consistently." action={<div className="balance-pill"><Icon name="points"/><span><small>BALANCE</small><strong>{points} AP</strong></span></div>}/>
      {message && <div className="toast-message"><Icon name={message.includes("reserved") ? "check" : "clock"}/>{message}<button onClick={() => setMessage("")} aria-label="Dismiss"><Icon name="close" size={14}/></button></div>}
      <div className="shop-grid">
        {products.map((product) => <article className="product-card" key={product.title}>
          <div className="product-visual"><span>{product.icon}</span><i>{product.tag}</i></div>
          <div className="product-body"><h2>{product.title}</h2><p>{product.description}</p><div><strong>{product.price.toLocaleString()} <small>AP</small></strong><button className="button primary" disabled={points < product.price} onClick={() => buy(product.title, product.price)}>{points < product.price ? "Keep earning" : "Redeem"}</button></div></div>
        </article>)}
      </div>
      <p className="data-note">Redemptions in this static preview are stored only in this browser and require club admin confirmation.</p>
    </>);
}
function ArchSound() {
    return <>
    <PageHeader eyebrow="CLUB SOUNDTRACK" title="ArchSound" description="Listen to The Arches Server playlist without leaving the clubhouse."/>
    <section className="panel sound-panel">
      <div className="sound-copy"><span className="stat-icon"><Icon name="music"/></span><div><span className="eyebrow">NOW PLAYING</span><h2>The Arches Server playlist</h2><p>Playback is provided by YouTube. Sign-in or playback restrictions are controlled by YouTube.</p></div></div>
      <iframe title="The Arches Server playlist" src="https://www.youtube.com/embed/videoseries?list=PLEy_-OzyS_Dc" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/>
      <a className="button secondary" href="https://music.youtube.com/playlist?list=PLEy_-OzyS_Dc&si=ADE8qIOwHFmk9bbV" target="_blank" rel="noreferrer">Open in YouTube Music <Icon name="external"/></a>
    </section>
  </>;
}
function SettingsPage({ currentUser, theme, setTheme, onSignOut }) {
    const tabs = ["Profile", "Notifications", "Appearance", "Privacy"];
    const [tab, setTab] = useState("Profile");
    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("arches-settings") || "{}");
        }
        catch {
            return {};
        }
    });
    const update = (key, value) => setSettings({ ...settings, [key]: value });
    const save = () => {
        localStorage.setItem("arches-settings", JSON.stringify(settings));
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1800);
    };
    return (<>
      <PageHeader eyebrow="YOUR ACCOUNT" title="Settings" description="Personalize your local The Arches Server experience."/>
      <div className="settings-layout">
        <div className="settings-tabs">{tabs.map((item) => <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>{item}</button>)}</div>
        <section className="panel settings-panel">
          {tab === "Profile" && <><div className="section-heading compact"><h2>Chess profile</h2><p>Your verified public Chess.com identity.</p></div><label className="form-label">CHESS.COM USERNAME<input value={currentUser.username} readOnly/></label><label className="form-label">DISPLAY NAME<input value={settings.displayName || currentUser.name || ""} onChange={(e) => update("displayName", e.target.value)} placeholder="How members see you"/></label><label className="form-label">SHORT BIO<textarea value={settings.bio || ""} onChange={(e) => update("bio", e.target.value)} placeholder="Your playing style, goals, or favorite opening…"/></label></>}
          {tab === "Notifications" && <><div className="section-heading compact"><h2>Notifications</h2><p>Choose what appears in your club feed.</p></div><Toggle label="Event reminders" detail="Upcoming arenas and team matches" value={settings.events !== false} onChange={(value) => update("events", value)}/><Toggle label="Leaderboard changes" detail="Updates when your club rank changes" value={settings.rank !== false} onChange={(value) => update("rank", value)}/><Toggle label="Points earned" detail="Updates when newly played games add points" value={settings.points !== false} onChange={(value) => update("points", value)}/></>}
          {tab === "Appearance" && <><div className="section-heading compact"><h2>Choose your board</h2><p>Switch the entire clubhouse color system instantly.</p></div><div className="theme-options"><button className={theme === "arches" ? "active" : ""} onClick={() => setTheme("arches")}><span className="theme-preview arches-preview"><i /><i /><i /></span><span><strong>Arches Theme</strong><small>Midnight blue, gold and ice blue</small></span>{theme === "arches" && <Icon name="check"/>}</button><button className={theme === "chess" ? "active" : ""} onClick={() => setTheme("chess")}><span className="theme-preview chess-preview"><i /><i /><i /></span><span><strong>Chess.com Original</strong><small>Chess green, graphite and light grey</small></span>{theme === "chess" && <Icon name="check"/>}</button></div><Toggle label="Compact member lists" detail="Show more players on each screen" value={!!settings.compact} onChange={(value) => update("compact", value)}/><Toggle label="Reduce motion" detail="Minimize transitions throughout the site" value={!!settings.motion} onChange={(value) => update("motion", value)}/><label className="form-label">RATING FORMAT<select value={settings.ratingFormat || "current"} onChange={(e) => update("ratingFormat", e.target.value)}><option value="current">Current ratings</option><option value="best">Personal best ratings</option></select></label></>}
          {tab === "Privacy" && <><div className="section-heading compact"><h2>Privacy</h2><p>Control local visibility preferences.</p></div><Toggle label="Show online status" detail="Let club members see when you are active" value={settings.online !== false} onChange={(value) => update("online", value)}/><Toggle label="Show points balance" detail="Display your balance beside your profile" value={settings.balance !== false} onChange={(value) => update("balance", value)}/><div className="notice small"><Icon name="shield"/><div><strong>Public Chess.com data</strong><p>Ratings and membership are already public through Chess.com. These controls affect this interface only.</p></div></div></>}
          <div className="settings-footer"><button className="button danger" onClick={onSignOut}>Sign out</button><span>{saved ? "Changes saved in this browser." : "Settings are saved locally."}</span><button className="button primary" onClick={save}>{saved ? <><Icon name="check"/>Saved</> : "Save changes"}</button></div>
        </section>
      </div>
    </>);
}
function Toggle({ label, detail, value, onChange }) {
    return <div className="toggle-row"><div><strong>{label}</strong><span>{detail}</span></div><button aria-pressed={value} className={`toggle ${value ? "on" : ""}`} onClick={() => onChange(!value)}><span /></button></div>;
}
function AdminPage({ members }) {
    const [unlocked, setUnlocked] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const submit = (event) => {
        event.preventDefault();
        if (password === "Archchess2024")
            setUnlocked(true);
        else
            setError("That Super Admin password does not match.");
    };
    if (!unlocked)
        return (<>
      <PageHeader eyebrow="RESTRICTED ACCESS" title="Super Admin" description="Local controls for club operations."/>
      <section className="admin-lock panel">
        <div className="lock-icon"><Icon name="shield" size={34}/></div>
        <span className="eyebrow">AUTHENTICATION REQUIRED</span>
        <h2>Enter the Super Admin password</h2>
        <p>Unlock administration controls on this device.</p>
        <form onSubmit={submit}><label className="form-label">PASSWORD<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Super Admin password"/></label>{error && <span className="form-error">{error}</span>}<button className="button primary" type="submit">Unlock console</button></form>
        <div className="security-note"><Icon name="shield"/><span><strong>Static-site limitation</strong>This password is visible in the published JavaScript and cannot provide secure authorization on GitHub Pages.</span></div>
      </section>
    </>);
    return (<>
      <PageHeader eyebrow="OPERATIONS" title="Admin console" description="Manage the local club preview." action={<button className="button secondary" onClick={() => setUnlocked(false)}>Lock console</button>}/>
      <div className="admin-metrics"><div><span>MEMBERS</span><strong>{members.length}</strong></div><div><span>PENDING REWARDS</span><strong>03</strong></div><div><span>UPCOMING EVENTS</span><strong>02</strong></div><div><span>API STATUS</span><strong className="cyan">LIVE</strong></div></div>
      <div className="admin-grid">
        {[
            ["Reward approvals", "Review point awards and shop redemption requests.", "3 pending"],
            ["Featured member", "Select and schedule the player shown on the member bar.", "Manage"],
            ["Club announcements", "Draft an update for the community feed.", "Create"],
            ["Event operations", "Review linked Chess.com events and matches.", "Open"],
        ].map(([title, description, action]) => <article className="panel admin-action" key={title}><span className="stat-icon"><Icon name="shield"/></span><h2>{title}</h2><p>{description}</p><button className="button secondary" onClick={() => alert("This action requires a secure backend before it can update shared club data.")}>{action} <Icon name="arrow"/></button></article>)}
      </div>
    </>);
}
export default App;

(function () {
  const STORAGE_KEY = "raftoff-feed-v1";
  const feedList = document.getElementById("feed-list");
  const composer = document.getElementById("composer");
  const postText = document.getElementById("post-text");
  const charCount = document.getElementById("char-count");

  if (!feedList || !composer || !postText) {
    return;
  }

  const starterPosts = [
    {
      id: "seed-1",
      author: "Maya",
      createdAt: Date.now() - 2 * 60 * 60 * 1000,
      body: "Casting off at dawn tomorrow. Who wants coffee on the dock first?",
      reactions: { in: 4, go: 2, love: 1 },
      myReaction: null,
    },
    {
      id: "seed-2",
      author: "Jordan",
      createdAt: Date.now() - 26 * 60 * 60 * 1000,
      body: "Trail loop + picnic at the overlook. Bring snacks — I’ll bring the playlist.",
      reactions: { in: 6, go: 3, love: 2 },
      myReaction: null,
    },
    {
      id: "seed-3",
      author: "Sam",
      createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      body: "First RaftOff meetup was a blast. Same cove next Saturday?",
      reactions: { in: 8, go: 5, love: 4 },
      myReaction: null,
    },
  ];

  function loadPosts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return starterPosts.map(clonePost);
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.length) return starterPosts.map(clonePost);
      return parsed;
    } catch (error) {
      return starterPosts.map(clonePost);
    }
  }

  function clonePost(post) {
    return {
      ...post,
      reactions: { ...post.reactions },
    };
  }

  function savePosts(posts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function initials(name) {
    return name
      .split(/\s+/)
      .map(function (part) {
        return part[0] || "";
      })
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function toneFor(name) {
    var sum = 0;
    for (var i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return String((sum % 4) + 1);
  }

  function formatTime(timestamp) {
    var diff = Date.now() - timestamp;
    var minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return minutes + "m ago";
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + "h ago";
    var days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return days + "d ago";
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  function reactionLabel(key, count) {
    var labels = { in: "I’m in", go: "Let’s go", love: "Love this" };
    return labels[key] + (count ? " · " + count : "");
  }

  function renderPosts(posts, highlightId) {
    if (!posts.length) {
      feedList.innerHTML = '<li class="feed-empty">No posts yet — cast the first line.</li>';
      return;
    }

    feedList.innerHTML = posts
      .map(function (post) {
        var active = post.myReaction;
        return (
          '<li class="feed-item' +
          (post.id === highlightId ? " is-new" : "") +
          '" data-id="' +
          escapeHtml(post.id) +
          '">' +
          '<div class="avatar" data-tone="' +
          toneFor(post.author) +
          '" aria-hidden="true">' +
          escapeHtml(initials(post.author)) +
          "</div>" +
          '<div class="feed-content">' +
          '<div class="feed-meta">' +
          '<span class="feed-author">' +
          escapeHtml(post.author) +
          "</span>" +
          '<span class="feed-time">' +
          escapeHtml(formatTime(post.createdAt)) +
          "</span>" +
          "</div>" +
          '<p class="feed-body">' +
          escapeHtml(post.body) +
          "</p>" +
          '<div class="feed-actions">' +
          ["in", "go", "love"]
            .map(function (key) {
              return (
                '<button type="button" class="react-btn' +
                (active === key ? " is-active" : "") +
                '" data-react="' +
                key +
                '">' +
                escapeHtml(reactionLabel(key, post.reactions[key] || 0)) +
                "</button>"
              );
            })
            .join("") +
          "</div>" +
          "</div>" +
          "</li>"
        );
      })
      .join("");
  }

  function updateCharCount() {
    if (!charCount) return;
    var length = postText.value.length;
    charCount.textContent = length + " / 280";
    charCount.classList.toggle("is-near", length >= 240 && length < 280);
    charCount.classList.toggle("is-full", length >= 280);
  }

  var posts = loadPosts();
  renderPosts(posts);
  updateCharCount();

  postText.addEventListener("input", updateCharCount);

  composer.addEventListener("submit", function (event) {
    event.preventDefault();
    var body = postText.value.trim();
    if (!body) return;

    var post = {
      id: "post-" + Date.now(),
      author: "You",
      createdAt: Date.now(),
      body: body,
      reactions: { in: 0, go: 0, love: 0 },
      myReaction: null,
    };

    posts.unshift(post);
    savePosts(posts);
    renderPosts(posts, post.id);
    postText.value = "";
    updateCharCount();
    postText.focus();
  });

  feedList.addEventListener("click", function (event) {
    var button = event.target.closest("[data-react]");
    if (!button) return;

    var item = button.closest(".feed-item");
    if (!item) return;

    var id = item.getAttribute("data-id");
    var key = button.getAttribute("data-react");
    var post = posts.find(function (entry) {
      return entry.id === id;
    });
    if (!post) return;

    if (!post.reactions) post.reactions = { in: 0, go: 0, love: 0 };

    if (post.myReaction === key) {
      post.reactions[key] = Math.max(0, (post.reactions[key] || 0) - 1);
      post.myReaction = null;
    } else {
      if (post.myReaction) {
        post.reactions[post.myReaction] = Math.max(
          0,
          (post.reactions[post.myReaction] || 0) - 1
        );
      }
      post.reactions[key] = (post.reactions[key] || 0) + 1;
      post.myReaction = key;
    }

    savePosts(posts);
    renderPosts(posts);
  });
})();

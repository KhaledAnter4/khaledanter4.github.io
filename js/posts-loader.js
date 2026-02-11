// Simple markdown-based blog loader using marked.js
(function () {
  var listContainer = document.getElementById('posts-list');
  var articleContainer = document.getElementById('post-viewer');
  if (!listContainer || !articleContainer) return;

  function fetchJSON(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('Failed to load ' + url);
      return res.json();
    });
  }

  function fetchText(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('Failed to load ' + url);
      return res.text();
    });
  }

  function parseFrontMatter(raw) {
    var fmMatch = raw.match(/^---[^\n]*\n([\s\S]*?)\n-{3,}\n?/);
    if (!fmMatch) {
      return { meta: {}, body: raw };
    }
    var metaBlock = fmMatch[1];
    var body = raw.slice(fmMatch[0].length);
    var meta = {};
    metaBlock.split('\n').forEach(function (line) {
      var idx = line.indexOf(':');
      if (idx === -1) return;
      var key = line.slice(0, idx).trim();
      var val = line.slice(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      meta[key] = val;
    });
    return { meta: meta, body: body };
  }

  var currentOpen = null;

  function createCard(filename, meta) {
    var card = document.createElement('article');
    card.className = 'card blog-card';

    var title = document.createElement('h3');
    title.textContent = meta.title || filename.replace(/\.md$/i, '');
    card.appendChild(title);

    var metaLine = document.createElement('p');
    metaLine.className = 'blog-card-meta';
    var pieces = [];
    if (meta.date) pieces.push(meta.date);
    if (meta.category) pieces.push(meta.category);
    metaLine.textContent = pieces.join(' · ');
    if (pieces.length) card.appendChild(metaLine);

    card.addEventListener('click', function () {
      if (currentOpen === filename) {
        closePost();
      } else {
        openPost(filename);
      }
    });

    return card;
  }

  function renderList(files) {
    listContainer.innerHTML = '';
    if (!files.length) {
      listContainer.textContent = 'No posts published yet.';
      return;
    }

    files.forEach(function (file) {
      fetchText('posts/' + file)
        .then(function (raw) {
          var parsed = parseFrontMatter(raw);
          var card = createCard(file, parsed.meta);
          listContainer.appendChild(card);
        })
        .catch(function () {
          // skip broken file
        });
    });
  }

  function animateHeight(from, to, cb) {
    var el = articleContainer;
    el.style.overflow = 'hidden';
    el.style.maxHeight = from + 'px';
    el.style.transition = 'max-height 0.24s ease, opacity 0.24s ease';
    requestAnimationFrame(function () {
      el.style.opacity = to === 0 ? '0' : '1';
      el.style.maxHeight = to + 'px';
    });
    setTimeout(function () {
      el.style.transition = '';
      el.style.overflow = '';
      el.style.maxHeight = '';
      if (cb) cb();
    }, 260);
  }

  function closePost() {
    if (!currentOpen) return;
    var from = articleContainer.offsetHeight;
    animateHeight(from, 0, function () {
      articleContainer.innerHTML = '';
      currentOpen = null;
    });
  }

  function openPost(filename) {
    fetchText('posts/' + filename)
      .then(function (raw) {
        var parsed = parseFrontMatter(raw);
        var html = window.marked ? window.marked.parse(parsed.body) : parsed.body;
        var from = articleContainer.offsetHeight;

        // temporary container to measure target height
        articleContainer.innerHTML = '';
        var temp = document.createElement('div');
        temp.style.visibility = 'hidden';
        temp.style.position = 'absolute';
        temp.style.left = '-9999px';

        var titleEl = document.createElement('h2');
        titleEl.textContent = parsed.meta.title || filename.replace(/\.md$/i, '');
        temp.appendChild(titleEl);

        if (parsed.meta.date || parsed.meta.category) {
          var metaEl = document.createElement('p');
          metaEl.className = 'blog-article-meta';
          var bits = [];
          if (parsed.meta.date) bits.push(parsed.meta.date);
          if (parsed.meta.category) bits.push(parsed.meta.category);
          metaEl.textContent = bits.join(' · ');
          temp.appendChild(metaEl);
        }

        var bodyEl = document.createElement('div');
        bodyEl.className = 'blog-article-body';
        bodyEl.innerHTML = html;
        temp.appendChild(bodyEl);

        articleContainer.appendChild(temp);
        var to = temp.offsetHeight;
        articleContainer.removeChild(temp);

        animateHeight(from, to, function () {
          articleContainer.innerHTML = '';
          articleContainer.appendChild(titleEl);
          if (parsed.meta.date || parsed.meta.category) {
            articleContainer.appendChild(metaEl);
          }
          articleContainer.appendChild(bodyEl);
          currentOpen = filename;
        });
      })
      .catch(function () {
        articleContainer.textContent = 'Error loading post.';
      });
  }

  fetchJSON('posts/index.json')
    .then(renderList)
    .catch(function () {
      listContainer.textContent = 'Unable to load posts.';
    });
})();



(function() {
    "use strict";

    // These are hacks to get storm to shut up
    let release; let asset; release = asset = Object.create(null, {});
    release.assets = release.author = release.author.avatar_url = release.author.login = release.prerelease = release.draft = release.tag_name = asset.browser_download_url = undefined;

    let sidebarElem = document.getElementById('sidebar').children[0];
    let dataElem = document.getElementById('data');
    let loadingElem = document.getElementById('loading');

    let repoUser = 'boomboompower';
    let repoIds = ['SkinChanger', 'ToggleChat', 'TextDisplayer', 'AutoGG', 'MessageAlerter', 'MyIgnore'];

    // The ID of the LAST clicked id.
    let wantingCurrent = null;

    repoIds.forEach(id => {
        let elem = document.createElement('a');

        elem.innerText = id;

        elem.addEventListener('click', () => getGithubRuns(id));

        sidebarElem.appendChild(elem);
    });

    async function getGithubRuns(id) {
        // Store the ID of this id
        // to prevent data desync occuring.
        wantingCurrent = id;

        loadingElem.style.opacity = '1';

        const url = 'https://api.github.com/repos/' + repoUser + '/' + id + '/releases';

        let bob = await getJSONContent(url);

        // Stop desync, if the user clicks multiple tabs in
        // quick succession we only want the latest one to
        // show up, this blocks slower queries overriding the
        // latest clicked page/repository.
        //
        // The user will not notice this change
        if (wantingCurrent !== id) {
            return;
        }

        loadingElem.style.opacity = '0';

        const holder = document.createElement('div');
        const title = document.createElement('div');

        holder.style.fontFamily = 'monospace';

        title.innerText = id;
        holder.style.width = '100%';

        holder.appendChild(title);
        holder.appendChild(document.createElement('hr'));

        if (bob.length === 0) {

            let created = createMessageDiv('There were no artifacts for this project');

            holder.appendChild(created);

            dataElem.innerHTML = '';
            dataElem.appendChild(holder);
            return;
        }

        let packedData = document.createElement('div');

        for (let i = 0; i < bob.length; i++) {
            let dataHolder = document.createElement('div');
            let releaseTitle = document.createElement('div');
            let releaseName = document.createElement('a');

            releaseName.classList.add('run_link');

            let release = bob[i];

            if (release.name.length === 0) {
                releaseName.innerText = 'Release ' + release.tag_name;
            } else {
                releaseName.innerText = release.name;
            }

            releaseTitle.appendChild(releaseName);

            dataHolder.appendChild(releaseTitle);

            let assets = release.assets;

            if (assets.length > 0) {
                releaseName.addEventListener('click', () => onReleaseClicked(release, packedData));

                for (let assetIndex = assets.length - 1; assetIndex >= 0; assetIndex--) {
                    let asset = assets[assetIndex];

                    let nameOfItem = document.createElement('div');

                    nameOfItem.innerHTML = '&nbsp; ' + asset.name;

                    dataHolder.appendChild(nameOfItem);
                }
            } else {
                releaseName.title = 'There are no artifacts on this build';
                releaseName.classList.add('dead');
            }

            addBadge(release.draft, releaseTitle, 'UNRELEASED', 'draft');
            addBadge(release.prerelease, releaseTitle, 'BETA', 'beta');

            dataHolder.style.marginBottom = '5px';

            packedData.appendChild(dataHolder);
        }

        holder.appendChild(packedData);

        dataElem.innerHTML = '';
        dataElem.appendChild(holder);
    }

    function onReleaseClicked(release, object) {
        object.innerHTML = '';

        let releaseName = document.createElement('div');

        object.style.position = 'relative';

        if (release.name.length === 0) {
            releaseName.innerText = 'Release ' + release.tag_name;
        } else {
            releaseName.innerText = release.name;
        }

        addBadge(release.draft, releaseName, 'UNRELEASED', 'draft');
        addBadge(release.prerelease, releaseName, 'BETA', 'beta');

        object.appendChild(releaseName);

        for (let assetIndex = release.assets.length - 1; assetIndex >= 0; assetIndex--) {
            let asset = release.assets[assetIndex];

            let nameOfItem = document.createElement('div');
            let downloadLink = document.createElement('span');

            downloadLink.innerHTML = '&nbsp; ' + asset.name + ' (<a href="' + asset.browser_download_url + '">Download</a>)';

            nameOfItem.appendChild(downloadLink);

            object.appendChild(nameOfItem);
        }

        let author = document.createElement('figure');
        let authorPFP = document.createElement('img');
        let authorName = document.createElement('figcaption');
        authorPFP.src = release.author.avatar_url;
        authorName.innerText = 'Released by: ' + release.author.login.replace('[bot]', '');

        author.appendChild(authorPFP);
        author.appendChild(authorName);

        author.classList.add('author');

        let commitMessage = document.createElement('div');
        commitMessage.classList.add('commit');

        let beautify = marked(release.body); // Using marked to compile the MD

        // Heals all wounds?
        commitMessage.innerHTML = beautify.replace('❤', '<span style="color: red">❤</span>');

        object.appendChild(author);
        object.appendChild(commitMessage);
    }

    function addBadge(condition, parent, text, tag) {
        if (condition) {
            let space = document.createElement('span');
            let badge = document.createElement('span');

            space.innerText = ' ';
            badge.innerText = text;
            badge.classList.add('badge');
            badge.classList.add(tag);

            space.style.cursor = 'default';

            parent.appendChild(space);
            parent.appendChild(badge);
        }
    }

    /**
     * Each line represents a new div line in the object. The object will by default have an automatic margin
     * and its text will be centered.
     *
     * @returns {HTMLDivElement}
     */
    function createMessageDiv() {
        let holder = document.createElement('div');

        holder.style.margin = 'auto';
        holder.style.textAlign = 'center';

        for (let i = 0; i < arguments.length; i++) {
            let variable = document.createElement('div');

            variable.innerText = arguments[i];

            holder.appendChild(variable);
        }

        return holder;
    }

    // This function retrieves the JSON contents at a URL
    // Then caches the contents of the page in the session storage
    // this is to prevent the api being queried from being spammed
    // whilst keeping contents on the page regenerateable.
    async function getJSONContent(url) {
        let b64 = unescape(encodeURIComponent(btoa(url)));

        try {
            if (sessionStorage[b64] != null) {
                let cached = JSON.parse(decodeURIComponent(escape(atob(sessionStorage[b64]))));

                console.log(cached);

                return cached;
            }
        } catch (e) {
        }

        let value = await fetch(url).then(o => o.json());
        let strung = JSON.stringify(value);

        // If the result is a rate limit, we can't use the result
        // as part of the cache since things will start breaking
        if (!strung.includes('rate limit')) {
            sessionStorage[b64] = btoa(unescape(encodeURIComponent(strung)));
        }

        // Return the JSON of the value
        return value;
    }
})();

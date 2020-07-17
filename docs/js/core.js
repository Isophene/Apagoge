function usingIE() {
    return window.navigator.userAgent.indexOf("MSIE ") > 0;
}

(function() {
    "use strict";

    ////////////////////////////////////////////////Configuration///////////////////////////////////////////////////////
    //                                                                                                                //
    let repoUser = 'boomboompower';
    let repoIds = ['SkinChanger', 'ToggleChat', 'TextDisplayer', 'AutoGG', 'FPSSpoofer', 'MessageAlerter', 'MyIgnore'];
    //                                                                                                                //
    ////////////////////////////////////////////////Configuration///////////////////////////////////////////////////////

    let sidebarElem = document.getElementById('sidebar').children[0];
    let dataElem = document.getElementById('data');
    let loadingElem = document.getElementById('loading');
    let filter = document.getElementById('filter');

    // The ID of the LAST clicked id.
    let wantingCurrent = null;

    // Stored url parameters
    const urlParams = new URLSearchParams(window.location.search);

    if ( filter != null ) {
        filter.addEventListener('change', function(e) {
            if (filter.selectedIndex === 0) {
                urlParams.delete('beta');
            } else {
                urlParams.set('beta', filter[filter.selectedIndex].value);
            }

            history.replaceState(null, null, "?" + urlParams.toString());

            if (wantingCurrent != null) {
                getGithubRuns(wantingCurrent);
            }
        })
    }

    repoIds.forEach(function(id) {
        let elem = document.createElement('a');

        elem.innerText = id;
        elem.id = 'repo-' + id;

        elem.addEventListener('click', () => {
            urlParams.set('mod', id);
            urlParams.delete('tag');

            history.replaceState({modID: id, tagName: null}, null, "?" + urlParams.toString());

            getGithubRuns(id);
        });

        sidebarElem.appendChild(elem);
    });

    // Save the id
    function checkModId() {
        let modID = retrieveParam('mod');

        if (modID && modID.length > 0) {
            for (let i = 0; i < repoIds.length; i++) {
                let repoId = repoIds[i];

                if (repoId.toLowerCase() === modID.toLowerCase()) {
                    let element = document.getElementById('repo-' + repoId);

                    if (element != null) {
                        getGithubRuns(repoId);
                    }

                    break;
                }
            }
        }
    }

    // Check if it exists
    checkModId();

    // If it changes in the future we should catch it as well
    window.addEventListener('hashchange', checkModId);

    async function getGithubRuns(id) {
        // Store the ID of this id
        // to prevent data desync occurring.
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

        const bannerBox = document.createElement('div');
        bannerBox.classList.add('banner-box');

        const bannerBoxDiv = document.createElement('div');
        const title = document.createElement('h6');
        title.innerText = id;
        bannerBoxDiv.appendChild(title);

        bannerBox.appendChild(bannerBoxDiv);
        holder.appendChild(bannerBox);

        // holder.appendChild(title);
        // holder.appendChild(document.createElement('hr'));

        if (bob.length === 0) {
            let created = createMessageDiv('There were no artifacts for this project');

            holder.appendChild(created);

            dataElem.innerHTML = '';
            dataElem.appendChild(holder);
            return;
        }

        let modParam = retrieveParam('mod');
        let betaParam = retrieveParam('beta');
        let tagParam = retrieveParam('tag');

        let packedData = document.createElement('div');

        packedData.classList.add('content-box');

        if (modParam === id.toLowerCase() && tagParam) {
            for (let i = 0; i < bob.length; i++) {
                let release = bob[i];

                if (release.tag_name === tagParam) {
                    onReleaseClicked(release, packedData);

                    holder.appendChild(packedData);

                    dataElem.innerHTML = '';
                    dataElem.appendChild(holder);

                    return;
                }
            }
        }

        let packCount = 0;

        for (let i = 0; i < bob.length; i++) {
            let release = bob[i];

            if (release.prerelease && betaParam && (betaParam === 'hidden' || betaParam === 'off' || betaParam === 'none')) {
                continue;
            } else if (!release.prerelease && betaParam && betaParam === 'only') {
                continue;
            }

            packCount++;

            let dataHolder = document.createElement('div');
            let releaseTitle = document.createElement('div');
            let releaseName = document.createElement('a');

            releaseName.href = '#tag=' + release.tag_name;
            releaseName.classList.add('run_link');


            if (release.name.length === 0) {
                releaseName.innerText = 'Release ' + release.tag_name;
            } else {
                releaseName.innerText = release.name;
            }

            releaseTitle.appendChild(releaseName);

            dataHolder.appendChild(releaseTitle);

            let assets = release.assets;

            if (assets.length > 0) {
                releaseName.addEventListener('click', function(e) {
                    e.preventDefault();

                    urlParams.set('tag', release.tag_name);

                    history.replaceState({modID: id, tagName: release.tag_name}, null, "?" + urlParams.toString());

                    onReleaseClicked(release, packedData);
                });

                let dateReleased = new Date(release.created_at);

                let o = document.createElement('span');

                o.innerText = 'Released ' + dateReleased.toDateString();

                releaseTitle.appendChild(o);
            } else {
                releaseName.title = 'There are no artifacts on this build';
                releaseName.classList.add('dead');
            }

            if (release.draft) {
                releaseName.setAttribute('badge', 'draft');
            }

            if (release.prerelease) {
                releaseName.setAttribute('badge', 'beta');
            }

            dataHolder.classList.add('release');

            packedData.appendChild(dataHolder);
        }

        if (packCount === 0) {
            let created = createMessageDiv('There were no artifacts for this project');

            holder.appendChild(created);

            dataElem.innerHTML = '';
            dataElem.appendChild(holder);
            return;
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
            nameOfItem.setAttribute('downloads', asset.download_count);

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

    function retrieveParam(key) {
        let value = urlParams.get(key);

        if (value != null) {
            value = value.toLowerCase();
        }

        return value;
    }
})();

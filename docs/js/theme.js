(function() {
    let dark = document.getElementById('dark');
    let theme = document.getElementById('theme');

    if (dark == null || theme == null) {
        return;
    }

    // Personally hate light mode but sure
    if (localStorage.getItem('light') == null) {
        localStorage.setItem('light', 'true');
    }

    let usingLight = localStorage.getItem('light') === 'true';

    theme.addEventListener('click', () => {
        usingLight = !usingLight;

        localStorage.setItem('light', usingLight.toString());

        updateTheme();
    });

    function updateTheme() {
        if (usingLight && dark.href.includes('/css/light.css')) {
            return;
        }

        let body = $('body');

        body.fadeOut(500, () => {
            body.css('display', 'none');

            if (usingLight) {
                dark.href = '/css/light.css';
            } else {
                dark.href = '/css/dark.css';
            }

            body.css('display', null);

            body.fadeIn(1000);
        });
    }

    updateTheme();
})();
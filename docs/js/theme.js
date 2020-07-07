(function() {
    let theme = document.getElementById('theme');

    if (theme == null) {
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
        if (usingLight && !document.body.classList.contains('dark')) {
            document.body.classList.remove('dark');

            return;
        }

        let body = $('body');

        body.fadeOut(500, () => {
            body.css('display', 'none');

            if (usingLight) {
                document.body.classList.remove('dark');
            } else {
                document.body.classList.add('dark');
            }

            body.css('display', null);

            body.fadeIn(1000);
        });
    }

    updateTheme();
})();
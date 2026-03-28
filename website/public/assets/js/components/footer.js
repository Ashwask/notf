(function() {
    const container = document.getElementById('notf-footer');
    if (!container) return;

    container.innerHTML = `
    <footer>
        <div class="footer-powered-by">
            <span data-i18n="footer.poweredBy">NOTF platform powered by</span>
            <a href="https://rainmatter.org/" target="_blank" rel="noopener noreferrer" class="rainmatter-link">
                <img src="/assets/images/rainmatter-logo.png" alt="Rainmatter Foundation" class="rainmatter-logo">
            </a>
        </div>
        <div class="footer-pdgi"><span data-i18n="footer.pdgi">Part of PDGI (People's Digital Goods &amp; Infrastructure) by Rainmatter Foundation</span></div>
        <div class="footer-license">
            <span class="cc-text"><a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="license noopener noreferrer" class="cc-license">
                <img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" alt="CC" class="cc-icon">
                <img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" alt="BY" class="cc-icon">
                <img src="https://mirrors.creativecommons.org/presskit/icons/nc.svg" alt="NC" class="cc-icon">
                <img src="https://mirrors.creativecommons.org/presskit/icons/sa.svg" alt="SA" class="cc-icon">
                CC BY-NC-SA 4.0</a></span>
        </div>
    </footer>`;
})();

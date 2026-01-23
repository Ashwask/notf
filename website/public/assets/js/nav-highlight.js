/**
 * Navigation Current Page Highlighter
 * Automatically adds 'active' class to the current page's nav link
 */

document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-menu a');

    navLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname;

        // Remove trailing slash for comparison
        const normalizedCurrent = currentPath.replace(/\/$/, '') || '/';
        const normalizedLink = linkPath.replace(/\/$/, '') || '/';

        // Check if this link matches the current page
        if (normalizedCurrent === normalizedLink) {
            link.classList.add('active');
        }
        // Special case for home page - only highlight if exactly on home
        else if (normalizedLink === '/' && normalizedCurrent !== '/') {
            link.classList.remove('active');
        }
    });
});

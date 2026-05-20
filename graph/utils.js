/**
 * Utilities Module - Small global helpers reused by the app.
 *
 * This file contains compact helpers needed by several modules, such as toast
 * notifications and color conversion for canvas drawing.
 * Why does it exist?: To avoid duplicating the same small routines in multiple files.
 */

/**
 * Function: showToast
 * What does it receive?:
 *  - message (text): The message shown on screen.
 *  - type (text): The message type ('info', 'success', 'error'). Defaults to 'info'.
 * What does it do?: Dynamically creates a floating notification element, adds the
 * matching icon, inserts it into the page, and schedules its automatic removal.
 * What does it return?: Nothing (undefined).
 * Why does it exist?: To give the user real-time visual feedback.
 */
function showToast(message, type = 'info') {
    // Finds the message container in the HTML (DOM).
    const container = document.getElementById('toast-container');

    // Creates a new div element in memory for the message.
    const toast = document.createElement('div');
    // Assigns CSS classes so the toast gets its shape and color.
    toast.className = `toast toast-${type}`;

    // SVG icon dictionary by notification type.
    const icons = {
        success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
        error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4d6a" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    // Inserts the toast's inner HTML (icon + message text).
    toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
    // Adds the toast to the visible page container.
    container.appendChild(toast);

    // setTimeout runs a function after a delay (3000 milliseconds = 3 seconds).
    setTimeout(() => {
        // Applies the CSS exit animation.
        toast.style.animation = 'toastOut 0.3s ease forwards';
        // Waits another 300ms (the animation duration) before removing the element.
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Function: hexToRgba
 * What does it receive?:
 *  - hex (text): A hexadecimal color (example: '#FF00AA').
 *  - alpha (decimal number): The transparency level from 0 to 1.
 * What does it do?: Extracts the Red, Green, and Blue color components and mixes
 * them with the requested transparency.
 * What does it return?: A text value in 'rgba(r,g,b,a)' format that canvas understands.
 * Why does it exist?: To draw nodes with glow and transparency on the canvas.
 */
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

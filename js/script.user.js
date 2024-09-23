// ==UserScript==
// @name         The MegaMod (PLAYTEST) | Shell Shockers
// @version      1.0
// @author       Infinite Smasher
// @description  A bunch of useful mods, all brought together in one place
// @icon         https://raw.githubusercontent.com/1nf1n1t3Sm4sh3r/mm-playtest/main/img/ico_mods.svg
// @require      https://raw.githubusercontent.com/1nf1n1t3Sm4sh3r/mm-playtest/main/js/megaModHtml.js?v=1.0
// @updateURL    https://raw.githubusercontent.com/1nf1n1t3Sm4sh3r/mm-playtest/main/js/script.meta.js
// @downloadURL  https://raw.githubusercontent.com/1nf1n1t3Sm4sh3r/mm-playtest/main/js/script.user.js
// @match        https://shellshock.io/
// @run-at       document-start
// ==/UserScript==

(function() {
	 let script = document.createElement('script');
	 script.src = `https://cdn.jsdelivr.net/gh/1nf1n1t3Sm4sh3r/mm-playtest/js/megaMod.js?${new Date().getTime()}`;
	 document.addEventListener("DOMContentLoaded", () => {
		  addHTMLEdits();
		  document.head.appendChild(script);
	 });
})();
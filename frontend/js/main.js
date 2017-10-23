/*
 * Orchard Marketing Main JS
 */

$(document).ready(function() {
	initialize();
	$(window).trigger('scroll');
	$(window).trigger('resize');
});

$(window).scroll(function(e) {
});

$(window).resize(function(e) {
});

function initialize() {
	initMagnificPopup();
	initAnchors();
}

function initMagnificPopup() {
	$('.popup-image').magnificPopup({
		type: 'image'
	});
}

function initAnchors() {
	$('a').on('click', function(e) {
		console.log(this.href);
	});
}

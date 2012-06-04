var images = [].slice.apply(document.getElementsByTagName('*'));
images = images.map(function(element) {
	if (element.tagName.toLowerCase() == 'img') {
		var src = element.src;
		var hashIndex = src.indexOf('#');
		if (hashIndex >= 0) {
			src = src.substr(0, hashIndex);
		}
		return src;
	}
	
	var IMAGE_REGEX = /(?:([^:\/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*\.(?:jpe?g|gif|png))(?:\?([^#]*))?(?:#(.*))?/;
	if (element.tagName.toLowerCase() == 'a') {
		var href = element.href;
		if (IMAGE_REGEX.test(href)) {
			return href;
		}
	}
	
	var backgroundImage = element.style['background-image'];
	if (backgroundImage) {
		var parsedURL = backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
		if (IMAGE_REGEX.test(parsedURL)) {
			return parsedURL;
		}
	}
	
	return '';
});

images = removeDuplicateOrEmpty(images);
chrome.extension.sendRequest(images);

function removeDuplicateOrEmpty(a) {
	var index,
			result = [],
			hash = {};
	
	for (index = 0; index < a.length; index++) {
		hash[a[index]] = 0;
	}
	for (key in hash) {
		if (key != '') {
			result.push(key);
		}
	}
	return result;
}

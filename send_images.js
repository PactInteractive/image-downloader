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
  
  if (element.style['background-image']) {
    return element.style['background-image'].replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
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
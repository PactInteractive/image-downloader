var images = [].slice.apply(document.getElementsByTagName('img'));
images = images.map(function(element) {
  var src = element.src;
  var hashIndex = src.indexOf('#');
  if (hashIndex >= 0) {
    src = src.substr(0, hashIndex);
  }
  return src;
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
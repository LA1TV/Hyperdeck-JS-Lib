var FIRST_LINE_REGEX = /^([0-9]+) (.+?)(\:?)$/;
var PARAMS_REGEX = /^(.*)\: (.*)$/;

/**
 * Converts the data to a Object.
 * So the hyperdeck class can do things nicely with it.
 * @return dataObject, The data in a nice object. This will contain 'code', 'text' and 'params' keys,
 *                     (if there are parameters) where params is an object.
 **/
function convertDataToObject(lines) {
  var dataObject = {
    code: null,
    text: null
  };

  var firstLine = lines.shift(); // should contain {Response code} {Response text}
  var firstLineMatches = FIRST_LINE_REGEX.exec(firstLine);
  var code = parseInt(firstLineMatches[1]);
  var text = firstLineMatches[2];
  dataObject.code = code;
  dataObject.text = text;
  
  if (lines.length) {
    // provide the raw data in addition to attempting to parse the response into params
    dataObject.rawData = lines.join('\r\n');
  }
  
  if (firstLineMatches[3] === ':') {
    // the response should have params on the next lines
    // (although sometimes it doesn't because of the responses (e.g 'commands'), do not return
    // the usual format, and in this case params will likely remain as {})
    var params = {};
    //Append the rest into an object for emitting.
    lines.forEach(function(line) {
      var lineData = PARAMS_REGEX.exec(line);
      //First element in array is the whole string.
      if(lineData) {
        params[lineData[1]] = lineData[2];
      }
    });
    dataObject.params = params;
  }
  return dataObject;
}

/**
 * Parses responses from the hyperdeck into a nice object.
 */
 function failureResponseCode(lines) {
   return {
     type: 'synchronousFailure',
     data: convertDataToObject(lines)
   };
 }

 function successResponseCode(lines) {
   return {
     type: 'synchronousSuccess',
     data: convertDataToObject(lines)
   };
 }

 function asynchornousResponseCode(lines) {
   return {
     type: 'asynchronous',
     data: convertDataToObject(lines)
   };
 }

var Parser = {

  parse: function(lines) {
    // pass into the switch/case to decide which function to use.
    switch (lines[0].charAt(0)){
      case '1':
        return failureResponseCode(lines);
      case '2':
        return successResponseCode(lines);
      case '5':
        return asynchornousResponseCode(lines);
      default:
        throw new Error('Invalid payload. Unknown response code.');
    }
  }
};

module.exports = Parser;
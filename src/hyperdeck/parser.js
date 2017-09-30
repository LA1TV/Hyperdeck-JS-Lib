/**
 * Converts the data to a Object.
 * So the hyperdeck class can do things nicely with it.
 * @return dataObject, The data in a nice object. This will contain "code", "text" and "params" keys,
 *                     (if there are parameters) where params is an object.
 **/
function convertDataToObject(data) {
  var dataObject = {
    code: null,
    text: null
  };

  var lines = data.split("\r\n"); //Splits the data on a new line.
  var firstLine = lines.shift(); // should contain {Response code} {Response text}
  var firstLineMatches = /^([0-9]+) (.+?)(\:?)$/.exec(firstLine);
  var code = parseInt(firstLineMatches[1]);
  var text = firstLineMatches[2];
  dataObject.code = code;
  dataObject.text = text;

  if (firstLineMatches[3] === ":") {
    // the response has data on following lines
    // provide the raw data in addition to attempting to parse the response into params
    dataObject.rawData = lines.slice(0, lines.length-1).join("\r\n");

    // this is a best effort. Some of the responses (e.g 'commands'), do not return
    // the usual format, and in this case params will likely remain as {}
    var params = {};
    //Append the rest into an object for emitting.
    lines.forEach(function(line) {
      var lineData = /^(.*)\: (.*)$/.exec(line);
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
 function failureResponseCode(data) {
   return {
     type: "synchronousFailure",
     data: convertDataToObject(data)
   };
 }

 function successResponseCode(data) {
   return {
     type: "synchronousSuccess",
     data: convertDataToObject(data)
   };
 }

 function asynchornousResponseCode(data) {
   return {
     type: "asynchronous",
     data: convertDataToObject(data)
   };
 }

var Parser = {

  parse: function(data) {
    // pass into the switch/case to decide which function to use.
    switch (data.charAt(0)){
      case "1":
        return failureResponseCode(data);
      case "2":
        return successResponseCode(data);
      case "5":
        return asynchornousResponseCode(data);
      default:
        throw new Error("Invalid payload. Unknown response code.");
    }
  }
};

module.exports = Parser;

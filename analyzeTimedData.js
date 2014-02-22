var fs = require('fs')
  , _ = require('underscore')
  , datafile = 'data/t.csv'
  , outFile = 'data/out.js'
  , resolution = 100   // Number of boxes on one line
  , stepSizeLat, stepSizeLng
  , center
  , out
  , limit
  , rawData, _data, data = []
  , minLon, minLat, maxLon, maxLat
  , boxedLat, boxedLng
  , temp, i
  ;
  
console.log("=== Loading raw data");

rawData = fs.readFileSync(datafile, 'utf8')

console.log("=== Loading done, structuring data");

// Get the corresponding hour for the string timestamp in GTM-8
function convertToHour (recorded) {
// console.log('---');
// console.log(recorded);

  var res = parseInt(recorded.substring(12, 14));
  
  // console.log(res);
  
  // if (res === 6) { console.log('!!!'); }
  
  // No need to cast to GMT+1, we're in a hackathon :)
  
  return res;
}

_data = rawData.split('\r\n');
temp = _data[0].split(';');
center = { lat: temp[1], lng: temp[2] };
for (i = 1; i < (limit || _data.length); i += 1) {
  temp = _data[i].split(';');
  if (temp.length >= 3) {
    data.push({lat: parseFloat(temp[1]), lng: parseFloat(temp[2]), count: 1, hour: convertToHour(temp[3])});
  }
}

console.log("=== Data structured, found " + data.length + " lines")

minLat = _.min(data, function (d) { return d.lat; }).lat;
maxLat = _.max(data, function (d) { return d.lat; }).lat;
minLon = _.min(data, function (d) { return d.lng; }).lng;
maxLon = _.max(data, function (d) { return d.lng; }).lng;

// Using a custom box to get a better map
minLat = 48.667838
maxLat = 48.927011

minLng = 2.056396
maxLng = 2.524002

console.log("=== Box size calculated");
console.log("Top left: " + minLat + " " + maxLon);
console.log("Bottom right: " + maxLat + " " + minLon);

stepSizeLat = (maxLat - minLat) / resolution;
stepSizeLng = (maxLng - minLng) / resolution;

// Returns -1 if outside the box
function getBoxedLatNumber(_lat) {
  if (_lat < minLat || _lat > maxLat) {
    return -1;
  }

  return Math.floor((_lat - minLat) / stepSizeLat);
}
function getBoxedLngNumber(_lng) {
  if (_lng < minLng || _lng > maxLng) {
    return -1;
  }

  return Math.floor((_lng - minLng) / stepSizeLng);
}

// Will return the middle of the box 
// TODO: check boundary conditions
function getLatFromBoxLatNumber(_latNumber) {
  return minLat + ((_latNumber + 0.5) * stepSizeLat);
}
function getLngFromBoxLngNumber(_lngNumber) {
  return minLng + ((_lngNumber + 0.5) * stepSizeLng);
}


var dataByTime = [];
for (var i = 0; i < 24; i += 1) { dataByTime[i] = []; }
for (var i = 1; i < data.length; i += 1) {
  dataByTime[data[i].hour].push(data[i]);
}



// Return clean boxed data
function getCleanBoxedData(data) {
  var boxedData = []
    , maxCount = 0
    , cleanBoxedData = []
    , i, j
    ;

  for (i = 0; i <= resolution; i += 1) {
    boxedData[i] = []
    for (j = 0; j <= resolution; j += 1) {
      boxedData[i][j] = { lat: getLatFromBoxLatNumber(i), lng: getLngFromBoxLngNumber(j), count: 0 };
    }
  }

  console.log("Initialization of boxed data done");

  for (i = 0; i < data.length; i += 1) {
    boxedLat = getBoxedLatNumber(data[i].lat)
    boxedLng = getBoxedLngNumber(data[i].lng)
    
    if (boxedLat !== -1 && boxedLng !== -1) {
      boxedData[boxedLat][boxedLng].count += 1;
    }
  }

  console.log("Data boxed");

  for (i = 0; i <= resolution; i += 1) {
    for (j = 0; j <= resolution; j += 1) {
      if (boxedData[i][j].count > 0) {
        maxCount = Math.max(maxCount, boxedData[i][j].count);
        cleanBoxedData.push(boxedData[i][j]);
      }
    }
  }

  console.log("Boxed data cleaned");
  
  return { max: maxCount / 4, data: cleanBoxedData};
}



// Calculating clean boxed data by time
var cleanBoxedDataByTime = {};
for (i = 0; i < 24; i += 1) {
  console.log("-------------------------- " + i);
  cleanBoxedDataByTime[i] = getCleanBoxedData(dataByTime[i]);
}



out = "var testData=" + JSON.stringify(getCleanBoxedData(data)) + ";";
out += "var center = {lat: " + center.lat + ", lng: " + center.lng + "};"
out += "var timedData=" + JSON.stringify(cleanBoxedDataByTime) + ";";

fs.writeFileSync(outFile, out, 'utf8');





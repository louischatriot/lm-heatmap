var fs = require('fs')
  , _ = require('underscore')
  , datafile = 'data/c.csv'
  , outFile = 'data/out.js'
  , resolution = 1000   // Number of boxes on one line
  , stepSizeLat, stepSizeLng
  , center
  , out
  , limit
  , rawData, _data, data = [], boxedData, cleanBoxedData = []    // Boxed data is a double map with a lot of zeroes while cleanBoxedData is the list of meaningful data points
  , maxCount = 0
  , minLon, minLat, maxLon, maxLat
  , boxedLat, boxedLng
  , temp, i, j
  ;
  
console.log("=== Loading raw data");

rawData = fs.readFileSync(datafile, 'utf8')

console.log("=== Loading done, structuring data");

_data = rawData.split('\r\n');
temp = _data[0].split(';');
center = { lat: temp[1], lng: temp[2] };
for (i = 1; i < (limit || _data.length); i += 1) {
  temp = _data[i].split(';');
  if (temp.length === 3) {
    data.push({lat: parseFloat(temp[1]), lng: parseFloat(temp[2]), count: 1});
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

boxedData = [];
for (i = 0; i <= resolution; i += 1) {
  boxedData[i] = []
  for (j = 0; j <= resolution; j += 1) {
    boxedData[i][j] = { lat: getLatFromBoxLatNumber(i), lng: getLngFromBoxLngNumber(j), count: 0 };
  }
}

console.log("Initialization of boxed data done");

for (i = 0; i < data.length; i += 1) {
  // console.log("---");
  // console.log(data[i]);
  // console.log(getBoxedLatNumber(data[i].lat));
  // console.log(getBoxedLngNumber(data[i].lng));
  
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


out = "var testData=" + JSON.stringify({ max: 200, data: cleanBoxedData}) + ";";
out += "var center = {lat: " + center.lat + ", lng: " + center.lng + "}"
fs.writeFileSync(outFile, out, 'utf8');





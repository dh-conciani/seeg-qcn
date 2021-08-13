// Extract statistical parameters from rectified CT 
// For any issue/bug, please write to dhemerson.costa@ipam.org.br or edriano.souza@ipam.org.br
// Developed by: IPAM, SEEG and OC
// Citing: SEEG/Observatório do Clima and IPAM

/* @. Set user parameters *///
// Define the root imageCollection
var root = 'users/dhconciani/SEEG/rectv1';

// Define files to be assessed 
var file_static = 'static_v1';
var file_accumm = 'accumm_v1';

// define yuears to be assessed
var list_year = [1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996,
                 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008,
                 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019];

///////////////////////////////////////
/* @. Don't change below this line *///
///////////////////////////////////////

// read as images
var image_static = ee.Image(root + '/' + file_static);
var image_accumm = ee.Image(root + '/' + file_accumm);

// Import vectorial data
var eco_regions = ee.FeatureCollection('users/dhconciani/base/ECORREGIOES_CERRADO_V7');

// Create an empty table to receive data 
var table = ee.FeatureCollection([]);

// for each year
list_year.forEach(function(process_year){
  var static_i = image_static.select(['rect_' + process_year]); // select the year i for static asset
  var accumm_i = image_accumm.select(['rect_' + process_year]); // select the year i for accumm asset
  
  // define function to compute statistics per region
  // for the static design
  var computeStatic = function(feature) {
    // mean
    var mean_i = static_i.reduceRegion({
                          reducer: ee.Reducer.mean(),
                          geometry: feature.geometry(),
                          scale: 30,
                          maxPixels: 1e13 });
    // median
    var median_i = static_i.reduceRegion({
                            reducer: ee.Reducer.mean(),
                            geometry: feature.geometry(),
                            scale: 30,
                            maxPixels: 1e13 });
    // standard deviation
    var std_i = static_i.reduceRegion({
                            reducer: ee.Reducer.stdDev(),
                            geometry: feature.geometry(),
                            scale: 30,
                            maxPixels: 1e13 });
    // sum 
    var sum_i = static_i.reduceRegion({
                            reducer: ee.Reducer.sum(),
                            geometry: feature.geometry(),
                            scale: 30,
                            maxPixels: 1e13 });

    return feature.set('ct_mean', ee.Number(mean_i.get('rect_' + process_year)))
                  .set('ct_median', ee.Number(median_i.get('rect_' + process_year)))
                  .set('ct_stdDev', ee.Number(std_i.get('rect_' + process_year)))
                  .set('ct_sum', ee.Number(sum_i.get('rect_' + process_year)))
                  .set('year', process_year)
                  .set('design', 'static');
  };
  
  // for the accum design
  var computeAccumm = function(feature) {
    // mean
    var mean_i = accumm_i.reduceRegion({
                          reducer: ee.Reducer.mean(),
                          geometry: feature.geometry(),
                          scale: 30,
                          maxPixels: 1e13 });
    // median
    var median_i = accumm_i.reduceRegion({
                            reducer: ee.Reducer.mean(),
                            geometry: feature.geometry(),
                            scale: 30,
                            maxPixels: 1e13 });
    // standard deviation
    var std_i = accumm_i.reduceRegion({
                            reducer: ee.Reducer.stdDev(),
                            geometry: feature.geometry(),
                            scale: 30,
                            maxPixels: 1e13 });
    // sum 
    var sum_i = accumm_i.reduceRegion({
                            reducer: ee.Reducer.sum(),
                            geometry: feature.geometry(),
                            scale: 30,
                            maxPixels: 1e13 });

    return feature.set('ct_mean', ee.Number(mean_i.get('rect_' + process_year)))
                  .set('ct_median', ee.Number(median_i.get('rect_' + process_year)))
                  .set('ct_stdDev', ee.Number(std_i.get('rect_' + process_year)))
                  .set('ct_sum', ee.Number(sum_i.get('rect_' + process_year)))
                  .set('year', process_year)
                  .set('design', 'accumm');
  };
  
  // run functions
  var parameters_static_i = eco_regions.map(computeStatic);
  var parameters_accumm_i = eco_regions.map(computeAccumm);
  // merge data
  var parameters_i = parameters_static_i.merge(parameters_accumm_i);
  // and paste to recipe
  table = table.merge(parameters_i);
});

// print sample
print (table.first());

// Export as CSV file to GDrive
Export.table.toDrive({
  collection: table,
  description: 'rect_statistics',
  folder: 'gee',
  fileFormat: 'CSV'
});

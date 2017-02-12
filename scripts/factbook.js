var format = d3.format(",");

var margin = { top: 0, right: 60, bottom: 0, left: 0 },
  width = 900,
  height = 500;

var descriptors = [
  {
    name: "Population", file: "world-population.tsv", 
    domain: [10000, 100000, 500000, 1000000, 5000000, 10000000, 50000000, 100000000, 500000000, 1500000000],
    colorBegin: "white",
    colorMiddle: "#2196F3",
    colorEnd: "black"
  },
  {
    name: "Area", file: "world-area.tsv", 
    domain: [10000, 50000, 100000, 500000, 1000000, 5000000, 10000000, 50000000],
    colorBegin: "white",
    colorMiddle: "#7E57C2",
    colorEnd: "black"
  }
];
      
var toolTip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);
	
var svg = d3.select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height).call(d3.zoom().on("zoom", function() {
    // 
    map.attr("transform", d3.event.transform);
  }));
    
var root = svg
  .append('g');

root.append('rect')
  .attr('class', 'map')
  .attr("width", width - margin.left - margin.right)
  .attr("height", height - margin.top - margin.bottom)
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	  
var projection = d3.geoMercator()
  .scale(143)
  .translate([width / 2, height / 1.5]);

var path = d3.geoPath().projection(projection);

queue()
  .defer(d3.json, "/resources/world-50m.json")
  .defer(d3.tsv, "/resources/world-country-names.tsv")
  .await(readyMap);

var countryNames = {};
var countries, neighbors;
var map;
    
function readyMap(error, data, names) {
  names.forEach(function (d) { countryNames[d.name] = d.id; });
      
  countries = window.topojson.feature(data, data.objects.countries).features;
  neighbors = window.topojson.neighbors(data.objects.countries.geometries);
      
  map = root.append("g")
    .attr("class", "countries")
      
  loadMap(0);
}
    
function loadMap(index) {
  queue()
    .defer(d3.tsv, "/resources/" + descriptors[index].file)
    .await(function(e, d) { return updateMap(e, d, descriptors[index]) });      
}
    
function formatAbbreviation(x) {
  var s = textFormatSI(x);
  s = s.replace(".0", ""); // does not make sense
  switch (s[s.length - 1]) {
    case "G": return s.slice(0, -1) + "B";
    case "k": return s.slice(0, -1) + "K";
  }
  return s;
}
    
var legend = svg.append("g")
  .attr("class", "legend")
  .attr("transform", "translate(" + (width - margin.right) + "," + margin.top + ")");

var legendRect = legend.append("rect")
  .style("opacity", 0.8)
  .style("fill", "white")
  .attr("width", margin.right)
  .attr("height", height);
		
var textFormatSI = d3.format(".2s");
    
function updateLegend(scale) {      
  var cellHeight = 10;
  var cellColorWidth = 20;
  var marginTop = 200;
	  
  var cellColorsSelection = legend.selectAll(".cell-color")
    .data(scale.range());
      
	cellColorsSelection.enter()
    .append("rect")
    .attr("class", "cell-color")
  .merge(cellColorsSelection)
    .style("fill", function(d) { return d;})
    .attr("transform", function(d, i) { return "translate(5," + (marginTop + i * (cellHeight + 2)) + ")"})
    .attr("width", cellColorWidth)      
    .attr("height", cellHeight);
        
  cellColorsSelection.exit().remove();
      
  var cellTextSelection = legend.selectAll(".cell-text")
    .data([0].concat(scale.domain()));       // TODO: remove [0] concat
        
	cellTextSelection.enter()
    .append("text")
    .attr("class", "cell-text")
    .attr("transform", function(d, i) { return "translate(30," + (marginTop + 3 + i * (cellHeight + 2)) + ")"})
  .merge(cellTextSelection)
    .text(function(d) { return formatAbbreviation(d);});
      
  cellTextSelection.exit().remove();
}
	
function updateMap(error, parameter, descriptor) {
  var parameterById = {};
  var parameterNames = {};
      
  parameter.forEach(function (d) {
    parameterNames[d.country] = true;
  });
      
  var colorInterpolator = d3.interpolateRgbBasis([descriptor.colorBegin, descriptor.colorMiddle, descriptor.colorEnd]);
      
  var color = d3.scaleThreshold()
    .domain(descriptor.domain)
    .range(d3.quantize(colorInterpolator, descriptor.domain.length));
      
  console.log("Countries 1");
  parameter.forEach(function (d) {
    if (!countryNames[d.country]) {
      console.log(d.country);
    }
  });

  parameter.forEach(function (d) { parameterById[countryNames[d.country]] = { country: d.country, value: +d.value}; });

  console.log("Countries 2");
  Object.keys(countryNames).forEach(function (d) {
    if (!parameterNames[d.name]) {
      console.log(d.name);
    }
  });
      
  countries.forEach(function (c) {
	  var entry = parameterById[c.id];
	  if (entry) {
	    c.value = entry.value;
		  c.country = entry.country;
	  }
  });
      
  var countriesSelection = map
    .selectAll(".country")
    .data(countries);
      
  countriesSelection.enter()
    .append("path")
    .attr("class", "country")
    .attr("d", path)
    .attr("r_id", function(d) { return d.id; })
  .merge(countriesSelection)
    .style("fill", function (d) { var entry = parameterById[d.id]; return color(entry ? entry.value : 0); })
    .on('mouseover', function (d) {		  
		  if (d.country) {
	  		  toolTip.transition()
	           	.duration(200)
	           	.style("opacity", .9);
	  		  toolTip.html("<b>" + d.country + "</b><br/>" + format(d.value))
	              .style("left", (d3.event.pageX) + "px")
	              .style("top", (d3.event.pageY - 28) + "px");
		  }
			
      d3.select(this)
        .classed("country-selected", true);
    })
    .on('mouseout', function (d) {
		  if (d.country) {
		      toolTip.transition()
			  	.duration(200)
			    .style("opacity", 0);
		  }				
      d3.select(this)
        .classed("country-selected", null);
    });
        
  updateLegend(color);
}

var format = d3.format(",");

var margin = { top: 0, right: 60, bottom: 0, left: 0 },
  width = 900,
  height = 500;

var descriptors = [
  {
    name: "Area", file: "world-area.tsv", 
    domain: [10000, 50000, 100000, 500000, 1000000, 5000000, 10000000, 50000000],
    colorBegin: "white",
    colorMiddle: "#7E57C2",
    colorEnd: "black"
  },
  {
    name: "Population", file: "world-population.tsv", 
    domain: [10000, 100000, 500000, 1000000, 5000000, 10000000, 50000000, 100000000, 500000000, 1500000000],
    colorBegin: "white",
    colorMiddle: "#2196F3",
    colorEnd: "black"
  },
  {
    name: "GDP - parity", file: "gdp-ppp.tsv", 
    domain: [1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13, 5e13],
    colorBegin: "white",
    colorMiddle: "#F44336",
    colorEnd: "black"
  },
  {
    name: "GPD - per capita", file: "gdp-percapita.tsv", 
    domain: [500, 1000, 5000, 10000, 20000, 30000, 50000, 100000, 150000],
    colorBegin: "white",
    colorMiddle: "#4CAF50",
    colorEnd: "black"
  },
  {
    name: "GPD - real growth", file: "gdp-real-growth.tsv", 
    domain: [-8, -4, -2, -1, 0, 1, 2, 4, 8],
    colorBegin: "red",
    colorMiddle: "#C0C0C0",
    colorEnd: "green"
  },
  {
    name: "Industry growth", file: "industry-growth.tsv", 
    domain: [-8, -4, -2, -1, 0, 1, 2, 4, 8],
    colorBegin: "red",
    colorMiddle: "#C0C0C0",
    colorEnd: "green"
  },
  {
    name: "Inflation", file: "inflation.tsv", 
    domain: [-4, -3, -2, -1, 0, 2, 4, 10, 20],
    colorBegin: "blue",
    colorMiddle: "white",
    colorEnd: "red"
  },
  {
    name: "Birth rate", file: "birth-rate.tsv", 
    domain: [7, 12, 16, 20, 24, 28, 32, 36, 40, 48],
    colorBegin: "#FFE0B2",
    colorMiddle: "#FF9800",
    colorEnd: "#BF360C"
  },
  {
    name: "Death rate", file: "death-rate.tsv", 
    domain: [2, 4, 6, 8, 10, 12, 14, 16],
    colorBegin: "white",
    colorMiddle: "#795548",
    colorEnd: "black"
  },
  {
    name: "Life expectancy at birth", file: "life-expectancy-birth.tsv", 
    domain: [55, 60, 65, 70, 75, 80, 85],
    colorBegin: "#FFE0B2",
    colorMiddle: "#FF9800",
    colorEnd: "#BF360C"
  },
  {
    name: "Net migration", file: "net-migration.tsv", 
    domain: [-16, -8, -4, -2, 0, 2, 4, 8, 16],
    colorBegin: "red",
    colorMiddle: "#C0C0C0",
    colorEnd: "green"
  },
  {
    name: "Unemployment", file: "unemployment.tsv", 
    domain: [2, 5, 10, 15, 20, 30, 40, 50],
    colorBegin: "#F8BBD0",
    colorMiddle: "#AD1457",
    colorEnd: "black"
  },
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
    .data(scale.domain());
        
	cellTextSelection.enter()
    .append("text")
    .attr("class", "cell-text")
    .attr("transform", function(d, i) { return "translate(30," + (marginTop + 3 + (i + 1) * (cellHeight + 2)) + ")"})
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
    .range(d3.quantize(colorInterpolator, descriptor.domain.length + 1));
      
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

function renderList(el) {
  for (var i = 0; i < descriptors.length; i++) {
    var li = document.createElement('li');
    var a = document.createElement('a');
    var desc = descriptors[i];
    a.innerText = desc.name;
    a.addEventListener("click", loadMap.bind(this, i));
    a.href = "#" + desc.file;  
    li.appendChild(a);
    el.appendChild(li);
  }
}
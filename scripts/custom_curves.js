//import * as d3 from 'd3';
var margin = { top: 0, right: 60, bottom: 0, left: 0 }, width = 900, height = 600;
var root;
var projection = d3.geoMercator()
    .scale(700)
    .translate([450, 1050]);
var path = d3.geoPath().projection(projection);
function main() {
    var svg = d3.select('body')
        .append('svg') // create an <svg> element
        .attr('width', width) // set its dimentions
        .attr('height', height);
    // show the map
    root = svg
        .append('g');
    root.append('rect')
        .attr('class', 'map')
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    d3.queue()
        .defer(d3.json, "/resources/world-50m.json")
        .defer(d3.tsv, "/resources/world-country-names.tsv")
        .await(readyMap);
}
var countryNames = {};
var countryIds = {};
var countries, neighbors;
var map;
var selectedCountries = ["Germany",
    "Netherlands",
    "Sweden",
    "United Kingdom",
    "Switzerland",
    "Ukraine",
    "Czechia",
    "Poland",
    "Denmark"];
function sign(x) {
    return x < 0 ? -1 : (x == 0 ? 0 : 1);
}
function readyMap(error, data, names) {
    names.forEach(function (d) { countryNames[d.name] = d.id; countryIds[d.id] = d.name; });
    var selectedIds = {};
    selectedCountries.forEach(function (c) { return selectedIds[c] = countryNames[c]; });
    countries = window.topojson.feature(data, data.objects.countries).features;
    neighbors = window.topojson.neighbors(data.objects.countries.geometries);
    var centroids = countries.map(function (c) { return ({
        selected: selectedIds[countryIds[c.id]],
        point: path.centroid(c)
    }); });
    map = root.append("g")
        .attr("class", "countries");
    var countriesSelection = map
        .selectAll(".country")
        .data(countries);
    countriesSelection.enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("r_id", function (d) { return d.id; })
        .merge(countriesSelection);
    var centroidsSelection = root.append("g")
        .attr("class", "centroids")
        .selectAll(".center")
        .data(centroids);
    centroidsSelection.enter()
        .append("circle")
        .attr("class", "centroid")
        .attr("r", "2")
        .attr("cx", function (d) { return d.point[0]; })
        .attr("cy", function (d) { return d.point[1]; })
        .attr("fill", function (d) { return d.selected ? "green" : "red"; })
        .merge(centroidsSelection);
    var filteredCentroids = centroids.filter(function (f) { return f.selected; });
    var flowData = [];
    for (var i = 0; i < filteredCentroids.length - 1; i++) {
        for (var j = i + 1; j < filteredCentroids.length; j++) {
            flowData.push({
                from: filteredCentroids[i],
                to: filteredCentroids[j],
                flow: Math.random()
            });
        }
    }
    var flows = root.append("g")
        .attr("class", "flows")
        .selectAll(".flow")
        .data(flowData);
    flows.enter()
        .append("path")
        .attr("class", "flow")
        .attr("d", function (d) {
        var dx = d.to.point[0] - d.from.point[0], dy = d.to.point[1] - d.from.point[1];
        var c1x = dx / 2 + d.from.point[0], c1y = dy / 2 + d.from.point[1];
        var c2dx = dy == 0 ? 0 : 1 / Math.sqrt(1 + (dx / dy) * (dx / dy)) * sign(dy), c2dy = dy == 0 ? 1 : c2dx * dx / dy;
        var distance = Math.sqrt(dx * dx + dy * dy);
        var c2x = c1x - c2dx * d.flow * distance / 5, c2y = c1y + c2dy * d.flow * distance / 5;
        /*return `M ${d.from.point[0]} ${d.from.point[1]}` +
            `L ${c1x} ${c1y} L ${c2x} ${c2y} L ${d.to.point[0]} ${d.to.point[1]}`;*/
        return "M " + d.from.point[0] + " " + d.from.point[1] +
            ("C " + c1x + " " + c1y + " " + c2x + " " + c2y + " " + d.to.point[0] + " " + d.to.point[1]);
    });
}

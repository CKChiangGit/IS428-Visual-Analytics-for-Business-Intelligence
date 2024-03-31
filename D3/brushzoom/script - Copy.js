{/* <script> */}
// set the dimensions and margins of the graph
var margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
var Svg = d3.select("#dataviz_brushZoom")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

//Read the data
d3.csv("https://raw.githubusercontent.com/CKChiangGit/SMU-VABI/master/CO2%20Emissions%20(Cleaned)%20Final.csv").then(function(data) {

  var x_data = "Area (km2)";
  var y_data = "CO2 emission (Tons)";
  var symbol_var = "Continent"
  var colour_var = "Country";
  var TICKS = 4;
  var font_size = 10;
  var font = "sans-serif";

  // Parse strings to numbers
  data.forEach(function(d) {
    d[x_data] = +d[x_data];
    d[y_data] = +d[y_data];
  });

  // Group the data by country
  var dataByCountry = d3.nest()
  .key(function(d) { return d[colour_var]; })
  .entries(data);

  // Calculate the average CO2 emission for each country
  var dataAvg = dataByCountry.map(function(country) {
  var values = country.values;
  var sum = d3.sum(values, function(d) { return d[y_data]; });
  var count = values.length;
  var average = sum / count;
  return { [colour_var]: country.key, [y_data]: average, [x_data]: values[0][x_data], [symbol_var]: values[0][symbol_var] };
  });

  // Use the new dataset with averages
  data = dataAvg;
  console.log(d3.max(data, function(d) { return d[y_data]; }))

  // Add X axis
  var x = d3.scaleLinear()
    .domain([d3.min(data, function(d) { return d[x_data]; }) , d3.max(data, function(d) { return d[x_data]; }) * 1.1])
    .range([ 0, width ]);

  function formatAxisValues(value) {
    if (value >= 1000000000) {
        return (value / 1000000000).toFixed(1) + 'B';
    } else if (value >= 1000000) {
      return (value / 1000).toFixed(1) + 'M';
    } else if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'K';
    } else {
        return value;
    }
  }
  var xAxis = Svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).ticks(TICKS).tickFormat(formatAxisValues));

  // Add Y axis
  var y = d3.scaleLinear()
    .domain([0, d3.max(data, function(d) { return d[y_data]; }) * 1.1])
    .range([ height, 0]);
  Svg.append("g")
    .call(d3.axisLeft(y).ticks(TICKS).tickFormat(formatAxisValues));

  // X axis title
  Svg.append("text")
    .attr("font-family", font)
    .attr("font-size", font_size)
    .attr("x", width - margin.right)
    .attr("y", height - margin.bottom * 0.2 ) 
    .html(x_data);

  // Y axis title
  Svg.append("text")
    .attr("font-family", font)
    .attr("font-size", 10)
    .attr("x", margin.top) // Adjust this value as needed
    .attr("y", margin.top) // Adjust this value as needed
    .html(y_data); // shows the variable name

  // Add a clipPath: everything out of this area won't be drawn.
  var clip = Svg.append("defs").append("svg:clipPath")
      .attr("id", "clip")
      .append("svg:rect")
      .attr("width", width )
      .attr("height", height )
      .attr("x", 0)
      .attr("y", 0)

  // Get unique values of "Continent"
  var continents = Array.from(d3.map(data, function(d){return d.Continent;}).keys());

  // Color scale: give me a continent name, I return a color
  var color = d3.scaleOrdinal()
    .domain(continents)
    .range(continents.map(function(d, i) { return d3.interpolateRainbow(i / continents.length); }));

  // Add brushing
  var brush = d3.brushX()                 // Add the brush feature using the d3.brush function
      .extent( [ [0,0], [width,height] ] ) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
      .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function

  // Create the scatter variable: where both the circles and the brush take place
  var scatter = Svg.append('g')
    .attr("clip-path", "url(#clip)")


  // Define a mapping from 'Continent' values to symbols
  let symbolMapping = {
    'Asia': d3.symbolSquare,
    'Europe': d3.symbolCross,
    'Africa': d3.symbolCircle,
    'North America': d3.symbolDiamond,
    'South America': d3.symbolStar,
    'Oceania': d3.symbolWye
  };

  // Create a symbol generator
  let symbolGenerator = d3.symbol()
    .size(64) // Adjust size as needed
    .type(d => symbolMapping[d[symbol_var]]);

  // Add the brushing effect before the symbols so it doesn't interfere with the tooltip
  scatter
  .append("g")
    .attr("class", "brush")
    .call(brush);
  
  // Add symbols with tooltip
  var tooltip = d3.select("#tooltip");
  scatter
    .selectAll("path")
    .data(data)
    .enter()
    .append("path")
      .attr('d', symbolGenerator)
      .attr('transform', d => `translate(${x(d[x_data])}, ${y(d[y_data])})`)
      .style("fill", d => color(d.Continent))
      .style("opacity", 0.5)
      .on("mouseover", function(d) { // tooltip function start
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html("Country: " + d[colour_var] + "<br/>" + y_data + ": " + d[y_data])
          .style("left", (d3.event.pageX + 5) + "px")
          .style("top", (d3.event.pageY - 28) + "px")
          .style("font-family", font) 
          .style("font-size", font_size + 'px' ); 
      })
      .on("mousemove", function(d) {
        tooltip
          .style("left", (d3.event.pageX + 5) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      }); // tooltip function end



  // A function that set idleTimeOut to null
  var idleTimeout
  function idled() { idleTimeout = null; }

  // A function that update the chart for given boundaries
  function updateChart() {

    extent = d3.event.selection

    // If no selection, back to initial coordinate. Otherwise, update X axis domain
    if(!extent){
      if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
      x.domain([ 0, d3.max(data, function(d) { return d[x_data]; })])
    }else{
      x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
      scatter.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
    }

    // Update axis and circle position
    xAxis.transition().duration(1000).call(d3.axisBottom(x).ticks(TICKS).tickFormat(formatAxisValues))
    scatter
      .selectAll("path")
      .transition().duration(1000)
      .attr('transform', d => `translate(${x(d[x_data])}, ${y(d[y_data])})`);

  }

  // Add a legend
  const legends = Svg
    .append("g")
    .attr(
      "transform",
      `translate(${width - margin.right * 2}, ${0})`
    )
    .style("font-size", font_size)
    .style("font-family", font);

  // Add one dot in the legend for each category
  let legendSymbolGenerator = d3.symbol()
  .size(64) // Adjust size as needed
  .type(continent => symbolMapping[continent]);
  legends.selectAll("mydots")
  .data(continents)
  .enter()
  .append("path")
    .attr('d', legendSymbolGenerator)
    .attr('transform', (d, i) => `translate(${0}, ${100 + i * margin.top * 2})`)
    .style("fill", function(d){ return color(d)});
      

  // Add one label in the legend for each category
  legends.selectAll("mylabels")
    .data(continents)
    .enter()
    .append("text")
      .attr("x", width * 0.03)
      .attr("y", function(d,i){ return 100 + i * margin.top * 2}) 
      .style("fill", function(d){ return color(d)})
      .text(function(d){ return d})
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle");

})


// var oReq = new XMLHttpRequest();
// oReq.open("GET", "../../CO2 Emissions (Cleaned) Final.xlsx", true);
// oReq.responseType = "arraybuffer";

// oReq.onload = function(e) {
//   var arraybuffer = oReq.response;

//   /* convert data to binary string */
//   var data = new Uint8Array(arraybuffer);
//   var arr = new Array();
//   for(var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
//   var bstr = arr.join("");

//   /* Call XLSX */
//   var workbook = XLSX.read(bstr, {type:"binary"});

//   /* DO SOMETHING WITH workbook HERE */
//   var first_worksheet = workbook.Sheets[workbook.SheetNames[0]];
//   var second_worksheet = workbook.Sheets[workbook.SheetNames[1]];
//   var data = XLSX.utils.sheet_to_json(first_worksheet,{raw:true});
//   var continentData = XLSX.utils.sheet_to_json(second_worksheet,{raw:true});

//   // Create a lookup object that maps from country to continent
//   var countryToContinent = {};
//   continentData.forEach(function(row) {
//     countryToContinent[row.Country] = row.Continent;
//   });

//   // Add the continent to each data point
//   data.forEach(function(row) {
//     row.Continent = countryToContinent[row.Country];
//   });

//   // Now you can use the data as you would with d3.csv
//   createVisualization(data); // replace this with your actual visualization function
// }

// oReq.send();


// function createVisualization(data) {
//   // your visualization code here
//   var x_data = "CO2 emission (Tons)";
//   console.log(d3.max(data, function(d) { return d[x_data]; }));

//   // Add X axis
//   var x = d3.scaleLinear()
//     .domain([4, d3.max(data, function(d) { return d[x_data]; })])
//     .range([ 0, width ]);
//   var xAxis = Svg.append("g")
//     .attr("transform", "translate(0," + height + ")")
//     .call(d3.axisBottom(x));

//   // Add Y axis
//   var y = d3.scaleLinear()
//     .domain([0, 9])
//     .range([ height, 0]);
//   Svg.append("g")
//     .call(d3.axisLeft(y));

//   // Add a clipPath: everything out of this area won't be drawn.
//   var clip = Svg.append("defs").append("svg:clipPath")
//       .attr("id", "clip")
//       .append("svg:rect")
//       .attr("width", width )
//       .attr("height", height )
//       .attr("x", 0)
//       .attr("y", 0);

//   // Color scale: give me a specie name, I return a color
//   var color = d3.scaleOrdinal()
//     .domain(["setosa", "versicolor", "virginica" ])
//     .range([ "#440154ff", "#21908dff", "#fde725ff"])

//   // Add brushing
//   var brush = d3.brushX()                 // Add the brush feature using the d3.brush function
//       .extent( [ [0,0], [width,height] ] ) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
//       .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function

//   // Create the scatter variable: where both the circles and the brush take place
//   var scatter = Svg.append('g')
//     .attr("clip-path", "url(#clip)")

//   // Add circles
//   scatter
//     .selectAll("circle")
//     .data(data)
//     .enter()
//     .append("circle")
//       .attr("cx", function (d) { return x(d["CO2 emission (Tons)"]); } )
//       .attr("cy", function (d) { return y(d["Area (km2)"]); } )
//       .attr("r", 8)
//       .style("fill", function (d) { return color(d.Species) } )
//       .style("opacity", 0.5)

//   // Add the brushing
//   scatter
//     .append("g")
//       .attr("class", "brush")
//       .call(brush);

//   // A function that set idleTimeOut to null
//   var idleTimeout
//   function idled() { idleTimeout = null; }

//   // A function that update the chart for given boundaries
//   function updateChart() {

//     extent = d3.event.selection

//     // If no selection, back to initial coordinate. Otherwise, update X axis domain
//     if(!extent){
//       if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
//       x.domain([ 4,8])
//     }else{
//       x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
//       scatter.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
//     }

//     // Update axis and circle position
//     xAxis.transition().duration(1000).call(d3.axisBottom(x))
//     scatter
//       .selectAll("circle")
//       .transition().duration(1000)
//       .attr("cx", function (d) { return x(d.Sepal_Length); } )
//       .attr("cy", function (d) { return y(d.Petal_Length); } )

//     }
// }



// d3.csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/iris.csv", function(data) {

//   // Add X axis
//   var x = d3.scaleLinear()
//     .domain([4, 8])
//     .range([ 0, width ]);
//   var xAxis = Svg.append("g")
//     .attr("transform", "translate(0," + height + ")")
//     .call(d3.axisBottom(x));

//   // Add Y axis
//   var y = d3.scaleLinear()
//     .domain([0, 9])
//     .range([ height, 0]);
//   Svg.append("g")
//     .call(d3.axisLeft(y));

//   // Add a clipPath: everything out of this area won't be drawn.
//   var clip = Svg.append("defs").append("svg:clipPath")
//       .attr("id", "clip")
//       .append("svg:rect")
//       .attr("width", width )
//       .attr("height", height )
//       .attr("x", 0)
//       .attr("y", 0);

//   // Color scale: give me a specie name, I return a color
//   var color = d3.scaleOrdinal()
//     .domain(["setosa", "versicolor", "virginica" ])
//     .range([ "#440154ff", "#21908dff", "#fde725ff"])

//   // Add brushing
//   var brush = d3.brushX()                 // Add the brush feature using the d3.brush function
//       .extent( [ [0,0], [width,height] ] ) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
//       .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function

//   // Create the scatter variable: where both the circles and the brush take place
//   var scatter = Svg.append('g')
//     .attr("clip-path", "url(#clip)")

//   // Add circles
//   scatter
//     .selectAll("circle")
//     .data(data)
//     .enter()
//     .append("circle")
//       .attr("cx", function (d) { return x(d.Sepal_Length); } )
//       .attr("cy", function (d) { return y(d.Petal_Length); } )
//       .attr("r", 8)
//       .style("fill", function (d) { return color(d.Species) } )
//       .style("opacity", 0.5)

//   // Add the brushing
//   scatter
//     .append("g")
//       .attr("class", "brush")
//       .call(brush);

//   // A function that set idleTimeOut to null
//   var idleTimeout
//   function idled() { idleTimeout = null; }

//   // A function that update the chart for given boundaries
//   function updateChart() {

//     extent = d3.event.selection

//     // If no selection, back to initial coordinate. Otherwise, update X axis domain
//     if(!extent){
//       if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
//       x.domain([ 4,8])
//     }else{
//       x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
//       scatter.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
//     }

//     // Update axis and circle position
//     xAxis.transition().duration(1000).call(d3.axisBottom(x))
//     scatter
//       .selectAll("circle")
//       .transition().duration(1000)
//       .attr("cx", function (d) { return x(d.Sepal_Length); } )
//       .attr("cy", function (d) { return y(d.Petal_Length); } )

//     }



// })

// </script>
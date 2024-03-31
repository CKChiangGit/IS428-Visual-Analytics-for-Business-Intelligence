// set the dimensions and margins of the graph
var margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// // append the svg object to the body of the page
// var Svg = d3.select("#dataviz_brushZoom")
//   .append("svg")
//     .attr("width", width + margin.left + margin.right)
//     .attr("height", height + margin.top + margin.bottom)
//   .append("g")
//     .attr("transform",
//           "translate(" + margin.left + "," + margin.top + ")");

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

//Read the data
d3.csv("https://raw.githubusercontent.com/CKChiangGit/SMU-VABI/master/CO2%20Emissions%20(Cleaned)%20Final.csv").then(function(data) {

    var x_data = "Per capita electricity (kWh)";
    var y_data = "CO2 emission (Tons)";
    var symbol_var = "Continent"
    var colour_var = "Country";
    var TICKS = 4;
    var font_size = 10;
    var font = "sans-serif";
    var date_var = 'Year'
    var x_max = 60000 // 58863.361
    var y_max = 425000000000 // 417000000000
    
    // Find the minimum date_var in the data
    var minDateVar = d3.min(data, d => d[date_var]);

    // Filter the data to only include rows where date_var is equal to the minimum
    var filteredData = data.filter(d => d[date_var] == minDateVar);
    // Group the data by continent
    var grouped = d3.group(filteredData, d => d[symbol_var]);
    console.log(grouped)

    // Parse the date_var and get the avg x and y variables
    var sortData = [];
    // grouped.forEach((value, key) => {
    //     var avg_x_data = d3.mean(value, d => d[x_data]);
    //     var avg_y_data = d3.mean(value, d => d[y_data]);
    //     sortData.push({
    //         [symbol_var]: key,
    //         [x_data]: avg_x_data,
    //         [y_data]: avg_y_data,
    //         [date_var]: d[date_var]
    //     });
    // });

    // Parse the date_var and get the individual countries
    grouped.forEach((value, key) => {
        console.log(value, key)
        value.forEach(d => {
            sortData.push({
                [symbol_var]: key,
                [x_data]: d[x_data],
                [y_data]: d[y_data],
                [date_var]: d[date_var],
                [colour_var]: d[colour_var]
            });
        });
    });

    console.log(sortData);

    // Set up the x and y scales
    const x = d3.scaleLinear()
    .range([0, width]);

    const y = d3.scaleLinear()
    .range([height, 0]);

    // Create the SVG element and append it to the chart container
    const svg = d3.select("#chart-container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set the domains for the x and y scales
    // x.domain([0, d3.max(data, d => d[x_data])]);
    // y.domain([0, d3.max(data, d => d[y_data])]);
    x.domain([0, x_max ]); // 23132100000000 
    y.domain([0, y_max]); // 417000000000

    // Add the x-axis
    var xAxis = svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .style("font-size", "14px")
        .call(d3.axisBottom(x).ticks(TICKS).tickFormat(formatAxisValues))
        .selectAll(".tick line")
        .style("stroke-opacity", 1)
    svg.selectAll(".tick text")
        .attr("fill", "#777");

    // Add the y-axis on the left
    svg.append("g")
        .attr("class", "y-axis")
        .style("font-size", "14px")
        .call(d3.axisLeft(y).ticks(TICKS).tickFormat(formatAxisValues))
        .selectAll(".tick text")
        .style("fill", "#777")

    // X axis title
    svg.append("text")
    .attr("font-family", font)
    .attr("font-size", font_size)
    .attr("x", width - margin.right)
    .attr("y", height - margin.bottom * 0.2 ) 
    .html(x_data);

    // Y axis title
    svg.append("text")
    .attr("font-family", font)
    .attr("font-size", 10)
    .attr("x", margin.top) // Adjust this value as needed
    .attr("y", margin.top) // Adjust this value as needed
    .html(y_data); // shows the variable name

    // Add points onto scatter plot with symbols 
    // Define a mapping from 'Continent' values to symbols
    let symbolMapping = {
        'Asia': d3.symbolSquare,
        'Europe': d3.symbolCross,
        'Africa': d3.symbolCircle,
        'North America': d3.symbolDiamond,
        'South America': d3.symbolStar,
        'Oceania': d3.symbolWye
    };

    // Create the point / symbol generator
    let symbolGenerator = d3.symbol()
    .size(64) // Adjust size as needed
    .type(d => symbolMapping[d[symbol_var]]);

    // Get unique values of "Continent"
    var continents = [...new Set(data.map(d => d[symbol_var]))];
    console.log("continents", continents);
    var color = d3.scaleOrdinal()
    .domain(continents)
    .range(continents.map((d, i) => d3.interpolateRainbow(i / continents.length)));  
    
    // // Append the symbols to the SVG
    // svg.selectAll(".symbol")
    // .data(sortData)
    // .enter()
    // .append("path")
    // .attr("class", "symbol")
    // .attr("d", symbolGenerator)
    // .attr("transform", d => `translate(${x(d[x_data])},${y(d[y_data])})`)
    // .style("fill", d => color(d[symbol_var]))
    // .style("stroke", "#000")
    // .style("opacity", 0.5);

    // Add a clipPath: everything out of this area won't be drawn.
    var clip = svg.append("defs").append("svg:clipPath")
    .attr("id", "clip")
    .append("svg:rect")
    .attr("width", width )
    .attr("height", height )
    .attr("x", 0)
    .attr("y", 0)

    // // Add brushing
    var brush = d3.brushX()                 // Add the brush feature using the d3.brush function
    .extent( [ [0,0], [width,height] ] ) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
    .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function

    // Create the scatter variable: where both the circles and the brush take place
    var scatter = svg.append('g')
        .attr("clip-path", "url(#clip)")

    // Add the brushing effect before the symbols so it doesn't interfere with the tooltip
    scatter
    .append("g")
        .attr("class", "brush")
        .call(brush);

    // // Add symbols and tooltip
    var tooltip = d3.select("#tooltip");
    scatter
        .selectAll(".symbol")
        .data(sortData)
        .enter()
        .append("path")
        .attr("class", "symbol")
        .attr('d', symbolGenerator)
        .attr('transform', d => `translate(${x(d[x_data])}, ${y(d[y_data])})`)
        .style("fill", d => color(d[symbol_var]))
        .style("opacity", 0.5)
        .on("mouseover", function(d) { // tooltip function start
            var element_data = d.target.__data__;
            console.log("mouseover", element_data)
            tooltip.transition()
            .duration(200)
            .style("opacity", .9)
            .style("background-color", "white") // Add a white background

            tooltip.html("Continent: " + element_data[symbol_var] + "<br/>" + "Country: " + element_data[colour_var] + "<br/>" + y_data + ": " + element_data[y_data])
            .style("top", (event.pageY - 28) + "px")
            .style("font-family", font) 
            .style("font-size", font_size + 'px' ); 
        })
        .on("mousemove", function(d) {
            tooltip
            .style("left", (event.pageX + 5) + "px")
            .style("top", (event.pageY - 28) + "px");
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
    function updateChart(event) {
        var extent = event.selection;

        // If no selection, back to initial coordinate. Otherwise, update X axis domain
        if(!extent){
            if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
            x.domain([0, x_max]);
        } else {
            x.domain([x.invert(extent[0]), x.invert(extent[1])]);
            scatter.select(".brush").call(brush.move, null); // This remove the grey brush area as soon as the selection has been done
        }

        // Update axis and circle position
        svg.select(".x-axis") // Reselect the x-axis elements
            .transition().duration(1000)
            .call(d3.axisBottom(x).ticks(TICKS).tickFormat(formatAxisValues));
        scatter
            .selectAll(".symbol")
            .transition().duration(1000)
            .attr('transform', d => `translate(${x(d[x_data])}, ${y(d[y_data])})`);
    }

    // Define the slider
    const sliderRange = d3
        .sliderBottom()
        .min(d3.min(data, d => d[date_var]))
        .max(d3.max(data, d => d[date_var]))
        .width(300)
        .tickFormat(d3.format('d'))
        .ticks(3)
        .step(1)
        .default(d3.min(data, d => d[date_var]))
        .fill('#85bb65');


    sliderRange.on('end', val => {
    
        console.log('val:', val); // Log the value of val

        // Filter data based on slider values
        const filteredData = data.filter(d => {
            // console.log(d['Year'] === 1990)
            // console.log(str(val))
            return d[date_var] === val.toString();
        });
        console.log('filteredData:', filteredData); // Log the filtered data

        // // Update the x and y scales
        // x.domain([d3.extent(filteredData, d => d[x_data])]);
        // y.domain(d3.extent(filteredData, d => d[y_data]));
        // x.domain([0, x_max]);
        // y.domain([0, d3.max(data, d => d[y_data])]);

        // // Update the x-axis with new domain
        // svg.select(".x-axis")
        //     .transition()
        //     .duration(300) // transition duration in ms
        //     .call(d3.axisBottom(x).ticks(TICKS).tickFormat(formatAxisValues));
    
        // // Update the y-axis with new domain
        // svg.select(".y-axis")
        //     .transition()
        //     .duration(300) // transition duration in ms
        //     .call(d3.axisLeft(y).ticks(TICKS).tickFormat(formatAxisValues))
    
        // Update the positions of the symbols
        svg.selectAll(".symbol")
            .data(filteredData, d => d[colour_var]) // Use 'Country' as the key
            .transition()
            .duration(300)
            .attr("transform", d => `translate(${x(d[x_data])},${y(d[y_data])})`);
    });

    // Add the slider to the DOM
    const gRange = d3
        .select('#slider-range')
        .append('svg')
        .attr('width', 500)
        .attr('height', 100)
        .append('g')
        .attr('transform', 'translate(90,30)');

    gRange.call(sliderRange);

    // // Add a legend
    const legends = svg.append("g")
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

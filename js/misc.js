
 /*****************************************************************************
  * Switches the position of two elements within an array
  */

function swapArrayItems(u, v, array) {
    let temp = array[u];
    array.splice(u, 1, array[v]);
    array.splice(v, 1, temp);
    return array;
}

/******************************************************************************
 * Tests to see if a number is between (inclusive) two values 
 */

function between(u, a, b) {
    return (u >= a) && (u <= b);
}

/******************************************************************************
 * Tests to see if a number is within an interval (endpoint inclusive) 
 */

function in_interval(u, int) {
    return (u >= int[0]) && (u <= int[1]);
}

/******************************************************************************
 * Sorts an array of intervals from smallest to largest
 */
function sort_intervals(intervals_watched) {

    if (intervals_watched.length >= 2) {

        for (let i = 0; i < intervals_watched.length - 1; i++) {
            for (let j = i+1; j < intervals_watched.length; j++) {

            let [begin_first, end_first] = intervals_watched[i];
            let [begin_next, end_next] = intervals_watched[j];

            // Check to make sure the intervals are valid:
            if ((end_first < begin_first) || (end_next < begin_next)) {
                console.log(`ERROR! Interval is inverted! ${intervals_watched}`);
            } else if (begin_next < begin_first) {
                intervals_watched = swapArrayItems(i, j, intervals_watched);
            }

            }
        }

    }

    return intervals_watched;
}

/******************************************************************************
 * Takes a time stamp and adds it to an interval of values that have been
 *  played back. If it is a timestamp that is more than 3 seconds from another
 *  timestamp, it creates a new interval. Thus the intervals are an array of
 *  arrays like:
 *  
 *   [ [start0, end0], [start1, end1], ..., [startn, endn] ]
 */

function addToPlayedIntervals(current_time, intervals_watched) {
      
    // Initialize array if the video has just been started
    if (intervals_watched.length == 0) {

      if (current_time < 3) {
        intervals_watched.push([0, current_time]);
      } else {
        intervals_watched.push([current_time, current_time + 1]);
      }

    } else {

        // Sort the intervals, if necessary
        intervals_watched = sort_intervals(intervals_watched);

      // Check to see if any adjacent time intervals can be joined
      for (let i = 0; i < intervals_watched.length - 1; i++) {

        let begin_current = intervals_watched[i][0];
        let end_current = intervals_watched[i][1];

        let begin_next = intervals_watched[i+1][0];
        let end_next = intervals_watched[i+1][1];

        if (Math.abs(begin_next - end_current) < 3) {
          intervals_watched.splice(i, 2, [begin_current, end_next]);
        } 
      }

      // Check to see if the current time is within any of the intervals
      //  if so, ignore this case
      for (let interval of intervals_watched) {
        let start = interval[0];
        let end = interval[1];
        if ((current_time > start) && (current_time < end)) {
          return intervals_watched;
        }
      }

      // Check to see if the current time is within 3 seconds of the end
      //  of any interval, if so, then extend that interval
      for (let interval of intervals_watched) {
        let start = interval[0];
        let end = interval[1];

        if (Math.abs(current_time - end) < 3)  {

          let index = intervals_watched.indexOf(interval);
          interval = [ start, current_time ];
          intervals_watched.splice(index, 1, interval);

          return intervals_watched;
        }

      }

      // Check to see if the current time is within 3 seconds of the
      //  start of any interval, if so, then extend that interval
      for (let interval of intervals_watched) {
        let start = interval[0];
        let end = interval[1];

        if (Math.abs(start - current_time) < 3) {

          let index = intervals_watched.indexOf(interval);
          interval = [ current_time, end ];
          intervals_watched.splice(index, 1, interval);

          return intervals_watched;
        }

      }

      // Check to see if the current time is more than 3 seconds away
      //  from the end of any interval, if so create a new interval
      //  Start checking from the end to make sure the "best" placement
      //  occurs
      for (let i = intervals_watched.length - 1; i >= 0; i--) {

        let interval = intervals_watched[i];

        let start = interval[0];
        let end = interval[1];

        if (Math.abs(current_time - end) > 3) {

          let new_interval = [ current_time, current_time + 1 ];
          intervals_watched.splice(i + 1, 0, new_interval);

          return intervals_watched;
        }

      }       


    }

    return intervals_watched;

  }

/******************************************************************************
 * Get the total percentage of the video viewed for a particular video, based
 * on the current viewed intervals, returns a number, rounded to the nearest
 * integer.
 */

function getPercentViewed(intervals_watched, duration) {

    if (isNaN(duration) ) {
        return 0;
    } else {
        let total = 0;

        for(let interval of intervals_watched) {
            total += interval[1] - interval[0];
        }

        return Math.round((total / duration) * 100);
    }

}

function setBackground(svg, width, height, color, border) {
    svg.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height)
        .attr('fill', color)
        .attr('stroke', border);
}

function getTextBounds(text) {

    let bounds = { x: 0, y: 0, width: 0, height: 0 }
    
    if (text.visible) {
        d3.select('svg')
            .append('text')
            .attr('id', 'temp-text')
            .style('font-family', text.font)
            .style('font-size', text.size)
            .style('font-weight', text.weight)
            .text(text.text);
        bounds = document.getElementById('temp-text').getBBox();
        document.getElementById('temp-text').remove();
    } 

    return bounds;
}

function addSVGText(text, elementId, orientation) {

    if (text.visible) {
        let object = d3.select('svg')
            .append('text')
            .attr('id', elementId)
            .style('font-family', text.font)
            .style('font-size', text.size)
            .style('font-weight', text.weight)
            .attr('fill', text.color)
            .attr('transform', `translate(${text.bounds.xmid},${text.bounds.ymid})`)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .text(text.text);
        if (orientation == 'vertical') {
            object.attr('transform',`translate(${text.bounds.xmid}, ${text.bounds.ymid})rotate(-90)`)
        }
    }
}

function setup_xaxis(xScale, chart_area, opt) {

    if (opt.x_axis.visible) {

        const scale = d3.axisBottom(xScale);

        chart_area.append('g')
            .attr('id', 'x-axis')
            .call(scale);
        
        if (opt.x_axis.label_rotation != 0) {
            d3.selectAll('#x-axis text')
                .attr('transform', `rotate(${opt.x_axis.labels.rotation})`)
                .attr('text-anchor', 'start');
        }

        d3.selectAll('#x-axis text')
            .style('font-family', opt.x_axis.labels.font)
            .style('font-size', opt.x_axis.labels.size)
            .style('font-weight', opt.x_axis.labels.weight)
            .attr('fill', opt.x_axis.labels.color)

        opt.x_axis.bounds = document.getElementById('x-axis').getBBox();
    } else {
        opt.x_axis.bounds = { x: 0, y: 0, width: 0, height: opt.default_margin }
        opt.x_axis.grid = false;
    }
    return opt;
}

function setup_yaxis(yScale, chart_area, opt) {
    
    if (opt.y_axis.visible) {   

        console.log(opt.y_axis.scale);
        const scale = opt.y_axis.manual_range 
            ? d3.axisLeft(yScale)
                .tickFormat(d3.format(opt.y_axis.labels.format))
                .tickValues(d3.range(opt.y_axis.scale.min, opt.y_axis.scale.max, opt.y_axis.scale.step))
            : d3.axisLeft(yScale)
                .tickFormat(d3.format(opt.y_axis.labels.format));

        chart_area.append('g')
            .attr('id', 'y-axis')
            .call(scale);

        d3.selectAll('#y-axis text')
            .style('font-family', opt.y_axis.labels.font)
            .style('font-size', opt.y_axis.labels.size)
            .style('font-weight', opt.y_axis.labels.weight)
            .attr('fill', opt.y_axis.labels.color)

        opt.y_axis.bounds = document.getElementById('y-axis').getBBox();

    } else {
        opt.y_axis.bounds = { x: 0, y: 0, width: opt.default_margin, height: 0 };
        opt.y_axis.grid = false;
    }
    return opt;
}

function draw_xaxis(xScale, opt) {
    // Redraw the axes, now that we know the correct dimensions
    if (opt.x_axis.visible) {
        let scale = d3.axisBottom(xScale);
        d3.select('#x-axis')
            .attr('transform', `translate(0,${opt.chart_area.bounds.height})`)
            .call(scale);
        opt.x_axis.bounds = document.getElementById('x-axis').getBBox();

        // Check to see if the x-labels extend beyond the drawing area
        // Adjust the scale if this is the case
        let x_error = opt.chart_area.bounds.width - opt.x_axis.bounds.width;
        console.log(x_error);
        if (x_error < 0) {
            xScale.range([0, opt.chart_area.bounds.width + x_error]);
            scale = d3.axisBottom(xScale);
            d3.select('#x-axis').call(scale);
        }
    }

}

function draw_yaxis(yScale, opt) {
    if (opt.y_axis.visible) {

        const scale = opt.y_axis.manual_range 
            ? d3.axisLeft(yScale)
                .tickFormat(d3.format(opt.y_axis.labels.format))
                .tickValues(d3.range(opt.y_axis.scale.min, opt.y_axis.scale.max + opt.y_axis.scale.step, opt.y_axis.scale.step))
            : d3.axisLeft(yScale)
                .tickFormat(d3.format(opt.y_axis.labels.format));

        d3.select('#y-axis')
            .call(scale);
    }

    // Draw y-axis grid lines, skip the first one
    if (opt.y_axis.grid) {  
        d3.selectAll('#y-axis .tick').filter( (d,i) => i != 0) 
            .append('line')
            .classed('grid-line', true)
            .attr('stroke', opt.x_axis.grid_color)
            .attr('x1', 1)
            .attr('y1', 0.5)
            .attr('x2', opt.chart_area.bounds.width)
            .attr('y2', 0.5)
    }
}

function set_chart_dimensions(opt) {

    opt.chart_area.top_margin = opt.chart_title.visible ? opt.chart_title.pad * 2 + opt.chart_title.text_bounds.height : opt.default_margin;
    opt.chart_area.bottom_margin = opt.x_title.visible ? opt.x_title.pad * 2 + opt.x_title.text_bounds.height + opt.x_axis.bounds.height : opt.x_axis.bounds.height + opt.default_margin;
    opt.chart_area.right_margin = opt.default_margin;
    opt.chart_area.left_margin = opt.y_title.visible ? opt.y_title.pad * 2 + opt.y_title.text_bounds.height + opt.y_axis.bounds.width : opt.y_axis.bounds.width + opt.default_margin;

    opt.chart_area.bounds.x = opt.chart_area.left_margin;
    opt.chart_area.bounds.y = opt.chart_area.top_margin;
    opt.chart_area.bounds.width = opt.width - opt.chart_area.left_margin - opt.chart_area.right_margin;
    opt.chart_area.bounds.height = opt.height - opt.chart_area.top_margin - opt.chart_area.bottom_margin;
    opt.chart_area.bounds = calculateBounds(opt.chart_area.bounds);

    opt.chart_title.bounds.x = 0;
    opt.chart_title.bounds.y = 0;
    opt.chart_title.bounds.width = opt.chart_area.bounds.right;
    opt.chart_title.bounds.height = opt.chart_area.bounds.top;
    opt.chart_title.bounds = calculateBounds(opt.chart_title.bounds);

    opt.x_title.bounds.x = opt.chart_area.bounds.left;
    opt.x_title.bounds.y = opt.chart_area.bounds.bottom + opt.x_axis.bounds.height;
    opt.x_title.bounds.width = opt.chart_area.bounds.width;
    opt.x_title.bounds.height = opt.chart_area.bottom_margin - opt.x_axis.bounds.height;
    opt.x_title.bounds = calculateBounds(opt.x_title.bounds);

    opt.y_title.bounds.x = 0;
    opt.y_title.bounds.y = opt.chart_area.bounds.top;
    opt.y_title.bounds.width = opt.chart_area.left_margin - opt.y_axis.bounds.width;
    opt.y_title.bounds.height = opt.chart_area.bounds.height;    
    opt.y_title.bounds = calculateBounds(opt.y_title.bounds);

    return opt;
}

function calculateBounds(bounds) {
    bounds.left = bounds.x;
    bounds.right = bounds.left + bounds.width; 
    bounds.top = bounds.y;
    bounds.bottom = bounds.top + bounds.height;   
    bounds.xmid = bounds.left + bounds.width / 2;
    bounds.ymid = bounds.top + bounds.height / 2;
    return bounds;
}

function drawVerticalLine(svg, xloc) {
    svg
        .append('line')
        .attr('stroke', 'red')
        .attr('x1', xloc)
        .attr('y1', 0)
        .attr('x2', xloc)
        .attr('y2', 500)
}

function drawHorizontalLine(svg, yloc) {
    svg
        .append('line')
        .attr('stroke', 'red')
        .attr('x1', 0)
        .attr('y1', yloc)
        .attr('x2', 400)
        .attr('y2', yloc)
}

if (typeof(module) !== 'undefined') {
    module.exports = { 
        swapArrayItems, 
        between, 
        in_interval,
        sort_intervals
    };
}
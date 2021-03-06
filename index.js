const offset = 10;
const treeHeight = 5;
const boxHeight = 20;
const boxWidth = 50;
const period = 1000;
const quick = 200;
const layers = 3;
const chartHeight = 300;
const chartWidth = 400;
var resizeFactor;
var chart;
var limit;
var mapping;
var svg;
var root;
var width;
var height;
var layer;
var values;
var barWidth;
var barHeight;

function set(i,x){
	if(i>limit||i<=0)	return;
	var temp = values.find(d => d.id == i);
	if(!temp)	values.push(temp = {
		id: i,
		value: 0
	});
	temp.value += x;
	arr = [];
	while(i<=limit){
		arr.push(i.toString());
		var temp = mapping.find(d => d.id == i);
		var p = i + (i&-i);
		if(!temp)	mapping.push(temp = {
			id: i,
			value: 0,
			parentId: p>limit?null:p
		});
		temp.value += x;
		i = p;			
	}
	var trans_period = transitionAnimation();
	setTimeout(() => highlight(arr), trans_period);
	renderChart();
}

function transitionAnimation(){
	// get hierarchy from data
	root = d3.stratify()(mapping);
	// sort hierarchy by index
	root.sort((a,b) => a.data.id - b.data.id);

	// generate tree coordinates
	h = height - 2*boxHeight;
	w = width - 2*boxWidth;
	d3.tree().size([w,h])(root);

	// lines enter here
	layer[0].selectAll('line.link')
	.data(root.links(), d => d.target.id)
	.enter().append('line')
	.classed('link', true)
	.attr('x1', d => d.target.x + boxWidth)
	.attr('y1', d => d.target.y + boxHeight)
	.attr('x2', d => d.target.x + boxWidth)
	.attr('y2', d => d.target.y + boxHeight)
	.style('stroke', 'cyan');

	// group enter here
	enter_group = layer[1].selectAll('g.node')
	.data(root.descendants(), d => d.id)
	.enter().append('g').classed('node', true)
	.attr('transform', d => 'translate('+(d.x+boxWidth)+','+(d.y+boxHeight)+')');

	// rect added to group
	enter_group.append('rect').classed('node', true)
	.style('fill', 'aqua')
	.attr('x', 0).attr('y', 0)
	.attr('width', 0).attr('height', 0)
	.transition().duration(period)
	.attr('x', -boxWidth/2).attr('y', -boxHeight/2)
	.attr('width', boxWidth).attr('height', boxHeight);

	// text added to group
	enter_group.append('text').classed('node', true)
	.attr("dominant-baseline", "middle")
	.attr("text-anchor", "middle")
	.attr('dx', 0).attr('dy', 0)
	.style('fill', 'black')
	.style('opacity', 0)
	.text(d => d.id + '->' + d.data.value)
	.transition().duration(period)
	.style('opacity', 1);

	// group and lines transition
	layer[1].selectAll('g.node')
	.transition().duration(period)
	.attr('transform', d => 'translate('+(d.x+boxWidth)+','+(d.y+boxHeight)+')');
	layer[1].selectAll('text.node')
	.text(d => d.id + '->' + d.data.value);
	layer[0].selectAll('line.link')
	.transition().duration(period)
	.attr('x1', d => d.source.x + boxWidth)
	.attr('y1', d => d.source.y + boxHeight)
	.attr('x2', d => d.target.x + boxWidth)
	.attr('y2', d => d.target.y + boxHeight);

	// return the time to animate
	return enter_group.empty()?0:period;
}

function highlight(arr){
	// TODO: add travelling highlight
	layer[1].selectAll('text.node')
	.filter(d => arr.includes(d.id))
	.transition().duration(quick)
	.style('fill', 'white')
	.transition().duration(quick)
	.style('fill', 'black');

	layer[1].selectAll('rect.node')
	.filter(d => arr.includes(d.id))
	.transition().duration(quick)
	.style('fill', 'black')
	.transition().duration(quick)
	.style('fill', 'aqua');

	layer[0].selectAll('line.link')
	.filter(d => arr.includes(d.target.id))
	.transition().duration(quick)
	.style('stroke', 'cyan')
	.transition().duration(quick)
	.style('stroke', 'black')
}

function randomAdd(){
	i = 1 + Math.floor(32*Math.random());
	x = -32 + Math.floor(64*Math.random());
	set(i,x);
}

function renderChart(){
	maxValue = 0;
	values.forEach(d => maxValue = Math.max(maxValue, Math.abs(d.value)));
	barHeight = (chartHeight/2-barWidth)/(maxValue||1);

	chart.transition().duration(quick).style('opacity', resizeFactor)
	.attr('transform', 'translate('+(width-offset-chartWidth*resizeFactor)+','+(height-offset-chartHeight*resizeFactor/2)+')');
	chart.select('rect.chart').transition().duration(quick)
	.attr('x', 0).attr('y', -chartHeight*resizeFactor/2)
	.attr('height', chartHeight*resizeFactor)
	.attr('width', chartWidth*resizeFactor);
	chart.select('line.chart').transition().duration(quick)
	.attr('x1', barWidth*resizeFactor).attr('y1', 0)
	.attr('x2', (chartWidth-barWidth)*resizeFactor).attr('y2', 0);

	chart.selectAll('rect.bar')
	.data(values, d => d.id)
	.enter().append('rect')
	.classed('bar', true)
	.attr('x', d => d.id*barWidth*resizeFactor)
	.attr('y', 0).attr('height', 0)
	.attr('width', barWidth*resizeFactor)
	.style('fill', d => d.value>0?'cyan':'pink');

	chart.selectAll('rect.bar')
	.transition().duration(quick)
	.attr('x', d => d.id*barWidth*resizeFactor)
	.attr('y', d => d.value<0?0:-d.value*barHeight*resizeFactor)
	.attr('height', d => Math.abs(d.value*barHeight*resizeFactor))
	.attr('width', barWidth*resizeFactor)
	.style('fill', d => d.value>0?'cyan':'pink');

}

function init(){
	resizeFactor = 0.5;
	limit = 1<<treeHeight;
	width = window.innerWidth - 2*offset;
	height = window.innerHeight - 2*offset;

	svg = d3.select("svg").attr("width", width).attr("height", height)
	.attr("x", offset).attr("y", offset);
	svg.append('rect').attr("width", 100).attr("height", 100)
	.attr("x", offset).attr("y", offset)
	.style('fill', 'lightcyan')
	.on('click', randomAdd);

	layer = [];
	for(var i = 0; i < layers; i++){
		layer.push(svg.append('g'));
	}

	barWidth = chartWidth/(limit+2);
	chart = layer[2].append('g').classed('chart', true)
	.attr('transform', 'translate('+(width-offset-chartWidth*resizeFactor)+','+(height-offset-chartHeight*resizeFactor/2)+')')
	.style('opacity', resizeFactor);

	chart.append('rect').classed('chart', true)
	.attr('x', 0).attr('y', 0).attr('height', 0).attr('width', 0)
	.style('fill', 'grey').style('opacity', 0.5);
	chart.append('line').classed('chart', true)
	.attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 0)
	.style('stroke', 'black');

	values = [];

	mapping = [];

	renderChart();
}

init();
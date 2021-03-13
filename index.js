const offset = 10;
const treeHeight = 5;
const boxHeight = 20;
const boxWidth = 30;
const period = 1000;
const quick = 200;
const layers = [
	'lines',
	'nodes',
	'chart',
	'controller'
];
const chartHeight = 300;
const chartWidth = 400;
const controlHeight = 70;
const controlGap = 30;
const controlRadius = 50;
const controlOpacity = 0.5;
const chartSizeOpen = 1;
const chartSizeClose = 0.5;
const resizeFactor = () => viewChart?chartSizeOpen:chartSizeClose;

const controllerButtons = [
	{
		name: 'left',
		action: () => changeCurrentNode(-1),
		points: [
			["-controlRadius-controlGap", "-controlRadius"],
			["-controlRadius-controlGap", "controlRadius"],
			["-controlRadius-controlGap-controlHeight", "0"]
		],
		c: {
			x: "10-controlRadius-controlGap-controlHeight/2",
			y: "0"
		},
		color: 'grey',
		label: 'left'
	},
	{
		name: 'right',
		action: () => changeCurrentNode(1),
		points: [
			["controlRadius+controlGap", "-controlRadius"],
			["controlRadius+controlGap", "controlRadius"],
			["controlRadius+controlGap+controlHeight", "0"]
		],
		c: {
			x: "-5+controlRadius+controlGap+controlHeight/2",
			y: "0"
		},
		color: 'grey',
		label: 'right'
	},
	{
		name: 'up',
		action: () => set(currentNode, 1),
		points: [
			["-controlRadius", "-controlRadius-controlGap"],
			["controlRadius", "-controlRadius-controlGap"],
			["0", "-controlRadius-controlGap-controlHeight"]
		],
		c: {
			y: "10-controlRadius-controlGap-controlHeight/2",
			x: "0"
		},
		color: 'aqua',
		label: '+1'
	},
	{
		name: 'down',
		action: () => set(currentNode, -1),
		points: [
			["-controlRadius", "controlRadius+controlGap"],
			["controlRadius", "controlRadius+controlGap"],
			["0", "controlRadius+controlGap+controlHeight"]
		],
		c: {
			y: "-10+controlRadius+controlGap+controlHeight/2",
			x: "0"
		},
		color: 'pink',
		label: '-1'
	}
];

var viewChart = false;
var motion = false;
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
var currentNode;
var controller;

function set(i,x){
	if(i>limit||i<=0)	return;
	var temp = values.find(d => d.id == i);
	if(!temp)	values.push(temp = {
		id: i,
		value: 0
	});
	temp.value += x;
	var arr = {};
	var ind = 0
	while(i<=limit){
		arr[i.toString()] = { ind: ind++ };
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
	highlight(arr);
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
	layer['lines'].selectAll('line.link')
	.data(root.links(), d => d.target.id)
	.enter().append('line')
	.classed('link', true)
	.style('stroke', 'black')
	.attr('x1', d => d.source.x + boxWidth)
	.attr('y1', d => d.source.y + boxHeight)
	.attr('x2', d => d.target.x + boxWidth)
	.attr('y2', d => d.target.y + boxHeight)
	.style('opacity', 0);
	layer['lines'].selectAll('line.high')
	.data(root.links(), d => d.target.id)
	.enter().append('line')
	.classed('high', true)
	.style('opacity', 1)
	.attr('x1', d => d.target.x + boxWidth)
	.attr('y1', d => d.target.y + boxHeight)
	.attr('x2', d => d.target.x + boxWidth)
	.attr('y2', d => d.target.y + boxHeight)
	.style('stroke', 'cyan');

	// group enter here
	enter_group = layer['nodes'].selectAll('g.node')
	.data(root.descendants(), d => d.id)
	.enter().append('g').classed('node', true)
	.attr('transform', d => 'translate('+(d.x+boxWidth)+','+(d.y+boxHeight)+')');

	// rect added to group
	enter_group.append('rect').classed('node', true)
	.style('fill', 'aqua')
	.attr('x', 0).attr('y', 0)
	.attr('width', 0).attr('height', 0);

	// text added to group
	enter_group.append('text').classed('node', true)
	.attr("dominant-baseline", "middle")
	.attr("text-anchor", "middle")
	.attr('dx', 0).attr('dy', 0)
	.style('fill', 'black')
	.style('opacity', 0)
	.text(d => d.data.value);

	enter_group.append('text').classed('binary', true)
	.attr('dx', boxWidth/2).attr('dy', boxHeight/2)
	.style('fill', 'lightgrey')
	.style('opacity', 0)
	.text(d => d.data.id.toString(2));

	enter_group.append('text').classed('index', true)
	.attr('dx', -boxWidth/2).attr('dy', -boxHeight/2)
	.style('fill', 'lightgrey')
	.style('opacity', 0)
	.text(d => ordinal(d.data.id));

	// set texts
	// layer['nodes'].selectAll('text.node')
	// .text(d => d.data.value);
	// layer['nodes'].selectAll('text.binary')
	// .text(d => d.data.id.toString(2));
	// layer['nodes'].selectAll('text.index')
	// .text(d => ordinal(d.data.id));

	// group and lines transition
	layer['nodes'].selectAll('g.node')
	.transition().duration(period)
	.attr('transform', d => 'translate('+(d.x+boxWidth)+','+(d.y+boxHeight)+')');
	layer['lines'].selectAll('line.link')
	.transition().duration(period)
	.attr('x1', d => d.source.x + boxWidth)
	.attr('y1', d => d.source.y + boxHeight)
	.attr('x2', d => d.target.x + boxWidth)
	.attr('y2', d => d.target.y + boxHeight);

	// return the time to animate
	return enter_group.empty()?0:period;
}

function highlight(arr){
	var high_in = quick;
	var high_out = quick;

	layer['nodes'].selectAll('text.node')
	.filter(d => arr[d.id])
	.transition().delay(d => arr[d.id].ind*(high_out+high_in))
	.duration(high_in)
	.on('start', function(){
		d3.select(this).style('opacity', 1);
	})
	.on('end', function(){
		d3.select(this).text(d => d.data.value);
	})
	.style('fill', 'white')
	.transition().duration(high_out)
	.style('fill', 'black');

	layer['nodes'].selectAll('text.binary')
	.filter(d => arr[d.id])
	.transition().delay(d => arr[d.id].ind*(high_out+high_in))
	.duration(high_in)
	.on('start', function(){
		d3.select(this).style('opacity', 1);
	})
	.on('end', function(){
		d3.select(this).text(d => d.data.id.toString(2));
	})
	.style('fill', 'black')
	.transition().duration(high_out)
	.style('fill', 'lightgrey');

	layer['nodes'].selectAll('text.index')
	.filter(d => arr[d.id])
	.transition().delay(d => arr[d.id].ind*(high_out+high_in))
	.duration(high_in)
	.on('start', function(){
		d3.select(this).style('opacity', 1);
	})
	.on('end', function(){
		d3.select(this).text(d => ordinal(d.data.id));
	})
	.style('fill', 'black')
	.transition().duration(high_out)
	.style('fill', 'lightgrey');

	layer['nodes'].selectAll('rect.node')
	.filter(d => arr[d.id])
	.transition().delay(d => arr[d.id].ind*(high_out+high_in))
	.duration(high_in)
	.style('fill', 'black')
	.attr('x', -boxWidth/2).attr('y', -boxHeight/2)
	.attr('width', boxWidth).attr('height', boxHeight)
	.transition().duration(high_out)
	.style('fill', 'aqua');

	layer['lines'].selectAll('line.high')
	.filter(d => arr[d.target.id])
	.transition().delay(d => arr[d.target.id].ind*(high_out+high_in))
	.duration(high_in)
	.attr('x1', d => d.target.x + boxWidth)
	.attr('y1', d => d.target.y + boxHeight)
	.attr('x2', d => d.target.x + boxWidth)
	.attr('y2', d => d.target.y + boxHeight)
	.transition().duration(high_out)
	.attr('x1', d => d.source.x + boxWidth)
	.attr('y1', d => d.source.y + boxHeight)
	.attr('x2', d => d.target.x + boxWidth)
	.attr('y2', d => d.target.y + boxHeight)
	.on('end', function(){
		var that = this;
		d3.selectAll('line.link').filter(dd => dd.target.id == d3.select(that).data()[0].target.id).style('opacity', 1);
	})
	.transition().duration(high_in)
	.attr('x1', d => d.source.x + boxWidth)
	.attr('y1', d => d.source.y + boxHeight)
	.attr('x2', d => d.source.x + boxWidth)
	.attr('y2', d => d.source.y + boxHeight);

	// layer['lines'].selectAll('line.link')
	// .filter(d => arr[d.target.id])
	// .transition().delay(d => arr[d.target.id].ind*(high_out+high_in) + high_in)
	// .duration(high_out)
	// .style('opacity', 0)
	// .on('end', function(){
	// 	d3.select(this).style('opacity', 1);
	// });
}

function randomAdd(){
	i = 1 + Math.floor(32*Math.random());
	x = -32 + Math.floor(64*Math.random());
	set(i,x);
}

function handleMouseDown(d,i){
	if(this.getAttribute('name')=='left'&&currentNode==1)	return;
	if(this.getAttribute('name')=='right'&&currentNode==limit)	return;
	d3.select(this)
    .transition().ease(d3.easeElastic)
    .style("opacity", 0.3);
}

function handleMouseUp(d,i){
	// TODO: improve animation
	d3.select(this)
    .transition().ease(d3.easeElastic)
    .style("opacity", 1);
}

function handleControllerAction(d,i){
	d.action();
}

function handleMouseOver(z){
	var i = z;
	chart.selectAll('rect.picker')
	.style('opacity', d => d<=z?0.5:0);
	var arr = [];
	while(i>0){
		arr.push(i.toString());
		i -= i&-i;
	}
	layer['nodes'].selectAll('rect.node')
	.filter(d => arr.includes(d.id))
	.style('fill', 'pink');
}

function handleMouseOut(z){
	var i = z;
	chart.selectAll('rect.picker')
	.style('opacity', 0);
	var arr = [];
	while(i>0){
		arr.push(i.toString());
		i -= i&-i;
	}
	layer['nodes'].selectAll('rect.node')
	.filter(d => arr.includes(d.id))
	.style('fill', 'aqua');
}

function ordinalSuffix(i){
	var t = i%100;
	if([11,12,13].includes(t))	t = 0;
	t = t%10>3?0:t%10;
	return ['th','st','nd','rd'][t]
}

function ordinal(i){
	return i+ordinalSuffix(i);
}

function changeCurrentNode(delta){
	if(!currentNode||!delta)	currentNode = 1 + Math.floor(32*Math.random());
	else	currentNode = currentNode + delta;
	currentNode = Math.max(1, Math.min(limit, currentNode));
	var temp = currentNode+ordinalSuffix(currentNode);
	controller.select('text.center').text(temp);
}

function renderChart(){
	// recalculate barHeight based on new max
	var maxValue = 0;
	values.forEach(d => maxValue = Math.max(maxValue, Math.abs(d.value)));
	maxValue = maxValue||1;
	barHeight = (chartHeight/2-barWidth)/maxValue;

	// zoom chart
	chart.transition().duration(quick).style('opacity', resizeFactor())
	.on('start', () => motion = true).on('end', () => motion = false)
	.attr('transform', 'translate('+(offset)+','+(offset+chartHeight*resizeFactor()/2)+')');
	chart.select('rect.chart').transition().duration(quick)
	.attr('x', 0).attr('y', -chartHeight*resizeFactor()/2)
	.attr('height', chartHeight*resizeFactor())
	.attr('width', chartWidth*resizeFactor());
	chart.select('line.chart').transition().duration(quick)
	.attr('x1', barWidth*resizeFactor()).attr('y1', 0)
	.attr('x2', (chartWidth-barWidth)*resizeFactor()).attr('y2', 0);
	chart.selectAll('rect.picker').transition().duration(quick)
	.attr('x', d => d*barWidth*resizeFactor())
	.attr('y', -maxValue*barHeight*resizeFactor())
	.attr('height', 2*maxValue*barHeight*resizeFactor())
	.attr('width', barWidth*resizeFactor());

	// add new bars
	chart.selectAll('rect.bar')
	.data(values, d => d.id)
	.enter().append('rect')
	.classed('bar', true)
	.attr('x', d => d.id*barWidth*resizeFactor())
	.attr('y', 0).attr('height', 0)
	.attr('width', barWidth*resizeFactor())
	.style('fill', d => d.value>0?'cyan':'pink');

	// add new text label
	chart.selectAll('text.label')
	.data(values, d => d.id)
	.enter().append('text')
	.classed('label', true)
	.attr("text-anchor", "middle")
	.attr('x', d => (d.id+0.5)*barWidth*chartSizeOpen)
	.attr('y', 0).style('opacity', 0);

	// change bar height
	chart.selectAll('rect.bar')
	.transition().duration(quick)
	.attr('x', d => d.id*barWidth*resizeFactor())
	.attr('y', d => d.value<0?0:-d.value*barHeight*resizeFactor())
	.attr('height', d => Math.abs(d.value*barHeight*resizeFactor()))
	.attr('width', barWidth*resizeFactor())
	.style('fill', d => d.value>0?'cyan':'pink');

	// change label
	chart.selectAll('text.label')
	.text(d => d.value)
	.style('opacity', 0)
	.transition().duration(quick)
	.on('end', function(){
		d3.select(this).style('opacity', viewChart?1:0);
	})
	.attr('dominant-baseline', d => d.value>0?'unset':d.value<0?'hanging':'middle')
	.attr('y', d => -d.value*barHeight*chartSizeOpen);

}

function triangleHelper(pa,pb,pc){
	return eval(pa[0])+','+eval(pa[1])+' '+eval(pb[0])+','+eval(pb[1])+' '+eval(pc[0])+','+eval(pc[1]);
}

function init(){
	// initial size of the chart preview
	viewChart = false;
	// calculate limit based on the tree height const
	limit = 1<<treeHeight;

	// set height and width of the svg element
	width = window.innerWidth - 2*offset;
	height = window.innerHeight - 2*offset;

	svg = d3.select("svg")
	.on('click', function(){
		if(!viewChart||motion)	return;
		viewChart = false;
		renderChart();
	})
	.attr("width", width).attr("height", height)
	.attr("x", offset).attr("y", offset);

	// add layers to the svg
	layer = {};
	for(var i of layers){
		layer[i] = svg.append('g');
	}

	// set local coordinate of controller layer
	controller = layer['controller'].append('g').classed('control', true)
	.attr('transform', 'translate('+(width-offset-controlHeight-controlGap-controlRadius)+','+(height-offset-controlHeight-controlGap-controlRadius)+')')
	.style('opacity', controlOpacity);

	// TODO: fix button click on text

	// add center cirle to controller
	controller.append('circle')
	.attr("cx", 0).attr("cy", 0)
	.attr("r", controlRadius)
	.style('fill', 'grey')
	.on('click', () => changeCurrentNode());

	// add controller buttons from button config const
	controller.selectAll('polygon.controller').data(controllerButtons)
	.enter().append('polygon').classed('controller', true)
	.attr('name', d => d.name).style('fill', d => d.color)
	.attr('points', d => triangleHelper(...d.points))
	.on('mousedown', handleMouseDown).on('mouseup', handleMouseUp)
	.on('click', handleControllerAction);

	// add button texts from config
	controller.selectAll('text.controller').data(controllerButtons)
	.enter().append('text').classed('controller', true)
	.attr("dominant-baseline", "middle")
	.attr("text-anchor", "middle")
	.style('font-size', 20)
	.style('fill', 'white')
	.attr('x', d => eval(d.c.x)).attr('y', d => eval(d.c.y))
	.text(d => d.label);

	// add center dynamic text
	controller.append('text').classed('center', true)
	.attr("dominant-baseline", "middle")
	.attr("text-anchor", "middle")
	.style('font-size', controlRadius/2)
	.style('fill', 'white')
	.attr('x', 0).attr('y', 0);

	// render default controller setting
	changeCurrentNode();


	// set local coordinate of chart layer
	chart = layer['chart'].append('g').classed('chart', true)
	.on('mouseover', function(d){
		if(viewChart||motion)	return;
		viewChart = true;
		renderChart();
	})
	.on('mouseout', function(d){
		// TODO: correctify quick out bug
		if(!viewChart||motion)	return;
		viewChart = false;
		renderChart();
	});

	// add const elements of chart
	chart.append('rect').classed('chart', true)
	.attr('x', 0).attr('y', 0).attr('height', 0).attr('width', 0)
	.style('fill', 'grey').style('opacity', 0.5);
	var pickerData = [];
	for(var i=0; i<limit; i++){
		pickerData.push(i+1);
	}
	chart.append('g').classed('picker', true)
	.selectAll('rect.picker')
	.data(pickerData, d => d).enter()
	.append('rect').classed('picker', true)
	.on('mouseover', handleMouseOver)
	.on('mouseout', handleMouseOut)
	.attr('x', 0).attr('y', 0).attr('height', 0).attr('width', 0)
	.style('fill', 'grey').style('opacity', 0);
	chart.append('line').classed('chart', true)
	.attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 0)
	.style('stroke', 'black');

	// inital data with defaults before rendering
	values = [];
	mapping = [];

	// calculate chart's bar width before rendering
	barWidth = chartWidth/(limit+2);
	renderChart();
}

init();
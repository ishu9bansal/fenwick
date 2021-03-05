const offset = 10;
const treeHeight = 5;
const boxHeight = 20;
const boxWidth = 50;
const period = 5000;
const layers = 2;
var limit;
var mapping;
var svg;
var root;
var width;
var height;
var layer;

function set(i,x){
	if(i>limit||i<=0)	return;
	while(i<=limit){
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
	onMappingChange();
}

function onMappingChange(){
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
	.attr('x1', root.x + boxWidth)
	.attr('y1', root.y + boxHeight)
	.attr('x2', root.x + boxWidth)
	.attr('y2', root.y + boxHeight)
	.style('stroke', 'black');

	// group enter here
	enter_group = layer[1].selectAll('g.node')
	.data(root.descendants(), d => d.id)
	.enter().append('g').classed('node', true)
	.attr('transform', 'translate('+(root.x+boxWidth)+','+(root.y+boxHeight)+')');

	// rect added to group
	enter_group.append('rect').classed('node', true)
	.attr('x', -boxWidth/2).attr('y', -boxHeight/2)
	.attr('width', boxWidth).attr('height', boxHeight)
	.style('fill', 'aqua');

	// text added to group
	enter_group.append('text').classed('node', true)
	.attr("dominant-baseline", "middle")
	.attr("text-anchor", "middle")
	.attr('dx', 0).attr('dy', 0);

	// group and lines transition
	layer[1].selectAll('g.node')
	.transition().duration(period)
	.attr('transform', d => 'translate('+(d.x+boxWidth)+','+(d.y+boxHeight)+')');
	layer[1].selectAll('text.node')
	.transition().duration(period)
	.text(d => d.id + '->' + d.data.value);
	layer[0].selectAll('line.link')
	.transition().duration(period)
	.attr('x1', d => d.source.x + boxWidth)
	.attr('y1', d => d.source.y + boxHeight)
	.attr('x2', d => d.target.x + boxWidth)
	.attr('y2', d => d.target.y + boxHeight);
}

function init(){
	limit = 1<<treeHeight;
	width = window.innerWidth - 2*offset;
	height = window.innerHeight - 2*offset;

	svg = d3.select("svg").attr("width", width).attr("height", height)
	.attr("x", offset).attr("y", offset);

	layer = [];
	for(var i = 0; i < layers; i++){
		layer.push(svg.append('g'));
	}
	mapping = [];
}

init();
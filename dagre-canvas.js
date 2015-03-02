(function() {
	'use strict';



	var merge = function(to, from) {
		if (!to) {   to   = {}; }
		if (!from) { from = {}; }
		for (var k in from) {
			if (!(k in to)) {
				to[k] = from[k];
			}
		}
		return to;
	};

	var clone = function(o) {
		return JSON.parse( JSON.stringify(o) );
	};

	var forKV = function(o, cb) {
		for (var k in o) {
			if (!o.hasOwnProperty(k)) { continue; }
			cb(k, o[k]);
		}
	};



	var r30 = Math.PI/6;



	window.dagreCanvas = function(o) {
		// https://github.com/cpettitt/dagre/wiki#using-dagre

		var g = new dagre.graphlib.Graph();

		g.setGraph(o.layout || {});

		if (!('nodes' in o.layout)) { o.layout.nodes = {}; }
		if (!('edges' in o.layout)) { o.layout.edges = {}; }

		var ln = merge(o.layout.nodes, {
			fontFamily:      'sans-serif',
			fontHeight:      14,
			fontStyle:       '',
			padding:         6,
			labelColor:      '#000',
			backgroundColor: '#EEE'
		});

		var le = merge(o.layout.edges, {
			fontFamily: 'sans-serif',
			fontHeight: 12,
			fontStyle:  '',
			padding:    1,
			lineWidth:  1,
			lineColor:  '#777',
			labelColor: '#000'
		});



		// Default to assigning a new object as a label for each new edge.
		g.setDefaultEdgeLabel(function() { return {}; });
		//g.setDefaultNodeLabel(function() { return {}; });

		// https://simon.html5.org/dump/html5-canvas-cheat-sheet.html
		var canvasEl = document.createElement('canvas');

		var ctx = canvasEl.getContext('2d');



		// functions using ctx implicitly

		var box = function(txt, opts, l) {
			var o = {
				label:  txt,
				width:  ctx.measureText(txt).width + l.padding*2,
				height: l.fontHeight + l.padding*2
			};
			return merge(o, opts);
		};

		var arrowEnd = function(last, prev, head) {
			var ang = Math.atan2(last.y-prev.y,last.x-prev.x);
			ctx.beginPath();
			ctx.moveTo(last.x-head*Math.cos(ang-r30),last.y-head*Math.sin(ang-r30));
			ctx.lineTo(last.x, last.y);
			ctx.lineTo(last.x-head*Math.cos(ang+r30),last.y-head*Math.sin(ang+r30));
			ctx.stroke();
		};

		var line = function(points) {
			ctx.beginPath();
			points.forEach(function(p, i) {
				ctx[ i === 0 ? 'moveTo' : 'lineTo' ](p.x, p.y);
			});
			ctx.stroke();
		};

		var applyFont = function(v, l) {
			ctx.font = [(v.fontStyle || l.fontStyle), ' ', (v.fontHeight || l.fontHeight), 'px ', (v.fontFamily || l.fontFamily)].join('');
		};



		// measure node boxes
		o.nodes.forEach(function(n) {
			var o = clone(n); delete o.id; delete o.label;
			applyFont(n, ln);
			g.setNode(n.id, box(n.label, o, ln));
		});



		// measure edge boxes
		o.edges.forEach(function(e) {
			var o = clone(e); delete o.from; delete o.to; delete o.label;
			if ('label' in e) {
				applyFont(e, le);
				g.setEdge(e.from, e.to, box(e.label, o, le));
			}
			else {
				g.setEdge(e.from, e.to, o);
			}
		});



		dagre.layout(g, {}); // https://github.com/cpettitt/dagre/wiki#configuring-the-layout

		var dims = g.graph();
		canvasEl.setAttribute('width',  Math.ceil(dims.width));
		canvasEl.setAttribute('height', Math.ceil(dims.height));

		ctx.textAlign    = 'center';
		ctx.textBaseline = 'middle';

		ctx.lineCap   = 'round';
		ctx.lineJoint = 'round';



		// draw edges
		forKV(g._edgeLabels, function(k, v) {
			//console.log(k, v);

			ctx.lineWidth   = v.lineWidth || le.lineWidth;
			ctx.strokeStyle = v.lineColor || le.lineColor;

			line(v.points);
			var l = v.points.length - 1;
			arrowEnd(v.points[l], v.points[--l], 8);
			if ('label' in v) {
				var p = v.points[1];
				var w = ctx.measureText(v.label).width;
				var h = le.fontHeight;
				var ep = le.padding;

				var bgc = v.backgroundColor || le.backgroundColor;
				if (bgc) {
					ctx.fillStyle = bgc;
					ctx.fillRect(p.x-w/2-ep, p.y-h/2-ep, w+ep*2, h+ep*2);
				}
				else {
					ctx.clearRect(p.x-w/2-ep, p.y-h/2-ep, w+ep*2, h+ep*2);
				}

				ctx.fillStyle = v.labelColor || le.labelColor;

				applyFont(v, le);
				ctx.fillText(v.label, p.x, p.y);
			}
		});



		// draw nodes
		forKV(g._nodes, function(k, v) {
			//console.log(k, v);

			ctx.fillStyle = v.backgroundColor || ln.backgroundColor;
			ctx.fillRect(v.x-v.width/2, v.y-v.height/2, v.width, v.height);

			ctx.fillStyle = v.labelColor || ln.labelColor;

			applyFont(v, ln);
			ctx.fillText(v.label, v.x, v.y);
		});



		return canvasEl;
	};

})();

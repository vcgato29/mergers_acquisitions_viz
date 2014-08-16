var vis = function(data){
	var getShortName = (function() {
		var mapping = {
			'The Ensign Group, Inc. (NasdaqGS:ENSG)': 'ENSG',
			'LHC Group, Inc. (NasdaqGS:LHCG)': 'LHCG',
			'CVS Caremark Corporation (NYSE:CVS)': 'CVS',
			'Hanger, Inc. (NYSE:HGR)': 'HGR',
			'HCA Holdings, Inc. (NYSE:HCA)': 'HCA',
			'Universal Health Services Inc. (NYSE:UHS)': 'UHS',
			'Community Health Systems, Inc. (NYSE:CYH)': 'CYH',
			'Walgreen Co. (NYSE:WAG)': 'WAG',
			'Health Management Associates Inc.': 'HMA',
			'Amedisys Inc. (NasdaqGS:AMED)': 'AMED'
		}
		return function(fullName) {
			return mapping[fullName];
		}
	})()
	var getFullName = (function() {
		var mapping = {
			'ENSG': 'The Ensign Group, Inc. (NasdaqGS:ENSG)',
			'LHCG': 'LHC Group, Inc. (NasdaqGS:LHCG)',
			'CVS': 'CVS Caremark Corporation (NYSE:CVS)',
			'HGR': 'Hanger, Inc. (NYSE:HGR)',
			'HCA': 'HCA Holdings, Inc. (NYSE:HCA)',
			'UHS': 'Universal Health Services Inc. (NYSE:UHS)',
			'CYH': 'Community Health Systems, Inc. (NYSE:CYH)',
			'WAG': 'Walgreen Co. (NYSE:WAG)',
			'HMA': 'Health Management Associates Inc.',
			'AMED': 'Amedisys Inc. (NasdaqGS:AMED)'
		}
		return function(shortName) {
			return mapping[shortName];
		}
	})()

	var color_pool = ['rgb(166,206,227)','rgb(31,120,180)','rgb(178,223,138)','rgb(51,160,44)','rgb(251,154,153)','rgb(227,26,28)','rgb(253,191,111)','rgb(255,127,0)','rgb(202,178,214)', 'rgb(153, 153, 153)']
	var bar_colors = {'Executive/Board Changes - Other': 'rgb(179,226,205)',
					  'Lawsuits & Legal Issues': 'rgb(253,205,172)',
					  'Business Expansions': 'rgb(203,213,232)'
					 }
	var colors = {
		ENSG: color_pool[0],
		LHCG: color_pool[1],
		CVS: color_pool[2],
		HGR: color_pool[3],
		HCA: color_pool[4],
		UHS: color_pool[5],
		WAG: color_pool[6],
		HMA: color_pool[7],
		AMED: color_pool[8],
		CYH: color_pool[9],
	}


	var controller = (function() {
		var controller = {};

		var render = function() {
			brushChart.plot();
			pieChart.plot();
			groupBarChart.plot();
		};
		controller.init = function() {
			render();
		}

		return controller;
	})();


	var data = (function() {
		data.byTransactions = d3.nest().key(function(d) {
			return d['Buyers/Investors']
		}).entries(data.transactions);
		data.pieData = data.byTransactions.map(function(d) {
			return {
				name: getShortName(d.key),
				company_name: d.key,
				volume: d.values.length
			}
		});
		data.byType = d3.nest().key(function(d) { return d['Company Name(s)'] })
							   .key(function(d) { return d['Key Developments by Type']})
							   .rollup(function(leaves) { return leaves.length; })
							   .map(data.text, d3.map);

		data.groupBarData = []
		data.types = ['Executive/Board Changes - Other', 'Lawsuits & Legal Issues', 'Business Expansions'].reverse();
		//data.company_short_names = [];
		for (var c_name in data.byType) {
			//company_short_names.push(getShortName(c_name));
			data.groupBarData.push({
				name: getShortName(c_name),
				company_name: c_name,
				activities: data.types.map(function(t) {
					return {type: t, value: data.byType[c_name][t] || 0}
				})
			})
		}
		data.byText = d3.nest().key(function(d) {
			return d['Company Name(s)']
		}).entries(data.text);
		data.acquirer_activies = data.byText.map(function(d) {
			return {
				name: getShortName(d.key),
				company_name: d.key,
				ts_dev_hl: d.values.map(function(v) {
					return {
						date: v['Key Developments By Date'],
						key_dev_hl: v['Key Development Headline']
					}
				})
			}
		})

		data.variables = d3.keys(data.values[0]).filter(function(key) { return key !== "Company" && key !== "Company_Name" && key !== "YEAR" })
		data.tsData = d3.nest().key(function(d) {
			return d['Company_Name']
		}).map(data.values, d3.map)

		var dateParse = d3.time.format('%e/%m/%Y').parse;
		data.brushData = data.transactions.map(function(t) {
			return {
				announce_date: dateParse(t['All Transactions Announced Date']),
				buyers: t['Buyers/Investors'],
				name: getShortName(t['Buyers/Investors']),
				target: t['Target/Issuer'],
				transaction_status: t['Transaction Status'],
				total_transaction_value: t['Total Transaction Value ($USDmm, Historical rate)'],
				transaction_comments: t['Transaction Comments'],
				randomNum: Math.random()*2-1
			}
		})

		return data
	})();

	console.log('data', data)

	var brushChart = (function() {
		var brushChart = {};
		var main_margin = {top: 40, right: 40, bottom: 60, left: 60};
		var mini_margin = {top: 240, right: 40, bottom: 60, left: 60}
		var width = 960 - main_margin.left - main_margin.right;
		var mainHeight = 300 - main_margin.top - main_margin.bottom;
		var miniHeight = 320 - mini_margin.top - mini_margin.bottom;
		var x = d3.time.scale().range([0, width]);
		var mini_x = d3.time.scale().range([0, width]);
		var main_y = d3.scale.linear().range([mainHeight, 0]);
		var mini_y = d3.scale.linear().range([miniHeight, 0]);

		var xAxis = d3.svg.axis()
			.scale(x)
			.orient('bottom');
		
		var brushChartSVG = d3.select('svg.brushchart')
			.attr('width', width + main_margin.left + main_margin.right)
			.attr('height', mainHeight + main_margin.top + main_margin.bottom);
		var main = brushChartSVG.append('g')
			.attr('transform', 'translate(' + main_margin.left + ',' + main_margin.top + ')');
		var mini = brushChartSVG.append('g')
			.attr('transform', 'translate(' + mini_margin.left + ',' + mini_margin.top + ')');

		x.domain(d3.extent(data.brushData, function(d) {
			return d.announce_date;
		}))
		mini_x.domain(x.domain())
		mini_y.domain([-20, 20]);
		main_y.domain([-20, 20]);
		var brush = d3.svg.brush()
				.x(mini_x)
				.on('brush', brushed);
		
		brushChart.plot = function() {
			
			main.selectAll('.main.circle')
				.data(data.brushData)
				.enter()
				.append('circle')
				.attr('class', 'main circle')
				.attr('r', 12)
				.attr('cx', function(d) { return x(d.announce_date); })
				.attr('cy', function(d) {
					return main_y(16*d.randomNum); 
				})
				.style('fill', function(d) {
					return colors[d.name]
				})
				.style('opacity', 0.6);
				
			mini.append('g')
				.attr('class', 'x brush')
				.call(brush)
				.selectAll('rect')
				.attr('y', -12)
				.attr('height', miniHeight + 27);
			mini.selectAll('.mini.circle')
				.data(data.brushData)
				.enter()
				.append('circle')
				.attr('class', 'mini circle')
				.attr('r', 8)
				.attr('cx', function(d) { return mini_x(d.announce_date); })
				.attr('cy', function(d) {
					return mini_y(16*d.randomNum); })
				.style('fill', function(d) {
					return colors[d.name] })
				.style('opacity', 0.6)
				
		}

		function brushed() {
			
			x.domain(brush.empty() ? x.domain() : brush.extent());
			//console.log(x.domain())
			main.selectAll('.main.circle')
				.attr('cx', function(d) { return x(d.announce_date); })
				.attr('cy', function(d) { return main_y(16*d.randomNum); });
		}	




		return brushChart;
	})()

	var pieChart = (function() {
		var pieChart = {};
		var pieWidth = 250;
		var pieHeight = 300;
		var radius = Math.min(pieWidth, pieHeight) / 2;
		var margin = {
			top: 40,
			right: 40,
			bottom: 30,
			left: 40
			}

		var arc = d3.svg.arc()
				.outerRadius(radius -20)
				.innerRadius(0);
		var pie = d3.layout.pie()
				.sort(null)
				.value(function(d) { return d.volume; })

		var pieChartSVG = d3.select('svg.piechart')
				.attr('width', pieWidth)
				.attr('height', pieHeight)
				.append('g')
				.attr('transform', 'translate(' + pieWidth/2 + ',' + pieWidth/2 + ')');
		var move_delta = 20;

		pieChart.plot = function() {
			var g = pieChartSVG.selectAll('.arc')
					.data(pie(data.pieData))
					.enter().append('g')
					.attr('class', function(d) {
						return 'arc ' + d.data.name;
					})
			g.append('path')
				.attr('d', arc)
				.style('fill', function(d) {
					
					return colors[d.data.name];
				})
				.on('click', function(d) {
					//controller.something
					console.log('click ', d)
					console.log(data.acquirer_activies)
				})
				.on('mouseover', function(d) {
					
					var alpha = d.startAngle + 0.5*(d.endAngle-d.startAngle);
					var move_x = move_delta * Math.sin(alpha);
					var move_y = -move_delta * Math.cos(alpha);
					d3.select(this).attr('transform', 'translate(' + move_x + ',' + move_y + ')');
					d3.select('.row.' + d.data.name).style('background-color', colors[d.data.name])
									.style('color', 'white');

				})
				.on('mouseout', function(d) {
					
					d3.select(this).attr('transform', 'translate(0, 0)');
					d3.select('.row.' + d.data.name)
						.style('background-color', null)
						.style('color', 'black');
				});
		//draw table
		(function() {
			var table = d3.select('#pie-wrapper')
					.append('table')
					.attr('class', 'pie_table');
			var thead = table.append('thead'),
			    tbody = table.append('tbody');

			var columns = ['company_name', 'volume'];

			thead.append('tr')
				.selectAll('th')
				.data(columns)
				.enter()
				.append('th')
				.text(function(d) { return d; });

			var rows = tbody.selectAll('tr')
				.data(pie(data.pieData))
				.enter()
				.append('tr')
				.attr('class', function(d) {
					return 'row ' + d.data.name;
				})
				.on('mouseover', function(d) {
					d3.select(this).style('background-color', colors[d.data.name])
									.style('color', 'white');
					var alpha = d.startAngle + 0.5*(d.endAngle-d.startAngle);
					var move_x = move_delta * Math.sin(alpha);
					var move_y = -move_delta * Math.cos(alpha);
					d3.select('.arc.' + d.data.name).attr('transform', 'translate(' + move_x + ',' + move_y + ')');

				})
				.on('mouseout', function(d) {
					d3.select(this)
						.style('background-color', null)
						.style('color', 'black');
					d3.select('.arc.' + d.data.name).attr('transform', 'translate(0,0)');
				});
			var cells = rows.selectAll('td')
				.data(function(row) {
					return columns.map(function(column) {
						return { column: column, value: row.data[column]};
					})
				})
				.enter()
				.append('td')
				.text(function(d) { return d.value; })

		})()
		}
		return pieChart;
	})()

	var yearParse = d3.time.format('FY%Y').parse;
	var yearFormat = d3.time.format('FY%Y');

	var tsChart = (function() {
		var tsChart = {};
		var margin = {
			top: 40,
			right: 40,
			bottom: 60,
			left: 60
			}
		var tsWidth = 500 - margin.left - margin.right;
		var tsHeight = 300 - margin.top - margin.bottom;
		var controlWidth = 100;
		var controlHeight = 400;
		var controlSVG = d3.select('svg.control');
		//create select bars
		(function() {
			d3.select('#variable-selector').append('select')
				.selectAll('option')
				.data(data.variables)
				.enter()
				.append('option')
				.attr('value', function(d) { return d; })
				.text(function(d) { return d; });
			d3.select('#company-multi-selector').append('select')
				.attr('id', 'multi-selected-options')
				.attr('multiple', 'multiple')
				.selectAll('option')
				.data(data.groupBarData.map(function(d) { return d.name; }))
				.enter()
				.append('option')
				.attr('value', function(d) { return d; })
				.text(function(d) { return d; });
		
			$('#multi-selected-options').multiSelect();
			$('#updatebutton').on('click', function() {
				var selected_companies = []
				$('.ms-elem-selection.ms-selected span').each(function(i, d) {
					selected_companies.push(d.innerText)
				})
				var variable = $('#variable-selector option:selected').val();
				state = {
					variable: variable,
					selected_companies: selected_companies
					}
				tsChart.plot(state);	
			})

		})()

		var tsChartSVG = d3.select('svg.tschart')
			.attr('width', tsWidth + margin.left + margin.right)
			.attr('height', tsHeight + margin.top + margin.bottom)
			.append('g')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

		var line = d3.svg.line()
					.x(function(d) { console.log(d); return x(d.year); })
					.y(function(d) { return y(d.value); })

		var x = d3.time.scale().range([0, tsWidth]);
		var y = d3.scale.linear().range([tsHeight, 0]);
		var xAxis = d3.svg.axis()
			.scale(x)
			.orient('bottom')
			.tickFormat(yearFormat);
		var yAxis = d3.svg.axis()
			.scale(y)
			.orient('left')
			.tickFormat(d3.format('.3s'))
			.ticks(5);
		function make_y_axis() {
			return d3.svg.axis().scale(y).orient('left');
		}
		tsChartSVG.append('g')
				.attr('class', 'x axis');
			tsChartSVG.append('g')
				.attr('class', 'y axis');
			tsChartSVG.select('.y.axis').append('text')
				.attr('class', 'y_text')
				.attr('transform', 'rotate(-90)')
				.attr('y', 6)
				.attr('dy', '.71em')
				.style('text-anchor', 'end');
		tsChartSVG.append('g').attr('class', 'y grid');

		
		tsChart.plot = function(opt) {
			var variable = opt.variable;
			var selected_companies = opt.selected_companies;

			lines_data  = selected_companies.map(function(company){

				return {
					name: company,
					ts_values: data.tsData[getFullName(company)].map(function(d) {
						return {
							year: yearParse(d.YEAR),
							value: +d[variable],
							company: company
						}
					})
				}
			})
			x.domain([d3.min(lines_data, function(l) {
				return d3.min(l.ts_values, function(t) {
					return t.year;
				})
			}), d3.max(lines_data, function(l) {
				return d3.max(l.ts_values, function(t) {
					return t.year;
				})
			})])
			y.domain([0, d3.max(lines_data, function(l) {
				return d3.max(l.ts_values, function(t) {
					return t.value;
				})
			})])
			//console.log(x.domain())
			//console.log(y.domain())
			tsChartSVG.select('.y.grid').call(make_y_axis().tickSize(-tsWidth, 0, 0).tickFormat(''));
			tsChartSVG.select('.x.axis').attr('transform', 'translate(0,' + tsHeight + ')')
				.transition()
				.call(xAxis);

			tsChartSVG.select('.y.axis')
				.transition()
				.call(yAxis);
				
			
			tsChartSVG.select('.y_text').text(variable);
			tsChartSVG.selectAll('.ts_line').remove();
			tsChartSVG.selectAll('.ts_line').data(lines_data.map(function(l){ return l.ts_values; }))
				.enter()
				.append('path')
				.attr('class', 'ts_line')
				.attr('d', line)
				.style('stroke', function(t) {
					return colors[t[0]['company']]
				});
			
			tsChartSVG.selectAll('.circle').remove();
			tsChartSVG.selectAll('.circle')
				.data([].concat.apply([], lines_data.map(function(l){ return l.ts_values; })))
				.enter()
				.append('circle')
				.attr('class', 'circle')
				.attr('r', 3)
				.attr('cx', function(d) { return x(d.year); })
				.attr('cy', function(d) { return y(d.value); })
				.style('fill', function(d) { return colors[d['company']]});

		}

	})();
	
	
	var groupBarChart = (function() {
		var groupBarChart = {};
		var margin = {
			top: 40,
			right: 40,
			bottom: 60,
			left: 40
			}
		var barWidth = 700 - margin.left - margin.right;
		var barHeight = 400 - margin.top - margin.bottom;
		var x0 = d3.scale.ordinal()
				.rangeRoundBands([0, barWidth], 0.1);
		var	x1 = d3.scale.ordinal();
		var y = d3.scale.linear().range([barHeight, 0]);
		var xAxis = d3.svg.axis()
			.scale(x0)
			.orient('bottom');
		var yAxis = d3.svg.axis()
			.scale(y)
			.orient('left');
		var groupBarChartSVG = d3.select('svg.barchart')
			.attr('width', barWidth + margin.left + margin.right)
			.attr('height', barHeight + margin.top + margin.bottom)
			.append('g')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
		
		function make_y_axis() {
			return d3.svg.axis().scale(y).orient('left');
		}

		groupBarChartSVG.append('defs')
			.append('clipPath')
			.attr('id', 'clip')
			.append('rect')
			.attr('width', barWidth)
			.attr('height', barHeight);
		groupBarChartSVG.append('g').attr('class', 'y grid');
		groupBarChartSVG.select('.y.grid').call(make_y_axis().tickSize(-barWidth, 0, 0).tickFormat(''));
		groupBarChart.plot = function() {
			x0.domain(data.groupBarData.map(function(d) { return d.name; }));
			x1.domain(data.types).rangeRoundBands([0, x0.rangeBand()]);
			y.domain([0, 1.2*d3.max(data.groupBarData, function(d) {
				return d3.max(d.activities, function(a) {
					return a.value;
				})
			})])
			
			groupBarChartSVG.append('g')
				.attr('class', 'x axis')
				.attr('transform', 'translate(0,' + barHeight + ')')
				.call(xAxis);
			groupBarChartSVG.append('g')
				.attr('class', 'y axis')
				.call(yAxis)
				.append('text')
				.attr('transform', 'rotate(-90)')
				.attr('y', 6)
				.attr('dy', '.71em')
				.style('text-anchor', 'end')
				.text('#activities');

			var company = groupBarChartSVG.selectAll('.company')
				.data(data.groupBarData)
				.enter()
				.append('g')
				.attr('class', 'company activities')
				.attr('transform', function(d) { return 'translate(' + x0(d.name) + ',0)'; });
			company.selectAll('rect')
				.data(function(d) { return d.activities; })
				.enter()
				.append('rect')
				.attr('width', x1.rangeBand())
				.attr('x', function(d) { return x1(d.type); })
				.attr('y', function(d) { return y(d.value); })
				.attr('height', function(d) { return barHeight - y(d.value); })
				.style('fill', function(d, i) { return bar_colors[d.type]; })

			var legend = groupBarChartSVG.selectAll('.legend')
				.data(data.types)
				.enter().append('g')
				.attr('class', 'legend')
				.attr('transform', function(d, i) {
					return "translate(" + i*180 + "," + (barHeight+30) + ")" ;
				});
			legend.append('rect')
				.attr('x', 0)
				.attr('width', 18)
				.attr('height', 18)
				.style('fill', function(d) { return bar_colors[d]; });
			legend.append('text')
				.attr('x', 20)
				.attr('y', 9)
				.attr('dy', '.35em')
				.style('text-anchor', 'start')
				.text(function(d) { return d; })
				.attr('font-size', '14px')



		}





		return groupBarChart;
	})()

	controller.init()
}


d3.csv('data/data_sample.csv', function(values) {
	d3.csv('data/transactions_sample.csv', function(transactions) {
		d3.csv('data/text_sample.csv', function(text) {
			d3.select('#loading')
				.transition()
				.duration(1000)
				.style('opacity', 0)
				.remove();
			vis({
				values: values,
				transactions: transactions,
				text: text
			})

		})
	})
})
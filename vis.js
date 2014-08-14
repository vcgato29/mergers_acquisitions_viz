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
		data.types = ['Executive/Board Changes - Other', 'Lawsuits & Legal Issues', 'Business Expansions'];
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

		return data
	})();

	console.log('data', data)

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
				.attr('transform', 'translate(' + pieWidth/2 + ',' + pieHeight/2 + ')');
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

	var groupBarChart = (function() {
		var groupBarChart = {};
		var margin = {
			top: 40,
			right: 40,
			bottom: 30,
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

		groupBarChart.plot = function() {
			x0.domain(data.groupBarData.map(function(d) { return d.name; }));
			x1.domain(data.types).rangeRoundBands([0, x0.rangeBand()]);
			y.domain([0, d3.max(data.groupBarData, function(d) {
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
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
				volume: d.values.length,
				details: d.values
			}
		});
		data.byType = d3.nest().key(function(d) { return d['Company Name(s)'] })
							   .key(function(d) { return d['Key Developments by Type']})
							   .rollup(function(leaves) { return leaves.length; })
							   .map(data.text, d3.map);

		var allEvents = data.text.map(function(t) { return t['Key Developments by Type']; });
		data.allEvents = [];
		allEvents.forEach(function(e) {
			if (data.allEvents.indexOf(e) < 0) {
				data.allEvents.push(e)
			}
		})
		
		data.companies = d3.keys(data.byType).map(function(t) {
			return getShortName(t)
		});
		//data.groupBarData = []
		//data.types = ['Executive/Board Changes - Other', 'Lawsuits & Legal Issues', 'Business Expansions'].reverse();
		//data.company_short_names = [];
		/*
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
		*/
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
		data.sortedTransactions = data.transactions.sort(function(a, b){
			var a_value = a['Total Transaction Value ($USDmm, Historical rate)'] === '-' ? 0 : +a['Total Transaction Value ($USDmm, Historical rate)']
			var b_value = b['Total Transaction Value ($USDmm, Historical rate)'] === '-' ? 0 : +b['Total Transaction Value ($USDmm, Historical rate)']
			return a_value > b_value ? -1 : 1
			
		})
		
		data.brushData = data.sortedTransactions.map(function(t) {
	
			return {
				announce_date: dateParse(t['All Transactions Announced Date']),
				str_announce_date: t['All Transactions Announced Date'],
				buyers: t['Buyers/Investors'],
				name: getShortName(t['Buyers/Investors']),
				target: t['Target/Issuer'],
				transaction_status: t['Transaction Status'],
				total_transaction_value: t['Total Transaction Value ($USDmm, Historical rate)'],
				transaction_comments: t['Transaction Comments'],
				target_state: t['State/Region From Primary Address [Target/Issuer]'],
				//randomNum: t['Total Transaction Value ($USDmm, Historical rate)'] > 0 ? Math.random()-1 : Math.random()*2-1
				randomNum: Math.random()*2-1
			}
		})
		//sort brushData by total_transaction_value so that all dots will be visiable
	

		return data
	})();

	console.log('data', data)

	var brushChart = (function() {
		var brushChart = {};
		var main_margin = {top: 40, right: 40, bottom: 150, left: 60};
		var mini_margin = {top: 240, right: 40, bottom: 110, left: 60}
		var width = 960 - main_margin.left - main_margin.right;
		var mainHeight = 320 - main_margin.top - main_margin.bottom;
		var miniHeight = 370 - mini_margin.top - mini_margin.bottom;
		var x = d3.time.scale().range([0, width]);
		var mini_x = d3.time.scale().range([0, width]);
		var main_y = d3.scale.linear().range([mainHeight, 0]);
		var mini_y = d3.scale.linear().range([miniHeight, 0]);

		var xAxis = d3.svg.axis()
			.scale(x)
			.orient('bottom');
		var minixAixs = d3.svg.axis()
			.scale(mini_x)
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
		
		/*
		var boxWidth = 200;
		var boxHeight = 300
		//add a rect border for side-info display		
			var sideinfoSVG = d3.select('#side-info')
			.append('svg')
			.attr('width', boxWidth)
			.attr('height', boxHeight)

			var rect = sideinfoSVG.append('rect')
						.attr('x', 5)
						.attr('y', 5)
						.attr('width', boxWidth-10)
						.attr('height', boxHeight-10)
						.style('fill', 'none')
						.attr('stroke', 'steelblue')
						.attr('stroke-width', 2)
						;
		*/
	
		brushChart.plot = function() {


			main.append('g')
				.attr('class', 'x axis')
				.attr('transform', 'translate(0,' + mainHeight + ')')
				.call(xAxis);
			main.selectAll('.main.circle')
				.data(data.brushData)
				.enter()
				.append('circle')
				.attr('class', 'main circle')
				.attr('r', function(d) {
					if (d.total_transaction_value === '-') { return 4; }
					else return Math.log(+d.total_transaction_value+1)*4;
				})
				.attr('cx', function(d) { return x(d.announce_date); })
				.attr('cy', function(d) {
					return main_y(16*d.randomNum); 
				})
				.style('fill', function(d) {
					return colors[d.name]
				})
				.style('opacity', 0.6)
				.attr('title', function(d, i) {
					return '<div class="transaction-info"><p>Announced Date: ' + d.str_announce_date + '</p><p>Buyers: ' + d.buyers + '</p><p>Target: '
					 + d.target + '</p><p>Transaction Status: ' + d.transaction_status + '</p><p class="value">Total Transaction Value ($USDmm, Historical rate):' +
					 + d.total_transaction_value + '</p><p>Target State: ' + d.target_state + '</p></div>'
					 //'</p><p>Transaction Comments: ' +d.transaction_comments + '</p></div>'
				})
				.on('mouseover', function(d) {
					d3.select(this)
					.style('stroke', 'red')
					.style('stroke-width', '2.5px')
					.style('opacity', 0.8);
					//d3.select('.row.'+d.name).style('background-color', colors[d.name])
					//				.style('color', 'white');
				})
				.on('mouseout', function(d) {
					d3.select(this)
					.style('stroke', 'none')
					.style('stroke-width', 'none')
					.style('opacity', 0.6);
					//d3.select('.row.' + d.name)
					//	.style('background-color', null)
					//	.style('color', 'black');
				})
				.on('click', function(d) {
					d3.select(this)
					.style('opacity', 1);

					d3.select('#comments-box #comments-body')
						.text(d.transaction_comments)
					/*
					var transaction_info = {
						'Announce_date': d.str_announce_date,
						'Buyers': d.buyers,
						'Target': d.target,
						'Transaction Status': d.transaction_status,
						'Total Transaction Value ($USDmm, Historical rate)': d.total_transaction_value,
						'Target State': d.target_state
						};

				
				
					var transaction_text = d3.entries(transaction_info);
					
					sideinfoSVG.select('.text').remove();
					text = sideinfoSVG.append('foreignObject')
						.attr('x', 10)
						.attr('y', 10)
						.attr('class', 'text')
						.attr('width', boxWidth-20)
						.attr('height', boxHeight-20)
						.append('xhtml:body')
						.html('<div class="transaction-info" style="width: 170px;"><p>Announced Date: ' + d.str_announce_date + '</p><p>Buyers: ' + d.buyers + '</p><p>Target: '
					 + d.target + '</p><p>Transaction Status: ' + d.transaction_status + '</p><p class="value">Total Transaction Value ($USDmm, Historical rate):' +
					 + d.total_transaction_value + '</p><p>Target State: ' + d.target_state +
					 '</p></div>')
						.style('background', 'none')

				*/
				 })
				$('.main.circle').tipsy({
					html: true,
					gravity: 's'
				})

			mini.append('g')
				.attr('class', 'x axis')
				.attr('transform', 'translate(0,' + (10+miniHeight) + ')')
				.call(minixAixs)
				;

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
				.attr('r', function(d) {
					if (d.total_transaction_value === '-') { return 1.5; }
					else return Math.log(+d.total_transaction_value+1)*1.5;
				})
				.attr('cx', function(d) { return mini_x(d.announce_date); })
				.attr('cy', function(d) {
					return mini_y(16*d.randomNum); })
				.style('fill', function(d) {
					return colors[d.name] })
				.style('opacity', 0.6)
			/*	
			$('.main.circle').tipsy({
				html: true,
				gravity: 's'
			});	
*/
		}

		function brushed() {
			x.domain(brush.empty() ? mini_x.domain() : brush.extent());
			
			main.selectAll('.main.circle')
				.attr('cx', function(d) { return x(d.announce_date); })
				.attr('cy', function(d) { return main_y(16*d.randomNum); })
				
				// .on('click', function(d) {
				// 	alert('Click!')
				// })
			main.select('.x.axis').call(xAxis);
			
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
				})
				.on('click', function(d) {
					d3.selectAll('.activities-area p').remove()
					d3.select('#activities-header .company-short-name').text(d.data.name + ' ').style('color', colors[d.data.name]);
					d3.select('.activities-area').selectAll('p')
						.data(d.data.details)
						.enter()
						.append('p')
						.text(function(d, i) {
							return (i+1) + ') ' + d['All Transactions Announced Date'] + ': ' + d['Target/Issuer']
						})
					
				});
		//draw table
		(function() {
			var table = d3.select('.pie_table');
			var thead = table.append('thead'),
			    tbody = table.append('tbody');

			var columns = ['company_name', 'volume'];

			thead.append('tr')
				.selectAll('th')
				.data(columns)
				.enter()
				.append('th')
				.text(function(d) { return d.charAt(0).toUpperCase() + d.slice(1); });


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
				})
				.on('click', function(d) {
					
					d3.selectAll('.activities-area p').remove()
					d3.select('#activities-header .company-short-name').text(d.data.name + ' ').style('color', colors[d.data.name]);
					d3.select('.activities-area').selectAll('p')
						.data(d.data.details)
						.enter()
						.append('p')
						.text(function(d, i) {
							return (1+i) + ') ' + d['All Transactions Announced Date'] + ': ' + d['Target/Issuer']
						})
				})

				;
			var cells = rows.selectAll('td')
				.data(function(row) {
					return columns.map(function(column) {
						return { column: column, value: row.data[column]};
					})
				})
				.enter()
				.append('td')
				.text(function(d) { return d.value; })
				.style('text-align', function(d) {
					return d.column === 'volume' ? 'center' : 'left';
				})

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
			right: 70,
			bottom: 60,
			left: 40
			}
		var tsWidth = 650 - margin.left - margin.right;
		var tsHeight = 300 - margin.top - margin.bottom;
		
		//create select bars
		(function() {

			d3.select('#variable-selector').append('select')
				.selectAll('option')
				.data(data.variables)
				.enter()
				.append('option')
				.attr('value', function(d) { return d; })
				.text(function(d) { return d; });
			
			var companyGroup = d3.select('#company-multi-selector').append('select')
				.attr('id', 'optgroup')
				.attr('multiple', 'multiple');

			var companyMultiSelector = companyGroup.append('optgroup')
				.attr('label', 'Select Companies')
				;

			companyMultiSelector.selectAll('option')
				.data(data.companies)
				.enter()
				.append('option')
				.attr('value', function(d) { return d; })
				.text(function(d) { return d; });
		
			$('#finance #optgroup').multiSelect();
			$('.ms-selection .ms-optgroup-label span').text('Select To Remove');
			$('#finance #updatebutton').on('click', function() {
				var selected_companies = []
				$('#finance .ms-elem-selection.ms-selected span').each(function(i, d) {
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

		var tsChartSVG = d3.select('#ts-wrapper svg.tschart')
			.attr('width', tsWidth + margin.left + margin.right)
			.attr('height', tsHeight + margin.top + margin.bottom)
			.append('g')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

		var line = d3.svg.line()
					.x(function(d) { return x(d.year); })
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
		var valueFormat = d3.format('.3s');
		function make_y_axis() {
			return d3.svg.axis().scale(y).orient('left');
		}
		tsChartSVG.append('g')
			.attr('class', 'x axis');
		tsChartSVG.select('.x.axis').append('text')
			.attr('x', tsWidth/2)
			.attr('y', 40)
			.attr('class', 'ts_x_text')
			.style('text-anchor', 'middle')
			;
		tsChartSVG.append('g')
			.attr('class', 'y axis');
		tsChartSVG.select('.y.axis').append('text')
			.attr('class', 'y_text')
			.attr('transform', 'rotate(-90)')
			.attr('y', 6)
			.attr('dy', '.71em')
			.style('text-anchor', 'end');
		tsChartSVG.append('g').attr('class', 'y grid');
		tsChartSVG.append('text').attr('class', 'title')
				.attr('x', tsWidth/2)
				.attr('y', -10)
				.attr('text-anchor', 'middle');
		
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
			tsChartSVG.select('.ts_x_text').text('year');
			tsChartSVG.select('.y.grid').call(make_y_axis().tickSize(-tsWidth, 0, 0).tickFormat('').ticks(5));
			tsChartSVG.select('.x.axis').attr('transform', 'translate(0,' + tsHeight + ')')
				.transition()
				.call(xAxis);

			tsChartSVG.select('.y.axis')
				.transition()
				.call(yAxis);
				
			
			//tsChartSVG.select('.y_text').text(variable);
			tsChartSVG.select('.title').text(variable);
			tsChartSVG.selectAll('.ts_line').remove();
			tsChartSVG.selectAll('.ts_line').data(lines_data.map(function(l){ return l.ts_values; }))
				.enter()
				.append('path')
				.attr('class', 'ts_line')
				.attr('d', line)
				.style('stroke', function(t) {
					return colors[t[0]['company']]
				});
			
			tsChartSVG.selectAll('.ts-circle').remove();
			tsChartSVG.selectAll('.ts-circle')
				.data([].concat.apply([], lines_data.map(function(l){ return l.ts_values; })))
				.enter()
				.append('circle')
				.attr('class', 'ts-circle')
				.attr('r', 3)
				.attr('cx', function(d) { return x(d.year); })
				.attr('cy', function(d) { return y(d.value); })
				.attr('title', function(d) {
					return '<div class=ts-info><p>Company: ' + d.company + '</p><p>Year:' + yearFormat(d.year) + '</p><p>Value: ' + valueFormat(d.value) + '</p></div>';
				})
				.style('fill', function(d) { return colors[d['company']]})
				.on('mouseover', function(d) {
					d3.select(this).transition().attr('r', 5);
				})
				.on('mouseout', function() {
					d3.select(this).transition().attr('r', 3);
				})
				;
			$('.ts-circle').tipsy({
				html: true,
				gravity: 's'

			});


			//draw legends
			tsChartSVG.selectAll('.legend').remove();
			var legend = tsChartSVG.selectAll('.legend')
				.data(selected_companies)
				.enter().append('g')
				.attr('class', 'legend')
				.attr('transform', function(d, i) {
					return 'translate(0,' + i* 20 + ')';
				});
			legend.append('rect')
				.attr('x', tsWidth + 10)
				.attr('width', 14)
				.attr('height', 14)
				.style('fill', function(d) {
					return colors[d];
				})
			legend.append('text')
				.attr('x', tsWidth + 26)
				.attr('y', 8)
				.attr('dy', '.35em')
				.style('text-anchor', 'start')
				.text(function(d) { return d; })
				.attr('font-size', '12px')
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
		var barWidth = 960 - margin.left - margin.right;
		var barHeight = 400 - margin.top - margin.bottom;

		(function() {

			var eventsGroup = d3.select('#event-multi-selector').append('select')
				.attr('id', 'optgroup')
				.attr('multiple', 'multiple');
			var eventMultiSelector = eventsGroup.append('optgroup')
				.attr('label', 'Select Events');

			eventMultiSelector.selectAll('option')
				.data(data.allEvents)
				.enter()
				.append('option')
				.attr('value', function(d) { return d; })
				.text(function(d) { return d; });

			$('#company-activities #optgroup').multiSelect({});
			$('.ms-selection .ms-optgroup-label span').text('Select To Remove');

			$('#company-activities #updatebutton').on('click', function() {
				var selected_events = [];
				$('#company-activities .ms-elem-selection.ms-selected span').each(function(i, d) {
					selected_events.push(d.innerText)
				})
				
				state = {
					selected_events: selected_events
				}
				groupBarChart.plot(state);
			})

		})()


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
		var eventsColors = d3.scale.category20().domain(data.allEvents);
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
		
		groupBarChartSVG.append('g')
				.attr('class', 'y axis');
		groupBarChartSVG.select('.y.axis')
			.append('text')
			.attr('class', 'y_text')
			.attr('x', 30)
			.attr('y', -26)
			.attr('dy', '.71em')
			.style('text-anchor', 'end');
		groupBarChartSVG.append('g')
				.attr('class', 'x axis')
				.attr('transform', 'translate(0,' + barHeight + ')')
				;

		groupBarChart.plot = function(opt) {
			var selected_events = opt.selected_events;
			console.log(selected_events)
			var groupBarData = []
			for (var c_name in data.byType) {
				groupBarData.push({
					name: getShortName(c_name),
					company_name: c_name,
					activities: selected_events.map(function(e) {
						console.log(data.byType[c_name])
						return { type: e, value: data.byType[c_name][e] || 0}
					})
				})
			}
			groupBarChartSVG.select('.y.grid').call(make_y_axis().tickSize(-barWidth, 0, 0).tickFormat(''));

			d3.selectAll('#company-activities .ms-elem-selection.ms-selected')
				.style('background', function(d, i) { return eventsColors(selected_events[i])})
				.style('color', 'white')
				;

			x0.domain(groupBarData.map(function(d) { return d.name; }));
			x1.domain(selected_events).rangeRoundBands([0, x0.rangeBand()]);
			y.domain([0, 1.2*d3.max(groupBarData, function(d) {
				return d3.max(d.activities, function(a) {
					return a.value;
				})
			})])
			
			
			groupBarChartSVG.select('.x.axis').call(xAxis);
			groupBarChartSVG.select('.y.axis')
				.transition()
				.call(yAxis);
				
			groupBarChartSVG.select('.y_text').text('#activities');

			var company = groupBarChartSVG.selectAll('.company')
				.data(groupBarData);

			company.enter()
				.append('g')
				.attr('class', 'company activities')
				.attr('transform', function(d) { return 'translate(' + x0(d.name) + ',0)'; });
			
			//company.selectAll('.smallbar').remove();
			var bars = company.selectAll('.smallbar')
				.data(function(d) { return d.activities; });


			
			bars.enter()
				.append('rect')
				.attr('class', 'smallbar')
				.attr('width', x1.rangeBand())
				.attr('x', function(d) { return 0; })
				.attr('y', function(d) { return barHeight; })
				//.attr('height', function(d) { return barHeight - y(d.value); })
				.style('fill', function(d, i) { return eventsColors(d.type); })
				
				.on('mouseover', function(d) {
					console.log(d)
					d3.select(this).style('opacity', 0.8);
				})
				.on('mouseout', function() {
					d3.select(this).style('opacity', 1);
				});
			

			bars.transition()
				.attr('width', x1.rangeBand())
				.attr('x', function(d) { return x1(d.type); })
				.attr('y', function(d) { return y(d.value); })
				.attr('height', function(d) { return barHeight - y(d.value); })
				.style('fill', function(d, i) { return eventsColors(d.type); })
				;

			bars.exit().transition().style('opacity', 0).remove();
			bars.attr('title', function(d) {

					return '<div class="event-info"><p>Event: ' + d.type + '</p><p># activities: ' + d.value + '</p></div>'
					
				})
			$('.smallbar').tipsy({
				html: true,
				gravity:  's'
			})
				

		// 
				
				/*
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
	*/


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
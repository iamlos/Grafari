/**
 * MiSearch main.js
 * PA 27-10-2014
 */
require(['../common'], function() {

<<<<<<< HEAD
	require(['jquery', 'isotope', 'parser'], function($, isotope, parser) {

      // make Isotope a jQuery plugin
      $.bridget( 'isotope', isotope );

		$(function(){
			console.log('Setting up ...');
			miSearch_init();

			var $container = $('#results');

			$('.subQuery').click(function(){
				var id = $(this).attr("data-id");

				$container.isotope({
				  itemSelector: '.result',
				  layoutMode: 'fitRows',
				  filter: id
				});
			});

			$('.mainQuery').click(function(){
				$container.isotope({
				  itemSelector: '.result',
				  layoutMode: 'fitRows',
				  filter: ''
				});
			});

		});

		/**
		 * Initial Page Setup 
		 */
		function miSearch_init(){
			// Setup Button Handler
			miSearch_reg_btn();

			parser.parseString("foo!");

			// Example text for the demo
			$(".form-control").val("All people who live in Germany AND ( people who are self-employed OR NOT people who are homeless )");
		}

		/**
		 * Register Page-Handler
		 */
		function miSearch_reg_btn(){
			var brandRow = $('#brandRow');
			var resultWell = $('#resultWell');
			var queryHistory = $('#queryHistory');
			var resultSpinner = $('#resultSpinner');
			var results = $('#results');
			
			$('#btn_search').click(function(){
				brandRow.removeClass('center');
				
				setTimeout(function(){
					resultWell.removeClass('hidden');
					queryHistory.removeClass('hidden');
				}, 400);
				
				setTimeout(function(){
					resultSpinner.addClass('hidden');
					results.removeClass('hidden');
					init_isotope();
				}, 1000);
			});
			
			$('#btn_clear').click(function(){
				resultWell.addClass('hidden');
				brandRow.addClass('center');
				resultSpinner.removeClass('hidden');
				results.addClass('hidden');
			});
			
		}

		function init_isotope(){
			var $container = $('#results');
			// init
			$container.isotope({
			  // options
			  itemSelector: '.result',
			  layoutMode: 'fitRows'
			});
		}
	});
=======
    require(['jquery', 'isotope', 'underscore', 'searchAPI'], function($, isotope) {

        // make Isotope a jQuery plugin
        $.bridget('isotope', isotope);

        $(function() {
            console.log('Setting up ...');
            miSearch_init();

            var $container = $('#results');

            $('.subQuery').click(function() {
                var id = $(this).attr("data-id");

                $container.isotope({
                    itemSelector: '.result',
                    layoutMode: 'fitRows',
                    filter: id
                });
            });

            $('.mainQuery').click(function() {
                $container.isotope({
                    itemSelector: '.result',
                    layoutMode: 'fitRows',
                    filter: ''
                });
            });

        });

        /**
         * Initial Page Setup 
         */
        function miSearch_init() {
            // Setup Button Handler
            miSearch_reg_btn();


            // Example text for the demo
            $(".form-control").val("All people who live in Germany AND ( people who are self-employed OR NOT people who are homeless )");
        }

        /**
         * Register Page-Handler
         */
        function miSearch_reg_btn() {
            var brandRow = $('#brandRow');
            var resultWell = $('#resultWell');
            var queryHistory = $('#queryHistory');
            var resultSpinner = $('#resultSpinner');
            var results = $('#results');
            var formInput = $('#queryinput');
            var currentQuery = $('#current-query');

            $('#btn_search').click(function() {
                var tokens = search._tokenize(formInput.val());
                currentQuery.empty();
                currentQuery.append(make_Current_Query(formInput.val()));
                console.log('Tokenized: ' + JSON.stringify(tokens));
                console.log('Tokenized: ' + JSON.stringify(parser.parse(tokens)));

                brandRow.removeClass('center');

                setTimeout(function() {
                    resultWell.removeClass('hidden');
                    queryHistory.removeClass('hidden');
                }, 400);

                setTimeout(function() {
                    resultSpinner.addClass('hidden');
                    results.removeClass('hidden');
                    init_isotope();
                }, 1000);
            });

            $('#btn_clear').click(function() {
                resultWell.addClass('hidden');
                brandRow.addClass('center');
                resultSpinner.removeClass('hidden');
                results.addClass('hidden');
            });

        }

        function init_isotope() {
            var $container = $('#results');
            // init
            $container.isotope({
                // options
                itemSelector: '.result',
                layoutMode: 'fitRows'
            });
        }

        function make_Current_Query(query) {
            var queryDivs = '<div class="mainQuery">' + query + '</div><ul class="history">';
            var tokens = search._tokenize(query).reverse();
            while (!tokens.empty()) {
                var cur = tokens.pop();
                if (typeof cur === "string") {
                    queryDivs += '<li class="subQuery">' + cur + '</li>';
                } else {
                    if (cur.name === "(") {
                        queryDivs += '<li><ul class="history">';
                    } else if (cur.name === ")") {
                        queryDivs += '</ul></li>';
                    } else {
                        queryDivs += '<li class="token nav">' + cur.name + '</li>';
                    }
                }
            }
            queryDivs += '</ul>';
            return queryDivs;
        }
    });
>>>>>>> 4ebf384f5c8afd35835990e84549689a81049576
});
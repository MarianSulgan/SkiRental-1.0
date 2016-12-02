/* 
SKIRENTAL 
- mainly frontend functions
*/

var ptr;
var reset_ptr;
var csv_path;
var add_new_state;

var lock = false;

var datePicker = $('.datepicker').datepicker({
    format: 'dd.mm.yyyy',
    startDate: '0d',
    autoclose: true,
    clearBtn: false,
    language: "sk",
    todayHighlight: true,
    weekStart: 1
});

// var calendar = $('#s12-calendar').clndr({
// 	weekOffset: 1,
// 	daysOfTheWeek: ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'],
// 	// events: [
// 	// 	{ date: "2015-12-28", title: "Obsadené", type: "reserved" }
// 	// ]
// });

$remove = $('#remove');
$s1_select = $('#s1_select');
$datum_od = $('#datum-od');
$datum_do = $('#datum-do');

var toInsert = [];
var toDelete = [];
var toUpdate = [];

var Predaj = [];

var isSaved = false;

var isS2Deleted = false;

// on window load
$(window).load(function() {
	// Animate loader off screen
	// $(".se-pre-con").fadeOut("slow");;

	// ziskanie dat do autofillu
	$.get('../data/servis/znacky_lyzi.json', function(data){
		tmp = [];
		for (i = 0; i < data.length; i++) {
			tmp.push(data[i].nazov);
		}
	    $("#autofill-1").typeahead({ source:tmp });
	},'json');
	// add options to selects
	// selectAddOptionJSON("../data/servis/typ_lyzi.json", "servis-select-1");
	selectAddOptionJSON("../data/servis/uhlovanie_spodna_hrana.json", "servis-select-2");
	selectAddOptionJSON("../data/servis/uhlovanie_bocna_hrana.json", "servis-select-3");
	selectAddOptionJSON("../data/servis/servisne_prace.json", "servis-select-4");
});

// bind keypress (arrows) on calendar month changing
// @todo correct and fix!!!
$(document).keydown(function(e) {
    switch(e.which) {
        case 37: // left
        if (currentPage == "#page12") {
        	// $('.clndr-previous-button').click();
        }
        break;

        case 39: // right
        if (currentPage == "#page12") {
        	// $('.clndr-next-button').click();
        }
        break;

        default: return; // exit this handler for other keys
    }
});

// bind screen 2 search input change on searching - live search
// ...
var s2Rendered = false;
$('#s2SearchInput').on('input', function(val) {
	var orig = s2Content();
	var str = $(this).val();
	if (str.length > 2) {
		$('#vypozicky_table').html(S2_DATA);
		s2_renderSearch(str);
		s2Rendered = false;
	} else {
		if (!s2Rendered) {
			$('#vypozicky_table').html(S2_DATA);
			s2Rendered = true;
		}
	}
});

// Renders page specified by id (application is one page app)
function renderPage(id) {

	console.log("render...........");
	
	if (typeof(tooltips) != "undefined") {
		for (i = 0; i < tooltips.length; i++) {
			tooltips[i].tip.hide();
		}
	}

	window.shared.tooltips = tooltips = [ 
			{ 
				"tip": new Tooltip(
					'Najprv vyplňte dátumy výpožičky', 
					{ effectClass: 'warning', place: 'bottom'}), 
				"position": null, 
				"show": false
			},
			{
				"tip": new Tooltip(
					'Druhý tooltip, len tak pre príklad', 
					{ effectClass: 'success', place: 'top'}), 
				"position": null, 
				"show": false
			}	
	];
	
	currentPage = id;
	console.time('render');
	var x = $('.content .page:not(' + id + ')');
	// l(x);
	for (i = 0; i < x.length; i++) { 
		x[i].style.display = 'none';
	}
	// $(id).fadeIn('fast');
	hist.push(id);
	// l(pg[id]);
	$('.navbar-fixed-top .page-heading').html(pg[id]);
	console.timeEnd('render');
	window.shared.flagChanged = false;

	if (id == "#page1") {
		
		var elem = document.querySelector('.datepicker-element');
		tooltips[0].position = elem;
		tooltips[0].show = true;

	} else if (id == "#page2") {

		initHighlightS2();

	} else if (id == "#page5") {

		$.get('../data/predaj.json', function(data) {
			Predaj = JSON.parse(data);
			$('#predaj-predaj-spolu').html(predajPredajSpolu());
			$('#predaj-nakup-spolu').html(predajNakupSpolu());
			$('#predaj-zisk-spolu').html(predajZiskSpolu());
		});

	} else if (id=="#page12") { // Kalendar vypoziciek

		renderItemReservedCalendar(0);
		$('#s12-tovar-table').find('tr.picked').removeClass('picked');

	} else if (id == "#page13") { // prebiehajuci servis

		// ...

	} else if (id == "#page6") { // statistiky

		$('#s6-servis-table').bootstrapTable('refresh');
		execSQLSync('SELECT SUM(cena) FROM (SELECT DISTINCT id, cena FROM servis_archive)').then(function(response) {
			// ll(response);
			$('#page6 #servis-spolu').html(response.item(0)["SUM(cena)"]);
		});
		execSQLSync('SELECT SUM(cena) FROM (SELECT DISTINCT id, cena FROM servis)').then(function(response) {
			// ll(response);
			$('#page6 #servis-preb-spolu').html(response.item(0)["SUM(cena)"]);
		});

	}

	$(id).fadeIn('fast', function() {
		// display tooltips on page rendered
		for (i = 0; i < tooltips.length; i++) {
			if (tooltips[i].show)
				tooltips[i].tip.show(tooltips[i].position);
		}
	});
}

var cumulativeOffset = function(element) {
    var top = 0, left = 0;
    do {
        top += element.offsetTop  || 0;
        left += element.offsetLeft || 0;
        element = element.offsetParent;
    } while(element);

    return {
        top: top,
        left: left
    };
};

var _temp1;
var _temp2;

window.operateEvents = {
    'click .remove': function (e, value, row, index) {
    	// l($(this).parents('td'));
    	$s2_row = $(this).parents('tr');
    	// l(row);
    	bootbox.confirm("Naozaj chcete zmazať položku <br/>" + 
    		JSON.stringify(row).replace(new RegExp('"', 'g'),'').replace(new RegExp(',', 'g'),', ') + 
    		"?", function(result) {
    		if (result) {
    			if (currentPage == "#page3") {
    				var state = $('#page3 li.active a').text();
	    			if (state == 'Tovar') {
	    				$('#s3-tovar-table').bootstrapTable('remove', {
		            		field: 'id',
		            		values: [row.id]
	        			});
	        			toDelete.push({id: row.id, tname: 'tovar'}); 
	    			} else if (state == 'Zákazníci') {
	    				$('#s3-zakaznici-table').bootstrapTable('remove', {
		            		field: 'id',
		            		values: [row.id]
	        			});
	        			toDelete.push({id: row.id, tname: 'osoby'}); 
	    			} else if (state == 'Výpožičky') {
	    				$('#s3-vypozicky-table').bootstrapTable('remove', {
		            		field: 'id',
		            		values: [row.id]
	        			});
	        			toDelete.push({id: row.id, tname: 'vypozicky'}); 
	    			}
	    		} else if (currentPage == "#page2") {
	    			isS2Deleted = true;
	    			$s2_row.remove();
	    			var vid = $s2_row.find('td:nth-child(1)').html();
	    			var tid = $s2_row.find('td:nth-child(4)').html();
	    			l(tid);
	    			l(vid);
	    			// TODO: nepouzivat DELETE, ale zmenit "stav"
	    			execSQLSync('DELETE FROM tovar_vypozicky WHERE ' + 
	    				'id_tovar==' + tid + ' AND id_vypozicka==' + vid);
	    			// execSQLSync('UPDATE ... SET stav = 0');
	    			// TODO: ak je to posledna polozka, zmaz aj celu vypozicku
	    			var data = $('#s2-table').find('tr td:first-child()');
			    	var arr = [];
			    	for (i = 0; i < data.length; i++) {
			    		arr.push(data[i].innerHTML);
			    	}
			    	var tmp = getDuplicates(arr);
			    	var x = vid;
			    	if (tmp.indexOf(x) == -1) {
			    		execSQLSync("DELETE FROM vypozicky WHERE id==" + vid);
			    	}
		    	}
    		}
		});
    },'click .returnServis': function (e, value, row, index) {
    	// l($(this).parents('td'));
    	$s2_row = $(this).parents('tr');
    	// l(row);
    	bootbox.confirm("Naozaj chcete potvrdiť vyservisovanie položky <br/>" + 
    		JSON.stringify(row).replace(new RegExp('"', 'g'),'').replace(new RegExp(',', 'g'),', ') + 
    		"?", function(result) {
    		if (result) {
	    		var sid = $s2_row.find('td:nth-child(1)').html();
	    		var praca = $s2_row.find('td:nth-child(9)').html();
	    		ll(sid);
	    		ll(praca);
	    		// save row
	    		execSQLSync('SELECT * FROM servis WHERE ' + 
    				'id==' + sid + ' AND vykonana_praca=="' + praca + '"').then(function(response) {
    					var row = [];
    					ll(response);
    					var obj = response.item(0);
    					for (i in obj) {
    						row.push(obj[i]);
    					}
    					ll(row);
    					// insert to backup database
    					skirental.webdb.insertRow('servis_archive', row).then(function() {
    						// delete record
    						execSQLSync('DELETE FROM servis WHERE ' + 
	    						'id==' + sid + ' AND vykonana_praca=="' + praca + '"').then(function() {
	    							skirental.webdb.getAll('servis', saveDataToJSON, 'data/servis/servis.json');
	    							skirental.webdb.getAll('servis_archive', saveDataToJSON, 'data/servis/servis_archive.json');
	    						});
    					});
    				});
	    		$s2_row.remove();
    		}
		});
    },
    'click .returned': function(e, value, row, index) {
    	$row = $(this).parents('tr');
    	var oid = $row.find('td:nth-child(1)').html();
    	var tid = $row.find('td:nth-child(4)').html();
    	bootbox.confirm("Naozaj chcete označiť položku <br/>" + 
    		JSON.stringify(row).replace(new RegExp('"', 'g'),'').replace(new RegExp(',', 'g'),', ') + 
    		" ako vrátenú?", function(result) {
    		if (result) {
		    	// $row = $(this).parents('tr');
		    	// var oid = $row.find('td:nth-child(1)').html();
		    	// var tid = $row.find('td:nth-child(4)').html();
		    	// ll(oid);
		    	// ll(tid);
		    	// nastavit tovar_vypozicky.stav na 0
		    	execSQLSync("UPDATE tovar_vypozicky SET stav=0 WHERE id_tovar==" + tid +
		    		" AND id_vypozicka==" + oid);
		    	// pridat do vypozicky.datum_vratene datum
		    	var date = moment().format('DD-MM-YYYY');
		    	execSQLSync("UPDATE tovar_vypozicky SET datum_vratene='" + date + "' WHERE id_tovar==" + tid +
		    		" AND id_vypozicka==" + oid);
		    	// ak su vsetky polozky vratene, oznac aj vypozicka.stav = 0
		    	// var data = $('#s2-table').bootstrapTable('getData');
		    	var data = $('#s2-table').find('tr td:first-child()');
		    	var arr = [];
		    	for (i = 0; i < data.length; i++) {
		    		arr.push(data[i].innerHTML);
		    	}
		    	var tmp = getDuplicates(arr);
		    	var x = oid;

		    	ll(tmp);
		    	ll(x);
		    	_temp1 = tmp;
		    	_temp2 = x;
		    	ll(tmp.indexOf(x) == -1);

		    	if (tmp.indexOf(x) == -1) {
		    		// cislo vypozicky sa nevyskytuje viackrat, oznac vypozicku za ukoncenu
		    		execSQLSync("UPDATE vypozicky SET stav=0 WHERE id==" + oid);
		    	}
		    	// Pozn.: Ak sa cislo vypozicky vyskytuje viackrat, je ako vratena oznacena len konkretna polozka,
		    	// vid vyssie.

		    	// odstran riadok z tabulky
		    	// $('#s2-table').bootstrapTable('remove', {
	      //           field: 'id',
	      //           values: [row.id]
	      //       });
 				$row.remove();
		    }
		});

    },
    // print servis confirmation
    'click .printServis': function(e, value, row, index) {
    	// get data
    	$row = $(this).parents('tr');
    	var priezvisko = $row.find('td:nth-child(3)').html();
    	var sid = $row.find('td:nth-child(1)').html();
    	var datum_prijatia = $row.find('td:nth-child(10)').html();
    	// open pdf with servis
    	var fileName = 'servis' + sid + '-' + priezvisko + '-' +
			moment(datum_prijatia, 'DD.MM.YYYY').format('DD-MM-YYYY');
		ll(fileName);
		win_run('.\\orders\\servis\\' + fileName + '.pdf');
		// TODO: zmenit na generovanie pdfka, nie len otvorenie suboru - ak bude potrebne
		// var data = [...];
		// genServisPDF(data);
    }, 
    'click .returnToServis': function(e, value, row, index) {
    	$s6_row = $(this).parents('tr');
    	bootbox.confirm("Naozaj chcete vrátiť naspäť do servisu položku <br/>" + 
    		JSON.stringify(row).replace(new RegExp('"', 'g'),'').replace(new RegExp(',', 'g'),', ') + 
    		"?", function(result) {
    		if (result) {
	    		var sid = $s6_row.find('td:nth-child(1)').html();
	    		var praca = $s6_row.find('td:nth-child(9)').html();
	    		ll(sid);
	    		ll(praca);
	    		// save row
	    		execSQLSync('SELECT * FROM servis_archive WHERE ' + 
    				'id==' + sid + ' AND vykonana_praca=="' + praca + '"').then(function(response) {
    					var row = [];
    					ll(response);
    					var obj = response.item(0);
    					for (i in obj) {
    						row.push(obj[i]);
    					}
    					ll(row);
    					// insert to backup database
    					skirental.webdb.insertRow('servis', row).then(function() {
    						// delete record
    						execSQLSync('DELETE FROM servis_archive WHERE ' + 
	    						'id==' + sid + ' AND vykonana_praca=="' + praca + '"').then(function() {
	    							skirental.webdb.getAll('servis', saveDataToJSON, 'data/servis/servis.json');
	    							skirental.webdb.getAll('servis_archive', saveDataToJSONSyncWrapper_servisReload, 'data/servis/servis_archive.json');
	    						});
    					});
    				});
	    		$s6_row.remove();
    		}
		});
    }
};

function operateFormatter(value, row, index) {
    return [
        '<a class="remove" href="javascript:void(0)" title="Odstrániť">',
        	'<i class="fa fa-remove fa-lg"></i>',
        '</a>'
    ].join('');
}

// confirm that items returned to stock
function confirmFormatter(value, row, index) {
    return [
        '<a class="returned" href="javascript:void(0)" title="Ukončiť">',
        	'<i class="fa fa-check fa-lg"></i>',
        '</a>'
    ].join('');
}

// confirm that items returned to stock
function confirmServisFormatter(value, row, index) {
    return [
        '<a class="returnServis" href="javascript:void(0)" title="Ukončiť">',
        	'<i class="fa fa-check fa-lg"></i>',
        '</a>'
    ].join('');
}

// confirm that items returned to stock
function printServisFormatter(value, row, index) {
    return [
        '<a class="printServis" href="javascript:void(0)" title="Tlačiť">',
        	'<i class="fa fa-print fa-lg"></i>',
        '</a>'
    ].join('');
}

// return item back to Servis (from finished servis), f.e. in case of user misclick
function returnToServisFormatter(value, row, index) {
    return [
        '<a class="returnToServis" href="javascript:void(0)" title="Vrátiť do servisu">',
        	'<i class="fa fa-undo fa-lg"></i>',
        '</a>'
    ].join('');
}

$('#saveChangesBtn').on('click', function() {
	wrapper_saveChanges();
});

function wrapper_saveChanges() {
	isSaved = true;
	window.shared.flagChanged = true;
	_saveChangesToDB();
}

$('#addNewBtn').on('click', function() {
	add_new_state = $('#page3 li.active a').text();
	if (add_new_state == 'Tovar') {
		$('#newItemModal #addTovarForm').css('display','block');
		$('#newItemModal #addOsobyForm').css('display','none');
		$('#newItemModal #addVypozickyForm').css('display','none');
	} else if (add_new_state == 'Zákazníci') {
		$('#newItemModal #addTovarForm').css('display','none');
		$('#newItemModal #addOsobyForm').css('display','block');
		$('#newItemModal #addVypozickyForm').css('display','none');
	} else if (add_new_state == 'Výpožičky') {
		$('#newItemModal #addTovarForm').css('display','none');
		$('#newItemModal #addOsobyForm').css('display','none');
		$('#newItemModal #addVypozickyForm').css('display','block');
	}
	$('#newItemModal').modal('show');
	// $('#s3-tovar-table').bootstrapTable('insertRow', {
	// 	index: 1,
	// 	row: {
	// 		id: '-',
	// 		znacka: 'x',
	// 		typ: 'x',
	// 		velkost: 'x',
	// 		typ_tovaru: 'x',
	// 		stav: 'x',
	// 	}
	// });
});

// $remove.click(function () {
//     var ids = getIdSelections();
//     $('#s3-tovar-table').bootstrapTable('remove', {
//         field: 'id',
//         values: ids
//     });
//     $remove.prop('disabled', true);
// });

/* -------------------------------------------------------------
	SCREEN 1 
------------------------------------------------------------- */

// table tovar onclick
$('#tovar_table').on('click', 'tr', function() {
    orderAddItem($(this));
    tableItemAct($(this));
});

// filter data
$s1_select.change(function() {
	filterDataTable('#tovar_table', $s1_select.val());
});

// on datepicker change, convert and filter dates
$('#datum-od').change(function() {
	if ($('#datum-do').val() == "") {
		// convert date to other format
		var d = _date($('#datum-od').val());
		var d2 = new Date(d);
		d2.setDate(d2.getDate() + 7);
		$('#datum-do').datepicker('update', d2);
	}
	filterDates($('#datum-od').val(), $('#datum-do').val());
});

$('#datum-do').change( function() {
	filterDates($('#datum-od').val(), $('#datum-do').val());
})

// place order / rent
$('#rent-btn').on('click', function() {
	$('#confirmOrder').modal();
});

/* -------------------------------------------------------------
	SCREEN 2 - prebiehajuce vypozicky
------------------------------------------------------------- */

// var isEdited = {};
var Edited = {};

// TODO: update, make it work
function initHighlightS2() {
	var trs = $('#s2-table').find('tr');
	for (i = 0; i < trs.length; i++) {
		var val = parseInt($(trs[i]).find('td:nth-last-child(3)').html());
		if (val < 2) {
			$(trs[i]).addClass('danger');
		} else if (val < 5) {
			$(trs[i]).addClass('warning');
		};
	}
}

function s2_print(item) {
	var row = $(item).closest('tr');
	var id = $(row).attr('row-index');

	ll(id);
	regeneratePdfByOrder(id);


	// var priezvisko = $(row).find('.priezvisko').html();
	// var datum_od = $(row).find('.datum_od').html();
	// var fileName = 'vypozicka' + id + '-' + priezvisko + '-' + 
	// 	datum_od.replace(/\./g, "-");
	// ll(fileName);

	// TODO: pridat do Nastaveni moznost regenerovat vsetky mena pdfiek
	// pre prebiehajuce vypozicky

	// TODO: isEdited asi nebude treba,
	// proste to spravim tak, ze pri editovani vygenerujem nove pdfko
	// a pripadne sa prepise to stare, cize to vzdy bude OK.

	// if (isEdited[id] == true) {
		// save to database
		// generate data
		// var data =  genData();
		// generate pdf and print
		// genPDF(data);
	// } else {
		// win_run('.\\orders\\' + fileName + '.pdf');
	// }
}

var s2_edit_flag = true;
function s2_edit(item) {
	var row = $(item).closest('tr');
	var id = $(row).attr('row-index');
	if (s2_edit_flag) {
		s2_edit_flag = false;
		// collapse out if not yet collapsed
		$('#s2-detail' + id).collapse('show');
		// make data editable
		$('#s2-detail' + id + ' .my-editable-1').editable('enable');
		$(row).find('.my-editable-2').editable('enable');
		$(row).find('.my-editable-2').css('font-weight', 'bold');
	} else {
		s2_edit_flag = true;
		// collapse out if not yet collapsed
		$('#s2-detail' + id).collapse('hide');
		// disable editable
		$('#s2-detail' + id + ' .my-editable-1').editable('disable');
		$(row).find('.my-editable-2').editable('disable');
		$(row).find('.my-editable-2').css('font-weight', 'normal');
	}
}

function s2_markComplete(item) {
	bootbox.confirm('Naozaj chcete označiť danú výpožičku ako vrátenú?', function(result) {
		if (result) {
			var row = $(item).closest('tr');
			var id = $(row).attr('row-index');
			// oznac vypozicku ako vratenu a uloz datum vratenia
			var date = moment().format('DD-MM-YYYY');
			execSQLSync("UPDATE tovar_vypozicky SET stav=0, datum_vratene='" + date + "' WHERE id_vypozicka==" + id).then(function() {
					execSQLSync("UPDATE vypozicky SET stav=0 WHERE id==" + id).then(function() {
						skirental.webdb.getAll('vypozicky', saveDataToJSON, 'data/vypozicky.json').then(function() {
							_reload();
						});
				});
			});
		}
	});
}

function s2_add(item) {
	var row = $(item).closest('tr');
	var id = $(row).attr('row-index');
	bootbox.prompt("Zadajte číslo tovaru, ktorý chcete pridať na objednávku č. "+id+":", function(result) {                
		if (result === null) {                                             
			// do nothing
		} else {
			// TODO: check if item is free on the dates
			// ...
			// save to database
			bootbox.alert("Položka bola úspešne pridaná!", function() {
				skirental.webdb.lastID('tovar_vypozicky').then(function(response) {
					var tid = response["MAX(id)"];
					// (id, id_tovar, id_vypozicka)
					var row = [tid + 1, result, id];
					// ll(row);
					skirental.webdb.insertRow('tovar_vypozicky', row).then(function() {
						_reload();
					});
				});
			});
		}
	});
}

function s2_markItemComplete(item) {
	var row = $(item).closest('tr');
	var id = $(row).attr('row-index'); // vypozicka ID
	var tid = $(item).closest('li').find('.id').html(); // tovar ID
	// pridat do vypozicky.datum_vratene datum
	var date = moment().format('DD-MM-YYYY'); // dnesny datum
	bootbox.confirm('Naozaj chcete označiť položku ako vrátenú?', function(result) {
		if (result) {
			execSQLSync("UPDATE tovar_vypozicky SET stav=0, datum_vratene='" + date + "' WHERE id_tovar==" + 
				tid + " AND id_vypozicka==" + id).then(function() {
					_reload();
				});
		}
	});
}

function s2_removeItem(item) {
	var row = $(item).closest('tr');
	var id = $(row).attr('row-index');
	var tid = $(item).closest('li').find('.id').html();
	bootbox.confirm('Naozaj chcete vymazať vybranú položku z výpožičky?', function(result) {
		if (result) {
			// zmaz polozku
			execSQLSync('DELETE FROM tovar_vypozicky WHERE ' + 
				'id_tovar==' + tid + ' AND id_vypozicka==' + id).then(function() {
					_reload();
				});
		}
	});
	// ll(item);
}

function s2_save(item) {

	// make changes to DB
	// ...

	// regenerate JSON files
	genJSONfiles();
}

/* -------------------------------------------------------------
	SCREEN 5 - predaj 
------------------------------------------------------------- */

function predajAddItem() {
	var row = {
		nazov_tovaru: $('#predaj-nazov').val(),
		typ_tovaru: $('#predaj-typ-tovaru').val(),
		nakup: $('#predaj-nakup').val(),
		predaj: $('#predaj-predaj').val(),
		sklad: document.getElementById('predaj-sklad').checked,
		zisk: 0
	};
	l(row);
	if (_predajNoEmpty(row)) {
		row.zisk = row.predaj - row.nakup;
		l(row);
		Predaj.push(row);
		saveJSONSync(Predaj, 'data/predaj.json').then(function() {
			$('#predaj-table').bootstrapTable('append', [row]);
			$('#predaj-nazov').val("");
			$('#predaj-nakup').val("");
			$('#predaj-predaj').val("");
			var num = parseInt($('#predaj-predaj-spolu').html());
			$('#predaj-predaj-spolu').html(num + parseInt(row.predaj));
			num = parseInt($('#predaj-nakup-spolu').html());
			$('#predaj-nakup-spolu').html(num + parseInt(row.nakup));
			num = parseInt($('#predaj-zisk-spolu').html());
			$('#predaj-zisk-spolu').html(num + parseInt(row.zisk));
		});
	} else {
		bootbox.alert('Nevyplnili ste všetky položky!');
	}
}

function _predajNoEmpty(row) {
	return (row.nazov_tovaru != "" && row.typ_tovaru != "" &&
		row.nakup != "" && row.predaj != "");
}

function predajNakupSpolu() {
	var sum = 0;
	for (i = 0; i < Predaj.length; i++) {
		sum += parseInt(Predaj[i].nakup);
	}
	return sum;
}

function predajPredajSpolu() {
	var sum = 0;
	for (i = 0; i < Predaj.length; i++) {
		sum += parseInt(Predaj[i].predaj);
	}
	return sum;
}

function predajZiskSpolu() {
	var sum = 0;
	for (i = 0; i < Predaj.length; i++) {
		sum += parseInt(Predaj[i].zisk);
	}
	return sum;
}

function ulozPredaj() {
	bootbox.confirm("Naozaj chcete uložiť súčasný stav tabuľky Predaj?", function(result) {
		if (result) {
			var data = $('#predaj-table').bootstrapTable('getData');
			// ll(data);
			writeFile('data/predaj.json', JSON.stringify(data), _reload);
		}
	});
}

/* -------------------------------------------------------------
	SCREEN 10 - upload
------------------------------------------------------------- */
$("#input-1").fileinput({
	'showUpload':false,
	'showRemove': true
});

// $('#input-1').on('fileselect', function() {
// 	csv_path = $("#input-1").val();
// });

$('#importBtn').on('click', function() {
	importCSV($("#input-1").val());
});


/* -------------------------------------------------------------
	SCREEN 11
------------------------------------------------------------- */
var debug_first = true;
var app_settings;
$('#debugBtn').change(function() {
	if (debug_first) {
		debug_first = false;
		$.get('../package.json', function(data){
			app_settings = JSON.parse(data);
			if ($('#debugBtn').prop('checked') == true) {
				app_settings.window.toolbar = true;
			} else {
				app_settings.window.toolbar = false;
			}
			// fs = require('fs');
			// fs.writeFile('helloworld.txt', 'Hello World!', function (err) {
			//   if (err) return console.log(err);
			//   console.log('Hello World > helloworld.txt');
			// });
			writeFile('package.json', JSON.stringify(app_settings), jQuery.noop);
		});
	} else {
		if ($('#debugBtn').prop('checked') == true) {
			app_settings.window.toolbar = true;
		} else {
			app_settings.window.toolbar = false;
		}
		writeFile('package.json', JSON.stringify(app_settings), jQuery.noop);
	}
});

function deleteUniverse() {
	bootbox.confirm("Naozaj chcete nenávratne zmazať všetky údaje?", function(result){
		if (result) {
			execSQLSync("DROP TABLE IF EXISTS tovar").then(function() {
				execSQLSync("DROP TABLE IF EXISTS osoby").then(function() {
					execSQLSync("DROP TABLE IF EXISTS vypozicky").then(function() {
						execSQLSync("DROP TABLE IF EXISTS tovar_vypozicky").then(function() {
							bootbox.alert('Všetky dáta úspešne zmazané.');
							writeFile('./data/tovar.json', '', syncReload);
							writeFile('./data/osoby.json', '', syncReload);
							writeFile('./data/vypozicky.json', '', syncReload);
							writeFile('./data/tovar_vypozicky.json', '', syncReload);
						});
					});
				});
			});
		}
	});
}

/* -------------------------------------------------------------
	SCREEN 12
------------------------------------------------------------- */
// @param item_id Id of item we are looking for in calendar
function renderItemReservedCalendar(item_id) {
	var arr = [];
	var moment = require('moment');
	require('moment-range');
	skirental.webdb.getAllItemOrdersDates(item_id).then(function(response) {
		// get all dates to be higlighted as reserved
		for (i = 0; i < response.length; i++) {
			var start = moment(response[i].datum_od, "DD-MM-YYYY");
			var end = moment.max(moment(response[i].datum_do, "DD-MM-YYYY"), moment());
			arr.push({
				startDate: start, 
				endDate: end,
				text: "Výpožička č. " + response[i].id
			});
			// var range = moment.range(start, end);
			// range.by('days', function(moment) {
			// 	arr.push({ date: moment.format("YYYY-MM-DD"), title: "Obsadené", type: "reserved" })
			// });
			ll(response);
		}
		// calendar.setEvents(arr);
		calendar.setDataSource(arr);
		// console.log(calendar.);
		$('.calendar').bind('mouseOnDay', function(e) {
            if(e.events.length > 0) {
                var content = '';
                
                for(var i in e.events) {
                    content += '<div class="event-tooltip-content">'
                                    + '<div class="event-name" style="color:' 
									+ e.events[i].color + 
									'">' + e.events[i].text + 
									'</div>' +
                            	'</div>';
                }
            
                $(e.element).popover({
                    trigger: 'manual',
                    container: 'body',
                    html:true,
                    content: content
                });
                
                $(e.element).popover('show');
            }
        });
	});
}

/* -------------------------------------------------------------
	FUNCTIONS
------------------------------------------------------------- */

var mutex = true;
function syncReload() {
	if (mutex) {
		mutex = false;
		_reload();
	}
}

function selectAddOptionJSON(file, selectId) {
	$.get(file, function(data){
		// ll(data);
		for (i = 0; i < data.length; i++) {
			// ll($("#" + selectId));
			$("#" + selectId).append(
				'<option>' + data[i].nazov + '</option>'
	        );
		}
		if (selectId == "servis-select-3") {
			$($("#servis-select-3 option")[2]).attr("selected", "selected");
		}
	},'json');
	// $("#" + selectId).selectpicker('refresh');
}

function orderConfirmedAction() {
	// save customer and order
	db_saveData().then(function(response) {
		// render html from template
		var n = response;
		$.get("./print/template-header.html", function(temp_header) {
			$.get("./print/template-footer.html", function(temp_footer) {
				$.get("./print/template-core.html", function(temp_core) {
					var $html = $(temp_core);
					xx = temp_header;
					$html.find('#meno').html(Data.customer[1] + ' ' + Data.customer[2]);
					$html.find('#doklad').html(Data.customer[4]);
					$html.find('#tel_cislo').html(Data.customer[3]);
					$html.find('#datum_od').html(Data.order[1]);
					$html.find('#datum_do').html(Data.order[2]);
					$html.find('#cena_spolu').html(Data.order[3]);
					$html.find('#id').html(Data.order[0]);
					$html.find('#adresa').html(Data.customer[5] + '<br>' + Data.customer[6] + ' ' + Data.customer[7]);
					var res = "";
					for (i = 0; i < Order.nodes.length; i++) {
						var node = Order.nodes[i];
						var id = $(node).find('.id').text();
						var vel = $(node).find('.velkost').text();
						var tt = $(node).find('.typ_tovaru').text();
						var typ = $(node).find('.typ').text();
						var zn = $(node).find('.znacka').text();
						res += '<tr>'+
									'<td class="id">'+id+'</td>'+
									'<td class="kategoria">'+zn+' '+typ+'</td>'+
									'<td class="typ">'+tt+'</td>'+
									'<td class="velkost">'+vel+'</td>'+
								'</tr>';
					}
					$html.find('#tovar-tabulka tbody').html(res);
					writeFile('./app/print/temp.html', 
						temp_header + 
						$html[0].innerHTML + 
						temp_footer,
						function() {
							// render pdf from html
							var fileName = 'vypozicka' + n + '-'+Data.customer[2]+'-'+
								moment(Data.order[1], 'DD.MM.YYYY').format('DD-MM-YYYY');
							htmlToPDF('./app/print/temp.html', 
								'./orders/' + fileName + '.pdf').then(function(response) {
									win_run('.\\orders\\' + fileName + '.pdf');
									genJSONfiles();
								});
					}, 'html');
				});
			});
		});
	});
}

function genPDF(data, shouldOpen) {
	// render html from template
	$.get("./print/template-header.html", function(temp_header) {
		$.get("./print/template-footer.html", function(temp_footer) {
			$.get("./print/template-core.html", function(temp_core) {
				var $html = $(temp_core);
				$html.find('#meno').html(data.order.meno + ' ' + data.order.priezvisko);
				$html.find('#doklad').html(data.order.doklad);
				$html.find('#tel_cislo').html(data.order.tel_cislo);
				$html.find('#datum_od').html(data.order.datum_od);
				$html.find('#datum_do').html(data.order.datum_do);
				$html.find('#cena_spolu').html(data.order.cena);
				$html.find('#id').html(data.order.id);
				$html.find('#adresa').html(data.order.adresa);
				var res = "";
				for (i = 0; i < data.items.length; i++) {
					var it = data.items[i];
					res += '<tr>'+
								'<td class="id">'+it.tovarId+'</td>'+
								'<td class="kategoria">'+it.znacka+' '+it.typ+'</td>'+
								'<td class="typ">'+it.typ_tovar+'</td>'+
								'<td class="velkost">'+it.velkost+'</td>'+
							'</tr>';
				}
				$html.find('#tovar-tabulka tbody').html(res);
				var tempFileName = 'temp' + moment().format('x');
				writeFile('./app/print/' + tempFileName + '.html', 
					temp_header + 
					$html[0].innerHTML + 
					temp_footer,
					function() {
						// render pdf from html
						var fileName = 'vypozicka' + data.order.id + '-'+data.order.priezvisko+'-'+
							moment(data.order.datum_od, 'DD.MM.YYYY').format('DD-MM-YYYY');
						ll(fileName);
						htmlToPDF('./app/print/' + tempFileName + '.html', 
							'./orders/' + fileName + '.pdf').then(function(response) {
								if (shouldOpen)
									win_run('.\\orders\\' + fileName + '.pdf');
							});
				}, 'html');
			});
		});
	});
}

function genServisPDF(data) {
	ll(data);
	var shouldOpen = true; // ma sa otvorit pdfko alebo nema?
	$.get("./print/servis/template-header.html", function(temp_header) {
		$.get("./print/servis/template-footer.html", function(temp_footer) {
			$.get("./print/servis/template-core.html", function(temp_core) {
				var $html = $(temp_core);
				$html.find('#meno').html(data.meno + ' ' + data.priezvisko);
				// $html.find('#doklad').html(data.doklad);
				$html.find('#tel_cislo').html(data.tel_cislo);
				$html.find('#datum_prijatia').html(data.datum_prijatia);
				$html.find('#datum_odovzdania').html(data.datum_odovzdania);
				$html.find('#cena_spolu').html(data.cena);
				$html.find('#id').html(data.id);
				$html.find('#poznamka').html(data.poznamka);
				// $html.find('#adresa').html(data.adresa);
				$html.find('#datum_prevzatia_footer').html(data.datum_odovzdania);
				var res = "";
				for (i = 0; i < data.items.length; i++) {
					var it = data.items[i];
					res += '<tr>'+
								//'<td class="id">'+it.tovarId+'</td>'+
								'<td class="kategoria">'+it.znacka+' '+it.typ+'</td>'+
								'<td class="spodna-hrana">'+it.spodna_hrana+'</td>'+
								'<td class="bocna-hrana">'+it.bocna_hrana+'</td>'+
								'<td class="praca">'+it.vykonana_praca+'</td>'+
							'</tr>';
				}
				$html.find('#tovar-tabulka tbody').html(res);
				var tempFileName = 'temp' + moment().format('x');
				writeFile('./app/print/cache/' + tempFileName + '.html', 
					temp_header + 
					$html[0].innerHTML + 
					temp_footer,
					function() {
						// render pdf from html
						var fileName = 'servis' + data.id + '-'+data.priezvisko+'-'+
							moment(data.datum_prijatia, 'DD.MM.YYYY').format('DD-MM-YYYY');
						ll(fileName);
						htmlToPDF('./app/print/cache/' + tempFileName + '.html', 
							'./orders/servis/' + fileName + '.pdf').then(function(response) {
								if (shouldOpen)
									win_run('.\\orders\\servis\\' + fileName + '.pdf');
								_reload();
							});
				}, 'html');
			});
		});
	});
}

function genRowOrder(node) {
	l(node);
	var id = $(node).find('.id').text();
	var vel = $(node).find('.velkost').text();
	var tt = $(node).find('.typ_tovaru').text();
	var typ = $(node).find('.typ').text();
	var zn = $(node).find('.znacka').text();
	l(id);
	l(zn);
	// l('<tr>'+
	// 		'<td class="id">'+id+'</td>'+
	// 		'<td class="kategoria">'+zn+' '+typ+'</td>'+
	// 		'<td class="typ">'+tt+'</td>'+
	// 		'<td class="velkost">'+vel+'</td>'+
	// 	'</tr>');
	return '<tr>'+
			'<td class="id">'+id+'</td>'+
			'<td class="kategoria">'+zn+' '+typ+'</td>'+
			'<td class="typ">'+tt+'</td>'+
			'<td class="velkost">'+vel+'</td>'+
		'</tr>';
}

function genTableOrderDetails(data) {
	l(data);
	var ret = ""
	for (i = 0; i < data.length; i++) {
		var item = data.item(i);
		ret += genTableOrderDetailsRow(item);
	}
	$("#vypozicky_table").html(ret);
}

function genTableOrderDetailsRow(item) {
	var ddate = new Date(_date(item.datum_do));
	var today = new Date();
	var days = Math.round((ddate - today) / (1000*60*60*24));
	var cn = "";
	if (days < 0) {
		cn = "danger"
	} else if (days < 3) {
		cn = "warning"
	}
	var ret = '<tr class="'+cn+'">'+
				'<td>' + item.id + '</td>'+
				'<td>' + item.znacka + '</td>'+
				'<td>' + item.typ + '</td>'+
				'<td>' + item.tovarId + '</td>'+
				'<td>' + item.velkost + '</td>'+
				'<td>' + item.typ_tovaru + '</td>'+
				'<td>' + item.meno + '</td>'+
				'<td>' + item.priezvisko + '</td>'+
				'<td>' + item.ulica + ', ' + item.psc + ' ' + item.mesto + '</td>'+
				'<td>' + item.tel_cislo + '</td>'+
				'<td>' + days + '</td>'+
				'</tr>';
	return ret;
}


function saveChangesToDB() {
	_saveChangesToDB()
	$('#modal-confirm-changes').modal('hide');
	l('all changed');
	_goBack();
}
var xx;
function _saveChangesToDB() {
	// execute all changes, meaning:
	// toUpdate - 1. v poradi !!!
	lock = false;
	// TODO: ak je viac editov ronakeho zaznamu, staci
	// z pola vytiahnut ten posledny a ten vlozit, usetria sa transakcie
	for (i in toUpdate) {
		l('to update:');
		l(toUpdate[i]);
		// set data row
		var row;
		if (toUpdate[i].tname == 'tovar') {
			row = [
				toUpdate[i].data.znacka,
				toUpdate[i].data.typ,
				toUpdate[i].data.velkost,
				toUpdate[i].data.typ_tovaru,
				toUpdate[i].data.stav,
				toUpdate[i].data.id
			];
		} else if (toUpdate[i].tname == 'osoby') {
			row = [
				toUpdate[i].data.meno,
				toUpdate[i].data.priezvisko,
				toUpdate[i].data.tel_cislo,
				toUpdate[i].data.doklad,
				toUpdate[i].data.ulica,
				toUpdate[i].data.psc,
				toUpdate[i].data.mesto,
				toUpdate[i].data.id
			];
		} else if (toUpdate[i].tname == 'vypozicky') {
			row = [
				toUpdate[i].data.datum_od,
				toUpdate[i].data.datum_do,
				toUpdate[i].data.cena,
				toUpdate[i].data.id_osoba,
				toUpdate[i].data.id
			];
		} else if (toUpdate[i].tname == 'tovar_vypozicky') {
			row = [
				toUpdate[i].data.id_tovar,
				toUpdate[i].data.id_vypozicka,
				toUpdate[i].data.id
			];
		} else {
			l('Error: Unknown table name!');
		}
		skirental.webdb.updateRow(toUpdate[i].tname, row).then(function() {
			skirental.webdb.getAll(toUpdate[i].tname, 
				saveDataToJSON, 'data/'+toUpdate[i].tname+'.json').then(
				function() {
					if (!lock) {
						lock = true;
						_reload();
					}
				});
		});
	}
	// toDelete - 2. v poradi !!!
	for (i in toDelete) {
		l('to delete:');
		l(toDelete[i]);
		skirental.webdb.deleteRow(toDelete[i].tname, toDelete[i].id).then(
			function() {
				if (toDelete[i].tname == "vypozicky") {
					removeDeadTovarVypozicky();
					// skirental.webdb.deleteRow("tovar_vypozicky", toDelete[i].id).then(
					// 	function() {
							// removeDeadTovarVypozicky();
					setTimeout(function() {
						skirental.webdb.getAll("vypozicky", 
						saveDataToJSON, 'data/vypozicky.json').then(
						function() {
							if (!lock) {
								lock = true;
								_reload();
							}
						});
					}, 200);
							// TODO: save JSON tovar_vypozicky
				} else {
					skirental.webdb.getAll(toDelete[i].tname, 
					saveDataToJSON, 'data/'+toDelete[i].tname+'.json').then(
					function() {
						if (!lock) {
							lock = true;
							_reload();
						}
					});
				}
		});
	}
	// 	skirental.webdb.deleteRow('tovar', row.id);
	// toInsert - 3. v poradi !!!
	for (i in toInsert) {
		l('to insert:');
		l(toInsert[i]);
		skirental.webdb.insertRow(toInsert[i].tname, toInsert[i].data).then(
			function() {
			skirental.webdb.getAll(toInsert[i].tname, 
				saveDataToJSON, 'data/'+toInsert[i].tname+'.json').then(
				function() {
					if (!lock) {
						lock = true;
						_reload();
					}
				});;
		});;
	}
	// status('success', 'Zmeny vykonané.');
}

function dismissChangesToDB() {
	// dismiss all changes, meaning:
	// remove stuff from arrays
	toInsert = [];
	toDelete = [];
	toUpdate = [];
	$('#modal-confirm-changes').modal('hide');
	// l('nothing changed');
	// _goBack();
	_reload();
}

function addNewItem() {
	// ... add new item
	var t = "";
	if (add_new_state == 'Tovar') {
		t = 'tovar';
		var row = [
			$('#new-id').val(),
			$('#znacka').val(),
			$('#model_tovaru').val(),
			$('#velkost_tovaru').val(),
			$('#druh_tovaru').val(),
			'voľné'
		];
	} else if (add_new_state == 'Zákazníci') {
		l(isNaN($('#id-osoba').val()));
		if (isNaN($('#id-osoba').val())) {
			$('#id-osoba').closest('.form-group').addClass('has-error');
			return;
		} else {
			$('#id-osoba').closest('.form-group').removeClass('has-success');
		}
		t = 'osoby';
		var row = [
			$('#id-osoba').val(),
			$('#meno').val(),
			$('#priezvisko').val(),
			$('#tel_cislo').val(),
			$('#doklad').val(),
			$('#ulica').val(),
			$('#psc').val(),
			$('#mesto').val()
		];
	} else if (add_new_state == 'Výpožičky') {
		t = 'vypozicky';
		var row = [
			$('#mod_dod').val(),
			$('#mod_ddo').val(),
			$('#cena_mod').val(),
			$('#mod_ido').val()
		];
	}
	if (!hasEmptyVal(row)) {
		toInsert.push({data: row, tname: t});
		$('#newItemModal').modal('hide');
		var inputs = $('#newItemModal input');
		l(inputs);
		for (i = 0; i < inputs.length; i++)
			$(inputs[i]).val("");
	} else {
		// ...
	}
}

function hasEmptyVal(arr) {
	for (i = 0; i < arr.length; i++) {
		if (arr[i] == "")
			return true;
	}
	return false;
}

function clearInputs() {
	$('#page1 input').val('');
}

function sumPrices_S1() {
	var x = $('.price-partial');
	var sum = 0;
	for (i = 0; i < x.length; i++) {
		var a = parseInt($(x[i]).val());
		if (isNaN(a)) 
			a = 0;
		sum += a;
	}
	return sum;
}

function filterDataTable(id, value) {
	// l('Hello, dear!');
	// l(value);
	resetTableCss($(id).find('tr'));
	var table = $(id);
	var rows = $(id).find('tr');
	x = rows;
	for (i = 0; i < rows.length; i++) {
		// l(rows[i].find('typ_tovaru').text());
		// l(rows[i].find('.typ_tovaru'));
		if (value.toLowerCase() == 'všetko') {
			resetTableCss($(id).find('tr'));
		}
		else if ($(rows[i]).find('.typ_tovaru').text().toLowerCase() != value.toLowerCase()) {
			hideElem(rows[i]);
		}
	}
}

function hideElem(sel) {
	$(sel).css('display', 'none');
}

function resetTableCss(sel) {
	$(sel).css('display', 'table-row');
}

function tableItemAct(item) {
	$(item).prop("disabled", true);
    $(item).addClass('success');
    $(item).children()[5].innerHTML = "-";
}

function tableItemDeact(item) {
	$(item).prop("disabled", false);
    $(item).removeClass('success');
    $(item).children()[5].innerHTML = "voľné";
}

function db_is_change() {
	l(toInsert.length);
	l(toDelete.length);
	l(toUpdate.length);
	var cond =  ((toInsert.length != 0) || 
		(toDelete.length != 0) || 
		(toUpdate.length != 0));
	l('Result:  ' + cond);
	// window.shared.flagChanged = true;
	return cond;
}


// kontextove menu - SCREEN #2

// ODKOMENTUJ KED BUDE HOTOVA FUNKCIONALITA

/*
$(function() {
  
  var $contextMenu = $("#context-menu-1");
  
  $("#vypozicky_table").on("click", "tr", function(e) {
  	l(e.pageX + " " + e.pageY);
    $contextMenu.css({
      display: "block",
      left: e.pageX,
      top: e.pageY
    });
    ptr = $(this);
    if ((ptr.attr('class') != 'danger') && (ptr.attr('class') != 'warning')) 
	    ptr.css({
	    	background: "#337ab7",
	    	color: "#fff"
	    });
    if (reset_ptr) 
    	reset_ptr.css({
			background: "",
			color: ""
		});
    reset_ptr = $(this);
    return false;
  });
  
  $(document).on("click", "*:not(#context-menu-1)", function() {
	$contextMenu.hide();
 	if (reset_ptr)
 		reset_ptr.css({
			background: "",
			color: ""
		});
  });
  
});
*/

// -----------------------------------------------
// TABLES INIT
// -----------------------------------------------

$('#s12-tovar-table').bootstrapTable({
	// height: 533,
    columns: [{
        field: 'id',
        title: 'Č.',
        sortable: true
    }, {
        field: 'znacka',
        title: 'Zn.',
        sortable: true
    }, {
        field: 'typ',
        title: 'Typ',
        sortable: true
    }, {
        field: 'velkost',
        title: 'Veľ.',
        sortable: true
    }, {
        field: 'typ_tovaru',
        title: 'Typ',
        sortable: true
    }]
});
// attach clicking on row event to rendering calendar
$('#s12-tovar-table').on('click-row.bs.table', function(row, $element) {
	renderItemReservedCalendar($element.id);
});
var prev = null;
$('#s12-tovar-table').on('post-body.bs.table', function() {
	$('#s12-tovar-table > tbody > tr').click(function() {
		$(prev).removeClass('picked');
		$(this).addClass('picked');
		prev = this;
	});
});

$('#predaj-table').bootstrapTable({
    columns: [{
        field: 'nazov_tovaru',
        title: 'Názov tovaru',
        sortable: true,
    }, {
        field: 'typ_tovaru',
        title: 'Typ tovaru',
        sortable: true,
        editable: {}
    }, {
        field: 'nakup',
        title: 'Nákup',
        sortable: true,
        editable: {
			type: 'text',
			title: 'Nákup',
			validate: function (value) {
				val = $.trim(value);
				if (!val) {
					return 'Povinné pole';
				} else {
					var i = $(this).closest('tr').attr('data-index');
					var predaj = parseInt($(this).closest('tr').find('td:nth-child(4) a').attr('data-value'));
					$('#predaj-table').bootstrapTable('updateCell', { 
						index: i, 
						field: 'zisk', 
						value: predaj - val
					});
					$('#predaj-table').bootstrapTable('updateCell', { 
						index: i, 
						field: 'nakup', 
						value: val
					});
				}
			}
		}
    }, {
        field: 'predaj',
        title: 'Predaj',
        sortable: true,
        editable: {
			type: 'text',
			title: 'Predaj',
			validate: function (value) {
				val = $.trim(value);
				if (!val) {
					return 'Povinné pole';
				} else {
					var i = $(this).closest('tr').attr('data-index');
					var nakup = parseInt($(this).closest('tr').find('td:nth-child(3) a').attr('data-value'));
					$('#predaj-table').bootstrapTable('updateCell', { 
						index: i, 
						field: 'zisk', 
						value: val - nakup
					});
					$('#predaj-table').bootstrapTable('updateCell', { 
						index: i, 
						field: 'predaj', 
						value: val
					});
				}
			}
		}
    }, {
        field: 'zisk',
        title: 'Zisk',
        sortable: true
    }, {
    	field: 'sklad',
        title: 'Na sklade',
        checkbox: true
    }]
});

$('#s2-table').bootstrapTable({
    columns: [{
        field: 'id',
        title: '#',
        sortable: true
    },{
        field: 'znacka',
        title: 'Značka',
        sortable: true
    },{
        field: 'typ',
        title: 'Typ',
        sortable: true
    },{
        field: 'tovarId',
        title: '# tovaru',
        sortable: true
    },{
        field: 'velkost',
        title: 'Veľkosť',
        sortable: true
    },{
        field: 'typ_tovar',
        title: 'Kategória',
        sortable: true
    },{
        field: 'meno',
        title: 'Meno',
        sortable: true
    },{
        field: 'priezvisko',
        title: 'Priezvisko',
        sortable: true
    },{
        field: 'adresa',
        title: 'Adresa',
        sortable: true
    },{
        field: 'tel_cislo',
        title: 'Tel. číslo',
        sortable: true
    },{
        field: 'dni',
        title: 'Dní do vrátenia',
        sortable: true
    }, {
		field: 'confirm',
		title: '',
		align: 'center',
		events: operateEvents,
		formatter: confirmFormatter
	}, {
		field: 'operate',
		title: '',
		align: 'center',
		events: operateEvents,
		formatter: operateFormatter
	}]
});

// #PAGE3 Tovar
$('#s3-tovar-table').bootstrapTable({
    columns: [{
        field: 'id',
        title: '#',
        sortable: true
    }, {
        field: 'znacka',
        title: 'Značka',
        sortable: true,
        editable: {
			type: 'text',
			title: 'Značka',
			validate: function (value) {
				value = $.trim(value);
				if (!value) {
					return 'Povinné pole';
				}
				// if (!/^$/.test(value)) {
				// 	return 'This field needs to start width $.'
				// }
				var data = $('#s3-tovar-table').bootstrapTable('getData'),
				index = $(this).parents('tr').data('index');
				console.log(data[index]);
				var tmp = data[index];
				if (value != data[index].znacka) {
					tmp.znacka = value;
					toUpdate.push({data: tmp, tname: 'tovar'});
				}
				return '';
			}
		}
    }, {
        field: 'typ',
        title: 'Typ',
        sortable: true,
        editable: {
			type: 'text',
			title: 'Typ',
			validate: function (value) {
				value = $.trim(value);
				if (!value) {
					return 'Povinné pole';
				}
				// if (!/^$/.test(value)) {
				// 	return 'This field needs to start width $.'
				// }
				var data = $('#s3-tovar-table').bootstrapTable('getData'),
				index = $(this).parents('tr').data('index');
				console.log(data[index]);
				var tmp = data[index];
				if (value != data[index].typ) {
					tmp.typ = value;
					toUpdate.push({data: tmp, tname: 'tovar'});
				}
				return '';
			}
		}
    }, {
        field: 'velkost',
        title: 'Veľkosť',
        sortable: true,
        editable: {
			type: 'text',
			title: 'Veľkosť',
			validate: function (value) {
				value = $.trim(value);
				if (!value) {
					return 'Povinné pole';
				}
				// if (!/^$/.test(value)) {
				// 	return 'This field needs to start width $.'
				// }
				var data = $('#s3-tovar-table').bootstrapTable('getData'),
				index = $(this).parents('tr').data('index');
				console.log(data[index]);
				// l(value + ' / ' + data[index].velkost);
				var tmp = data[index];
				if (value != data[index].velkost) {
					tmp.velkost = value;
					toUpdate.push({data: tmp, tname: 'tovar'});
				}
				// l(tmp);
				return '';
			}
		}
    }, {
        field: 'typ_tovaru',
        title: 'Typ tovaru',
        sortable: true,
        editable: {
			type: 'text',
			title: 'Typ tovaru',
			validate: function (value) {
				value = $.trim(value);
				if (!value) {
					return 'Povinné pole';
				}
				// if (!/^$/.test(value)) {
				// 	return 'This field needs to start width $.'
				// }
				var data = $('#s3-tovar-table').bootstrapTable('getData'),
				index = $(this).parents('tr').data('index');
				console.log(data[index]);
				var tmp = data[index];
				if (value != data[index].typ_tovaru) {
					tmp.typ_tovaru = value;
					toUpdate.push({data: tmp, tname: 'tovar'});
				}
				return '';
			}
		}
  //   }, {
  //       field: 'stav',
  //       title: 'Stav',
  //       sortable: true,
  //       editable: {
		// 	type: 'text',
		// 	title: 'Stav',
		// 	validate: function (value) {
		// 		value = $.trim(value);
		// 		if (!value) {
		// 			return 'Povinné pole';
		// 		}
		// 		// if (!/^$/.test(value)) {
		// 		// 	return 'This field needs to start width $.'
		// 		// }
		// 		var data = $('#s3-tovar-table').bootstrapTable('getData'),
		// 		index = $(this).parents('tr').data('index');
		// 		console.log(data[index]);
		// 		var tmp = data[index];
		// 		if (value != data[index].stav) {
		// 			tmp.stav = value;
		// 			toUpdate.push({data: tmp, tname: 'tovar'});
		// 		}
		// 		return '';
		// 	}
		// }
    }, {
		field: 'operate',
		title: '',
		align: 'center',
		events: operateEvents,
		formatter: operateFormatter
	}]
});

// #PAGE3 Zakaznici
$('#s3-zakaznici-table').bootstrapTable({
    columns: [{
        field: 'id',
        title: '#',
        sortable: true
    }, {
        field: 'meno',
        title: 'Meno',
        sortable: true,
        editable: {
			type: 'text',
			title: 'Meno',
			validate: function (value) {
				value = $.trim(value);
				if (!value) {
					return 'Povinné pole';
				}
				// if (!/^$/.test(value)) {
				// 	return 'This field needs to start width $.'
				// }
				var data = $('#s3-zakaznici-table').bootstrapTable('getData'),
				index = $(this).parents('tr').data('index');
				console.log(data[index]);
				var tmp = data[index];
				if (value != data[index].meno) {
					tmp.meno = value;
					toUpdate.push({data: tmp, tname: 'osoby'});
				}
				return '';
			}
		}
    }, {
        field: 'priezvisko',
        title: 'Priezvisko',
        sortable: true,
        editable: {
			type: 'text',
			title: 'Priezvisko',
			validate: function (value) {
				value = $.trim(value);
				if (!value) {
					return 'Povinné pole';
				}
				// if (!/^$/.test(value)) {
				// 	return 'This field needs to start width $.'
				// }
				var data = $('#s3-zakaznici-table').bootstrapTable('getData'),
				index = $(this).parents('tr').data('index');
				console.log(data[index]);
				var tmp = data[index];
				if (value != data[index].priezvisko) {
					tmp.priezvisko = value;
					toUpdate.push({data: tmp, tname: 'osoby'});
				}
				return '';
			}
		}
    }, {
        field: 'tel_cislo',
        title: 'Telefónne číslo',
        sortable: true,
        editable: {
			type: 'text',
			title: 'Telefónne číslo',
			validate: function (value) {
				value = $.trim(value);
				if (!value) {
					return 'Povinné pole';
				}
				// if (!/^$/.test(value)) {
				// 	return 'This field needs to start width $.'
				// }
				var data = $('#s3-zakaznici-table').bootstrapTable('getData'),
				index = $(this).parents('tr').data('index');
				console.log(data[index]);
				var tmp = data[index];
				if (value != data[index].tel_cislo) {
					tmp.tel_cislo = value;
					toUpdate.push({data: tmp, tname: 'osoby'});
				}
				return '';
			}
		}
    }, {
        field: 'doklad',
        title: 'Doklad',
        sortable: true,
        editable: {
			type: 'text',
			title: 'Doklad',
			validate: function (value) {
				value = $.trim(value);
				if (!value) {
					return 'Povinné pole';
				}
				// if (!/^$/.test(value)) {
				// 	return 'This field needs to start width $.'
				// }
				var data = $('#s3-zakaznici-table').bootstrapTable('getData'),
				index = $(this).parents('tr').data('index');
				console.log(data[index]);
				var tmp = data[index];
				if (value != data[index].doklad) {
					tmp.doklad = value;
					toUpdate.push({data: tmp, tname: 'osoby'});
				}
				return '';
			}
		}
    }, {
        field: 'ulica',
        title: 'Ulica',
        sortable: true,
        editable: {
			type: 'text',
			title: 'Ulica',
			validate: function (value) {
				value = $.trim(value);
				if (!value) {
					return 'Povinné pole';
				}
				// if (!/^$/.test(value)) {
				// 	return 'This field needs to start width $.'
				// }
				var data = $('#s3-zakaznici-table').bootstrapTable('getData'),
				index = $(this).parents('tr').data('index');
				console.log(data[index]);
				var tmp = data[index];
				if (value != data[index].ulica) {
					tmp.ulica = value;
					toUpdate.push({data: tmp, tname: 'osoby'});
				}
				return '';
			}
		}
    }, {
        field: 'psc',
        title: 'PSČ',
        sortable: true,
        editable: {
			type: 'text',
			title: 'PSČ',
			validate: function (value) {
				value = $.trim(value);
				if (!value) {
					return 'Povinné pole';
				}
				// if (!/^$/.test(value)) {
				// 	return 'This field needs to start width $.'
				// }
				var data = $('#s3-zakaznici-table').bootstrapTable('getData'),
				index = $(this).parents('tr').data('index');
				console.log(data[index]);
				var tmp = data[index];
				if (value != data[index].psc) {
					tmp.psc = value;
					toUpdate.push({data: tmp, tname: 'osoby'});
				}
				return '';
			}
		}
    }, {
        field: 'mesto',
        title: 'Mesto',
        sortable: true,
        editable: {
			type: 'text',
			title: 'Mesto',
			validate: function (value) {
				value = $.trim(value);
				if (!value) {
					return 'Povinné pole';
				}
				// if (!/^$/.test(value)) {
				// 	return 'This field needs to start width $.'
				// }
				var data = $('#s3-zakaznici-table').bootstrapTable('getData'),
				index = $(this).parents('tr').data('index');
				console.log(data[index]);
				var tmp = data[index];
				if (value != data[index].mesto) {
					tmp.mesto = value;
					toUpdate.push({data: tmp, tname: 'osoby'});
				}
				return '';
			}
		}
    }, {
		field: 'operate',
		title: '',
		align: 'center',
		events: operateEvents,
		formatter: operateFormatter
	}]
});

// #PAGE3 Vypozicky
$('#s3-vypozicky-table').bootstrapTable({
    columns: [{
        field: 'id',
        title: '#',
        sortable: true
    }, {
        field: 'datum_od',
        title: 'Dátum od',
        sortable: true,
        editable: {
			type: 'text',
			title: 'Dátum od',
			validate: function (value) {
				value = $.trim(value);
				if (!value) {
					return 'Povinné pole';
				}
				// if (!/^$/.test(value)) {
				// 	return 'This field needs to start width $.'
				// }
				var data = $('#s3-vypozicky-table').bootstrapTable('getData'),
				index = $(this).parents('tr').data('index');
				console.log(data[index]);
				var tmp = data[index];
				if (value != data[index].datum_od) {
					tmp.datum_od = value;
					toUpdate.push({data: tmp, tname: 'vypozicky'});
				}
				return '';
			}
		}
    }, {
        field: 'datum_do',
        title: 'Dátum do',
        sortable: true,
        editable: {
			type: 'text',
			title: 'Dátum do',
			validate: function (value) {
				value = $.trim(value);
				if (!value) {
					return 'Povinné pole';
				}
				// if (!/^$/.test(value)) {
				// 	return 'This field needs to start width $.'
				// }
				var data = $('#s3-vypozicky-table').bootstrapTable('getData'),
				index = $(this).parents('tr').data('index');
				console.log(data[index]);
				var tmp = data[index];
				if (value != data[index].datum_do) {
					tmp.datum_do = value;
					toUpdate.push({data: tmp, tname: 'vypozicky'});
				}
				return '';
			}
		}
    }, {
        field: 'cena',
        title: 'Cena',
        sortable: true,
        editable: {
			type: 'text',
			title: 'Cena',
			validate: function (value) {
				value = $.trim(value);
				if (!value) {
					return 'Povinné pole';
				}
				// if (!/^$/.test(value)) {
				// 	return 'This field needs to start width $.'
				// }
				var data = $('#s3-vypozicky-table').bootstrapTable('getData'),
				index = $(this).parents('tr').data('index');
				console.log(data[index]);
				var tmp = data[index];
				if (value != data[index].cena) {
					tmp.cena = value;
					toUpdate.push({data: tmp, tname: 'vypozicky'});
				}
				return '';
			}
		}
    }, {
        field: 'id_osoba',
        title: 'ID osoby',
        sortable: true,
        editable: {
			type: 'text',
			title: 'ID osoby',
			validate: function (value) {
				value = $.trim(value);
				if (!value) {
					return 'Povinné pole';
				}
				// if (!/^$/.test(value)) {
				// 	return 'This field needs to start width $.'
				// }
				var data = $('#s3-vypozicky-table').bootstrapTable('getData'),
				index = $(this).parents('tr').data('index');
				console.log(data[index]);
				var tmp = data[index];
				if (value != data[index].id_osoba) {
					tmp.id_osoba = value;
					toUpdate.push({data: tmp, tname: 'vypozicky'});
				}
				return '';
			}
		}
    }, {
        field: 'stav',
        title: 'Stav',
        sortable: true
    }, {
		field: 'operate',
		title: '',
		align: 'center',
		events: operateEvents,
		formatter: operateFormatter
	}]
});

 $('#s13-servis-table').bootstrapTable({
    columns: [{
        field: 'id',
        title: 'Č.',
        sortable: true
    },{
        field: 'meno',
        title: 'Meno',
        sortable: true
    },{
        field: 'priezvisko',
        title: 'Priezvisko',
        sortable: true
    },{
        field: 'tel_cislo',
        title: 'Tel. č.',
        sortable: true
    },{
        field: 'znacka',
        title: 'Značka',
        sortable: true
    },{
        field: 'typ',
        title: 'Model',
        sortable: true
    },{
        field: 'bocna_hrana',
        title: 'B. h.',
        sortable: true
    },{
        field: 'spodna_hrana',
        title: 'S. h.',
        sortable: true
    },{
        field: 'vykonana_praca',
        title: 'Vyk. práca',
        sortable: true
    },{
        field: 'datum_prijatia',
        title: 'Prijaté',
        sortable: true,
        sorter: date_sorter
    },{
        field: 'datum_odovzdania',
        title: 'Odovzdať',
        sortable: true,
        sorter: date_sorter
    },{
        field: 'cena',
        title: '€',
        sortable: true
    },{
        field: 'poznamka',
        title: 'Poznámka',
        sortable: true
    }, {
		field: 'return',
		title: '',
		align: 'center',
		events: operateEvents,
		formatter: confirmServisFormatter
	}, {
		field: 'print',
		title: '',
		align: 'center',
		events: operateEvents,
		formatter: printServisFormatter
	}]
});

$('#s6-servis-table').bootstrapTable({
    columns: [{
        field: 'id',
        title: 'Č.',
        sortable: true
    },{
        field: 'meno',
        title: 'Meno',
        sortable: true
    },{
        field: 'priezvisko',
        title: 'Priezvisko',
        sortable: true
    },{
        field: 'tel_cislo',
        title: 'Tel. č.',
        sortable: true
    },{
        field: 'znacka',
        title: 'Značka',
        sortable: true
    },{
        field: 'typ',
        title: 'Model',
        sortable: true
    },{
        field: 'bocna_hrana',
        title: 'B. h.',
        sortable: true
    },{
        field: 'spodna_hrana',
        title: 'S. h.',
        sortable: true
    },{
        field: 'vykonana_praca',
        title: 'Vyk. práca',
        sortable: true
    },{
        field: 'datum_prijatia',
        title: 'Prijaté',
        sortable: true,
        sorter: date_sorter
    },{
        field: 'datum_odovzdania',
        title: 'Odovzdať',
        sortable: true,
        sorter: date_sorter
    },{
        field: 'cena',
        title: '€',
        sortable: true
    },{
        field: 'poznamka',
        title: 'Poznámka',
        sortable: true,
        editable: {
			type: 'text',
			title: 'Poznámka',
			validate: function (value) {
				val = $.trim(value);
				$s6_row = $(this).parents('tr');
				// ll($s6_row);
				// var i = $(this).closest('tr').attr('data-index');
				// ll(i);
				// var predaj = parseInt($(this).closest('tr').find('td:nth-child(4) a').attr('data-value'));
				var sid = $s6_row.find('td:nth-child(1)').html();
    			var praca = $s6_row.find('td:nth-child(9)').html();
    			ll(sid);
    			ll(praca);
				execSQLSync('UPDATE servis_archive SET poznamka="' + val + '" WHERE ' + 
					'id==' + sid + ' AND vykonana_praca=="' + praca + '"').then(
						function() {
							skirental.webdb.getAll('servis_archive', saveDataToJSON, 'data/servis/servis_archive.json');
						}
					);
			}
		}
    }, {
		field: 'print',
		title: '',
		align: 'center',
		events: operateEvents,
		formatter: printServisFormatter
	}, {
		field: 'returnToServis',
		title: '',
		align: 'center',
		events: operateEvents,
		formatter: returnToServisFormatter
	}]
});
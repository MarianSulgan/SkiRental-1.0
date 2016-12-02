// TODO: filter (#1)
// TODO: pridat zadavanie ceny pre polozky do tabulky vypozicka (#1)
// TODO: datepicker - treba spravit inteligentne odklikavanie okienok co vyskakuju + prelozit do slovenciny (#1)
// TODO: vyhladavanie bez diakritiky (vsade)


// HOWTO:
/*
- nastavit window.DEBUG = false
- novy tovar treba dat do ./data/Tovar.csv, ten sa pri prvom spusteni nacita a ulozi do DB
- nasledne sa spusti main();
*/

window.DEBUG = false;
window.NO_LOG = true;
window.LAST = "#home";

var S2_DATA = null;

// !!!!!!
// DATABASE LOCATION
// in console, write:
// require('nw.gui').App.dataPath;
// presumably should output location "C:\Users\<user-name>\AppData\Local\RaMaR"
// !!!!!!

skirental.webdb.open('skirental');
skirental.webdb.createTable('tovar');
skirental.webdb.createTable('osoby');
skirental.webdb.createTable('vypozicky');
skirental.webdb.createTable('tovar_vypozicky');
skirental.webdb.createTable('servis');
skirental.webdb.createTable('servis_archive');

// execSQLSync('DROP TABLE servis');
// skirental.webdb.createTable('config_table');

// TODO:
// alter table - pridat do vypozicky kolonku "stav"
// 0 = neaktivna
// 1 = aktivna
// syntax: ALTER TABLE mytable ADD time VARCHAR NOT NULL DEFAULT 1

// execSQLSync('ALTER TABLE servis ADD poznamka TEXT');
// execSQLSync('ALTER TABLE vypozicky ADD stav INTEGER NOT NULL DEFAULT 1');
// execSQLSync('ALTER TABLE tovar_vypozicky ADD stav INTEGER NOT NULL DEFAULT 1');
// execSQLSync('ALTER TABLE tovar_vypozicky ADD datum_vratene TEXT DEFAULT NULL');

// DEBUG
// if (window.DEBUG) { 
	// skirental.webdb.deleteAll('osoby');
	// skirental.webdb.deleteAll('vypozicky');
	// skirental.webdb.deleteAll('tovar_vypozicky');
	// skirental.webdb.deleteAll('tovar');
// }

// parse .csv file and execute callback "main" function
// parseCSV('Tovar.csv', main);
// win_run('a.pdf');

// load settings and go!
// $.get("../settings.txt", function(tmp) {
// 	l(tmp);
// 	if (tmp == 0 || window.DEBUG == true) {
// 		// first time run, install database data, store flag that first run is over
// 		writeFile('../settings.txt', '1', jQuery.noop);
// 		parseCSV('./data/Tovar.csv').then(function(response) {
// 			// insert data do DB
// 			skirental.webdb.insertMultipleRows('tovar', response).then(function(response) {
// 				// run main()
// 				main();
// 			});
// 		});
// 	} else {
// 		// either run _main_, or run _parseCSV_
// 		main();
// 	}
// });

// always load from csv
// parseCSV('./data/Tovar.csv').then(function(response) {
// 	// insert data do DB
// 	skirental.webdb.insertMultipleRows('tovar', response).then(function(response) {
// 		// run main()
// 		main();
// 	});
// });

// load last page before refresh id
$.get("./settings/last_page.txt", function(tmp) {
	ll(tmp);
	window.LAST = tmp;
	main();
});

function main(data) {

	$('#page1 .collapse').collapse();


	// TODO: add refreshing tables with every action
	// create JSON version of DB data
	skirental.webdb.getAll('tovar', saveDataToJSON, 'data/tovar.json');
	skirental.webdb.getAll('osoby', saveDataToJSON, 'data/osoby.json');
	skirental.webdb.getAll('vypozicky', saveDataToJSON, 'data/vypozicky.json');
	skirental.webdb.getAll('tovar_vypozicky', saveDataToJSON, 'data/tovar_vypozicky.json');
	skirental.webdb.getAll('servis', saveDataToJSON, 'data/servis/servis.json');
	skirental.webdb.getAll('servis_archive', saveDataToJSON, 'data/servis/servis_archive.json');

	// load data to table (page 1)
	skirental.webdb.getAll('tovar', loadDataToTable, 'tovar_table');

	// skirental.webdb.getAll('tovar', loadDataToTable, 's3-tovar-table');

	// generate screen2 table - orders 
	// (combined "vypozicky" + "tovar_vypozicky" + "tovar" + "osoby")
	skirental.webdb.getAllOrderDetails().then(function(response) {
		// first, init tables on screen 2
		// initS2tables();
		// genTableOrderDetails(response);
		var data = editDataTovarDetail(response);
		renderS2Table(data);
		S2_DATA = s2Content();
		// l(response);
		// TODO: pouzit tento refresh na vsetky tabulky, nepouzivat tie window.reload vsade
		// saveDataToJSON_2(data, 'data/vypozicky_detail.json').then(function() {
		// 	$('#s2-table').bootstrapTable('refresh');
		// 	$('#s2-table').on('post-body.bs.table', initHighlightS2);
		// });
	});

	// render calendar
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth(); //January is 0!
	var yyyy = today.getFullYear();
    var todayDate = new Date(yyyy, mm, dd).getTime();

	calendar = $('.calendar').calendar({
		customDayRenderer: function(element, date) {
            if(date.getTime() == todayDate) {
                $(element).css('background-color', 'rgba(245, 126, 32, 0.1)');
                $(element).css('font-weight', 'bold');
                $(element).css('border-radius', '15px');
            }
        },
        mouseOutDay: function(e) {
            if(e.events.length > 0) {
                $(e.element).popover('hide');
            }
        }
	});

	// render starting screen
	// renderPage('#home');
	// renderPage('#page4');
	renderPage(window.LAST);
	// renderPage('#page3');
	// renderPage('#page5');
	// initHighlightS2();
}
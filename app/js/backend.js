 
/* -------------- Web SQL database -------------- */

var skirental = {};
skirental.webdb = {};

// variable for inserting id
var id_inc = 0;
var last_person_id = 0;

// currently open page
var currentPage = "";


skirental.webdb.db = null;
// Open the database
skirental.webdb.open = function(dbname) {
	var dbSize = 10 * 1024 * 1024 // 10 MB
	skirental.webdb.db = openDatabase(dbname, '1.0', 'database - ski rental and servis', dbSize);
}

skirental.webdb.onError = function(tx, e) {
	ll("An error occured: " + e.message,arguments.callee.toString());
}

skirental.webdb.onSuccess = function(tx, e) {
	ll("Success",arguments.callee.toString());
}

skirental.webdb.createTable = function(tname) {
	var q;
	if (tname == 'tovar') {
		// l('tovar created');
		q = 'CREATE TABLE IF NOT EXISTS tovar ('+
			'id integer unique primary key,'+
			'znacka text,'+
			'typ text,'+
			'velkost text,'+
			'typ_tovaru text,'+
			'stav text'+
			')';	
	} else if (tname == 'vypozicky') {
		// l('vypozicky created');
		q = 'CREATE TABLE IF NOT EXISTS vypozicky ('+
			'id integer unique primary key,'+
			'datum_od text,'+
			'datum_do text,'+
			'cena real,'+
			'id_osoba integer,'+
			// 'id_doklad integer,'+
			'stav integer NOT NULL DEFAULT 1,'+
			'FOREIGN KEY(id_osoba) REFERENCES tovar(id)'+
			')';
	} else if (tname == 'osoby') {
		// l('osoby created');
		q = 'CREATE TABLE IF NOT EXISTS osoby ('+
			'id integer unique primary key,'+
			'meno text,'+
			'priezvisko text,'+
			'tel_cislo text,'+
			'doklad text,'+
			'ulica text,'+
			'psc text,'+
			'mesto text'+
			')';
	} else if (tname == 'tovar_vypozicky') {
		// l('tovar_vypozicky created');
		q = 'CREATE TABLE IF NOT EXISTS tovar_vypozicky ('+
			'id integer unique primary key,'+
			'id_tovar integer,'+
			'id_vypozicka integer,'+
			'stav integer NOT NULL DEFAULT 1,'+
			'datum_vratene text DEFAULT NULL,'+
			'FOREIGN KEY(id_tovar) REFERENCES tovar(id),'+
			'FOREIGN KEY(id_vypozicka) REFERENCES vypozicky(id)'+
			')';
	} else if (tname == 'config_table') {
		q = 'CREATE TABLE IF NOT EXISTS config_table('+
			'id_vypozicka_max integer,'+
			'id_osoba_max integer'+
			')';
	} else if (tname == 'servis') {
		q = 'CREATE TABLE IF NOT EXISTS servis('+
			'meno text,'+
			'priezvisko text,'+
			'tel_cislo text,'+
			'doklad text,'+
			'adresa text,'+
			'cena real,'+
			'datum_prijatia text,'+
			'datum_odovzdania text,'+
			'znacka text,'+
			'typ text,'+
			'spodna_hrana text,'+
			'bocna_hrana text,'+
			'vykonana_praca text,'+
			'id integer,'+
			'poznamka text'+
			')';
	} else if (tname == 'servis_archive') {
		q = 'CREATE TABLE IF NOT EXISTS servis_archive('+
			'meno text,'+
			'priezvisko text,'+
			'tel_cislo text,'+
			'doklad text,'+
			'adresa text,'+
			'cena real,'+
			'datum_prijatia text,'+
			'datum_odovzdania text,'+
			'znacka text,'+
			'typ text,'+
			'spodna_hrana text,'+
			'bocna_hrana text,'+
			'vykonana_praca text,'+
			'id integer,'+
			'poznamka text'+
			')';
	} else {
		l('Error: table name not recognized!');
	}
	var db = skirental.webdb.db;
	return new Promise(function(resolve) {
		// ll('lolz',arguments.callee.toString());
		db.transaction(function(tx) {
			tx.executeSql(q, [], 
				skirental.webdb.onSuccess,
				skirental.webdb.onError);
			resolve();
		});
	});
}

skirental.webdb.insertRow = function(tname, row) {
	// row == [value, value, value, ...]
	var q;
	if (tname == 'tovar') {
		q = 'INSERT INTO tovar (id, znacka, typ, velkost, typ_tovaru, stav)'+
			'VALUES (?, ?, ?, ?, ?, ?)';	
	} else if (tname == 'vypozicky') {
		q = 'INSERT INTO vypozicky (id, datum_od, datum_do, cena, id_osoba)'+
			'VALUES (?, ?, ?, ?, ?)';
	} else if (tname == 'osoby') {
		// l('tutu!');
		q = 'INSERT INTO osoby (id, meno, priezvisko, tel_cislo, doklad, ulica,'+
			'psc, mesto)'+
			'VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
	} else if (tname == 'tovar_vypozicky') {
		// ll('inserting.....',arguments.callee.toString());
		q = 'INSERT INTO tovar_vypozicky (id, id_tovar, id_vypozicka)'+
			'VALUES (?, ?, ?)';
	} else if (tname == 'servis') {
		q = 'INSERT INTO servis (meno, priezvisko, tel_cislo, doklad, adresa, '+
			'cena, datum_prijatia, datum_odovzdania, znacka, typ, spodna_hrana, bocna_hrana, vykonana_praca, id, poznamka)'+
			'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
	} else if (tname == 'servis_archive') {
		q = 'INSERT INTO servis_archive (meno, priezvisko, tel_cislo, doklad, adresa, '+
			'cena, datum_prijatia, datum_odovzdania, znacka, typ, spodna_hrana, bocna_hrana, vykonana_praca, id, poznamka)'+
			'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
	} else {
		l('Error: table name not recognized!');
	}
	var db = skirental.webdb.db;
	return new Promise(function(resolve) {
		db.transaction(function(tx) {
			tx.executeSql(q, row, 
				skirental.webdb.onSuccess,
				skirental.webdb.onError);
			resolve();
		});
	});
}

skirental.webdb.insertMultipleRows = function(tname, arr) {
	// arr is array of rows
	var q;
	if (tname == 'tovar') {
		q = 'INSERT INTO tovar (id, znacka, typ, velkost, typ_tovaru, stav)'+
			'VALUES (?, ?, ?, ?, ?, ?)';	
	} else if (tname == 'vypozicky') {
		q = 'INSERT INTO vypozicky (id, datum_od, datum_do, cena, id_osoba)'+
			'VALUES (?, ?, ?, ?, ?)';
	} else if (tname == 'osoby') {
		// l('tutu!');
		q = 'INSERT INTO osoby (id, meno, priezvisko, tel_cislo, doklad, ulica,'+
			'psc, mesto)'+
			'VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
	} else if (tname == 'tovar_vypozicky') {
		q = 'INSERT INTO tovar_vypozicky (id, id_tovar, id_vypozicka)'+
			'VALUES (?, ?, ?)';
	} else if (tname == 'servis') {
		q = 'INSERT INTO servis (meno, priezvisko, tel_cislo, doklad, adresa, '+
			'cena, datum_prijatia, datum_odovzdania, znacka, typ, spodna_hrana, bocna_hrana, vykonana_praca, id, poznamka)'+
			'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
	} else {
		l('Error: table name not recognized!');
	}

	var db = skirental.webdb.db;

	return new Promise(function(resolve) {
		db.transaction(function(tx) {
			for (i in arr) {
				ll('inserting record',arguments.callee.toString());
				ll(arr[i],arguments.callee.toString());
				var row = arr[i];
				tx.executeSql(q, row, 
					skirental.webdb.onSuccess,
					skirental.webdb.onError);
			}
			resolve();
		});
	});
}

//TODO: complete
skirental.webdb.updateRow = function(tname, row) {
	// row == [value, value, value, ...]
	var q;
	if (tname == 'tovar') {
		q = 'UPDATE tovar SET znacka=?, typ=?, velkost=?,'+
		' typ_tovaru=?, stav=? WHERE id=?';	
	} else if (tname == 'vypozicky') {
		q = 'UPDATE vypozicky SET datum_od=?, datum_do=?, cena=?,'+
		' id_osoba=? WHERE id=?';
	} else if (tname == 'osoby') {
		q = 'UPDATE osoby SET meno=?, priezvisko=?, tel_cislo=?,'+
		' doklad=?, ulica=?, psc=?, mesto=? WHERE id=?';
	} else if (tname == 'tovar_vypozicky') {
		ll('updatujem.......',arguments.callee.toString());
		q = 'UPDATE tovar_vypozicky SET id_tovar=?, id_vypozicka=? WHERE id=?';
	} else {
		l('Error: table name not recognized!');
	}
	return new Promise(function(resolve) {
		var db = skirental.webdb.db;
		db.transaction(function(tx) {
			tx.executeSql(q, row, 
				skirental.webdb.onSuccess,
				skirental.webdb.onError);
			resolve();
		});
	});
}

skirental.webdb.updateAttribute = function(tname, attribute, row) {
	// row == [attributeValue, rowId]
	var q;
	if (tname == 'tovar') {
		// q = 'UPDATE tovar SET znacka=?, typ=?, velkost=?,'+
		// ' typ_tovaru=?, stav=? WHERE id=?';	
	} else if (tname == 'vypozicky') {
		q = 'UPDATE vypozicky SET ' + attribute + '=? WHERE id=?';
	} else if (tname == 'osoby') {
		// q = 'UPDATE osoby SET meno=?, priezvisko=?, tel_cislo=?,'+
		// ' doklad=?, ulica=?, psc=?, mesto=? WHERE id=?';
	} else if (tname == 'tovar_vypozicky') {
		// ll('updatujem.......',arguments.callee.toString());
		// q = 'UPDATE tovar_vypozicky SET id_tovar=?, id_vypozicka=? WHERE id=?';
	} else {
		l('Error: table name not recognized!');
	}
	return new Promise(function(resolve) {
		var db = skirental.webdb.db;
		db.transaction(function(tx) {
			tx.executeSql(q, row, 
				skirental.webdb.onSuccess,
				skirental.webdb.onError);
			resolve();
		});
	});
}

//TODO: complete
// skirental.webdb.updateMultipleRows = function(tname, arr) {
// 	// arr is array of rows
// 	var q;
// 	if (tname == 'tovar') {
// 		q = 'UPDATE products SET name=? WHERE id=?';	
// 	} else if (tname == 'vypozicky') {
// 		q = 'UPDATE products SET name=? WHERE id=?';
// 	} else if (tname == 'osoby') {
// 		// l('tutu!');
// 		q = 'UPDATE products SET name=? WHERE id=?';
// 	} else if (tname == 'tovar_vypozicky') {
// 		q = 'UPDATE products SET name=? WHERE id=?';
// 	} else {
// 		console.log('Error: table name not recognized!');
// 	}
// 	var db = skirental.webdb.db;
// 	return new Promise(function(resolve) {
// 		db.transaction(function(tx) {
// 			for (i in arr) {
// 				var row = arr[i];
// 				tx.executeSql(q, row, 
// 					skirental.webdb.onSuccess,
// 					skirental.webdb.onError);
// 			}
// 			resolve();
// 		});
// 	});
// }

skirental.webdb.getAll = function(tname, renderData, tid) {
	var q = 'SELECT * FROM ' + tname;
	// renderData is callback function
	var db = skirental.webdb.db;
	return new Promise(function(resolve) {
		db.transaction(function(tx) {
			tx.executeSql(q, [], function(tx, rs) {
				renderData(tx, rs, tid);
				resolve();
			}, 
			skirental.webdb.onError);
		});
	});
}

skirental.webdb.getAll_2 = function(tname) {
	var q = 'SELECT * FROM ' + tname;
	// renderData is callback function
	var db = skirental.webdb.db;
	return new Promise(function(resolve) {
		db.transaction(function(tx) {
			tx.executeSql(q, [], function(tx, rs) {
				var arr = [];
				for (i = 0; i < rs.rows.length; i++)
					arr.push(rs.rows.item(i));
				resolve(arr);
			}, 
			skirental.webdb.onError);
		});
	});
}

skirental.webdb.deleteRow = function(tname, id) {
	var q;
	if (tname == 'tovar') {
		q = 'DELETE FROM tovar WHERE id=?';
	} else if (tname == 'vypozicky') {
		q = 'DELETE FROM vypozicky WHERE id=?';
	} else if (tname == 'osoby') {
		q = 'DELETE FROM osoby WHERE id=?';
	} else if (tname == 'tovar_vypozicky') {
		q = 'DELETE FROM tovar_vypozicky WHERE id=?';
	} else {
		l('Error: table name not recognized!');
	}
	return new Promise(function(resolve) {
		var db = skirental.webdb.db;
		db.transaction(function(tx) {
			tx.executeSql(q, [id], skirental.webdb.onSuccess, skirental.webdb.onError);
		resolve();
		});
	});
}

skirental.webdb.deleteAll = function(tname) {
	var q;
	if (tname == 'tovar') {
		q = 'DELETE FROM tovar';	
	} else if (tname == 'vypozicky') {
		q = 'DELETE FROM vypozicky';
	} else if (tname == 'osoby') {
		q = 'DELETE FROM osoby';
	} else if (tname == 'tovar_vypozicky') {
		q = 'DELETE FROM tovar_vypozicky';
	} else {
		l('Error: table name not recognized!');
	}
	var db = skirental.webdb.db;
	db.transaction(function(tx) {
		tx.executeSql(q, [], skirental.webdb.onSuccess, skirental.webdb.onError);
	});
}

skirental.webdb.lastID = function(tname) {
	var q = 'SELECT MAX(id) FROM ' + tname;
	if ((tname != 'tovar') && (tname != 'vypozicky') && 
		(tname != 'osoby') && (tname != 'tovar_vypozicky') && (tname != 'servis')) {	
		l('Error: table name not recognized!');
	}
	var ret = -1;
	var db = skirental.webdb.db;

	return new Promise(function(resolve) {
		db.transaction(function(tx) {
			tx.executeSql(q, [], function(tx, rs, tid) {
				resolve(rs.rows.item(0));
			}, 
			skirental.webdb.onError);
		});
	})
}

skirental.webdb.getAllOrderDetails = function() {
	// var q = "SELECT vypozicky.id, tovar.znacka, tovar.typ, tovar.velkost,"+
	// " tovar.typ_tovaru, tovar.id AS tovarId, osoby.meno, osoby.priezvisko, osoby.ulica, "+
	// "osoby.psc, osoby.mesto, osoby.tel_cislo, vypozicky.datum_od, vypozicky.datum_do "+
	// "FROM vypozicky JOIN tovar_vypozicky ON vypozicky.id==tovar_vypozicky.id_vypozicka "+
	// "JOIN tovar ON tovar_vypozicky.id_tovar==tovar.id JOIN osoby ON "+
	// "vypozicky.id_osoba==osoby.id";
	var q = "select distinct vypozicky.id, tovar.znacka, tovar.typ, tovar.velkost,"+
	" tovar.typ_tovaru, tovar.id AS tovarId, osoby.meno, osoby.priezvisko, osoby.ulica, "+
	"osoby.psc, osoby.mesto, osoby.tel_cislo, osoby.doklad, vypozicky.datum_od, vypozicky.datum_do, vypozicky.stav, vypozicky.cena "+
	 "from tovar_vypozicky join vypozicky "+
			"on tovar_vypozicky.id_vypozicka=vypozicky.id " +
			"join tovar on tovar.id=tovar_vypozicky.id_tovar "+
			"join osoby on vypozicky.id_osoba=osoby.id "+
			"where tovar_vypozicky.stav=1 and vypozicky.stav=1";
	var db = skirental.webdb.db;
	return new Promise(function(resolve) {
		db.transaction(function(tx) {
			tx.executeSql(q, [], function(tx, rs, tid) {
				l('ROWS');
				var arr = [];
				for (i = 0; i < rs.rows.length; i++)
					arr.push(rs.rows.item(i));
				l(arr);
				resolve(rs.rows);
			}, 
			skirental.webdb.onError);
		});
	});
}

skirental.webdb.getAllOrderDetailsExtra = function(vypozicka_id) {
	var q = "select distinct vypozicky.id, tovar.znacka, tovar.typ, tovar.velkost,"+
	" tovar.typ_tovaru, tovar.id AS tovarId, osoby.meno, osoby.priezvisko, osoby.ulica, "+
	"osoby.psc, osoby.mesto, osoby.tel_cislo, osoby.doklad, vypozicky.datum_od, vypozicky.datum_do, vypozicky.stav, vypozicky.cena "+
	 "from tovar_vypozicky join vypozicky "+
			"on tovar_vypozicky.id_vypozicka=vypozicky.id " +
			"join tovar on tovar.id=tovar_vypozicky.id_tovar "+
			"join osoby on vypozicky.id_osoba=osoby.id "+
			"where tovar_vypozicky.stav=1 and vypozicky.stav=1 " +
			"and vypozicky.id=" + vypozicka_id;
	var db = skirental.webdb.db;
	return new Promise(function(resolve) {
		db.transaction(function(tx) {
			tx.executeSql(q, [], function(tx, rs, tid) {
				l('ROWS');
				var arr = [];
				for (i = 0; i < rs.rows.length; i++)
					arr.push(rs.rows.item(i));
				l(arr);
				resolve(rs.rows);
			}, 
			skirental.webdb.onError);
		});
	});
}

skirental.webdb.getAllItemOrdersDates = function(item_id) {
	var q = 
		"SELECT DISTINCT vypozicky.id, id_tovar, datum_od, datum_do FROM tovar_vypozicky JOIN " +
		"vypozicky ON tovar_vypozicky.id_vypozicka=vypozicky.id WHERE " +
		"tovar_vypozicky.id_tovar="+item_id+" AND tovar_vypozicky.stav==1 AND vypozicky.stav==1";
	var db = skirental.webdb.db;
	return new Promise(function(resolve) {
		db.transaction(function(tx) {
			tx.executeSql(q, [], function(tx, rs, tid) {
				var arr = [];
				for (i = 0; i < rs.rows.length; i++)
					arr.push(rs.rows.item(i));
				// ll(arr,arguments.callee.toString());
				resolve(arr);
			}, 
			skirental.webdb.onError);
		});
	})
}

/* -------------- VARIABLES ---------------- */

var hist = [];

var pg = {};
pg["#home"] = "Menu";
pg["#page1"] = "Nová výpožička";
pg["#page2"] = "Prebiehajúce výpožičky";
pg["#page3"] = "Databáza";
pg["#page4"] = "Servis";
pg["#page5"] = "Predaj";
pg["#page6"] = "Štatistiky";
pg["#page7"] = "Vyhľadávanie";
pg["#page10"] = "Import dát";
pg["#page11"] = "Nastavenia";
pg["#page12"] = "Kalendár výpožičiek";
pg["#page13"] = "Prebiehajúci servis";

// _order_ variable = keep track of Order items
var Order = {};
Order.ids = [];
Order.nodes = [];

var Data = {
	customer: [],
	order: []
};

var Servis = {};
Servis.items = [];

/* -------------- FUNCTIONS ---------------- */

function db_saveData() {
	return new Promise(function(resolve) {
		var tmp = $('#order-item-list').find('li');
		// check if minimum information is filled in form
		var cond;
		if (window.DEBUG)
			cond = true;
		else {
			cond = (($('#vypozicka-meno').val() != "" || 
			$('#vypozicka-priezvisko').val() != "") && 
			($('#vypozicka-telefon').val() != "") && 
			// ($('#vypozicka-cop').val() != "") &&
			(tmp.length > 1) && 
			($('#price-total').val() != "") &&
			($('#datum-od').val() != "") && 
			($('#datum-do').val() != "") &&
			(_date($('#datum-od').val()) <= _date($('#datum-do').val())));
		}
		if (cond) {
			skirental.webdb.lastID('osoby').then(function(response) {

				var c_id = ++response["MAX(id)"];

				// save customer
				var arr = [
					c_id,
					$('#vypozicka-meno').val(),
					$('#vypozicka-priezvisko').val(),
					$('#vypozicka-telefon').val(),
					$('#vypozicka-cop').val(),
					$('#vypozicka-ulica').val(),
					$('#vypozicka-psc').val(),
					$('#vypozicka-mesto').val()
				];
				skirental.webdb.insertRow('osoby', arr);
				Data.customer = arr;
				
				// save order
				skirental.webdb.lastID('vypozicky').then(function(response) {
					var o_id = ++response["MAX(id)"];
					var arr = [
						o_id,
						$('#datum-od').val(),
						$('#datum-do').val(),
						$('#price-total').val(),
						c_id
					];
					// l(arr);
					skirental.webdb.insertRow('vypozicky', arr);
					Data.order = arr;

					// save tovar_vypozicky
					skirental.webdb.lastID('tovar_vypozicky').then(function(response) {
						var t_id = ++response["MAX(id)"];
						l('New record id: ' + t_id);
						l('Order.ids >');
						l(Order.ids);
						var arr = [];
						for (i = 0; i < Order.ids.length; i++) {
							tmp_arr = [
								t_id++,
								Order.ids[i],
								o_id
							];
							arr.push(tmp_arr);
						}
						l(arr);
						skirental.webdb.insertMultipleRows('tovar_vypozicky', arr);
						resolve(o_id);
					});
				});
			});
		} else {
			$('#notfilledModal').modal('show');
		}
	});
}

var xx;

function filterDates(datum_od, datum_do) {

	// hide tooltip
	var tooltips = window.shared.tooltips;
	if (typeof(tooltips) != "undefined") {
		tooltips[0].show = false;
		tooltips[0].tip.hide();
	}

	//enable forms
	$('.switchable').removeClass('enable-on-date-picked');

	if (_date(datum_od) > _date(datum_do)) {
		l(_date(datum_od) > _date(datum_do));
		$('#wrongDates').modal('show');
		return;
	}

	resetFiltered();

	var arr = [];

	execSQLSync(
		"SELECT * FROM vypozicky JOIN tovar_vypozicky ON "+
		"vypozicky.id==tovar_vypozicky.id_vypozicka JOIN tovar ON tovar.id==tovar_vypozicky.id_tovar " +
		"WHERE tovar_vypozicky.stav==1 AND vypozicky.stav==1").then(
		function(response) {
			var datumOd = moment(datum_od, "DD.MM.YYYY");
			var datumDo = moment(datum_do, "DD.MM.YYYY");
			for (i = 0; i < response.length; i++) {
				var tovarOd = moment(response.item(i).datum_od, "DD.MM.YYYY");
				var tovarDo = moment(response.item(i).datum_do, "DD.MM.YYYY");
				// add correction one day to prevent overlapping orders
				tovarDo.add(1, 'day');
				if (tovarDo.isAfter(datumOd) && 
					tovarOd.isBefore(datumDo)) {
					// push in array those overlappging orders
					arr.push(response.item(i).id + "");
				}
			}

			// remove from table
			var trs = $('#tovar_table tr');
			// remove rows from table with ID found in array
			for (i = 0; i < trs.length; i++) {
				if ($.inArray($(trs[i]).find('.id').html(), arr) != -1) {
					$(trs[i]).css('display', 'none');
				}
			}
	}); 
}

function resetFiltered() {
	$('#tovar_table tr').css('display', 'table-row');
}

function _date(str) {
  var array = str.split('.');
  return new Date(array[1] + '-' + array[0] + '-' + array[2]);
}

function logLastID(tx, rs) {
	for (var i = 0; i < rs.rows.length; i++) {
		// l(rs.rows.item(i));
	}
}

function loadDataToTable(tx, rs, tid) {
	var rowOutput = "";
	var dataElem = document.getElementById(tid);
	for (var i = 0; i < rs.rows.length; i++) {
		rowOutput += renderItemTable(rs.rows.item(i));
		window.shared.tovar.push(rs.rows.item(i));
	}
	dataElem.innerHTML = rowOutput;
	addFunc();
}

function loadDataToMem(tx, rs, tid) {
	var a;
	if (tid = 'tovar')
		a = window.shared.tovar;
	else if (tid = 'vypozicky')
		a = window.shared.vypozicky;
	else if (tid = 'zakaznici')
		a = window.shared.zakaznici;
	else return -1;
	if (a.length == 0)
		for (var i = 0; i < rs.rows.length; i++) {
			a.push(rs.rows.item(i));
		}
}

function genJSONfiles(callback) {
	skirental.webdb.getAll('tovar', saveDataToJSON, 'data/tovar.json',arguments.callee.toString()).then(function() {
		skirental.webdb.getAll('osoby', saveDataToJSON, 'data/osoby.json',arguments.callee.toString()).then(function() {
			skirental.webdb.getAll('vypozicky', saveDataToJSON, 'data/vypozicky.json',arguments.callee.toString()).then(function() {
				skirental.webdb.getAll('tovar_vypozicky', saveDataToJSON, 'data/tovar_vypozicky.json',arguments.callee.toString()).then(function() {
					_reload();
				});
			});
		});
	});
}

function saveDataToJSON(tx, rs, filename) {
	var x = [];
	for (var i = 0; i < rs.rows.length; i++) {
		x.push(rs.rows.item(i));
	}
	saveJSON(x, filename);
}

function saveDataToJSONSyncWrapper_servisReload(tx, rs, filename) {
	var x = [];
	for (var i = 0; i < rs.rows.length; i++) {
		x.push(rs.rows.item(i));
	}
	saveJSONSync(x, filename).then(function() {
		$('#s13-servis-table').bootstrapTable('refresh');
	})
}

function editDataTovarDetail(data) {
	var arr = [];
	for (i = 0; i < data.length; i++) {
		var row = new Object();
		var tmp = data.item(i);
		// ll(tmp,arguments.callee.toString());
		var ddate = new Date(_date(tmp.datum_do));
		var today = new Date();
		var days = Math.ceil((ddate - today) / (1000*60*60*24));
		row.id = tmp.id;
		row.znacka = tmp.znacka;
		row.typ = tmp.typ;
		row.tovarId = tmp.tovarId;
		row.velkost = tmp.velkost;
		row.typ_tovar = tmp.typ_tovaru;
		row.meno = tmp.meno;
		row.priezvisko = tmp.priezvisko;
		row.tel_cislo = tmp.tel_cislo;
		row.dni = days;
		row.datum_od = tmp.datum_od;
		row.datum_do = tmp.datum_do;
		row.adresa = tmp.ulica + ", " + tmp.psc + " " + tmp.mesto;
		row.doklad = tmp.doklad;
		row.cena = tmp.cena;
		arr.push(row);
	}
	return arr;
}

function renderS2Table(data) {
	ll('rendering s2 table...',arguments.callee.toString());
	// get nodes
	var template = $('#vypozicky_table').clone();
	var liTemplate = $('#vypozicky_table .template.template-2 li').clone().removeClass("template");
	// var tmpOrder = $(tmp).find('.template-1');
	// var tmpItems = $(tmp).find('.template-2');
	// $(tmpOrder).removeClass('.template');
	// $(tmpItems).removeClass('.template');

	// render
	var stuff = mergeObjectsByID(data);
	ll(stuff,arguments.callee.toString());

	for (i in stuff) {

		// get nodes
		var tmp = $(template).clone();
		var tmpOrder = $(tmp).find('.template-1');
		var tmpItems = $(tmp).find('.template-2');
		$(tmpOrder).removeClass('template');
		$(tmpItems).removeClass('template');

		var row = stuff[i].order;

		// render order
		$(tmpOrder).find('.id').html(row.id);
		$(tmpOrder).find('.meno').html(row.meno);
		$(tmpOrder).find('.priezvisko').html(row.priezvisko);
		$(tmpOrder).find('.adresa').html(row.adresa);
		$(tmpOrder).find('.tel_cislo').html(row.tel_cislo);
		$(tmpOrder).find('.datum_do').html(row.datum_do);
		$(tmpOrder).find('.datum_od').html(row.datum_od);
		$(tmpOrder).find('.dni').html(row.dni);
		// controls
		$(tmpOrder).find('.expand-btn').attr('href', '#s2-detail' + row.id);
		$(tmpOrder).find('.expand-btn').attr('aria-controls', 's2-detail' + row.id);
		$(tmpItems).find('.s2-list').attr('id', 's2-detail' + row.id);
		// add row-index attribute
		$(tmpOrder).attr('row-index', row.id);
		$(tmpItems).attr('row-index', row.id);

		// render all items under one order
		for (j = 0; j < stuff[i].items.length; j++) {
			// ll(stuff[i].items,arguments.callee.toString());
			var li = $(liTemplate).clone();
			var tmpItem = stuff[i].items[j];
			$(li).find('.id').html(tmpItem.tovarId);
			$(li).find('.popis').html(tmpItem.typ_tovar + ' ' + tmpItem.znacka + 
				' ' + tmpItem.typ + ', veľ. ' + tmpItem.velkost);
			$(tmpItems).find('ul.s2-list').append(li);
		}
		$('#vypozicky_table').append(tmpOrder);
		$('#vypozicky_table').append(tmpItems);
	}
	s2_renderAfterSort('dni', 'number');
	// add editable functionality
    $('.my-editable-1').editable({
        type: 'text',
        title: 'Zadajte nové číslo tovaru:',
        success: function(response, newValue) {
        	var oldValue = $(this).editable('getValue')["undefined"];
            var tid = $(this).closest('tr').attr('row-index');
            // TODO: check if item is available on those dates
            // ...
            // save to database
            // row == [id_tovar=?, id_vypozicka=?, id=?]
            execSQLSync('SELECT id FROM tovar_vypozicky WHERE id_tovar='+oldValue+' AND '+
            	'id_vypozicka='+tid).then(function(response) {
            		var row = [newValue, tid, response.item(0)["id"]];
		            skirental.webdb.updateRow('tovar_vypozicky', row).then(function() {
			            // reload page
			            _reload();
		            });
            	});
        }
    });
    $('.my-editable-2').editable({
        type: 'text',
        title: 'Zadajte nový dátum:',
        success: function(response, newValue) {
        	// var oldValue = $(this).editable('getValue')["undefined"];
            var tid = $(this).closest('tr').attr('row-index');
            var str = "";
            if ($(this).hasClass('datum_od')) {
            	// edited DATUM OD
            	str = "datum_od";
            } else {
            	// edited DATUM DO
            	str = "datum_do";
            }
            // TODO: check if item is available on those dates
            // ...
            // save to database
            // row == [attributeValue, rowID]
            var row = [newValue, tid];
            skirental.webdb.updateAttribute('vypozicky', str, row).then(function() {
            	skirental.webdb.getAll('vypozicky', saveDataToJSON, 'data/vypozicky.json',arguments.callee.toString()).then(function() {
            		_reload();
            	});
            });
        }
    });
    // anyway, disable editable, will work only after clicking EDIT button
    $('.my-editable-1').editable('disable');
    $('.my-editable-2').editable('disable');
}

function mergeObjectsByID(objs) {
	tmp = {};
	for (i = 0; i < objs.length; i++) {
		var index = objs[i].id;
		if (typeof(tmp[index]) == 'undefined') {
			tmp[index] = {};
		}
		if (typeof(tmp[index].items) == 'undefined') {
			tmp[index].items = [];
		}
		if (typeof(tmp[index].order) == 'undefined') {
			tmp[index].order = {
				id: objs[i].id,
				meno: objs[i].meno,
				priezvisko: objs[i].priezvisko,
				adresa: objs[i].adresa,
				tel_cislo: objs[i].tel_cislo,
				datum_od: objs[i].datum_od,
				datum_do: objs[i].datum_do,
				dni: objs[i].dni,
				doklad: objs[i].doklad,
				cena: objs[i].cena
			};
		}
		tmp[index].items.push({
			tovarId: objs[i].tovarId,
			typ: objs[i].typ,
			typ_tovar: objs[i].typ_tovar,
			velkost: objs[i].velkost,
			znacka: objs[i].znacka
		});
	}
	return tmp;
}

function cleanDatabase() {
	// zmaze polozky z tovar_vypozicky, ktore nemaju vypozicku
	removeDeadTovarVypozicky();
	// zmaze vsetky vypozicky, ktore nemaju tovar (???)
}

function removeDeadTovarVypozicky() {
	var ids = []; // idcka, ktore sa nemaju zmazat - ostatne von
	// var backup = [];
	skirental.webdb.getAll_2('tovar_vypozicky').then(function(response) {
		var data = response;
		var data_ids = [];
		for (i = 0; i < data.length; i++) {
			data_ids.push(data[i].id);
		}
		skirental.webdb.getAll_2('vypozicky').then(function(response) {
			for (i = 0; i < data.length; i++) {
				for (j = 0; j < response.length; j++) {
					if (data[i].id_vypozicka == response[j].id)
						ids.push(data[i].id);
				}
			}

			// ll(ids,arguments.callee.toString());
			// ll(data_ids,arguments.callee.toString());
			var del = arr_diff_int(data_ids, ids);
			ll(del,arguments.callee.toString());
			for (i = 0; i < del.length; i++) {
				ll('removing...',arguments.callee.toString());
				// backup.push(data[i]);
				skirental.webdb.deleteRow('tovar_vypozicky', del[i]);
			}
			// ll(ids,arguments.callee.toString());
			// ll(data.length,arguments.callee.toString());
			// ll(data,arguments.callee.toString());
			// for (j = 0; j < data.length; j++) {
			// 	ll(isInArray(data[j].id_vypozicka, ids,arguments.callee.toString()));
			// }
			// zmazat vsetky idcka okrem tych, co su v poli _ids_
			// for (i = 0; i < data.length; i++) {
			// 	ll(data[i].id_vypozicka,arguments.callee.toString());
			// 	ll(isInArray(data[i].id_vypozicka, ids,arguments.callee.toString()));
			// 	// if (isInArray(data[i].id_vypozicka, ids)) {
			// 	// 	backup.push(data[i]);
			// 	// 	// skirental.webdb.deleteRow('tovar_vypozicky', data[i].id_vypozicka);
			// 	// }
			// }
			var d = new Date();
			var n = d.getTime(); 
			saveJSONSync(data, 'app/backup/clean-db/' + n + '.json').then(
				function() {
					// _reload();
				});
		});
	});
}

function s2Content() {
	return $('#vypozicky_table').html();
}

function s2_renderSearch(key) {
	var tmp = custom_search(key);
	$('#vypozicky_table').html("");
	for (i = 0; i < tmp.length; i++) {
		$('#vypozicky_table').append($(tmp[i]));
	}
}

function custom_search(key) {
	var arr = [];
	var cols = ["id", "meno", "priezvisko", "adresa", "tel_cislo", "datum_od", "datum_do", "dni"];
	var rows = $('#vypozicky_table .template-1:not(.template)');
	var itemRows = $('#vypozicky_table .template-2:not(.template)');
	ll(rows.length,arguments.callee.toString());
	for (i = 0; i < rows.length; i++) {
		_custom_merge_texts(cols, $(rows[i]));
		var str = _custom_merge_texts(cols, $(rows[i]));
		if (str.contains(key.toLowerCase())) {
			ll(rows[i],arguments.callee.toString());
			arr.push($(rows[i]).add($(itemRows[i])));
		}
	}
	return arr;
}

function _custom_merge_texts(a, b) {
	var str = "";
	var tmp = "";
	for (j = 0; j < a.length; j++) {
		tmp = b.find('.' + a[j]).html();
		str = str + tmp + " ";
	}
	return str.toLowerCase();
}

// Found here:
// http://stackoverflow.com/questions/1789945/how-can-i-check-if-one-string-contains-another-substring
String.prototype.contains = function(it) { 
	return this.indexOf(it) != -1; 
};

var sortSwitch = true;
function s2_renderAfterSort(key, flag) {
	var tmp = custom_sort(key, flag, sortSwitch);
	sortSwitch = !sortSwitch;
	for (i = 0; i < tmp.length; i++) {
		$('#vypozicky_table').append($(tmp[i].value));
	}
}

// flag - data type of key
// may be: string, number, date
var CustomSortAsc = [1, -1];
var CustomSortDesc = [-1, 1];
var CustomSortType;

function custom_sort(key, flag, asc) {
	var a = $('#vypozicky_table .template-1');
	var b = $('#vypozicky_table .template-2');
	var tmp = [];
	for (i = 1; i < a.length; i++) {
		tmp.push({
			key: $(a[i]).find(('.' + key)).html(), 
			value: $(a[i]).add($(b[i]))
		});
	}
	var func;
	if (flag == "string") {
		func = _custom_compare_string;
	} else if (flag == "date") {
		func = _custom_compare_date;
	} else if (flag == "number") {
		func = _custom_compare_number;
	} else {
		ll('_custom_sort error.',arguments.callee.toString());
	}
	if (asc) {
		CustomSortType = CustomSortAsc;
	} else {
		CustomSortType = CustomSortDesc;
	}
	return tmp.sort(func);
}

function _custom_compare_string(a, b) {
	var strA = a.key.toLowerCase();
	var strB = b.key.toLowerCase();
	if (strA < strB)
		return CustomSortType[1];
	if (strA > strB)
		return CustomSortType[0];
	return 0;
}

// TODO: finish
function _custom_compare_date(a, b) {
	var dateA = new Date(_date(a.key));
	var dateB = new Date(_date(b.key));
	if (dateA < dateB)
		return CustomSortType[1];
	if (dateA > dateB)
		return CustomSortType[0];
	return 0;
}

function date_sorter(a, b) {
	var dateA = new Date(_date(a));
	var dateB = new Date(_date(b));
	if (dateA < dateB)
		return CustomSortAsc[1];
	if (dateA > dateB)
		return CustomSortAsc[0];
	return 0;
}

function _custom_compare_number(a, b) {
	var numA = parseFloat(a.key);
	var numB = parseFloat(b.key);
	if (numA < numB)
		return CustomSortType[1];
	if (numA > numB)
		return CustomSortType[0];
	return 0;
}

function arr_diff_int(a1, a2) {
    var a = [], diff = [];
    for (var i = 0; i < a1.length; i++) {
        a[a1[i]] = true;
    }
    for (var i = 0; i < a2.length; i++) {
        if (a[a2[i]]) {
            delete a[a2[i]];
        } else {
            a[a2[i]] = true;
        }
    }
    for (var k in a) {
        diff.push(parseInt(k));
    }
    return diff;
};

function saveDataToJSON_2(rs, filename) {
	return new Promise(function(resolve) {
		var x = [];
		for (var i = 0; i < rs.length; i++) {
			x.push(rs[i]);
		}
		saveJSONSync(x, filename).then(function() {
			resolve();
		});
	});
}

function isInArray(elem, arr) {
	for (i = 0; i < arr.length; i++) {
		if (arr[i] == elem)
			return true;
	}
	return false;
}

/* Adds search functionality to Tovar table, pagination, etc. */
function addFunc() {
	// search functionality
	var options = {
	  valueNames: [ 'id', 'znacka', 'typ', 'velkost', 'typ_tovaru']
	};
	var userList = new List('tovar', options);

	// TODO: dokoncit toto
	var options2 = {
	  valueNames: [ 'meno', 'priezvisko', 'typ', 'velkost', 'typ_tovaru']
	};
	var userList2 = new List('s2-vypozicky-div', options);

	// to turn pagination on, uncomment!
	/*
	var monkeyList = new List('tovar', {
		valueNames: [ 'id' ],
		page: 10,
		plugins: [ ListPagination({}) ]
	});
	*/
	// add onclick events for table items (tr) - TOVAR
	// $('#tovar_table').on('click', 'tr', function() {
	//     orderAddItem($(this));
	//     $(this).prop("disabled", true);
	//     $(this).addClass('success');
	//     $(this).children()[5].innerHTML = "-";
	// });

	// vyriesene vo frontend.js
	// add onclick events for table items (tr) - VYPOZICKY
	// $('#vypozicky_table').on('click', 'tr', function() {
	//     openModalOrders($(this));
	    // $(this).prop("disabled", true);
	    // $(this).addClass('success');
	    // $(this).children()[5].innerHTML = "-";
	// });
}

function regeneratePdfOrderNames() {
	skirental.webdb.getAllOrderDetails().then(function(response) {
		var data = editDataTovarDetail(response);
		var stuff = mergeObjectsByID(data);
		// ll(stuff,arguments.callee.toString());
		for (i in stuff) {
			genPDF(stuff[i], false);
			// break;
		}
	});
}

function regeneratePdfByOrder(vypozicka_id) {
	skirental.webdb.getAllOrderDetailsExtra(vypozicka_id).then(function(response) {
		// ll(response,arguments.callee.toString());
		var data = editDataTovarDetail(response);
		// ll(data,arguments.callee.toString());
		data = mergeObjectsByID(data);
		// ll(data,arguments.callee.toString());
		genPDF(data[vypozicka_id], true);
	});
}

function orderAddItem(item) {
	// frontend actions (TODO: possibly move to frontend.js)
	var template = $('#order-item-list li.template');
	var x = template.clone();
	x.removeClass('template');
	x.find(".vypozicka-id").html('<strong>' + '#' + item.children()[0].innerHTML + '</strong>');
	x.find(".vypozicka-znacka").html(item.children()[1].innerHTML + " ");
	x.find(".vypozicka-typ").html(item.children()[2].innerHTML);
	x.find(".vypozicka-velkost").html(item.children()[3].innerHTML);
	x.find(".vypozicka-typ_tovaru").html(item.children()[4].innerHTML + " ");
	$("#order-item-list").append(x);
	// backend actions
	Order.ids.push(item.children()[0].innerHTML);
	Order.nodes.push(item);
	// add listener to price input - in case of change, reflect to #price-total
	x.find('.price-partial').on('input', function() {
	    $('#price-total').val(sumPrices_S1());
	});
	// increase number on badge
	$('#badge-sc-1').text(parseInt($('#badge-sc-1').text()) + 1);
}

function openModalOrders(item) {

}

function orderRemoveItem(item) {
	// get parent li element (parent to the clicked button)
	var liElem = item.closest('li');
	// get id of this li element inside list
	var id = liElem.find('.vypozicka-id').text().substring(1);
	// l(id);
	// return index of element with correct id
	var tmpi = null;
	for (i = 0; i < Order.ids.length; i++) {
		if (Order.ids[i] == id)
			tmpi = i;
	}
	Order.ids.splice(tmpi, 1);
	// remove styling, remove element from list
	tableItemDeact(Order.nodes[tmpi]);
	Order.nodes.splice(tmpi, 1);
	liElem.remove();
	$('#price-total').val(sumPrices_S1());
	// decrease number on badge
	$('#badge-sc-1').text(parseInt($('#badge-sc-1').text()) - 1);
}

function servisAddItem() {
	var tmp = {};
	tmp.znacka = $('#servis-add-form .znacka').val();
	tmp.typ = $('#servis-add-form .typ').val();
	tmp.spodna_hrana = $('#servis-add-form .spodna-hrana').val();
	tmp.bocna_hrana = $('#servis-add-form .bocna-hrana').val();
	tmp.vykonana_praca = $('#servis-add-form .vykonana-praca').val();
	Servis.items.push(tmp);

	var item = $('#servis_table .template').clone().removeClass();
	item.find('.znacka').html(tmp.znacka);
	item.find('.typ').html(tmp.typ);
	item.find('.spodna-hrana').html(tmp.spodna_hrana);
	item.find('.bocna-hrana').html(tmp.bocna_hrana);
	item.find('.vykonana-praca').html(tmp.vykonana_praca);
	$('#servis_table').append(item);
}

function servisRemoveItem(item) {
	var elem = item.closest('tr');
	var index = $('#servis_table tr').index(elem);
	Servis.items.splice(index - 1, 1);
	ll(Servis,arguments.callee.toString());
	elem.remove();

	/*
	// get parent li element (parent to the clicked button)
	var liElem = item.closest('li');
	// get id of this li element inside list
	var id = liElem.find('.vypozicka-id').text().substring(1);
	// l(id);
	// return index of element with correct id
	var tmpi = null;
	for (i = 0; i < Order.ids.length; i++) {
		if (Order.ids[i] == id)
			tmpi = i;
	}
	Order.ids.splice(tmpi, 1);
	// remove styling, remove element from list
	tableItemDeact(Order.nodes[tmpi]);
	Order.nodes.splice(tmpi, 1);
	liElem.remove();
	$('#price-total').val(sumPrices_S1());
	// decrease number on badge
	$('#badge-sc-1').text(parseInt($('#badge-sc-1').text()) - 1);
	*/
}

function saveServis() {
	// validate input
	cond = (($('#servis-meno').val() != "") || ($('#servis-priezvisko').val() != "")) &&
		(($('#servis-datum').val() != "") && ($('#servis-datum-2').val() != "") && ($('#servis-cena').val() != "")) &&
		(Servis.items.length != 0);
	if (!cond) {
		bootbox.alert('Nesprávne vyplnený formulár servisu! Povinné položky sú: meno alebo priezvisko, ' + 
			'dátum prevzatia, dátum odovzdania, cena. Taktiež musí byť pridaná minimálne jedna položka na servis.')
		return;
	}
	// confirm dialog
	bootbox.confirm('Naozaj chcete uložiť uvedený servis?', function(result) {
		if (result) {
			// get person data
			var person = {};
			var data = $('#servis-osoba-form input, #servis-osoba-form textarea');
			person.meno = $(data[0]).val();
			person.priezvisko = $(data[1]).val();
			person.tel_cislo = $(data[2]).val();
			person.poznamka = $(data[3]).val();
			person.adresa = ""; // aj s adresou: $(data[4]).val();
			// create data
			skirental.webdb.lastID('servis').then(function(response) {
				var sid = response["MAX(id)"];
				if (sid == null)
					sid = 1;
				else 
					sid++;
				ll(sid,arguments.callee.toString());
				var arr = [];
				for (i = 0; i < Servis.items.length; i++) {
					var row = [
						person.meno,
						person.priezvisko,
						person.tel_cislo,
						"",
						person.adresa,
						// cena
						parseFloat($('#servis-cena').val()),
						// datum
						$('#servis-datum').val(),
						$('#servis-datum-2').val(),
						Servis.items[i].znacka,
						Servis.items[i].typ,
						Servis.items[i].spodna_hrana,
						Servis.items[i].bocna_hrana,
						Servis.items[i].vykonana_praca,
						sid,
						person.poznamka
					];
					arr.push(row);
				}
				// save to db
				skirental.webdb.insertMultipleRows('servis', arr).then(function() {
					skirental.webdb.getAll('servis', saveDataToJSON, 'data/servis/servis.json',arguments.callee.toString()).then(function() {
						// generate template
						var data = {
							meno: person.meno,
							priezvisko: person.priezvisko,
							tel_cislo: person.tel_cislo,
							doklad: person.doklad,
							adresa: person.adresa,
							datum_prijatia: $('#servis-datum').val(),
							datum_odovzdania: $('#servis-datum-2').val(),
							cena: parseFloat($('#servis-cena').val()),
							id: sid,
							poznamka: person.poznamka,
							items: Servis.items
						}
						genServisPDF(data);
						// print
						// clear servis page or reload page + reload servis table
					});
				});
			});
		}
	});
}

function renderItem(row) {
	var str = '';
	for (i in row)
		str += row[i] + ' | ';
	return '<li>' + str + '</li>';
}

function renderItemTable(row) {
	// map object to array
	var x = Object.keys(row).map(function(key) { return row[key] });
	var cname = Object.keys(row).map(function(key) { return key });
	// save as table item
	var str = '<th scope="row" class="id">' + x[0] + '</th>';
	for (i = 1; i < x.length; i++)
		str += '<td class="' + cname[i] + '">' + x[i] + '</td>';
	return '<tr>' + str + '</tr>';
}

function importFilesFromRamar() {
	
}

function importCSV(path) {
	var tname = '';
	if (currentPage == "#page10") {
		ll('import',arguments.callee.toString());
		// is csv?
		suff = path.split('.');
		suff = suff[suff.length - 1];
		l(suff);
		if (suff == "csv" || suff == "CSV") {
			if ($('#optionsRadios1').is(':checked')) {
				tname = 'tovar';
			} else if ($('#optionsRadios2').is(':checked')) {
				tname = 'osoby';
			} else if ($('#optionsRadios3').is(':checked')) {
				tname = 'vypozicky';
			} else if ($('#optionsRadios4').is(':checked')) {
				tname = 'tovar_vypozicky';
			}
			parseCSV(path).then(function(response) {
				ll(response,arguments.callee.toString());
				// insert data do DB
				skirental.webdb.insertMultipleRows(tname, response).then(function(response) {
					skirental.webdb.getAll(tname, saveDataToJSON, 'data/'+tname+'.json',arguments.callee.toString());
					bootbox.dialog({
						message: "Import <strong>úspešne</strong> prebehol.",
						title: "Import dát",
						buttons: {
							success: {
							  label: "OK",
							  className: "btn-success",
							  callback: function() {
							    _reload();
							  }
							}
						}
					});
				});
			});
		}
	}
}

// Execute SQL queries passed as argument
function execSQL(str, callback) {
	var db = skirental.webdb.db;
	db.transaction(function(tx) {
		tx.executeSql(str, [], 
			function(tx, rs) {
				callback(tx, rs);
			},
			skirental.webdb.onError);
	});
}

// Execute SQL query and sync using promise
function execSQLSync(str) {
	return new Promise(function(resolve) {
		skirental.webdb.db.transaction(function(tx) {
		tx.executeSql(str, [], 
			function(tx, rs) {
				resolve(rs.rows);
			},
			skirental.webdb.onError);
		});
	});
}

// function execMultipleSQLQueriesSync(querries) {
// 	if (!querries) return;
// 	var db = skirental.webdb.db;
// 	return new Promise(function(resolve) {
// 		db.transaction(function(tx) {
// 			for (i = 0; i < querries.length; i++) {
// 				tx.executeSql(querries[i], [], 
// 					function(tx, rs) {
// 						callback(tx, rs);
// 					},
// 					skirental.webdb.onError);
// 			}
// 		});
// }

function htmlToPDF(html_path, pdf_path, callback) {
	return new Promise(function(response) {
		var fs = require('fs');
		var pdf = require('html-pdf');
		var html = fs.readFileSync(html_path, 'utf8');
		var options = { 
			format: 'A5', 
			orientation: "landscape"
		};
		 
		pdf.create(html, options).toFile(pdf_path, function(err, res) {
		  if (err) 
		  	return l(err);
		  l(res); // { filename: '/app/businesscard.pdf' }
		  status('success', '<strong>Tlačová zostava bola úspešne vygenerovaná. </strong>'+
		      'Súbor je uložený v: <strong>'+ pdf_path);
		  response();
		});
	});
}

function status(type, message) {
	$('#statusBar').fadeOut('fast', function() {
		$('#statusBar').removeClass('alert-success alert-warning alert-info alert-danger');
		$('#statusBar').html(message);
		$('#statusBar').addClass('alert-'+type);
		$('#statusBar').fadeIn('fast');
	});
}


// var Tovar;
// Parse CSV file with "Tovar" table and insert into database
// File "Tovar.csv" should be located at Desktop
function parseCSV(path) {
	return new Promise(function(resolve) {
		fs = require('fs')
		fs.readFile(path, 'utf8', function (err, data) {
		  if (err) {
		    l(err);
		    return;
		  }
		  var x = CSVToArray(data);
		  // callback(x);
		  resolve(x);
		});
	});
}

function writeFile(path, content, callback) {
	var fs = require('fs');
	fs.writeFile(path, content, function(err) {
	    if(err) {
	        return ll(err,arguments.callee.toString());
	    }
	    l('written to file...');
	    callback();
	});
}

function eraseFile(path) {
	bootbox.confirm("Naozaj chcete vymazať všetky údaje o predaji?", 
		function(response) {
			if (response) {
				writeFile(path, "", _reload);
			}
		});
}

function _reload() {
	writeFile('./app/settings/last_page.txt', currentPage, __nehe);
}

function __nehe() {
	window.location.reload();
}

function win_run(target) {
	var cp = require("child_process");
	cp.exec(target, function(error, stdout, stderr) {
		l(error);
		l(stdout);
		l(stderr);
	}); // notice this without a callback..
	// process.exit(0); // exit this nodejs process
}

// ref: http://stackoverflow.com/a/1293163/2343
// This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.
function CSVToArray( strData, strDelimiter ){
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");

    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
        );


    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;


    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec( strData )){

        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[ 1 ];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
            ){

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push( [] );

        }

        var strMatchedValue;

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[ 2 ]){

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[ 2 ].replace(
                new RegExp( "\"\"", "g" ),
                "\""
                );

        } else {

            // We found a non-quoted value.
            strMatchedValue = arrMatches[ 3 ];

        }


        // Now that we have our value string, let's add
        // it to the data array.
        arrData[ arrData.length - 1 ].push( strMatchedValue );
    }

    // Return the parsed data.
    return( arrData );
}

function _dropServis() {
	bootbox.confirm('Naozaj chcete vymazať tabuľku Servis? Všetky údaje budú zmazané.', function(response) {
		if (response) {
			execSQLSync('DROP TABLE servis');
		}
	});
}

function saveJSON(arr, filename) {
	fs = require('fs');
	var data = JSON.stringify(arr);
	fs.writeFile(filename, data, function (err) {
		if (err) 
			throw err;
		l('File saved!');
	});
}

function saveJSONSync(arr, filename) {
	return new Promise(function(resolve) {
		fs = require('fs');
		var data = JSON.stringify(arr);
		fs.writeFile(filename, data, function (err) {
			if (err) 
				throw err;
			else {
				resolve();
				l('File saved!');
			}
		});
	});
}

function getDuplicates(arr) {
	var sorted_arr = arr.sort();
	var results = [];
	for (var i = 0; i < arr.length - 1; i++) {
		if (sorted_arr[i + 1] == sorted_arr[i]) {
		    results.push(sorted_arr[i]);
		}
	}
	return results;
}

// Log output, can be turned off
function l(arg) {
	if (!window.NO_LOG)
		console.log(arg);
}

// Force output, unable to turn it off - unlike function l(arg)
function ll(arg) {
	console.log(arg);
	console.log(arg);
}


function ll(arg, fname) {
	console.log(arg);
	// console.log("Called by function: " + fname);
}

function goHome() {
	switch(currentPage) {
		case "#page3":
			l(db_is_change());
			var a = db_is_change();
			var b = window.shared.flagChanged;
			l(a);
			l(b);
			l(a && b);
			if (a && !b) {
				$('#modal-confirm-changes').modal('show');
				// bootbox.confirm(
				// 	"Vykonali ste zmeny v databáze. Prajete si tieto zmeny "+
				// 	"<strong>natrvalo uložiť</strong> ?", 
				// 	function(result) {
				// 		if (result) {
				// 			saveChangesToDB();
				// 			_goBack();
				// 		}
				// }); 
			} else {
				renderPage('#home');
			}
			break;
		case "#page2":
			if (isS2Deleted) {
				l('page2 back, reloading');
				_reload();
			}
		default:
			renderPage('#home');
			break;
	}
}

function goBack() {
	switch(currentPage) {
		case "#page3":
			l(db_is_change());
			var a = db_is_change();
			var b = window.shared.flagChanged;
			l(a);
			l(b);
			l(a && b);
			if (a && !b) {
				$('#modal-confirm-changes').modal('show');
				// bootbox.confirm(
				// 	"Vykonali ste zmeny v databáze. Prajete si tieto zmeny "+
				// 	"<strong>natrvalo uložiť</strong> ?", 
				// 	function(result) {
				// 		if (result) {
				// 			saveChangesToDB();
				// 			_goBack();
				// 		}
				// }); 
			} else {
				_goBack();
			}
			break;
		case "#page2":
			if (isS2Deleted) {
				l('page2 back, reloading');
				_reload();
			}
		default:
			_goBack();
			break;
	}
}

function _goBack() {
	if (hist.length > 1)
		renderPage(hist[hist.length - 2]);
}

function refreshPage() {
	switch(currentPage) {
		case "#page3":
			var a = db_is_change();
			var b = window.shared.flagChanged;
			if (a && !b) {
				$('#modal-confirm-changes').modal('show');
				// bootbox.confirm(
				// 	"Vykonali ste zmeny v databáze. Prajete si tieto zmeny "+
				// 	"<strong>natrvalo uložiť</strong> ?", 
				// 	function(result) {
				// 		if (result) {
				// 			saveChangesToDB();
				// 			_goBack();
				// 		}
				// }); 
			} else {
				_reload();
			}
			break;
		default:
			_reload();
			break;
	}
}
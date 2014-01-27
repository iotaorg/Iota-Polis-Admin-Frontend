if (!String.prototype.render) {
	String.prototype.render = function(args) {
		var copy = this + '';
		for (var i in args) {
			copy = copy.replace(RegExp('\\$\\$' + i, 'g'), args[i]);
		}
		return copy;
	};
}

if ('a,,b'.split(',').length < 3) {
    var nativeSplit = nativeSplit || String.prototype.split;
    String.prototype.split = function (s /* separator */, limit) {
        // If separator is not a regex, use the native split method
        if (!(s instanceof RegExp)) {
                return nativeSplit.apply(this, arguments);
        }

        /* Behavior for limit: If it's...
         - Undefined: No limit
         - NaN or zero: Return an empty array
         - A positive number: Use limit after dropping any decimal
         - A negative number: No limit
         - Other: Type-convert, then use the above rules */
        if (limit === undefined || +limit < 0) {
            limit = false;
        } else {
            limit = Math.floor(+limit);
            if (!limit) {
                return [];
            }
        }

        var flags = (s.global ? "g" : "") + (s.ignoreCase ? "i" : "") + (s.multiline ? "m" : ""),
            s2 = new RegExp("^" + s.source + "$", flags),
            output = [],
            lastLastIndex = 0,
            i = 0,
            match;

        if (!s.global) {
            s = new RegExp(s.source, "g" + flags);
        }

        while ((!limit || i++ <= limit) && (match = s.exec(this))) {
            var zeroLengthMatch = !match[0].length;

            // Fix IE's infinite-loop-resistant but incorrect lastIndex
            if (zeroLengthMatch && s.lastIndex > match.index) {
                s.lastIndex = match.index; // The same as s.lastIndex--
            }

            if (s.lastIndex > lastLastIndex) {
                // Fix browsers whose exec methods don't consistently return undefined for non-participating capturing groups
                if (match.length > 1) {
                    match[0].replace(s2, function () {
                        for (var j = 1; j < arguments.length - 2; j++) {
                            if (arguments[j] === undefined) { match[j] = undefined; }
                        }
                    });
                }

                output = output.concat(this.slice(lastLastIndex, match.index), (match.index === this.length ? [] : match.slice(1)));
                lastLastIndex = s.lastIndex;
            }

            if (zeroLengthMatch) {
                s.lastIndex++;
            }
        }

        return (lastLastIndex === this.length) ?
            (s.test("") ? output : output.concat("")) :
            (limit      ? output : output.concat(this.slice(lastLastIndex)));
    };
}


var removeAccents = (function() {
  var translate_re = /[öäüÖÄÜáàâãéèêúùûóòôõÁÀÂÉÈÊÚÙÛÓÒÔçÇ]/g;
  var translate = {
	  "ä": "a", "ö": "o", "ü": "u",
	  "Ä": "A", "Ö": "O", "Ü": "U",
	  "á": "a", "à": "a", "â": "a",
	  "é": "e", "è": "e", "ê": "e",
	  "ú": "u", "ù": "u", "û": "u",
	  "ó": "o", "ò": "o", "ô": "o",
	  "Á": "A", "À": "A", "Â": "A",
	  "É": "E", "È": "E", "Ê": "E",
	  "Ú": "U", "Ù": "U", "Û": "U",
	  "Ó": "O", "Ò": "O", "Ô": "O",
	  "ã": "a", "Ã": "A", "ç": "c",
	  "Ç": "C"
   // probably more to come
  };
  return function(s) {
	return ( s.replace(translate_re, function(match) {
	  return translate[match];
	}) );
  }
})();


$(document).ready(function(){
	$.ajaxSetup({ cache: false });
	var estados_sg = [];
	estados_sg["Acre"] = "AC";
	estados_sg["Alagoas"] = "AL";
	estados_sg["Amapá"] = "AP";
	estados_sg["Amazonas"] = "AM";
	estados_sg["Bahia"] = "BA";
	estados_sg["Ceará"] = "CE";
	estados_sg["Distrito Federal"] = "DF";
	estados_sg["Espírito Santo"] = "ES";
	estados_sg["Goiás"] = "GO";
	estados_sg["Maranhão"] = "MA";
	estados_sg["Mato Grosso"] = "MT";
	estados_sg["Mato Grosso do Sul"] = "MS";
	estados_sg["Minas Gerais"] = "MG";
	estados_sg["Pará"] = "PA";
	estados_sg["Paraíba"] = "PB";
	estados_sg["Paraná"] = "PR";
	estados_sg["Pernambuco"] = "PE";
	estados_sg["Piauí"] = "PI";
	estados_sg["Rio de Janeiro"] = "RJ";
	estados_sg["Rio Grande do Norte"] = "RN";
	estados_sg["Rio Grande do Sul"] = "RS";
	estados_sg["Rondônia"] = "RO";
	estados_sg["Roraima"] = "RR";
	estados_sg["Santa Catarina"] = "SC";
	estados_sg["São Paulo"] = "SP";
	estados_sg["Sergipe"] = "SE";
	estados_sg["Tocantins"] = "TO";
	estados_sg[""] = "";
	var combo_uf = [];
	var combo_cidades = [];
	var combo_partidos = [];
	var lista_aberta = "";
	var oDataTable;
	var iDisplayLength = 100;
	var arr_posicoes = [];

	var url = [];
	var count_rows = 0;
	var total_rows = 0;
	var geocoder = new google.maps.Geocoder();
	var markers = [];
	var zoom_padrao = 9;
	var graficos = [];

	function loadMap(){

		var mapOptions = {
				center: mapDefaultLocation,
				zoom: 4,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};

		var map = new google.maps.Map(document.getElementById("mapa"),mapOptions);
	}

	function findInArray(obj,value){
		if (value == "") return true;
		var retorno = false;
		for (a = 0; a < obj.length; a++){
			if (obj[a] == value) retorno = true;
		}
		return retorno;
	}

	function fillCombo(combo,source){
		var first = $(combo).find("option:first");
		$(combo).empty();
		$(combo).append(first);

		$.each(source.sort(),function(index,value){
			$(combo).append("<option value='" + value + "'>"+value+"</option>");
		});
	}
	function clearCombo(combo){
		var first = $(combo).find("option:first");
		$(combo).empty();
		$(combo).append(first);
	}

	function carregaIndicadores(){
		$.getJSON("json/indicadores.json",
		{
			format: "json"
		},
		function(data) {
			$(".indicators").empty();
			$.each(data.dados, function(i,item){
				$(".indicators").append("<div class='item' indicator-id='$$id'>$$name</div>".render({id: item.id, name: item.name}));
			});
			$(".indicators .item:first").addClass("selected");
			$(".data-right .data-title .title").html($(".indicators .item:first").html());

			$(".indicators .item").click( function (){
				$(".indicators .item").removeClass("selected");
				$(this).addClass("selected");
				$(".data-right .data-title .title").html($(".indicators .selected").html());
				if ($(".data-content .tabs .selected").attr("ref") == "tabela"){
					carregaTabela();
					$(".data-content .table").show();
				}else if ($(".data-content .tabs .selected").attr("ref") == "graficos"){
					carregaGraficos();
				}else{
				}
			});
			carregaTabela();
		});
  	}
	function carregaTabela(){
		var indicador = $(".indicators div.selected").attr("indicator-id");
		$.getJSON("json/indicador." + indicador + ".json",
		{
			format: "json"
		},
		function(data) {
			var table_content = ""
			$(".data-content .table .content-fill").empty();
			table_content += "<table>";
			table_content += "<thead><tr><th>Cidade</th><th>2009</th><th>2010</th><th>2011</th><th>2012</th><th></th></tr></thead>";
			table_content += "<tbody>";

			$.each(data.dados, function(i,item){
				table_content += "<tr><td class='cidade'>$$cidade</td>".render({cidade: item.cidade});
				for (j = 0; j < item.valores.length; j++){
					table_content += "<td class='valor'>$$valor</td>".render({valor: item.valores[j]});
				}
				table_content += "<td class='grafico'><canvas id='graph-$$id' width='40' height='20'></canvas></td>".render({id: i});
				graficos[i] = item.valores;
			});

			table_content += "</tbody></table>";

			$(".data-content .table .content-fill").append(table_content);

			geraGraficos();

		});
  	}

	function carregaGraficos(){
		var indicador = $(".indicators div.selected").attr("indicator-id");
		$.getJSON("json/indicador." + indicador + ".json",
		{
			format: "json"
		},
		function(data) {

			var colors = ['#124646','#238080','#3cd3d3','#00a5d4','#015b75','#013342'];

			RGraph.Clear(document.getElementById("main-graph"));

			var legendas = [];

			$.each(data.dados, function(i,item){
				console.log(item.valores);
				var line = new RGraph.Line('main-graph', item.valores);
				if (i == 0){
					line.Set('chart.labels', ['2009','2010','2011','2012']);
					line.Set('chart.background.grid.vlines', false)
				}else{
		 			line.Set('chart.ylabels', false);
		 			line.Set('chart.noaxes', true);
		 			line.Set('chart.background.grid', false);
				}
				line.Set('chart.colors', [colors[i]]);
				line.Set('chart.tickmarks', 'circle');
				line.Draw();
				legendas.push({name: item.cidade, color: colors[i]});
			});

			montaLegenda(legendas);

		});
	}

	function montaLegenda(legendas){
		$(".graph .legend").empty();

		var legenda = "";
		for (i = 0; i < legendas.length; i++){
			legenda += "<div class='item'><div class='quad' style='background-color: $$color'></div><div class='label' style='color: $$color'>$$label</div></div>".render({label:legendas[i].name, color: legendas[i].color});
		}
		$(".graph .legend").append(legenda);

	}

	function geraGraficos(){
		for (i = 0; i < graficos.length; i++){
			var line = new RGraph.Line('graph-'+i, graficos[i]);
 			line.Set('chart.ylabels', false);
 			line.Set('chart.noaxes', true);
 			line.Set('chart.background.grid', false);
 			line.Set('chart.hmargin', 0);
 			line.Set('chart.gutter.left', 0);
 			line.Set('chart.gutter.right', 0);
 			line.Set('chart.gutter.top', 0);
 			line.Set('chart.gutter.bottom', 0);
 			line.Set('chart.colors', ['#b4b4b4']);
            line.Draw();
		}
	}

	$(".data-content .tabs .item").click( function (){
		$(".data-content .tabs .item").removeClass("selected");
		$(this).addClass("selected");
		if ($(this).attr("ref") == "tabela"){
			$(".data-content .graph").hide();
			$(".data-content .map").hide();
			carregaTabela();
			$(".data-content .table").show();
		}else if ($(this).attr("ref") == "graficos"){
			$(".data-content .table").hide();
			$(".data-content .map").hide();
			carregaGraficos();
			$(".data-content .graph").show();
		}else{
			$(".data-content .table").hide();
			$(".data-content .graph").hide();
			$(".data-content .map").show();
		}
	});

	carregaIndicadores();

});

var api_path = "";

var indicadores_list;
var eixos_list = {"dados": []};
var users_list;
var indicadorID;
var indicadorDATA;
var dadosGrafico = {"dados": []};

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

	function carregaIndicadoresCidades(){

		$.ajax({
			type: 'GET',
			dataType: 'json',
			url: api_path + '/api/public/user/movimento/',
			success: function(data, textStatus, jqXHR){
				users_list = data.users;
				indicadores_list = data.indicators;

				$(indicadores_list).each(function(index,value){
					if (!findInJson(eixos_list.dados,"id",value.axis.id).found){
						eixos_list["dados"].push({id: value.axis.id, name: value.axis.name});
					}
				});

				carregaIndicadores();
			},
			error: function(data){
				console.log("erro ao carregar informações dos indicadores");
			}
		});
	}

	function carregaIndicadores(){

		$("#axis_list").empty();

		$(eixos_list.dados).each(function(index,value){
			if (index == 0){
				$("#axis_list").append("<div class='select' axis-id='0'><div class='content-fill'>Categoria</div></div>");
				$("#axis_list").append("<div class='options'></div>");
			}
			$("#axis_list .options").append("<div class='option' axis-id='$$id'>$$nome</div>".render({
							id: value.id,
							nome: value.name
				}));
		});

		$("#axis_list .select").click(function(){
			$("#axis_list .options").toggle();
		});
		$("#axis_list .option").click(function(){
			$("#axis_list .select").attr("axix-id",$(this).attr("axis-id"));
			$("#axis_list .select .content-fill").html($(this).html());
			$("#axis_list .options").hide();
			$(".menu-left div.indicators .item").hide();
			$(".menu-left div.indicators .item[axis-id='$$axis_id']".render({axis_id: $(this).attr("axis-id")})).show();
		});
		$("#axis_list .options").hover(function(){
			if (t_categorias){
				clearTimeout(t_categorias);
			}
		},function(){
			t_categorias = setTimeout(function(){
				$("#axis_list .options").hide();
			},2000)	;
		});

		$(".indicators").empty();
		$.each(indicadores_list, function(i,item){
			$(".indicators").append("<div class='item' indicator-id='$$id' axis-id='$$axis_id' name-uri='$$uri'>$$name</div>".render({
						id: item.id,
						name: item.name,
						axis_id: item.axis.id,
						uri: item.name_url
					}));
		});
		$(".indicators .item:first").addClass("selected");
		indicadorID = $(".indicators .item:first").attr("indicator-id");
		indicadorDATA = indicadores_list[0];
		$(".data-right .data-title .title").html($(".indicators .item:first").html());
		$(".data-right .data-title .description").html(indicadorDATA.explanation);

		$(".indicators .item").click( function (){
			indicadorID = $(this).attr("indicator-id");

			$(indicadores_list).each(function(index,item){
				if (item.id == indicadorID){
					indicadorDATA = item;
				}
			});

			dadosGrafico = {"dados": []};
			$(".indicators .item").removeClass("selected");
			$(this).addClass("selected");
			$(".data-right .data-title .title").html($(".indicators .selected").html());
			$(".data-right .data-title .description").html(indicadorDATA.explanation);
			if ($(".data-content .tabs .selected").attr("ref") == "tabela"){
				carregaTabela();
				$(".data-content .table").show();
			}else if ($(".data-content .tabs .selected").attr("ref") == "graficos"){
				carregaTabela();
			}else{
			}
		});
		carregaTabela();
  	}

	function carregaTabela(){

		var indicador = indicadorID;
		var indicador_uri = $(".indicators div.selected").attr("name-uri");

		dadosGrafico = {"dados": []};

		var table_content = ""
		$(".data-content .table .content-fill").empty();
		table_content += "<table>";
		table_content += "<thead><tr><th>Cidade</th><th>2009</th><th>2010</th><th>2011</th><th>2012</th><th></th></tr></thead>";
		table_content += "<tbody>";
		table_content += "</tbody></table>";
		$(".data-content .table .content-fill").append(table_content);

		var total_users = users_list.length;
		var users_ready = 0;

		$(users_list).each(function(index,item){

			$.ajax({
				type: 'GET',
				dataType: 'json',
				url: api_path + '/api/public/user/$$userid/indicator/$$indicatorid/chart/period_axis'.render({
							userid: item.id,
							indicatorid: indicador
					}),
				success: function(data, textStatus, jqXHR){
					var valores = [];

					row_content = "<tr><td class='cidade'><a href='$$pais_uri/$$city_uri/$$indicador_uri'>$$cidade</a></td>".render({
								cidade: item.city.name,
								pais_uri: item.city.pais,
								city_uri: item.city.name_uri,
								indicador_uri: indicador_uri
							});

					if (data.series.length < 4){
						for (j = 0; j < (4 - data.series.length); j++){
							row_content += "<td class='valor'>-</td>";
							valores.push(0);
						}
					}

					if (data.series.length > 4){
						var j_ini = data.series.length - 4;
					}else{
						var j_ini = 0;
					}

					for (j = j_ini; j < data.series.length; j++){
						row_content += "<td class='valor'>$$valor</td>".render({valor: $.formatNumber(data.series[j].avg, {format:"#,##0.###", locale:"br"})});
						valores.push(data.series[j].avg);
					}
					row_content += "<td class='grafico'><canvas id='graph-$$id' width='40' height='20'></canvas></td>".render({id: index});
					graficos[index] = valores;
					dadosGrafico.dados.push({id: item.city.id, nome: item.city.name, valores: valores});
					$(".data-content .table .content-fill tbody").append(row_content);

					users_ready++;

					if (users_ready >= total_users){
						geraGraficos();
						carregaGraficoAba();
					}

				},
				error: function(data){
					console.log("erro ao carregar informações do indicador");
				}
			});

		});
  	}

	function carregaGraficoAba(){
		var indicador = indicadorID;

		var colors = ['#124646','#238080','#3cd3d3','#00a5d4','#015b75','#013342'];
		var color_meta = '#ff0000';

		RGraph.Clear(document.getElementById("main-graph"));

		var legendas = [];

		var linhas = [];
		if (indicadorDATA.goal){
			linhas.push([ indicadorDATA.goal, indicadorDATA.goal, indicadorDATA.goal, indicadorDATA.goal ]);
			legendas.push({name: "Meta", color: color_meta});
			var colors = ['#ff0000','#124646','#238080','#3cd3d3','#00a5d4','#015b75','#013342'];
		}

		$.each(dadosGrafico.dados, function(i,item){
			linhas.push(item.valores);
			if (indicadorDATA.goal){
				legendas.push({name: item.nome, color: colors[i+1]});
			}else{
				legendas.push({name: item.nome, color: colors[i]});
			}
		});

		var line = new RGraph.Line('main-graph', linhas);
		line.Set('chart.labels', ['2009','2010','2011','2012']);
//		line.Set('chart.background.grid.vlines', false)
		line.Set('chart.text.font', 'tahoma');
		line.Set('chart.text.color', '#bbbbbb');
		line.Set('chart.axis.color', '#bbbbbb');
		line.Set('chart.colors', colors);
		line.Set('chart.tickmarks', 'circle');
		line.Draw();

		montaLegenda(legendas);
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
			carregaGraficoAba();
			$(".data-content .graph").show();
		}else{
			$(".data-content .table").hide();
			$(".data-content .graph").hide();
			$(".data-content .map").show();
		}
	});

	carregaIndicadoresCidades();

});

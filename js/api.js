var api_path = "";
//var api_path = "http://www.redesocialdecidades.org.br";

if (!String.prototype.render) {
	String.prototype.render = function(args) {
		var copy = this + '';
		for (var i in args) {
			copy = copy.replace(RegExp('\\$\\$' + i, 'g'), args[i]);
		}
		return copy;
	};
}

if (!String.prototype.trim) {
	String.prototype.trim=function(){
		return this.replace(/^\s+|\s+$/g, '');
	};
}

var accentMap = {
	"á": "a",
	"ã": "a",
	"à": "a",
	"é": "e",
	"ê": "e",
	"í": "i",
	"ó": "o",
	"õ": "o",
	"ú": "u",
	"ç": "c"
};

var normalize = function( term ) {
	var ret = "";
	for ( var i = 0; i < term.length; i++ ) {
		ret += accentMap[ term.charAt(i) ] || term.charAt(i);
	}
	return ret.toLowerCase();
};

$.extend({
	getUrlVars: function(){
		var vars = [], hash;
		var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
		for(var i = 0; i < hashes.length; i++){
			hash = hashes[i].split('=');
			vars.push(hash[0]);
			vars[hash[0]] = hash[1];
		}
		return vars;
	},
	getUrlVar: function(name){
		return $.getUrlVars()[name];
	},
	convertDate: function(date,splitter){
		var date_tmp = date.split(splitter);
		var date = date_tmp[0];
		var time = date_tmp[1];

		var date_split = date.split("-");

		return date_split[2] + "/" + date_split[1] + "/" + date_split[0];
	},
	convertDateTime: function(date,splitter){
		var date_tmp = date.split(splitter);
		var date = date_tmp[0];
		var time = date_tmp[1];

		var date_split = date.split("-");

		return date_split[2] + "/" + date_split[1] + "/" + date_split[0] + " " + time;
	},
	convertDatetoBd: function(date,splitter){
		var date_tmp = date.split(splitter);
		var date = date_tmp[0];
		var time = date_tmp[1];

		var date_split = date.split("/");

		return date_split[2] + "/" + date_split[1] + "/" + date_split[0];
	},
	convertDateToPeriod: function(date,period){
		if (period == "yearly"){
			return date.split("-")[0];
		}else if (period == "monthly"){
			return date.split("-")[1] + "/" + date.split("-")[0];
		}
	},
	convertNumberToBd: function(number){
		var new_number = number.replace(".","").replace(",",".");

		return new_number;
	},
	convertNumberFromBd: function(number){
		if (number == null){
			var new_number = "";
		}else if (number == undefined){
			var new_number = "";
		}else if (number == 0){
			var new_number = 0;
		}else{
			var new_number = number.replace(",","").replace(".",",");
		}
		return new_number;
	},
	isInt: function(number){
		return number % 1 === 0;
	},
	trataErro: function(erro){
		switch(erro){
			case "Login invalid(1)":
					return "Login Inválido";
					break;
			case "Login invalid(2)":
					return "Login Inválido";
					break;
			default:
					return erro;
					break;
		}
	}
});

$.xhrPool = [];
$.xhrPool.abortAll = function() {
    $(this).each(function(idx, jqXHR) {
        jqXHR.abort();
    });
    $.xhrPool.length = 0
};

$.ajaxSetup({
    beforeSend: function(jqXHR) {
        $.xhrPool.push(jqXHR);
    },
    complete: function(jqXHR) {
        var index = $.xhrPool.indexOf(jqXHR);
        if (index > -1) {
            $.xhrPool.splice(index, 1);
        }
    }
});

$(document).ready(function() {

	var user_info;
	//lista roles
	var roles = {"admin":"Administrador Geral",
				 "user":"Prefeitura/Movimento da Rede",
				 "app":"Aplicativos"
				}
	var indicator_roles = {"_prefeitura,_movimento":"Prefeituras e Movimentos",
						  "_prefeitura":"Somente Prefeituras",
						  "_movimento":"Somente Movimentos"
						  };
	var indicator_types = {"normal":"normal",
						  "varied":"variada",
						  "varied_dyn":"variada dinâmica"
						  };
	//lista tipos variaveis
	var variable_types = {"int":"Inteiro",
						  "str":"Alfanumérico",
						  "num":"Valor"};
	var variable_periods = {"monthly":"Mensal",
						  "yearly":"Anual",
						  "trimestral":"Trimestral",
						  "semiannual":"Semestral"
						  };
	var goal_operators = {"":"",
						  ">":"maior que",
						  ">=":"maior ou igual a",
						  "=":"igual a",
						  "menor ou igual a":"<=",
						  "menor que":"<"
						  };
	var sort_directions = {"greater value":"MAIOR valor, melhor classificação",
						  "lowest value":"MENOR valor, melhor classificação"
						  };

	var measurement_units = [];
	var sources = [];

	variacoes_list = [];
	variacoes_id_temp = 0;
	vvariacoes_list = [];
	vvariacoes_id_temp = 0;


	var estados = {"AC":"Acre",
				  "AL":"Alagoas",
				  "AM":"Amazonas",
				  "AP":"Amapá",
				  "BA":"Bahia",
				  "CE":"Ceará",
				  "DF":"Distrito Federal",
				  "ES":"Espírito Santo",
				  "GO":"Goiás",
				  "MA":"Maranhão",
				  "MG":"Minas Gerais",
				  "MS":"Mato Grosso do Sul",
				  "MT":"Mato Grosso",
				  "PA":"Pará",
				  "PB":"Paraíba",
				  "PE":"Pernambuco",
				  "PI":"Piauí",
				  "PR":"Paraná",
				  "RJ":"Rio de Janeiro",
				  "RN":"Rio Grande do Norte",
				  "RS":"Rio Grande do Sul",
				  "RO":"Rondônia",
				  "RR":"Roraima",
				  "SC":"Santa Catarina",
				  "SE":"Sergipe",
				  "SP":"São Paulo",
				  "RJ":"Rio de Janeiro",
				  "RS":"Rio Grande do Sul",
				  "TO":"Tocantins"
						  };
	var cidades_prefeitos = [];

	var click_editor = false;

	var qtip_input = {
		 position: {
					  corner: {
						 tooltip: 'leftMiddle', // Use the corner...
						 target: 'rightMiddle' // ...and opposite corner
					  }
				   },
		style: {
		  border: {
			 width: 2,
			 radius: 4
		  },
		  padding: 5,
		  textAlign: 'left',
		  tip: true, // Give it a speech bubble tip with automatic corner detection
		  name: 'cream' // Style it according to the preset 'cream' style
	   },
	   show: {
		  when: 'focus'
	   },
	   hide: {
		  when: {
				event: 'unfocus'
		  }
	   }
	};
	var qtip_editor = {
		 position: {
					  corner: {
						 tooltip: 'leftTop', // Use the corner...
						 target: 'rightTop' // ...and opposite corner
					  }
				   },
		style: {
		  border: {
			 width: 2,
			 radius: 4
		  },
		  padding: 5,
		  textAlign: 'left',
		  tip: true, // Give it a speech bubble tip with automatic corner detection
		  name: 'cream' // Style it according to the preset 'cream' style
	   },
	   hide: {
		  when: {
				event: 'unfocus'
		  }
	   }
	};


	var findInArray = function(obj,value){
		if (value == "") return true;
		var retorno = false;
		for (a = 0; a < obj.length; a++){
			if (obj[a] == value) retorno = true;
		}
		return retorno;
	}

	var resetCookies = function(){
		$.cookie("user.id",null,{path: "/", expires: -5});
		$.cookie("key",null,{path: "/", expires: -5});
		$.cookie("user.id",null,{expires: -5});
		$.cookie("key",null,{expires: -5});
	}

	$.fn.setWarning = function(){
		var args = arguments[0];
		$(this).hide();
		$(this).empty();
		$(this).html("<div>"+args.msg+"</div>");
		$(this).show("slow");
	};
	$.fn.clearWarning = function(){
		$(this).hide();
		$(this).html("");
	};

	var findCidadePrefeito = function(city_id){
		var retorno = "";
		for (i = 0; i < cidades_prefeitos.length; i++){
			if (cidades_prefeitos[i].id == city_id){
				 var retorno = cidades_prefeitos[i].prefeito_id;
			}
		}
		return retorno;
	}

	var findCidadeMovimento = function(city_id){
		var retorno = "";
		for (i = 0; i < cidades_prefeitos.length; i++){
			if (cidades_prefeitos[i].id == city_id){
				 var retorno = cidades_prefeitos[i].movimento_id;
			}
		}
		return retorno;
	}

	var resetDashboard = function(){
		$("#aviso").setWarning({msg: ""});
		$("#top .top-right .logo").empty();
		$("#top .top-right .logo").addClass("empty");
		$("#user-info").remove();
		$("#menu ul li").remove();
		$("#menu ul").append("<li class='selected'>Entrar</li>");
		setTitleBar();
	};
	var resetWarnings = function(){
		$("#aviso").empty();
		$(".form-aviso").empty();
	};

	$("#form-login form").submit(function(e){
		e.preventDefault();
		resetWarnings();
		sendLogin();
	});

	var sendLogin = function(){
		args = [{name: "user.login.email",value: $("#form-login #usuario").val()},

				{name: "user.login.password",value: $("#form-login #senha").val()}
				];

		$.ajax({
			type: 'POST',
			dataType: 'json',
			url: api_path + '/api/login',
			data: args,
			success: function(data,status,jqXHR){
				switch(jqXHR.status){
					case 200:
						resetWarnings();
						$.cookie("user.login",data.login,{ expires: 1, path: "/" });
						$.cookie("user.id",data.id,{ expires: 1, path: "/" });
						$.cookie("key",data.api_key,{ expires: 1, path: "/" });
						$("#dashboard #form-login").hide();
						location.hash = "!/dashboard";
						break;
				}
			},
			error: function(data){
				if (data.responseText){
					$("#aviso").setWarning({msg: "$$error".render({
							error: $.trataErro($.parseJSON(data.responseText).error)
						})});
				}else{
					$("#aviso").setWarning({msg: "Erro ao fazer login. ($$error)".render({
							error: data.status
						})});
				}
			}
		});
	};

	/*monta titleBar*/

	var setTitleBar = function(){
		var pagina = getUrlSub();
		var option = $.getUrlVar("option");

		if (pagina == ""){
			pagina = "login";
		}

		$("#header-title .title").empty();;
		$("#header-title .description").empty();
		if(titleBarContent[pagina+","+option]){
			$("#header-title .title").html(titleBarContent[pagina+","+option]["title"]);
			if(titleBarContent[pagina+","+option]["tip"] != ""){
				$("#header-title .description").html(titleBarContent[pagina+","+option]["tip"]);
			}
		}else if(titleBarContent[pagina]){
			$("#header-title .title").html(titleBarContent[pagina]["title"]);
			if(titleBarContent[pagina]["tip"] != ""){
				$("#header-title .description").html(titleBarContent[pagina]["tip"]);
			}
		}
		if ($("#header-title .title").html() != ""){
			var d = document.title;
			document.title = d.substring(0, d.indexOf(' - ')) + ' - ' + $("#header-title .title").html();
		}
	}

	var buildList = function(args){
		var url = args.url;
		var headers = args.headers;
		var fields = args.fields;
		var data = args.data;
		var button = args.button;

		var newlist = "";

		if (button == "undefined" || button == true){
			newlist += buildButton("Adicionar","button-add","button-add");
		}

		newlist += "<table class='results'>";
		newlist += "<thead>";
		newlist += "<tr>";
		for (var key in headers){
			newlist += "<th>" +  headers[key] + "</th>";
		}
		newlist += "<th class='buttons'></th>";
		newlist += "</tr>";
		newlist += "</thead>";

		newlist += "<tbody>";

		$.each(data,function(index,value){
			newlist += "<tr>";
			for (var key in fields){
				newlist += "<td>" + data[index][fields[key]] + "</td>";
			}
			newlist += "<td class='buttons'><a href='$$hash?option=edit&url=$$url' class='icone edit' title='editar' alt='editar'>editar</a><a href='$$hash?option=delete&url=$$url' class='icone delete' title='apagar' alt='apagar'>apagar</a></td>".render({
					hash: "#!/"+getUrlSub(),
					url: data[index]["url"]
			});;
			newlist += "</tr>";
		});
		if (data.length == 0){
			newlist += "<td colspan='20'><span class='noresults'>Nenhum resultado encontrado</span></td>";
		}
		newlist += "<tbody>";
		newlist += "</table>";
		return newlist;
	};
	var buildDataTable = function(args,table_id,button_add,add_class){
		var headers = args.headers;

		var newlist = "";

		if (button_add == undefined || button_add == true){
			newlist += buildButton("Adicionar","button-add","button-add");
		}
		if (add_class == undefined || add_class == null){
			add_class = "";
		}
		if (table_id == undefined || table_id == null){
			table_id = "results";
		}

		newlist += "<table id='" + table_id + "' class='" + add_class + "'>";
		newlist += "<thead>";
		newlist += "<tr>";
		for (var key in headers){
			newlist += "<th>" +  headers[key].replace("_","&nbsp;") + "</th>";
		}
		newlist += "</tr>";
		newlist += "</thead>";

		newlist += "<tbody>";
		newlist += "</tbody>";
		newlist += "</table>";
		return newlist;

	};

	var DTdesenhaBotoes = function(){
		$("#results td.botoes").each( function(){
			if ($(this).find("a").length <= 0){
				var url = $(this).html();
				$(this).html( "<a href='$$hash?option=edit&url=$$url' class='icone edit' title='editar' alt='editar'>editar</a><a href='$$hash?option=delete&url=$$url' class='icone delete' title='apagar' alt='apagar'>apagar</a>".render({
						hash: "#!/"+getUrlSub(),
						url: url
				}));
			}
		});
	}

	var DTdesenhaBotaoVariavel = function(){
		$("#results td.botoes").each( function(){
			if ($(this).find("a").length <= 0){
				var url = $(this).html();
				$(this).html( "<a href='$$hash?option=edit&url=$$url' class='icone edit' title='Adicionar Valor' alt='editar'>adicionar valor</a>".render({
						hash: "#!/"+getUrlSub(),
						url: api_path + "/api/variable/" + url
//						url: "http://rnsp.aware.com.br/api/variable/" + url
				}));
			}
		});
	}

	var buildForm = function(form_args,title){
		var newform = "<div class='form'>";
		if (title){
			newform += "<div class='title'>$$title</div>".render({title: title});
		}
		newform += "<div class='form-aviso'></div>";
		for (i = 0; i < form_args.length; i++){
			if (form_args[i].type == "div"){
				if (form_args[i].class){
					newform += "<div class='div $$class'></div>".render({class: form_args[i].class});
				}else{
					newform += "<div class='div'></div>";
				}
			}else if (form_args[i].type == "subtitle"){
				newform += "<div class='subtitle'>$$title</div>".render({title: form_args[i].title});
			}else{
				if (form_args[i].class == undefined) form_args[i].class = "";
				newform += "<div class='field $$class'>".render({class: form_args[i].class});
				if (form_args[i].label != ""){
					var separator = ":";
				}else{
					var separator = "";
				}
				newform += "<div class='label'>$$label$$separator</div>".render({label: form_args[i].label,separator: separator});
				var newinput;
				newform += "<div class='input'>";
				for (j = 0; j < form_args[i].input.length; j++){
					var input_args = form_args[i].input[j].split(",");
					switch(input_args[0]){
						case "text":
						case "password":
							newinput = "<input type='$$type' name='$$id' id='$$id' class='$$class'>".render({
									type: input_args[0],
									id: input_args[1],
									class: input_args[2]
									})
							break;
						case "select":
							newinput = "<select name='$$id' id='$$id' class='$$class'></select>".render({
									id: input_args[1],
									class: input_args[2]
									})
							break;
						case "radio":
							newinput = "<input type='radio' name='$$id' id='$$id' class='$$class' />".render({
									id: input_args[1],
									class: input_args[2]
									})
							break;
						case "checkbox":
							newinput = "<input type='checkbox' name='$$id' id='$$id' class='$$class' />".render({
									id: input_args[1],
									class: input_args[2]
									})
							break;
						case "textarea":
							newinput = "<textarea name='$$id' id='$$id' class='$$class'></textarea>".render({
									id: input_args[1],
									class: input_args[2]
									})
							break;
						case "textlabel":
							newinput = "<div class='$$class' id='$$id'></div>".render({
									id: input_args[1],
									class: input_args[2]
									})
							break;
						case "file":
							newinput = "<form id='formFileUpload_$$id'><div class='file'><input type='file' name='arquivo_$$id' id='arquivo_$$id' original-id='arquivo_$$id' class='$$class'></div></form><iframe id='iframe_$$id' name='iframe_$$id' frameborder='0'></iframe>".render({
									id: input_args[1],
									class: input_args[2]
									})
							break;
						case "button":
							newinput = "<a href='javascript: void(0);' id='$$id' class='$$class'></a>".render({
									id: input_args[1],
									class: input_args[2]
									})
							break;
					}
					newform += newinput;
				}
				newform += "</div>";
				newform += "<div class='clear'></div>";
				newform += "</div>";
			}
		}
		newform += "<div class='clear'></div>";
		newform += "</div>";
		newform += "<div class='clear'></div>";

		newform += "<div class='form-buttons'><a href='javascript: void(0);' class='botao-form' ref='enviar'>Enviar</a>";
		newform += "<a href='javascript: void(0);' class='botao-form' ref='cancelar'>Cancelar</a></div>";

		return newform;
	};

	var buildButton = function(label,classname,id){
		var new_button = "<a href='javascript: void(0);' class='$$class' id='$$id'>$$label</a>".render({
			class: classname,
			label: label,
			id: id
		});
		return new_button;
	};

	var buildVariableHistory = function(var_id){
		$("#dashboard-content .content div.historico").html("carregando");
		$.ajax({
			type: 'GET',
			dataType: 'json',
			url: api_path + '/api/user/$$userid/variable?api_key=$$key'.render({
					key: $.cookie("key"),
					userid: $.cookie("user.id")
					}),
			success: function(data, textStatus, jqXHR){
				var data_variables = new Array();
				$.each(data.variables, function(index,value){
					if (String(data.variables[index].variable_id) == getIdFromUrl($.getUrlVar("url"))){
						data_variables.push({"id":data.variables[index].variable_id,"name":data.variables[index].name,"period":data.variables[index].period,"values":data.variables[index].values});
					}
				});

				//mostra historico

				var history_table = "<div class='title'>Série Histórica</div><div class='historic-content'>";
				history_table += "<table class='history'><thead><tr><th>Período</th><th>Valor</th><th></th></tr></thead><tbody>";
				$.each(data_variables[0].values, function(index,value){
					history_table += "<tr value-id='$$value_id'><td class='periodo'>$$periodo</td>".render({
								periodo: $.convertDateToPeriod(data_variables[0].values[index].valid_from,data_variables[0].period),
								value_id: data_variables[0].values[index].id
								});
					history_table += "<td class='valor'>$$valor</td><td class='edit'><a href='javascript: void(0);' value-id='$$value_id' class='edit'>editar</a>&nbsp;<a href='javascript: void(0);' value-id='$$value_id' class='delete'>apagar</a></td>".render({
								valor: $.formatNumber(data_variables[0].values[index].value, {format:"#,##0.###", locale:"br"}),
								data: $.format.date(data_variables[0].values[index].value_of_date,"dd/MM/yyyy"),
								value_id: data_variables[0].values[index].id
					});
					history_table += "</tr></tbody>";
				});
				if (data_variables[0].values.length <= 0){
					history_table += "<tr><td class='no-data' colspan='10'>nenhum registro</td></tr>";
				}
				history_table += "</table>";
				history_table += "</div>";

				$("#dashboard-content .content div.historico").empty();
				$("#dashboard-content .content div.historico").append(history_table);
				$("#dashboard-content .content div.historic table").width($("#dashboard-content .content").find(".form").width());
				$("div.historico .title").click(function(){
					$(this).parent().find(".historic-content").toggle();
				});
				$("table.history a.edit").click(function(){

					// carrega Historico para editar

					$("table.history tbody tr").removeClass("selected");
					$(this).parent().parent().addClass("selected");
					var value_selected = $(this);

					$.ajax({
						type: 'GET',
						dataType: 'json',
						url: api_path + '/api/variable/$$var_id/value/$$value_id?api_key=$$key'.render({
								key: $.cookie("key"),
								var_id: getIdFromUrl($.getUrlVar("url")),
								value_id: $(value_selected).attr("value-id")
								}),
						success: function(data, textStatus, jqXHR){
							$("#dashboard-content .content .form").find("input#value").val(data.value);
							if (data_variables[0].period == "yearly"){
								$("#dashboard-content .content .form").find("#value_of_date").val($.format.date(data.value_of_date,"yyyy-MM-dd"));
								$("#dashboard-content .content .form").find("#value_of_date").attr("disabled","disabled");
							}else if (data_variables[0].period == "daily"){
								$("#dashboard-content .content .form").find("#value_of_date").val($.convertDate(data.value_of_date," "));
							}
							$("#dashboard-content .content .form").find(".title").html("Editar Valor");
							$("#dashboard-content .content .botao-form[ref='enviar']").html("Editar");
							$("#dashboard-content .content .botao-form[ref='cancelar']").html("Cancelar");
						}
					});

				});
				$("table.history a.delete").click(function(){
					var value_selected = $(this);
					deleteRegister({
						url: api_path + '/api/variable/$$var_id/value/$$value_id?api_key=$$key'.render({
								key: $.cookie("key"),
								var_id: getIdFromUrl($.getUrlVar("url")),
								value_id: $(value_selected).attr("value-id")
								}),
						redirect: false,
						call: "buildVariableHistory"
					});
				});
			}
		});
	}

	var buildIndicatorHistory = function (args){

        var vvariations = [];
		$.ajax({
			type: 'GET',
			dataType: 'json',
			url: api_path + '/api/indicator/$$id/variable/value?api_key=$$key'.render({
					key: $.cookie("key"),
					id: args.id
					}),
			success: function(data, textStatus, jqXHR){
				if (data.header && data.rows != undefined){
					var history_table = "";
					history_table += "<table class='history'><thead><tr><th>Período</th>";

					var headers = [];//corrige ordem do header
					$.each(data.header,function(titulo, index){
						headers[index] = titulo;
					});
                    vvariations = [];
					var seta_vvariacoes = true;

					$.each(headers, function(index,value){
						history_table += "<th class='variavel'>$$variavel</th>".render({variavel:value});
					});
					history_table += "#theader_valor";
					history_table += "</tr></thead><tbody>";
					var rows = 0;
					$.each(data.rows, function(index,value){
						history_table += "<tr row-id='$$row'><td class='periodo'>$$periodo</td>".render({periodo: $.convertDateToPeriod(data.rows[index].valid_from,args.period), row: rows});
						$.each(data.rows[index].valores, function(index2,value2){
							if (data.rows[index].valores[index2].value != "-" && data.rows[index].valores[index2].value != null && data.rows[index].valores[index2].value != undefined){
								history_table += "<td class='valor' title='$$data' value-id='$$id' variable-id='$$variable_id'>$$valor</td>".render({
										valor: $.formatNumber(data.rows[index].valores[index2].value, {format:"#,##0.###", locale:"br"}),
										data: $.convertDate(data.rows[index].valores[index2].value_of_date,"T"),
										id: data.rows[index].valores[index2].id,
										variable_id: data.rows[index].valores[index2].variable_id
								});
							}else{
								history_table += "<td class='valor' title='$$data' value-id='$$id'>-</td>".render({
										data: $.convertDate(data.rows[index].valores[index2].value_of_date,"T"),
										id: data.rows[index].valores[index2].id,
										variable_id: data.rows[index].valores[index2].variable_id
								});
							}
						});
						if (value.variations && value.variations.length > 0){
							var th_valor = "";
							for (i = 0; i < value.variations.length; i++){
								th_valor += "<th class='formula_valor' variation-index='" + i + "'>Valor da Fórmula</th>";
							}
							history_table = history_table.replace("#theader_valor",th_valor+"<th></th>");
							$.each(value.variations, function(index,item){
								if (item.value != "-"){
									history_table += "<td class='formula_valor' variation-index='$$index'>$$formula_valor</td>".render({
												formula_valor: $.formatNumber(item.value, {format:"#,##0.###", locale:"br"}),
												index: index
											});
								}else{
									history_table += "<td class='formula_valor' variation-index='$$index'>-</td>".render({
											index: index
										});
								}
								if (seta_vvariacoes){
									vvariations.push({
											name: item.name,
											index: index
										});
								}
							});
							seta_vvariacoes = false;
						}else{
							history_table = history_table.replace("#theader_valor","<th class='formula_valor'>Valor da Fórmula</th><th></th>");
							if (data.rows[index].formula_value != "-"){
								history_table += "<td class='formula_valor' variation-index='0'>$$valor</td>".render({
										valor: $.formatNumber(data.rows[index].formula_value, {format:"#,##0.###", locale:"br"})
								});
							}else{
								history_table += "<td class='formula_valor' variation-index='0'>-</td>";
							}
						}
						history_table += "<td class='edit'><a href='javascript: void(0);' row-id='$$row' class='delete'>apagar</a></td>".render({
									row: rows
						});
						history_table += "</tr>";
						rows++;
					});
					history_table += "</tbody></table>";
				}else{
					var history_table = "<table class='history'><thead><tr><th>nenhum registro encontrado</th></tr></thead></table>";
				}

				var variation_filter = "";
				if (vvariations.length > 0){
					variation_filter += "<div class='variation-filter'><span class='variation-filter'>Faixa: </span><select class='variation-filter'>";
					$.each(vvariations, function(index,item){
						variation_filter += "<option value='$$index'>$$name".render({
								index: item.index,
								name: item.name
							});
					});
					variation_filter += "</select></div>";
				}

				$(args.target).empty();
				$(args.target).append("<div class='title' title='mostrar/esconder Histórico'>Série Histórica</div><div class='historic-content'>" + variation_filter + history_table + "</div>");
				$(args.target).find(".title").click(function(){
					$(this).parent().find(".historic-content").toggle();
				});


				if (vvariations.length > 0){
					$(args.target).find("table .formula_valor[variation-index!=0]").hide();

					$("select.variation-filter").change(function(){
						var obj = $(this);
						$(obj).parent().next("table").find(".formula_valor").fadeOut("fast",function(){
							$(obj).parent().next("table").find(".formula_valor[variation-index='" + $(obj).val() + "']").show();
						});
					});
				}

				$("table.history a.delete").click(function(){
					var link_delete = this;
					$.confirm({
						'title': 'Confirmação',
						'message': 'Você irá excluir permanentemente esse registro.<br />Continuar?',
						'buttons': {
							'Sim': {
								'class'	: '',
								'action': function(){
									var row = $("table.history tbody tr[row-id='$$row_id']".render({row_id: $(link_delete).attr("row-id")}));

									var tds = $(row).find("td[variable-id]");

									var total_values = tds.length;

									var total_values_enviados = 0;

									$(tds).each(function(index,element){
										$.ajax({
											type: 'DELETE',
											dataType: 'json',
											url: api_path + '/api/variable/$$var_id/value/$$value_id?api_key=$$key'.render({
															key: $.cookie("key"),
															var_id: $(element).attr("variable-id"),
															value_id: $(element).attr("value-id")
														}),
											success: function(data,status,jqXHR){
												switch(jqXHR.status){
													case 204:
														total_values_enviados++;
														if (total_values_enviados >= total_values){
															resetWarnings();
															$("#aviso").setWarning({msg: "Cadastro apagado com sucesso."});
															buildIndicatorHistory(args);
														}
														break;
												}
											}
										});
									});

								}
							},
							'Não'	: {
								'class'	: '',
								'action': function(){
								}
							}
						}
					});
				});
			}
		});

	}

	var setNewSource = function(objSelect,objText){
		$(objText).hide();
		$(objText).attr("placeholder","descrição da nova fonte");
		$(objText).css("margin-top","5px");
		$(objText).before("&nbsp;<a href='#' id='delete-source'>remover fonte</a><br />");
		$(objText).after("&nbsp;<a href='#' id='add-source'>adicionar</a>");
		$(objSelect).next("a#delete-source").hide();
		$(objText).next("a#add-source").hide();
		$(objSelect).next("a#delete-source").click(function(e){
			e.preventDefault();
			if ($(objSelect).find("option:selected").val() != ""){
				deleteSource({
								url: api_path + "/api/source/" + $(objSelect).find("option:selected").attr("source-id") + "?api_key=$$key".render({
										key: $.cookie("key")
								}),
								element: $(objSelect),
								resetElement: true
							 });
			}
		});
		$(objText).next("a#add-source").click(function(e){
			e.preventDefault();
			if ($(objText).val() == ""){
				$("#aviso").setWarning({msg: "Informe uma descrição para a fonte."});
				return;
			}else if ($(objText).val() == "_new"){
				$("#aviso").setWarning({msg: "Descrição para a fonte inválida."});
				return;
			}
			var args_source = [{name: "api_key", value: $.cookie("key")},
					{name: "source.create.name", value: $(objText).val()}
					];
			var new_id;
			$.ajax({
				async: false,
				type: 'POST',
				dataType: 'json',
				url: api_path + '/api/source',
				data: args_source,
				success: function(data){
					new_id = data.id;
				}
			});
			loadSources();
			$("select.source").each(function(i,item){
				var _objSelect = $("select#"+$(item).attr("id"));
				var _objText = $("input#"+$(item).attr("id") + "_new");
				loadComboSources(sources,_objSelect,_objText);
			})
			$(objSelect).find("option[source-id='$$id']".render({
					id: new_id
				})).attr("selected","selected");
			$(objText).hide();
			$(objText).next("a#add-source").hide();
			$(objSelect).next("a#delete-source").show();

		});
	}

	var loadComboSources = function(arr,objSelect,objText){
		var old_selected = $(objSelect).find("option:selected").val();
		$(objSelect).empty();
		$(objSelect).append($("<option></option>").val("").html("nenhuma"));
		$(objSelect).append($("<option></option>").val("_new").html("- nova fonte"));
		$.each(arr,function(index, item){
			$(objSelect).append($("<option></option>").val(item.name).html(item.name).attr("source-id",item.id));
		});

		$(objSelect).val(old_selected);

		$(objSelect).change(function(e){
			$(objSelect).next("a#delete-source").hide();
			$(objText).next("a#add-source").hide();
			$(objText).hide();
			if ($(this).val() == "_new"){
				$(objText).show();
				$(objText).next("a#add-source").show();
			}else if ($(this).val() != ""){
				if (user_info.roles[0] == "admin"){
					$(objSelect).next("a#delete-source").show();
				}
				$(objText).next("a#add-source").hide();
			}
		});
	}

	var deleteSource = function(params){
		$.ajax({
			async: false,
			type: 'DELETE',
			dataType: 'json',
			url: params.url,
			success: function(data,status,jqXHR){
				switch(jqXHR.status){
					case 204:
						resetWarnings();
						$("#aviso").setWarning({msg: "Fonte removida com sucesso."});
						if (params.resetElement){
							loadSources();
							$("select.source").each(function(i,item){
								var _objSelect = $("select#"+$(item).attr("id"));
								var _objText = $("input#"+$(item).attr("id") + "_new");
								loadComboSources(sources,_objSelect,_objText);
							})
							$(params.element).val("");
						}
						break;
				}
			},
			error: function(data){
				switch(data.status){
					case 200:
						break;
					default:
						$("#aviso").setWarning({msg: "Erro: ($$codigo)".render({
									codigo: data.status
									})
						});
						break;
				}
			}
		});

	}

	var deleteRegister = function(params){
		$.confirm({
			'title': 'Confirmação',
			'message': 'Você irá excluir permanentemente esse registro.<br />Continuar?',
			'buttons': {
				'Sim': {
					'class'	: '',
					'action': function(){
						$.ajax({
							type: 'DELETE',
							dataType: 'json',
							url: params.url,
							success: function(data,status,jqXHR){
								switch(jqXHR.status){
									case 204:
										resetWarnings();
										$("#aviso").setWarning({msg: "Cadastro apagado com sucesso."});
										if (params.redirect == undefined || params.redirect == true){
											location.hash = "#!/"+getUrlSub();
										}
										if (params.call != undefined){
											eval(params.call+"();");
										}
										break;
								}
							},
							error: function(data){
								switch(data.status){
									case 200:
										break;
									default:
										$("#aviso").setWarning({msg: "Erro: ($$codigo)".render({
													codigo: data.status
													})
										});
										if (params.redirect == undefined || params.redirect == true){
											location.hash = "#!/"+getUrlSub();
										}
										break;
								}
							}
						});
					}
				},
				'Não'	: {
					'class'	: '',
					'action': function(){
						if (params.redirect == undefined || params.redirect == true){
							location.hash = "#!/"+getUrlSub();
						}
					}
				}
			}
		});
	}

	var getUrlSub = function(){
		var hash = location.hash;
		var url_split = hash.split("#!");
		if (url_split.length > 1){
			var url_split_sub = url_split[1].split("/");
			if (url_split_sub.length > 1){
				var url_sub = url_split_sub[1];
			}else{
				var url_sub = url_split[1];
			}

			var url_split_sub = url_sub.split("?");
			if (url_split_sub.length > 1){
				var url_sub = url_split_sub[0];
			}else{
				var url_sub = url_split_sub;
			}

		}else{
			var url_sub = "";
		}
		return url_sub;
	};

	var getIdFromUrl = function(url){
		if (url == undefined) return undefined;
		var split_url = url.split("/");
		if (split_url.length > 0){
			return split_url[split_url.length-1];
		}else{
			return null;
		}
	}

	$.confirm = function(params){
		if($("#dialog-overlay").length > 0){
			return false;
		}

		var buttonHTML = '';
		$.each(params.buttons,function(name,obj){
			buttonHTML += '<a href="javascript:;" class="button-default '+obj['class']+'">'+name+'</a>';
			if(!obj.action){
				obj.action = function(){};
			}
		});

		var confirmWindow = "<div id='dialog-overlay'>";
		confirmWindow += "<div id='dialog-box'>";
		confirmWindow += "<div id='dialog-content'>";
		confirmWindow += "<div id='dialog-title'>$$title</div>".render({title: params.title});
		confirmWindow += "<div id='dialog-message'>$$message</div>".render({message: params.message});
		confirmWindow += "<div id='dialog-buttons'>$$buttons</div>".render({buttons: buttonHTML});
		confirmWindow += "</div></div></div>";

		$(confirmWindow).hide().appendTo("body").fadeIn();

		var buttons = $('#dialog-box .button-default'), i = 0;

		$.each(params.buttons,function(name,obj){
			buttons.eq(i++).click(function(){
				obj.action();
				$.confirm.hide();
				return false;
			});
		});
	};
	$.confirm.hide = function(){
		$('#dialog-overlay').fadeOut(function(){
			$(this).remove();
		});
	}


	$.loading = function(params){
		if($("#dialog-overlay").length > 0){
			return false;
		}

		var loadingWindow = "<div id='dialog-overlay'>";
		loadingWindow += "<div id='dialog-box'>";
		loadingWindow += "<div id='dialog-content'>";
		loadingWindow += "<div id='dialog-title'>Aguarde...</div>";
		loadingWindow += "<div id='dialog-message'><div class='img-loading'></div></div>";
		loadingWindow += "</div></div></div>";

		$(loadingWindow).hide().appendTo("body").fadeIn("fast");

	};
	$.loading.hide = function(){
		$('#dialog-overlay').fadeOut(function(){
			$(this).remove();
		});
	}


	var loadCidades = function(){
		cidades_prefeitos = [];
		$.ajax({
			async: false,
			type: 'GET',
			dataType: 'json',
			url: api_path + '/api/city?api_key=$$key'.render({
							key: $.cookie("key")
					}),
			success: function(data, textStatus, jqXHR){
				$.each(data.citys, function(index,value){
					cidades_prefeitos.push({"id":data.citys[index].id,"prefeito_id":data.citys[index].prefeito_id, "movimento_id":data.citys[index].movimento_id});
				});

			},
			error: function(data){
				$("#aviso").setWarning({msg: "Erro ao carregar ($$codigo)".render({
							codigo: $.parseJSON(data.responseText).error
						})
				});
			}
		});
	}


	var loadUnidades = function(){
		measurement_units = [];
		$.ajax({
			async: false,
			type: 'GET',
			dataType: 'json',
			url: api_path + '/api/measurement_unit?api_key=$$key'.render({
							key: $.cookie("key")
					}),
			success: function(data, textStatus, jqXHR){
				$.each(data.measurement_units, function(index,item){
					measurement_units.push({"id":item.id,"name":item.name});
				});

				measurement_units.sort(function (a, b) {
					a = a.name,
					b = b.name;

					return a.localeCompare(b);
				});

			},
			error: function(data){
				$("#aviso").setWarning({msg: "Erro ao carregar ($$codigo)".render({
							codigo: $.parseJSON(data.responseText).error
						})
				});
			}
		});
	}

	var loadSources = function(){
		sources = [];
		$.ajax({
			async: false,
			type: 'GET',
			dataType: 'json',
			url: api_path + '/api/source?api_key=$$key'.render({
							key: $.cookie("key")
					}),
			success: function(data, textStatus, jqXHR){
				$.each(data.sources, function(index,item){
					sources.push({"name":item.name, "id":item.id});
				});

				sources.sort(function (a, b) {
					a = a.name,
					b = b.name;

					return a.localeCompare(b);
				});

			},
			error: function(data){
				$("#aviso").setWarning({msg: "Erro ao carregar ($$codigo)".render({
							codigo: $.parseJSON(data.responseText).error
						})
				});
			}
		});
	}


	var buildLogin = function(){
		resetDashboard();
		$("#dashboard #form-login").show();
	}

	var formataFormula = function(formula,variables,vvariables){
		var operators_caption = {"+":"+"
						,"-":"-"
						,"(":"("
						,")":")"
						,"/":"÷"
						,"*":"×"
						,"CONCATENAR":""
						};

		var new_formula = formula;

		variables.sort(function (a, b) {
			return b.id - a.id;
		});

		$.each(variables,function(index,value){
			var pattern = "\\$"+variables[index].id;
			var re = new RegExp(pattern, "g");
			new_formula = new_formula.replace(re,variables[index].name + " ");
		});

		if (vvariables){
			vvariables.sort(function (a, b) {
				return b.id - a.id;
			});
			$.each(vvariables,function(index,value){
				var pattern = "\\#"+vvariables[index].id;
				var re = new RegExp(pattern, "g");
				new_formula = new_formula.replace(re,vvariables[index].name);
			});
		}

		$.each(operators_caption,function(index,value){
			new_formula = new_formula.replace(index," " + value + " ");
		});

		return new_formula.trim();
	}

	var getVariablesFromFormula = function(formula){
		var indicator_variables = formula.replace(/[^0-9.\$]/g," ").match(/\s\$[^\s]*|^\$[^\s]*/gi);
		for (i = 0; i < indicator_variables.length; i++){
			indicator_variables[i] = indicator_variables[i].replace(" ","");
			indicator_variables[i] = indicator_variables[i].replace("$","");
		}
		return indicator_variables;
	}

	var trataCliqueVariaveis = function(){
		$("#formula-editor .variables .item").unbind();
		$("#formula-editor .variables .item").click(function(e){
			if ($(this).hasClass("selected")){
				$(this).removeClass("selected");
			}else{
				$(this).parent().find(".item").removeClass("selected");
				$(this).addClass("selected");
			}
			e.stopPropagation();
		});
		$("#formula-editor .variables .item").dblclick(function(e){
			if (!$(this).hasClass("selected")){
				$(this).parent().find(".item").removeClass("selected");
				$(this).addClass("selected");
			}
			$("#formula-editor .button").click();
			e.stopPropagation();
		});
	}

	var buildUserInterface = function(){
		if ($.cookie("key") != null && $.cookie("key") != ""){
			$.ajax({
				type: 'GET',
				dataType: 'json',
				url: api_path + '/api/user/$$userid?api_key=$$key'.render({
						userid: $.cookie("user.id"),
						key: $.cookie("key")
				}),
				success: function(data,status,jqXHR){
					switch(jqXHR.status){
						case 200:
							user_info = data;

							user_info.role = "";
							if (user_info.roles.length == 1){
								user_info.role = user_info.roles[0];
							}else if (user_info.roles.length == 2){
								if (user_info.roles[0] == "user"){
									user_info.role = user_info.roles[0];
								}else if (user_info.roles[1] == "user"){
									user_info.role = user_info.roles[1];
								}
							}

							if (user_info.role != ""){

								var info_content = "Usuário: " + user_info.name;
								if($("#user-info").length == 0){
									$("#top .top-right .info").append("<div id='user-info'>" + info_content + "</div>");
								}else{
									$("#top #user-info").html(info_content);
								}
								if (findInArray(user_info.roles,"_movimento")){
									if (user_info.files.logo_movimento != undefined){
										$("#top .top-right .logo").empty().append("<img>");
										$("#top .top-right .logo img").attr("src",user_info.files.logo_movimento);
									}
								}else{
									$("#top .top-right .logo").empty();
									$("#top .top-right .logo").addClass("empty");
								}
								buildMenu();
								setTitleBar();
								buildContent();
								break;
							}else{
								$.confirm({
									'title': 'Aviso',
									'message': 'Erro ao carregar informações do Usuário.',
									'buttons': {
										'Ok': {
											'class'	: '',
											'action': function(){
												resetCookies();
												resetDashboard();
												location.hash = "";
											}
										}
									}
								});
							}
					}
				},
				error: function(data){
					switch(data.status){
						case 400:
							$("#aviso").setWarning({msg: "Erro: ($$codigo)".render({
										codigo: $.parseJSON(data.responseText).error
										})
							});
							break;
						case 403:
							$.confirm({
								'title': 'Aviso',
								'message': 'Sua sessão expirou.',
								'buttons': {
									'Ok': {
										'class'	: '',
										'action': function(){
											resetCookies()
											resetDashboard();
											location.hash = "";
										}
									}
								}
							});
							break;
						case 500:
							$.confirm({
								'title': 'Aviso',
								'message': 'Erro ao carregar informações do Usuário.',
								'buttons': {
									'Ok': {
										'class'	: '',
										'action': function(){
											resetCookies()
											resetDashboard();
											location.hash = "";
										}
									}
								}
							});
							break;
					}
				}
			});
		}else{
			resetCookies()
			resetDashboard();
			buildLogin();
		}
	};
	var buildMenu = function(){
		if($("#menu ul li").length > 0){
			$("#menu ul li").remove();
		}
		var menu = "<div id='menu'><ul class='menu'></ul></div>";
		$("#dashboard-content #user-info").after(menu);

		var menu_label = [];
		var menu_access = [];

		menu_label["dashboard"] = "Início";
		menu_label["users"] = "Usuários";
		menu_label["cities"] = "Cidades";
		menu_label["units"] = "Unidades de Medida";
		menu_label["axis"] = "Eixos";
		menu_label["variable"] = "Variáveis";
		menu_label["myvariable"] = "Variáveis Básicas";
		menu_label["myvariableedit"] = "Editar Valores";
		menu_label["myindicator"] = "Indicadores";
		menu_label["mygroup"] = "Grupos de Indicadores";
		menu_label["indicator"] = "Indicadores";
		menu_label["tokens"] = "Tokens";
		menu_label["reports"] = "Relatórios";
		menu_label["prefs"] = "Preferências";
		menu_label["logout"] = "Sair";

		menu_access["admin"] = ["prefs","users","cities","units","variable","myvariableedit","axis","indicator","logout"];
		if (findInArray(user_info.roles,"_movimento")){
			menu_access["user"] = ["prefs","myvariable","myvariableedit","myindicator","mygroup","logout"];
		}else{
			menu_access["user"] = ["prefs","myvariable","myvariableedit","myindicator","logout"];
		}

		$.each(menu_access[user_info.role],function(index,value){
			var menu_class = (getUrlSub() == value) ? "selected" : "";
			$("#menu").find("ul").append("<li class='$$class' ref='$$url_sub'>$$menu</li>".render({
				menu: "<a href='#!/" + value + "'>" + menu_label[value] + "</a>",
				url_sub: value,
				class: menu_class
			}));
		});
		$("#menu li a").click(function(){
			resetWarnings();
		});
	};

	var updateFormula = function(){
		var formula = "";
		$("#formula-editor .editor-content div").each(function(index,element){
			if ($(this).hasClass("f-variable")){
				formula += "$"+$(this).attr("var_id");
			}else if ($(this).hasClass("f-vvariable")){
				formula += "#"+$(this).attr("var_id");
			}else if ($(this).hasClass("f-operator")){
				formula += $(this).attr("val");
			}else{
				formula += $(this).html();
			}
		});
		$("textarea#formula").val(formula);
	}

	var convertFormulaToCss = function(){
		var operators = ["+","-","(",")","/","*","¢"];
		var operators_caption = {"+":"+"
						,"-":"-"
						,"(":"("
						,")":")"
						,"/":"÷"
						,"*":"×"
						,"¢":"[ ]"
						};
		var formula = $("textarea#formula").val();
		formula = formula.replace("CONCATENAR","¢");
		var formula_css = "";
		for (i = 0; i < formula.length; i++){
			if ($.inArray(formula[i],operators) >= 0){
				formula_css += "<div class='f-operator' val='$$val'>$$caption</div>".render({val:formula[i],caption:operators_caption[formula[i]]});
			}else if (formula[i] == "$"){
				var var_id = "";
				var var_caption = "";
				for (j = i+1; j < formula.length; j++){
					if ($.inArray(formula[j],operators) >= 0 || formula[j] == "$" || formula[j] == "#"){
						i = j - 1;
						break;
					}else{
						var_id += formula[j];
						i = j;
					}
				}
				var_caption = $("#formula-editor .variables .item[var_id='"+var_id+"'][type='normal']").html();
				formula_css += "<div class='f-variable' var_id='$$var_id'>$$caption</div>".render({var_id:var_id,caption:var_caption});
			}else if (formula[i] == "#"){
				var var_id = "";
				var var_caption = "";
				for (j = i+1; j < formula.length; j++){
					if ($.inArray(formula[j],operators) >= 0 || formula[j] == "$" || formula[j] == "#"){
						i = j - 1;
						break;
					}else{
						var_id += formula[j];
						i = j;
					}
				}
				var_caption = $("#formula-editor .variables .item[var_id='"+var_id+"'][type='varied']").html();
				formula_css += "<div class='f-vvariable' var_id='$$var_id'>$$caption</div>".render({var_id:var_id,caption:var_caption});
			}else{
				var var_input = "";
				for (j = i; j < formula.length; j++){
					if ($.inArray(formula[j],operators) >= 0 || formula[j] == "$"){
						i = j - 1;
						break;
					}else{
						var_input += formula[j];
						i = j;
					}
				}
				formula_css += "<div class='f-input'>$$caption</div>".render({caption:var_input});
			}
		}
		$("#formula-editor .editor-content").html(formula_css);
	}

	var carregaComboCidades = function(args){
		$.ajax({
			async: false,
			type: 'GET',
			dataType: 'json',
			url: api_path + '/api/city?api_key=$$key'.render({
							key: $.cookie("key")
					}),
			success: function(data, textStatus, jqXHR){
				if (args){
					if (args.option == "edit"){
						$.each(data.citys, function(index,value){
							if (findCidadePrefeito(data.citys[index].id) == null || findCidadeMovimento(data.citys[index].id) == null){
								$("#dashboard-content .content select#city_id").append($("<option></option>").val(data.citys[index].id).html(data.citys[index].name + " (" + data.citys[index].uf + ")"));
							}else{
								if (findCidadePrefeito(data.citys[index].id) == getIdFromUrl(args.city) || findCidadeMovimento(data.citys[index].id) == getIdFromUrl(args.city)){
									$("#dashboard-content .content select#city_id").append($("<option></option>").val(data.citys[index].id).html(data.citys[index].name + " (" + data.citys[index].uf + ")"));
								}
							}
						});
						if (args.city != undefined){
							$("#dashboard-content .content select#city_id").val(getIdFromUrl(args.city));
						}
					}
				}else{
					$.each(data.citys, function(index,value){
						if (findCidadePrefeito(data.citys[index].id) == null || findCidadeMovimento(data.citys[index].id) == null){
							$("#dashboard-content .content select#city_id").append($("<option></option>").val(data.citys[index].id).html(data.citys[index].name + " (" + data.citys[index].uf + ")"));
						}
					});
				}
				$("#dashboard-content .content select#city_id").change(function(){
					var city_id = $(this).find("option:selected").val();
					var disabled = false;
					var checked = true;
					if (findCidadePrefeito($(this).find("option:selected").val()) != null){
						if ($.getUrlVar("option") == "edit"){
							if (getIdFromUrl($.getUrlVar("url")) == findCidadePrefeito($(this).find("option:selected").val())){
								$("#dashboard-content .content input#prefeito").attr("checked",true);
								$("#dashboard-content .content input#prefeito").attr("disabled",false);
							}else{
								$("#dashboard-content .content input#prefeito").attr("checked",false);
								$("#dashboard-content .content input#prefeito").attr("disabled",true);
							}
						}else{
							$("#dashboard-content .content input#prefeito").attr("checked",false);
							$("#dashboard-content .content input#prefeito").attr("disabled",true);
						}
					}else{
						$("#dashboard-content .content input#prefeito").attr("checked",false);
						$("#dashboard-content .content input#prefeito").attr("disabled",false);
					}

				});

			},
			error: function(data){
				$("#aviso").setWarning({msg: "Erro ao carregar ($$codigo)".render({
							codigo: $.parseJSON(data.responseText).error
						})
				});
			}
		});
	}

	/*MONTA TELAS*/

	$(window).hashchange( function(){
		$("#dashboard-content .content").empty();
		buildUserInterface();
	})

	var buildContent = function(){
		if ($.inArray(getUrlSub().toString(),["dashboard","users","cities","units","variable","myvariable","myvariableedit","axis","indicator","myindicator","mygroup","tokens","reports","prefs"]) >= 0){
			$.xhrPool.abortAll();
			$("#dashboard #form-login").hide();
			/*  ORGANIZATION  */
			if (getUrlSub() == "dashboard"){

				if (!findInArray(user_info.roles,"_prefeitura") && !findInArray(user_info.roles,"_movimento")){

					var logList = buildDataTable({
							headers: ["Usuário","Mensagem","Data"]
							},null,false);

					$("#dashboard-content .content").append(logList);

					var url_log = api_path + '/api/log?api_key=' + $.cookie("key");

					$.ajax({
						type: 'GET',
						dataType: 'json',
						url: url_log,
						success: function(data, textStatus, jqXHR){
							$.each(data.logs, function(index,value){
								$("#dashboard-content .content #results tbody").append($("<tr><td>$$usuario</td><td>$$mensagem</td><td>$$data</td></tr>".render({
								usuario: data.logs[index].user.nome,
								mensagem: data.logs[index].message,
								data: $.convertDateTime(data.logs[index].date,"T")
								})));
							});

							$("#results").dataTable( {
								  "oLanguage": {
												"sUrl": api_path + "/frontend/js/dataTables.pt-br.txt"
												},
								  "aaSorting": [[2,'desc']],
								  "aoColumnDefs": [
													{ "sClass": "log", "aTargets": [ 0 , 1 , 2 ] },
													{ "sClass": "log.data", "aTargets": [ 2 ] }
												  ]
							} );
						}
					});

				}
			}else if (getUrlSub() == "users"){
				/*  USER  */
				loadCidades();
				if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined){

					var userList = buildDataTable({
							headers: ["Nome","Email","_"]
							});

					$("#dashboard-content .content").append(userList)

					$("#button-add").click(function(){
						resetWarnings();
						location.hash = "#!/" + getUrlSub() + "?option=add";
					});

					$("#results").dataTable( {
						  "oLanguage": {
										"sUrl": api_path + "/frontend/js/dataTables.pt-br.txt"
										},
						  "bProcessing": true,
						  "sAjaxSource": api_path + '/api/user?api_key=$$key&content-type=application/json&columns=name,email,url,_,_'.render({
								key: $.cookie("key")
								}),
						  "aoColumnDefs": [
                        					{ "bSearchable": false, "bSortable": false, "sClass": "botoes", "sWidth": "60px", "aTargets": [ 2 ] }
                    					  ],
						   "fnDrawCallback": function(){
								DTdesenhaBotoes();
							}
					} );

				}else if ($.getUrlVar("option") == "add" || $.getUrlVar("option") == "edit"){

					var txtOption = ($.getUrlVar("option") == "add") ? "Cadastrar" : "Editar";

					var newform = [];

					newform.push({label: "Nome", input: ["text,name,itext"]});
					newform.push({label: "Email", input: ["text,email,itext"]});
					newform.push({label: "Senha", input: ["password,password,itext"]});
					newform.push({label: "Confirmar Senha", input: ["password,password_confirm,itext"]});
					newform.push({label: "Nível", input: ["select,user_role,iselect"]});
					newform.push({label: "Cidade", input: ["select,city_id,iselect"], "class": "prefeitura"});
					newform.push({label: "Prefeitura?", input: ["checkbox,prefeito,icheckbox"], "class": "prefeitura"});

					var formbuild = $("#dashboard-content .content").append(buildForm(newform,txtOption));
					$(formbuild).find("div .field:odd").addClass("odd");
					$(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

					$(formbuild).find("#name").qtip( $.extend(true, {}, qtip_input, {
							content: "Importante: Nome do usuário."
					}));
					$(formbuild).find("#email").qtip( $.extend(true, {}, qtip_input, {
							content: "Importante: o Email será usado como login."
					}));
					$(formbuild).find("#name").qtip( $.extend(true, {}, qtip_input, {
							content: "Utilize letras e números e pelo menos 8 caracteres."
					}));

					$.each(roles,function(key, value){
						$("#dashboard-content .content select#user_role").append($("<option></option>").val(key).html(value));
					});

					$("#dashboard-content .content select#user_role").change(function(){
						if ($(this).find("option:selected").val() == "user"){
							$(formbuild).find("div.prefeitura").show();
						}else{
							$(formbuild).find("div.prefeitura").hide();
						}
					});

					$("#dashboard-content .content input#prefeito").attr("disabled",true);

					$("#dashboard-content .content select#city_id").append($("<option></option>").val("").html("Selecione..."));

					if ($.getUrlVar("option") == "add"){
						carregaComboCidades();
						$("#dashboard-content .content .botao-form[ref='enviar']").click(function(){
							resetWarnings();
							if ($(this).parent().parent().find("#name").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe o Nome"});
							}else if ($(this).parent().parent().find("#email").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe o Email"});
							}else if ($(this).parent().parent().find("#password").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe a Senha"});
							}else if ($(this).parent().parent().find("#password_confirm").val() == "" || $(this).parent().parent().find("#password_confirm").val() != $(this).parent().parent().find("#password").val()){
								$(".form-aviso").setWarning({msg: "Confirmação de senha inválida"});
							}else if ($(this).parent().parent().find("#city_id option:selected").val() == "" && $(this).parent().parent().find("#user_role option:selected").val() == "user"){
								$(".form-aviso").setWarning({msg: "Por favor informe a Cidade"});
							}else{
								args = [{name: "api_key", value: $.cookie("key")},
										{name: "user.create.name", value: $(this).parent().parent().find("#name").val()},
										{name: "user.create.email", value: $(this).parent().parent().find("#email").val()},
										{name: "user.create.password", value: $(this).parent().parent().find("#password").val()},
										{name: "user.create.password_confirm", value: $(this).parent().parent().find("#password").val()},
										{name: "user.create.role", value: $(this).parent().parent().find("#user_role option:selected").val()},
										{name: "user.create.city_id", value: $(this).parent().parent().find("#city_id option:selected").val()}
										];
								if ($(this).parent().parent().find("#prefeito").attr("checked")){
									args.push({name: "user.create.prefeito", value: 1});
									args.push({name: "user.create.movimento", value: 0});
								}else{
									args.push({name: "user.create.prefeito", value: 0});
									if ($(this).parent().parent().find("#user_role option:selected").val() == "user"){
										args.push({name: "user.create.movimento", value: 1});
									}
								}
								$("#dashboard-content .content .botao-form[ref='enviar']").hide();
								$.ajax({
									type: 'POST',
									dataType: 'json',
									url: api_path + '/api/user',
									data: args,
									success: function(data,status,jqXHR){
										$("#aviso").setWarning({msg: "Cadastro efetuado com sucesso.".render({
													codigo: jqXHR.status
													})
										});
										location.hash = "#!/"+getUrlSub();
									},
									error: function(data){
										switch(data.status){
											case 400:
												$("#aviso").setWarning({msg: "Erro ao cadastrar. ($$codigo)".render({
															codigo: $.parseJSON(data.responseText).error
															})
												});
												break;
										}
										$("#dashboard-content .content .botao-form[ref='enviar']").show();
									}
								});
							}
						});
					}else if ($.getUrlVar("option") == "edit"){
						$.ajax({
							type: 'GET',
							dataType: 'json',
							url: $.getUrlVar("url") + "?api_key=$$key".render({
										key: $.cookie("key")
								}),
							success: function(data,status,jqXHR){
								switch(jqXHR.status){
									case 200:
										$(formbuild).find("input#name").val(data.name);
										$(formbuild).find("input#email").val(data.email);
										if ($.cookie("organization.id") == null){
											if (data.organization != undefined){
												$(formbuild).find("select#organization_id").val(getIdFromUrl(data.organization));
											}
										}
										if (!findInArray(["admin","user","app"],data.roles[0])){
											var role_temp = data.roles[0];
											data.roles[0] = data.roles[1];
											data.roles[1] = role_temp;
										}
										$(formbuild).find("select#user_role").val(data.roles[0]);
										if (data.roles[0] == "user"){
											$(formbuild).find("div.prefeitura").show();
										}else{
											$(formbuild).find("div.prefeitura").hide();
										}
										carregaComboCidades({"option":"edit", "city": data.city});
										if (data.city != undefined){
											if (findCidadePrefeito(getIdFromUrl(data.city)) == getIdFromUrl($.getUrlVar("url"))){
												$(formbuild).find("input#prefeito").attr("disabled",false);
												$(formbuild).find("input#prefeito").attr("checked",true);
											}else{
												$(formbuild).find("input#prefeito").attr("disabled",false);
											}
										}
										break;
								}
							},
							error: function(data){
								switch(data.status){
									case 400:
										$(".form-aviso").setWarning({msg: "Erro: ($$codigo)".render({
													codigo: $.parseJSON(data.responseText).error
													})
										});
										break;
								}
							}
						});

						$("#dashboard-content .content .botao-form[ref='enviar']").click(function(){
							resetWarnings();
							if ($(this).parent().parent().find("#name").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe o Nome"});
							}else if ($(this).parent().parent().find("#email").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe o Email"});
							}else if ($(this).parent().parent().find("#password_confirm").val() != $(this).parent().parent().find("#password").val()){
								$(".form-aviso").setWarning({msg: "Confirmação de senha inválida"});
							}else if ($(this).parent().parent().find("#city_id option:selected").val() == "" && $(this).parent().parent().find("#user_role option:selected").val() == "user"){
								$(".form-aviso").setWarning({msg: "Por favor informe a Cidade"});
							}else{
								args = [{name: "api_key", value: $.cookie("key")},
										{name: "user.update.name", value: $(this).parent().parent().find("#name").val()},
										{name: "user.update.email", value: $(this).parent().parent().find("#email").val()},
										{name: "user.update.role", value: $(this).parent().parent().find("#user_role option:selected").val()},
										{name: "user.update.city_id", value: $(this).parent().parent().find("#city_id option:selected").val()}
										];
								if ($(this).parent().parent().find("#prefeito").attr("checked")){
									args.push({name: "user.update.prefeito", value: 1});
								}else{
									args.push({name: "user.update.prefeito", value: 0});
									if ($(this).parent().parent().find("#user_role option:selected").val() == "user"){
										args.push({name: "user.update.movimento", value: 1});
									}
								}

								if ($(this).parent().parent().find("#password").val() != ""){
									args.push({name: "user.update.password", value: $(this).parent().parent().find("#password").val()},
										{name: "user.update.password_confirm", value: $(this).parent().parent().find("#password").val()});
								}
								$("#dashboard-content .content .botao-form[ref='enviar']").hide();
								$.ajax({
									type: 'POST',
									dataType: 'json',
									url: $.getUrlVar("url"),
									data: args,
									success: function(data, textStatus, jqXHR){
										$("#aviso").setWarning({msg: "Cadastro editado com sucesso.".render({
													codigo: jqXHR.status
													})
										});
										location.hash = "#!/"+getUrlSub();
										$("#dashboard-content .content .botao-form[ref='enviar']").show();
									},
									error: function(data){
										$(".form-aviso").setWarning({msg: "Erro ao editar. ($$erro)".render({
													erro: $.parseJSON(data.responseText).error
													})
										});
										$("#dashboard-content .content .botao-form[ref='enviar']").show();
									}
								});
							}
						});
					}
					$("#dashboard-content .content .botao-form[ref='cancelar']").click(function(){
						resetWarnings();
						history.back();
					});
				}else if ($.getUrlVar("option") == "delete"){
					deleteRegister({url:$.getUrlVar("url") + "?api_key=$$key".render({
													key: $.cookie("key")
											})});
				}
			}else if (getUrlSub() == "cities"){
				/*  CIDADES  */
				if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined){

					var userList = buildDataTable({
							headers: ["Nome","Estado","_"]
							});

					$("#dashboard-content .content").append(userList);

					$("#button-add").click(function(){
						resetWarnings();
						location.hash = "#!/" + getUrlSub() + "?option=add";
					});

					$("#results").dataTable( {
						  "oLanguage": {
										"sUrl": api_path + "/frontend/js/dataTables.pt-br.txt"
										},
						  "bProcessing": true,
						  "sAjaxSource": api_path + '/api/city?api_key=$$key&content-type=application/json&columns=name,uf,url,_,_'.render({
								key: $.cookie("key")
								}),
						  "aoColumnDefs": [
                        					{ "bSearchable": false, "bSortable": false, "sClass": "botoes", "sWidth": "60px", "aTargets": [ 2 ] }
                    					  ],
						   "fnDrawCallback": function(){
								DTdesenhaBotoes();
							}
					} );

				}else if ($.getUrlVar("option") == "add" || $.getUrlVar("option") == "edit"){

					var txtOption = ($.getUrlVar("option") == "add") ? "Cadastrar" : "Editar";

					var newform = [];

					newform.push({label: "Nome", input: ["text,name,itext"]});
					newform.push({label: "Estado", input: ["select,uf,iselect"]});
					newform.push({type: "subtitle", title: "Dados da Prefeitura"});
					newform.push({label: "Telefone", input: ["text,telefone_prefeitura,itext"]});
					newform.push({label: "Endereço", input: ["text,endereco_prefeitura,itext"]});
					newform.push({label: "Bairro", input: ["text,bairro_prefeitura,itext"]});
					newform.push({label: "CEP", input: ["text,cep_prefeitura,itext"]});
					newform.push({label: "Email", input: ["text,email_prefeitura,itext"]});
					newform.push({label: "Nome do responsável", input: ["text,nome_responsavel_prefeitura,itext"]});

					var formbuild = $("#dashboard-content .content").append(buildForm(newform,txtOption));
					$(formbuild).find("div .field:odd").addClass("odd");
					$(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

					$(formbuild).find("#name").qtip( $.extend(true, {}, qtip_input, {
							content: "Importante: Nome da Cidade."
					}));

					$.each(estados,function(key, value){
						$("#dashboard-content .content select#uf").append($("<option></option>").val(key).html(value));
					});

					if ($.getUrlVar("option") == "add"){
						$("#dashboard-content .content .botao-form[ref='enviar']").click(function(){
							resetWarnings();
							if ($(this).parent().parent().find("#name").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe o Nome"});
							}else if ($(this).parent().parent().find("#uf option:selected").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe o Estado"});
							}else{
								args = [{name: "api_key", value: $.cookie("key")},
										{name: "city.create.name", value: $(this).parent().parent().find("#name").val()},
										{name: "city.create.uf", value: $(this).parent().parent().find("#uf option:selected").val()},
										{name: "city.create.telefone_prefeitura", value: $(this).parent().parent().find("#telefone_prefeitura").val()},
										{name: "city.create.endereco_prefeitura", value: $(this).parent().parent().find("#endereco_prefeitura").val()},
										{name: "city.create.bairro_prefeitura", value: $(this).parent().parent().find("#bairro_prefeitura").val()},
										{name: "city.create.cep_prefeitura", value: $(this).parent().parent().find("#cep_prefeitura").val()},
										{name: "city.create.email_prefeitura", value: $(this).parent().parent().find("#email_prefeitura").val()},
										{name: "city.create.nome_responsavel_prefeitura", value: $(this).parent().parent().find("#nome_responsavel_prefeitura").val()}
										];
								$("#dashboard-content .content .botao-form[ref='enviar']").hide();
								$.ajax({
									type: 'POST',
									dataType: 'json',
									url: api_path + '/api/city',
									data: args,
									success: function(data,status,jqXHR){
										$("#aviso").setWarning({msg: "Cadastro efetuado com sucesso.".render({
													codigo: jqXHR.status
													})
										});
										location.hash = "#!/"+getUrlSub();
									},
									error: function(data){
										switch(data.status){
											case 400:
												$("#aviso").setWarning({msg: "Erro ao cadastrar. ($$codigo)".render({
															codigo: $.parseJSON(data.responseText).error
															})
												});
												break;
										}
										$("#dashboard-content .content .botao-form[ref='enviar']").show();
									}
								});
							}
						});
					}else if ($.getUrlVar("option") == "edit"){
						$.ajax({
							type: 'GET',
							dataType: 'json',
							url: $.getUrlVar("url") + "?api_key=$$key".render({
										key: $.cookie("key")
								}),
							success: function(data,status,jqXHR){
								switch(jqXHR.status){
									case 200:
										$(formbuild).find("input#name").val(data.name);
										$(formbuild).find("select#uf").val(data.uf);
										$(formbuild).find("input#telefone_prefeitura").val(data.telefone_prefeitura);
										$(formbuild).find("input#endereco_prefeitura").val(data.endereco_prefeitura);
										$(formbuild).find("input#bairro_prefeitura").val(data.bairro_prefeitura);
										$(formbuild).find("input#cep_prefeitura").val(data.cep_prefeitura);
										$(formbuild).find("input#email_prefeitura").val(data.email_prefeitura);
										$(formbuild).find("input#nome_responsavel_prefeitura").val(data.nome_responsavel_prefeitura);
										break;
								}
							},
							error: function(data){
								switch(data.status){
									case 400:
										$(".form-aviso").setWarning({msg: "Erro: ($$codigo)".render({
													codigo: $.parseJSON(data.responseText).error
													})
										});
										break;
								}
							}
						});

						$("#dashboard-content .content .botao-form[ref='enviar']").click(function(){
							resetWarnings();
							if ($(this).parent().parent().find("#name").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe o Nome"});
							}else if ($(this).parent().parent().find("#uf option:selected").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe o Estado"});
							}else{
								args = [{name: "api_key", value: $.cookie("key")},
										{name: "city.update.name", value: $(this).parent().parent().find("#name").val()},
										{name: "city.update.uf", value: $(this).parent().parent().find("#uf option:selected").val()},
										{name: "city.update.telefone_prefeitura", value: $(this).parent().parent().find("#telefone_prefeitura").val()},
										{name: "city.update.endereco_prefeitura", value: $(this).parent().parent().find("#endereco_prefeitura").val()},
										{name: "city.update.bairro_prefeitura", value: $(this).parent().parent().find("#bairro_prefeitura").val()},
										{name: "city.update.cep_prefeitura", value: $(this).parent().parent().find("#cep_prefeitura").val()},
										{name: "city.update.email_prefeitura", value: $(this).parent().parent().find("#email_prefeitura").val()},
										{name: "city.update.nome_responsavel_prefeitura", value: $(this).parent().parent().find("#nome_responsavel_prefeitura").val()}
										];

								$("#dashboard-content .content .botao-form[ref='enviar']").hide();
								$.ajax({
									type: 'POST',
									dataType: 'json',
									url: $.getUrlVar("url"),
									data: args,
									success: function(data, textStatus, jqXHR){
										$("#aviso").setWarning({msg: "Cadastro editado com sucesso.".render({
													codigo: jqXHR.status
													})
										});
										location.hash = "#!/"+getUrlSub();
										$("#dashboard-content .content .botao-form[ref='enviar']").show();
									},
									error: function(data){
										$(".form-aviso").setWarning({msg: "Erro ao editar. ($$erro)".render({
													erro: $.parseJSON(data.responseText).error
													})
										});
										$("#dashboard-content .content .botao-form[ref='enviar']").show();
									}
								});
							}
						});

					}
					$("#dashboard-content .content .botao-form[ref='cancelar']").click(function(){
						resetWarnings();
						history.back();
					});
				}else if ($.getUrlVar("option") == "delete"){
					deleteRegister({url:$.getUrlVar("url") + "?api_key=$$key".render({
													key: $.cookie("key")
											})});
				}
			}else if (getUrlSub() == "units"){
				/*  UNIDADES DE MEDIDA  */
				if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined){

					var userList = buildDataTable({
							headers: ["Nome","Sigla","_"]
							});

					$("#dashboard-content .content").append(userList);

					$("#button-add").click(function(){
						resetWarnings();
						location.hash = "#!/" + getUrlSub() + "?option=add";
					});

					$("#results").dataTable( {
						  "oLanguage": {
										"sUrl": api_path + "/frontend/js/dataTables.pt-br.txt"
										},
						  "bProcessing": true,
						  "sAjaxSource": api_path + '/api/measurement_unit?api_key=$$key&content-type=application/json&columns=name,short_name,url,_,_'.render({
								key: $.cookie("key")
								}),
						  "aoColumnDefs": [
                        					{ "bSearchable": false, "bSortable": false, "sClass": "botoes", "sWidth": "60px", "aTargets": [ 2 ] }
                    					  ],
						   "fnDrawCallback": function(){
								DTdesenhaBotoes();
							}
					} );

				}else if ($.getUrlVar("option") == "add" || $.getUrlVar("option") == "edit"){

					var txtOption = ($.getUrlVar("option") == "add") ? "Cadastrar" : "Editar";

					var newform = [];

					newform.push({label: "Nome", input: ["text,name,itext"]});
					newform.push({label: "Sigla", input: ["text,short_name,itext"]});

					var formbuild = $("#dashboard-content .content").append(buildForm(newform,txtOption));
					$(formbuild).find("div .field:odd").addClass("odd");
					$(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

					$(formbuild).find("#name").qtip( $.extend(true, {}, qtip_input, {
							content: "Nome da unidade de medida. Ex: Quilos"
					}));
					$(formbuild).find("#short_name").qtip( $.extend(true, {}, qtip_input, {
							content: "Sigla da unidade de medida. Ex: Kg, cm, m2"
					}));

					if ($.getUrlVar("option") == "add"){
						$("#dashboard-content .content .botao-form[ref='enviar']").click(function(){
							resetWarnings();
							if ($(this).parent().parent().find("#name").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe o Nome"});
							}else if ($(this).parent().parent().find("#short_name").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe a Sigla"});
							}else{
								args = [{name: "api_key", value: $.cookie("key")},
										{name: "measurement_unit.create.name", value: $(this).parent().parent().find("#name").val()},
										{name: "measurement_unit.create.short_name", value: $(this).parent().parent().find("#short_name").val()}
										];

								$("#dashboard-content .content .botao-form[ref='enviar']").hide();
								$.ajax({
									type: 'POST',
									dataType: 'json',
									url: api_path + '/api/measurement_unit',
									data: args,
									success: function(data,status,jqXHR){
										$("#aviso").setWarning({msg: "Cadastro efetuado com sucesso.".render({
													codigo: jqXHR.status
													})
										});
										location.hash = "#!/"+getUrlSub();
									},
									error: function(data){
										switch(data.status){
											case 400:
												$("#aviso").setWarning({msg: "Erro ao cadastrar. ($$codigo)".render({
															codigo: $.parseJSON(data.responseText).error
															})
												});
												break;
										}
										$("#dashboard-content .content .botao-form[ref='enviar']").show();
									}
								});
							}
						});
					}else if ($.getUrlVar("option") == "edit"){
						$.ajax({
							type: 'GET',
							dataType: 'json',
							url: $.getUrlVar("url") + "?api_key=$$key".render({
										key: $.cookie("key")
								}),
							success: function(data,status,jqXHR){
								switch(jqXHR.status){
									case 200:
										$(formbuild).find("input#name").val(data.name);
										$(formbuild).find("input#short_name").val(data.short_name);
										break;
								}
							},
							error: function(data){
								switch(data.status){
									case 400:
										$(".form-aviso").setWarning({msg: "Erro: ($$codigo)".render({
													codigo: $.parseJSON(data.responseText).error
													})
										});
										break;
								}
							}
						});

						$("#dashboard-content .content .botao-form[ref='enviar']").click(function(){
							resetWarnings();
							if ($(this).parent().parent().find("#name").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe o Nome"});
							}else if ($(this).parent().parent().find("#short_name").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe a Sigla"});
							}else{
								args = [{name: "api_key", value: $.cookie("key")},
										{name: "measurement_unit.update.name", value: $(this).parent().parent().find("#name").val()},
										{name: "measurement_unit.update.short_name", value: $(this).parent().parent().find("#short_name").val()}
										];

								$("#dashboard-content .content .botao-form[ref='enviar']").hide();
								$.ajax({
									type: 'POST',
									dataType: 'json',
									url: $.getUrlVar("url"),
									data: args,
									success: function(data, textStatus, jqXHR){
										$("#aviso").setWarning({msg: "Cadastro editado com sucesso.".render({
													codigo: jqXHR.status
													})
										});
										location.hash = "#!/"+getUrlSub();
										$("#dashboard-content .content .botao-form[ref='enviar']").show();
									},
									error: function(data){
										$(".form-aviso").setWarning({msg: "Erro ao editar. ($$erro)".render({
													erro: $.parseJSON(data.responseText).error
													})
										});
										$("#dashboard-content .content .botao-form[ref='enviar']").show();
									}
								});
							}
						});

					}
					$("#dashboard-content .content .botao-form[ref='cancelar']").click(function(){
						resetWarnings();
						history.back();
					});
				}else if ($.getUrlVar("option") == "delete"){
					deleteRegister({url:$.getUrlVar("url") + "?api_key=$$key".render({
													key: $.cookie("key")
											})});
				}
			}else if (getUrlSub() == "variable"){
				/*  VARIABLE  */
				if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined){

					var variableList = buildDataTable({
							headers: ["Nome","Apelido","Tipo","Data Criação","Básica","_"]
							});

					$("#dashboard-content .content").append(variableList);

					$("#button-add").click(function(){
						resetWarnings();
						location.hash = "#!/" + getUrlSub() + "?option=add";
					});

					$("#results").dataTable( {
						  "oLanguage": {
										"sUrl": api_path + "/frontend/js/dataTables.pt-br.txt"
										},
						  "bProcessing": true,
						  "sAjaxSource": api_path + '/api/variable?api_key=$$key&content-type=application/json&columns=name,cognomen,type,created_at,is_basic,url,_,_'.render({
								key: $.cookie("key")
								}),
						  "aoColumnDefs": [
                        					{ "bSearchable": false, "bSortable": false, "sClass": "botoes", "sWidth": "80px", "aTargets": [ 5 ] },
                        					{ "bSearchable": false, "bSortable": false, "sClass": "center is_basic", "aTargets": [ 4 ] },
                        					{ "sClass": "center", "aTargets": [ 2 , 3, 4 ] },
                        					{ "sWidth": "300px", "aTargets": [ 0 ] },
											{ "fnRender": function ( oObj, sVal ) {
									        	            return variable_types[sVal];
							    	          			  }, "aTargets": [ 2 ]
											},
											{ "fnRender": function ( oObj, sVal ) {
									        	            return $.format.date(sVal,"dd/MM/yyyy HH:mm:ss");
							    	          			  }, "aTargets": [ 3 ]
											},
											{ "fnRender": function ( oObj, sVal ) {
															var text = sVal;
															var count = 20;
															if(sVal.length > count) {
															   text = text.substring(0, count) + "...";
															}

									        	            return text;
							    	          			  }, "aTargets": [ 1 ]
											}
                    					  ],
						   "aaSorting": [[3,'desc'],[0,'asc']],
						   "fnDrawCallback": function(){
								DTdesenhaBotoes();
								$("#results td.is_basic").each( function(){
									if ($(this).html() == "1"){

										$(this).html("Sim");
									}else if ($(this).html() == "0"){
										$(this).html("Não");
									}
								});

							}
					} );

				}else if ($.getUrlVar("option") == "add" || $.getUrlVar("option") == "edit"){

					var txtOption = ($.getUrlVar("option") == "add") ? "Cadastrar" : "Editar";

					var newform = [];

					newform.push({label: "Nome", input: ["text,name,itext"]});
					newform.push({label: "Apelido", input: ["text,cognomen,itext"]});
					newform.push({label: "Explicação", input: ["textarea,explanation,itext"]});
					newform.push({label: "Tipo", input: ["select,type,iselect"]});
					newform.push({label: "Unidade de Medida", input: ["select,measurement_unit,iselect"]});
					newform.push({label: "Período", input: ["select,period,iselect"]});
					newform.push({label: "Fonte", input: ["select,source,iselect source","text,source_new,itext300px"]});
					newform.push({label: "Variável básica", input: ["checkbox,is_basic,icheckbox"]});

					var formbuild = $("#dashboard-content .content").append(buildForm(newform,txtOption));
					$(formbuild).find("div .field:odd").addClass("odd");
					$(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

					setNewSource($("#dashboard-content .content select#source"),$("#dashboard-content .content input#source_new"));

					$(formbuild).find("#name").qtip( $.extend(true, {}, qtip_input, {
							content: "Nome da variável."
					}));
					$(formbuild).find("#cognomen").qtip( $.extend(true, {}, qtip_input, {
							content: "Nome amigável/abreviado para a Variável.<br />Ex: Desnutrição infantil > Apelido: 'Desnut_Infantil' ou 'Desn.Infant'"
					}));
					$(formbuild).find("#explanation").qtip( $.extend(true, {}, qtip_input, {
							content: "Explicação breve sobre a Variável."
					}));
					$(formbuild).find("#type").qtip( $.extend(true, {}, qtip_input, {
							content: "Ex:<br />Inteiro = 10<br />Alfanumérico = Azul<br />Valor = 100,00"
					}));
					$(formbuild).find("#is_basic").qtip( $.extend(true, {}, qtip_input, {
							content: "Marcar essa opção para variáveis básicas."
					}));

					$.each(variable_types,function(key, value){
						$("#dashboard-content .content select#type").append($("<option></option>").val(key).html(value));
					});

					loadUnidades();

					$("#dashboard-content .content select#measurement_unit").append($("<option></option>").val("").html("nenhuma"));
					$.each(measurement_units,function(index, item){
						$("#dashboard-content .content select#measurement_unit").append($("<option></option>").val(item.id).html(item.name));
					});

					loadSources();

					loadComboSources(sources,$("#dashboard-content .content select#source"),$("#dashboard-content .content input#source_new"));

					$.each(variable_periods,function(key, value){
						$("#dashboard-content .content select#period").append($("<option></option>").val(key).html(value));
					});

					if ($.getUrlVar("option") == "add"){
						$("#dashboard-content .content .botao-form[ref='enviar']").click(function(){
							resetWarnings();
							if ($(this).parent().parent().find("#name").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe o Nome"});
							}else if ($(this).parent().parent().find("#cognomen").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe o Apelido"});
							}else{

								args = [{name: "api_key", value: $.cookie("key")},
										{name: "variable.create.name", value: $(this).parent().parent().find("#name").val()},
										{name: "variable.create.cognomen", value: $(this).parent().parent().find("#cognomen").val()},
										{name: "variable.create.explanation", value: $(this).parent().parent().find("#explanation").val()},
										{name: "variable.create.type", value: $(this).parent().parent().find("#type option:selected").val()},
										{name: "variable.create.measurement_unit_id", value: $(this).parent().parent().find("#measurement_unit option:selected").val()},
										{name: "variable.create.period", value: $(this).parent().parent().find("#period option:selected").val()}
										];

								args.push({name: "variable.create.source", value: $(this).parent().parent().find("#source option:selected").val()});

								if ($(this).parent().parent().find("#is_basic").attr("checked")){
									args.push({name: "variable.create.is_basic", value: 1});
								}else{
									args.push({name: "variable.create.is_basic", value: 0});
								}

								$("#dashboard-content .content .botao-form[ref='enviar']").hide();
								$.ajax({
									type: 'POST',
									dataType: 'json',
									url: api_path + '/api/variable',
									data: args,
									success: function(data,status,jqXHR){
										$("#aviso").setWarning({msg: "Cadastro efetuado com sucesso.".render({
													codigo: jqXHR.status
													})
										});
										location.hash = "#!/"+getUrlSub();
									},
									error: function(data){
										switch(data.status){
											case 400:
												$("#aviso").setWarning({msg: "Erro ao cadastrar. ($$codigo)".render({
															codigo: $.parseJSON(data.responseText).error
															})
												});
												break;
										}
										$("#dashboard-content .content .botao-form[ref='enviar']").show();
									}
								});
							}
						});
					}else if ($.getUrlVar("option") == "edit"){
						$.ajax({
							type: 'GET',
							dataType: 'json',
							url: $.getUrlVar("url") + "?api_key=$$key".render({
										key: $.cookie("key")
								}),
							success: function(data,status,jqXHR){
								switch(jqXHR.status){
									case 200:
										$(formbuild).find("input#name").val(data.name);
										$(formbuild).find("input#cognomen").val(data.cognomen);
										$(formbuild).find("textarea#explanation").val(data.explanation);
										$(formbuild).find("select#type").val(data.type);
										if (data.measurement_unit){
											$(formbuild).find("select#measurement_unit").val(data.measurement_unit.id);
										}
										$(formbuild).find("select#period").val(data.period);
										$(formbuild).find("select#source").val(data.source);
										if ($(formbuild).find("select#source option:selected").val() != ""){
											$("#dashboard-content .content a#delete-source").show();
										}

										if (data.is_basic == 1){
											$(formbuild).find("input#is_basic").attr("checked",true);
										}else{
											$(formbuild).find("input#is_basic").attr("checked",false);
										}
										break;
								}
							},
							error: function(data){
								switch(data.status){
									case 400:
										$(".form-aviso").setWarning({msg: "Erro: ($$codigo)".render({
													codigo: $.parseJSON(data.responseText).error
													})
										});
										break;
								}
							}
						});

						$("#dashboard-content .content .botao-form[ref='enviar']").click(function(){
							resetWarnings();
							if ($(this).parent().parent().find("#name").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe o Nome"});
							}else if ($(this).parent().parent().find("#cognomen").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe o Apelido"});
							}else{

								args = [{name: "api_key", value: $.cookie("key")},
										{name: "variable.update.name", value: $(this).parent().parent().find("#name").val()},
										{name: "variable.update.cognomen", value: $(this).parent().parent().find("#cognomen").val()},
										{name: "variable.update.explanation", value: $(this).parent().parent().find("#explanation").val()},
										{name: "variable.update.type", value: $(this).parent().parent().find("#type option:selected").val()},
										{name: "variable.update.measurement_unit_id", value: $(this).parent().parent().find("#measurement_unit option:selected").val()},
										{name: "variable.update.period", value: $(this).parent().parent().find("#period option:selected").val()}
										];

								args.push({name: "variable.update.source", value: $(this).parent().parent().find("#source option:selected").val()});

								if ($(this).parent().parent().find("#is_basic").attr("checked")){
									args.push({name: "variable.update.is_basic", value: 1});
								}else{
									args.push({name: "variable.update.is_basic", value: 0});
								}

								$("#dashboard-content .content .botao-form[ref='enviar']").hide();
								$.ajax({
									type: 'POST',
									dataType: 'json',
									url: $.getUrlVar("url"),
									data: args,
									success: function(data, textStatus, jqXHR){
										$("#aviso").setWarning({msg: "Cadastro editado com sucesso.".render({
													codigo: jqXHR.status
													})
										});
										location.hash = "#!/"+getUrlSub();
										$("#dashboard-content .content .botao-form[ref='enviar']").show();
									},
									error: function(data){
										$(".form-aviso").setWarning({msg: "Erro ao editar. ($$erro)".render({
													erro: $.parseJSON(data.responseText).error
													})
										});
										$("#dashboard-content .content .botao-form[ref='enviar']").show();
									}
								});
							}
						});
					}
					$("#dashboard-content .content .botao-form[ref='cancelar']").click(function(){
						resetWarnings();
						history.back();
					});
				}else if ($.getUrlVar("option") == "delete"){

					deleteRegister({url:$.getUrlVar("url") + "?api_key=$$key".render({
													key: $.cookie("key")
											})});
				}
			}else if (getUrlSub() == "myvariable"){
				/*  VARIABLE  */
				if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined){

					var variableList = buildDataTable({
							headers: ["Nome","_"]
							},null,false);

					$("#dashboard-content .content").append(variableList);

					$("#button-add").click(function(){
						resetWarnings();
						location.hash = "#!/" + getUrlSub() + "?option=add";
					});

					$.ajax({
						type: 'GET',
						dataType: 'json',
						url: api_path + '/api/user/$$userid/variable?api_key=$$key&is_basic=1'.render({
								key: $.cookie("key"),
								userid: $.cookie("user.id")
								}),
						success: function(data, textStatus, jqXHR){
							$.each(data.variables, function(index,value){
								$("#dashboard-content .content #results tbody").append($("<tr><td>$$nome</td><td>$$url</td></tr>".render({nome: data.variables[index].name,
								apelido: data.variables[index].cognomen,
								url: data.variables[index].variable_id})));
							});

							$("#results").dataTable( {
								  "oLanguage": {
												"sUrl": api_path + "/frontend/js/dataTables.pt-br.txt"
												},
								  "aoColumnDefs": [
													{ "bSearchable": false, "bSortable": false, "sClass": "botoes", "sWidth": "60px", "aTargets": [ 1 ] },
												  ],
								   "fnDrawCallback": function(){
										DTdesenhaBotaoVariavel();
									}
							} );
						},
						error: function(data){
							$("#aviso").setWarning({msg: "Erro ao carregar ($$codigo)".render({
										codigo: $.parseJSON(data.responseText).error
									})
							});
						}
					});

				}else if ($.getUrlVar("option") == "edit"){

					var txtOption = "Adicionar Valor";

					$.ajax({
						type: 'GET',
						dataType: 'json',
						url: $.getUrlVar("url") + "?api_key=$$key".render({
									key: $.cookie("key")
							}),
						success: function(data,status,jqXHR){
							if (jqXHR.status == 200){

								var newform = [];

								newform.push({label: "Variável", input: ["textlabel,textlabel_variable,ilabel"]});
								newform.push({label: "Valor", input: ["text,value,itext"]});

								newform.push({label: "Período", input: ["textlabel,textlabel_period,ilabel"]});
								if (data.period == "yearly"){
									newform.push({label: "Data", input: ["select,value_of_date,iselect"]});
								}else if(data.period == "monthly"){
									newform.push({label: "Data", input: ["select,value_of_date_year,iselect","select,value_of_date,iselect"]});
								}else if(data.period == "daily"){
									newform.push({label: "Data", input: ["text,value_of_date,itext"]});
								}
								newform.push({label: "Descrição", input: ["textlabel,textlabel_explanation,ilabel"]});

								var formbuild = $("#dashboard-content .content").append(buildForm(newform,txtOption));

								if (data.period == "yearly"){
									$.ajax({
										type: 'GET',
										dataType: 'json',
										url: api_path + '/api/period/year?api_key=$$key'.render({
												key: $.cookie("key")
											}),
										success: function(data, textStatus, jqXHR){
											$("#dashboard-content .content select#value_of_date option").remove();
											$.each(data.options, function(index,value){
												$("#dashboard-content .content select#value_of_date").append("<option value='$$value'>$$text</option>".render({
													text:data.options[index].text,
													value:data.options[index].value
													}));
											});
											$("#dashboard-content .content select#value_of_date option:last").attr("selected","selected");
										}
									});
								}else if(data.period == "monthly"){
									$("#dashboard-content .content select#value_of_date").hide();
									$.ajax({
										type: 'GET',
										dataType: 'json',
										url: api_path + '/api/period/year?api_key=$$key'.render({
												key: $.cookie("key")
											}),
										success: function(data, textStatus, jqXHR){
											$("#dashboard-content .content select#value_of_date_year option").remove();
											$("#dashboard-content .content select#value_of_date_year").append("<option value=''>Selecione o ano</option>");
											$.each(data.options, function(index,value){
												$("#dashboard-content .content select#value_of_date_year").append("<option value='$$value'>$$text</option>".render({
													text:data.options[index].text,
													value:data.options[index].value
													}));
											});
											$("#dashboard-content .content select#value_of_date option:last").attr("selected","selected");

											$("#dashboard-content .content select#value_of_date_year").change(function(){
												$("#dashboard-content .content select#value_of_date option").remove();
												$("#dashboard-content .content select#value_of_date").hide();
												if ($(this).find("option:selected").val() != ""){
													$("#dashboard-content .content select#value_of_date").show();
													$.ajax({
														type: 'GET',
														dataType: 'json',
														url: api_path + '/api/period/year/$$year/month?api_key=$$key'.render({
																key: $.cookie("key"),
																year: $("#dashboard-content .content select#value_of_date_year option:selected").html()
															}),
														success: function(data, textStatus, jqXHR){
															$.each(data.options, function(index,value){
																$("#dashboard-content .content select#value_of_date").append("<option value='$$value'>$$text</option>".render({
																	text:data.options[index].text,
																	value:data.options[index].value
																	}));
															});
														}
													});
												}
											});
										}
									});
								}else if(data.period == "daily"){
									$("#dashboard-content .content input#value_of_date").datepicker({
																									dateFormat: 'dd/mm/yy',
																									defaultDate: "0",
																									changeMonth: true,
																									changeYear: true
																									});
								}

								$("#dashboard-content .content .botao-form[ref='enviar']").html("Adicionar");
								$("#dashboard-content .content .botao-form[ref='cancelar']").html("Voltar");
								$(formbuild).find("div .field:odd").addClass("odd");
								$(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());
								$("#dashboard-content .content div.historic table").width($("#dashboard-content .content").find(".form").width());

								$(formbuild).find("div#textlabel_variable").html(data.name);
								$(formbuild).find("div#textlabel_explanation").html(data.explanation);
								$(formbuild).find("div#textlabel_period").html(variable_periods[data.period]);


								$("#dashboard-content .content .botao-form[ref='enviar']").click(function(){

									if ($(this).html() == "Adicionar"){
										var ajax_type = "POST";
										var api_method = "create";
										var ajax_url = $.getUrlVar("url") + "/value";
									}else if ($(this).html() == "Editar"){
										var ajax_type = "POST";
										var api_method = "update";
										var ajax_url = $.getUrlVar("url") + "/value/" + $("table.history tbody tr.selected").attr("value-id");
									}

									resetWarnings();
									if ($(this).parent().parent().find("#value").val() == ""){
										$(".form-aviso").setWarning({msg: "Por favor informe o Valor"});
									}else{
										var data_formatada = "";
										if (data.period == "yearly" || data.period == "monthly"){
											data_formatada = $(this).parent().parent().find("#value_of_date option:selected").val();
										}else if (data.period == "daily"){
											data_formatada = $.convertDate($(this).parent().parent().find("#value_of_date").val()," ");
										}
										args = [{name: "api_key", value: $.cookie("key")},
												{name: "variable.value." + api_method + ".value", value: $(this).parent().parent().find("#value").val()},
												{name: "variable.value." + api_method + ".value_of_date", value: data_formatada},
												{name: "variable.value." + api_method + ".variable_id", value: getIdFromUrl($.getUrlVar("url"))},
												];

										$("#dashboard-content .content .botao-form[ref='enviar']").hide();
										$.ajax({
											type: ajax_type,
											dataType: 'json',
											url: ajax_url,
											data: args,
											success: function(data, textStatus, jqXHR){
												resetWarnings();
												$("#aviso").setWarning({msg: "Cadastro editado com sucesso.".render({
															codigo: jqXHR.status
															})
												});
												$("#dashboard-content .content .botao-form[ref='enviar']").html("Adicionar");
												$("#dashboard-content .content .botao-form[ref='cancelar']").html("Voltar");
												$("#dashboard-content .content .form").find(".title").html("Adicionar Valor");
												$(formbuild).find("input#value").val("");
												$(formbuild).find("#value_of_date").val("");
												$("#dashboard-content .content .form").find("select").attr("disabled",false);
												$("table.history tbody tr").removeClass("selected");
												buildVariableHistory();
											},
											error: function(data){
												$(".form-aviso").setWarning({msg: "Erro ao editar. Já existe valor para esse Período".render({
															erro: $.parseJSON(data.responseText).error
															})
												});
												$("#dashboard-content .content .botao-form[ref='cancelar']").html("Voltar");
											},
											complete: function(data){
												$("#dashboard-content .content .botao-form[ref='enviar']").show();
											}
										});
									}
								});
								$("#dashboard-content .content .botao-form[ref='cancelar']").click(function(){
									resetWarnings();
									if ($(this).html() == "Voltar"){
										history.back();
									}else if ($(this).html() == "Cancelar"){
										$("#dashboard-content .content .form").find(".title").html("Adicionar Valor");
										$("#dashboard-content .content .botao-form[ref='enviar']").html("Adicionar");
										$("#dashboard-content .content .botao-form[ref='cancelar']").html("Voltar");
										$(formbuild).find("input#value").val("");
										$(formbuild).find("input#value_of_date").val("");
										$("#dashboard-content .content .form").find("select").attr("disabled",false);
										$("table.history tbody tr").removeClass("selected");
										$("#dashboard-content .content .botao-form[ref='enviar']").show();
									}
								});
							}

							$("#dashboard-content .content").append("<div class='historico'></div>");

							buildVariableHistory();
						},
						error: function(data){
							switch(data.status){
								case 400:
									$(".form-aviso").setWarning({msg: "Erro: ($$codigo)".render({
												codigo: $.parseJSON(data.responseText).error
												})
									});
									break;
							}
						}
					});
				}
			}else if (getUrlSub() == "myvariableedit"){
				/*  VARIABLE  */
				if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined){

					$("#dashboard-content .content").append("<div class='variable-filter'><div class='form-pesquisa'></div></div><div class='clear'></div>");
					if (user_info.roles[0] == "admin"){
						$("#dashboard-content .content .variable-filter .form-pesquisa").append("<div class='user'>Usuário: <select id='user-id'></select></div>");
						$("#dashboard-content .content #user-id").append($("<option value=''>Selecione...</option>"));

						$.ajax({
							async: false,
							type: 'GET',
							dataType: 'json',
							url: api_path + '/api/user/?api_key=$$key'.render({
									key: $.cookie("key")
									}),
							success: function(data, textStatus, jqXHR){
								data.users.sort(function (a, b) {
									a = a.name,
									b = b.name;

									return a.localeCompare(b);
								});
								$.each(data.users, function(index,item){
									if (item.city){
										$("#dashboard-content .content #user-id").append($("<option value='$$id'>$$nome</option>".render({
											id: getIdFromUrl(item.url),
											nome: item.name
										})));
									}
								});
							}
						});
					}

					$("#dashboard-content .content .variable-filter .form-pesquisa").append("<div class='variable'>Variável: <select id='variable_id'></select></div>");

					function carregaVariaveisEdit(){
						$("#dashboard-content .content #variable_id option").remove();
						$("#dashboard-content .content #variable_id").append($("<option value=''>Todas</option>"));
						$.ajax({
							async: false,
							type: 'GET',
							dataType: 'json',
							url: api_path + '/api/user/$$userid/variable?api_key=$$key'.render({
									key: $.cookie("key"),
									userid: (user_info.roles[0] == "admin") ? $("#dashboard-content .content #user-id option:selected").val() : $.cookie("user.id")
									}),
							success: function(data, textStatus, jqXHR){
								data.variables.sort(function (a, b) {
									a = a.name,
									b = b.name;

									return a.localeCompare(b);
								});
								$.each(data.variables, function(index,item){
									$("#dashboard-content .content #variable_id").append($("<option value='$$id'>$$nome</option>".render({
										id: item.variable_id,
										nome: item.name
									})));
								});
							}
						});
					}

					$("#dashboard-content .content .variable-filter .form-pesquisa").append("<div class='data'>de <input id='data_ini'> até <input id='data_fim'></div>");
					$("#dashboard-content .content .variable-filter .form-pesquisa").append("<div class='botao'><input type='button' id='botao-pesquisar' value='Pesquisar'></div><div class='clear'></div>");

					$("#dashboard-content .content .variable-filter #botao-pesquisar").click(function(){
						carregaTabelaVariaveisEdit();
					});

					$("#dashboard-content .content .variable-filter input#data_ini").datepicker({
																					dateFormat: 'dd/mm/yy',
																					defaultDate: "-30",
																					changeYear: true,
																					changeMonth: true,
																					onSelect: function( selectedDate ){
																						$("#data_fim").datepicker("option","minDate", $( this ).datepicker("getDate") );
																					}
																					});

					$("#dashboard-content .content .variable-filter input#data_fim").datepicker({
																					dateFormat: 'dd/mm/yy',
																					defaultDate: "0",
																					maxDate: "0",
																					minDate: "0",
																					changeYear: true,
																					changeMonth: true
																					});

					var now = new Date();
					now.setDate(now.getDate() - (10*365));
					$("#dashboard-content .content .variable-filter input#data_ini").datepicker("setDate", now);
					$("#dashboard-content .content .variable-filter input#data_fim").datepicker("setDate", new Date());

					$("#dashboard-content .content").append("<div class='resultado'></div>");

					if (user_info.roles[0] != "admin"){
						carregaVariaveisEdit();
					}else{
						$("#dashboard-content .content .variable-filter #botao-pesquisar").attr("disabled","disabled");
						$("#dashboard-content .content .variable-filter #user-id").change(function(){
							if ($(this).find("option:selected").val() != ""){
								carregaVariaveisEdit();
								$("#dashboard-content .content .variable-filter #botao-pesquisar").attr("disabled",false);
							}else{
								$("#dashboard-content .content .variable-filter #botao-pesquisar").attr("disabled","disabled");
							}
						});
					}

					function carregaTabelaVariaveisEdit(){

						$("#dashboard-content .content .resultado").empty();

						var variableList = buildDataTable({
								headers: ["Nome","Data","Valor","_"]
								},null,false);

						$("#dashboard-content .content .resultado").append(variableList);

						var data_ini = $("#dashboard-content .content .variable-filter input#data_ini").val().split("/");
						var data_fim = $("#dashboard-content .content .variable-filter input#data_fim").val().split("/");

						var variavel_id = "";
						if ($("#dashboard-content .content .variable-filter .variable #variable_id option:selected").val() != ""){
							variavel_id = "&variable_id=" + $("#dashboard-content .content .variable-filter .variable #variable_id option:selected").val();
						}

						$.ajax({
							type: 'GET',
							dataType: 'json',
							url: api_path + '/api/user/$$userid/variable?api_key=$$key&valid_from_begin=$$data_ini&valid_from_end=$$data_fim$$variavel'.render({
									key: $.cookie("key"),
									userid: (user_info.roles[0] == "admin") ? $("#dashboard-content .content #user-id option:selected").val() : $.cookie("user.id"),
									data_ini: data_ini[2] + "-" + data_ini[1] + "-" + data_ini[0],
									data_fim: data_fim[2] + "-" + data_fim[1] + "-" + data_fim[0],
									variavel: variavel_id
									}),
							success: function(data, textStatus, jqXHR){
								$.each(data.variables, function(index,item){
									if (item.values.length > 0){
										$.each(item.values, function (index2,valor){
											var data_formatada;
											if (item.period == "yearly"){
												data_formatada = $.format.date(valor.value_of_date,"yyyy");
											}else if (item.period == "daily"){
												data_formatada = $.convertDate(valor.value_of_date," ");
											}

											$("#dashboard-content .content #results tbody").append($("<tr><td>$$nome</td><td data='$$date_of_value'>$$data</td><td>$$valor</td><td>$$url</td></tr>".render({nome: item.name,
											data: data_formatada,
											date_of_value: valor.value_of_date,
											valor: valor.value,
											url: valor.url})));
										});
									}
								});

								$("#results").dataTable( {
									  "oLanguage": {
													"sUrl": api_path + "/frontend/js/dataTables.pt-br.txt"
													},
									  "aoColumnDefs": [
														{ "bSearchable": false, "bSortable": false, "sClass": "botoes", "sWidth": "10px", "aTargets": [ 3 ] },
														{ "bSearchable": false, "bSortable": false, "sClass": "input", "aTargets": [ 2 ] },
														{ "bSearchable": false, "bSortable": false, "sClass": "data center", "aTargets": [ 1 ] },
														{ "sClass": "center", "aTargets": [ 2 ] },
													  ],
									   "aaSorting": [[ 0 , "asc" ],[ 1 , "desc" ]],
									   "fnDrawCallback": function(){
											$("#results td.botoes").each( function(){
												if ($(this).find("a").length <= 0){
													var url = $(this).html();
													$(this).html( "<a href='#' url='$$url' class='icone edit save' title='Salvar Valor' alt='editar'>Salvar valor</a>".render({
															url: url
													}));
												}
											});
											$("#results td.input").each( function(){
												if ($(this).find("input").length <= 0){
													if ($(this).find("a").length <= 0){
														$(this).html( "<input type='text' class='input' width='10' value='$$valor'>".render({
																valor: $(this).html()
														}));
													}
												}
											});
										}
								} );

								$("#results td.botoes a.save").live('click',function(e){
									e.preventDefault();
									var valor = $(this).parent().parent().find("td.input input.input").val();
									var url = $(this).attr("url");
									var data = $(this).parent().parent().find("td.data").attr("data");

									args = [{name: "api_key", value: $.cookie("key")},
											{name: "variable.value.update.value", value: valor},
											{name: "variable.value.update.value_of_date", value: data}
											];

									$.ajax({
										async: false,
										type: 'POST',
										dataType: 'json',
										url: url,
										data: args,
										success: function(data,status,jqXHR){
											$("#aviso").setWarning({msg: "Registro atualizado com sucesso.".render({
														codigo: jqXHR.status
														})
											});
										},
										error: function(data){
											switch(data.status){
												case 400:
													$("#aviso").setWarning({msg: "Erro ao atualizar. ($$codigo)".render({
																codigo: $.parseJSON(data.responseText).error
																})
													});
													break;
											}
										}
									});

								});

							},
							error: function(data){
								$("#aviso").setWarning({msg: "Erro ao carregar ($$codigo)".render({
											codigo: $.parseJSON(data.responseText).error
										})
								});
							}
						});
					}
				}
			}else if (getUrlSub() == "axis"){
				/*  EIXOS  */
				if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined){

					var axisList = buildDataTable({
							headers: ["Nome","_"]
							});

					$("#dashboard-content .content").append(axisList);

					$("#button-add").click(function(){
						resetWarnings();
						location.hash = "#!/" + getUrlSub() + "?option=add";
					});

					$("#results").dataTable( {
						  "oLanguage": {
										"sUrl": api_path + "/frontend/js/dataTables.pt-br.txt"
										},
						  "bProcessing": true,
						  "sAjaxSource": api_path + '/api/axis?api_key=$$key&content-type=application/json&columns=name,url,_,_'.render({
								key: $.cookie("key")
								}),
						  "aoColumnDefs": [
                        					{ "bSearchable": false, "bSortable": false, "sClass": "botoes", "sWidth": "60px", "aTargets": [ 1 ] }
                    					  ],
						   "fnDrawCallback": function(){
								DTdesenhaBotoes();
							}
					} );

				}else if ($.getUrlVar("option") == "add" || $.getUrlVar("option") == "edit"){

					var txtOption = ($.getUrlVar("option") == "add") ? "Cadastrar" : "Editar";

					var newform = [];

					newform.push({label: "Nome", input: ["text,name,itext"]});

					var formbuild = $("#dashboard-content .content").append(buildForm(newform,txtOption));
					$(formbuild).find("div .field:odd").addClass("odd");
					$(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

					$(formbuild).find("#name").qtip( $.extend(true, {}, qtip_input, {
							content: "Nome do eixo. Ex: Ação Local para Saúde, Bens Naturais Comuns"
					}));

					if ($.getUrlVar("option") == "add"){
						$("#dashboard-content .content .botao-form[ref='enviar']").click(function(){
							resetWarnings();
							if ($(this).parent().parent().find("#name").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe o Nome"});
							}else{
								args = [{name: "api_key", value: $.cookie("key")},
										{name: "axis.create.name", value: $(this).parent().parent().find("#name").val()}
										];

								$("#dashboard-content .content .botao-form[ref='enviar']").hide();
								$.ajax({
									type: 'POST',
									dataType: 'json',
									url: api_path + '/api/axis',
									data: args,
									success: function(data,status,jqXHR){
										$("#aviso").setWarning({msg: "Cadastro efetuado com sucesso.".render({
													codigo: jqXHR.status
													})
										});
										location.hash = "#!/"+getUrlSub();
									},
									error: function(data){
										switch(data.status){
											case 400:
												$("#aviso").setWarning({msg: "Erro ao cadastrar. ($$codigo)".render({
															codigo: $.parseJSON(data.responseText).error
															})
												});
												break;
										}
										$("#dashboard-content .content .botao-form[ref='enviar']").show();
									}
								});
							}
						});
					}else if ($.getUrlVar("option") == "edit"){
						$.ajax({
							type: 'GET',
							dataType: 'json',
							url: $.getUrlVar("url") + "?api_key=$$key".render({
										key: $.cookie("key")
								}),
							success: function(data,status,jqXHR){
								switch(jqXHR.status){
									case 200:
										$(formbuild).find("input#name").val(data.name);
										break;
								}
							},
							error: function(data){
								switch(data.status){
									case 400:
										$(".form-aviso").setWarning({msg: "Erro: ($$codigo)".render({
													codigo: $.parseJSON(data.responseText).error
													})
										});
										break;
								}
							}
						});

						$("#dashboard-content .content .botao-form[ref='enviar']").click(function(){
							resetWarnings();
							if ($(this).parent().parent().find("#name").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe o Nome"});
							}else{
								args = [{name: "api_key", value: $.cookie("key")},
										{name: "axis.update.name", value: $(this).parent().parent().find("#name").val()}
										];

								$("#dashboard-content .content .botao-form[ref='enviar']").hide();
								$.ajax({
									type: 'POST',
									dataType: 'json',
									url: $.getUrlVar("url"),
									data: args,
									success: function(data, textStatus, jqXHR){
										$("#aviso").setWarning({msg: "Cadastro editado com sucesso.".render({
													codigo: jqXHR.status
													})
										});
										location.hash = "#!/"+getUrlSub();
										$("#dashboard-content .content .botao-form[ref='enviar']").show();
									},
									error: function(data){
										$(".form-aviso").setWarning({msg: "Erro ao editar. ($$erro)".render({
													erro: $.parseJSON(data.responseText).error
													})
										});
										$("#dashboard-content .content .botao-form[ref='enviar']").show();
									}
								});
							}
						});

					}
					$("#dashboard-content .content .botao-form[ref='cancelar']").click(function(){
						resetWarnings();
						history.back();
					});
				}else if ($.getUrlVar("option") == "delete"){
					deleteRegister({url:$.getUrlVar("url") + "?api_key=$$key".render({
													key: $.cookie("key")
											})});
				}
			}else if (getUrlSub() == "indicator"){
				/*  INDICATOR  */
				if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined){

					var indicatorList = buildDataTable({
							headers: ["Nome","Formula","Data Criação","_"]
							});

					$("#dashboard-content .content").append(indicatorList);

					$("#button-add").click(function(){
						resetWarnings();
						location.hash = "#!/" + getUrlSub() + "?option=add";
					});

					var data_variables = [];
					$.ajax({
						async: false,
						type: 'GET',
						dataType: 'json',
						url: api_path + '/api/variable?api_key=$$key'.render({
								key: $.cookie("key"),
								userid: $.cookie("user.id")
								}),
						success: function(data, textStatus, jqXHR){

							$.each(data.variables, function(index,value){
								data_variables.push({"id":data.variables[index].id,"name":data.variables[index].name});
							});
						}

					});

					var data_vvariables = [];
					$.ajax({
						async: false,
						type: 'GET',
						dataType: 'json',
						url: api_path + '/api/indicator/variable?api_key=$$key'.render({
								key: $.cookie("key"),
								userid: $.cookie("user.id")
								}),
						success: function(data, textStatus, jqXHR){

							$.each(data.variables, function(index,value){
								data_vvariables.push({"id":data.variables[index].id,"name":data.variables[index].name});
							});
						}

					});

					$("#results").dataTable( {
						  "oLanguage": {
										"sUrl": api_path + "/frontend/js/dataTables.pt-br.txt"
										},
						  "bProcessing": true,
						  "sAjaxSource": api_path + '/api/indicator?api_key=$$key&content-type=application/json&columns=name,formula,created_at,url,_,_'.render({
								key: $.cookie("key")
								}),
						  "aoColumnDefs": [
											{ "bSearchable": false, "bSortable": false, "sClass": "botoes", "sWidth": "60px", "aTargets": [ 3 ] },
											{ "sWidth": "140px", "sClass": "center", "aTargets": [ 2 ] },
											{ "sClass": "formula", "aTargets": [ 1 ] },
											{ "fnRender": function ( oObj, sVal ) {
															return $.format.date(sVal,"dd/MM/yyyy HH:mm:ss");
														  }, "aTargets": [ 2 ]
											},
											{ "fnRender": function ( oObj, sVal ) {
															return formataFormula(sVal,data_variables,data_vvariables);
														  }, "aTargets": [ 1 ]
											},
										  ],
						   "aaSorting": [[ 2 , "desc" ],[ 0 , "asc" ]],
						   "fnDrawCallback": function(){
								DTdesenhaBotoes();
							}
					});

				}else if ($.getUrlVar("option") == "add" || $.getUrlVar("option") == "edit"){

					var txtOption = ($.getUrlVar("option") == "add") ? "Cadastrar" : "Editar";

					var newform = [];

					newform.push({label: "Nome", input: ["text,name,itext"]});
					newform.push({label: "Disponível para", input: ["select,indicator_role,iselect"]});
					newform.push({label: "Tipo", input: ["select,indicator_type,iselect"]});
					newform.push({label: "Nome da Faixa", input: ["text,variety_name,itext"]});
					newform.push({label: "Faixas", input: ["text,variacoes_placeholder,itext"]});
					newform.push({label: "Variáveis da Faixa", input: ["text,vvariacoes_placeholder,itext"]});
					newform.push({label: "Todas as variáveis são obrigatórias", input: ["checkbox,all_variations_variables_are_required,icheckbox"]});
					newform.push({label: "Formula<br /><a href='javascript: void(0);' id='help-formula'>ajuda</a>", input: ["textarea,formula,itext"]});
					newform.push({label: "Explicação", input: ["textarea,explanation,itext"]});
					newform.push({label: "Direção de classificação", input: ["select,sort_direction,iselect"]});
					newform.push({label: "Referência de Meta", input: ["select,goal_operator,iselect200px","text,goal,itext200px"]});
					newform.push({label: "Fonte (Ref. de Meta)", input: ["select,goal_source,iselect source","text,goal_source_new,itext300px"]});
					newform.push({label: "Explicação (Ref. de Meta)", input: ["textarea,goal_explanation,itext"]});
					newform.push({label: "Eixo", input: ["select,axis_id,iselect"]});
					newform.push({label: "Fonte", input: ["select,source,iselect source","text,source_new,itext300px"]});
					newform.push({label: "Tags", input: ["text,tags,itext"]});
					newform.push({label: "Observações", input: ["textarea,observations,itext"]});

					var formbuild = $("#dashboard-content .content").append(buildForm(newform,txtOption));
					$(formbuild).find("div .field:odd").addClass("odd");
					$(formbuild).find(".form").width(890);
					$(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

					setNewSource($("#dashboard-content .content select#goal_source"),$("#dashboard-content .content input#goal_source_new"));
					setNewSource($("#dashboard-content .content select#source"),$("#dashboard-content .content input#source_new"));

					$(formbuild).find("#name").qtip( $.extend(true, {}, qtip_input, {
							content: "Nome do Indicador"
					}));
					$(formbuild).find("a#help-formula").qtip( $.extend(true, {}, qtip_editor, {
							content: "Crie a fórmula selecionando as variáveis ao lado e os botões de operações abaixo.<br />Para excluir um parâmetro adicionado, clique sobre o mesmo e depois aperte Delete no seu teclado."
					}));
					$("#formula-editor .button").qtip( $.extend(true, {}, qtip_editor, {
							content: "Adiciona a Variável/Valor na fórmula."
					}));
					$("input#formula-input").qtip( $.extend(true, {}, qtip_editor, {
							content: "Utilize esse campo para inserir valores manualmente."
					}));
					$(formbuild).find("#tags").qtip( $.extend(true, {}, qtip_input, {
							content: "Tags separadas por vírgula"
					}));

					loadSources();

					loadComboSources(sources,$("#dashboard-content .content select#goal_source"),$("#dashboard-content .content input#goal_source_new"));
					loadComboSources(sources,$("#dashboard-content .content select#source"),$("#dashboard-content .content input#source_new"));

					$.ajax({
						async: false,
						type: 'GET',
						dataType: 'json',
						url: api_path + '/api/axis?api_key=$$key'.render({
								key: $.cookie("key")
								}),
						success: function(data, textStatus, jqXHR){
							data.axis.sort(function (a, b) {
								a = a.name,
								b = b.name;

								return a.localeCompare(b);
							});
							$.each(data.axis, function(index,item){
								$("#dashboard-content .content select#axis_id").append($("<option></option>").val(item.id).html(item.name));
							});

						},
						error: function(data){
							$("#aviso").setWarning({msg: "Erro ao carregar ($$codigo)".render({
										codigo: $.parseJSON(data.responseText).error
									})
							});
						}
					});

					$.each(indicator_roles,function(key, value){
						$("#dashboard-content .content select#indicator_role").append($("<option></option>").val(key).html(value));
					});

					$.each(indicator_types,function(key, value){
						$("#dashboard-content .content select#indicator_type").append($("<option></option>").val(key).html(value));
					});

					$.each(goal_operators,function(key, value){
						$("#dashboard-content .content select#goal_operator").append($("<option></option>").val(key).html(value));
					});

					$.each(sort_directions,function(key, value){
						$("#dashboard-content .content select#sort_direction").append($("<option></option>").val(key).html(value));
					});

					$("#dashboard-content .content textarea#formula").after("<div id='formula-editor'><div class='editor'><div class='editor-content'></div></div><div class='button'><<</div><div class='variables-title'>Variáveis</div><div class='variables'></div><div class='user-input'></div><div class='operators'></div></div>");
					$("#formula-editor .user-input").append("<input type='text' id='formula-input' placeholder='valor'>");
					$("#formula-editor .operators").append("<div class='op-button' val='$$value' title='$$title'>$$caption</div>".render({value: "+",caption: "+",title: "Soma"}));
					$("#formula-editor .operators").append("<div class='op-button' val='$$value' title='$$title'>$$caption</div>".render({value: "-",caption: "-",title: "Subtração"}));
					$("#formula-editor .operators").append("<div class='op-button' val='$$value' title='$$title'>$$caption</div>".render({value: "/",caption: "÷",title: "Divisão"}));
					$("#formula-editor .operators").append("<div class='op-button' val='$$value' title='$$title'>$$caption</div>".render({value: "*",caption: "×",title: "Multiplicação"}));
					$("#formula-editor .operators").append("<div class='op-button' val='$$value' title='$$title''>$$caption</div>".render({value: "(",caption: "(",title: "Abre Parenteses"}));
					$("#formula-editor .operators").append("<div class='op-button' val='$$value' title='$$title'>$$caption</div>".render({value: ")",caption: ")",title: "Fecha Parenteses"}));
					$("#formula-editor .operators").append("<div class='op-button' val='$$value' title='$$title'>$$caption</div>".render({value: "√",caption: "√",title: "Raíz Quadrada"}));
					$("#formula-editor .operators").append("<div class='op-button' val='$$value' title='$$title'>$$caption</div>".render({value: "CONCATENAR",caption: "[ ]",title: "Concatenar"}));
					$("#formula-editor .operators").append("<div class='reset-button' val='erase' title='apagar tudo'>apagar tudo</div>");
					$("#dashboard-content .content textarea#formula").hide();

					$("html").click(function(e){
						click_editor = false;
					});
					$("html").keydown(function(e){
						if (click_editor){
							if (e.which == 46){ //TECLA DEL
								$("#formula-editor .editor-content .selected").remove();
							}else if (e.which == 8){ //TECLA BACKSPACE
								e.preventDefault();
								return false;
							}
						}
					});
					$("#formula-editor #formula-input").keydown(function(e){
						if (e.which == 13){ //TECLA ENTER
							e.stopPropagation();
							$("#formula-editor .button").click();
							return false;
						}
					});
					$("#formula-editor .editor").click(function(e){
						click_editor = true;
						e.stopPropagation();
						if ($(e.target).hasClass("f-operator") || $(e.target).hasClass("f-variable") || $(e.target).hasClass("f-vvariable") || $(e.target).hasClass("f-input")){
							$(e.target).toggleClass("selected");
						}
					});

					$("#formula-editor .button").click(function(e){
						if ($(this).parent().find(".variables .selected").length > 0){
							if ($(this).parent().find(".variables .selected").attr("type") == "normal"){
								var newItem = $(this).parent().find(".editor .editor-content").append("<div class='f-variable' var_id='$$var_id'>$$nome</div>".render({
																																				nome: $(this).parent().find(".variables .selected").html(),
																																				var_id: $(this).parent().find(".variables .selected").attr("var_id")
																																				}));
								var period_selected = $(this).parent().find(".variables .selected").attr("period");
								$(this).parent().find(".variables .item[period!='"+period_selected+"'][type=='normal']").hide();
							}else{
								var newItem = $(this).parent().find(".editor .editor-content").append("<div class='f-vvariable' var_id='$$var_id'>$$nome</div>".render({
																																				nome: $(this).parent().find(".variables .selected").html(),
																																				var_id: $(this).parent().find(".variables .selected").attr("var_id")
																																				}));
							}
						}else if ($(this).parent().find("input#formula-input").val() != ""){
							var newItem = $(this).parent().find(".editor .editor-content").append("<div class='f-input'>$$valor</div>".render({
																																			valor: $(this).parent().find("input#formula-input").val()
																																			}));
							$("input#formula-input").val("");
						}
						updateFormula();
					});

					$("#formula-editor .op-button").click(function(){
						if (!$(this).hasClass("op-button-disabled")){
							var newItem = $("#formula-editor .editor .editor-content").append("<div class='f-operator' val='$$value'>$$caption</div>".render({
																																				value: $(this).attr("val"),
																																				caption: $(this).html()
																																				}));
							updateFormula();
							if ($(this).attr("val") == "CONCATENAR"){
								$("#formula-editor .op-button[value!='erase']").addClass("op-button-disabled");
							}
						}else{
						}
					});
					$("#formula-editor .reset-button").click(function(){
						$("#formula-editor .editor .editor-content").empty();
						$("#formula-editor .op-button").removeClass("op-button-disabled");
						$("#formula-editor .variables .item").show();
						updateFormula();
					});
					$("#formula-editor input#formula-input").focus(function(){
						$("#formula-editor .variables .item").removeClass("selected");
					});

					//carrega variaveis
					$.ajax({
						async: false,
						type: 'GET',
						dataType: 'json',
						url: api_path + '/api/variable?api_key=$$key'.render({
										key: $.cookie("key")
								}),
						success: function(data, textStatus, jqXHR){
							// ordena variaveis pelo nome
							data.variables.sort(function (a, b) {
								a = a.name,
								b = b.name;

								return a.localeCompare(b);
							});

							$.each(data.variables, function(index,value){
								$("#formula-editor .variables").append($("<div class='item'></div>").attr({"var_id":data.variables[index].id,"period":data.variables[index].period,"type":"normal"}).html(data.variables[index].name));
							});
							trataCliqueVariaveis();
							convertFormulaToCss();
						},
						error: function(data){
							$("#aviso").setWarning({msg: "Erro ao carregar ($$codigo)".render({
										codigo: $.parseJSON(data.responseText).error
									})
							});
						}
					});

					//Variações

					variacoes_list = [];
					variacoes_id_temp = 0;

					$("#dashboard-content .content input#variacoes_placeholder").after("<div id='variacoes-form'><div class='variacoes-list'><table><thead><tr><th>Nome</th><th></th><th></th><th></th><th></th></tr></thead><tbody></tbody></table></div><div class='variacoes-add'></div></div>");
					$("#variacoes-form .variacoes-add").append("<input type='text' id='variacoes-input' placeholder=''><input type='button' value='adicionar' id='variacoes-button-add'><input type='button' style='display: none;' value='salvar' id='variacoes-button-edit'>");
					$("#dashboard-content .content input#variacoes_placeholder").hide();

					function updateVariacoesTable(){
						if (variacoes_list.length > 0){
							variacoes_list.sort(function (a, b) {
								a = a.order.toString(),
								b = b.order.toString();
								return a.localeCompare(b);
							});
							$("#variacoes-form .variacoes-list table tbody").empty();
							$.each(variacoes_list,function(index,item){
								$("#variacoes-form .variacoes-list table tbody").append("<tr id='$$id' order='$$order' temp='$$temp' delete='$$delete'><td>$$name</td><td class='edit'><a href='#'>editar</a></td><td class='delete'><a href='#'>remover</a></td><td class='up'><a href='#'>subir</a></td><td class='down'><a href='#'>descer</a></td></tr>".render({
										name: item.name,
										id: item.id,
										order: item.order,
										temp: item.temp,
										delete: item.delete
									}));
								if (item.delete || item.delete == "true"){
									$("#variacoes-form .variacoes-list table tbody tr:last").hide();
								}
							});
							$("#variacoes-form .variacoes-list table td.delete a").click(function(e){
								e.preventDefault();
								deleteVariacao($(this).parent().parent());
							});
							$("#variacoes-form .variacoes-list table td.up a").click(function(e){
								e.preventDefault();
								sobeVariacao($(this).parent().parent());
							});
							$("#variacoes-form .variacoes-list table td.down a").click(function(e){
								e.preventDefault();
								desceVariacao($(this).parent().parent());
							});
							$("#variacoes-form .variacoes-list table td.edit a").click(function(e){
								var tr = $(this).parent().parent();
								e.preventDefault();
								$("#variacoes-input").val($(this).parent().prev("td").text());
								$("#variacoes-input").focus();
								$("#variacoes-button-add").hide();
								$("#variacoes-button-edit").show();
								$("#variacoes-button-edit").unbind();
								$("#variacoes-button-edit").click(function(e){
									updateVariacao(tr);
								});
							});

						}else{
							$("#variacoes-form .variacoes-list table tbody").empty();
							$("#variacoes-form .variacoes-list table tbody").append("<tr><td colspan='4' align='center'>Nenhuma faixa adicionada</td></tr>");
						}
					}

					function reSortVariacao(){
						var order = 0;
						$.each(variacoes_list,function(index,item){
							variacoes_list[index].order = order;
							order++;
						});
					}

					function addVariacao(){
						variacoes_list.push({
								name: $("#variacoes-form .variacoes-add #variacoes-input").val(),
								id: variacoes_id_temp,
								order: variacoes_list.length,
								temp: true
								});
						variacoes_id_temp++;
						$("#variacoes-input").val("");
						updateVariacoesTable();
					}

					function deleteVariacao(item){
						if (item.attr("temp") == "true"){
							variacoes_list.splice(item.attr("order"),1);
						}else{
							$.each(variacoes_list,function(index,item2){
								if (item2.id == item.attr("id")){
									variacoes_list[index].delete = true;
								}
							});
							item.attr("delete","true");
						}
						reSortVariacao();
						updateVariacoesTable();
					}

					function sobeVariacao(item){
						if (parseInt(item.attr("order"))  > 0 ){
							$.each(variacoes_list,function(index,item2){
								if (parseInt(item2.order) == (parseInt(item.attr("order")) - 1)){
									variacoes_list[index].order = parseInt(variacoes_list[index].order) + 1;
								}else if (parseInt(item2.order) == parseInt(item.attr("order"))){
									variacoes_list[index].order = parseInt(variacoes_list[index].order) - 1;
								}
							});
						}
						updateVariacoesTable();
					}

					function desceVariacao(item){
						if (parseInt(item.attr("order")) < $("#variacoes-form .variacoes-list table tbody tr").length){
							$.each(variacoes_list,function(index,item2){
								if (parseInt(item2.order) == (parseInt(item.attr("order")) + 1)){
									variacoes_list[index].order = parseInt(variacoes_list[index].order) - 1;
								}else if (parseInt(item2.order) == parseInt(item.attr("order"))){
									variacoes_list[index].order = parseInt(variacoes_list[index].order) + 1;
								}
							});
						}
						updateVariacoesTable();
					}


					function updateVariacao(item){
						if (item.attr("temp") == "true"){
							$.each(variacoes_list,function(index,value){
								if (parseInt(variacoes_list[index].id) == parseInt(item.attr("id"))){
									variacoes_list[index].name = $("#variacoes-input").val();
								}
							});
						}else{
							$.each(variacoes_list,function(index,item2){
								if (item2.id == item.attr("id")){
									variacoes_list[index].update = true;
									variacoes_list[index].name = $("#variacoes-input").val();
									updateFormula();
								}
							});
							item.attr("update","true");
						}
						$("#variacoes-button-add").show();
						$("#variacoes-button-edit").hide();
						$("#variacoes-input").val("");
						updateVariacoesTable();
					}


					updateVariacoesTable();

					$("#variacoes-button-add").click(function(){
						addVariacao();
					});

					//Variáveis da Variação

					vvariacoes_list = [];
					vvariacoes_id_temp = 0;

					$("#dashboard-content .content input#vvariacoes_placeholder").after("<div id='vvariacoes-form'><div class='vvariacoes-list'><table><thead><tr><th>Nome</th><th></th><th></th></tr></thead><tbody></tbody></table></div><div class='vvariacoes-add'></div></div>");
					$("#vvariacoes-form .vvariacoes-add").append("<input type='text' id='vvariacoes-input' placeholder=''><input type='button' value='adicionar' id='vvariacoes-button-add'><input type='button' style='display: none;' value='salvar' id='vvariacoes-button-edit'>");
					$("#dashboard-content .content input#vvariacoes_placeholder").hide();

					function updateVVariacoesTable(){
						if (vvariacoes_list.length > 0){
							vvariacoes_list.sort(function (a, b) {
								a = a.name,
								b = b.name;
								return a.localeCompare(b);
							});
							$("#vvariacoes-form .vvariacoes-list table tbody").empty();
							$.each(vvariacoes_list,function(index,item){
								$("#vvariacoes-form .vvariacoes-list table tbody").append("<tr id='$$id' temp='$$temp' delete='$$delete'><td>$$name</td><td class='edit'><a href='#'>editar</a></td><<td class='delete'><a href='#'>remover</a></td></tr>".render({
										name: item.name,
										id: item.id,
										temp: item.temp,
										delete: item.delete
									}));
								if (item.delete || item.delete == "true"){
									$("#vvariacoes-form .vvariacoes-list table tbody tr:last").hide();
								}
							});
							$("#vvariacoes-form .vvariacoes-list table td.delete a").click(function(e){
								e.preventDefault();
								deleteVVariacao($(this).parent().parent());
							});
							$("#vvariacoes-form .vvariacoes-list table td.edit a").click(function(e){
								var tr = $(this).parent().parent();
								e.preventDefault();
								$("#vvariacoes-input").val($(this).parent().prev("td").text());
								$("#vvariacoes-input").focus();
								$("#vvariacoes-button-add").hide();
								$("#vvariacoes-button-edit").show();
								$("#vvariacoes-button-edit").unbind();
								$("#vvariacoes-button-edit").click(function(e){
									updateVVariacao(tr);
								});
							});

						}else{
							$("#vvariacoes-form .vvariacoes-list table tbody").empty();
							$("#vvariacoes-form .vvariacoes-list table tbody").append("<tr><td colspan='4' align='center'>Nenhuma variável adicionada</td></tr>");
						}
					}

					function addVVariacao(){
						vvariacoes_list.push({
								name: $("#vvariacoes-form .vvariacoes-add #vvariacoes-input").val(),
								id: vvariacoes_id_temp,
								temp: true
								});
						updateVVariacoesTable();

						$("#formula-editor .variables").append($("<div class='item'></div>").attr({"var_id":vvariacoes_id_temp,"type":"varied"}).html($("#vvariacoes-form .vvariacoes-add #vvariacoes-input").val()));
						vvariacoes_id_temp++;
						$("#vvariacoes-input").val("");
						trataCliqueVariaveis();
					}

					function deleteVVariacao(item){
						if (item.attr("temp") == "true"){
							var selecionado;
							$.each(vvariacoes_list,function(index,value){
								if (parseInt(vvariacoes_list[index].id) == parseInt(item.attr("id"))){
									$("#formula-editor .variables .item[var_id='$$var_id'][type='varied']".render({var_id: item.attr("id")})).remove();
									$("#formula-editor .editor-content .f-vvariable[var_id='$$var_id']".render({var_id: item.attr("id")})).remove();
									updateFormula();
									selecionado = index;
								}
							});
							if (selecionado >= 0){
								vvariacoes_list.splice(selecionado,1);
							}
						}else{
							$.each(vvariacoes_list,function(index,item2){
								if (item2.id == item.attr("id")){
									vvariacoes_list[index].delete = true;
									$("#formula-editor .variables .item[var_id='$$var_id'][type='varied']".render({var_id: item.attr("id")})).remove();
									$("#formula-editor .editor-content .f-vvariable[var_id='$$var_id']".render({var_id: item.attr("id")})).remove();
									updateFormula();
								}
							});
							item.attr("delete","true");
						}
						updateVVariacoesTable();
					}

					function updateVVariacao(item){
						if (item.attr("temp") == "true"){
							$.each(vvariacoes_list,function(index,value){
								if (parseInt(vvariacoes_list[index].id) == parseInt(item.attr("id"))){
									vvariacoes_list[index].name = $("#vvariacoes-input").val();
									$("#formula-editor .variables .item[var_id='$$var_id'][type='varied']".render({var_id: item.attr("id")})).text($("#vvariacoes-input").val());
									$("#formula-editor .editor-content .f-vvariable[var_id='$$var_id']".render({var_id: item.attr("id")})).text($("#vvariacoes-input").val());
									updateFormula();
								}
							});
						}else{
							$.each(vvariacoes_list,function(index,item2){
								if (item2.id == item.attr("id")){
									vvariacoes_list[index].update = true;
									vvariacoes_list[index].name = $("#vvariacoes-input").val();
									$("#formula-editor .variables .item[var_id='$$var_id'][type='varied']".render({var_id: item.attr("id")})).text($("#vvariacoes-input").val());
									$("#formula-editor .editor-content .f-vvariable[var_id='$$var_id']".render({var_id: item.attr("id")})).text($("#vvariacoes-input").val());
									updateFormula();
								}
							});
							item.attr("update","true");
						}
						$("#vvariacoes-button-add").show();
						$("#vvariacoes-button-edit").hide();
						$("#vvariacoes-input").val("");
						updateVVariacoesTable();
					}


					updateVVariacoesTable();

					$("#variety_name").parent().parent().hide();
					$("#variacoes_placeholder").parent().parent().hide();
					$("#vvariacoes_placeholder").parent().parent().hide();
					$("#all_variations_variables_are_required").parent().parent().hide();

					$("#indicator_type").change(function(){
						if ($("#indicator_type").val() == "normal"){
							$("#variety_name").parent().parent().hide();
							$("#variacoes_placeholder").parent().parent().hide();
							$("#vvariacoes_placeholder").parent().parent().hide();
							$("#all_variations_variables_are_required").parent().parent().hide();
							$("#formula-editor .variables")
						}else{
							$("#variety_name").parent().parent().show();
							$("#variacoes_placeholder").parent().parent().show();
							$("#vvariacoes_placeholder").parent().parent().show();
							$("#all_variations_variables_are_required").parent().parent().show();
						}
					});

					$("#vvariacoes-button-add").click(function(){
						addVVariacao();
					});

					if ($.getUrlVar("option") == "add"){
						$("#dashboard-content .content .botao-form[ref='enviar']").click(function(){
							resetWarnings();
							if ($(this).parent().parent().find("#name").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe o Nome"});
							}else if ($(this).parent().parent().find("#formula").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe a Fórmula"});
							}else{
								args = [{name: "api_key", value: $.cookie("key")},
										{name: "indicator.create.name", value: $(this).parent().parent().find("#name").val()},
										{name: "indicator.create.indicator_roles", value: $(this).parent().parent().find("#indicator_role").val()},
										{name: "indicator.create.indicator_type", value: $(this).parent().parent().find("#indicator_type").val().replace("_dyn","")},
										{name: "indicator.create.formula", value: $(this).parent().parent().find("#formula").val()},
										{name: "indicator.create.explanation", value: $(this).parent().parent().find("#explanation").val()},
										{name: "indicator.create.sort_direction", value: $(this).parent().parent().find("#sort_direction option:selected").val()},
										{name: "indicator.create.goal", value: $.convertNumberToBd($(this).parent().parent().find("#goal").val())},
										{name: "indicator.create.goal_source", value: $(this).parent().parent().find("#goal_source option:selected").val()},
										{name: "indicator.create.goal_operator", value: $(this).parent().parent().find("#goal_operator option:selected").val()},
										{name: "indicator.create.goal_explanation", value: $(this).parent().parent().find("#goal_explanation").val()},
										{name: "indicator.create.axis_id", value: $(this).parent().parent().find("#axis_id option:selected").val()},
										{name: "indicator.create.source", value: $(this).parent().parent().find("#source option:selected").val()},
										{name: "indicator.create.tags", value: $(this).parent().parent().find("#tags").val()},
										{name: "indicator.create.observations", value: $(this).parent().parent().find("#observations").val()}
										];


								if ($(this).parent().parent().find("#indicator_type").val() == "varied" || $(this).parent().parent().find("#indicator_type").val() == "varied_dyn"){
									if ($(this).parent().parent().find("#all_variations_variables_are_required").attr("checked")){
										args.push({name: "indicator.create.all_variations_variables_are_required", value: 1});
									}else{
										args.push({name: "indicator.create.all_variations_variables_are_required", value: 0});
									}
									args.push({name: "indicator.create.variety_name", value: $(this).parent().parent().find("#variety_name").val()});
									args.push({name: "indicator.create.summarization_method", value: 'sum'});
									if ($(this).parent().parent().find("#indicator_type").val() == "varied_dyn"){
										args.push({name: "indicator.create.dynamic_variations", value: 1});
									}
								}

								$("#dashboard-content .content .botao-form[ref='enviar']").hide();
								$.ajax({
									async: false,
									type: 'POST',
									dataType: 'json',
									url: api_path + '/api/indicator',
									data: args,
									success: function(data,status,jqXHR){
										var newId = data.id;
										var formula_update = $("#dashboard-content textarea#formula").val();
										if ($("#dashboard-content .content select#indicator_type").val() == "varied" || $("#dashboard-content .content select#indicator_type").val() == "varied_dyn"){

											$.each(variacoes_list, function(index,item){
												args = [{name: "api_key", value: $.cookie("key")},
														{name: "indicator.variation.create.name", value: item.name},
														{name: "indicator.variation.create.order", value: item.order}
														];

												$.ajax({
													async: false,
													type: 'POST',
													dataType: 'json',
													url: api_path + '/api/indicator/$$newid/variation'.render({
															newid: newId
														}),
													data: args
												});
											});

											$.each(vvariacoes_list, function(index,item){
												args = [{name: "api_key", value: $.cookie("key")},
														{name: "indicator.variables_variation.create.name", value: item.name}
														];

												$.ajax({
													async: false,
													type: 'POST',
													dataType: 'json',
													url: api_path + '/api/indicator/$$newid/variables_variation'.render({
															newid: newId
														}),
													data: args,
													success: function(data,status,jqXHR){
														formula_update = formula_update.replace("#"+item.id,"#"+data.id);
													}
												});
											});
										}
										if (formula_update != $("#dashboard-content textarea#formula").val()){
											args = [{name: "api_key", value: $.cookie("key")},
													{name: "indicator.update.formula", value: formula_update}
													];
											$.ajax({
												async: false,
												type: 'POST',
												dataType: 'json',
												url: api_path + '/api/indicator/$$newid'.render({
														newid: newId
													}),
												data: args
											});
										}
										$("#aviso").setWarning({msg: "Cadastro efetuado com sucesso.".render({
													codigo: jqXHR.status
													})
										});
										location.hash = "#!/"+getUrlSub();
									},
									error: function(data){
										switch(data.status){
											case 400:
												$("#aviso").setWarning({msg: "Erro ao cadastrar. ($$codigo)".render({
															codigo: $.parseJSON(data.responseText).error
															})
												});
												break;
										}
										$("#dashboard-content .content .botao-form[ref='enviar']").show();
									}
								});
							}
						});
					}else if ($.getUrlVar("option") == "edit"){
						$.ajax({
							async: false,
							type: 'GET',
							dataType: 'json',
							url: $.getUrlVar("url") + "?api_key=$$key".render({
										key: $.cookie("key")
								}),
							success: function(data,status,jqXHR){
								switch(jqXHR.status){
									case 200:
										$(formbuild).find("input#name").val(data.name);
										if (data.indicator_roles ==  '_movimento,_prefeitura') data.indicator_roles = '_prefeitura,_movimento';
										$(formbuild).find("select#indicator_role").val(data.indicator_roles);
										if (data.indicator_type == "varied" && data.dynamic_variations == "1"){
											$(formbuild).find("select#indicator_type").val("varied_dyn");
										}else{
											$(formbuild).find("select#indicator_type").val(data.indicator_type);
										}
										if(data.indicator_type == "varied"){
											$(formbuild).find("input#variety_name").val(data.variety_name);
											if (data.all_variations_variables_are_required == 1){
												$(formbuild).find("input#all_variations_variables_are_required").attr("checked",true);
											}else{
												$(formbuild).find("input#all_variations_variables_are_required").attr("checked",false);
											}
											$.ajax({
												async: false,
												type: 'GET',
												dataType: 'json',
												url: api_path + '/api/indicator/$$id/variation?api_key=$$key'.render({
														key: $.cookie("key"),
														id: getIdFromUrl($.getUrlVar("url"))
														}),
												success: function(data,status,jqXHR){
													variacoes_list = [];
													variacoes_id_temp = 0;
													$.each(data.variations, function(index,item){
														variacoes_list.push({
																id: item.id,
																name: item.name,
																order: item.order,
																temp: false
															});
													});
												}
											});
											$.ajax({
												async: false,
												type: 'GET',
												dataType: 'json',
												url: api_path + '/api/indicator/$$id/variables_variation?api_key=$$key'.render({
														key: $.cookie("key"),
														id: getIdFromUrl($.getUrlVar("url"))
														}),
												success: function(data,status,jqXHR){
													vvariacoes_list = [];
													vvariacoes_id_temp = 0
													$.each(data.variables_variations, function(index,item){
														vvariacoes_list.push({
																id: item.id,
																name: item.name,
																temp: false
															});
													});
												}
											});
											updateVariacoesTable();
											updateVVariacoesTable();

										}
										if (data.indicator_roles ==  '_movimento,_prefeitura') data.indicator_roles = '_prefeitura,_movimento';
										$(formbuild).find("select#indicator_role").val(String(data.indicator_roles));
										$(formbuild).find("textarea#formula").val(data.formula);
										$(formbuild).find("textarea#explanation").val(data.explanation);
										$(formbuild).find("select#sort_direction").val(String(data.sort_direction));
										$(formbuild).find("input#goal").val($.convertNumberFromBd(data.goal));
										$(formbuild).find("select#goal_source").val(data.goal_source);
										$(formbuild).find("select#goal_operator").val(String(data.goal_operator));
										$(formbuild).find("textarea#goal_explanation").val(data.goal_explanation);
										$(formbuild).find("select#axis_id").val(data.axis_id);
										$(formbuild).find("select#source").val(data.source);
										$(formbuild).find("input#tags").val(data.tags);
										$(formbuild).find("textarea#observations").val(data.observations);
										if ($("#formula-editor .variables .item").length > 0) convertFormulaToCss();

										if (data.indicator_type == "varied"){
											$("#variety_name").parent().parent().show();
											$("#variacoes_placeholder").parent().parent().show();
											$("#vvariacoes_placeholder").parent().parent().show();
											$("#all_variations_variables_are_required").parent().parent().show();
											if (data.all_variations_variables_are_required == 1){
												$(formbuild).find("input#all_variations_variables_are_required").attr("checked","checked");
											}else{
												$(formbuild).find("input#all_variations_variables_are_required").attr("checked","");
											}
											$(formbuild).find("input#variety_name").val($.convertNumberFromBd(data.variety_name));

											//carrega variaveis
											$.ajax({
												async: false,
												type: 'GET',
												dataType: 'json',
												url: api_path + '/api/indicator/$$indicator_id/variables_variation?api_key=$$key'.render({
																key: $.cookie("key"),
																indicator_id: getIdFromUrl($.getUrlVar("url"))
														}),
												success: function(data, textStatus, jqXHR){
													// ordena variaveis pelo nome
													data.variables_variations.sort(function (a, b) {
														a = a.name,
														b = b.name;

														return a.localeCompare(b);
													});

													$.each(data.variables_variations, function(index,item){
														$("#formula-editor .variables").append($("<div class='item'></div>").attr({"var_id":item.id,"period":"","type":"varied"}).html(item.name));
													});
													trataCliqueVariaveis();
													convertFormulaToCss();
												},
												error: function(data){
													$("#aviso").setWarning({msg: "Erro ao carregar ($$codigo)".render({
																codigo: $.parseJSON(data.responseText).error
															})
													});
												}
											});
										}

										break;
								}
							},
							error: function(data){
								switch(data.status){
									case 400:
										$(".form-aviso").setWarning({msg: "Erro: ($$codigo)".render({
													codigo: $.parseJSON(data.responseText).error
													})
										});
										break;
								}
							}
						});

						$("#dashboard-content .content .botao-form[ref='enviar']").click(function(){
							resetWarnings();
							if ($(this).parent().parent().find("#name").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe o Nome"});
							}else if ($(this).parent().parent().find("#formula").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe a Fórmula"});
							}else{
								args = [{name: "api_key", value: $.cookie("key")},
										{name: "indicator.update.name", value: $(this).parent().parent().find("#name").val()},
										{name: "indicator.update.indicator_roles", value: $(this).parent().parent().find("#indicator_role").val()},
										{name: "indicator.update.indicator_type", value: $(this).parent().parent().find("#indicator_type").val().replace("_dyn","")},
										{name: "indicator.update.formula", value: $(this).parent().parent().find("#formula").val()},
										{name: "indicator.update.explanation", value: $(this).parent().parent().find("#explanation").val()},
										{name: "indicator.update.sort_direction", value: $(this).parent().parent().find("#sort_direction option:selected").val()},
										{name: "indicator.update.goal", value: $.convertNumberToBd($(this).parent().parent().find("#goal").val())},
										{name: "indicator.update.goal_source", value: $(this).parent().parent().find("#goal_source").val()},
										{name: "indicator.update.goal_operator", value: $(this).parent().parent().find("#goal_operator option:selected").val()},
										{name: "indicator.update.goal_explanation", value: $(this).parent().parent().find("#goal_explanation").val()},
										{name: "indicator.update.axis_id", value: $(this).parent().parent().find("#axis_id option:selected").val()},
										{name: "indicator.update.source", value: $(this).parent().parent().find("#source").val()},
										{name: "indicator.update.tags", value: $(this).parent().parent().find("#tags").val()},
										{name: "indicator.update.observations", value: $(this).parent().parent().find("#observations").val()}
										];

								if ($(this).parent().parent().find("#indicator_type").val() == "varied" || $(this).parent().parent().find("#indicator_type").val() == "varied_dyn"){
									if ($(this).parent().parent().find("#all_variations_variables_are_required").attr("checked")){
										args.push({name: "indicator.update.all_variations_variables_are_required", value: 1});
									}else{
										args.push({name: "indicator.update.all_variations_variables_are_required", value: 0});
									}
									args.push({name: "indicator.update.variety_name", value: $(this).parent().parent().find("#variety_name").val()});
									args.push({name: "indicator.update.summarization_method", value: 'sum'});
									if ($(this).parent().parent().find("#indicator_type").val() == "varied_dyn"){
										args.push({name: "indicator.update.dynamic_variations", value: 1});
									}else{
										args.push({name: "indicator.update.dynamic_variations", value: 0});
									}
								}else{
									args.push({name: "indicator.update.all_variations_variables_are_required", value: ''});
									args.push({name: "indicator.update.variety_name", value: ''});
									args.push({name: "indicator.update.summarization_method", value: ''});
								}

								$("#dashboard-content .content .botao-form[ref='enviar']").hide();
								$.ajax({
									type: 'POST',
									dataType: 'json',
									url: $.getUrlVar("url"),
									data: args,
									success: function(data, textStatus, jqXHR){
										var newId = data.id;
										var formula_update = $("#dashboard-content textarea#formula").val();
										if ($("#dashboard-content .content select#indicator_type").val() == "varied" || $("#dashboard-content .content select#indicator_type").val() == "varied_dyn"){

											$.each(variacoes_list, function(index,item){
												if ((item.temp) || item.temp == "true"){
													args = [{name: "api_key", value: $.cookie("key")},
															{name: "indicator.variation.create.name", value: item.name},
															{name: "indicator.variation.create.order", value: item.order}
															];

													$.ajax({
														async: false,
														type: 'POST',
														dataType: 'json',
														url: api_path + '/api/indicator/$$newid/variation'.render({
																newid: newId
															}),
														data: args
													});
												}else{
													if ((item.update) || item.update == "true"){
														args = [{name: "api_key", value: $.cookie("key")},
																{name: "indicator.variation.update.name", value: item.name}
																];
														$.ajax({
															async: false,
															type: 'POST',
															dataType: 'json',
															url: api_path + '/api/indicator/$$newid/variation/$$id'.render({
																	newid: newId,
																	id: item.id
																}),
															data: args
														});
													}else if ((item.delete) || item.delete == "true"){
														$.ajax({
															async: false,
															type: 'DELETE',
															dataType: 'json',
															url: api_path + '/api/indicator/$$newid/variation/$$id'.render({
																	newid: newId,
																	id: item.id
																}),
															data: args
														});
													}
												}
											});

											$.each(vvariacoes_list, function(index,item){
												if ((item.temp) || item.temp == "true"){
													args = [{name: "api_key", value: $.cookie("key")},
															{name: "indicator.variables_variation.create.name", value: item.name}
															];

													$.ajax({
														async: false,
														type: 'POST',
														dataType: 'json',
														url: api_path + '/api/indicator/$$newid/variables_variation'.render({
																newid: newId
															}),
														data: args,
														success: function(data){
															formula_update = formula_update.replace("#"+item.id,"#"+data.id);
														}
													});
												}else{
													if ((item.update) || item.update == "true"){
														args = [{name: "api_key", value: $.cookie("key")},
																{name: "indicator.variables_variation.update.name", value: item.name}
																];
														$.ajax({
															async: false,
															type: 'POST',
															dataType: 'json',
															url: api_path + '/api/indicator/$$newid/variables_variation/$$id'.render({
																	newid: newId,
																	id: item.id
																}),
															data: args
														});
													}else if ((item.delete) || item.delete == "true"){
														$.ajax({
															async: false,
															type: 'DELETE',
															dataType: 'json',
															url: api_path + '/api/indicator/$$newid/variables_variation/$$id'.render({
																	newid: newId,
																	id: item.id
																}),
															data: args
														});
													}
												}
											});
										}
										if (formula_update != $("#dashboard-content textarea#formula").val()){
											args = [{name: "api_key", value: $.cookie("key")},
													{name: "indicator.update.formula", value: formula_update}
													];
											$.ajax({
												async: false,
												type: 'POST',
												dataType: 'json',
												url: api_path + '/api/indicator/$$newid'.render({
														newid: newId
													}),
												data: args
											});
										}
										$("#aviso").setWarning({msg: "Cadastro editado com sucesso.".render({
													codigo: jqXHR.status
													})
										});
										location.hash = "#!/"+getUrlSub();
										$("#dashboard-content .content .botao-form[ref='enviar']").show();
									},
									error: function(data){
										$(".form-aviso").setWarning({msg: "Erro ao editar. ($$erro)".render({
													erro: $.parseJSON(data.responseText).error
													})
										});
										$("#dashboard-content .content .botao-form[ref='enviar']").show();
									}
								});
							}
						});
					}
					$("#dashboard-content .content .botao-form[ref='cancelar']").click(function(){
						resetWarnings();
						history.back();
					});
				}else if ($.getUrlVar("option") == "delete"){

					deleteRegister({url:$.getUrlVar("url") + "?api_key=$$key".render({
													key: $.cookie("key")
											})});
				}
			}else if (getUrlSub() == "myindicator"){
				/*  INDICATORS */
				if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined){
					$.ajax({
						type: 'GET',
						dataType: 'json',
						url: api_path + '/api/indicator?api_key=$$key'.render({
								key: $.cookie("key"),
								userid: $.cookie("user.id")
								}),
						success: function(data, textStatus, jqXHR){
							var data_indicators = [];
							$.each(data.indicators, function(index,value){
								data_indicators.push({
														"id":data.indicators[index].id,
														"name":data.indicators[index].name,
														"formula":data.indicators[index].formula,
														"axis_id":data.indicators[index].axis_id,
														"axis":data.indicators[index].axis,
														"period":'yearly',
													 });
							});

							data_indicators.sort(function (a, b) {
								a = a.axis.name,
								b = b.axis.name;

								return a.localeCompare(b);
							});

							var data_variables = [];
							$.ajax({
								async: false,
								type: 'GET',
								dataType: 'json',
								url: api_path + '/api/variable?api_key=$$key'.render({
										key: $.cookie("key"),
										userid: $.cookie("user.id")
										}),
								success: function(data, textStatus, jqXHR){
									$.each(data.variables, function(index,value){
										data_variables.push({"id":data.variables[index].id,"name":data.variables[index].name});
									});
								}
							});

							var data_vvariables = [];
							$.ajax({
								async: false,
								type: 'GET',
								dataType: 'json',
								url: api_path + '/api/indicator/variable?api_key=$$key'.render({
										key: $.cookie("key"),
										userid: $.cookie("user.id")
										}),
								success: function(data, textStatus, jqXHR){
									$.each(data.variables, function(index,value){
										data_vvariables.push({"id":data.variables[index].id,"name":data.variables[index].name});
									});
								}
							});

							var axis_ant = "";
							var indicators_table = "";
							var indicators_legend = "";

							indicators_legend = "<div class='indicadores_legend'><div class='fillContent'>";
							indicators_legend += "<div class='item'><div class='color no-data'></div><div class='label'>Nenhum dado preenchido</div><div class='clear'></div></div>";
							indicators_legend += "<div class='item'><div class='color some-data'></div><div class='label'>Parcialmente preenchido</div><div class='clear'></div></div>";
							indicators_legend += "<div class='item'><div class='color last-period'></div><div class='label'>Preenchido (exceto ano anterior ao vigente)</div><div class='clear'></div></div>";
							indicators_legend += "<div class='item'><div class='color full'></div><div class='label'>Totalmente preenchido</div><div class='clear'></div></div>";
							indicators_legend += "</div></div><div class='clear'></div>";

							indicators_table = "<div class='indicadores_list'>";

							for (i = 0; i < data_indicators.length; i++){
								if (data_indicators[i].axis_id != axis_ant){
									if (i > 0){
										indicators_table += "</div>";
									}
									indicators_table += "<div class='eixos'><div class='title'>$$axis</div><div class='clear'></div>".render({axis: data_indicators[i].axis.name});
									axis_ant = data_indicators[i].axis_id;
								}
								var formula = formataFormula(data_indicators[i].formula,data_variables,data_vvariables);
								indicators_table += "<div class='variable' indicator-id='$$indicator_id'><div class='name'>$$name</div><div class='formula'>$$formula</div><div class='link'><a href='javascript: void(0);' class='icone zoom' title='Série Histórica' alt='Série Histórica' indicator-id='$$id' period='$$period'>detalhes</a><a href='$$hash?option=edit&url=$$url' class='icone edit' title='adicionar valores' alt='adicionar valores'>editar</a></div><div class='clear'></div><div class='historico-popup'></div></div>".render({
									name: data_indicators[i].name,
									formula: formula,
									hash: "#!/"+getUrlSub(),
									url: api_path + "/api/indicator/" + data_indicators[i].id,
//									url: "http://rnsp.aware.com.br/api/indicator/" + data_indicators[i].id,
									indicator_id: data_indicators[i].id,
									period: data_indicators[i].period,
									id: data_indicators[i].id
									});
								indicators_table += "<div class='clear'></div>";
							}

							indicators_table += "<div><div class='clear'>";

							$("#dashboard-content .content").append(indicators_legend + indicators_table);

							$("#dashboard-content .content .indicadores_list .zoom").click( function(){
								var target = $(this).parent().parent();
								var indicator_period = $(this).attr("period");
								$.ajax({
									type: 'GET',
									dataType: 'json',
									url: api_path + '/api/indicator/$$id/variable/value?api_key=$$key'.render({
											key: $.cookie("key"),
											id: $(this).attr("indicator-id")
											}),
									success: function(data, textStatus, jqXHR){
										if (data.rows){
											var history_table = "<table class='history'><thead><tr><th>Período</th>";

											var headers = [];//corrige ordem do header
											$.each(data.header,function(titulo, index){
												headers[index] = titulo;
											});

											$.each(headers, function(index,value){
												history_table += "<th class='variavel'>$$variavel</th>".render({variavel:value});
											});
											history_table += "#theader_valor";
											history_table += "</tr><tbody>";
											var vvariations = [];
											$.each(data.rows, function(index,value){
												history_table += "<tr><td class='periodo'>$$periodo</td>".render({periodo: $.convertDateToPeriod(data.rows[index].valid_from,indicator_period)});
												$.each(data.rows[index].valores, function(index2,value2){
													if (data.rows[index].valores[index2].value != null && data.rows[index].valores[index2].value != undefined && data.rows[index].valores[index2].value != "-"){
														history_table += "<td class='valor' title='$$data'>$$valor</td>".render({
																valor: $.formatNumber(data.rows[index].valores[index2].value, {format:"#,##0.###", locale:"br"}),
																data: $.convertDate(data.rows[index].valores[index2].value_of_date,"T")
														});
													}else{
														history_table += "<td class='valor' title='$$data'>-</td>".render({
																data: $.convertDate(data.rows[index].valores[index2].value_of_date,"T")
														});
													}
												});
												if (value.variations && value.variations.length > 0){
													var th_valor = "";
													for (i = 0; i < value.variations.length; i++){
														th_valor += "<th class='formula_valor' variation-index='" + i + "'>Valor da Fórmula</th>";
													}
													history_table = history_table.replace("#theader_valor",th_valor);
													$.each(value.variations, function(index,item){
														if (item.value != "-"){
															history_table += "<td class='formula_valor' variation-index='$$index'>$$formula_valor</td>".render({
																		formula_valor: $.formatNumber(item.value, {format:"#,##0.###", locale:"br"}),
																		index: index
																	});
														}else{
															history_table += "<td class='formula_valor' variation-index='$$index'>-</td>".render({
																	index: index
																});
														}
														vvariations.push({
																name: item.name,
																index: index
															});
													});
												}else{
													history_table = history_table.replace("#theader_valor","<th class='formula_valor'>Valor da Fórmula</th>");
													if (data.rows[index].formula_value != "-"){
														history_table += "<td class='formula_valor' variation-index='0'>$$formula_valor</td>".render({formula_valor: $.formatNumber(data.rows[index].formula_value, {format:"#,##0.###", locale:"br"})});
													}else{
														history_table += "<td class='formula_valor' variation-index='0'>-</td>";
													}
												}
												history_table += "</tr></tbody>";
											});
											history_table += "</table>";
										}else{
											var history_table = "<table class='history'><thead><tr><th>nenhum registro encontrado</th></tr></thead></table>";
										}

										var variation_filter = "";
										if (vvariations.length > 0){
											variation_filter += "<div class='variation-filter'><span class='variation-filter'>Faixa: </span><select class='variation-filter'>";
											$.each(vvariations, function(index,item){
												variation_filter += "<option value='$$index'>$$name".render({
														index: item.index,
														name: item.name
													});
											});
											variation_filter += "</select></div>";
										}

										$(target).find(".historico-popup").html(variation_filter + history_table);
										$(target).find(".historico-popup").toggle();

										if (vvariations.length > 0){
											$(target).find(".historico-popup table .formula_valor[variation-index!=0]").hide();

											$("select.variation-filter").change(function(){
												var obj = $(this);
												$(obj).parent().next("table").find(".formula_valor").fadeOut("fast",function(){
													$(obj).parent().next("table").find(".formula_valor[variation-index='" + $(obj).val() + "']").show();
												});
											});
										}

									},
									error: function(data){

									}
								});
							});

							$("div.indicadores_list .eixos .title").click(function(){
								$(this).parent().find(".variable").toggle();
							});

							$.ajax({
								type: 'GET',
								dataType: 'json',
								url: api_path + '/api/public/user/$$userid/indicator/status?api_key=$$key'.render({
										key: $.cookie("key"),
										userid: $.cookie("user.id")
										}),
								success: function(data, textStatus, jqXHR){
									var dataStatus = data.status;
									$.each(dataStatus, function(index,value){
										var statusClass = "";
										if (dataStatus[index].without_data == 1){
											statusClass = "no-data";
										}else if (dataStatus[index].completed_except_last == 1){
											statusClass = "last-period";
										}else if (dataStatus[index].completed == 1){
											statusClass = "full";
										}else if (dataStatus[index].without_data == 0 && dataStatus[index].completed == 0 && dataStatus[index].completed_except_last == 0){
											statusClass = "some-data";
										}
										$(".indicadores_list .variable[indicator-id='$$indicator_id']".render({
													indicator_id: data.status[index].id
											})).addClass(statusClass);
									});
								}
							});

						},
						error: function(data){
							$("#aviso").setWarning({msg: "Erro ao carregar ($$codigo)".render({
										codigo: $.parseJSON(data.responseText).error
									})
							});
						}
					});
				}else if ($.getUrlVar("option") == "edit"){ //EDIT MYINDICATOR

					$.ajax({
						type: 'GET',
						dataType: 'json',
						url: api_path + '/api/indicator/$$id?api_key=$$key'.render({
								key: $.cookie("key"),
								id: getIdFromUrl($.getUrlVar("url"))
								}),
						success: function(data, textStatus, jqXHR){

							$("#dashboard-content .content").append("<div class='filter_indicator'></div><div class='clear'><br /></div><div class='filter_result'></div><div class='historico'></div>");

							var data_indicator = data;

							//mostra historico
							buildIndicatorHistory({"id":getIdFromUrl($.getUrlVar("url")),
												   "period":data_indicator.period,
												   "target":$("#dashboard-content .content div.historico")
												   });


							var newform = [];
							newform.push({label: "Fórmula", input: ["textlabel,textlabel_formula,ilabel"]});
							newform.push({label: "Período", input: ["textlabel,textlabel_periodo,ilabel"]});
							if (data_indicator.period == "yearly"){
								newform.push({label: "Data", input: ["select,date_filter,iselect"]});
							}else if(data_indicator.period == "monthly"){
								newform.push({label: "Data", input: ["select,date_filter_year,iselect","select,date_filter,iselect"]});
							}else if(data_indicator.period == "daily"){
								newform.push({label: "Data", input: ["text,date_filter,itextdata"]});
							}else{
								newform.push({label: "Data", input: ["select,date_filter,iselect"]});
							}

							var formbuild = $("#dashboard-content .content .filter_indicator").append(buildForm(newform,"Informe o Período"));
							$(formbuild).find("div .field:odd").addClass("odd");
							$(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

							var data_variables = [];
							$.ajax({
								async: false,
								type: 'GET',
								dataType: 'json',
								url: api_path + '/api/variable?api_key=$$key'.render({
										key: $.cookie("key"),
										userid: $.cookie("user.id")
										}),
								success: function(data, textStatus, jqXHR){
									$.each(data.variables, function(index,value){
										data_variables.push({"id":data.variables[index].id,"name":data.variables[index].name});
									});
								}
							});
							var data_vvariables = [];
							$.ajax({
								async: false,
								type: 'GET',
								dataType: 'json',
								url: api_path + '/api/indicator/variable?api_key=$$key'.render({
										key: $.cookie("key"),
										userid: $.cookie("user.id")
										}),
								success: function(data, textStatus, jqXHR){
									$.each(data.variables, function(index,value){
										data_vvariables.push({"id":data.variables[index].id,"name":data.variables[index].name});
									});
								}
							});

							$("#dashboard-content .content .filter_indicator #textlabel_formula").html(formataFormula(data_indicator.formula,data_variables,data_vvariables));

							$("#dashboard-content .content .filter_indicator #textlabel_periodo").html(variable_periods[data_indicator.period]);

							$("#dashboard-content .content .filter_indicator .botao-form[ref='enviar']").html("Cadastrar");

							$("#dashboard-content .content .filter_indicator .botao-form[ref='cancelar']").html("Voltar");
							$("#dashboard-content .content .filter_indicator .botao-form[ref='cancelar']").click(function(){
								resetWarnings();
								location.hash = "#!/myindicator";
							});

							if (data_indicator.period == "yearly"){
								$.ajax({
									type: 'GET',
									dataType: 'json',
									url: api_path + '/api/period/year?api_key=$$key'.render({
											key: $.cookie("key")
										}),
									success: function(data, textStatus, jqXHR){
										$.each(data.options, function(index,value){
											$("#dashboard-content .content .filter_indicator select#date_filter").append("<option value='$$value'>$$text</option>".render({
												text:data.options[index].text,
												value:data.options[index].value
												}));
										});
									}
								});
							}else if(data_indicator.period == "monthly"){
								$.ajax({
									type: 'GET',
									dataType: 'json',
									url: api_path + '/api/period/year?api_key=$$key'.render({
											key: $.cookie("key")
										}),
									success: function(data, textStatus, jqXHR){
										$("#dashboard-content .content .filter_indicator select#date_filter").hide();
										$("#dashboard-content .content .filter_indicator select#date_filter_year option").remove();
										$("#dashboard-content .content .filter_indicator select#date_filter_year").append("<option value=''>Selecione o ano</option>");
										$.each(data.options, function(index,value){
											$("#dashboard-content .content .filter_indicator select#date_filter_year").append("<option value='$$value'>$$text</option>".render({
												text:data.options[index].text,
												value:data.options[index].value
												}));
										});
										$("#dashboard-content .content .filter_indicator select#date_filter option:last").attr("selected","selected");

										$("#dashboard-content .content .filter_indicator select#date_filter_year").change(function(){
											$("#dashboard-content .content .filter_result").empty();
											$("#dashboard-content .content .filter_indicator select#date_filter option").remove();
											$("#dashboard-content .content .filter_indicator select#date_filter").hide();
											if ($(this).find("option:selected").val() != ""){
												$("#dashboard-content .content .filter_indicator select#date_filter").show();
												$.ajax({
													type: 'GET',
													dataType: 'json',
													url: api_path + '/api/period/year/$$year/month?api_key=$$key'.render({
															key: $.cookie("key"),
															year: $("#dashboard-content .content .filter_indicator select#date_filter_year option:selected").html()
														}),
													success: function(data, textStatus, jqXHR){
														$.each(data.options, function(index,value){
															$("#dashboard-content .content .filter_indicator select#date_filter").append("<option value='$$value'>$$text</option>".render({
																text:data.options[index].text.split(" - ")[1],
																value:data.options[index].value
																}));
														});
													}
												});
											}
										});
									}
								});
							}else if(data_indicator.period == "daily"){
								$.each(data_variables, function(index,value){
									$("#dashboard-content .content .filter_indicator input#date_filter").datepicker({
																									dateFormat: 'dd/mm/yy',
																									defaultDate: "0",
																									changeYear: true,
																									changeMonth: true
																									});
								});
							}

							$("#dashboard-content .content .filter_indicator #date_filter").change( function(){
								 $("#dashboard-content .content .filter_result").empty();
							});

							$("#dashboard-content .content .filter_indicator .botao-form[ref='enviar']").click(function(){
								$.loading();

								 $("#dashboard-content .content .filter_result").empty();

								$.ajax({
									type: 'GET',
									dataType: 'json',
									url: api_path + '/api/indicator/$$id/variable/period/$$period?api_key=$$key'.render({
											key: $.cookie("key"),
											id: getIdFromUrl($.getUrlVar("url")),
											period: $("#dashboard-content .content .filter_indicator select#date_filter option:selected").val()
											}),
									success: function(data, textStatus, jqXHR){
										var data_variables = data.rows;
										var data_vvariables;
										var data_variations;
										var newform = [];
										$.each(data_variables, function(index,item){
											if(item.type == "str"){
												newform.push({label: "<b>"+item.name+"</b>", input: ["textarea,var_$$id,itext".render({id:item.id})]});
											}else{
												newform.push({label: "<b>"+item.name+"</b>", input: ["text,var_$$id,itext".render({id:item.id})]});
											}
											newform.push({label: "Descrição", input: ["textlabel,textlabel_explanation_$$id,ilabel".render({id:item.id})]});
											newform.push({label: "Fonte", input: ["select,source_$$id,iselect source".render({id:item.id}),"text,source_$$id_new,itext300px".render({id:item.id})]});
											newform.push({label: "Observações", input: ["text,observations_$$id,itext".render({id:item.id})]});
											newform.push({type: "div"});
										});

										$.ajax({
											async: false,
											type: 'GET',
											dataType: 'json',
											url: api_path + '/api/indicator/$$id/variables_variation?api_key=$$key'.render({
													key: $.cookie("key"),
													id: getIdFromUrl($.getUrlVar("url"))
													}),
											success: function(data_variables_variation, textStatus, jqXHR){
												data_vvariables = data_variables_variation.variables_variations;
											}
										});

										$.ajax({
											async: false,
											type: 'GET',
											dataType: 'json',
											url: api_path + '/api/indicator/$$id/variation?api_key=$$key'.render({
													key: $.cookie("key"),
													id: getIdFromUrl($.getUrlVar("url"))
													}),
											success: function(data_variation, textStatus, jqXHR){
												data_variations = data_variation.variations;
												$.each(data_variations, function(index_variation,item_variation){
													newform.push({label: "Faixa", input: ["textlabel,textlabel_variation_$$id,ilabel".render({id:item_variation.id})]});
													$.each(data_vvariables, function(index_vvariables,item_vvariables){
														newform.push({label: "<b>"+item_vvariables.name+"</b>", input: ["text,v_$$var_id_var_$$id,itext".render({
																id: item_vvariables.id,
																var_id: item_variation.id
															})]});
													});
													if (data_vvariables.length > 0){
														newform.push({type: "div", class: "div_variacoes"});
													}
												});
											}
										});

										if (data_indicator.dynamic_variations == "1"){
											newform.push({label: "Nova Faixa", input: ["text,new_variation,itext"],  class: "nova_variacao"});
											newform.push({label: "", input: ["button,new_variation_add,botao-form"]});
											newform.push({type: "div"});
										}

										newform.push({label: "Meta", input: ["text,goal,itext"]});
										newform.push({label: "", input: ["checkbox,no_data,icheckbox"]});
										newform.push({label: "Justificativa", input: ["text,justification_of_missing_field,itext"]});

										var formbuild = $("#dashboard-content .content .filter_result").append(buildForm(newform,data_indicator.name));
										$(formbuild).find("div .field:odd").addClass("odd");
										$(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());
										$(formbuild).find("#new_variation_add").html("Adicionar");
										
										if (data_indicator.goal){
											var ref_meta = "";
											if (data_indicator.goal_operator){
												ref_meta += data_indicator.goal_operator + "&nbsp;";
											}
											ref_meta += data_indicator.goal;
											$(formbuild).find("#goal").after("<span class='ref-meta'>&nbsp;Ref. Meta:&nbsp;<span class='valor'>" + ref_meta + "</span></span>");
										}

										$.each(data_variables, function(index,item){
											setNewSource($("#dashboard-content .content select#source_"+item.id),$("#dashboard-content .content input#source_" + item.id + "_new"));
										});

										loadSources();

										$.each(data_variables, function(index,item){
											loadComboSources(sources,$("#dashboard-content .content select#source_"+item.id),$("#dashboard-content .content input#source_" + item.id + "_new"));
										});

										$(formbuild).find("#new_variation_add").click(function(){
											$(this).html("Aguarde...");
											$(this).unbind();
											addNewVariation();
										});

										function addNewVariation(){
											var variation_id;

											args = [{name: "api_key", value: $.cookie("key")},
													{name: "indicator.variation.create.name", value: $(formbuild).find("div.field.nova_variacao .input input").val()},
													{name: "indicator.variation.create.order", value: ($(formbuild).find(".div_variacoes").length+1)}
													];

											$.ajax({
												async: false,
												type: "POST",
												dataType: 'json',
												url: api_path + '/api/indicator/$$indicator_id/variation'.render({
														indicator_id: getIdFromUrl($.getUrlVar("url"))
													}),
												data: args,
												success: function(data, textStatus, jqXHR){

													variation_id = data.id
													$(formbuild).find("#new_variation_add").html("Adicionar");
													$(formbuild).find("#new_variation_add").click(function(){
														$(this).html("Aguarde...");
														$(this).unbind();
														addNewVariation();
													});
													//Adiciona nova variação na tela
													var newformVariation = '<div class="field "><div class="label">Faixa:</div><div class="input"><div class="ilabel" id="textlabel_variation_$$var_id">$$nome</div></div><div class="clear"></div></div>'.render({
												var_id: variation_id,
												nome: $(formbuild).find("div.field.nova_variacao .input input").val()
												});
													$.each(data_vvariables, function(index_vvariables,item_vvariables){
													newformVariation += '<div class="field  odd"><div class="label"><b>'+item_vvariables.name+'</b>:</div><div class="input"><input name="v_$$var_id_var_$$id" id="v_$$var_id_var_$$id" class="itext" type="text"></div><div class="clear"></div></div>'.render({
															id: item_vvariables.id,
															var_id: variation_id
														});
													});
													newformVariation += '<div class="div div_variacoes"></div>';

													$(formbuild).find("div.field.nova_variacao").before(newformVariation);

													$(formbuild).find("div.field.nova_variacao .input input").val("");

												},
												error: function(data){
													$(".filter_result .form-aviso").setWarning({msg: "Erro ao enviar. ($$erro)".render({
																erro: $.parseJSON(data.responseText).error
																})
													});
													$(formbuild).find("#new_variation_add").html("Adicionar");
													$(formbuild).find("#new_variation_add").click(function(){
														$(this).html("Aguarde...");
														$(this).unbind();
														addNewVariation();
													});
												}
											});

										}

										$("#dashboard-content .content .filter_result input#no_data").after("Não possuo os dados.");
										$("#dashboard-content .content .filter_result .field:last").hide();
										$("#dashboard-content .content .filter_result input#no_data").click(function(){
											if ($(this).attr("checked")){
												$("#dashboard-content .content .filter_result .field:last").show();
												$("#dashboard-content .content .filter_result input#goal").hide();
											}else{
												$("#dashboard-content .content .filter_result .field:last").hide();
												$("#dashboard-content .content .filter_result input#goal").show();
											}
										});

										$.each(data_variables, function(index,value){
											$("#dashboard-content .content .filter_result div#textlabel_explanation_$$id".render({id:data_variables[index].id})).html(data_variables[index].explanation)
											if (data_variables[index].value != null && data_variables[index].value != undefined && data_variables[index].value != ""){
												$("#dashboard-content .content .filter_result #var_$$id".render({id:data_variables[index].id})).val(data_variables[index].value);
												$("#dashboard-content .content .filter_result #source_$$id".render({id:data_variables[index].id})).val(data_variables[index].source);
												$("#dashboard-content .content .filter_result #observations_$$id".render({id:data_variables[index].id})).val(data_variables[index].observations);
											}else{
												$("#dashboard-content .content .filter_result #var_$$id".render({id:data_variables[index].id})).attr("disabled",false);
												$("#dashboard-content .content .filter_result #source_$$id".render({id:data_variables[index].id})).attr("disabled",false);
												$("#dashboard-content .content .filter_result #observations_$$id".render({id:data_variables[index].id})).attr("disabled",false);
												$("#dashboard-content .content .filter_result input#no_data").attr("disabled",false);
												$("#dashboard-content .content .filter_result #goal").attr("disabled",false);
											}
										});

										$.each(data_variations, function(index_variation,item_variation){
											$("#dashboard-content .content .filter_result div#textlabel_variation_$$id".render({id:item_variation.id})).html(item_variation.name)
										});
										
										$.each(data_vvariables, function(index_vvariables,item_vvariables){
											$.ajax({
												async: false,
												type: 'GET',
												dataType: 'json',
												url: api_path + '/api/indicator/$$indicator_id/variables_variation/$$id/values?valid_from=$$period&api_key=$$key'.render({
														key: $.cookie("key"),
														indicator_id: getIdFromUrl($.getUrlVar("url")),
														id: item_vvariables.id,
														period: $("#dashboard-content .content .filter_indicator select#date_filter option:selected").val()
														}),
												success: function(data, textStatus, jqXHR){
													$.loading.hide();
													$.each(data.values,function(index_value,item_value){
														var obj = "#dashboard-content .content .filter_result #v_$$var_id_var_$$id".render({
																id: item_vvariables.id,
																var_id: item_value.indicator_variation_id
															});
														$(obj).val(item_value.value);
														$(obj).attr("update","true");
														$(obj).attr("item-id",item_value.id);
													});
												},
												error: function(data){
													$.loading.hide();
												}
											});
										});
										$.loading.hide();
										$("#dashboard-content .content .filter_result .botao-form[ref='enviar']").click(function(){
											resetWarnings();

											$.each(data_variables, function(index,value){
												var data_formatada = "";
												if (data_indicator.period == "yearly" || data_indicator.period == "monthly"){
													data_formatada = $(this).parent().parent().find("#date_filter option:selected").val();
												}else if (data_indicator.period == "daily"){
													data_formatada = $(this).parent().parent().find("#date_filter").val();
												}
											});

											var informou_valores = true;
											var informou_valores_validos = true;
											var informou_vvalores_validos = true;
											var informou_fontes = true;
											$.each(data_variables, function(index,value){
												if ($("#dashboard-content .content .filter_result").find("#var_"+data_variables[index].id).val() == ""){
													informou_valores = false;
												}
												var valor = $("#dashboard-content .content .filter_result").find("#var_"+data_variables[index].id).val();
												if ($("#dashboard-content .content .filter_result").find("#var_"+data_variables[index].id).is("input")){
													valor = $.convertNumberToBd(valor);
													if (isNaN(valor)){
														informou_valores_validos = false;
													}
													if ($("#dashboard-content .content .filter_result").find("#var_"+data_variables[index].id).val() != "" && $("#dashboard-content .content .filter_result").find("#source_"+data_variables[index].id).val() == ""){
														informou_fontes = false;
													}
												}
											});

											if (data_vvariables.length > 0){
												$.each(data_variations,function(index_variation,item_variation){
													$.each(data_vvariables,function(index_variables,item_variables){
														var valor = $("#dashboard-content .content .filter_result").find("#v_"+item_variation.id + "_var_"+item_variables.id).val();
														valor = $.convertNumberToBd(valor);
														if (isNaN(valor) && valor != ""){
															informou_valores_validos = false;
														}
														if (!$.isInt(valor) && valor != ""){
															informou_vvalores_validos = false;
														}
													});
												});
											}

											if (!informou_valores && !$("#dashboard-content .content .filter_result input#no_data").attr("checked")){
												$(".filter_result .form-aviso").setWarning({msg: "Por favor informe os valores"});
											}else if (!informou_valores_validos && !$("#dashboard-content .content .filter_result input#no_data").attr("checked")){
												$(".filter_result .form-aviso").setWarning({msg: "Os valores devem ser apenas numéricos"});
											}else if (!informou_vvalores_validos && !$("#dashboard-content .content .filter_result input#no_data").attr("checked")){
												$(".filter_result .form-aviso").setWarning({msg: "Os valores devem ser apenas números inteiros"});
											}else if (!informou_fontes && !$("#dashboard-content .content .filter_result input#no_data").attr("checked")){
												$(".filter_result .form-aviso").setWarning({msg: "Por favor informe a fonte dos valores"});
											}else if ($("#dashboard-content .content .filter_result input#no_data").attr("checked") && $("#dashboard-content .content").find("#justification_of_missing_field").val() == ""){
												$(".filter_result .form-aviso").setWarning({msg: "Por favor informe a justificativa"});
											}else{
												$("#dashboard-content .content .filter_result .botao-form[ref='enviar']").hide();

												var cont_total = data_variables.length;
												var cont_sent = 0;
												var cont_returned = 0;

												var to_indicator = setInterval(function(){
													if (cont_sent < cont_total){
														if ($("#dashboard-content .content .filter_result").find("#var_"+data_variables[cont_sent].id).attr("disabled") == "disabled"){
															cont_sent++;
															cont_returned++;
														}else{
															var data_formatada = "";
															if (data_indicator.period == "yearly" || data_indicator.period == "monthly"){
																data_formatada = $("#dashboard-content .content .filter_indicator").find("#date_filter option:selected").val();
															}else if (data_indicator.period == "daily"){
																data_formatada = $("#dashboard-content .content .filter_indicator").find("#date_filter").val();
															}

															if (!$("#dashboard-content .content input#no_data").attr("checked")){
																args = [{name: "api_key", value: $.cookie("key")},
																		{name: "variable.value.put.value", value: $.convertNumberToBd($("#dashboard-content .content .filter_result").find("#var_"+data_variables[cont_sent].id).val())},
																		{name: "variable.value.put.source", value: $("#dashboard-content .content .filter_result").find("#source_"+data_variables[cont_sent].id).val()},
																		{name: "variable.value.put.observations", value: $("#dashboard-content .content .filter_result").find("#observations_"+data_variables[cont_sent].id).val()},
																		{name: "variable.value.put.value_of_date", value: data_formatada}
																		];
															}else if ($("#dashboard-content .content .filter_result").find("#var_"+data_variables[cont_sent].id).val() == ""){
																args = [{name: "api_key", value: $.cookie("key")},
																		{name: "variable.value.put.value", value: ""},
																		{name: "variable.value.put.source", value: ""},
																		{name: "variable.value.put.observations", value: $("#dashboard-content .content .filter_result").find("#observations_"+data_variables[cont_sent].id).val()},
																		{name: "variable.value.put.value_of_date", value: data_formatada}
																		];
															}else{
																args = [{name: "api_key", value: $.cookie("key")},
																		{name: "variable.value.put.value", value: $.convertNumberToBd($("#dashboard-content .content .filter_result").find("#var_"+data_variables[cont_sent].id).val())},
																		{name: "variable.value.put.source", value: $("#dashboard-content .content .filter_result").find("#source_"+data_variables[cont_sent].id).val()},
																		{name: "variable.value.put.observations", value: $("#dashboard-content .content .filter_result").find("#observations_"+data_variables[cont_sent].id).val()},
																		{name: "variable.value.put.value_of_date", value: data_formatada}
																		];
															}

															$.ajax({
																type: 'PUT',
																dataType: 'json',
																url: api_path + '/api/variable/$$var_id/value'.render({var_id: data_variables[cont_sent].id}),
																data: args,
																success: function(data, textStatus, jqXHR){
																	cont_returned++;
																},
																error: function(data){
																	$(".filter_result .form-aviso").setWarning({msg: "Erro ao editar. ($$erro)".render({
																				erro: data.statusText
																				})
																	});
																	$("#dashboard-content .content .filter_result .botao-form[ref='enviar']").show();
																}
															});
															cont_sent++;
														}
													}
													if (cont_returned >= cont_total){
														clearInterval(to_indicator);

														if (data_vvariables.length > 0){
															$.each(data_variations,function(index_variation,item_variation){
																$.each(data_vvariables,function(index_variables,item_variables){
																	var data_formatada = "";
																	if (data_indicator.period == "yearly" || data_indicator.period == "monthly"){
																		data_formatada = $("#dashboard-content .content .filter_indicator").find("#date_filter option:selected").val();
																	}else if (data_indicator.period == "daily"){
																		data_formatada = $("#dashboard-content .content .filter_indicator").find("#date_filter").val();
																	}

																	var ajax_method;
																	var ajax_id;
																	if ($("#dashboard-content .content .filter_result").find("#v_"+item_variation.id + "_var_"+item_variables.id).attr("update") != undefined){
																		ajax_method = "PUT";
																		ajax_option = "update";
																		ajax_id = $("#dashboard-content .content .filter_result").find("#v_"+item_variation.id + "_var_"+item_variables.id).attr("item-id");
																	}else{
																		ajax_method = "POST";
																		ajax_option = "create";
																		ajax_id = "";
																	}

																	args = [{name: "api_key", value: $.cookie("key")},
																			{name: "indicator.variation_value." + ajax_option + ".value", value: $.convertNumberToBd($("#dashboard-content .content .filter_result").find("#v_"+item_variation.id + "_var_"+item_variables.id).val())},
																			{name: "indicator.variation_value." + ajax_option + ".value_of_date", value: data_formatada},
																			{name: "indicator.variation_value." + ajax_option + ".indicator_variation_id", value: item_variation.id}
																			];

																	$.ajax({
																		async: false,
																		type: ajax_method,
																		dataType: 'json',
																		url: api_path + '/api/indicator/$$indicator_id/variables_variation/$$var_id/values'.render({
																				indicator_id: getIdFromUrl($.getUrlVar("url")),
																				var_id: item_variables.id
																			}),
																		data: args,
																		success: function(data, textStatus, jqXHR){
																			cont_returned++;
																		},
																		error: function(data){
																			$(".filter_result .form-aviso").setWarning({msg: "Erro ao editar. ($$erro)".render({
																						erro: $.parseJSON(data.responseText).error
																						})
																			});
																			$("#dashboard-content .content .filter_result .botao-form[ref='enviar']").show();
																		}
																	});
																});
															});
														}

														var send_justification_meta = false;

														var data_formatada = "";
														if (data_indicator.period == "yearly" || data_indicator.period == "monthly"){
															data_formatada = $("#dashboard-content .content .filter_indicator").find("#date_filter option:selected").val();
														}else if (data_indicator.period == "daily"){
															data_formatada = $("#dashboard-content .content .filter_indicator").find("#date_filter").val();
														}

														if ($("#dashboard-content .content input#no_data").attr("checked")){
															args = [{name: "api_key", value: $.cookie("key")},
																	{name: "user.indicator.create.justification_of_missing_field", value: $("#dashboard-content .content .filter_result").find("#justification_of_missing_field").val()},
																	{name: "user.indicator.create.valid_from", value: data_formatada},
																	{name: "user.indicator.create.indicator_id", value: getIdFromUrl($.getUrlVar("url"))}
																	];
															send_justification_meta = true;
														}else if ($("#dashboard-content .content .filter_result").find("#goal").val() != ""){
															args = [{name: "api_key", value: $.cookie("key")},
																	{name: "user.indicator.create.goal", value: $("#dashboard-content .content .filter_result").find("#goal").val()},
																	{name: "user.indicator.create.valid_from", value: data_formatada},
																	{name: "user.indicator.create.indicator_id", value: getIdFromUrl($.getUrlVar("url"))}
																	];
															send_justification_meta = true;
														}

														if (send_justification_meta){
															$.ajax({
																type: 'POST',
																dataType: 'json',
																url: api_path + '/api/user/$$userid/indicator'.render({
																				userid: $.cookie("user.id")
																			}),
																data: args,
																success: function(data, textStatus, jqXHR){
																	$("#aviso").setWarning({msg: "Cadastro editado com sucesso.".render({
																				codigo: jqXHR.status
																				})
																	});
																	$("#dashboard-content .content .filter_result .botao-form[ref='enviar']").show();
																	$("#dashboard-content .content .filter_result").empty();
																	//mostra historico
																	buildIndicatorHistory({"id":getIdFromUrl($.getUrlVar("url")),
																						   "period":data_indicator.period,
																						   "target":$("#dashboard-content .content div.historico")
																						   });
																},
																error: function(data){
																	$(".filter_result .form-aviso").setWarning({msg: "Valores enviados, mas ocorreu um erro ao enviar Justificativa/Meta. ($$erro)".render({
																				erro: $.parseJSON(data.responseText).error
																				})
																	});
																	$("#dashboard-content .content .filter_result .botao-form[ref='enviar']").show();
																}
															});
														}else{

															$("#aviso").setWarning({msg: "Cadastro editado com sucesso.".render({
																		codigo: jqXHR.status
																		})
															});
															$("#dashboard-content .content .filter_result .botao-form[ref='enviar']").show();
															$("#dashboard-content .content .filter_result").empty();
															//mostra historico
															buildIndicatorHistory({"id":getIdFromUrl($.getUrlVar("url")),
																				   "period":data_indicator.period,
																				   "target":$("#dashboard-content .content div.historico")
																				   });
														}
													}
												},500);

											}
										});
										$("#dashboard-content .content .botao-form[ref='cancelar']").click(function(){
											resetWarnings();
											$("#dashboard-content .content .filter_result").empty();
										});

									},
									error: function(data){
										$("#aviso").setWarning({msg: "Erro ao carregar ($$codigo)".render({
													codigo: $.parseJSON(data.responseText).error
												})
										});
									}
								});
							});
						}
					});
				}
			}else if (getUrlSub() == "mygroup"){
				/*  GRUPOS DE INDICADORES  */
				if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined){

					var userList = buildDataTable({
							headers: ["Nome","_"]
							});

					$("#dashboard-content .content").append(userList);

					$("#button-add").click(function(){
						resetWarnings();
						location.hash = "#!/" + getUrlSub() + "?option=add";
					});

					$("#results").dataTable( {
						  "oLanguage": {
										"sUrl": api_path + "/frontend/js/dataTables.pt-br.txt"
										},
						  "bProcessing": true,
						  "sAjaxSource": api_path + '/api/user_indicator_axis?api_key=$$key&content-type=application/json&columns=name,url,_,_'.render({
								key: $.cookie("key")
								}),
						  "aoColumnDefs": [
                        					{ "bSearchable": false, "bSortable": false, "sClass": "botoes", "sWidth": "60px", "aTargets": [ 1 ] }
                    					  ],
						   "fnDrawCallback": function(){
								DTdesenhaBotoes();
							}
					} );

				}else if ($.getUrlVar("option") == "add" || $.getUrlVar("option") == "edit"){

					var txtOption = ($.getUrlVar("option") == "add") ? "Cadastrar" : "Editar";

					var newform = [];

					newform.push({label: "Nome", input: ["text,name,itext"]});
					newform.push({label: "Indicadores", input: ["textarea,indicators,itext"]});

					var formbuild = $("#dashboard-content .content").append(buildForm(newform,txtOption));
					$(formbuild).find("div .field:odd").addClass("odd");
					$(formbuild).find(".form").width(890);
					$(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

					$("#dashboard-content .content textarea#indicators").hide();
					$("#dashboard-content .content textarea#indicators").after("<div id='group-editor'><div class='group-selected'><div class='indicator-list-selected'></div><div class='button'></div></div><div class='group-select'><div class='indicator-search'></div><div class='indicator-list'></div><div class='button'></div></div></div>");

					$("#dashboard-content .content #group-editor .indicator-search").append("<input id='indicator-search' placeholder='pesquisar'>");
					$("#dashboard-content .content #group-editor .group-select .button").append("<a href='#' id='indicator-add'>adicionar</a>");
					$("#dashboard-content .content #group-editor .group-selected .button").append("<a href='#' id='indicator-remove'>remover</a>");
					$("#group-editor .indicator-list-selected").append($("<div class='item no-items'></div>").html("nenhum indicador selecionado"));

					//carrega indicadores
					$.ajax({
						async: false,
						type: 'GET',
						dataType: 'json',
						url: api_path + '/api/indicator?api_key=$$key'.render({
										key: $.cookie("key")
								}),
						success: function(data, textStatus, jqXHR){
							// ordena indicadores pelo nome
							data.indicators.sort(function (a, b) {
								a = a.name,
								b = b.name;

								return a.localeCompare(b);
							});

							$.each(data.indicators, function(index,item){
								$("#group-editor .indicator-list").append($("<div class='item'></div>").attr({"indicator-id":item.id}).html(item.name));
							});
						},
						error: function(data){
							$("#aviso").setWarning({msg: "Erro ao carregar ($$codigo)".render({
										codigo: $.parseJSON(data.responseText).error
									})
							});
						}
					});

					$("#group-editor #indicator-search").keyup(function(){
						if ($(this).val() != ""){
							$("#group-editor .indicator-list :not(.remove, .no-items)").hide();
							var termo = $(this).val();
							var matches = $('#group-editor .indicator-list  :not(.remove, .no-items)').filter(function() {
								var match = normalize(termo);

								var pattern = match;
								var re = new RegExp(pattern,'g');

								return re.test( normalize($(this).text()) );
							});
							$(matches).fadeIn();
						}
					});

					$("#group-editor .indicator-list .item").click(function(e){
						if ($(this).hasClass("no-items")){
							return;
						}
						$(this).toggleClass("selected");
						if ($("#group-editor .indicator-list .selected").length > 0){
							$("#group-editor #indicator-add").addClass("active");
						}else{
							$("#group-editor #indicator-add").removeClass("active");
						}
					});
					$("#group-editor #indicator-add").live('click',function(e){
						e.preventDefault();
						if ($(this).hasClass("active")){
							addIndicatorList();
						}
					});

					$("#group-editor #indicator-remove").live('click',function(e){
						e.preventDefault();
						if ($(this).hasClass("active")){
							removeIndicatorList();
						}
					});

					function addIndicatorList(){
						$("#group-editor .indicator-list .selected").each(function(index,item){
							$("#group-editor .indicator-list-selected").append($("<div class='item'></div>").attr({"indicator-id":$(item).attr("indicator-id")}).html($(item).text()));
							$(item).removeClass("selected");
							$(item).addClass("remove");
						});
						$("#group-editor .indicator-list-selected .no-items").remove();
						$("#group-editor #indicator-add").removeClass("active");

						if ($("#group-editor .indicator-list :not(.remove)").length <= 0){
							$("#group-editor .indicator-list").append($("<div class='item no-items'></div>").html("nenhum indicador selecionado"));
						}

						$("#group-editor .indicator-list-selected .item").unbind();
						$("#group-editor .indicator-list-selected .item").click(function(e){
							if ($(this).hasClass("no-items")){
								return;
							}
							$(this).toggleClass("selected");
							if ($("#group-editor .indicator-list-selected .selected").length > 0){
								$("#group-editor #indicator-remove").addClass("active");
							}else{
								$("#group-editor #indicator-remove").removeClass("active");
							}
						});
					}

					function removeIndicatorList(){
						$("#group-editor .indicator-list-selected .selected").each(function(index,item){
							$("#group-editor .indicator-list .item[indicator-id='$$id']".render({id: $(item).attr("indicator-id")})).removeClass("remove");
							$(item).remove();
						});
						if ($("#group-editor .indicator-list-selected .item").length <= 0){
							$("#group-editor .indicator-list-selected").append($("<div class='item no-items'></div>").html("nenhum indicador selecionado"));
						}
						$("#group-editor #indicator-remove").removeClass("active");
						$("#group-editor .indicator-list .no-items").remove();
					}

					function getSelectedIndicators(){
						var selectedIndicators = [];
						$("#group-editor .indicator-list-selected .item").each(function(index,item){
							if (!$(item).hasClass("no-items")){
								selectedIndicators.push($(item).attr("indicator-id"));
							}
						});
						return selectedIndicators;
					}


					if ($.getUrlVar("option") == "add"){
						$("#dashboard-content .content .botao-form[ref='enviar']").click(function(){
							resetWarnings();
							if ($(this).parent().parent().find("#name").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe o Nome"});
							}else if (getSelectedIndicators().length <= 0){
								$(".form-aviso").setWarning({msg: "Por favor informe pelo menos um Indicador"});
							}else{
								args = [{name: "api_key", value: $.cookie("key")},
										{name: "user_indicator_axis.create.name", value: $(this).parent().parent().find("#name").val()}
										];

								$("#dashboard-content .content .botao-form[ref='enviar']").hide();
								var newId;
								$.ajax({
									type: 'POST',
									dataType: 'json',
									url: api_path + '/api/user_indicator_axis',
									data: args,
									success: function(data,status,jqXHR){
										newId = data.id;
										var selected = getSelectedIndicators();
										$.each(selected, function(index,value){
											args = [{name: "api_key", value: $.cookie("key")},
													{name: "user_indicator_axis_item.create.indicator_id", value: value},
													{name: "user_indicator_axis_item.create.position", value: index}
													];
											$.ajax({
												async: false,
												type: 'POST',
												dataType: 'json',
												url: api_path + '/api/user_indicator_axis/$$id/item'.render({id: newId}),
												data: args
											});
										});
										$("#aviso").setWarning({msg: "Cadastro efetuado com sucesso."});
										location.hash = "#!/"+getUrlSub();
									},
									error: function(data){
										switch(data.status){
											case 400:
												$("#aviso").setWarning({msg: "Erro ao cadastrar. ($$codigo)".render({
															codigo: $.parseJSON(data.responseText).error
															})
												});
												break;
										}
										$("#dashboard-content .content .botao-form[ref='enviar']").show();
									}
								});
							}
						});
					}else if ($.getUrlVar("option") == "edit"){
						$.ajax({
							async: false,
							type: 'GET',
							dataType: 'json',
							url: $.getUrlVar("url") + "?api_key=$$key".render({
										key: $.cookie("key")
								}),
							success: function(data,status,jqXHR){
								switch(jqXHR.status){
									case 200:
										$(formbuild).find("input#name").val(data.name);
										if (data.items.length > 0){
											var selectedIndicators = [];
											$.each(data.items, function(index,item){
												selectedIndicators.push(item.indicator_id);
												$("#group-editor .indicator-list .item[indicator-id='$$id']".render({
														id: item.indicator_id
													})).attr("item-id",item.id);
												$("#group-editor .indicator-list .item[indicator-id='$$id']".render({
														id: item.indicator_id
													})).addClass("selected");
											});
											addIndicatorList();
											$("#dashboard-content .content textarea#indicators").val(selectedIndicators.join(","));
										}
										break;
								}
							},
							error: function(data){
								switch(data.status){
									case 400:
										$(".form-aviso").setWarning({msg: "Erro: ($$codigo)".render({
													codigo: $.parseJSON(data.responseText).error
													})
										});
										break;
								}
							}
						});

						$("#dashboard-content .content .botao-form[ref='enviar']").click(function(){
							resetWarnings();
							if ($(this).parent().parent().find("#name").val() == ""){
								$(".form-aviso").setWarning({msg: "Por favor informe o Nome"});
							}else if (getSelectedIndicators().length <= 0){
								$(".form-aviso").setWarning({msg: "Por favor informe pelo menos um Indicador"});
							}else{
								args = [{name: "api_key", value: $.cookie("key")},
										{name: "user_indicator_axis.update.name", value: $(this).parent().parent().find("#name").val()}
										];

								$("#dashboard-content .content .botao-form[ref='enviar']").hide();
								$.ajax({
									type: 'POST',
									dataType: 'json',
									url: $.getUrlVar("url"),
									data: args,
									success: function(data, textStatus, jqXHR){
										newId = data.id;
										var selected = getSelectedIndicators();
										$.each(selected, function(index,value){
											if (!findInArray($("#dashboard-content .content textarea#indicators").val().split(","),value)){
												args = [{name: "api_key", value: $.cookie("key")},
														{name: "user_indicator_axis_item.create.indicator_id", value: value},
														{name: "user_indicator_axis_item.create.position", value: index}
														];
												$.ajax({
													async: false,
													type: 'POST',
													dataType: 'json',
													url: api_path + '/api/user_indicator_axis/$$id/item'.render({id: newId}),
													data: args
												});
											}
										});
										var old_selected = $("#dashboard-content .content textarea#indicators").val().split(",");
										$.each(old_selected, function(index,value){
											if (!findInArray(selected,value)){
												$.ajax({
													async: false,
													type: 'DELETE',
													dataType: 'json',
													url: api_path + '/api/user_indicator_axis/$$id/item/$$item_id'.render({
															id: newId,
															item_id: $("#group-editor .indicator-list .item[indicator-id='" + value + "']").attr("item-id")
															}),
													data: args
												});
											}
										});
										$("#aviso").setWarning({msg: "Cadastro editado com sucesso."});
										location.hash = "#!/"+getUrlSub();
										$("#dashboard-content .content .botao-form[ref='enviar']").show();
									},
									error: function(data){
										$(".form-aviso").setWarning({msg: "Erro ao editar. ($$erro)".render({
													erro: $.parseJSON(data.responseText).error
													})
										});
										$("#dashboard-content .content .botao-form[ref='enviar']").show();
									}
								});
							}
						});

					}
					$("#dashboard-content .content .botao-form[ref='cancelar']").click(function(){
						resetWarnings();
						history.back();
					});
				}else if ($.getUrlVar("option") == "delete"){
					deleteRegister({url:$.getUrlVar("url") + "?api_key=$$key".render({
													key: $.cookie("key")
											})});
				}
			}else if (getUrlSub() == "prefs"){

				var newform = [];

				newform.push({label: "Nome", input: ["text,name,itext"]});
				newform.push({label: "Email", input: ["text,email,itext"]});
				newform.push({label: "Senha", input: ["password,password,itext"]});
				newform.push({label: "Confirmar Senha", input: ["password,password_confirm,itext"]});

				if (findInArray(user_info.roles,"_prefeitura") || findInArray(user_info.roles,"_movimento")){
					newform.push({label: "Endereço", input: ["text,endereco,itext"]});
					newform.push({label: "Cidade", input: ["text,cidade,itext"]});
					newform.push({label: "Estado", input: ["text,estado,itext"]});
					newform.push({label: "Bairro", input: ["text,bairro,itext"]});
					newform.push({label: "CEP", input: ["text,cep,itext"]});
					newform.push({label: "Telefone", input: ["text,telefone,itext"]});
					newform.push({label: "Email de Contato", input: ["text,email_contato,itext"]});
					newform.push({label: "Telefone de Contato", input: ["text,telefone_contato,itext"]});
					newform.push({label: "Nome do responsável pelo cadastro", input: ["text,nome_responsavel_cadastro,itext"]});
					newform.push({label: "Resumo da Cidade (texto)", input: ["textarea,city_summary,itext"]});
				}

				if (findInArray(user_info.roles,"_prefeitura")){
					newform.push({label: "Carta Compromisso (PDF)", input: ["file,carta_compromisso,itext"]});
					newform.push({label: "Programa de Metas (PDF)", input: ["file,programa_metas,itext"]});
					newform.push({label: "Imagem do perfil da cidade", input: ["file,imagem_cidade,itext"]});
				}
				if (findInArray(user_info.roles,"_movimento")){
					newform.push({label: "Logo(imagem)<br /><font size='1'>(altura máx: 80 pixels)</font>", input: ["file,logo_movimento,itext"]});
					newform.push({label: "Imagem do<br />perfil da cidade<br /><font size='1'>(630x135 pixels)</font>", input: ["file,imagem_cidade,itext"]});
				}

				var formbuild = $("#dashboard-content .content").append(buildForm(newform,"Preferências"));
				$(formbuild).find("div .field:odd").addClass("odd");
				$(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

				$.ajax({
					type: 'GET',
					dataType: 'json',
					url: api_path + '/api/user/$$userid/?api_key=$$key'.render({
								userid: $.cookie("user.id"),
								key: $.cookie("key")
						}),
					success: function(data,status,jqXHR){
						switch(jqXHR.status){
							case 200:
								$(formbuild).find("input#name").val(data.name);
								$(formbuild).find("input#email").val(data.email);
								$(formbuild).find("input#endereco").val(data.endereco);
								$(formbuild).find("input#cidade").val(data.cidade);
								$(formbuild).find("input#estado").val(data.estado);
								$(formbuild).find("input#bairro").val(data.bairro);
								$(formbuild).find("input#cep").val(data.cep);
								$(formbuild).find("input#telefone").val(data.telefone);
								$(formbuild).find("textarea#city_summary").val(data.city_summary);
								$(formbuild).find("input#email_contato").val(data.email_contato);
								$(formbuild).find("input#telefone_contato").val(data.telefone_contato);
								$(formbuild).find("input#nome_responsavel_cadastro").val(data.nome_responsavel_cadastro);

								if (findInArray(user_info.roles,"_prefeitura")){
									if (data.files.programa_metas){
										$("input#arquivo_programa_metas").after("<br />[<a href='" + data.files.programa_metas + "' class='link-files' target='_blank'> arquivo atual </a>]");
									}
									if (data.files.carta_compromis){
										$("input#arquivo_carta_compromisso").after("<br />[<a href='" + data.files.carta_compromis + "' class='link-files' target='_blank'> arquivo atual </a>]");
									}
									if (data.files.imagem_cidade){
										$("input#arquivo_imagem_cidade").after("<br /><img src='" + data.files.imagem_cidade + "' border='0' class='imagem_preview'>");
									}
								}

								if (findInArray(user_info.roles,"_movimento")){
									if (data.files.logo_movimento){
										$("input#arquivo_logo_movimento").after("<br /><img src='" + data.files.logo_movimento + "' border='0' class='logo_preview'>");
									}
									if (data.files.imagem_cidade){
										$("input#arquivo_imagem_cidade").after("<br /><img src='" + data.files.imagem_cidade + "' border='0' class='imagem_preview'>");
									}
								}

								break;
						}
					},
					error: function(data){
						switch(data.status){
							case 400:
								$(".form-aviso").setWarning({msg: "Erro: ($$codigo)".render({
											codigo: $.parseJSON(data.responseText).error
											})
								});
								break;
						}
					}
				});

				$("#dashboard-content .content .botao-form[ref='enviar']").html("Salvar");

				$("#dashboard-content .content .botao-form[ref='enviar']").click(function(){
					if ($(this).attr("is-disabled") == 1) return false;

					var clickedButton = $(this);

					resetWarnings();
					if ($(this).parent().parent().find("#name").val() == ""){
						$(".form-aviso").setWarning({msg: "Por favor informe o Nome"});
					}else if ($(this).parent().parent().find("#email").val() == ""){
						$(".form-aviso").setWarning({msg: "Por favor informe o Email"});
					}else if ($(this).parent().parent().find("#password_confirm").val() != $(this).parent().parent().find("#password").val()){
						$(".form-aviso").setWarning({msg: "Confirmação de senha inválida"});
					}else{

						var sendForm = function(){

							args = [{name: "api_key", value: $.cookie("key")},
									{name: "user.update.name", value: $(".form").find("#name").val()},
									{name: "user.update.email", value: $(".form").find("#email").val()},
									{name: "user.update.endereco", value: $(".form").find("#endereco").val()},
									{name: "user.update.cidade", value: $(".form").find("#cidade").val()},
									{name: "user.update.estado", value: $(".form").find("#estado").val()},
									{name: "user.update.bairro", value: $(".form").find("#bairro").val()},
									{name: "user.update.cep", value: $(".form").find("#cep").val()},
									{name: "user.update.telefone", value: $(".form").find("#telefone").val()},
									{name: "user.update.email_contato", value: $(".form").find("#email_contato").val()},
									{name: "user.update.telefone_contato", value: $(".form").find("#telefone_contato").val()},
									{name: "user.update.nome_responsavel_cadastro", value: $(".form").find("#nome_responsavel_cadastro").val()},
									{name: "user.update.city_summary", value: $(".form").find("#city_summary").val()}
									];


							if ($(this).parent().parent().find("#password").val() != ""){
								args.push({name: "user.update.password", value: $(".form").find("#password").val()},
									{name: "user.update.password_confirm", value: $(".form").find("#password").val()});
							}
							$.ajax({
								type: 'POST',
								dataType: 'json',
								url: api_path + '/api/user/$$userid/?api_key=$$key'.render({
									userid: $.cookie("user.id"),
									key: $.cookie("key")
									}),
								data: args,
								success: function(data, textStatus, jqXHR){
									$(clickedButton).html("Salvar");
									$(clickedButton).attr("is-disabled",0);
									$("#aviso").setWarning({msg: "Preferências salvas.".render({
												codigo: jqXHR.status
												})
									});
									location.hash = "#!/"+getUrlSub();
								},
								error: function(data){
									$(".form-aviso").setWarning({msg: "Erro ao editar. ($$erro)".render({
												erro: $.parseJSON(data.responseText).error
												})
									});
									$(clickedButton).html("Salvar");
									$(clickedButton).attr("is-disabled",0);
								}
							});
						}

						var original_id = "";

						var sendFiles = function(){
							if (cont_files_sent < files_sent.length){
								var file = files_sent[cont_files_sent];
								var form = $("#formFileUpload_"+file);

								original_id = $('#arquivo_'+file).attr("original-id");

								$('#arquivo_'+file).attr({
														name: "arquivo",
														id: "arquivo"
													 });

								form.attr("action", api_path + '/api/user/$$userid/arquivo/$$tipo?api_key=$$key&content-type=application/json'.render({
										userid: $.cookie("user.id"),
										tipo: file,
										key: $.cookie("key")
										}));
								form.attr("method", "post");
								form.attr("enctype", "multipart/form-data");
								form.attr("encoding", "multipart/form-data");
								form.attr("target", "iframe_"+file);
								form.attr("file", $('#arquivo').val());
								cont_files_sent++;
								form.submit();
								$('#arquivo').attr({
														name: original_id,
														id: original_id
													 });

								$("#iframe_"+file).load( function(){

									var erro = 0;
									if ($(this).contents()){
										if 	($(this).contents().find('pre')){
											var retorno = $(this).contents().find('pre').text();
//												retorno = retorno.replace("<body><pre>","");
//												retorno = retorno.replace("</pre></body>","");
											retorno = $.parseJSON(retorno);
										}else{
											erro = 1;
										}
									}else{
										erro = 1;
									}

									if (erro == 0){
										if (!retorno.error){
											if (cont_files_sent < files_sent.length){
												sendFiles();
											}else{
												$(clickedButton).html("Enviando Dados do Formulário...");
												sendForm();
											}
										}else{
											$(".form-aviso").setWarning({msg: "Erro ao enviar arquivo " + file + " (" + retorno.error + ")"});
											$(clickedButton).html("Salvar");
											$(clickedButton).attr("is-disabled",0);
											cont_files_sent = files_sent.length;
											return;
										}
									}else{
										console.log("Erro ao enviar arquivo " + file);
										$(".form-aviso").setWarning({msg: "Erro ao enviar arquivo " + file});
										$(clickedButton).html("Salvar");
										$(clickedButton).attr("is-disabled",0);
										cont_files_sent = files_sent.length;
										return;
									}
								});
							}else{
								sendForm()
							}
						}

						var files = ["programa_metas","carta_compromisso","logo_movimento","imagem_cidade"];

						var files_sent = [];
						for (i = 0; i < files.length; i++){
							if ($(".form #arquivo_"+files[i]).val() != undefined){
								if ($(".form #arquivo_"+files[i]).val() != ""){
									files_sent.push(files[i]);
								}
							}
						}

						var cont_files_sent = 0;

						$(clickedButton).html("Salvando...");
						$(clickedButton).attr("is-disabled",1);

						$(clickedButton).html("Enviando Arquivos...");
						sendFiles();
					}
				});
				$("#dashboard-content .content .botao-form[ref='cancelar']").click(function(){
					if ($(this).attr("is-disabled") == 1) return false;
					resetWarnings();
					location.hash = "#!/dashboard";
				});
			}
		}else if (getUrlSub() == "logout"){
			if ($.cookie("key")){
				var url_logout = api_path + '/api/logout?api_key=$$key'.render({
									key: $.cookie("key")
							});
				resetCookies();
				$.ajax({
					type: 'GET',
					dataType: 'json',
					url: url_logout,
					success: function(data, textStatus, jqXHR){
						switch(jqXHR.status){
							case 200:
								resetWarnings();
								resetDashboard();
								location.hash = "";
								break;
						}
					}
				});
			}else{
				resetWarnings();
				resetDashboard();
				location.hash = "";
			}
		}else if(getUrlSub() == ""){
			if ($.cookie("key") == null || $.cookie("key") == ""){
				resetDashboard();
				$("#dashboard #form-login").show();
			}else{
				location.hash = "!/dashboard";
			}
		}
	}
	$(window).hashchange();

});

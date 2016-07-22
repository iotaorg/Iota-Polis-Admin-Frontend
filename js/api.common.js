var api_path = "";

var do_not_use_lex = !(window.location.href.indexOf("http://indicadores.redciudades.net") >= 0);

var cur_lang = $.cookie("cur_lang"),
    lexicon, default_lang, langs, lexiconconf,
    lexicon_untranslated = {},
    untranslated_temp = {};

if (!cur_lang || do_not_use_lex) {
    cur_lang = 'pt-br';
    $.cookie("cur_lang", cur_lang, {
        path: "/"
    });
}



$.assocArraySize = function(obj) {
    var size = 0,
        key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

if (!String.prototype.render2) {
    String.prototype.render2 = function(args) {
        var copy = this + '';
        for (var k in args) {
            copy = copy.replace(RegExp('\\$\\$' + k, 'g'), args[k]);
        }
        return copy;
    };
}

if (!String.prototype.render) {
    String.prototype.render = function(args) {
        var copy = this + '',
            v, n;

        if (do_not_use_lex == false) {
            if (lexicon[cur_lang] === undefined)
                lexicon[cur_lang] = [];
        }

        for (var k in args) {
            v = args[k];

            if (do_not_use_lex == false) {
                if (!k.match(/^_/) && v && v in lexicon[cur_lang]) {
                    v = lexicon[cur_lang][v];
                } else if (v) {

                    n = 1;
                    if (typeof v == 'string') {
                        n = 0;
                    }

                    if (n == 0 && (
                            k.match(/password/) ||
                            k.match(/email/) ||
                            k.match(/formula/) ||
                            k.match(/^_/) ||
                            k == 'key' ||
                            k == 'arquivo'
                        )) n = 1;
                    /*
                    if (n==0 && v.match(/^\</)) {
                        console.log(k);
                    }
        */
                    if (n == 0 && (!v ||
                            v == '&nbsp;' ||
                            v.match(/^\s*$/) ||
                            v.match(/^\/api\//) || !v.match(/[a-z]/i) ||
                            v.match(/^\s*[0-9]+\s*$/) ||
                            v.match(/\:\/\//) ||
                            v.match(/^#/)
                        )) n = 2;

                    if (n == 0) {
                        if (cur_lang == default_lang) {
                            lexicon[cur_lang][v] = v;
                            // precisa mandar pro servidor ter as outras versoes dessa e fazer a traducao
                            lexicon_untranslated[v] = 1;
                        } else {
                            lexicon_untranslated[v] = 1;
                            v = '? ' + v;
                        }
                    }
                    /*else {
                        if (n == 2) {
                            console.log(k, v);
                        }
                    }*/
                }
            }
            copy = copy.replace(RegExp('\\$\\$' + k, 'g'), v);
        }
        return copy;
    };
}

if (!String.prototype.trim) {
    String.prototype.trim = function() {
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

var normalize = function(term) {
    var ret = "";
    for (var i = 0; i < term.length; i++) {
        ret += accentMap[term.charAt(i)] || term.charAt(i);
    }
    return ret.toLowerCase();
};

$.extend({
    getUrlVars: function() {
        var vars = [],
            hash;
        var anchor = window.location.href.slice(window.location.href.indexOf('#') + 1);
        var hashes = anchor.slice(anchor.indexOf('?') + 1).split('&');
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    },
    getUrlVar: function(name) {
        return $.getUrlVars()[name];
    },
    convertDate: function(date, splitter) {
        var date_tmp = date.split(splitter);
        var date = date_tmp[0];
        var time = date_tmp[1];

        var date_split = date.split("-");

        return date_split[2] + "/" + date_split[1] + "/" + date_split[0];
    },
    convertDateTime: function(date, splitter) {
        var date_tmp = date.split(splitter);
        var date = date_tmp[0];
        var time = date_tmp[1];

        var date_split = date.split("-");

        return date_split[2] + "/" + date_split[1] + "/" + date_split[0] + " " + time;
    },
    convertDatetoBd: function(date, splitter) {
        var date_tmp = date.split(splitter);
        var date = date_tmp[0];
        var time = date_tmp[1];

        var date_split = date.split("/");

        return date_split[2] + "/" + date_split[1] + "/" + date_split[0];
    },
    convertDateToPeriod: function(date, period) {
        if (period == "yearly") {
            return date.split("-")[0];
        } else if (period == "monthly") {
            return date.split("-")[1] + "/" + date.split("-")[0];
        } else {
            return date + ' ' + period;
        }
    },
    convertNumberToBd: function(number) {
        var new_number = number.replace(",", ".");

        return new_number;
    },
    convertNumberFromBd: function(number) {
        if (number == null) {
            var new_number = "";
        } else if (number == undefined) {
            var new_number = "";
        } else if (number == 0) {
            var new_number = 0;
        } else {
            var new_number = number.replace(".", ",");
        }
        return new_number;
    },
    isInt: function(number) {
        return number % 1 === 0;
    },
    trataErro: function(data) {
        if (typeof(data) == "string") {
            if (sys_messages[data]) {
                return sys_messages[data];
            } else {
                return data;
            }
        } else if (typeof(data) == "object") {

            var erro;
            if (data.responseText && data.responseText.substr(0, 1) == '{') {
                var obj = $.parseJSON(data.responseText);
                if (obj.error && obj.error.substr(0, 1) == '{') {
                    erro = $.parseJSON(obj.error);
                } else if (obj.error) {
                    erro = {};
                    erro[obj.error] = 1;
                }

            } else {
                erro = {};
                erro[data.responseText.substr(0, 120)] = 1;
            }

            var msg = "";
            if (erro) {
                for (var key in erro) {
                    if (erro.hasOwnProperty(key)) {
                        if (sys_messages[key]) {
                            if (msg != "") msg += "<br />";
                            msg += sys_messages[key];
                        } else {
                            if (msg != "") msg += "<br />";
                            msg += key;
                        }
                    }
                }
            } else {
                msg = 'erro fatal' + data.status;
            }
            return msg;
        }
    },
    scrollToRegionList: function(id) {
        if ($("#region-list .selected").length <= 0) return;
        var position = parseInt($("#region-list .selected").offset().top - $("#region-list .item:first").offset().top);
        $('#region-list .contents').animate({
            scrollTop: position
        }, 'slow');
    },
    setSelectedRegion: function() {
        $("#region-selected span.selected").text($("#region-list .item.selected").text());
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

var menu_label = [];
var submenu_label = [];
var menu_access = [];
var submenu_access = [];


var user_info;
//lista roles
var roles = {
    "superadmin": "Super Administrador",
    "admin": "Administrador Geral",
    "user": "Prefeitura/Movimento da Rede",
    "app": "Aplicativos"
}
var languages_list = {
    "pt-br": "Português",
    "es": "Espanhol"
};
var indicator_roles = {
    "_prefeitura,_movimento": "Prefeituras e Movimentos",
    "_prefeitura": "Somente Prefeituras",
    "_movimento": "Somente Movimentos"
};
var visibility_level = {
    //"public": "Público",
    //"private": "Privado",
    //    "country": "por País",
    //    "restrict": "por Usuário"
    "network": "por Rede"
};
var indicator_types = {
    "normal": "normal",
    "varied": "variada",
    "varied_dyn": "variada dinâmica"
};
//lista tipos variaveis
var variable_types = {
    "int": "Inteiro",
    "str": "Alfanumérico",
    "num": "Valor"
};
var variable_periods = {
    "monthly": "Mensal",
    "yearly": "Anual",
    "trimestral": "Trimestral",
    "semiannual": "Semestral"
};
var goal_operators = {
    "": "",
    ">": "maior que",
    ">=": "maior ou igual a",
    "=": "igual a",
    "menor ou igual a": "<=",
    "menor que": "<"
};
var sort_directions = {
    "greater value": "MAIOR valor, melhor classificação",
    "lowest value": "MENOR valor, melhor classificação"
};

var precisions = {
    "0": "10",
    "20": "8",
    "100": "6",
    "200": "4",
    "500": "2",
    "500": "0"
};
var measurement_units = [];
var sources = [];

variacoes_list = [];
variacoes_id_temp = 0;
vvariacoes_list = [];
vvariacoes_id_temp = 0;


var estados = {
    "AC": "Acre",
    "AL": "Alagoas",
    "AM": "Amazonas",
    "AP": "Amapá",
    "BA": "Bahia",
    "CE": "Ceará",
    "DF": "Distrito Federal",
    "ES": "Espírito Santo",
    "GO": "Goiás",
    "MA": "Maranhão",
    "MG": "Minas Gerais",
    "MS": "Mato Grosso do Sul",
    "MT": "Mato Grosso",
    "PA": "Pará",
    "PB": "Paraíba",
    "PE": "Pernambuco",
    "PI": "Piauí",
    "PR": "Paraná",
    "RJ": "Rio de Janeiro",
    "RN": "Rio Grande do Norte",
    "RS": "Rio Grande do Sul",
    "RO": "Rondônia",
    "RR": "Roraima",
    "SC": "Santa Catarina",
    "SE": "Sergipe",
    "SP": "São Paulo",
    "RJ": "Rio de Janeiro",
    "RS": "Rio Grande do Sul",
    "TO": "Tocantins"
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

var findInArray = function(obj, value) {
    if (value == "") return true;
    var retorno = false;
    for (a = 0; a < obj.length; a++) {
        if (obj[a] == value) retorno = true;
    }
    return retorno;
}

var findInJson = function(obj, key, value) {
    var found = false;
    var key_found = "";
    $.each(obj, function(key1, value1) {
        $.each(obj[key1], function(key2, value2) {
            if (key2 == key) {
                if (value2 == value) {
                    found = true;
                    key_found = key1;
                    return false;
                }
            }
        });
    });
    var retorno = {
        "found": found,
        "key": key_found
    }
    return retorno;
}

var resetCookies = function() {
    $.cookie("user.id", null, {
        path: "/",
        expires: -5
    });
    $.cookie("key", null, {
        path: "/",
        expires: -5
    });
    $.cookie("user.id", null, {
        expires: -5
    });
    $.cookie("network.id", null, {
        expires: -5
    });
    $.cookie("key", null, {
        expires: -5
    });
}

$.fn.setWarning = function() {
    var args = arguments[0];

    $(this).hide();
    $(this).empty();

    $(this).html("<div>$$e</div>".render2({
        e: args.msg
    }));

    if (args.msg) {
        $(this).show("slow");
    }
};
$.fn.clearWarning = function() {
    $(this).hide();
    $(this).html("");
};


$.fn.offsetRelative = function(top) {
    var $this = $(this);
    var $parent = $this.offsetParent();
    var offset = $this.position();
    if (!top) return offset; // Didn't pass a 'top' element
    else if ($parent.get(0).tagName == "BODY") return offset; // Reached top of document
    else if ($(top, $parent).length) return offset; // Parent element contains the 'top' element we want the offset to be relative to
    else if ($parent[0] == $(top)[0]) return offset; // Reached the 'top' element we want the offset to be relative to
    else { // Get parent's relative offset
        var parent_offset = $parent.offsetRelative(top);
        offset.top += parent_offset.top;
        offset.left += parent_offset.left;
        return offset;
    }
};
$.fn.positionRelative = function(top) {
    return $(this).offsetRelative(top);
};

var findCidadePrefeito = function(city_id) {
    var retorno = "";
    for (i = 0; i < cidades_prefeitos.length; i++) {
        if (cidades_prefeitos[i].id == city_id) {
            var retorno = cidades_prefeitos[i].prefeito_id;
        }
    }
    return retorno;
}

var findCidadeMovimento = function(city_id) {
    var retorno = "";
    for (i = 0; i < cidades_prefeitos.length; i++) {
        if (cidades_prefeitos[i].id == city_id) {
            var retorno = cidades_prefeitos[i].movimento_id;
        }
    }
    return retorno;
}

var resetDashboard = function() {
    $("#aviso").setWarning({
        msg: ""
    });
    $("#top .top-right .logo").empty();
    $("#top .top-right .logo").addClass("empty");
    $("#user-info").remove();


    //    $("#content>.content").show();

    $("#menu ul.menu li").remove();
    $("#menu ul.menu").append("<li class='selected'>$$ee</li>".render({
        ee: 'Entrar'
    }));
    setTitleBar();
};
var resetWarnings = function() {
    $("#aviso").empty();
    $(".form-aviso").empty();
};

/*monta titleBar*/

var setTitleBar = function() {
    var pagina = getUrlSub();
    var option = $.getUrlVar("option");

    if (pagina == "") {
        pagina = "login";
    }

    $("#header-title .title").empty();;
    $("#header-title .description").empty();
    if (titleBarContent[pagina + "," + option]) {
        $("#header-title .title").html("$$a".render({
            a: titleBarContent[pagina + "," + option]["title"]
        }));
        if (titleBarContent[pagina + "," + option]["tip"] != "") {
            $("#header-title .description").html("$$a".render({
                a: titleBarContent[pagina + "," + option]["tip"]
            }));
        }
    } else if (titleBarContent[pagina]) {
        $("#header-title .title").html("$$a".render({
            a: titleBarContent[pagina]["title"]
        }));
        if (titleBarContent[pagina]["tip"] != "") {
            $("#header-title .description").html("$$a".render({
                a: titleBarContent[pagina]["tip"]
            }));
        }
    }
    if ($("#header-title .title").html() != "") {
        var d = document.title;
        document.title = d.substring(0, d.indexOf(' - ')) + ' - ' + $("#header-title .title").html();
    }
}

var buildList = function(args) {
    var url = args.url;
    var headers = args.headers;
    var fields = args.fields;
    var data = args.data;
    var button = args.button;

    var newlist = "";

    if (button == "undefined" || button == true) {
        newlist += buildButton("Adicionar", "button-add", "button-add");
    }

    newlist += "<table class='results'>";
    newlist += "<thead>";
    newlist += "<tr>";
    for (var key in headers) {
        newlist += "<th>" + headers[key] + "</th>";
    }
    newlist += "<th class='buttons'></th>";
    newlist += "</tr>";
    newlist += "</thead>";

    newlist += "<tbody>";

    $.each(data, function(index, value) {
        newlist += "<tr>";
        for (var key in fields) {
            newlist += "<td>" + data[index][fields[key]] + "</td>";
        }
        newlist += "<td class='buttons'><a href='$$hash?option=edit&url=$$url' class='icone edit' title='$$ee' alt='$$ee'>$$ee</a><a href='$$hash?option=delete&url=$$url' class='icone delete' title='$$dd' alt='$$dd'>$$dd</a></td>".render({
            hash: "#!/" + getUrlSub(),
            ee: 'editar',
            dd: 'apagar',
            url: data[index]["url"]
        });;
        newlist += "</tr>";
    });
    if (data.length == 0) {
        newlist += "<td colspan='20'><span class='noresults'>$$e</span></td>".render({
            e: 'Nenhum resultado encontrado'
        });
    }
    newlist += "<tbody>";
    newlist += "</table>";
    return newlist;
};
var buildDataTable = function(args, table_id, button_add, add_class) {
    var headers = args.headers;

    var newlist = "";

    if (button_add == undefined || button_add == true) {
        newlist += buildButton("Adicionar", "button-add", "button-add");
    }
    if (add_class == undefined || add_class == null) {
        add_class = "";
    }
    if (table_id == undefined || table_id == null) {
        table_id = "results";
    }

    newlist += "<table id='" + table_id + "' class='" + add_class + "'>";
    newlist += "<thead>";
    newlist += "<tr>";
    for (var key in headers) {
        newlist += "<th>$$x</th>".render({
            x: headers[key].replace("_", "&nbsp;")
        });
    }
    newlist += "</tr>";
    newlist += "</thead>";

    newlist += "<tbody>";
    newlist += "</tbody>";
    newlist += "</table>";
    return newlist;

};
var buildDTWithButton = function(args, table_id, button_add, add_class) {
    var headers = args.headers;

    var newlist = "";

    if (add_class == undefined || add_class == null) {
        add_class = "";
    }
    if (table_id == undefined || table_id == null) {
        table_id = "results";
    }

    newlist += "<table id='" + table_id + "' class='" + add_class + "'>";
    newlist += "<thead>";
    newlist += "<tr>";
    for (var key in headers) {
        newlist += "<th>$$x</th>".render({
            x: headers[key].replace("_", "&nbsp;")
        });
    }
    newlist += "</tr>";
    newlist += "</thead>";

    newlist += "<tbody>";
    newlist += "</tbody>";
    newlist += "</table>";
    return newlist;

};

var DTdesenhaBotoes = function() {
    $("#results td.botoes").each(function() {
        if ($(this).find("a").length <= 0) {
            var url = $(this).html();
            $(this).html("<a href='$$_hash?option=edit&url=$$_url' class='icone edit' title='$$ee' alt='$$ee'>$$ee</a><a href='$$_hash?option=delete&url=$$_url' class='icone delete' title='$$dd' alt='$$dd'>$$dd</a>".render({
                _hash: "#!/" + getUrlSub(),
                ee: 'editar',
                dd: 'apagar',
                _url: url
            }));
        }
    });
}

var DTdesenhaBtEntrar = function() {
    $("#results td.botoes").each(function() {
        if ($(this).find("a").length <= 0) {
            var url = $(this).html();

            $(this).html("<a href='$$_hash?option=save&url=$$_url' class='botao-form' title='$$ee' alt='$$ee'>$$ee</a>".render({
                _hash: "#!/" + getUrlSub(),
                ee: 'Participar',
                _url: url
            }));


        }
    });
}
var DTdesenhaBotaoVariavel = function() {
    $("#results td.botoes").each(function() {
        if ($(this).find("a").length <= 0) {
            var url = $(this).html();
            $(this).html("<a href='$$_hash?option=edit&url=$$_url' class='icone edit' title='$$aaa' alt='$$ee'>$$aav</a>".render({
                _hash: "#!/" + getUrlSub(),
                aaa: 'Adicionar Valor',
                aav: 'adicionar valor',
                ee: 'editar',
                _url: api_path + "/api/variable/" + url

            }));
        }
    });
}

function setup_jStepper(elm, is_num) {

    if (is_num) {
        $(elm).jStepper({
            maxDecimals: 6,
            minDecimals: 2,
            defaultValue: ''
        });

        $(elm).bind('blur', function() {

            var numValue = $(this).val();
            var me = $(this);
            numValue = numValue.replace(/,/g, '.');
            numValue = numValue.replace(',', '.');

            numValue = numValue + '';
            if (numValue.indexOf('.') != -1) {
                numValue = numValue.match(new RegExp('-{0,1}[0-9]+[\\.][0-9]*'));
            }

            numValue = numValue + '';
            if (numValue.indexOf('-') != -1) {
                numValue = numValue.match(new RegExp('-{0,1}[0-9]+[\\.]*[0-9]*'));
            }

            numValue = numValue + '';
            numValue = numValue.match(new RegExp('-{0,1}[0-9]+[\\.]*[0-9]*'));

            if (numValue === '' || numValue == '-' || numValue === null) {
                numValue = '0';
            }
            numValue = numValue + '';
            me.val(numValue.replace('.', ','))
        });
    } else {
        $(elm).jStepper({
            allowDecimals: false,
            defaultValue: ''
        });

        $(elm).bind('blur', function() {
            var numValue = $(this).val();
            var me = $(this);
            numValue = numValue.replace(/,/g, '.');
            numValue = numValue.replace(',', '.');

            numValue = numValue + '';
            if (numValue.indexOf('.') != -1) {
                numValue = numValue.match(new RegExp('-{0,1}[0-9]+[\\.][0-9]*'));
            }

            numValue = numValue + '';
            if (numValue.indexOf('-') != -1) {
                numValue = numValue.match(new RegExp('-{0,1}[0-9]+[\\.]*[0-9]*'));
            }

            numValue = numValue + '';
            numValue = numValue.match(new RegExp('-{0,1}[0-9]+[\\.]*[0-9]*'));

            if (numValue === '' || numValue == '-' || numValue === null) {
                numValue = '0';
            }
            numValue = parseInt(numValue, 10);
            numValue = numValue + '';
            me.val(numValue)
        });

    }
}

var buildForm = function(form_args, title) {
    var newform = "<div class='form'>";
    if (title) {
        newform += "<div class='title'>$$title</div>".render({
            title: title
        });
    }
    newform += "<div class='form-aviso'></div>";
    for (i = 0; i < form_args.length; i++) {
        if (form_args[i].type == "div") {
            if (form_args[i].class) {
                newform += "<div class='div $$class'></div>".render2({
                    class: form_args[i].class
                });
            } else {
                newform += "<div class='div'></div>";
            }
        } else if (form_args[i].type == "subtitle") {
            newform += "<div class='subtitle'>$$title</div>".render({
                title: form_args[i].title
            });
        } else if (form_args[i].type == "inverted") {
            if (form_args[i].class == undefined) form_args[i].class = "";
            newform += "<div class='field $$class'>".render2({
                class: form_args[i].class
            });
            var newinput;
            newform += "<div class='label'>";
            for (j = 0; j < form_args[i].input.length; j++) {
                var input_args = form_args[i].input[j].split(",");
                newinput = buildInput(input_args);
                newform += newinput;
            }
            newform += "</div>";
            if (form_args[i].label != "") {
                var separator = ":";
            } else {
                var separator = "";
            }
            newform += "<div class='input_label'>$$_bba$$label$$_bbc</div>".render({
                label: form_args[i].label,
                _bba: form_args[i].bold ? '<b>' : '',
                _bbc: form_args[i].bold ? '</b>' : ''
            });
            newform += "<div class='clear'></div>";
            newform += "</div>";
        } else {
            if (form_args[i].class == undefined) form_args[i].class = "";
            newform += "<div class='field $$class'>".render2({
                class: form_args[i].class
            });
            if (form_args[i].label != "") {
                var separator = ":";
            } else {
                var separator = "";
            }
            newform += "<div class='label'>$$_bba$$label$$_bbc$$_separator$$_extra</div>".render({
                label: form_args[i].label,
                _bba: form_args[i].bold ? '<b>' : '',
                _bbc: form_args[i].bold ? '</b>' : '',
                _extra: form_args[i].extra_label ? form_args[i].extra_label : '',
                _separator: separator
            });
            var newinput;
            newform += "<div class='input'>";
            for (j = 0; j < form_args[i].input.length; j++) {
                var input_args = form_args[i].input[j].split(",");
                newinput = buildInput(input_args);
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

    newform += "<div class='form-buttons'><a href='javascript: void(0);' class='botao-form' ref='enviar'>$$enviar</a><a href='javascript: void(0);' class='botao-form' ref='cancelar'>$$cancelar</a></div>".render({
        enviar: 'Enviar',
        cancelar: 'Cancelar'
    });

    return newform;
};

var buildInput = function(input_args) {
    switch (input_args[0]) {
        case "text":
        case "password":
            newinput = "<input type='$$type' name='$$id' id='$$id' class='$$class'>".render2({
                type: input_args[0],
                id: input_args[1],
                class: input_args[2]
            })
            break;
        case "select":
            newinput = "<select name='$$id' id='$$id' class='$$class'></select>".render2({
                id: input_args[1],
                class: input_args[2]
            })
            break;
        case "radio":
            newinput = "<input type='radio' name='$$id' id='$$id' class='$$class' />".render2({
                id: input_args[1],
                class: input_args[2]
            })
            break;
        case "checkbox":
            newinput = "<input type='checkbox' name='$$id' id='$$id' class='$$class' />".render2({
                id: input_args[1],
                class: input_args[2]
            })
            break;
        case "textarea":
            newinput = "<textarea name='$$id' id='$$id' class='$$class'></textarea>".render2({
                id: input_args[1],
                class: input_args[2]
            })
            break;
        case "textlabel":
            newinput = "<div class='$$class' id='$$id'></div>".render2({
                id: input_args[1],
                class: input_args[2]
            })
            break;
        case "file":
            newinput = "<form id='formFileUpload_$$id'><div class='file'><input type='file' name='arquivo_$$id' id='arquivo_$$id' original-id='arquivo_$$id' class='$$class'></div></form><iframe id='iframe_$$id' name='iframe_$$id' frameborder='0' class='upload'></iframe>".render2({
                id: input_args[1],
                class: input_args[2]
            })
            break;
        case "button":
            newinput = "<a href='javascript: void(0);' id='$$id' class='$$class'></a>".render2({
                id: input_args[1],
                class: input_args[2]
            })
            break;
    }
    return newinput;

}

var buildButton = function(label, classname, id) {
    var new_button = "<a href='javascript: void(0);' class='$$_class' id='$$_id'>$$label</a>".render({
        _class: classname,
        label: label,
        _id: id
    });
    return new_button;
};

var buildVariableHistory = function(var_id) {
    $("#dashboard-content .content div.historico").html("carregando");
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: api_path + '/api/user/$$userid/variable?api_key=$$key$$region'.render2({
            key: $.cookie("key"),
            userid: $.cookie("user.id"),
            region: ($("#dashboard-content .content select#region_id option:selected").val()) ? "&region_id=" + $("#dashboard-content .content select#region_id option:selected").val() : ""
        }),
        success: function(data, textStatus, jqXHR) {
            var data_variables = new Array();
            $.each(data.variables, function(index, value) {
                if (String(data.variables[index].variable_id) == getIdFromUrl($.getUrlVar("url"))) {
                    data_variables.push({
                        "id": data.variables[index].variable_id,
                        "name": data.variables[index].name,
                        "period": data.variables[index].period,
                        "values": data.variables[index].values
                    });
                }
            });

            //mostra historico

            var history_table = "";
            history_table += "<div class='title'>$$ss</div><div class='historic-content'><table class='history'><thead><tr><th>$$pe</th><th>$$val</th><th></th></tr></thead><tbody>".render({
                pe: 'Período',
                val: 'Valor',
                ss: 'Série Histórica'
            });
            $.each(data_variables[0].values, function(index, value) {
                history_table += "<tr data-value-id='$$value_id'><td class='periodo'>$$periodo</td>".render2({
                    periodo: $.convertDateToPeriod(data_variables[0].values[index].valid_from, data_variables[0].period),
                    value_id: data_variables[0].values[index].id
                });
                history_table += "<td class='valor'>$$_valor</td><td class='edit'><a href='javascript: void(0);' data-value-id='$$_value_id' class='edit'>$$ee</a>&nbsp;<a href='javascript: void(0);' data-value-id='$$_value_id' class='delete'>$$ff</a></td>".render({
                    ee: 'editar',
                    ff: 'apagar',
                    _valor: $.formatNumber(data_variables[0].values[index].value, {
                        format: "#,##0.###",
                        locale: "br"
                    }),
                    _data: $.format.date(data_variables[0].values[index].value_of_date, "dd/MM/yyyy"),
                    _value_id: data_variables[0].values[index].id
                });
                history_table += "</tr></tbody>";
            });
            if (data_variables[0].values.length <= 0) {
                history_table += "<tr><td class='no-data' colspan='10'>$$x</td></tr>".render({
                    x: 'nenhum registro'
                });
            }
            history_table += "</table>";
            history_table += "</div>";

            $("#dashboard-content .content div.historico").empty();
            $("#dashboard-content .content div.historico").append(history_table);
            $("#dashboard-content .content div.historic table").width($("#dashboard-content .content").find(".form").width());
            $("div.historico .title").click(function() {
                $(this).parent().find(".historic-content").toggle();
            });
            $("table.history a.edit").click(function() {

                // carrega Historico para editar

                $("table.history tbody tr").removeClass("selected");
                $(this).parent().parent().addClass("selected");
                var value_selected = $(this);

                var url = api_path + '/api/variable/$$var_id/value/$$value_id?api_key=$$key'.render({
                    key: $.cookie("key"),
                    var_id: getIdFromUrl($.getUrlVar("url")),
                    value_id: $(value_selected).attr("data-value-id")
                });
                if ($("#dashboard-content .content select#region_id option:selected").val()) {
                    url = api_path + '/api/city/$$city/region/$$region/value/$$value_id?api_key=$$key'.render({
                        key: $.cookie("key"),
                        value_id: $(value_selected).attr("data-value-id"),
                        city: getIdFromUrl(user_info.city),
                        region: $("#dashboard-content .content select#region_id option:selected").val()
                    });
                }

                $.ajax({
                    type: 'GET',
                    dataType: 'json',
                    url: url,
                    success: function(data, textStatus, jqXHR) {
                        $("#dashboard-content .content .form").find("input#value").val(data.value);
                        if (data_variables[0].period == "yearly") {
                            $("#dashboard-content .content .form").find("#value_of_date").val($.format.date(data.value_of_date, "yyyy-MM-dd"));
                            $("#dashboard-content .content .form").find("#value_of_date").attr("disabled", "disabled");
                        } else if (data_variables[0].period == "daily") {
                            $("#dashboard-content .content .form").find("#value_of_date").val($.convertDate(data.value_of_date, " "));
                        }
                        $("#dashboard-content .content .form").find(".title").html("Editar Valor");
                        $("#dashboard-content .content .botao-form[ref='enviar']").html("Editar");
                        $("#dashboard-content .content .botao-form[ref='cancelar']").html("Cancelar");
                    }
                });

            });
            $("table.history a.delete").click(function() {
                var value_selected = $(this);
                var url = api_path + '/api/variable/$$var_id/value/$$value_id?api_key=$$key'.render({
                    key: $.cookie("key"),
                    var_id: getIdFromUrl($.getUrlVar("url")),
                    value_id: $(value_selected).attr("data-value-id")
                });
                if ($("#dashboard-content .content select#region_id option:selected").val()) {
                    url = api_path + '/api/city/$$city/region/$$region/value/$$value_id?api_key=$$key'.render({
                        key: $.cookie("key"),
                        value_id: $(value_selected).attr("data-value-id"),
                        city: getIdFromUrl(user_info.city),
                        region: $("#dashboard-content .content select#region_id option:selected").val()
                    });
                }
                deleteRegister({
                    url: url,
                    redirect: false,
                    call: "buildVariableHistory"
                });
            });
        }
    });
}

function numKeys(obj) {
    var count = 0;
    for (var prop in obj) {
        count++;
    }
    return count;
}

var buildIndicatorHistory = function(args) {


    if (!$("#dashboard-content .content select#region_id option:selected").val()) {
        return false
    }

    $(args.target).empty();

    var cur_depth = $("#region_id option:selected").attr('data-dp');

    args.work_done = function(history_table) {

        if (cur_depth == 1){

            $(args.target).append("<div class='title' title='$$tt'>$$e</div><div class='historic-content'>".render({
                tt: 'mostrar/esconder Histórico',
                e: 'Série Histórica de dados regionais gerada automaticamente'
            }) + history_table + "</div>");

        }else if (cur_depth == 2){
            $(args.target).append("<div class='title' title='$$tt'>$$e</div><div class='historic-content'>".render({
                tt: 'mostrar/esconder Histórico',
                e:  'Série Histórica de região gerada automaticamente'
            }) + history_table + "</div>");


        }else{

            $(args.target).append("<div class='title' title='$$tt'>$$e</div><div class='historic-content'>".render({
                tt: 'mostrar/esconder Histórico',
                e:   'Série Histórica de dados municipais'
            }) + history_table + "</div>");

            _build_indicator_history_on_real_done(args);
        }


    };

    // nao foi gerado automaticamente
    args.can_delete = !(cur_depth == 1 || cur_depth == 2);


    $.ajax({
        type: 'GET',
        dataType: 'json',
        _arg: args,
        url: api_path + '/api/indicator/$$id/variable/value?api_key=$$key$$region'.render2({
            key: $.cookie("key"),
            id: args.id,
            region: '&region_id=' + $("#region_id option:selected").val()
        }),
        success: _build_indicator_history_success
    });

    if (cur_depth <= 2){
        args.can_delete = true;

        args.work_done = function(history_table) {
            $(args.target).append("<div class='title' title='$$tt'>$$e</div><div class='historic-content'>".render({
                tt: 'mostrar/esconder Histórico',
                e:  cur_depth == 1 ? 'Série Histórica de dados regionais inserida manualmente' : 'Série Histórica de região inserida manualmente'
            }) + history_table + "</div>");

            _build_indicator_history_on_real_done(args);
        };

        $.ajax({
            type: 'GET',
            dataType: 'json',
            _arg: args,
            url: api_path + '/api/indicator/$$id/variable/value?active_value=0&api_key=$$key$$region'.render2({
                key: $.cookie("key"),
                id: args.id,
                region: ($("#dashboard-content .content select#region_id option:selected").val()) ? "&region_id=" + $("#dashboard-content .content select#region_id option:selected").val() : ""
            }),
            success: _build_indicator_history_success
        });

    }

}

var _build_indicator_history_on_real_done = function(args){



    $("table.history a.delete").click(function(){ _build_indicator_history_delete( this, args ) } );

}

var _build_indicator_history_success = function(data, textStatus, jqXHR) {

    var args = this._arg;

    if (data.header && data.rows != undefined) {

        var can_delete = args.can_delete;
        var history_table = "";
        history_table += "<table class='history'><thead><tr><th>$$e</th>".render({
            e: 'Período'
        });

        var headers = []; //corrige ordem do header
        $.each(data.header, function(titulo, index) {
            headers[index] = titulo;
        });
        vvariations = [];
        var seta_vvariacoes = true;

        $.each(headers, function(index, value) {
            history_table += "<th class='variavel'>$$variavel</th>".render({
                variavel: value
            });
        });
        history_table += "#theader_valor";
        history_table += "</tr></thead><tbody>";
        var rows = 0;
        var variables_variations = [],
            th_valor = "",
            num_var = numKeys(data.variable_variations);

        if (data.variables_variations) {
            $.each(data.variables_variations, function(indexv, itemv) {
                variables_variations[itemv.id] = itemv.name;
            });
        }

        $.each(data.rows, function(index, value) {
            history_table += "<tr row-id='$$row'><td class='periodo'>$$periodo</td>".render2({
                periodo: $.convertDateToPeriod(data.rows[index].valid_from, args.period),
                row: rows
            });

            var cont = 0,
                num_var = numKeys(data.header);

            $.each(headers, function(index2, value2) {
                if (data.rows[index].valores[index2] && data.rows[index].valores[index2].value != "-" && data.rows[index].valores[index2].value != null && data.rows[index].valores[index2].value != undefined) {
                    if (isNaN(data.rows[index].valores[index2].value)) {

                        history_table += ("<td class='valor' title='$$data' data-value-id='$$id' variable-id='$$variable_id'>$$valor " + (can_delete ? "<a href='javascript: void(0);' class='delete delete-item' title='$$title' alt='$$title'>$$e</a>": "")  + "</td>").render2({
                            valor: data.rows[index].valores[index2].value,
                            data: $.convertDate(data.rows[index].valores[index2].value_of_date, "T"),
                            id: data.rows[index].valores[index2].id,
                            variable_id: data.rows[index].valores[index2].variable_id,
                            title: "Apagar valor",
                            e: "X"
                        });
                    } else {
                        history_table += ("<td class='valor' title='$$data' data-value-id='$$id' variable-id='$$variable_id'>$$valor " + (can_delete ? "<a href='javascript: void(0);' class='delete delete-item' title='$$title' alt='$$title'>$$e</a>": "" ) + "</td>").render2({
                            valor: $.formatNumber(data.rows[index].valores[index2].value, {
                                format: "#,##0.###",
                                locale: "br",
                            }),
                            data: $.convertDate(data.rows[index].valores[index2].value_of_date, "T"),
                            id: data.rows[index].valores[index2].id,
                            variable_id: data.rows[index].valores[index2].variable_id,
                            title: "Apagar valor",
                            e: "X"

                        });
                    }

                } else {
                    if (data.rows[index].valores[index2]) {
                        history_table += "<td class='valor' title='$$data' data-value-id='$$id'>-</td>".render({
                            data: $.convertDate(data.rows[index].valores[index2].value_of_date, "T"),
                            id: data.rows[index].valores[index2].id,
                            variable_id: data.rows[index].valores[index2].variable_id
                        });
                    } else {
                        history_table += "<td class='valor'>-</td>";

                    }
                }
                cont++;
            });
            for (i = cont; i < num_var; i++) {
                history_table += "<td class='valor'>-</td>";
            }


            history_table = (history_table.replace("#theader_valor", "<th class='formula_valor'>Valor da Fórmula</th>" + ( can_delete ? "<th></th>" : '')));

            if (data.rows[index].formula_value != "-") {
                history_table += "<td class='formula_valor' variation-index='0'>$$valor</td>".render2({
                    valor: $.formatNumber(data.rows[index].formula_value, {
                        format: "#,##0.###",
                        locale: "br"
                    })
                });
            } else {
                history_table += "<td class='formula_valor' variation-index='0'>-</td>";
            }

            history_table += ( can_delete ? "<td class='edit'><a href='javascript: void(0);' row-id='$$_row' class='delete delete-all'>$$f</a></td>" : "" ).render({
                _row: rows,
                f: 'apagar todos'
            });
            history_table += "</tr>";
            rows++;
        });
        history_table += "</tbody></table>";
    } else {
        var history_table = "<div class='historic-content'><table class='history'><thead><tr><th>$$e</th></tr></thead></table></div>".render({
            e: 'nenhum registro encontrado'
        });
    }

    /*var vvariations = [];
    var variation_filter = "";
    if (vvariations.length > 0) {
        variation_filter += "<div class='variation-filter'><span class='variation-filter'>$$f: </span><select class='variation-filter'>".render({
            f: 'Faixa'
        });
        $.each(vvariations, function(index, item) {
            variation_filter += "<option value='$$id' $$selected>$$name".render({
                id: item.id,
                name: item.name,
                selected: (index == 0) ? "selected" : ""
            });
        });
        variation_filter += "</select></div>";
    }*/

    /*$(args.target).empty();




*/
    args.work_done(history_table);

    /*
        if (vvariations.length > 0) {
            $(args.target).find("table .formula_valor[variation-id!=" + $("select.variation-filter option:selected").val() + "],table .variavel[variation-id!=" + $("select.variation-filter option:selected").val() + "]").hide();

            $("select.variation-filter").change(function() {
                var obj = $(this);
                $(obj).parent().next("table").find(".formula_valor,.variavel").fadeOut("fast", function() {
                    $(obj).parent().next("table").find(".formula_valor[variation-id='" + $(obj).val() + "'],.variavel[variation-id='" + $(obj).val() + "']").show();
                });
            });
        }
    */


};


var _build_indicator_history_delete = function(xthis, args) {

    var link_delete = xthis;

    $.confirm({
        'title': 'Confirmação',
        'message': 'Você irá excluir permanentemente esse registro.<br />Continuar?',
        'buttons': {
            'Sim': {
                'class': '',
                'action': function() {
                    var row = $("table.history tbody tr[row-id='$$row_id']".render({
                        row_id: $(link_delete).attr("row-id")
                    }));

                    if ($(link_delete).hasClass("delete-all")) {

                        var tds = $(row).find("td[variable-id]:visible");

                        var total_values = tds.length;

                        var total_values_enviados = 0;

                        $(tds).each(function(index, element) {


                            var url = api_path + '/api/variable/$$var_id/value/$$value_id?api_key=$$key'.render({
                                key: $.cookie("key"),
                                var_id: $(element).attr("variable-id"),
                                value_id: $(element).attr("data-value-id")
                            });

                            if ($(element).attr("variation-id")) {
                                url = api_path + '/api/indicator/$$indicator_id/variables_variation/$$variable_id/values/$$value_id?api_key=$$key'.render({
                                    key: $.cookie("key"),
                                    variable_id: $(element).attr("variable-id"),
                                    indicator_id: getIdFromUrl($.getUrlVar("url")),
                                    value_id: $(element).attr("data-value-id")
                                });
                            }
                            if ($("#dashboard-content .content select#region_id").length > 0 && ($("#dashboard-content .content select#region_id option:selected").val())) {
                                url = api_path + '/api/city/$$city/region/$$region/value/$$value_id?api_key=$$key'.render({
                                    key: $.cookie("key"),
                                    city: getIdFromUrl(user_info.city),
                                    region: $("#dashboard-content .content select#region_id option:selected").val(),
                                    value_id: $(element).attr("data-value-id")
                                });
                            }
                            resetWarnings();
                            $.ajax({
                                type: 'DELETE',
                                dataType: 'json',
                                url: url,
                                complete: function(jqXHR) {
                                    switch (jqXHR.status) {
                                        case 204:
                                            total_values_enviados++;
                                            $("#aviso").setWarning({
                                                msg: "Valor removido com sucesso."
                                            });
                                            if (total_values_enviados >= total_values) {
                                                buildIndicatorHistory(args);
                                            }
                                            break;
                                        case 400:
                                            total_values_enviados++;

                                            $("#aviso").setWarning({
                                                msg: "Erro: Você não pode apagar dados gerados automaticamente. Apague os valores inseridos manualmente no nível abaixo."
                                            });

                                            if (total_values_enviados >= total_values) {
                                                buildIndicatorHistory(args);
                                            };

                                            break;
                                    }
                                }
                            });
                        });
                    } else {


                        var url = api_path + '/api/variable/$$var_id/value/$$value_id?api_key=$$key'.render({
                            key: $.cookie("key"),
                            var_id: $(link_delete).parent().attr("variable-id"),
                            value_id: $(link_delete).parent().attr("data-value-id")
                        });
                        if ($(link_delete).parent().attr("variation-id")) {
                            url = api_path + '/api/indicator/$$indicator_id/variables_variation/$$variable_id/values/$$value_id?api_key=$$key'.render({
                                key: $.cookie("key"),
                                variable_id: $(link_delete).parent().attr("variable-id"),
                                indicator_id: getIdFromUrl($.getUrlVar("url")),
                                value_id: $(link_delete).parent().attr("data-value-id")
                            });
                        }
                        if ($("#dashboard-content .content select#region_id").length > 0 && ($("#dashboard-content .content select#region_id option:selected").val())) {
                            url = api_path + '/api/city/$$city/region/$$region/value/$$value_id?api_key=$$key'.render({
                                key: $.cookie("key"),
                                city: getIdFromUrl(user_info.city),
                                region: $("#dashboard-content .content select#region_id option:selected").val(),
                                value_id: $(link_delete).parent().attr("data-value-id")
                            });
                        }

                        $.ajax({
                            type: 'DELETE',
                            dataType: 'json',
                            url: url,
                            complete: function(jqXHR ) {

                                switch (jqXHR.status) {
                                    case 204:
                                        resetWarnings();
                                        $("#aviso").setWarning({
                                            msg: "Valor removido com sucesso."
                                        });
                                        buildIndicatorHistory(args);
                                        break;
                                    case 400:
                                        resetWarnings();
                                        $("#aviso").setWarning({
                                            msg: "Erro: Você não pode apagar dados gerados automaticamente. Apague os valores inseridos manualmente no nível abaixo."
                                        });
                                        buildIndicatorHistory(args);
                                        break;
                                }
                            }
                        });
                    }
                }
            },
            'Não': {
                'class': '',
                'action': function() {}
            }
        }
    });
};

var setNewSource = function(objSelect, objText) {
    $(objText).hide();
    $(objText).attr("placeholder", "descrição da nova fonte");
    $(objText).css("margin-top", "5px");
    if (!findInArray(user_info.roles, "user")) {
        $(objText).before("&nbsp;<a href='#' id='delete-source'>remover fonte</a><br />");
    }
    $(objText).after("&nbsp;<a href='#' id='add-source'>adicionar</a>");
    $(objSelect).next("a#delete-source").hide();
    $(objText).next("a#add-source").hide();
    $(objSelect).next("a#delete-source").click(function(e) {
        e.preventDefault();
        if ($(objSelect).find("option:selected").val() != "") {
            if ($(objSelect).find("option:selected").attr("source-id") == '?') {
                resetWarnings();
                $("#aviso").setWarning({
                    msg: "Fonte removida com sucesso."
                });

                loadSources();
                $("select.source").each(function(i, item) {
                    var _objSelect = $("select#" + $(item).attr("id"));
                    var _objText = $("input#" + $(item).attr("id") + "_new");
                    loadComboSources(sources, _objSelect, _objText);
                })
                $(params.element).val("");

            } else {
                deleteSource({
                    url: api_path + "/api/source/" + $(objSelect).find("option:selected").attr("source-id") + "?api_key=$$key".render2({
                        key: $.cookie("key")
                    }),
                    element: $(objSelect),
                    resetElement: true
                });
            }
        }
    });
    $(objText).next("a#add-source").click(function(e) {
        e.preventDefault();
        if ($(objText).val() == "") {
            $("#aviso").setWarning({
                msg: "Informe uma descrição para a fonte."
            });
            return;
        } else if ($(objText).val() == "_new") {
            $("#aviso").setWarning({
                msg: "Descrição para a fonte inválida."
            });
            return;
        }
        var args_source = [{
            name: "api_key",
            value: $.cookie("key")
        }, {
            name: "source.create.name",
            value: $(objText).val()
        }];
        var new_id;
        $.ajax({
            async: false,
            type: 'POST',
            dataType: 'json',
            url: api_path + '/api/source',
            data: args_source,
            success: function(data) {
                new_id = data.id;
            }
        });
        loadSources();
        $("select.source").each(function(i, item) {
            var _objSelect = $("select#" + $(item).attr("id"));
            var _objText = $("input#" + $(item).attr("id") + "_new");
            loadComboSources(sources, _objSelect, _objText);
        })
        $(objSelect).find("option[source-id='$$id']".render({
            id: new_id
        })).attr("selected", "selected");
        $(objText).hide();
        $(objText).next("a#add-source").hide();
        $(objSelect).next("a#delete-source").show();

    });
}

var loadComboSources = function(arr, objSelect, objText) {
    var old_selected = $(objSelect).find("option:selected").val();
    $(objSelect).empty();
    $(objSelect).append($("<option></option>").val("").html("nenhuma"));
    $(objSelect).append($("<option></option>").val("_new").html("- nova fonte"));

    $.each(arr, function(index, item) {
        if (user_info.id == item.user_id) {
            $(objSelect).append($("<option></option>").val(item.name).html(item.name).attr("source-id", item.id));
        }
    });

    $(objSelect).val(old_selected);

    $(objSelect).change(function(e) {
        $(objSelect).next("a#delete-source").hide();
        $(objText).next("a#add-source").hide();
        $(objText).hide();
        if ($(this).val() == "_new") {
            $(objText).show();
            $(objText).next("a#add-source").show();
        } else if ($(this).val() != "") {
            if (user_info.roles[0] == "admin") {
                $(objSelect).next("a#delete-source").show();
            }
            $(objText).next("a#add-source").hide();
        }
    });
}

var deleteSource = function(params) {
    $.ajax({
        async: false,
        type: 'DELETE',
        dataType: 'json',
        url: params.url,
        success: function(data, status, jqXHR) {
            switch (jqXHR.status) {
                case 204:
                    resetWarnings();
                    $("#aviso").setWarning({
                        msg: "Fonte removida com sucesso."
                    });
                    if (params.resetElement) {
                        loadSources();
                        $("select.source").each(function(i, item) {
                            var _objSelect = $("select#" + $(item).attr("id"));
                            var _objText = $("input#" + $(item).attr("id") + "_new");
                            loadComboSources(sources, _objSelect, _objText);
                        })
                        $(params.element).val("");
                    }
                    break;
            }
        },
        error: function(data) {
            switch (data.status) {
                case 200:
                    break;
                default:
                    $("#aviso").setWarning({
                        msg: "Erro: ($$codigo)".render({
                            codigo: data.status
                        })
                    });
                    break;
            }
        }
    });

}

var deleteUnit = function(params) {
    $.ajax({
        async: false,
        type: 'DELETE',
        dataType: 'json',
        url: params.url,
        success: function(data, status, jqXHR) {
            switch (jqXHR.status) {
                case 204:
                    resetWarnings();
                    $("#aviso").setWarning({
                        msg: "Unidade de medida removida com sucesso."
                    });
                    if (params.resetElement) {
                        loadUnits();
                        $("select.unit").each(function(i, item) {
                            var _objSelect = $("select#" + $(item).attr("id"));
                            var _objText = $("input#" + $(item).attr("id") + "_new");
                            var _objSg = $("input#" + $(item).attr("id") + "_sg_new");
                            loadComboUnits(measurement_units, _objSelect, _objText, _objSg);
                        })
                        $(params.element).val("");
                    }
                    break;
            }
        },
        error: function(data) {
            switch (data.status) {
                case 200:
                    break;
                default:
                    $("#aviso").setWarning({
                        msg: "Erro: ($$codigo)".render({
                            codigo: data.status
                        })
                    });
                    break;
            }
        }
    });

}

var deleteRegister = function(params) {
    $.confirm({
        'title': 'Confirmação',
        'message': 'Você irá excluir permanentemente esse registro.<br />Continuar?',
        'buttons': {
            'Sim': {
                'class': '',
                'action': function() {
                    $.ajax({
                        type: 'DELETE',
                        dataType: 'json',
                        url: params.url,
                        success: function(data, status, jqXHR) {
                            switch (jqXHR.status) {
                                case 204:
                                    resetWarnings();
                                    $("#aviso").setWarning({
                                        msg: "Cadastro apagado com sucesso."
                                    });
                                    if (params.redirect == undefined || params.redirect == true) {

                                        location.hash = "#!/" + getUrlSub();
                                    }
                                    if (params.call != undefined) {
                                        eval(params.call + "();");
                                    }
                                    break;
                            }
                        },
                        error: function(data) {
                            switch (data.status) {
                                case 200:
                                    break;
                                default:
                                    $("#aviso").setWarning({
                                        msg: "Erro: ($$codigo)".render({
                                            codigo: data.status
                                        })
                                    });
                                    if (params.redirect == undefined || params.redirect == true) {
                                        location.hash = "#!/" + getUrlSub();
                                    }
                                    break;
                            }
                        }
                    });
                }
            },
            'Não': {
                'class': '',
                'action': function() {
                    if (params.redirect == undefined || params.redirect == true) {
                        location.hash = "#!/" + getUrlSub();
                    }
                }
            }
        }
    });
}

var getUrlSub = function() {
    var hash = location.hash;
    var url_split = hash.split("#!");
    if (url_split.length > 1) {
        var url_split_sub = url_split[1].split("/");
        if (url_split_sub.length > 1) {
            var url_sub = url_split_sub[1];
        } else {
            var url_sub = url_split[1];
        }

        var url_split_sub = url_sub.split("?");
        if (url_split_sub.length > 1) {
            var url_sub = url_split_sub[0];
        } else {
            var url_sub = url_split_sub;
        }

    } else {
        var url_sub = "";
    }
    return url_sub;
};

var getIdFromUrl = function(url) {
    if (typeof(url) != "string") return undefined;
    if (url == undefined) return undefined;
    var split_url = url.split("/");
    if (split_url.length > 0) {
        return split_url[split_url.length - 1];
    } else {
        return null;
    }
}

$.confirm = function(params) {
    if ($("#dialog-overlay").length > 0) {
        return false;
    }

    var buttonHTML = '';
    $.each(params.buttons, function(name, obj) {
        buttonHTML += '<a href="javascript:;" class="button-default ' + obj['class'] + '">' + "$$a".render({
            a: name
        }) + '</a>';
        if (!obj.action) {
            obj.action = function() {};
        }
    });

    var confirmWindow = "<div id='dialog-overlay'>";
    confirmWindow += "<div id='dialog-box'>";
    confirmWindow += "<div id='dialog-content'>";
    confirmWindow += "<div id='dialog-title'>$$title</div>".render({
        title: params.title
    });
    confirmWindow += "<div id='dialog-message'>$$message</div>".render({
        message: params.message
    });
    confirmWindow += "<div id='dialog-buttons'>$$buttons</div>".render2({
        buttons: buttonHTML
    });
    confirmWindow += "</div></div></div>";

    $(confirmWindow).hide().appendTo("body").fadeIn();

    var buttons = $('#dialog-box .button-default'),
        i = 0;

    $.each(params.buttons, function(name, obj) {
        buttons.eq(i++).click(function() {
            $.confirm.hide(obj);
            return false;
        });
    });
};
$.confirm.hide = function(obj) {
    $('#dialog-overlay').fadeOut(function() {
        $(this).remove();
        if (obj) obj.action();
    });
}


$.loading = function(params) {
    if ($("#dialog-overlay").length > 0) {
        return false;
    }

    if (params) {
        if (params.title == undefined) params.title = "Carregando...";
    } else {
        params = {
            title: "Carregando..."
        };
    }
    var loadingWindow = "<div id='dialog-overlay'>";
    loadingWindow += "<div id='dialog-box'>";
    loadingWindow += "<div id='dialog-content'>";
    loadingWindow += "<div id='dialog-title'>$$title</div>".render({
        title: params.title
    });
    loadingWindow += "<div id='dialog-message'><div class='img-loading'></div></div>";
    loadingWindow += "</div></div></div>";

    $(loadingWindow).hide().appendTo("body").fadeIn("fast");

};
$.loading.hide = function() {
    $('#dialog-overlay').fadeOut(1000, function() {
        $(this).remove();
    });
}


var loadCidades = function() {
    cidades_prefeitos = [];
    $.ajax({
        async: false,
        type: 'GET',
        dataType: 'json',
        url: api_path + '/api/city?api_key=$$key'.render2({
            key: $.cookie("key")
        }),
        success: function(data, textStatus, jqXHR) {

            $.each(data.cities, function(index, value) {

                cidades_prefeitos.push({
                    "id": value.id,
                    "prefeito_id": value.prefeito_id,
                    "movimento_id": value.movimento_id
                });
            });

        },
        error: function(data) {
            $("#aviso").setWarning({
                msg: "Erro ao carregar ($$codigo)".render2({
                    codigo: $.parseJSON(data.responseText).error
                })
            });
        }
    });
}


var loadUnits = function() {
    measurement_units = [];
    $.ajax({
        async: false,
        type: 'GET',
        dataType: 'json',
        url: api_path + '/api/measurement_unit?api_key=$$key'.render2({
            key: $.cookie("key")
        }),
        success: function(data, textStatus, jqXHR) {
            $.each(data.measurement_units, function(index, item) {
                measurement_units.push({
                    "id": item.id,
                    "name": item.name
                });
            });

            measurement_units.sort(function(a, b) {
                a = a.name,
                    b = b.name;

                return a.localeCompare(b);
            });

        },
        error: function(data) {
            $("#aviso").setWarning({
                msg: "Erro ao carregar ($$codigo)".render2({
                    codigo: $.parseJSON(data.responseText).error
                })
            });
        }
    });
}

var loadComboUnits = function(arr, objSelect, objText, objSg) {
    var old_selected = $(objSelect).find("option:selected").val();
    $(objSelect).empty();
    $(objSelect).append($("<option></option>").val("").html("nenhuma"));
    $(objSelect).append($("<option></option>").val("_new").html("- nova unidade de medida"));
    $.each(arr, function(index, item) {
        $(objSelect).append($("<option></option>").val(item.id).html(item.name).attr("unit-id", item.id));
    });

    $(objSelect).val(old_selected);

    $(objSelect).change(function(e) {
        $(objSelect).next("a#delete-unit").hide();
        $(objSg).next("a#add-unit").hide();
        $(objText).hide();
        $(objSg).hide();
        if ($(this).val() == "_new") {
            $(objText).show();
            $(objSg).show();
            $(objSg).next("a#add-unit").show();
        } else if ($(this).val() != "") {
            if (user_info.roles[0] == "admin") {
                $(objSelect).next("a#delete-unit").show();
            }
            $(objSg).next("a#add-unit").hide();
        }
    });
}

var setNewUnit = function(objSelect, objText, objSg) {
    $(objText).hide();
    $(objText).attr("placeholder", "descrição da nova unidade de medida");
    $(objText).css("margin-top", "5px");
    $(objSg).hide();
    $(objSg).attr("placeholder", "sigla");
    $(objSg).css("margin-top", "5px");
    if (!findInArray(user_info.roles, "user")) {
        $(objText).before("&nbsp;<a href='#' id='delete-unit'>remover</a><br />");
    }
    $(objSg).after("&nbsp;<a href='#' id='add-unit'>adicionar</a>");
    $(objSelect).next("a#delete-unit").hide();
    $(objSg).next("a#add-unit").hide();
    $(objSelect).next("a#delete-unit").click(function(e) {
        e.preventDefault();
        if ($(objSelect).find("option:selected").val() != "") {
            deleteUnit({
                url: api_path + "/api/measurement_unit/" + $(objSelect).find("option:selected").attr("unit-id") + "?api_key=$$key".render2({
                    key: $.cookie("key")
                }),
                element: $(objSelect),
                resetElement: true
            });
        }
    });
    $(objSg).next("a#add-unit").click(function(e) {
        e.preventDefault();
        if ($(objText).val() == "") {
            $("#aviso").setWarning({
                msg: "Informe uma descrição para a unidade de medida."
            });
            return;
        } else if ($(objText).val() == "_new") {
            $("#aviso").setWarning({
                msg: "Descrição para a unidade de medida inválida."
            });
            return;
        } else if ($(objSg).val() == "") {
            $("#aviso").setWarning({
                msg: "Informe uma sigla para a unidade de medida."
            });
            return;
        } else if ($(objSg).val() == "_new") {
            $("#aviso").setWarning({
                msg: "Sigla para a unidade de medida inválida."
            });
            return;
        }
        var args_unit = [{
            name: "api_key",
            value: $.cookie("key")
        }, {
            name: "measurement_unit.create.name",
            value: $(objText).val()
        }, {
            name: "measurement_unit.create.short_name",
            value: $(objSg).val()
        }];
        var new_id;
        $.ajax({
            async: false,
            type: 'POST',
            dataType: 'json',
            url: api_path + '/api/measurement_unit',
            data: args_unit,
            success: function(data) {
                new_id = data.id;
            }
        });
        loadUnits();
        $("select.unit").each(function(i, item) {
            var _objSelect = $("select#" + $(item).attr("id"));
            var _objText = $("input#" + $(item).attr("id") + "_new");
            var _objSg = $("input#" + $(item).attr("id") + "_sg_new");
            loadComboUnits(measurement_units, _objSelect, _objText);
        })
        $(objSelect).find("option[unit-id='$$id']".render({
            id: new_id
        })).attr("selected", "selected");
        $(objText).hide();
        $(objSg).hide();
        $(objSg).next("a#add-unit").hide();
        $(objSelect).next("a#delete-unit").show();

    });
}

var loadSources = function() {
    sources = [];
    $.ajax({
        async: false,
        type: 'GET',
        dataType: 'json',
        url: api_path + '/api/source?api_key=$$key'.render2({
            key: $.cookie("key")
        }),
        success: function(data, textStatus, jqXHR) {
            $.each(data.sources, function(index, item) {
                sources.push({
                    "name": item.name,
                    "user_id": item.user_id,
                    "id": item.id
                });
            });

            sources.sort(function(a, b) {
                a = a.name,
                    b = b.name;

                return a.localeCompare(b);
            });

        },
        error: function(data) {
            $("#aviso").setWarning({
                msg: "Erro ao carregar ($$codigo)".render({
                    codigo: $.parseJSON(data.responseText).error
                })
            });
        }
    });
}


var buildLogin = function() {
    resetDashboard();
    $("#dashboard #form-login").show();
}

var formataFormula = function(formula, variables, vvariables) {
    var operators_caption = {
        "+": "+",
        "-": "-",
        "(": "(",
        ")": ")",
        "/": "÷",
        "*": "×",
        "CONCATENAR": ""
    };

    var new_formula = formula;

    variables.sort(function(a, b) {
        return b.id - a.id;
    });

    $.each(variables, function(index, value) {
        var pattern = "\\$" + variables[index].id;
        var re = new RegExp(pattern, "g");
        new_formula = new_formula.replace(re, variables[index].name + " ");
    });

    if (vvariables) {
        vvariables.sort(function(a, b) {
            return b.id - a.id;
        });
        $.each(vvariables, function(index, value) {
            var pattern = "\\#" + vvariables[index].id;
            var re = new RegExp(pattern, "g");
            new_formula = new_formula.replace(re, vvariables[index].name);
        });
    }

    $.each(operators_caption, function(index, value) {
        new_formula = new_formula.replace(index, " " + value + " ");
    });

    return new_formula.trim();
}

var getVariablesFromFormula = function(formula) {
    var indicator_variables = formula.replace(/[^0-9.\$]/g, " ").match(/\s\$[^\s]*|^\$[^\s]*/gi);
    for (i = 0; i < indicator_variables.length; i++) {
        indicator_variables[i] = indicator_variables[i].replace(" ", "");
        indicator_variables[i] = indicator_variables[i].replace("$", "");
    }
    return indicator_variables;
}

var trataCliqueVariaveis = function() {
    $("#formula-editor .variables .item").unbind();
    $("#formula-editor .variables .item").click(function(e) {
        if ($(this).hasClass("selected")) {
            $(this).removeClass("selected");
        } else {
            $(this).parent().find(".item").removeClass("selected");
            $(this).addClass("selected");
        }
        e.stopPropagation();
    });
    $("#formula-editor .variables .item").dblclick(function(e) {
        if (!$(this).hasClass("selected")) {
            $(this).parent().find(".item").removeClass("selected");
            $(this).addClass("selected");
        }
        $("#formula-editor .button").click();
        e.stopPropagation();
    });
}
var get_datatable_lang = function() {
    return {
        "sProcessing": "$$a".render({
            a: "Processando..."
        }),
        "sLengthMenu": "$$a".render({
            a: "Mostrar _MENU_ registros"
        }),
        "sZeroRecords": "$$a".render({
            a: "Não foram encontrados resultados"
        }),
        "sInfo": "$$a".render({
            a: "Mostrando de _START_ até _END_ de _TOTAL_ registros"
        }),
        "sInfoEmpty": "$$a".render({
            a: "Mostrando de 0 até 0 de 0 registros"
        }),
        "sInfoFiltered": "$$a".render({
            a: "(filtrado de _MAX_ registros no total)"
        }),
        "sInfoPostFix": "",
        "sSearch": "$$a".render({
            a: "Buscar:"
        }),
        "oPaginate": {
            "sFirst": "$$a".render({
                a: "Primeiro"
            }),
            "sPrevious": "$$a".render({
                a: "Anterior"
            }),
            "sNext": "$$a".render({
                a: "Seguinte"
            }),
            "sLast": "$$a".render({
                a: "Último"
            })
        }
    };
}

var carregaComboCidades = function(args) {
    $.ajax({
        async: false,
        type: 'GET',
        dataType: 'json',
        url: api_path + '/api/city?api_key=$$key'.render2({
            key: $.cookie("key")
        }),
        success: function(data, textStatus, jqXHR) {
            if (args) {
                if (args.option == "edit") {
                    $.each(data.citys, function(index, value) {
                        if (findCidadePrefeito(data.citys[index].id) == null || findCidadeMovimento(data.citys[index].id) == null) {
                            $("#dashboard-content .content select#city_id").append($("<option></option>").val(data.citys[index].id).html(data.citys[index].name + " (" + data.citys[index].uf + ")"));
                        } else {
                            if (findCidadePrefeito(data.citys[index].id) == getIdFromUrl(args.city) || findCidadeMovimento(data.citys[index].id) == getIdFromUrl(args.city)) {
                                $("#dashboard-content .content select#city_id").append($("<option></option>").val(data.citys[index].id).html(data.citys[index].name + " (" + data.citys[index].uf + ")"));
                            }
                        }
                    });
                    if (args.city != undefined) {
                        $("#dashboard-content .content select#city_id").val(getIdFromUrl(args.city));
                    }
                }
            } else {
                $.each(data.citys, function(index, value) {
                    if (findCidadePrefeito(data.citys[index].id) == null || findCidadeMovimento(data.citys[index].id) == null) {
                        $("#dashboard-content .content select#city_id").append($("<option></option>").val(data.citys[index].id).html(data.citys[index].name + " (" + data.citys[index].uf + ")"));
                    }
                });
            }
            $("#dashboard-content .content select#city_id").change(function() {
                var city_id = $(this).find("option:selected").val();
                var disabled = false;
                var checked = true;
                if (findCidadePrefeito($(this).find("option:selected").val()) != null) {
                    if ($.getUrlVar("option") == "edit") {
                        if (getIdFromUrl($.getUrlVar("url")) == findCidadePrefeito($(this).find("option:selected").val())) {
                            $("#dashboard-content .content input#prefeito").attr("checked", true);
                            $("#dashboard-content .content input#prefeito").attr("disabled", false);
                        } else {
                            $("#dashboard-content .content input#prefeito").attr("checked", false);
                            $("#dashboard-content .content input#prefeito").attr("disabled", true);
                        }
                    } else {
                        $("#dashboard-content .content input#prefeito").attr("checked", false);
                        $("#dashboard-content .content input#prefeito").attr("disabled", true);
                    }
                } else {
                    $("#dashboard-content .content input#prefeito").attr("checked", false);
                    $("#dashboard-content .content input#prefeito").attr("disabled", false);
                }

            });

        },
        error: function(data) {
            $("#aviso").setWarning({
                msg: "Erro ao carregar ($$codigo)".render({
                    codigo: $.parseJSON(data.responseText).error
                })
            });
        }
    });
}

var carregaComboCidadesUsers = function(args) {
    $.ajax({
        async: false,
        type: 'GET',
        dataType: 'json',
        url: api_path + '/api/city?api_key=$$key'.render2({
            key: $.cookie("key")
        }),
        success: function(data, textStatus, jqXHR) {
            data.cities.sort(function(a, b) {
                a = String(a.name),
                    b = String(b.name);
                return a.localeCompare(b);
            });
            var valid = true;
            $.each(data.cities, function(index, item) {
                valid = true;
                if (valid) {
                    $("#dashboard-content .content select#city_id").append($("<option></option>").val(item.id).html(item.name + " (" + item.uf + ")"));
                }
            });
        },
        error: function(data) {
            $("#aviso").setWarning({
                msg: "Erro ao carregar ($$codigo)".render({
                    codigo: $.parseJSON(data.responseText).error
                })
            });
        }
    });
}

var updateFormula = function() {
    var formula = "";
    $("#formula-editor .editor-content div").each(function(index, element) {
        if ($(this).hasClass("f-variable")) {
            formula += "$" + $(this).attr("var_id");
        } else if ($(this).hasClass("f-vvariable")) {
            formula += "#" + $(this).attr("var_id");
        } else if ($(this).hasClass("f-operator")) {
            formula += $(this).attr("val");
        } else {
            formula += $(this).html();
        }
    });
    $("textarea#formula").val(formula);
}

var convertFormulaToCss = function() {
    var operators = ["+", "-", "(", ")", "/", "*", "CONCATENAR"];
    var operators_caption = {
        "+": "+",
        "-": "-",
        "(": "(",
        ")": ")",
        "/": "÷",
        "*": "×",
        "CONCATENAR": "[ ]"
    };
    var formula = $("textarea#formula").val();
    formula = formula.replace("CONCATENAR", "CONCATENAR");
    var formula_css = "";
    for (i = 0; i < formula.length; i++) {
        if ($.inArray(formula[i], operators) >= 0) {
            formula_css += "<div class='f-operator' val='$$_val'>$$caption</div>".render({
                _val: formula[i],
                caption: operators_caption[formula[i]]
            });
        } else if (formula[i] == "$") {
            var var_id = "";
            var var_caption = "";
            for (j = i + 1; j < formula.length; j++) {
                if ($.inArray(formula[j], operators) >= 0 || formula[j] == "$" || formula[j] == "#") {
                    i = j - 1;
                    break;
                } else {
                    var_id += formula[j];
                    i = j;
                }
            }
            var_caption = $("#formula-editor .variables .item[var_id='" + var_id + "'][type='normal']").html();
            formula_css += "<div class='f-variable' var_id='$$_var_id'>$$caption</div>".render({
                _var_id: var_id,
                caption: var_caption
            });
        } else if (formula[i] == "#") {
            var var_id = "";
            var var_caption = "";
            for (j = i + 1; j < formula.length; j++) {
                if ($.inArray(formula[j], operators) >= 0 || formula[j] == "$" || formula[j] == "#") {
                    i = j - 1;
                    break;
                } else {
                    var_id += formula[j];
                    i = j;
                }
            }
            var_caption = $("#formula-editor .variables .item[var_id='" + var_id + "'][type='varied']").html();
            formula_css += "<div class='f-vvariable' var_id='$$_var_id'>$$caption</div>".render({
                _var_id: var_id,
                caption: var_caption
            });
        } else {
            var var_input = "";
            for (j = i; j < formula.length; j++) {
                if ($.inArray(formula[j], operators) >= 0 || formula[j] == "$") {
                    i = j - 1;
                    break;
                } else {
                    var_input += formula[j];
                    i = j;
                }
            }
            formula_css += "<div class='f-input'>$$caption</div>".render({
                caption: var_input
            });
        }
    }
    $("#formula-editor .editor-content").html(formula_css);
}

var sortSelectBox = function(id) {
    var options = $(id + ' option');
    var arr = options.map(function(_, o) {
        return {
            t: $(o).text(),
            v: o.value
        };
    }).get();
    arr.sort(function(o1, o2) {
        return o1.t > o2.t ? 1 : o1.t < o2.t ? -1 : 0;
    });
    options.each(function(i, o) {
        o.value = arr[i].v;
        $(o).text(arr[i].t);
    });
}

function load_lexicon(async) {

    if (do_not_use_lex)
        return true;

    lexiconconf = $.jStorage.get("lexicon");
    if (!lexiconconf) {

        $.ajax({
            async: async,
            beforeSend: function() {},
            dataType: 'json',
            cache: async ? false : true,
            url: api_path + '/api/public/lexicons',
            success: function(data, status, jqXHR) {

                lexiconconf = data;
                $.jStorage.set("lexicon", lexiconconf);

                lexicon = lexiconconf['lex'];
                langs = lexiconconf['langs'];
                default_lang = lexiconconf['default'];
            },
            error: function(data) {
                alert('erro ao carregar idiomas // error loading langs');
            }
        });
    } else {
        lexicon = lexiconconf['lex'];
        langs = lexiconconf['langs'];
        default_lang = lexiconconf['default'];
    }

}

load_lexicon(false);

setTimeout(function() {
    $.jStorage.set("lexicon", 0);
    load_lexicon(true);
}, 1000 * 60 * 3);


var sys_messages = {
    "Login invalid(1)": "Login inválido",
    "Login invalid(2)": "Login inválido",
    "user.update.network_ids.invalid 1": "Rede inválida."
};
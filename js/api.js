var UUID = (function() {
    var self = {};
    var lut = [];
    for (var i = 0; i < 256; i++) {
        lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
    }
    self.generate = function() {
        var d0 = Math.random() * 0xffffffff | 0;
        var d1 = Math.random() * 0xffffffff | 0;
        var d2 = Math.random() * 0xffffffff | 0;
        var d3 = Math.random() * 0xffffffff | 0;
        return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
            lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
            lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
            lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
    }
    return self;
})();
var _is_updating_lexicon = 0;
var SUPER_CACHE_data_region, SUPER_CACHE_data_variables, SUPERA_CACHE_YEARS;
$(document).ready(function() {


    /*MONTA TELAS*/

    $(window).hashchange(function() {
        $("#dashboard-content .content").empty();

        buildUserInterface();
    })

    $("#form-login form").submit(function(e) {
        e.preventDefault();
        resetWarnings();
        sendLogin();
    });


    var sendLogin = function() {
        args = [{
                name: "user.login.email",
                value: $("#form-login #usuario").val()
            },

            {
                name: "user.login.password",
                value: $("#form-login #senha").val()
            }
        ];

        $.ajax({
            type: 'POST',
            dataType: 'json',
            url: api_path + '/api/login',
            data: args,
            success: function(data, status, jqXHR) {
                switch (jqXHR.status) {
                    case 200:
                        resetWarnings();
                        $.cookie("user.login", data.login, {
                            expires: 1,
                            path: "/"
                        });
                        $.cookie("user.id", data.id, {
                            expires: 1,
                            path: "/"
                        });
                        $.cookie("key", data.api_key, {
                            expires: 1,
                            path: "/"
                        });
                        $("#dashboard #form-login").hide();
                        location.hash = "!/dashboard";

                        break;
                }
            },
            error: function(data) {
                if (data.responseText) {
                    $("#aviso").setWarning({
                        msg: "$$error".render2({
                            error: $.trataErro($.trataErro(data))
                        })
                    });
                } else {
                    $("#aviso").setWarning({
                        msg: "Erro ao fazer login. ($$error)".render2({
                            error: data.status
                        })
                    });
                }
            }
        });
    };

    var buildUserInterface = function() {
        if ($.cookie("key") != null && $.cookie("key") != "") {

            $('#content').slideUp();
            $.ajax({
                type: 'GET',
                dataType: 'json',
                async: true,
                url: api_path + '/api/user/$$userid?api_key=$$key'.render2({
                    userid: $.cookie("user.id"),
                    key: $.cookie("key")
                }),
                success: function(data, status, jqXHR) {
                    $("#content").stop(true, true).slideDown('fast');
                    //$("#content").show();

                    switch (jqXHR.status) {
                        case 200:
                            user_info = data;

                            user_info.role = "";

                            if (user_info.networks) {
                                if (user_info.networks[0]) {
                                    user_info.network = user_info.networks[0].id;
                                }
                            }

                            if (user_info.roles.length == 1) {
                                user_info.role = user_info.roles[0];
                            } else if (user_info.roles.length == 2) {
                                if (user_info.roles[0] == "user") {
                                    user_info.role = user_info.roles[0];
                                } else if (user_info.roles[1] == "user") {
                                    user_info.role = user_info.roles[1];
                                }
                            }


                            if (user_info.role != "") {
                                $("#top .top-right .info").html("<div id='user-info'> Usuário " + user_info.name + "</div>");

                                user_info.regions_enabled = true;


                                buildMenu();
                                setTitleBar();
                                buildContent();
                                break;
                            } else {
                                $.confirm({
                                    'title': 'Aviso',
                                    'message': 'Erro ao carregar informações do Usuário.',
                                    'buttons': {
                                        'Ok': {
                                            'class': '',
                                            'action': function() {
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
                error: function(data) {
                    $("#content").stop(true, true).slideDown('fast');
                    //$('#content').css('opacity', 1);
                    switch (data.status) {
                        case 400:
                            $("#aviso").setWarning({
                                msg: "Erro: ($$codigo)".render2({
                                    codigo: $.trataErro(data)
                                })
                            });
                            break;
                        case 403:
                            $.confirm({
                                'title': 'Aviso',
                                'message': 'Sua sessão expirou.',
                                'buttons': {
                                    'Ok': {
                                        'class': '',
                                        'action': function() {
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
                                        'class': '',
                                        'action': function() {
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
        } else {
            $("#content").show();
            resetCookies()
            resetDashboard();
            buildLogin();
        }
    };
    var buildMenu = function() {
        if ($("#menu ul li").length > 0) {
            $("#menu ul li").remove();
            $("#menu ul").addClass("menu");
        }
        $("#dashboard-content #top").after(menu);

        menu_label = [];
        submenu_label = [];
        menu_access = [];

        menu_label["dashboard"] = "Início";
        menu_label["admins"] = "Administradores";
        menu_label["users"] = "Usuários";
        menu_label["variable"] = "Variáveis";
        menu_label["customize"] = "Customização";
        menu_label["content"] = "Conteúdo";
        menu_label["axis"] = "Eixos";
        menu_label["indicator"] = "Indicadores";
        menu_label["topic"] = "Temas";
        menu_label["indicator_user"] = "Indicadores";
        menu_label["variable_user"] = "Variáveis";
        menu_label["region"] = "Regiões";
        menu_label["networks"] = "Ações";
        menu_label["parameters"] = "Configurações";
        menu_label["logs"] = "Logs";
        menu_label["prefs"] = "Preferências";


        menu_label["premio"] = "Inscrição para o Prêmio";
        menu_label["logout"] = "Sair";

        submenu_label["parameters"] = [];
        submenu_label["parameters"].push({
            "countries": "Países"
        });
        submenu_label["parameters"].push({
            "states": "Estados"
        });
        submenu_label["parameters"].push({
            "cities": "Cidades"
        });
        submenu_label["parameters"].push({
            "units": "Gerenciar unidades de medidas",
            "prefs": "Preferências do usuário"
        });

        submenu_label["customize"] = [];
        submenu_label["customize"].push({
            "menus": "Menus",
            "files_upload":"Arquivos de valores enviados"
        });
        submenu_label["customize"].push({
            "pages": "Páginas"
        });
        submenu_label["customize"].push({
            "css": "CSS",
            "files": "Arquivos"
        });

        submenu_label["content"] = [];
        submenu_label["content"].push({
            "best_pratice": "Boas Práticas",
        });

        submenu_label["indicator_user"] = [];
        submenu_label["indicator_user"].push({
            "indicator": "Gerenciar indicadores",
            "myindicator": "Valores por indicador",
            "mygroup": "Grupos de Indicadores"
        });


        submenu_label["variable_user"] = [];
        submenu_label["variable_user"].push({
            "myvariable": "Variáveis Básicas",
            "variable": "Gerenciar variáveis",
            "myvariableedit": "Valores por variável",
            "myvariableclone": "Clonar Valores"
        });

        submenu_label["region"] = [];
        submenu_label["region"].push({
            "region-list": "Cadastro",
            "region-map": "Definir Regiões no Mapa"
        });

        menu_access["superadmin"] = ["dashboard", "parameters", "customize", "networks", "variable_user", "indicator_user", "logout", ];
        submenu_access["superadmin"] = ["units", "myindicator", "indicator", "myvariableedit", "variable", "menus", "pages", "files","files_upload", "prefs"];


        var menu_item = "";
        $.each(menu_access[user_info.role], function(index, value) {
            var a_menu_class = (getUrlSub() == value) ? "selected" : "";
            var a_class = "";

            if (submenu_label[value]) {
                a_class = "submenu";
                var submenu_item = "<ul class='submenu'>";
                $.each(submenu_label[value], function(index, item) {


                    $.each(item, function(url_sub, text) {
                        if (findInArray(submenu_access[user_info.role], url_sub)) {

                            a_menu_class = a_menu_class ? a_menu_class : (getUrlSub() == url_sub) ? "selected" : "";

                            submenu_item += "<li class='submenu $$_class' ref='$$_url_sub'><a href='#!/$$_url_sub'>$$text</a></li>".render({
                                text: text,
                                _url_sub: url_sub,
                                _class: ""
                            });
                        }
                    });
                });
                submenu_item += "</ul>";
            } else {
                var submenu_item = "";
            }

            menu_item += "<li class='$$_class' ref='$$_url_sub'><a href='#!/$$_value' class='$$_a_class'>$$menu_label</a>$$_sub</li>".render({
                _value: value,
                menu_label: menu_label[value],
                _sub: submenu_item,
                _url_sub: value,
                _class: a_menu_class,
                _a_class: a_class
            });
        });
        $("#menu ul.menu").append(menu_item);
        $("#menu ul.menu li a").click(function(e) {
            if ($(this).hasClass("submenu")) {
                e.preventDefault();
            }
            resetWarnings();
        });
        var tSubmenu;
        $("#menu ul.menu li a.submenu").hover(function() {
            $("#menu ul.menu").find("ul").hide();

            if (typeof(tSubmenu) != "undefined") clearTimeout(tSubmenu);

            $(this).parent().find("ul").show();
        }, function() {
            var obj = $(this);
            if (typeof(tSubmenu) != "undefined") clearTimeout(tSubmenu);
            tSubmenu = setTimeout(function() {
                $(obj).next("ul.submenu").hide();
            }, 500);

        });
        $("#menu ul.submenu").hover(function() {
            if (typeof(tSubmenu) != "undefined") clearTimeout(tSubmenu);
        }, function() {
            var obj = $(this);
            if (typeof(tSubmenu) != "undefined") clearTimeout(tSubmenu);
            tSubmenu = setTimeout(function() {
                $(obj).hide();
                if (typeof(tSubmenu) != "undefined") clearTimeout(tSubmenu);
            }, 500);

        });
    };

    var current_map_string = '';
    var map;

    $map = function() {

        var drawingManager;
        var selectedShape;
        var objTriangle = [];
        var color = [];
        color["default"] = '#00B6C1';
        color["select"] = '#FFC21E';
        color["edit"] = '#FF1E1E';

        // perguntar a precisao
        // 0 = 100%
        // 20 = muito alta
        // 100 = media
        // 200 = ruim
        // 500 = ruim demais
        // 1000 = estranho

        var _precisao = 20;

        var _binds = {
            on_selection_unavaiable: null,
            on_selection_available: null,
        };

        var _is_visible = 1;

        function hide_controls() {
            _is_visible = 0;

            if (typeof _binds.on_selection_unavaiable == 'function') {
                _binds.on_selection_unavaiable();
            }
        }

        function show_controls() {
            if (_is_visible == 1) return;
            _is_visible = 1;

            if (typeof _binds.on_selection_available == 'function') {
                _binds.on_selection_available();
            }
        }

        // na hora de salvar usa o conteudo do current_map_string

        function clearSelection() {
            if (selectedShape) {
                setColor("default");
                selectedShape.setEditable(false);
                selectedShape = null;
                current_map_string = '';
                hide_controls();
                $("#panel-map #edit-button").addClass("disabled");
                $("#panel-map #delete-button").addClass("disabled");
                if ($("#region-list .item.selected").length <= 0) {
                    $("#panel-map #save-button").addClass("disabled");
                }
            }
        }

        function setSelection(shape) {
            clearSelection();
            selectedShape = shape;
            setColor("select");
            $("#panel-map #edit-button").removeClass("disabled");
            $("#panel-map #delete-button").removeClass("disabled");
            if ($("#region-list .item.selected").length > 0) {
                $("#panel-map #save-button").removeClass("disabled");
            }
        }

        function setShapeEditable() {
            $("#panel-map #edit-button").addClass("disabled");
            setColor("edit");
            selectedShape.setEditable(true);
        }

        function getSelection() {

        }

        function saveSelectedShape() {
            if ($("#save-button").length > 0) {
                if ($("#save-button").hasClass("disabled")) {
                    return;
                }
            }

            if ($("#region-list .selected").length <= 0 || (!$("#region-list .selected").attr("region-id"))) {
                $("#aviso").setWarning({
                    msg: "Nenhuma região selecionada."
                });
                return;
            } else if (!current_map_string) {
                $.confirm({
                    'title': 'Confirmação',
                    'message': 'Nenhuma forma foi selecionada. <br />Deseja salvar assim mesmo?',
                    'buttons': {
                        'Sim': {
                            'class': '',
                            'action': function() {
                                Save();
                            }
                        },
                        'Não': {
                            'class': '',
                            'action': function() {
                                return;
                            }
                        }
                    }
                });
            } else {
                $.confirm({
                    'title': 'Confirmação',
                    'message': 'Tem certeza que deseja associar essa forma à região "$$regiao"?'.render2({
                        regiao: $("#region-list .item.selected").text()
                    }),
                    'buttons': {
                        'Sim': {
                            'class': '',
                            'action': function() {
                                Save();
                            }
                        },
                        'Não': {
                            'class': '',
                            'action': function() {
                                return;
                            }
                        }
                    }
                });
            }

            function Save() {

                var action = "update";
                var method = "POST";
                var url_action = api_path + "/api/city/$$city/region/$$region?api_key=$$key&with_polygon_path=1&limit=1000".render2({
                    key: $.cookie("key"),
                    city: getIdFromUrl(user_info.city),
                    region: $("#region-list .selected").attr("region-id")
                });

                args = [{
                    name: "api_key",
                    value: $.cookie("key")
                }, {
                    name: "city.region." + action + ".polygon_path",
                    value: current_map_string
                }];

                $.ajax({
                    type: method,
                    dataType: 'json',
                    url: url_action,
                    data: args,
                    success: function(data, status, jqXHR) {

                        if (!selectedShape.region_index) {
                            var index = objTriangle.length;

                            selectedShape.region_index = index;

                            objTriangle.push(selectedShape);

                        }
                        $("#region-list .selected").attr("region-index", selectedShape.region_index);
                        updateDataRegions($("#region-list .selected").attr("region-id"), current_map_string);

                        $("#aviso").setWarning({
                            msg: "Operação efetuada com sucesso."
                        });
                    },
                    error: function(data) {
                        $("#aviso").setWarning({
                            msg: "Erro na operação. ($$codigo)".render2({
                                codigo: $.trataErro(data)
                            })
                        });
                    }
                });
            }
        }

        function editSelectedShape() {
            if ($("#save-button").length > 0) {
                if ($("#save-button").hasClass("disabled")) {
                    //return;
                }
            }
            if (selectedShape) {
                setShapeEditable(selectedShape);
            }
        }

        function deleteSelectedShape() {
            if ($("#delete-button").length > 0) {
                if ($("#delete-button").hasClass("disabled")) {
                    return;
                }
            }
            if (selectedShape) {
                if ($("#region-list").length > 0) {
                    $("#region-list .item[region-index=" + selectedShape.region_index + "]").attr("region-index", "");
                }
                selectedShape.setMap(null);
                objTriangle[selectedShape.region_index] = null;
                current_map_string = '';
                hide_controls();
            }
        }

        function deleteShape(shape) {
            if (shape) {
                if ($("#region-list").length > 0) {
                    //                  $("#region-list .item[region-index=" + shape.region_index + "]").removeClass("selected");
                    $("#region-list .item[region-index=" + shape.region_index + "]").attr("region-index", "");
                }
                shape.setMap(null);
                objTriangle[shape.region_index] = null;
            }
        }

        function _deleteAllShapes() {
            $.each(objTriangle, function(index, item) {
                deleteShape(item);
            });
            objTriangle = [];
        }

        function selectColor(status) {
            if (!status) status = 'default';
            // Retrieves the current options from the drawing manager and replaces the
            // stroke or fill color as appropriate.

            var polygonOptions = drawingManager.get('polygonOptions');
            polygonOptions.fillColor = color[status];
            drawingManager.set('polygonOptions', polygonOptions);
        }

        function setColor(status) {
            if (!selectedShape) return;
            if (!status) status = 'default';
            // Retrieves the current options from the drawing manager and replaces the
            // stroke or fill color as appropriate.

            selectedShape.setOptions({
                fillColor: color[status]
            });
        }

        function _store_string(theShape) {
            if (typeof theShape.getPath == "function") {
                current_map_string = google.maps.geometry.encoding.encodePath(theShape.getPath());
            }
            show_controls();
        }

        function _addPolygon(args) {
            if (!(current_map_string) && !(args.map_string) && !(args.kml_string)) return;

            if (!args.kml_string) {
                if (current_map_string && !(args.map_string)) args.map_string = current_map_string
                var triangleCoords = google.maps.geometry.encoding.decodePath(args.map_string);
            } else {
                var triangleCoords = [];

                $.each(args.kml_string.latlng, function(indexx, lnt) {
                    triangleCoords.push(new google.maps.LatLng(lnt[1], lnt[0]));
                });

                if ($("#precision-slider").slider("value")) {
                    _precisao = parseInt($("#precision-slider").slider("value"));
                } else {
                    _precisao = 0;
                }

                triangleCoords = GDouglasPeucker(triangleCoords, _precisao);
            }

            var index = objTriangle.length;

            objTriangle.push(new google.maps.Polygon({
                paths: triangleCoords,
                fillColor: color['default'],
                strokeWeight: 1,
                strokeOpacity: 0.45,
                fillOpacity: 0.45,
                editable: false,
                region_index: index
            }));

            objTriangle[index].setMap(map);

            if (args.focus) map.fitBounds(objTriangle[index].getBounds());

            google.maps.event.addListener(objTriangle[index], 'click', function() {
                if ($("#region-list").length > 0) {
                    if ($("#region-list .item[region-index=" + this.region_index + "]").length > 0) {
                        $("#region-list .item").removeClass("selected");
                        $("#region-list .item[region-index=" + this.region_index + "]").addClass("selected");
                        $.scrollToRegionList(this.region_index);
                        $.setSelectedRegion();
                    }
                }
                setSelection(this);
                _store_string(this);
            });
            google.maps.event.addListener(objTriangle[index].getPath(), 'insert_at', function() {
                _store_string(this);
            });
            google.maps.event.addListener(objTriangle[index].getPath(), 'set_at', function() {
                _store_string(this);
            });
            if (args.select) {
                setSelection(objTriangle[index]);
                _store_string(objTriangle[index]);
            }

            if (args.region_id) {
                $("#region-list .item[region-id=" + args.region_id + "]").attr("region-index", index);
            }
        }

        function _selectPolygon(index) {
            if (!index) return;

            map.fitBounds(objTriangle[index].getBounds());

            setSelection(objTriangle[index]);
            _store_string(objTriangle[index]);
        }

        function _editPolygon(index) {
            if (!index) return;

            map.fitBounds(objTriangle[index].getBounds());

            setShapeEditable(objTriangle[index]);
            _store_string(objTriangle[index]);
        }

        function _focusAll() {
            var super_bound = null;
            $.each(objTriangle, function(a, elm) {

                if (super_bound == null) {
                    super_bound = elm.getBounds();
                    return true;
                }

                super_bound = super_bound.union(elm.getBounds());
            });

            if (!(super_bound == null)) {
                map.fitBounds(super_bound);
            }
        }

        function _getObjTriangle(index) {
            if (objTriangle) {
                if (objTriangle[index]) {
                    return objTriangle[index];
                } else {
                    return null;
                }
            } else {
                return null;
            }
        }

        function updateDataRegions(id, string) {
            var i = "";
            $.each(data_regions.regions, function(index, item) {
                if (item.id == id) {
                    i = index;
                }
            });
            if (i) {
                data_regions.regions[i].polygon_path = string;
            }
        }

        function initialize(params) {

            if (typeof params.on_selection_unavaiable == 'function')
                _binds.on_selection_unavaiable = params.on_selection_unavaiable;

            if (typeof params.on_selection_available == 'function')
                _binds.on_selection_available = params.on_selection_available;


            map = new google.maps.Map(document.getElementById('map'), {
                zoom: 5,
                center: params.center,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                disableDefaultUI: true,
                zoomControl: true
            });

            var polyOptions = {
                fillColor: color['default'],
                strokeWeight: 0,
                fillOpacity: 0.45,
                editable: true,
            };
            // Creates a drawing manager attached to the map that allows the user to draw
            // markers, lines, and shapes.
            drawingManager = new google.maps.drawing.DrawingManager({
                drawingMode: google.maps.drawing.OverlayType.NONE,
                polygonOptions: polyOptions,
                drawingControlOptions: {
                    drawingModes: [google.maps.drawing.OverlayType.POLYGON]
                },
                map: map
            });

            google.maps.event.addListener(drawingManager, 'overlaycomplete', function(e) {
                if (e.type != google.maps.drawing.OverlayType.MARKER) {
                    // Switch back to non-drawing mode after drawing a shape.
                    drawingManager.setDrawingMode(null);

                    // Add an event listener that selects the newly-drawn shape when the user
                    // mouses down on it.
                    var newShape = e.overlay;
                    newShape.type = e.type;
                    google.maps.event.addListener(newShape, 'click', function() {
                        if ($("#region-list").length > 0) {
                            if ($("#region-list .item[region-index=" + this.region_index + "]").length > 0) {
                                $("#region-list .item").removeClass("selected");
                                $("#region-list .item[region-index=" + this.region_index + "]").addClass("selected");
                                $.scrollToRegionList(this.region_index);
                                $.setSelectedRegion();
                            }
                        }
                        setSelection(newShape);
                        _store_string(newShape);
                    });
                    google.maps.event.addListener(newShape.getPath(), 'insert_at', function() {
                        _store_string(newShape);
                    });
                    google.maps.event.addListener(newShape.getPath(), 'set_at', function() {
                        _store_string(newShape);
                    });
                    setSelection(newShape);
                    _store_string(newShape);
                }
            });

            // Clear the current selection when the drawing mode is changed, or when the
            // map is clicked.
            google.maps.event.addListener(drawingManager, 'drawingmode_changed', clearSelection);
            google.maps.event.addListener(map, 'click', clearSelection);
            google.maps.event.addDomListener(document.getElementById('edit-button'), 'click', editSelectedShape);
            google.maps.event.addDomListener(document.getElementById('delete-button'), 'click', deleteSelectedShape);
            if ($("#save-button").length > 0) {
                google.maps.event.addDomListener(document.getElementById('save-button'), 'click', saveSelectedShape);
            }

            selectColor();

        }
        return {
            init: initialize,
            getSelectedShape: function() {
                return selectedShape;
            },
            getSelectedShapeAsString: function() {
                return current_map_string;
            },
            addPolygon: _addPolygon,
            selectPolygon: _selectPolygon,
            editPolygon: _editPolygon,
            deleteAllShapes: _deleteAllShapes,
            getObjTriangle: _getObjTriangle,
            focusAll: _focusAll
        };
    }();

    var buildContent = function() {
        if ($.inArray(getUrlSub().toString(), menu_access[user_info.role]) >= 0 || $.inArray(getUrlSub().toString(), submenu_access[user_info.role]) >= 0) {
            $.xhrPool.abortAll();
            $("#dashboard #form-login").hide();
            /*  ORGANIZATION  */
            if (getUrlSub() == "dashboard") {

                if (!findInArray(user_info.roles, "_prefeitura") && !findInArray(user_info.roles, "_movimento")) {

                } else {
                    /*  VARIAVEIS DA HOME  */
                    if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {

                        var variableList = buildDataTable({
                            headers: ["Nome", "_"]
                        }, null, false);

                        $("#dashboard-content .content").append(variableList);

                        $("#button-add").click(function() {
                            resetWarnings();
                            location.hash = "#!/" + getUrlSub() + "?option=add";
                        });

                        //carrega dados do admin
                        var data_network;
                        var data_config_admin;
                        var data_config;

                        $.ajax({
                            type: 'GET',
                            dataType: 'json',
                            url: api_path + '/api/public/network?api_key=$$key'.render2({
                                key: $.cookie("key")
                            }),
                            success: function(data, textStatus, jqXHR) {
                                data_network = data;
                            }
                        }).done(function() {
                            //carrega config do admin
                            $.ajax({
                                type: 'GET',
                                dataType: 'json',
                                url: api_path + '/api/user/$$user/variable_config?api_key=$$key'.render2({
                                    key: $.cookie("key"),
                                    user: data_network.admin_users[0].id
                                }),
                                success: function(data, textStatus, jqXHR) {
                                    data_config_admin = data;
                                }
                            }).done(function() {

                                //carrega config do usuario
                                $.ajax({
                                    type: 'GET',
                                    dataType: 'json',
                                    url: api_path + '/api/user/$$user/variable_config?api_key=$$key'.render2({
                                        key: $.cookie("key"),
                                        user: $.cookie("user.id")
                                    }),
                                    success: function(data, textStatus, jqXHR) {
                                        data_config = data;
                                    }
                                }).done(function() {

                                    $.ajax({
                                        type: 'GET',
                                        dataType: 'json',
                                        url: api_path + '/api/user/$$userid/variable?api_key=$$key&is_basic=1'.render2({
                                            key: $.cookie("key"),
                                            userid: $.cookie("user.id")
                                        }),
                                        success: function(data, textStatus, jqXHR) {
                                            $.each(data.variables, function(index, value) {
                                                if (data_config[data.variables[index].variable_id] && data_config[data.variables[index].variable_id].display_in_home == 1 || !(data_config[data.variables[index].variable_id]) && data_config_admin[data.variables[index].variable_id] && data_config_admin[data.variables[index].variable_id].display_in_home == 1) {
                                                    $("#dashboard-content .content #results tbody").append($("<tr><td>$$nome</td><td>$$url</td></tr>".render({
                                                        nome: data.variables[index].name,
                                                        apelido: data.variables[index].cognomen,
                                                        url: data.variables[index].variable_id
                                                    })));
                                                }
                                            });

                                            $("#results").dataTable({
                                                iDisplayLength: 50,
                                                "oLanguage": get_datatable_lang(),
                                                "aoColumnDefs": [{
                                                    "bSearchable": false,
                                                    "bSortable": false,
                                                    "sClass": "botoes",
                                                    "sWidth": "60px",
                                                    "aTargets": [1]
                                                }],
                                                "fnDrawCallback": function() {
                                                    DTdesenhaBotaoVariavel();
                                                }
                                            });
                                        },
                                        error: function(data) {
                                            $("#aviso").setWarning({
                                                msg: "Erro ao carregar ($$codigo)".render2({
                                                    codigo: $.trataErro(data)
                                                })
                                            });
                                        }
                                    });
                                });
                            });
                        });

                    } else if ($.getUrlVar("option") == "edit") {

                        var txtOption = "Adicionar Valor";

                        $.ajax({
                            type: 'GET',
                            dataType: 'json',
                            url: $.getUrlVar("url") + "?api_key=$$key".render2({
                                key: $.cookie("key")
                            }),
                            success: function(data, status, jqXHR) {
                                if (jqXHR.status == 200) {

                                    var data_region;
                                    $.ajax({
                                        async: false,
                                        type: 'GET',
                                        dataType: 'json',
                                        url: api_path + '/api/city/$$city/region?api_key=$$key'.render2({
                                            key: $.cookie("key"),
                                            city: getIdFromUrl(user_info.city)
                                        }),
                                        success: function(data, textStatus, jqXHR) {
                                            data_region = data.regions;
                                        }
                                    });

                                    var newform = [];

                                    if (data_region && data_region.length > 0) {
                                        newform.push({
                                            label: "Região",
                                            input: ["select,region_id,iselect"]
                                        });
                                    }

                                    newform.push({
                                        label: "Variável",
                                        input: ["textlabel,textlabel_variable,ilabel"]
                                    });
                                    newform.push({
                                        label: "Valor",
                                        input: ["text,value,itext"]
                                    });

                                    newform.push({
                                        label: "Período",
                                        input: ["textlabel,textlabel_period,ilabel"]
                                    });
                                    if (data.period == "yearly") {
                                        newform.push({
                                            label: "Data",
                                            input: ["select,value_of_date,iselect"]
                                        });
                                    } else if (data.period == "monthly") {
                                        newform.push({
                                            label: "Data",
                                            input: ["select,value_of_date_year,iselect", "select,value_of_date,iselect"]
                                        });
                                    } else if (data.period == "daily") {
                                        newform.push({
                                            label: "Data",
                                            input: ["text,value_of_date,itext"]
                                        });
                                    }
                                    newform.push({
                                        label: "Descrição",
                                        input: ["textlabel,textlabel_explanation,ilabel"]
                                    });

                                    var formbuild = $("#dashboard-content .content").append(buildForm(newform, txtOption));

                                    if (data_region && data_region.length > 0) {

                                        $("#dashboard-content .content select#region_id").change(function(e) {
                                            buildVariableHistory();
                                        });
                                        $("#dashboard-content .content select#region_id").append($("<option></option>").val("").html("$$e".render({
                                            e: 'Nenhuma'
                                        })));
                                        $.each(data_region, function(index, item) {
                                            $("#dashboard-content .content select#region_id").append($("<option></option>").val(item.id).html(item.name));
                                        });
                                    }

                                    if (data.period == "yearly") {
                                        $.ajax({
                                            type: 'GET',
                                            dataType: 'json',
                                            cache: true,
                                            url: api_path + '/api/period/year?api_key=$$key'.render2({
                                                key: $.cookie("key")
                                            }),
                                            success: function(data, textStatus, jqXHR) {
                                                $("#dashboard-content .content select#value_of_date option").remove();
                                                $.each(data.options, function(index, value) {
                                                    $("#dashboard-content .content select#value_of_date").append("<option value='$$_value'>$$_text</option>".render({
                                                        _text: data.options[index].text,
                                                        _value: data.options[index].value
                                                    }));
                                                });
                                                $("#dashboard-content .content select#value_of_date option:last").attr("selected", "selected");
                                            }
                                        });
                                    } else if (data.period == "monthly") {
                                        $("#dashboard-content .content select#value_of_date").hide();
                                        $.ajax({
                                            type: 'GET',
                                            dataType: 'json',
                                            cache: true,
                                            url: api_path + '/api/period/year?api_key=$$key'.render2({
                                                key: $.cookie("key")
                                            }),
                                            success: function(data, textStatus, jqXHR) {
                                                $("#dashboard-content .content select#value_of_date_year option").remove();
                                                $("#dashboard-content .content select#value_of_date_year").append("<option value=''>Selecione o ano</option>");
                                                $.each(data.options, function(index, value) {
                                                    $("#dashboard-content .content select#value_of_date_year").append("<option value='$$_value'>$$_text</option>".render({
                                                        _text: data.options[index].text,
                                                        _value: data.options[index].value
                                                    }));
                                                });
                                                $("#dashboard-content .content select#value_of_date option:last").attr("selected", "selected");

                                                $("#dashboard-content .content select#value_of_date_year").change(function() {
                                                    $("#dashboard-content .content select#value_of_date option").remove();
                                                    $("#dashboard-content .content select#value_of_date").hide();
                                                    if ($(this).find("option:selected").val() != "") {
                                                        $("#dashboard-content .content select#value_of_date").show();
                                                        $.ajax({
                                                            type: 'GET',
                                                            cache: true,
                                                            dataType: 'json',
                                                            url: api_path + '/api/period/year/$$year/month?api_key=$$key'.render2({
                                                                key: $.cookie("key"),
                                                                year: $("#dashboard-content .content select#value_of_date_year option:selected").html()
                                                            }),
                                                            success: function(data, textStatus, jqXHR) {
                                                                $.each(data.options, function(index, value) {
                                                                    $("#dashboard-content .content select#value_of_date").append("<option value='$$_value'>$$_text</option>".render({
                                                                        _text: data.options[index].text,
                                                                        _value: data.options[index].value
                                                                    }));
                                                                });
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    } else if (data.period == "daily") {
                                        $("#dashboard-content .content input#value_of_date").datepicker({
                                            dateFormat: 'dd/mm/yy',
                                            defaultDate: "0",
                                            changeMonth: true,
                                            changeYear: true
                                        });
                                    }

                                    $("#dashboard-content .content .botao-form[ref='enviar']").html("$$e".render({
                                        e: 'Adicionar'
                                    }));
                                    $("#dashboard-content .content .botao-form[ref='cancelar']").html("$$e".render({
                                        e: 'Voltar'
                                    }));
                                    $(formbuild).find("div .field:odd").addClass("odd");
                                    $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());
                                    $("#dashboard-content .content div.historic table").width($("#dashboard-content .content").find(".form").width());

                                    $(formbuild).find("div#textlabel_variable").html(data.name);
                                    $(formbuild).find("div#textlabel_explanation").html(data.explanation);
                                    $(formbuild).find("div#textlabel_period").html(variable_periods[data.period]);


                                    //if (data.period)
                                    //setup_jStepper


                                    $("#dashboard-content .content .botao-form[ref='enviar']").click(function() {

                                        if ($(this).html() == "$$e".render({
                                                e: 'Adicionar'
                                            })) {
                                            var ajax_type = "POST";
                                            var api_method = "create";
                                            if ($("#dashboard-content .content").find("#region_id option:selected").val()) {
                                                var ajax_url = api_path + "/api/city/$$city/region/$$region/value".render2({
                                                    city: getIdFromUrl(user_info.city),
                                                    region: $("#dashboard-content .content").find("#region_id option:selected").val()
                                                });
                                            } else {
                                                var ajax_url = $.getUrlVar("url") + "/value";
                                            }
                                        } else if ($(this).html() == "$$e".render({
                                                e: 'Editar'
                                            })) {
                                            var ajax_type = "POST";
                                            var api_method = "update";
                                            if ($("#dashboard-content .content").find("#region_id option:selected").val()) {
                                                var ajax_url = api_path + "/api/city/$$city/region/$$region/value/$$id".render2({
                                                    city: getIdFromUrl(user_info.city),
                                                    region: $("#dashboard-content .content").find("#region_id option:selected").val(),
                                                    id: $("table.history tbody tr.selected").attr("data-value-id")
                                                });
                                            } else {
                                                var ajax_url = $.getUrlVar("url") + "/value/" + $("table.history tbody tr.selected").attr("data-value-id");
                                            }
                                        }

                                        resetWarnings();
                                        if ($(this).parent().parent().find("#value").val() == "") {
                                            $(".form-aviso").setWarning({
                                                msg: "Por favor informe o Valor"
                                            });
                                        } else {
                                            var data_formatada = "";
                                            if (data.period == "yearly" || data.period == "monthly") {
                                                data_formatada = $(this).parent().parent().find("#value_of_date option:selected").val();
                                            } else if (data.period == "daily") {
                                                data_formatada = $.convertDate($(this).parent().parent().find("#value_of_date").val(), " ");
                                            }
                                            var prefix = "";
                                            if ($("#dashboard-content .content").find("#region_id option:selected").val()) {
                                                prefix = "region.";
                                            }

                                            args = [{
                                                name: "api_key",
                                                value: $.cookie("key")
                                            }, {
                                                name: prefix + "variable.value." + api_method + ".value",
                                                value: $(this).parent().parent().find("#value").val()
                                            }, {
                                                name: prefix + "variable.value." + api_method + ".value_of_date",
                                                value: data_formatada
                                            }];
                                            if ($("#dashboard-content .content").find("#region_id option:selected").val()) {
                                                args.push({
                                                    name: prefix + "variable.value." + api_method + ".variable_id",
                                                    value: getIdFromUrl($.getUrlVar("url"))
                                                });
                                            }

                                            $("#dashboard-content .content .botao-form[ref='enviar']").hide();
                                            $.ajax({
                                                type: ajax_type,
                                                dataType: 'json',
                                                url: ajax_url,
                                                data: args,
                                                success: function(data, textStatus, jqXHR) {
                                                    resetWarnings();
                                                    $("#aviso").setWarning({
                                                        msg: "Cadastro editado com sucesso.".render2({
                                                            codigo: jqXHR.status
                                                        })
                                                    });
                                                    $("#dashboard-content .content .botao-form[ref='enviar']").html("$$e".render({
                                                        e: 'Adicionar'
                                                    }));
                                                    $("#dashboard-content .content .botao-form[ref='cancelar']").html("$$e".render({
                                                        e: 'Voltar'
                                                    }));
                                                    $("#dashboard-content .content .form").find(".title").html("Adicionar Valor");
                                                    $(formbuild).find("input#value").val("");
                                                    $(formbuild).find("#value_of_date").val("");
                                                    $("#dashboard-content .content .form").find("select").attr("disabled", false);
                                                    $("table.history tbody tr").removeClass("selected");
                                                    buildVariableHistory();
                                                },
                                                error: function(data) {
                                                    $(".form-aviso").setWarning({
                                                        msg: "Erro ao editar. Já existe valor para esse Período".render2({
                                                            erro: $.trataErro(data)
                                                        })
                                                    });
                                                    $("#dashboard-content .content .botao-form[ref='cancelar']").html("$$e".render({
                                                        e: 'Voltar'
                                                    }));
                                                },
                                                complete: function(data) {
                                                    $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                                }
                                            });
                                        }
                                    });
                                    $("#dashboard-content .content .botao-form[ref='cancelar']").click(function() {
                                        resetWarnings();
                                        if ($(this).html() == "$$e".render({
                                                e: 'Voltar'
                                            })) {
                                            history.back();
                                        } else if ($(this).html() == "Cancelar") {
                                            $("#dashboard-content .content .form").find(".title").html("Adicionar Valor");
                                            $("#dashboard-content .content .botao-form[ref='enviar']").html("$$e".render({
                                                e: 'Adicionar'
                                            }));
                                            $("#dashboard-content .content .botao-form[ref='cancelar']").html("$$e".render({
                                                e: 'Voltar'
                                            }));
                                            $(formbuild).find("input#value").val("");
                                            $(formbuild).find("input#value_of_date").val("");
                                            $("#dashboard-content .content .form").find("select").attr("disabled", false);
                                            $("table.history tbody tr").removeClass("selected");
                                            $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                            $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                        }
                                    });
                                }

                                $("#dashboard-content .content").append("<div class='historico'></div>");

                                buildVariableHistory();
                            },
                            error: function(data) {
                                switch (data.status) {
                                    case 400:
                                        $(".form-aviso").setWarning({
                                            msg: "Erro: ($$codigo)".render2({
                                                codigo: $.trataErro(data)
                                            })
                                        });
                                        break;
                                }
                            }
                        });
                    }
                }
            } else if (getUrlSub() == "admins") {
                /*  Administradores  */
                if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {

                    var userList = buildDataTable({
                        headers: ["Nome", "Email", "_"]
                    });

                    $("#dashboard-content .content").append(userList)

                    $("#button-add").click(function() {
                        resetWarnings();
                        location.hash = "#!/" + getUrlSub() + "?option=add";
                    });

                    $("#results").dataTable({
                        iDisplayLength: 50,
                        "oLanguage": get_datatable_lang(),
                        "bProcessing": true,
                        "sAjaxSource": api_path + '/api/user?role=admin&api_key=$$key&content-type=application/json&lang=$$lang&columns=name,email,url,_,_'.render2({
                            lang: cur_lang,
                            key: $.cookie("key")
                        }),
                        "aoColumnDefs": [{
                            "bSearchable": false,
                            "bSortable": false,
                            "sClass": "botoes",
                            "sWidth": "60px",
                            "aTargets": [2]
                        }],
                        "fnDrawCallback": function() {
                            DTdesenhaBotoes();
                        }
                    });

                } else if ($.getUrlVar("option") == "add" || $.getUrlVar("option") == "edit") {

                    var txtOption = ($.getUrlVar("option") == "add") ? "$$e".render({
                        e: 'Cadastrar'
                    }) : "$$e".render({
                        e: 'Editar'
                    });

                    var newform = [];

                    if ($.getUrlVar("option") == "add") {
                        newform.push({
                            label: "Rede",
                            input: ["select,network_id,iselect"]
                        });
                    }

                    newform.push({
                        label: "Nome",
                        input: ["text,name,itext"]
                    });
                    newform.push({
                        label: "Email",
                        input: ["text,email,itext"]
                    });
                    newform.push({
                        label: "Senha",
                        input: ["password,password,itext"]
                    });
                    newform.push({
                        label: "Confirmar Senha",
                        input: ["password,password_confirm,itext"]
                    });

                    var formbuild = $("#dashboard-content .content").append(buildForm(newform, txtOption));
                    $(formbuild).find("div .field:odd").addClass("odd");
                    $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

                    $(formbuild).find("#name").qtip($.extend(true, {}, qtip_input, {
                        content: "Importante: Nome do usuário."
                    }));
                    $(formbuild).find("#email").qtip($.extend(true, {}, qtip_input, {
                        content: "Importante: o Email será usado como login."
                    }));
                    $(formbuild).find("#password").qtip($.extend(true, {}, qtip_input, {
                        content: "Utilize letras e números e pelo menos 8 caracteres."
                    }));

                    $("#dashboard-content .content select#network_id").append($("<option></option>").val("").html("$$e...".render({
                        e: 'Selecione'
                    })));
                    $.ajax({
                        async: false,
                        type: 'GET',
                        dataType: 'json',
                        url: api_path + "/api/network?api_key=$$key".render2({
                            key: $.cookie("key")
                        }),
                        success: function(data, status, jqXHR) {
                            data.network.sort(function(a, b) {
                                a = String(a.name),
                                    b = String(b.name);
                                return a.localeCompare(b);
                            });
                            $.each(data.network, function(index, item) {
                                $("#dashboard-content .content select#network_id").append($("<option></option>").val(item.id).html(item.name));
                            });
                        }
                    });

                    if ($.getUrlVar("option") == "edit") {
                        $.ajax({
                            type: 'GET',
                            dataType: 'json',
                            url: $.getUrlVar("url") + "?api_key=$$key".render2({
                                key: $.cookie("key")
                            }),
                            success: function(data, status, jqXHR) {
                                switch (jqXHR.status) {
                                    case 200:
                                        $(formbuild).find("input#name").val(data.name);
                                        $(formbuild).find("input#email").val(data.email);
                                        $(formbuild).find("select#network_id").val(data.network.id);

                                        break;
                                }
                            },
                            error: function(data) {
                                switch (data.status) {
                                    case 400:
                                        $(".form-aviso").setWarning({
                                            msg: "Erro: ($$codigo)".render2({
                                                codigo: $.trataErro(data)
                                            })
                                        });
                                        break;
                                }
                            }
                        });
                    }

                    $("#dashboard-content .content .botao-form[ref='enviar']").click(function() {
                        resetWarnings();
                        if ($(this).parent().parent().find("#network_id option:selected").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe a Rede"
                            });
                        } else if ($(this).parent().parent().find("#name").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe o Nome"
                            });
                        } else if ($(this).parent().parent().find("#email").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe o Email"
                            });
                        } else if ($(this).parent().parent().find("#password").val() == "" && $.getUrlVar("option") != "edit") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe a Senha"
                            });
                        } else if ($(this).parent().parent().find("#password_confirm").val() != "" && $(this).parent().parent().find("#password_confirm").val() != $(this).parent().parent().find("#password").val()) {
                            $(".form-aviso").setWarning({
                                msg: "Confirmação de senha inválida"
                            });
                        } else {

                            if ($.getUrlVar("option") == "add") {
                                var action = "create";
                                var method = "POST";
                                var url_action = api_path + "/api/user";
                            } else {
                                var action = "update";
                                var method = "POST";
                                var url_action = $.getUrlVar("url");
                            }

                            args = [{
                                name: "api_key",
                                value: $.cookie("key")
                            }, {
                                name: "user." + action + ".name",
                                value: $(this).parent().parent().find("#name").val()
                            }, {
                                name: "user." + action + ".email",
                                value: $(this).parent().parent().find("#email").val()
                            }, {
                                name: "user." + action + ".role",
                                value: "admin"
                            }];

                            if ($.getUrlVar("option") == "add") {
                                args.push({
                                    name: "user." + action + ".network_id",
                                    value: $(this).parent().parent().find("#network_id option:selected").val()
                                });
                            }

                            if ($(this).parent().parent().find("#password").val() != "") {
                                args.push({
                                    name: "user." + action + ".password",
                                    value: $(this).parent().parent().find("#password").val()
                                }, {
                                    name: "user." + action + ".password_confirm",
                                    value: $(this).parent().parent().find("#password").val()
                                });
                            }

                            $("#dashboard-content .content .botao-form[ref='enviar']").hide();
                            $.ajax({
                                type: method,
                                dataType: 'json',
                                url: url_action,
                                data: args,
                                success: function(data, status, jqXHR) {
                                    $("#aviso").setWarning({
                                        msg: "Operação efetuada com sucesso.".render2({
                                            codigo: jqXHR.status
                                        })
                                    });
                                    location.hash = "#!/" + getUrlSub();
                                },
                                error: function(data) {
                                    switch (data.status) {
                                        case 400:
                                            $("#aviso").setWarning({
                                                msg: "Erro ao $$operacao. ($$codigo)".render2({
                                                    operacao: txtOption,
                                                    codigo: $.trataErro(data)
                                                })
                                            });
                                            break;
                                    }
                                    $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                }
                            });
                        }
                    });
                    $("#dashboard-content .content .botao-form[ref='cancelar']").click(function() {
                        resetWarnings();
                        history.back();
                    });
                } else if ($.getUrlVar("option") == "delete") {
                    args = [{
                        name: "api_key",
                        value: $.cookie("key")
                    }, {
                        name: "user.update.network_id",
                        value: null
                    }];
                    $.ajax({
                        type: 'POST',
                        dataType: 'json',
                        url: $.getUrlVar("url"),
                        data: args,
                        success: function(data, status, jqXHR) {
                            deleteRegister({
                                url: $.getUrlVar("url") + "?api_key=$$key".render2({
                                    key: $.cookie("key")
                                })
                            });
                        },
                        error: function(data) {
                            switch (data.status) {
                                case 400:
                                    $("#aviso").setWarning({
                                        msg: "Erro ao apagar. ($$codigo)".render2({
                                            codigo: $.trataErro(data)
                                        })
                                    });
                                    break;
                            }
                            $("#dashboard-content .content .botao-form[ref='enviar']").show();
                        }
                    });
                }
            } else if (getUrlSub() == "users") {
                /*  USER  */
                loadCidades();
                if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {

                    var userList = buildDataTable({
                        headers: ["Nome", "Email", "_"]
                    });

                    $("#dashboard-content .content").append(userList)

                    $("#button-add").click(function() {
                        resetWarnings();
                        location.hash = "#!/" + getUrlSub() + "?option=add";
                    });

                    $("#results").dataTable({
                        iDisplayLength: 50,
                        "oLanguage": get_datatable_lang(),
                        "bProcessing": true,
                        "sAjaxSource": api_path + '/api/user?role=user$$network_id&api_key=$$key&content-type=application/json&lang=$$lang&columns=name,email,url,_,_'.render2({
                            lang: cur_lang,
                            key: $.cookie("key"),
                            network_id: (user_info.network) ? "&network_id=" + user_info.network : ""
                        }),
                        "aoColumnDefs": [{
                            "bSearchable": false,
                            "bSortable": false,
                            "sClass": "botoes",
                            "sWidth": "60px",
                            "aTargets": [2]
                        }],
                        "fnDrawCallback": function() {
                            DTdesenhaBotoes();
                        }
                    });

                } else if ($.getUrlVar("option") == "add" || $.getUrlVar("option") == "edit") {

                    var txtOption = ($.getUrlVar("option") == "add") ? "$$e".render({
                        e: 'Cadastrar'
                    }) : "$$e".render({
                        e: 'Editar'
                    });

                    var newform = [];

                    if (user_info.roles[0] == "superadmin") {
                        newform.push({
                            label: "Rede",
                            input: ["select,network_id,iselect"]
                        });
                    }
                    newform.push({
                        label: "Nome",
                        input: ["text,name,itext"]
                    });
                    newform.push({
                        label: "Email",
                        input: ["text,email,itext"]
                    });
                    newform.push({
                        label: "Senha",
                        input: ["password,password,itext"]
                    });
                    newform.push({
                        label: "Confirmar Senha",
                        input: ["password,password_confirm,itext"]
                    });
                    newform.push({
                        label: "Cidade",
                        input: ["select,city_id,iselect"]
                    });

                    var formbuild = $("#dashboard-content .content").append(buildForm(newform, txtOption));
                    $(formbuild).find("div .field:odd").addClass("odd");
                    $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

                    $(formbuild).find("#name").qtip($.extend(true, {}, qtip_input, {
                        content: "Importante: Nome do usuário."
                    }));
                    $(formbuild).find("#email").qtip($.extend(true, {}, qtip_input, {
                        content: "Importante: o Email será usado como login."
                    }));
                    $(formbuild).find("#password").qtip($.extend(true, {}, qtip_input, {
                        content: "Utilize letras e números e pelo menos 8 caracteres."
                    }));

                    if (user_info.roles[0] == "superadmin") {
                        $.ajax({
                            async: false,
                            type: 'GET',
                            dataType: 'json',
                            url: api_path + "/api/network?api_key=$$key".render2({
                                key: $.cookie("key")
                            }),
                            success: function(data, status, jqXHR) {
                                data.network.sort(function(a, b) {
                                    a = String(a.name),
                                        b = String(b.name);
                                    return a.localeCompare(b);
                                });
                                if ($.getUrlVar("option") == "edit") {
                                    $("#dashboard-content .content select#network_id").attr("multiple", "multiple");
                                }
                                $.each(data.network, function(index, item) {
                                    $("#dashboard-content .content select#network_id").append($("<option></option>").val(item.id).html(item.name));
                                });
                                $("#dashboard-content .content select#network_id").qtip($.extend(true, {}, qtip_input, {
                                    content: "Dica: Segure a tecla CTRL para selecionar mais de uma rede."
                                }));
                            }
                        });
                    }

                    $("#dashboard-content .content select#city_id").append($("<option></option>").val("").html("$$e...".render({
                        e: 'Selecione'
                    })));
                    if ($.getUrlVar("option") == "add") {
                        carregaComboCidadesUsers({
                            "option": $.getUrlVar("option")
                        });
                    }

                    if ($.getUrlVar("option") == "edit") {
                        $.ajax({
                            type: 'GET',
                            dataType: 'json',
                            url: $.getUrlVar("url") + "?api_key=$$key".render2({
                                key: $.cookie("key")
                            }),
                            success: function(data, status, jqXHR) {
                                switch (jqXHR.status) {
                                    case 200:
                                        $(formbuild).find("input#name").val(data.name);
                                        $(formbuild).find("input#email").val(data.email);
                                        carregaComboCidadesUsers({
                                            "option": $.getUrlVar("option"),
                                            city: data.city
                                        });
                                        $(formbuild).find("select#city_id").val(getIdFromUrl(data.city));
                                        if ($(formbuild).find("select#network_id").length > 0) {
                                            if (data.networks) {
                                                $.each(data.networks, function(index, item) {
                                                    $(formbuild).find("select#network_id option[value=" + item.id + "]").attr("selected", "selected");
                                                });
                                            }
                                        }
                                        break;
                                }
                            },
                            error: function(data) {
                                switch (data.status) {
                                    case 400:
                                        $(".form-aviso").setWarning({
                                            msg: "Erro: ($$codigo)".render2({
                                                codigo: $.trataErro(data)
                                            })
                                        });
                                        break;
                                }
                            }
                        });
                    }

                    $("#dashboard-content .content .botao-form[ref='enviar']").click(function() {
                        resetWarnings();
                        if ($(this).parent().parent().find("#name").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe o Nome"
                            });
                        } else if ($(this).parent().parent().find("#email").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe o Email"
                            });
                        } else if ($(this).parent().parent().find("#password").val() == "" && $.getUrlVar("option") != "edit") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe a Senha"
                            });
                        } else if ($(this).parent().parent().find("#password_confirm").val() != "" && $(this).parent().parent().find("#password_confirm").val() != $(this).parent().parent().find("#password").val()) {
                            $(".form-aviso").setWarning({
                                msg: "Confirmação de senha inválida"
                            });
                        } else if ($(this).parent().parent().find("#city_id option:selected").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe a Cidade"
                            });
                        } else {

                            if ($.getUrlVar("option") == "add") {
                                var action = "create";
                                var method = "POST";
                                var url_action = api_path + "/api/user";
                            } else {
                                var action = "update";
                                var method = "POST";
                                var url_action = $.getUrlVar("url");
                            }

                            args = [{
                                name: "api_key",
                                value: $.cookie("key")
                            }, {
                                name: "user." + action + ".name",
                                value: $(this).parent().parent().find("#name").val()
                            }, {
                                name: "user." + action + ".email",
                                value: $(this).parent().parent().find("#email").val()
                            }, {
                                name: "user." + action + ".role",
                                value: "user"
                            }, {
                                name: "user." + action + ".city_id",
                                value: $(this).parent().parent().find("#city_id option:selected").val()
                            }];

                            if (user_info.roles[0] == "superadmin") {
                                if ($.getUrlVar("option") == "add") {
                                    args.push({
                                        name: "user." + action + ".network_id",
                                        value: $(this).parent().parent().find("#network_id option:selected").val()
                                    });
                                } else if ($.getUrlVar("option") == "edit") {
                                    var network_ids = "";
                                    $(this).parent().parent().find("#network_id option:selected").each(function(index, item) {
                                        if (network_ids != "") network_ids += ",";
                                        network_ids += item.value;
                                    });
                                    args.push({
                                        name: "user." + action + ".network_ids",
                                        value: network_ids
                                    });
                                }
                            }

                            if ($(this).parent().parent().find("#password").val() != "") {
                                args.push({
                                    name: "user." + action + ".password",
                                    value: $(this).parent().parent().find("#password").val()
                                }, {
                                    name: "user." + action + ".password_confirm",
                                    value: $(this).parent().parent().find("#password").val()
                                });
                            }

                            $("#dashboard-content .content .botao-form[ref='enviar']").hide();
                            $.ajax({
                                type: method,
                                dataType: 'json',
                                url: url_action,
                                data: args,
                                success: function(data, status, jqXHR) {
                                    $("#aviso").setWarning({
                                        msg: "Operação efetuada com sucesso.".render2({
                                            codigo: jqXHR.status
                                        })
                                    });
                                    location.hash = "#!/" + getUrlSub();
                                },
                                error: function(data) {
                                    $("#aviso").setWarning({
                                        msg: "Erro ao $$operacao. ($$erro)".render2({
                                            operacao: txtOption,
                                            erro: $.trataErro(data)
                                        })
                                    });
                                    $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                }
                            });
                        }
                    });
                    $("#dashboard-content .content .botao-form[ref='cancelar']").click(function() {
                        resetWarnings();
                        history.back();
                    });
                } else if ($.getUrlVar("option") == "delete") {
                    deleteRegister({
                        url: $.getUrlVar("url") + "?api_key=$$key".render2({
                            key: $.cookie("key")
                        })
                    });
                }
            } else if (getUrlSub() == "cities") {
                /*  CIDADES  */
                if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {

                    var userList = buildDataTable({
                        headers: ["Nome", "Estado", "_"]
                    });

                    $("#dashboard-content .content").append(userList);

                    $("#button-add").click(function() {
                        resetWarnings();
                        location.hash = "#!/" + getUrlSub() + "?option=add";
                    });

                    $("#results").dataTable({
                        iDisplayLength: 50,
                        "oLanguage": get_datatable_lang(),
                        "bProcessing": true,
                        "sAjaxSource": api_path + '/api/city?api_key=$$key&content-type=application/json&lang=$$lang&columns=name,uf,url,_,_'.render2({
                            lang: cur_lang,
                            key: $.cookie("key")
                        }),
                        "aoColumnDefs": [{
                            "bSearchable": false,
                            "bSortable": false,
                            "sClass": "botoes",
                            "sWidth": "60px",
                            "aTargets": [2]
                        }],
                        "fnDrawCallback": function() {
                            DTdesenhaBotoes();
                        }
                    });

                } else if ($.getUrlVar("option") == "add" || $.getUrlVar("option") == "edit") {

                    var txtOption = ($.getUrlVar("option") == "add") ? "$$e".render({
                        e: 'Cadastrar'
                    }) : "$$e".render({
                        e: 'Editar'
                    });

                    var newform = [];

                    newform.push({
                        label: "País",
                        input: ["select,country_id,iselect"]
                    });
                    newform.push({
                        label: "Estado",
                        input: ["select,state_id,iselect"]
                    });
                    newform.push({
                        label: "Nome",
                        input: ["text,name,itext"]
                    });

                    newform.push({
                        type: "subtitle",
                        title: "Dados da Prefeitura"
                    });
                    newform.push({
                        label: "Telefone",
                        input: ["text,telefone_prefeitura,itext"]
                    });
                    newform.push({
                        label: "Endereço",
                        input: ["text,endereco_prefeitura,itext"]
                    });
                    newform.push({
                        label: "Bairro",
                        input: ["text,bairro_prefeitura,itext"]
                    });
                    newform.push({
                        label: "CEP",
                        input: ["text,cep_prefeitura,itext"]
                    });
                    newform.push({
                        label: "Email",
                        input: ["text,email_prefeitura,itext"]
                    });
                    newform.push({
                        label: "Nome do responsável",
                        input: ["text,nome_responsavel_prefeitura,itext"]
                    });

                    var formbuild = $("#dashboard-content .content").append(buildForm(newform, txtOption));
                    $(formbuild).find("div .field:odd").addClass("odd");
                    $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

                    $(formbuild).find("#name").qtip($.extend(true, {}, qtip_input, {
                        content: "Importante: Nome da Cidade."
                    }));

                    $("#dashboard-content .content select#state_id").append($("<option></option>").val("").html("Selecione um País..."));

                    $("#dashboard-content .content select#country_id").append($("<option></option>").val("").html("$$e...".render({
                        e: 'Selecione'
                    })));
                    $.ajax({
                        async: false,
                        type: 'GET',
                        dataType: 'json',
                        url: api_path + "/api/country?api_key=$$key".render2({
                            key: $.cookie("key")
                        }),
                        success: function(data, status, jqXHR) {
                            data.countries.sort(function(a, b) {
                                a = String(a.name),
                                    b = String(b.name);
                                return a.localeCompare(b);
                            });
                            $.each(data.countries, function(index, item) {
                                $("#dashboard-content .content select#country_id").append($("<option></option>").val(item.id).html(item.name));
                            });
                            $("#dashboard-content .content select#country_id").change(function(e) {
                                carregaEstados();
                            });
                        }
                    });

                    function carregaEstados() {
                        $.loading();
                        $("#dashboard-content .content select#state_id").empty();
                        $("#dashboard-content .content select#state_id").append($("<option></option>").val("").html("$$e...".render({
                            e: 'Selecione'
                        })));
                        $.ajax({
                            async: false,
                            type: 'GET',
                            dataType: 'json',
                            url: api_path + "/api/state?api_key=$$key".render2({
                                key: $.cookie("key")
                            }),
                            success: function(data, status, jqXHR) {
                                data.states.sort(function(a, b) {
                                    a = String(a.uf),
                                        b = String(b.uf);
                                    return a.localeCompare(b);
                                });
                                $.each(data.states, function(index, item) {
                                    if (item.country_id == $("#dashboard-content .content select#country_id option:selected").val()) {
                                        $("#dashboard-content .content select#state_id").append($("<option></option>").val(item.id).html(item.uf));
                                    }
                                });
                            }
                        });
                        $.loading.hide();
                    }

                    if ($.getUrlVar("option") == "edit") {
                        $.ajax({
                            type: 'GET',
                            dataType: 'json',
                            url: $.getUrlVar("url") + "?api_key=$$key".render2({
                                key: $.cookie("key")
                            }),
                            success: function(data, status, jqXHR) {
                                switch (jqXHR.status) {
                                    case 200:
                                        $(formbuild).find("input#name").val(data.name);
                                        $(formbuild).find("select#country_id").val(data.country_id);
                                        carregaEstados();
                                        $(formbuild).find("select#state_id").val(data.state_id);
                                        $(formbuild).find("input#telefone_prefeitura").val(data.telefone_prefeitura);
                                        $(formbuild).find("input#endereco_prefeitura").val(data.endereco_prefeitura);
                                        $(formbuild).find("input#bairro_prefeitura").val(data.bairro_prefeitura);
                                        $(formbuild).find("input#cep_prefeitura").val(data.cep_prefeitura);
                                        $(formbuild).find("input#email_prefeitura").val(data.email_prefeitura);
                                        $(formbuild).find("input#nome_responsavel_prefeitura").val(data.nome_responsavel_prefeitura);
                                        break;
                                }
                            },
                            error: function(data) {
                                switch (data.status) {
                                    case 400:
                                        $(".form-aviso").setWarning({
                                            msg: "Erro: ($$codigo)".render2({
                                                codigo: $.trataErro(data)
                                            })
                                        });
                                        break;
                                }
                            }
                        });
                    }

                    $("#dashboard-content .content .botao-form[ref='enviar']").click(function() {
                        resetWarnings();
                        if ($(this).parent().parent().find("#name").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe o Nome"
                            });
                        } else if ($(this).parent().parent().find("#state_id option:selected").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe o Estado"
                            });
                        } else {

                            if ($.getUrlVar("option") == "add") {
                                var action = "create";
                                var method = "POST";
                                var url_action = api_path + "/api/city";
                            } else {
                                var action = "update";
                                var method = "POST";
                                var url_action = $.getUrlVar("url");
                            }

                            args = [{
                                name: "api_key",
                                value: $.cookie("key")
                            }, {
                                name: "city." + action + ".name",
                                value: $(this).parent().parent().find("#name").val()
                            }, {
                                name: "city." + action + ".state_id",
                                value: $(this).parent().parent().find("#state_id option:selected").val()
                            }, {
                                name: "city." + action + ".telefone_prefeitura",
                                value: $(this).parent().parent().find("#telefone_prefeitura").val()
                            }, {
                                name: "city." + action + ".endereco_prefeitura",
                                value: $(this).parent().parent().find("#endereco_prefeitura").val()
                            }, {
                                name: "city." + action + ".bairro_prefeitura",
                                value: $(this).parent().parent().find("#bairro_prefeitura").val()
                            }, {
                                name: "city." + action + ".cep_prefeitura",
                                value: $(this).parent().parent().find("#cep_prefeitura").val()
                            }, {
                                name: "city." + action + ".email_prefeitura",
                                value: $(this).parent().parent().find("#email_prefeitura").val()
                            }, {
                                name: "city." + action + ".nome_responsavel_prefeitura",
                                value: $(this).parent().parent().find("#nome_responsavel_prefeitura").val()
                            }];
                            $("#dashboard-content .content .botao-form[ref='enviar']").hide();
                            $.ajax({
                                type: method,
                                dataType: 'json',
                                url: url_action,
                                data: args,
                                success: function(data, status, jqXHR) {
                                    $("#aviso").setWarning({
                                        msg: "Operação efetuada com sucesso.".render2({
                                            codigo: jqXHR.status
                                        })
                                    });
                                    location.hash = "#!/" + getUrlSub();
                                },
                                error: function(data) {
                                    switch (data.status) {
                                        case 400:
                                            $("#aviso").setWarning({
                                                msg: "Erro ao $$operacao. ($$codigo)".render2({
                                                    operacao: txtOption,
                                                    codigo: $.trataErro(data)
                                                })
                                            });
                                            break;
                                    }
                                    $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                }
                            });
                        }
                    });
                    $("#dashboard-content .content .botao-form[ref='cancelar']").click(function() {
                        resetWarnings();
                        history.back();
                    });
                } else if ($.getUrlVar("option") == "delete") {
                    deleteRegister({
                        url: $.getUrlVar("url") + "?api_key=$$key".render2({
                            key: $.cookie("key")
                        })
                    });
                }
            } else if (getUrlSub() == "states") {
                /*  Estados  */
                if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {

                    var userList = buildDataTable({
                        headers: ["Nome", "UF", "País", "_"]
                    });

                    $("#dashboard-content .content").append(userList);

                    $("#button-add").click(function() {
                        resetWarnings();
                        location.hash = "#!/" + getUrlSub() + "?option=add";
                    });

                    $("#results").dataTable({
                        iDisplayLength: 50,
                        "oLanguage": get_datatable_lang(),
                        "bProcessing": true,
                        "sAjaxSource": api_path + '/api/state?api_key=$$key&content-type=application/json&lang=$$lang&columns=name,uf,country_id,url,_,_'.render2({
                            lang: cur_lang,
                            key: $.cookie("key")
                        }),
                        "aoColumnDefs": [{
                            "bSearchable": false,
                            "bSortable": false,
                            "sClass": "botoes",
                            "sWidth": "60px",
                            "aTargets": [3]
                        }],
                        "fnDrawCallback": function() {
                            DTdesenhaBotoes();
                        }
                    });

                } else if ($.getUrlVar("option") == "add" || $.getUrlVar("option") == "edit") {

                    var txtOption = ($.getUrlVar("option") == "add") ? "$$e".render({
                        e: 'Cadastrar'
                    }) : "$$e".render({
                        e: 'Editar'
                    });

                    var newform = [];

                    newform.push({
                        label: "País",
                        input: ["select,country_id,iselect"]
                    });
                    newform.push({
                        label: "Nome",
                        input: ["text,name,itext"]
                    });
                    newform.push({
                        label: "UF",
                        input: ["text,uf,itext"]
                    });


                    var formbuild = $("#dashboard-content .content").append(buildForm(newform, txtOption));
                    $(formbuild).find("div .field:odd").addClass("odd");
                    $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

                    $(formbuild).find("#name").qtip($.extend(true, {}, qtip_input, {
                        content: "Importante: Nome do Estado."
                    }));

                    $("#dashboard-content .content select#country_id").append($("<option></option>").val("").html("$$e...".render({
                        e: 'Selecione'
                    })));

                    $.ajax({
                        async: false,
                        type: 'GET',
                        dataType: 'json',
                        url: api_path + "/api/country?api_key=$$key".render2({
                            key: $.cookie("key")
                        }),
                        success: function(data, status, jqXHR) {
                            data.countries.sort(function(a, b) {
                                a = String(a.name),
                                    b = String(b.name);
                                return a.localeCompare(b);
                            });
                            $.each(data.countries, function(index, item) {
                                $("#dashboard-content .content select#country_id").append($("<option>").val(item.id).html(item.name));
                            });
                        }
                    });

                    if ($.getUrlVar("option") == "edit") {
                        $.ajax({
                            type: 'GET',
                            dataType: 'json',
                            url: $.getUrlVar("url") + "?api_key=$$key".render2({
                                key: $.cookie("key")
                            }),
                            success: function(data, status, jqXHR) {
                                switch (jqXHR.status) {
                                    case 200:
                                        $(formbuild).find("select#country_id").val(data.country_id);
                                        $(formbuild).find("input#name").val(data.name);

                                        $(formbuild).find("input#uf").val(data.uf);
                                        break;
                                }
                            },
                            error: function(data) {
                                switch (data.status) {
                                    case 400:
                                        $(".form-aviso").setWarning({
                                            msg: "Erro: ($$codigo)".render2({
                                                codigo: $.trataErro(data)
                                            })
                                        });
                                        break;
                                }
                            }
                        });
                    }

                    $("#dashboard-content .content .botao-form[ref='enviar']").click(function() {
                        resetWarnings();
                        if ($(this).parent().parent().find("#country_id option:selected").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe o País"
                            });
                        } else if ($(this).parent().parent().find("#name").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe o Nome"
                            });
                        } else if ($(this).parent().parent().find("#uf").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe a sigla (UF)"
                            });
                        } else {

                            if ($.getUrlVar("option") == "add") {
                                var action = "create";
                                var method = "POST";
                                var url_action = api_path + "/api/state";
                            } else {
                                var action = "update";
                                var method = "POST";
                                var url_action = $.getUrlVar("url");
                            }

                            args = [{
                                name: "api_key",
                                value: $.cookie("key")
                            }, {
                                name: "state." + action + ".name",
                                value: $(this).parent().parent().find("#name").val()
                            }, {
                                name: "state." + action + ".uf",
                                value: $(this).parent().parent().find("#uf").val()
                            }, {
                                name: "state." + action + ".country_id",
                                value: $(this).parent().parent().find("#country_id option:selected").val()
                            }];
                            $("#dashboard-content .content .botao-form[ref='enviar']").hide();
                            $.ajax({
                                type: method,
                                dataType: 'json',
                                url: url_action,
                                data: args,
                                success: function(data, status, jqXHR) {
                                    $("#aviso").setWarning({
                                        msg: "Operação efetuada com sucesso.".render2({
                                            codigo: jqXHR.status
                                        })
                                    });
                                    location.hash = "#!/" + getUrlSub();
                                },
                                error: function(data) {
                                    switch (data.status) {
                                        case 400:
                                            $("#aviso").setWarning({
                                                msg: "Erro ao $$operacao. ($$codigo)".render2({
                                                    operacao: txtOption,
                                                    codigo: $.trataErro(data)
                                                })
                                            });
                                            break;
                                    }
                                    $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                }
                            });
                        }
                    });
                    $("#dashboard-content .content .botao-form[ref='cancelar']").click(function() {
                        resetWarnings();
                        history.back();
                    });
                } else if ($.getUrlVar("option") == "delete") {
                    deleteRegister({
                        url: $.getUrlVar("url") + "?api_key=$$key".render2({
                            key: $.cookie("key")
                        })
                    });
                }
            } else if (getUrlSub() == "countries") {
                /*  Países  */
                if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {

                    var userList = buildDataTable({
                        headers: ["Nome", "Url", "_"]
                    });

                    $("#dashboard-content .content").append(userList);

                    $("#button-add").click(function() {
                        resetWarnings();
                        location.hash = "#!/" + getUrlSub() + "?option=add";
                    });

                    $("#results").dataTable({
                        iDisplayLength: 50,
                        "oLanguage": get_datatable_lang(),
                        "bProcessing": true,
                        "sAjaxSource": api_path + '/api/country?api_key=$$key&content-type=application/json&lang=$$lang&columns=name,name_url,url,_,_'.render2({
                            lang: cur_lang,
                            key: $.cookie("key")
                        }),
                        "aoColumnDefs": [{
                            "bSearchable": false,
                            "bSortable": false,
                            "sClass": "botoes",
                            "sWidth": "60px",
                            "aTargets": [2]
                        }],
                        "fnDrawCallback": function() {
                            DTdesenhaBotoes();
                        }
                    });

                } else if ($.getUrlVar("option") == "add" || $.getUrlVar("option") == "edit") {

                    var txtOption = ($.getUrlVar("option") == "add") ? "$$e".render({
                        e: 'Cadastrar'
                    }) : "$$e".render({
                        e: 'Editar'
                    });

                    var newform = [];

                    newform.push({
                        label: "Nome",
                        input: ["text,name,itext"]
                    });

                    var formbuild = $("#dashboard-content .content").append(buildForm(newform, txtOption));
                    $(formbuild).find("div .field:odd").addClass("odd");
                    $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

                    $(formbuild).find("#name").qtip($.extend(true, {}, qtip_input, {
                        content: "Nome do País."
                    }));

                    if ($.getUrlVar("option") == "edit") {
                        $.ajax({
                            type: 'GET',
                            dataType: 'json',
                            url: $.getUrlVar("url") + "?api_key=$$key".render2({
                                key: $.cookie("key")
                            }),
                            success: function(data, status, jqXHR) {
                                switch (jqXHR.status) {
                                    case 200:
                                        $(formbuild).find("input#name").val(data.name);
                                        break;
                                }
                            },
                            error: function(data) {
                                switch (data.status) {
                                    case 400:
                                        $(".form-aviso").setWarning({
                                            msg: "Erro: ($$codigo)".render2({
                                                codigo: $.trataErro(data)
                                            })
                                        });
                                        break;
                                }
                            }
                        });
                    }

                    $("#dashboard-content .content .botao-form[ref='enviar']").click(function() {
                        resetWarnings();
                        if ($(this).parent().parent().find("#name").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe o Nome"
                            });
                        } else {

                            if ($.getUrlVar("option") == "add") {
                                var action = "create";
                                var method = "POST";
                                var url_action = api_path + "/api/country";
                            } else {
                                var action = "update";
                                var method = "POST";
                                var url_action = $.getUrlVar("url");
                            }

                            args = [{
                                name: "api_key",
                                value: $.cookie("key")
                            }, {
                                name: "country." + action + ".name",
                                value: $(this).parent().parent().find("#name").val()
                            }, ];
                            $("#dashboard-content .content .botao-form[ref='enviar']").hide();
                            $.ajax({
                                type: method,
                                dataType: 'json',
                                url: url_action,
                                data: args,
                                success: function(data, status, jqXHR) {
                                    $("#aviso").setWarning({
                                        msg: "Operação efetuada com sucesso.".render2({
                                            codigo: jqXHR.status
                                        })
                                    });
                                    location.hash = "#!/" + getUrlSub();
                                },
                                error: function(data) {
                                    switch (data.status) {
                                        case 400:
                                            $("#aviso").setWarning({
                                                msg: "Erro ao $$operacao. ($$codigo)".render2({
                                                    operacao: txtOption,
                                                    codigo: $.trataErro(data)
                                                })
                                            });
                                            break;
                                    }
                                    $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                }
                            });
                        }
                    });
                    $("#dashboard-content .content .botao-form[ref='cancelar']").click(function() {
                        resetWarnings();
                        history.back();
                    });
                } else if ($.getUrlVar("option") == "delete") {
                    deleteRegister({
                        url: $.getUrlVar("url") + "?api_key=$$key".render2({
                            key: $.cookie("key")
                        })
                    });
                }
            } else if (getUrlSub() == "networks") {
                /*  Estados  */
                if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {

                    var userList = buildDataTable({
                        headers: ["Nome", "Sobre", "_"]
                    });

                    $("#dashboard-content .content").append(userList);

                    $("#button-add").click(function() {
                        resetWarnings();
                        location.hash = "#!/" + getUrlSub() + "?option=add";
                    });

                    $("#results").dataTable({
                        iDisplayLength: 50,
                        "oLanguage": get_datatable_lang(),
                        "bProcessing": true,
                        "sAjaxSource": api_path + '/api/network?api_key=$$key&content-type=application/json&lang=$$lang&columns=name,description,url,_,_'.render2({
                            lang: cur_lang,
                            key: $.cookie("key")
                        }),
                        "aoColumnDefs": [{
                            "bSearchable": false,
                            "bSortable": false,
                            "sClass": "botoes",
                            "sWidth": "60px",
                            "aTargets": [2]
                        }],
                        "fnDrawCallback": function() {
                            DTdesenhaBotoes();
                        }
                    });

                } else if ($.getUrlVar("option") == "add" || $.getUrlVar("option") == "edit") {

                    var txtOption = ($.getUrlVar("option") == "add") ? "$$e".render({
                        e: 'Cadastrar'
                    }) : "$$e".render({
                        e: 'Editar'
                    });

                    var newform = [];

                    newform.push({
                        label: "Nome",
                        input: ["text,name,itext"]
                    });
                    newform.push({
                        label: "Sobre",
                        input: ["text,description,itext"]
                    });
                    newform.push({
                        label: "Eixo",
                        input: ["text,axis_name,itext"]
                    });
                    newform.push({
                        label: "Tags",
                        input: ["text,tags,itext"]
                    });

                    var text_content = {
                        "txt_info_qualitativas": 'Informações qualitativas',
                        "txt_condicionantes": 'Condicionantes ambientais',
                        "txt_focos": "Focos e Perguntas Orientadoras",
                        "txt_titulo_mapa": "Título do mapa",
                        "txt_descricao_mapa": "Descrição do mapa",
                        "txt_glossario": 'Glossário',
                        "url_rede_low": "Imagem de fundo (baixa resolução)",
                        "url_mapa_high": "Imagem de fundo (alta resolução)",
                    };

                    for (var prop in text_content) {
                        if (text_content.hasOwnProperty(prop)) {
                            newform.push({
                                label: text_content[prop],
                                input: [(/(url|titulo)/.test(prop) ? 'text' : 'textarea') + "," + prop + ",itext"]
                            });
                        }
                    }
                    newform.push({
                        label: "Layout",
                        input: ["select,template_name,iselect"]
                    });

                    var formbuild = $("#dashboard-content .content").append(buildForm(newform, txtOption));
                    $(formbuild).find("div .field:odd").addClass("odd");
                    $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

                    $(formbuild).find("#name").qtip($.extend(true, {}, qtip_input, {
                        content: "Importante: Nome da Rede."
                    }));

                    var template_elm = $("#dashboard-content .content select#template_name");
                    template_elm.append($("<option></option>").val("").html("$$e...".render({
                        e: 'Selecione'
                    })));
                    template_elm.append($("<option></option>").val("layout1").html("$$e".render({
                        e: 'Exibir Regiões'
                    })));
                    template_elm.append($("<option></option>").val("layout2").html("$$e".render({
                        e: 'Exibir UCs'
                    })));

                    if ($.getUrlVar("option") == "edit") {
                        $.ajax({
                            type: 'GET',
                            dataType: 'json',
                            url: $.getUrlVar("url") + "?api_key=$$key".render2({
                                key: $.cookie("key")
                            }),
                            success: function(data, status, jqXHR) {
                                switch (jqXHR.status) {
                                    case 200:
                                        $(formbuild).find("#name").val(data.name);
                                        $(formbuild).find("#axis_name").val(data.axis_name);
                                        $(formbuild).find("#description").val(data.description);
                                        $(formbuild).find("#tags").val(data.tags);

                                        var text_data = $.parseJSON(data.text_content);
                                        for (var prop in text_content) {
                                            if (text_content.hasOwnProperty(prop)) {
                                                $(formbuild).find("#" + prop).val(text_data[prop]);
                                            }
                                        }

                                        template_elm.val(data.template_name);

                                        break;
                                }
                            },
                            error: function(data) {
                                switch (data.status) {
                                    case 400:
                                        $(".form-aviso").setWarning({
                                            msg: "Erro: ($$codigo)".render2({
                                                codigo: $.trataErro(data)
                                            })
                                        });
                                        break;
                                }
                            }
                        });
                    }

                    $("#dashboard-content .content .botao-form[ref='enviar']").click(function() {
                        resetWarnings();
                        if ($(this).parent().parent().find("#template_name").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe o Layout"
                            });
                        } else if ($(this).parent().parent().find("#name").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe o Nome"
                            });
                        } else if ($(this).parent().parent().find("#axis_name").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe o Eixo"
                            });
                        } else if ($(this).parent().parent().find("#description").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe a Descrição"
                            });

                        } else {

                            var save_data = {};
                            for (var prop in text_content) {
                                if (text_content.hasOwnProperty(prop)) {
                                    save_data[prop] = $("#" + prop).val();
                                }
                            }

                            if ($.getUrlVar("option") == "add") {
                                var action = "create";
                                var method = "POST";
                                var url_action = api_path + "/api/network";
                            } else {
                                var action = "update";
                                var method = "POST";
                                var url_action = $.getUrlVar("url");
                            }

                            args = [{
                                    name: "api_key",
                                    value: $.cookie("key")
                                }, {
                                    name: "network." + action + ".domain_name",
                                    value: UUID.generate() + '.com'
                                }, {
                                    name: "network." + action + ".name",
                                    value: $(this).parent().parent().find("#name").val()
                                }, {
                                    name: "network." + action + ".axis_name",
                                    value: $(this).parent().parent().find("#axis_name").val()
                                }, {
                                    name: "network." + action + ".description",
                                    value: $(this).parent().parent().find("#description").val()
                                }, {
                                    name: "network." + action + ".tags",
                                    value: $(this).parent().parent().find("#tags").val()
                                }, {
                                    name: "network." + action + ".institute_id",
                                    value: 1
                                }, {
                                    name: "network." + action + ".template_name",
                                    value: $(this).parent().parent().find("#template_name option:selected").val()
                                }, {
                                    name: "network." + action + ".topic",
                                    value: 0
                                }, {
                                    name: "network." + action + ".text_content",
                                    value: JSON.stringify(save_data)
                                }

                            ];

                            $("#dashboard-content .content .botao-form[ref='enviar']").hide();
                            $.ajax({
                                type: method,
                                dataType: 'json',
                                url: url_action,
                                data: args,
                                success: function(data, status, jqXHR) {
                                    $("#aviso").setWarning({
                                        msg: "Operação efetuada com sucesso.".render2({
                                            codigo: jqXHR.status
                                        })
                                    });
                                    location.hash = "#!/" + getUrlSub();
                                },
                                error: function(data) {
                                    switch (data.status) {
                                        case 400:
                                            $("#aviso").setWarning({
                                                msg: "Erro ao $$operacao. ($$codigo)".render2({
                                                    operacao: txtOption,
                                                    codigo: $.trataErro(data)
                                                })
                                            });
                                            break;
                                    }
                                    $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                }
                            });
                        }
                    });
                    $("#dashboard-content .content .botao-form[ref='cancelar']").click(function() {
                        resetWarnings();
                        history.back();
                    });
                } else if ($.getUrlVar("option") == "delete") {
                    deleteRegister({
                        url: $.getUrlVar("url") + "?api_key=$$key".render2({
                            key: $.cookie("key")
                        })
                    });
                }
            } else if (getUrlSub() == "units") {
                /*  UNIDADES DE MEDIDA  */
                if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {

                    var userList = buildDataTable({
                        headers: ["Nome", "Sigla", "_"]
                    });

                    $("#dashboard-content .content").append(userList);

                    $("#button-add").click(function() {
                        resetWarnings();
                        location.hash = "#!/" + getUrlSub() + "?option=add";
                    });

                    $("#results").dataTable({
                        iDisplayLength: 50,
                        "oLanguage": get_datatable_lang(),
                        "bProcessing": true,
                        "sAjaxSource": api_path + '/api/measurement_unit?api_key=$$key&content-type=application/json&lang=$$lang&columns=name,short_name,url,_,_'.render2({
                            lang: cur_lang,
                            key: $.cookie("key")
                        }),
                        "aoColumnDefs": [{
                            "bSearchable": false,
                            "bSortable": false,
                            "sClass": "botoes",
                            "sWidth": "60px",
                            "aTargets": [2]
                        }],
                        "fnDrawCallback": function() {
                            DTdesenhaBotoes();
                        }
                    });

                } else if ($.getUrlVar("option") == "add" || $.getUrlVar("option") == "edit") {

                    var txtOption = ($.getUrlVar("option") == "add") ? "$$e".render({
                        e: 'Cadastrar'
                    }) : "$$e".render({
                        e: 'Editar'
                    });

                    var newform = [];

                    newform.push({
                        label: "Nome",
                        input: ["text,name,itext"]
                    });
                    newform.push({
                        label: "Sigla",
                        input: ["text,short_name,itext"]
                    });

                    var formbuild = $("#dashboard-content .content").append(buildForm(newform, txtOption));
                    $(formbuild).find("div .field:odd").addClass("odd");
                    $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

                    $(formbuild).find("#name").qtip($.extend(true, {}, qtip_input, {
                        content: "Nome da unidade de medida. Ex: Quilos"
                    }));
                    $(formbuild).find("#short_name").qtip($.extend(true, {}, qtip_input, {
                        content: "Sigla da unidade de medida. Ex: Kg, cm, m2"
                    }));

                    if ($.getUrlVar("option") == "edit") {
                        $.ajax({
                            type: 'GET',
                            dataType: 'json',
                            url: $.getUrlVar("url") + "?api_key=$$key".render2({
                                key: $.cookie("key")
                            }),
                            success: function(data, status, jqXHR) {
                                switch (jqXHR.status) {
                                    case 200:
                                        $(formbuild).find("input#name").val(data.name);
                                        $(formbuild).find("input#short_name").val(data.short_name);
                                        break;
                                }
                            },
                            error: function(data) {
                                switch (data.status) {
                                    case 400:
                                        $(".form-aviso").setWarning({
                                            msg: "Erro: ($$codigo)".render2({
                                                codigo: $.trataErro(data)
                                            })
                                        });
                                        break;
                                }
                            }
                        });
                    }

                    $("#dashboard-content .content .botao-form[ref='enviar']").click(function() {
                        resetWarnings();
                        if ($(this).parent().parent().find("#name").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe o Nome"
                            });
                        } else if ($(this).parent().parent().find("#short_name").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe a Sigla"
                            });
                        } else {

                            if ($.getUrlVar("option") == "add") {
                                var action = "create";
                                var method = "POST";
                                var url_action = api_path + "/api/measurement_unit";
                            } else {
                                var action = "update";
                                var method = "POST";
                                var url_action = $.getUrlVar("url");
                            }
                            args = [{
                                name: "api_key",
                                value: $.cookie("key")
                            }, {
                                name: "measurement_unit." + action + ".name",
                                value: $(this).parent().parent().find("#name").val()
                            }, {
                                name: "measurement_unit." + action + ".short_name",
                                value: $(this).parent().parent().find("#short_name").val()
                            }];

                            $("#dashboard-content .content .botao-form[ref='enviar']").hide();
                            $.ajax({
                                type: method,
                                dataType: 'json',
                                url: url_action,
                                data: args,
                                success: function(data, status, jqXHR) {
                                    $("#aviso").setWarning({
                                        msg: "Operação efetuada com sucesso.".render2({
                                            codigo: jqXHR.status
                                        })
                                    });
                                    location.hash = "#!/" + getUrlSub();
                                },
                                error: function(data) {
                                    switch (data.status) {
                                        case 400:
                                            $("#aviso").setWarning({
                                                msg: "Erro ao $$operacao. ($$codigo)".render2({
                                                    codigo: $.trataErro(data),
                                                    operacao: txtOption
                                                })
                                            });
                                            break;
                                    }
                                    $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                }
                            });
                        }
                    });
                    $("#dashboard-content .content .botao-form[ref='cancelar']").click(function() {
                        resetWarnings();
                        history.back();
                    });
                } else if ($.getUrlVar("option") == "delete") {
                    deleteRegister({
                        url: $.getUrlVar("url") + "?api_key=$$key".render2({
                            key: $.cookie("key")
                        })
                    });
                }
            } else if (getUrlSub() == "variable") {
                /*  VARIABLE  */
                if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {

                    var variableList = buildDataTable({
                        headers: ["Nome", "Apelido", "Tipo", "Data Criação", "_"]
                    });

                    $("#dashboard-content .content").append(variableList);

                    $("#button-add").click(function() {
                        resetWarnings();
                        location.hash = "#!/" + getUrlSub() + "?option=add";
                    });

                    var data_config;

                    function toggleAllCheckboxesVariable() {
                        $("table input[type=checkbox]").each(function(index, item) {
                            if ($(this).attr("disabled") == "disabled") {
                                $(this).removeAttr("disabled");
                            } else {
                                $(this).attr("disabled", "true");
                            }
                        });
                    }

                    function loadVariableConfig() {
                        $.ajax({
                            async: false,
                            type: 'GET',
                            dataType: 'json',
                            url: api_path + '/api/user/$$user/variable_config?api_key=$$key'.render2({
                                key: $.cookie("key"),
                                user: $.cookie("user.id")
                            }),
                            success: function(data, textStatus, jqXHR) {
                                data_config = data;
                            }
                        }).done(function() {
                            toggleAllCheckboxesVariable();
                        });
                    }

                    loadVariableConfig();

                    $("#results").dataTable({
                        iDisplayLength: 50,
                        "oLanguage": get_datatable_lang(),
                        "bProcessing": true,
                        "sAjaxSource": api_path + '/api/variable?use=edit&api_key=$$key&content-type=application/json&lang=$$lang&columns=name,cognomen,type,created_at,url,url,_,_'.render2({
                            lang: cur_lang,
                            key: $.cookie("key")
                        }),
                        "aoColumnDefs": [{
                            "bSearchable": false,
                            "bSortable": false,
                            "sClass": "botoes",
                            "sWidth": "80px",
                            "aTargets": [4]
                        }, {
                            "bSearchable": false,
                            "bSortable": true,
                            "sClass": "checkbox center",
                            "sWidth": "80px",
                            "aTargets": [3]
                        }, {
                            "sClass": "center",
                            "aTargets": [2]
                        }, {
                            "sWidth": "300px",
                            "aTargets": [3]
                        }, {
                            "fnRender": function(oObj, sVal) {
                                return variable_types[sVal];
                            },
                            "aTargets": [2]
                        }, {
                            "fnRender": function(oObj, sVal) {
                                return $.format.date(sVal, "dd/MM/yyyy");
                            },
                            "aTargets": [3]
                        }, {
                            "fnRender": function(oObj, sVal) {
                                var text = sVal;
                                var count = 20;
                                if (sVal.length > count) {
                                    text = text.substring(0, count) + "...";
                                }

                                return text;
                            },
                            "aTargets": [1]
                        }],
                        "aaSorting": [
                            [3, 'desc'],
                            [0, 'asc']
                        ],
                        "fnDrawCallback": function() {
                            DTdesenhaBotoes();
                            $("#results td.is_basic").each(function() {
                                if ($(this).html() == "1") {

                                    $(this).html("Sim");
                                } else if ($(this).html() == "0") {
                                    $(this).html("Não");
                                }
                            });

                            $("#results td.checkbox input[type=checkbox]").change(function() {
                                var display_in_home = ($(this).prop("checked")) ? 1 : 0;

                                if (!data_config[$(this).attr("var-id")]) {
                                    var action = "create";
                                    var method = "POST";
                                    var url_action = api_path + "/api/user/$$user/variable_config".render2({
                                        user: $.cookie("user.id")
                                    });
                                } else {
                                    var action = "update";
                                    var method = "POST";
                                    var url_action = api_path + "/api/user/$$user/variable_config/$$id".render2({
                                        user: $.cookie("user.id"),
                                        id: data_config[$(this).attr("var-id")].id
                                    });

                                }

                                args = [{
                                    name: "api_key",
                                    value: $.cookie("key")
                                }, {
                                    name: "user.variable_config." + action + ".display_in_home",
                                    value: display_in_home
                                }, {
                                    name: "user.variable_config." + action + ".variable_id",
                                    value: $(this).attr("var-id")
                                }];

                                toggleAllCheckboxesVariable();

                                $.ajax({
                                    type: method,
                                    dataType: 'json',
                                    url: url_action,
                                    data: args,
                                    success: function(data) {
                                        loadVariableConfig();
                                    },
                                    error: function(data) {
                                        $("#aviso").setWarning({
                                            msg: "Erro ao atualizar configuração. ($$codigo)".render2({
                                                codigo: $.trataErro(data)
                                            })
                                        });
                                    }
                                });
                            });

                        }
                    });

                } else if ($.getUrlVar("option") == "add" || $.getUrlVar("option") == "edit") {

                    var txtOption = ($.getUrlVar("option") == "add") ? "$$e".render({
                        e: 'Cadastrar'
                    }) : "$$e".render({
                        e: 'Editar'
                    });

                    var newform = [];

                    newform.push({
                        label: "Nome",
                        input: ["text,name,itext"]
                    });
                    newform.push({
                        label: "Apelido",
                        input: ["text,cognomen,itext"]
                    });
                    newform.push({
                        label: "Explicação",
                        input: ["textarea,explanation,itext"]
                    });
                    newform.push({
                        label: "Tipo",
                        input: ["select,type,iselect"]
                    });
                    newform.push({
                        label: "Unidade de Medida",
                        input: ["select,measurement_unit,iselect unit", "text,unit_new,itext250px", "text,unit_sg_new,itext50px"]
                    });


                    var formbuild = $("#dashboard-content .content").append(buildForm(newform, txtOption));

                    var $colors = $("#dashboard-content .form").append('<div class="field add-colors"></div>').find('.add-colors');

                    $colors.html('<div class="label">Configurar Cores</div><div class="input"><span style="float:right">Textos em branco serão ignorados</span> <button class="add">+ Adicionar</button></div><div class="clear"></div><div id="addcolors"></div>');

                    function fill_colors_select(tselect) {
                        $(tselect).append('<option value="#FFF" style="color: #999">✹ Branco</option>');
                        $(tselect).append('<option value="#000" style="color: #000">✹ Preto</option>');
                        $(tselect).append('<option value="#d21b1b" style="color: #d21b1b">✹ Vermelho</option>');
                        $(tselect).append('<option value="#FE9753" style="color: #FE9753">✹ Laranja</option>');
                        $(tselect).append('<option value="#E2F98E" style="color: #c39a1f">✹ Amarelo</option>');
                        $(tselect).append('<option value="#219859" style="color: #219859">✹ Verde</option>');


                        $(tselect).change(function() {
                            $(this).css('color', this.value == '#FFF' ? '#999' : this.value == '#E2F98E' ? '#c39a1f' : this.value);
                        }).change();
                    }

                    function _add_color_block() {
                        var $elm = $('<div><input class="text addcolors-input" /><select class="addcolors-select"></select></div>');

                        fill_colors_select($elm.find('.addcolors-select'));

                        $('#addcolors').append($elm);
                        return $elm;
                    };
                    $colors.find('button.add').click(_add_color_block);

                    $(formbuild).find("div .field:odd").addClass("odd");
                    $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

                    setNewSource($("#dashboard-content .content select#source"), $("#dashboard-content .content input#source_new"));
                    setNewUnit($("#dashboard-content .content select#measurement_unit"), $("#dashboard-content .content input#unit_new"), $("#dashboard-content .content input#unit_sg_new"));

                    $(formbuild).find("#name").qtip($.extend(true, {}, qtip_input, {
                        content: "Nome da variável."
                    }));
                    $(formbuild).find("#cognomen").qtip($.extend(true, {}, qtip_input, {
                        content: "Nome amigável/abreviado para a Variável.<br />Ex: Desnutrição infantil > Apelido: 'Desnut_Infantil' ou 'Desn.Infant'"
                    }));
                    $(formbuild).find("#explanation").qtip($.extend(true, {}, qtip_input, {
                        content: "Explicação breve sobre a Variável."
                    }));
                    $(formbuild).find("#type").qtip($.extend(true, {}, qtip_input, {
                        content: "Ex:<br />Inteiro = 10<br />Alfanumérico = Azul<br />Valor = 100,00"
                    }));
                    $(formbuild).find("#is_basic").qtip($.extend(true, {}, qtip_input, {
                        content: "Marcar essa opção para variáveis básicas."
                    }));

                    $.each(variable_types, function(key, value) {
                        $("#dashboard-content .content select#type").append($("<option></option>").val(key).html(value));
                    });

                    loadUnits();

                    loadComboUnits(measurement_units, $("#dashboard-content .content select#measurement_unit"), $("#dashboard-content .content input#unit_new"), $("#dashboard-content .content input#unit_sg_new"));

                    loadSources();

                    loadComboSources(sources, $("#dashboard-content .content select#source"), $("#dashboard-content .content input#source_new"));

                    if ($.getUrlVar("option") == "edit") {
                        $.ajax({
                            type: 'GET',
                            dataType: 'json',
                            url: $.getUrlVar("url") + "?api_key=$$key".render2({
                                key: $.cookie("key")
                            }),
                            success: function(data, status, jqXHR) {
                                switch (jqXHR.status) {
                                    case 200:
                                        $(formbuild).find("input#name").val(data.name);
                                        $(formbuild).find("input#cognomen").val(data.cognomen);
                                        $(formbuild).find("textarea#explanation").val(data.explanation);
                                        $(formbuild).find("select#type").val(data.type);
                                        if (data.measurement_unit) {
                                            $(formbuild).find("select#measurement_unit").val(data.measurement_unit.id);
                                        }
                                        if (data.colors)
                                            data.colors = JSON.parse(data.colors);

                                        $.each(data.colors, function(nome, valor) {
                                            var $elm = _add_color_block();
                                            $elm.find('input').val(nome);
                                            $elm.find('select option[value=' + valor + ']').prop('selected', 'selected').change();
                                        });
                                        //$(formbuild).find("select#period").val(data.period);

                                        $(formbuild).find("select#source").val(data.source);

                                        if (!($(formbuild).find("select#source").val() == data.source)) {
                                            $(formbuild).find("select#source").append($("<option></option>").val(data.source).html(data.source).attr("source-id", '?'));
                                            $(formbuild).find("select#source").val(data.source);
                                        }
                                        if ($(formbuild).find("select#source option:selected").val() != "") {
                                            $("#dashboard-content .content a#delete-source").show();
                                        }

                                        if (data.is_basic == 1) {
                                            $(formbuild).find("input#is_basic").attr("checked", true);
                                        } else {
                                            $(formbuild).find("input#is_basic").attr("checked", false);
                                        }
                                        break;
                                }
                            },
                            error: function(data) {
                                switch (data.status) {
                                    case 400:
                                        $(".form-aviso").setWarning({
                                            msg: "Erro: ($$codigo)".render2({
                                                codigo: $.trataErro(data)
                                            })
                                        });
                                        break;
                                }
                            }
                        });
                    }

                    $("#dashboard-content .content .botao-form[ref='enviar']").click(function() {
                        resetWarnings();
                        if ($(this).parent().parent().find("#name").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe o Nome"
                            });
                        } else if ($(this).parent().parent().find("#cognomen").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe o Apelido"
                            });
                        } else if ($(this).parent().parent().find("#measurement_unit option:selected").val() == "_new") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe a nova unidade de medida"
                            });

                        } else {

                            if ($.getUrlVar("option") == "add") {
                                var action = "create";
                                var method = "POST";
                                var url_action = api_path + "/api/variable";
                            } else {
                                var action = "update";
                                var method = "POST";
                                var url_action = $.getUrlVar("url");
                            }

                            var cur_colors = {};
                            $('.addcolors-input').each(function(i, e) {
                                var $e = $(e);
                                if ($e.val()) {
                                    cur_colors[$e.val()] = $e.parent().find('select').val();
                                }
                            });

                            args = [{
                                name: "api_key",
                                value: $.cookie("key")
                            }, {
                                name: "variable." + action + ".name",
                                value: $(this).parent().parent().find("#name").val()
                            }, {
                                name: "variable." + action + ".cognomen",
                                value: $(this).parent().parent().find("#cognomen").val()
                            }, {
                                name: "variable." + action + ".explanation",
                                value: $(this).parent().parent().find("#explanation").val()
                            }, {
                                name: "variable." + action + ".type",
                                value: $(this).parent().parent().find("#type option:selected").val()
                            }, {
                                name: "variable." + action + ".measurement_unit_id",
                                value: $(this).parent().parent().find("#measurement_unit option:selected").val()
                            }, {
                                name: "variable." + action + ".period",
                                value: 'yearly'
                            }, {
                                name: "variable." + action + ".colors",
                                value: JSON.stringify(cur_colors)
                            }];

                            args.push({
                                name: "variable." + action + ".source",
                                value: $(this).parent().parent().find("#source option:selected").val()
                            });

                            if ($(this).parent().parent().find("#is_basic").attr("checked")) {
                                args.push({
                                    name: "variable." + action + ".is_basic",
                                    value: 1
                                });
                            } else {
                                args.push({
                                    name: "variable." + action + ".is_basic",
                                    value: 0
                                });
                            }

                            $("#dashboard-content .content .botao-form[ref='enviar']").hide();
                            $.ajax({
                                type: method,
                                dataType: 'json',
                                url: url_action,
                                data: args,
                                success: function(data, status, jqXHR) {
                                    $("#aviso").setWarning({
                                        msg: "Operação efetuada com sucesso.".render2({
                                            codigo: jqXHR.status
                                        })
                                    });
                                    location.hash = "#!/" + getUrlSub();
                                },
                                error: function(data) {
                                    switch (data.status) {
                                        case 400:
                                            $("#aviso").setWarning({
                                                msg: "Erro ao $$operacao. ($$codigo)".render2({
                                                    codigo: $.trataErro(data),
                                                    operacao: txtOption
                                                })
                                            });
                                            break;
                                    }
                                    $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                }
                            });
                        }
                    });

                    $("#dashboard-content .content .botao-form[ref='cancelar']").click(function() {
                        resetWarnings();
                        history.back();
                    });
                } else if ($.getUrlVar("option") == "delete") {

                    deleteRegister({
                        url: $.getUrlVar("url") + "?api_key=$$key".render2({
                            key: $.cookie("key")
                        })
                    });
                }
            } else if (getUrlSub() == "myvariable") {
                /*  VARIABLE  */
                if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {

                    var variableList = buildDataTable({
                        headers: ["Nome", "Mostrar na Home", "_"]
                    }, null, false);

                    $("#dashboard-content .content").append(variableList);

                    $("#button-add").click(function() {
                        resetWarnings();
                        location.hash = "#!/" + getUrlSub() + "?option=add";
                    });

                    function loadMyVariableConfig() {
                        //carrega config do usuario
                        $.ajax({
                            async: "false",
                            type: 'GET',
                            dataType: 'json',
                            url: api_path + '/api/user/$$user/variable_config?api_key=$$key'.render2({
                                key: $.cookie("key"),
                                user: $.cookie("user.id")
                            }),
                            success: function(data, textStatus, jqXHR) {
                                data_config = data;
                            }
                        }).done(function() {
                            toggleAllCheckboxes();
                        });
                    }

                    function toggleAllCheckboxes() {
                        $("table input[type=checkbox]").each(function(index, item) {
                            if ($(this).attr("disabled") == "disabled") {
                                $(this).removeAttr("disabled");
                            } else {
                                $(this).attr("disabled", "true");
                            }
                            if (data_config[$(this).attr("var-id")]) {
                                if (data_config[$(this).attr("var-id")].display_in_home == 1) {
                                    $(this).prop("checked", true);
                                } else {
                                    $(this).prop("checked", false);
                                }
                            } else if (data_config_admin[$(this).attr("var-id")]) {
                                $(this).prop("checked", false);
                                if (data_config_admin[$(this).attr("var-id")].display_in_home == 1) {
                                    $(this).prop("checked", true);
                                    $(this).addClass("admin_checked");
                                }
                            } else {
                                $(this).prop("checked", false);
                            }
                        });
                    }

                    //carrega dados do admin
                    var data_network;
                    var data_config_admin;
                    var data_config;

                    $.ajax({
                        type: 'GET',
                        dataType: 'json',
                        url: api_path + '/api/public/network?api_key=$$key'.render2({
                            key: $.cookie("key")
                        }),
                        success: function(data, textStatus, jqXHR) {
                            data_network = data;
                        }
                    }).done(function() {
                        //carrega config do admin
                        $.ajax({
                            type: 'GET',
                            dataType: 'json',
                            url: api_path + '/api/user/$$user/variable_config?api_key=$$key'.render2({
                                key: $.cookie("key"),
                                user: data_network.admin_users[0].id
                            }),
                            success: function(data, textStatus, jqXHR) {
                                data_config_admin = data;
                            }
                        }).done(function() {

                            //carrega config do usuario
                            $.ajax({
                                type: 'GET',
                                dataType: 'json',
                                url: api_path + '/api/user/$$user/variable_config?api_key=$$key'.render2({
                                    key: $.cookie("key"),
                                    user: $.cookie("user.id")
                                }),
                                success: function(data, textStatus, jqXHR) {
                                    data_config = data;
                                }
                            }).done(function() {

                                $.ajax({
                                    type: 'GET',
                                    dataType: 'json',
                                    url: api_path + '/api/user/$$userid/variable?api_key=$$key&is_basic=1'.render2({
                                        key: $.cookie("key"),
                                        userid: $.cookie("user.id")
                                    }),
                                    success: function(data, textStatus, jqXHR) {
                                        $.each(data.variables, function(index, value) {
                                            $("#dashboard-content .content #results tbody").append($("<tr><td>$$nome</td><td>$$_id</td><td>$$_id</td></tr>".render({
                                                nome: data.variables[index].name,
                                                apelido: data.variables[index].cognomen,
                                                _id: data.variables[index].variable_id
                                            })));
                                        });

                                        var oTable = $("#results").dataTable({
                                            iDisplayLength: 50,
                                            "oLanguage": get_datatable_lang(),
                                            "aoColumnDefs": [{
                                                "bSearchable": false,
                                                "bSortable": false,
                                                "sClass": "botoes",
                                                "sWidth": "60px",
                                                "aTargets": [2]
                                            }, {
                                                "bSearchable": false,
                                                "bSortable": true,
                                                "sClass": "checkbox center",
                                                "sWidth": "80px",
                                                "aTargets": [1]
                                            }, {
                                                "fnRender": function(oObj, sVal) {
                                                    var checked = "";
                                                    if (data_config[getIdFromUrl(sVal)] && data_config[getIdFromUrl(sVal)].display_in_home == 1) {
                                                        checked = "checked=checked";
                                                    } else if (!(data_config[getIdFromUrl(sVal)]) && data_config_admin[getIdFromUrl(sVal)] && data_config_admin[getIdFromUrl(sVal)].display_in_home == 1) {
                                                        checked = "checked=checked class='admin_checked'";
                                                    }
                                                    return "<input type='checkbox' name='chk_home' var-id='" + getIdFromUrl(sVal) + "' $$checked>".render({
                                                        checked: checked
                                                    });
                                                },
                                                "aTargets": [1]
                                            }],
                                            "fnDrawCallback": function() {
                                                DTdesenhaBotaoVariavel();
                                                $("#results td.checkbox input").unbind();
                                                $("#results td.checkbox input").bind("click", function() {
                                                    toggleAllCheckboxes();
                                                    if ($(this).hasClass("admin_checked")) {
                                                        var display_in_home = 1;
                                                        $(this).removeClass("admin_checked");
                                                    } else {
                                                        var display_in_home = ($(this).attr("checked")) ? 0 : 1;
                                                    }

                                                    if (!data_config[$(this).attr("var-id")]) {
                                                        var action = "create";
                                                        var method = "POST";
                                                        var url_action = api_path + "/api/user/$$user/variable_config".render2({
                                                            user: $.cookie("user.id")
                                                        });
                                                    } else {
                                                        if (display_in_home == 0 && $(this).hasClass("admin_checked") == false) {
                                                            var action = "delete";
                                                            var method = "DELETE";
                                                            var url_action = api_path + "/api/user/$$user/variable_config/$$id".render2({
                                                                user: $.cookie("user.id"),
                                                                id: data_config[$(this).attr("var-id")].id
                                                            });
                                                        } else {
                                                            var action = "update";
                                                            var method = "POST";
                                                            var url_action = api_path + "/api/user/$$user/variable_config/$$id".render2({
                                                                user: $.cookie("user.id"),
                                                                id: data_config[$(this).attr("var-id")].id
                                                            });
                                                        }

                                                    }

                                                    if ($(this).hasClass("admin_checked")) {
                                                        args = null;
                                                    } else {
                                                        args = [{
                                                            name: "api_key",
                                                            value: $.cookie("key")
                                                        }, {
                                                            name: "user.variable_config." + action + ".display_in_home",
                                                            value: display_in_home
                                                        }, {
                                                            name: "user.variable_config." + action + ".variable_id",
                                                            value: $(this).attr("var-id")
                                                        }];
                                                    }

                                                    $.ajax({
                                                        type: method,
                                                        dataType: 'json',
                                                        url: url_action,
                                                        data: args,
                                                        success: function(data) {
                                                            loadMyVariableConfig();
                                                        },
                                                        error: function(data) {
                                                            $("#aviso").setWarning({
                                                                msg: "Erro ao atualizar configuração. ($$codigo)".render2({
                                                                    codigo: $.trataErro(data)
                                                                })
                                                            });
                                                            toggleAllCheckboxes();
                                                        }
                                                    });
                                                });
                                            }
                                        });
                                        if (user_info.institute.id == 1) {
                                            oTable.fnSetColumnVis(1, false);
                                        }

                                    },
                                    error: function(data) {
                                        $("#aviso").setWarning({
                                            msg: "Erro ao carregar ($$codigo)".render2({
                                                codigo: $.trataErro(data)
                                            })
                                        });
                                    }
                                });
                            });
                        });
                    });

                } else if ($.getUrlVar("option") == "edit") {

                    var txtOption = "Adicionar Valor";

                    $.ajax({
                        type: 'GET',
                        dataType: 'json',
                        url: $.getUrlVar("url") + "?api_key=$$key".render2({
                            key: $.cookie("key")
                        }),
                        success: function(data, status, jqXHR) {
                            if (jqXHR.status == 200) {

                                var data_region;
                                $.ajax({
                                    async: false,
                                    type: 'GET',
                                    dataType: 'json',
                                    url: api_path + '/api/city/$$city/region?api_key=$$key'.render2({
                                        key: $.cookie("key"),
                                        city: getIdFromUrl(user_info.city)
                                    }),
                                    success: function(data, textStatus, jqXHR) {
                                        data_region = data.regions;
                                    }
                                });

                                var newform = [];

                                if (data_region && data_region.length > 0) {
                                    newform.push({
                                        label: "Região",
                                        input: ["select,region_id,iselect"]
                                    });
                                }

                                newform.push({
                                    label: "Variável",
                                    input: ["textlabel,textlabel_variable,ilabel"]
                                });
                                newform.push({
                                    label: "Valor",
                                    input: ["text,value,itext,ivar"] /* ref 01*/
                                });

                                newform.push({
                                    label: "Período",
                                    input: ["textlabel,textlabel_period,ilabel"]
                                });
                                if (data.period == "yearly") {
                                    newform.push({
                                        label: "Data",
                                        input: ["select,value_of_date,iselect"]
                                    });
                                } else if (data.period == "monthly") {
                                    newform.push({
                                        label: "Data",
                                        input: ["select,value_of_date_year,iselect", "select,value_of_date,iselect"]
                                    });
                                } else if (data.period == "daily") {
                                    newform.push({
                                        label: "Data",
                                        input: ["text,value_of_date,itext"]
                                    });
                                }
                                newform.push({
                                    label: "Descrição",
                                    input: ["textlabel,textlabel_explanation,ilabel"]
                                });

                                var formbuild = $("#dashboard-content .content").append(buildForm(newform, txtOption));

                                if (data_region && data_region.length > 0) {

                                    $("#dashboard-content .content select#region_id").change(function(e) {
                                        buildVariableHistory();
                                    });
                                    $("#dashboard-content .content select#region_id").append($("<option></option>").val("").html("$$e".render({
                                        e: 'Nenhuma'
                                    })));
                                    $.each(data_region, function(index, item) {
                                        $("#dashboard-content .content select#region_id").append($("<option></option>").val(item.id).html(item.name));
                                    });
                                }

                                if (data.period == "yearly") {
                                    $.ajax({
                                        type: 'GET',
                                        dataType: 'json',
                                        cache: true,
                                        url: api_path + '/api/period/year?api_key=$$key'.render2({
                                            key: $.cookie("key")
                                        }),
                                        success: function(data, textStatus, jqXHR) {
                                            $("#dashboard-content .content select#value_of_date option").remove();
                                            $.each(data.options, function(index, value) {
                                                $("#dashboard-content .content select#value_of_date").append("<option value='$$_value'>$$_text</option>".render({
                                                    _text: data.options[index].text,
                                                    _value: data.options[index].value
                                                }));
                                            });
                                            $("#dashboard-content .content select#value_of_date option:last").attr("selected", "selected");
                                        }
                                    });
                                } else if (data.period == "monthly") {
                                    $("#dashboard-content .content select#value_of_date").hide();
                                    $.ajax({
                                        type: 'GET',
                                        dataType: 'json',
                                        cache: true,
                                        url: api_path + '/api/period/year?api_key=$$key'.render2({
                                            key: $.cookie("key")
                                        }),
                                        success: function(data, textStatus, jqXHR) {
                                            $("#dashboard-content .content select#value_of_date_year option").remove();
                                            $("#dashboard-content .content select#value_of_date_year").append("<option value=''>Selecione o ano</option>");
                                            $.each(data.options, function(index, value) {
                                                $("#dashboard-content .content select#value_of_date_year").append("<option value='$$_value'>$$_text</option>".render({
                                                    _text: data.options[index].text,
                                                    _value: data.options[index].value
                                                }));
                                            });
                                            $("#dashboard-content .content select#value_of_date option:last").attr("selected", "selected");

                                            $("#dashboard-content .content select#value_of_date_year").change(function() {
                                                $("#dashboard-content .content select#value_of_date option").remove();
                                                $("#dashboard-content .content select#value_of_date").hide();
                                                if ($(this).find("option:selected").val() != "") {
                                                    $("#dashboard-content .content select#value_of_date").show();
                                                    $.ajax({
                                                        type: 'GET',
                                                        dataType: 'json',
                                                        cache: true,
                                                        url: api_path + '/api/period/year/$$year/month?api_key=$$key'.render2({
                                                            key: $.cookie("key"),
                                                            year: $("#dashboard-content .content select#value_of_date_year option:selected").html()
                                                        }),
                                                        success: function(data, textStatus, jqXHR) {
                                                            $.each(data.options, function(index, value) {
                                                                $("#dashboard-content .content select#value_of_date").append("<option value='$$value'>$$text</option>".render2({
                                                                    text: data.options[index].text,
                                                                    value: data.options[index].value
                                                                }));
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                } else if (data.period == "daily") {
                                    $("#dashboard-content .content input#value_of_date").datepicker({
                                        dateFormat: 'dd/mm/yy',
                                        defaultDate: "0",
                                        changeMonth: true,
                                        changeYear: true
                                    });
                                }

                                $("#dashboard-content .content .botao-form[ref='enviar']").html("$$e".render({
                                    e: 'Adicionar'
                                }));
                                $("#dashboard-content .content .botao-form[ref='cancelar']").html("$$e".render({
                                    e: 'Voltar'
                                }));
                                $(formbuild).find("div .field:odd").addClass("odd");
                                $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());
                                $("#dashboard-content .content div.historic table").width($("#dashboard-content .content").find(".form").width());

                                $(formbuild).find("div#textlabel_variable").html("$$e".render({
                                    e: data.name
                                }));
                                $(formbuild).find("div#textlabel_explanation").html("$$e".render({
                                    e: data.explanation
                                }));
                                $(formbuild).find("div#textlabel_period").html("$$e".render({
                                    e: variable_periods[data.period]
                                }));


                                $('#value').each(function(i, o) {
                                    setup_jStepper(o, data.type == 'num');
                                });

                                $("#dashboard-content .content .botao-form[ref='enviar']").click(function() {

                                    if ($(this).html() == "$$e".render({
                                            e: 'Adicionar'
                                        })) {
                                        var ajax_type = "POST";
                                        var api_method = "create";
                                        if ($("#dashboard-content .content").find("#region_id option:selected").val()) {
                                            var ajax_url = api_path + "/api/city/$$city/region/$$region/value".render2({
                                                city: getIdFromUrl(user_info.city),
                                                region: $("#dashboard-content .content").find("#region_id option:selected").val()
                                            });
                                        } else {
                                            var ajax_url = $.getUrlVar("url") + "/value";
                                        }
                                    } else if ($(this).html() == "$$e".render({
                                            e: 'Editar'
                                        })) {
                                        var ajax_type = "POST";
                                        var api_method = "update";
                                        if ($("#dashboard-content .content").find("#region_id option:selected").val()) {
                                            var ajax_url = api_path + "/api/city/$$city/region/$$region/value/$$id".render2({
                                                city: getIdFromUrl(user_info.city),
                                                region: $("#dashboard-content .content").find("#region_id option:selected").val(),
                                                id: $("table.history tbody tr.selected").attr("data-value-id")
                                            });
                                        } else {
                                            var ajax_url = $.getUrlVar("url") + "/value/" + $("table.history tbody tr.selected").attr("data-value-id");
                                        }
                                    }

                                    resetWarnings();
                                    if ($(this).parent().parent().find("#value").val() == "") {
                                        $(".form-aviso").setWarning({
                                            msg: "Por favor informe o Valor"
                                        });
                                    } else {
                                        var data_formatada = "";
                                        if (data.period == "yearly" || data.period == "monthly") {
                                            data_formatada = $(this).parent().parent().find("#value_of_date option:selected").val();
                                        } else if (data.period == "daily") {
                                            data_formatada = $.convertDate($(this).parent().parent().find("#value_of_date").val(), " ");
                                        }
                                        var prefix = "";
                                        if ($("#dashboard-content .content").find("#region_id option:selected").val()) {
                                            prefix = "region.";
                                        }

                                        var xvalor = $.convertNumberToBd($(this).parent().parent().find("#value").val());

                                        args = [{
                                            name: "api_key",
                                            value: $.cookie("key")
                                        }, {
                                            name: prefix + "variable.value." + api_method + ".value",
                                            value: xvalor
                                        }, {
                                            name: prefix + "variable.value." + api_method + ".value_of_date",
                                            value: data_formatada
                                        }];
                                        if ($("#dashboard-content .content").find("#region_id option:selected").val()) {
                                            args.push({
                                                name: prefix + "variable.value." + api_method + ".variable_id",
                                                value: getIdFromUrl($.getUrlVar("url"))
                                            });
                                        }

                                        $("#dashboard-content .content .botao-form[ref='enviar']").hide();
                                        $.ajax({
                                            type: ajax_type,
                                            dataType: 'json',
                                            url: ajax_url,
                                            data: args,
                                            success: function(data, textStatus, jqXHR) {
                                                resetWarnings();
                                                $("#aviso").setWarning({
                                                    msg: "Cadastro editado com sucesso.".render2({
                                                        codigo: jqXHR.status
                                                    })
                                                });
                                                $("#dashboard-content .content .botao-form[ref='enviar']").html("$$e".render({
                                                    e: 'Adicionar'
                                                }));
                                                $("#dashboard-content .content .botao-form[ref='cancelar']").html("$$e".render({
                                                    e: 'Voltar'
                                                }));
                                                $("#dashboard-content .content .form").find(".title").html("Adicionar Valor");
                                                $(formbuild).find("input#value").val("");
                                                $(formbuild).find("#value_of_date").val("");
                                                $("#dashboard-content .content .form").find("select").attr("disabled", false);
                                                $("table.history tbody tr").removeClass("selected");
                                                buildVariableHistory();
                                            },
                                            error: function(data) {
                                                $(".form-aviso").setWarning({
                                                    msg: "Erro ao editar. Talvez já exista valor para esse Período.".render2({
                                                        erro: $.trataErro(data)
                                                    })
                                                });
                                                alert(JSON.stringify(data));
                                                $("#dashboard-content .content .botao-form[ref='cancelar']").html("$$e".render({
                                                    e: 'Voltar'
                                                }));
                                            },
                                            complete: function(data) {
                                                $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                            }
                                        });
                                    }
                                });
                                $("#dashboard-content .content .botao-form[ref='cancelar']").click(function() {
                                    resetWarnings();
                                    if ($(this).html() == "$$e".render({
                                            e: 'Voltar'
                                        })) {
                                        history.back();
                                    } else if ($(this).html() == "Cancelar") {
                                        $("#dashboard-content .content .form").find(".title").html("Adicionar Valor");
                                        $("#dashboard-content .content .botao-form[ref='enviar']").html("$$e".render({
                                            e: 'Adicionar'
                                        }));
                                        $("#dashboard-content .content .botao-form[ref='cancelar']").html("$$e".render({
                                            e: 'Voltar'
                                        }));
                                        $(formbuild).find("input#value").val("");
                                        $(formbuild).find("input#value_of_date").val("");
                                        $("#dashboard-content .content .form").find("select").attr("disabled", false);
                                        $("table.history tbody tr").removeClass("selected");
                                        $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                    }
                                });
                            }

                            $("#dashboard-content .content").append("<div class='historico'></div>");

                            buildVariableHistory();
                        },
                        error: function(data) {
                            switch (data.status) {
                                case 400:
                                    $(".form-aviso").setWarning({
                                        msg: "Erro: ($$codigo)".render2({
                                            codigo: $.trataErro(data)
                                        })
                                    });
                                    break;
                            }
                        }
                    });
                }
            } else if (getUrlSub() == "myvariableedit") {
                /*  VARIABLE  */
                if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {

                    $("#dashboard-content .content").append("<div class='variable-filter'><div class='form-pesquisa'></div></div><div class='clear'></div>");

                    $("#dashboard-content .content .variable-filter .form-pesquisa").append("<div class='user'>$$u: <select id='region_id'></select></div>".render({
                        u: 'Região'
                    }));

                    var data_region = SUPER_CACHE_data_region;

                    $.ajax({
                        async: false,
                        type: 'GET',
                        dataType: 'json',
                        url: api_path + '/api/city/$$city/region?api_key=$$key'.render2({
                            key: $.cookie("key"),
                            city: getIdFromUrl(user_info.city)
                        }),
                        success: function(data, textStatus, jqXHR) {
                            data_region = data.regions;
                            SUPER_CACHE_data_region = data_region;
                        }
                    });


                    data_region.sort(function(a, b) {

                        a = a.upper_region + a.name,
                            b = b.upper_region + b.name;

                        return a.localeCompare(b);
                    });

                    $.each(data_region, function(index, item) {

                        $("#dashboard-content .content #region_id").append($("<option value='$$id'>$$nome</option>".render({
                            id: item.id,
                            nome: (item.depth_level == 3 ? '- ' : '') + item.name
                        })));


                    });




                    $("#dashboard-content .content .variable-filter .form-pesquisa").append("<div class='variable'>$$v: <select id='variable_id'></select></div>".render({
                        v: 'Variável'
                    }));

                    function carregaVariaveisEdit() {
                        $("#dashboard-content .content #variable_id option").remove();
                        $("#dashboard-content .content #variable_id").append($("<option value=''>$$t</option>".render({
                            t: 'Todas'
                        })));
                        $.loading();
                        $.ajax({
                            type: 'GET',
                            dataType: 'json',
                            url: api_path + '/api/variable?api_key=$$key'.render2({
                                key: $.cookie("key"),
                            }),
                            success: function(data, textStatus, jqXHR) {
                                data.variables.sort(function(a, b) {
                                    a = a.name,
                                        b = b.name;

                                    return a.localeCompare(b);
                                });
                                $.each(data.variables, function(index, item) {
                                    $("#dashboard-content .content #variable_id").append($("<option value='$$id'>$$nome</option>".render({
                                        id: item.id,
                                        nome: item.name
                                    })));
                                });
                                $.loading.hide();
                            }
                        });
                    }

                    $("#dashboard-content .content .variable-filter .form-pesquisa").append("<div class='data'>$$d <input id='data_ini'> $$ate <input id='data_fim'></div>".render({
                        d: 'de',
                        ate: 'até'
                    }));
                    $("#dashboard-content .content .variable-filter .form-pesquisa").append("<div class='botao'><input type='button' id='botao-pesquisar' value='$$e'></div><div class='clear'></div>".render({
                        e: 'Pesquisar'
                    }));

                    $("#dashboard-content .content .variable-filter #botao-pesquisar").click(function() {
                        carregaTabelaVariaveisEdit();
                    });

                    $("#dashboard-content .content .variable-filter input#data_ini").datepicker({
                        dateFormat: 'dd/mm/yy',
                        defaultDate: "-30",
                        changeYear: true,
                        changeMonth: true,
                        onSelect: function(selectedDate) {
                            $("#data_fim").datepicker("option", "minDate", $(this).datepicker("getDate"));
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
                    now.setDate(now.getDate() - (20 * 365));
                    $("#dashboard-content .content .variable-filter input#data_ini").datepicker("setDate", now);
                    $("#dashboard-content .content .variable-filter input#data_fim").datepicker("setDate", new Date());

                    $("#dashboard-content .content").append("<div class='resultado'></div>");

                    $("#dashboard-content .content").append("<div class='value_via_file'></div>");
                    var newform = [];
                    newform.push({
                        label: "Arquivo (XLSX, XLS ou CSV)",
                        input: ["file,arquivo,itext"]
                    });
                    var formbuild = $("#dashboard-content .content .value_via_file").append(buildForm(newform, "Importar valores"));
                    $(formbuild).find("div .field:odd").addClass("odd");
                    $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());
                    $("#dashboard-content .content .value_via_file .botao-form[ref='cancelar']").hide();

                    formbuild.find(".field:last").append("<div class='models center'></div>");
                    formbuild.find(".models").append('$$e: <a href="/variaveis_exemplo.csv?user_id=$$user&from_indicators=1">CSV</a> <a href="/variaveis_exemplo.xls?user_id=$$user&from_indicators=1">XLS</a><br />'.render({
                        e: 'Modelo de arquivo',
                        user: user_info.id
                    }));


                    if (user_info.regions_enabled) {
                        formbuild.find(".models").append('$$e: <a href="/dados/usuario/$$_user/regiao_exemplo.csv">CSV</a> <a href="/dados/usuario/$$_user/regiao_exemplo.xls">XLS</a><br />'.render({
                            _user: $.cookie("user.id"),
                            e: 'Modelo de arquivo para Regiões'
                        }));
                    }

                    $("#dashboard-content .content .value_via_file .botao-form[ref='enviar']").click(function() {

                        var clickedButton = $(this);

                        var file = "arquivo";
                        var form = $("#formFileUpload_" + file);

                        original_id = $('#arquivo_' + file).attr("original-id");

                        $('#arquivo_' + file).attr({
                            name: "arquivo",
                            id: "arquivo"
                        });

                        form.attr("action", api_path + '/api/variable/value_via_file?api_key=$$key&content-type=application/json'.render2({
                            key: $.cookie("key")
                        }));
                        form.attr("method", "post");
                        form.attr("enctype", "multipart/form-data");
                        form.attr("encoding", "multipart/form-data");
                        form.attr("target", "iframe_" + file);
                        form.attr("file", $('#arquivo').val());
                        form.submit();
                        $('#arquivo').attr({
                            name: original_id,
                            id: original_id
                        });

                        $("#iframe_" + file).load(function() {

                            var erro = 0;
                            if ($(this).contents()) {
                                if ($(this).contents()[0].body) {
                                    if ($(this).contents()[0].body.outerHTML) {
                                        var retorno = $(this).contents()[0].body.outerHTML;
                                        retorno = $(retorno).text();
                                        retorno = $.parseJSON(retorno);
                                    } else {
                                        erro = 1;
                                    }
                                } else {
                                    erro = 1;
                                }
                            } else {
                                erro = 1;
                            }

                            if (erro == 0) {
                                if (!retorno.error) {
                                    $(".value_via_file .form-aviso").setWarning({
                                        msg: "Arquivo enviado com sucesso<br/>" + retorno.status
                                    });
                                    $(clickedButton).html("Enviar");
                                    $(clickedButton).attr("is-disabled", 0);
                                } else {
                                    $(".value_via_file .form-aviso").setWarning({
                                        msg: "Erro ao enviar arquivo $$_file ($$err)".render2({
                                            err: retorno.error,
                                            _file: file
                                        })
                                    });
                                    $(clickedButton).html("Enviar");
                                    $(clickedButton).attr("is-disabled", 0);
                                    return;
                                }
                            } else {
                                $(".value_via_file .form-aviso").setWarning({
                                    msg: "Erro ao enviar arquivo $$file".render2({
                                        file: file
                                    })
                                });
                                $(clickedButton).html("Enviar");
                                $(clickedButton).attr("is-disabled", 0);
                                return;
                            }
                        });
                    });

                    $("#dashboard-content .content").append("<div class='value_via_file_rotate'></div>");
                    var newform = [];
                    newform.push({
                        label: "Arquivo Rotacionado (Apenas XLS)",
                        input: ["file,arquivo_rotate,itext"]
                    });
                    var formbuild = $("#dashboard-content .content .value_via_file_rotate").append(buildForm(newform, "Importar valores rotacionados"));
                    $(formbuild).find("div .field:odd").addClass("odd");
                    $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());
                    $("#dashboard-content .content .value_via_file_rotate .botao-form[ref='cancelar']").hide();



                    $("#dashboard-content .content .value_via_file_rotate .botao-form[ref='enviar']").click(function() {

                        var clickedButton = $(this);

                        var file = "arquivo_rotate";
                        var form = $("#formFileUpload_" + file);

                        original_id = $('#arquivo_' + file).attr("original-id");

                        $('#arquivo_' + file).attr({
                            name: "arquivo",
                            id: "arquivo"
                        });

                        form.attr("action", api_path + '/api/variable/value_via_file_rotate?api_key=$$key&content-type=application/json'.render2({
                            key: $.cookie("key")
                        }));
                        form.attr("method", "post");
                        form.attr("enctype", "multipart/form-data");
                        form.attr("encoding", "multipart/form-data");
                        form.attr("target", "iframe_" + file);
                        form.attr("file", $('#arquivo').val());
                        form.submit();
                        $('#arquivo').attr({
                            name: original_id,
                            id: original_id
                        });

                        $("#iframe_" + file).load(function() {

                            var erro = 0;
                            if ($(this).contents()) {
                                if ($(this).contents()[0].body) {
                                    if ($(this).contents()[0].body.outerHTML) {
                                        var retorno = $(this).contents()[0].body.outerHTML;
                                        retorno = $(retorno).text();
                                        retorno = $.parseJSON(retorno);
                                    } else {
                                        erro = 1;
                                    }
                                } else {
                                    erro = 1;
                                }
                            } else {
                                erro = 1;
                            }

                            if (erro == 0) {
                                if (!retorno.error) {
                                    $(".value_via_file_rotate .form-aviso").setWarning({
                                        msg: "Arquivo enviado com sucesso<br/>" + retorno.status
                                    });

                                    $(clickedButton).html("Enviar");
                                    $(clickedButton).attr("is-disabled", 0);
                                } else {
                                    $(".value_via_file_rotate .form-aviso").setWarning({
                                        msg: "Erro ao enviar arquivo $$_file ($$err)".render2({
                                            err: retorno.error,
                                            _file: file
                                        })
                                    });
                                    $(clickedButton).html("Enviar");
                                    $(clickedButton).attr("is-disabled", 0);
                                    return;
                                }
                            } else {
                                $(".value_via_file_rotate .form-aviso").setWarning({
                                    msg: "Erro ao enviar arquivo $$file".render2({
                                        file: file
                                    })
                                });
                                $(clickedButton).html("Enviar");
                                $(clickedButton).attr("is-disabled", 0);
                                return;
                            }
                        });
                    });




                    carregaVariaveisEdit();

                    function carregaTabelaVariaveisEdit() {

                        $("#dashboard-content .content .resultado").empty();

                        var variableList = buildDataTable({
                            headers: ["Nome", "Data", "Valor", "_"]
                        }, null, false);

                        $("#dashboard-content .content .resultado").append(variableList);

                        var data_ini = $("#dashboard-content .content .variable-filter input#data_ini").val().split("/");
                        var data_fim = $("#dashboard-content .content .variable-filter input#data_fim").val().split("/");

                        var variavel_id = "";
                        if ($("#dashboard-content .content .variable-filter .variable #variable_id option:selected").val() != "") {
                            variavel_id = "&variable_id=" + $("#dashboard-content .content .variable-filter .variable #variable_id option:selected").val();
                        }

                        $.ajax({
                            type: 'GET',
                            dataType: 'json',
                            url: api_path + '/api/user/$$userid/variable?api_key=$$key&region_id=$$region&valid_from_begin=$$data_ini&valid_from_end=$$data_fim$$variavel'.render2({
                                key: $.cookie("key"),
                                userid: 1,
                                region: $("#dashboard-content .content #region_id option:selected").val(),
                                data_ini: data_ini[2] + "-" + data_ini[1] + "-" + data_ini[0],
                                data_fim: data_fim[2] + "-" + data_fim[1] + "-" + data_fim[0],
                                variavel: variavel_id
                            }),
                            success: function(data, textStatus, jqXHR) {
                                $.each(data.variables, function(index, item) {
                                    if (item.values.length > 0) {
                                        $.each(item.values, function(index2, valor) {
                                            var data_formatada;
                                            if (item.period == "yearly") {
                                                data_formatada = $.format.date(valor.value_of_date, "yyyy");
                                            } else {
                                                data_formatada = $.convertDate(valor.value_of_date, " ");
                                            }

                                            $("#dashboard-content .content #results tbody").append(
                                                $("<tr><td>$$nome</td><td data='$$_date_of_value'>$$_data</td><td data-region=$$region>$$_valor</td><td>$$_url</td></tr>".render({
                                                    nome: item.name,
                                                    _data: data_formatada,
                                                    region: valor.region_id,
                                                    _date_of_value: valor.value_of_date,
                                                    _valor: valor.value,
                                                    _url: item.variable_id
                                                })));
                                        });
                                    }
                                });

                                $("#results").dataTable({
                                    iDisplayLength: 50,
                                    "oLanguage": get_datatable_lang(),
                                    "aoColumnDefs": [{
                                        "bSearchable": false,
                                        "bSortable": false,
                                        "sClass": "botoes",
                                        "sWidth": "10px",
                                        "aTargets": [3]
                                    }, {
                                        "bSearchable": false,
                                        "bSortable": false,
                                        "sClass": "input",
                                        "aTargets": [2]
                                    }, {
                                        "bSearchable": false,
                                        "bSortable": false,
                                        "sClass": "data center",
                                        "aTargets": [1]
                                    }, {
                                        "sClass": "center",
                                        "aTargets": [2]
                                    }, ],
                                    "aaSorting": [
                                        [0, "asc"],
                                        [1, "desc"]
                                    ],
                                    "fnDrawCallback": function() {
                                        $("#results td.botoes").each(function() {
                                            if ($(this).find("a").length <= 0) {
                                                var url = $(this).html();
                                                $(this).html("<a href='#' url='$$url' class='icone edit save' title='Salvar Valor' alt='editar'>Salvar valor</a>".render({
                                                    url: url
                                                }));
                                            }
                                        });
                                        $("#results td.input").each(function() {
                                            if ($(this).find("input").length <= 0) {
                                                if ($(this).find("a").length <= 0) {

                                                    $(this).html("<input type='text' class='input' width='10' value='$$valor'>".render2({
                                                        valor: $(this).html()
                                                    }));
                                                }
                                            }
                                        });
                                    }
                                });

                                $("#results td.botoes a.save").die('click');
                                $("#results td.botoes a.save").live('click', function(e) {
                                    e.preventDefault();
                                    var valor = $(this).parent().parent().find("td.input input.input").val();
                                    var url = $(this).attr("url");
                                    var regionid = $(this).parents('tr:first').find("[data-region]").attr('data-region');

                                    var data = $(this).parent().parent().find("td.data").attr("data");

                                    args = [{
                                        name: "api_key",
                                        value: $.cookie("key")
                                    }, {
                                        name: "region.variable.value.put.variable_id",
                                        value: url
                                    }, {
                                        name: "region.variable.value.put.value",
                                        value: valor
                                    }, {
                                        name: "region.variable.value.put.value_of_date",
                                        value: data
                                    }];

                                    $.ajax({
                                        async: false,
                                        type: 'PUT',
                                        dataType: 'json',
                                        url: '/api/city/1/region/' + regionid + '/value',
                                        data: args,
                                        success: function(data, status, jqXHR) {
                                            $("#aviso").setWarning({
                                                msg: "Registro atualizado com sucesso.".render2({
                                                    codigo: jqXHR.status
                                                })
                                            });
                                        },
                                        error: function(data) {
                                            switch (data.status) {
                                                case 400:
                                                    $("#aviso").setWarning({
                                                        msg: "Erro ao atualizar. ($$codigo)".render2({
                                                            codigo: $.trataErro(data)
                                                        })
                                                    });
                                                    break;
                                            }
                                        }
                                    });

                                });

                            },
                            error: function(data) {
                                $("#aviso").setWarning({
                                    msg: "Erro ao carregar ($$codigo)".render2({
                                        codigo: $.trataErro(data)
                                    })
                                });
                            }
                        });
                    }
                }
            } else if (getUrlSub() == "myvariableclone") {
                /*  VARIABLE CLONE */
                if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {

                    var periods = [];

                    function selectVariables() {

                        $("#dashboard-content .content #steps-variables").empty();
                        $("#dashboard-content .content #steps-variables").show();
                        $("#dashboard-content .content #steps-years").empty();
                        var variablesList = "<div class='variables-clone'><div class='left'><div class='title'>Selecione as variáveis que você deseja importar</div><div id='variables-list'><div class='variables'></div></div></div><div class='right'><div class='title'>Variáveis selecionadas:</div><div id='variables-selected'><div class='variables'></div></div></div></div>";
                        $("#dashboard-content .content #steps-variables").append(variablesList);

                        $.ajax({
                            type: 'GET',
                            dataType: 'json',
                            url: api_path + '/api/variable?api_key=$$key'.render2({
                                key: $.cookie("key")
                            }),
                            success: function(data, textStatus, jqXHR) {
                                // ordena variaveis pelo nome
                                data.variables.sort(function(a, b) {
                                    a = a.name,
                                        b = b.name;

                                    return a.localeCompare(b);
                                });

                                $.each(data.variables, function(index, value) {
                                    $("#variables-list .variables").append("<div class='item' var-id='$$id'><div class='label'>$$label</div><div class='button' title='Adicionar'>&#155;</div></div>".render({
                                        id: data.variables[index].id,
                                        label: data.variables[index].name
                                    }));
                                    $("#variables-selected .variables").append("<div class='item' var-id='$$id'><div class='button' title='Remover'>&#139;</div><div class='label'>$$label</div></div>".render({
                                        id: data.variables[index].id,
                                        label: data.variables[index].name
                                    }));
                                });

                                $("#variables-list .item").hover(function() {
                                    $("#variables-list").find(".button").hide();
                                    $(this).find(".button").fadeIn("fast");
                                }, function() {
                                    $(this).find(".button").hide();
                                });

                                $("#variables-selected .item").hover(function() {
                                    $("#variables-selected").find(".button").hide();
                                    $(this).find(".button").fadeIn("fast");
                                }, function() {
                                    $(this).find(".button").hide();
                                });

                                $("#variables-list .item .button").bind('click', function() {
                                    var id = $(this).parent().attr("var-id");
                                    $(this).parent().toggle();
                                    $("#variables-selected .item[var-id=" + id + "]").toggle();
                                    $("#botao-avancar").removeClass("disabled");
                                });
                                $("#variables-selected .item .button").bind('click', function() {
                                    var id = $(this).parent().attr("var-id");
                                    $(this).parent().toggle();
                                    $("#variables-list .item[var-id=" + id + "]").toggle();
                                    if ($("#variables-selected .item:visible").length <= 0) {
                                        $("#botao-avancar").addClass("disabled");
                                    }
                                });

                                $("#dashboard-content .content #steps-buttons").empty();
                                $("#dashboard-content .content #steps-buttons").append("<button class='button-default disabled' id='botao-avancar'>Avançar</button>");

                                $("#botao-avancar").unbind();
                                $("#botao-avancar").html("Avançar");
                                $("#botao-avancar").bind('click', function() {
                                    selectInstitute();
                                });


                            },
                            error: function(data) {
                                $("#aviso").setWarning({
                                    msg: "Erro ao carregar ($$codigo)".render2({
                                        codigo: $.trataErro(data)
                                    })
                                });
                            }
                        });
                    }

                    function selectInstitute() {

                        $.ajax({
                            type: 'GET',
                            dataType: 'json',
                            url: api_path + '/api/institute?api_key=$$key'.render2({
                                key: $.cookie("key")
                            }),
                            success: function(data, textStatus, jqXHR) {
                                var institute_id;
                                $.each(data.institute, function(index, item) {
                                    if (item.id != user_info.institute.id) {
                                        institute_id = item.id;
                                    }
                                });

                                if (institute_id) {
                                    selectYears(institute_id);
                                }
                            }
                        });
                    }

                    function selectYears(institute_id) {

                        $("#steps-variables").fadeOut("fast", function() {
                            $("#steps-years").fadeIn();
                        });

                        var yearsList = "<div class='years-clone'></div>";
                        $("#dashboard-content .content #steps-years").append("<div class='clear'>$$a:</div>".render({
                            a: 'Selecione os períodos que você deseja clonar'
                        }));
                        $("#dashboard-content .content #steps-years").append(yearsList);

                        var variables = "";
                        $("#variables-selected .item:visible").each(function(index, item) {
                            if (variables != "") variables += ",";
                            variables += $(this).attr("var-id");
                        });

                        $.ajax({
                            type: 'GET',
                            dataType: 'json',
                            url: api_path + '/api/user/$$user/clone_variable?variables=$$variables&institute_id=$$institute&api_key=$$key'.render2({
                                key: $.cookie("key"),
                                institute: institute_id,
                                variables: variables,
                                user: $.cookie("user.id")
                            }),
                            success: function(data, textStatus, jqXHR) {
                                var headers = ["Variáveis"];
                                var year_cols = [];
                                periods = [];
                                if (data.periods) {
                                    $.each(data.periods, function(index, item) {
                                        headers.push(item.split("-")[0]);
                                        periods.push(item);
                                        year_cols.push(index + 1);
                                    });
                                }
                                var yearsList = buildDataTable({
                                    headers: headers
                                }, null, false);
                                var variables_names = [];
                                if (data.variables_names) {
                                    $.each(data.variables_names, function(variable_id, variable_name) {
                                        var years = [];
                                        $.each(data.periods, function(index, year) {
                                            if (typeof data.checkbox[variable_id] != "undefined" && typeof data.checkbox[variable_id][year] != "undefined") {
                                                years.push({
                                                    "exists": 1,
                                                    "checked": data.checkbox[variable_id][year]
                                                });
                                            } else {
                                                years.push({
                                                    "exists": 0,
                                                    "checked": false
                                                });
                                            }
                                        });
                                        variables_names.push({
                                            "id": variable_id,
                                            "name": variable_name,
                                            "years": years
                                        });
                                    });
                                    variables_names.sort(function(a, b) {
                                        a = String(a.name),
                                            b = String(b.name);
                                        return a.localeCompare(b);
                                    });
                                }

                                $("#dashboard-content .content #steps-years #variables-years").remove();
                                $("#dashboard-content .content #steps-years").append("<div id='variables-years'></div>");
                                $("#dashboard-content .content #steps-years #variables-years").append(yearsList);

                                var rows = "";

                                $.each(variables_names, function(index, item) {
                                    rows += "<tr><td>" + item.name + "</td>";
                                    $.each(item.years, function(i, e) {
                                        if (e.exists == 1) {
                                            rows += "<td><input type='checkbox' id='chk$$item_$$index' class='chk-year year-$$index' $$checked></td>".render2({
                                                item: item.id,
                                                index: i,
                                                checked: (e.checked) ? "checked" : ""
                                            });
                                        } else {
                                            rows += "<td></td>";
                                        }
                                    });
                                    rows += "</tr>";
                                });
                                $("#results tbody").append(rows);
                                $("#results").addClass("ex_highlight");
                                $("#results").addClass("ex_highlight_row");

                                $("#results thead tr th").each(function(index, item) {
                                    if (index > 0) {
                                        $(this).prepend("<input type='checkbox' class='chk-all' value='$$index'>".render({
                                            index: (index - 1)
                                        }));
                                    }
                                });

                                oTable = $("#results").dataTable({
                                    iDisplayLength: 50,
                                    "oLanguage": get_datatable_lang(),
                                    "aoColumnDefs": [{
                                        "bSortable": false,
                                        "sClass": "indexLeft",
                                        "aTargets": [0]
                                    }, {
                                        "bSearchable": false,
                                        "bSortable": false,
                                        "sClass": "center check",
                                        "sWidth": "60px",
                                        "aTargets": year_cols
                                    }, ],
                                    "sScrollX": "100%",
                                    "sScrollXInner": "900px",
                                    "fnInitComplete": function() {
                                        new FixedColumns(this, {
                                            "iLeftWidth": 350
                                        });
                                    }
                                });

                                $("input.chk-all").bind('click', function(index, item) {
                                    var checked = ($(this).attr("checked")) ? true : false;
                                    var year_index = $(this).attr("value");
                                    var filteredRows = oTable.$('tr', {
                                        "filter": "applied"
                                    });
                                    $(filteredRows).each(function(index, row) {
                                        $(row).find("td input.year-" + year_index).attr("checked", checked);
                                    });
                                });

                                $("#botao-avancar").unbind();
                                $("#botao-avancar").html("Concluir");
                                $("#botao-avancar").bind('click', function() {
                                    $.loading();
                                    finishClone({
                                        "periods": periods,
                                        "variables_names": variables_names,
                                        "institute_id": institute_id
                                    });
                                });
                                if ($("#steps-buttons #botao-cancelar").length <= 0) {
                                    $("#dashboard-content .content #steps-buttons").append("<button class='button-default' id='botao-cancelar'>Cancelar</button>");
                                }
                                $("#botao-cancelar").bind('click', function() {
                                    $("#steps-years").fadeOut("fast", function() {
                                        $("#steps-years").empty();
                                        $("#steps-variables").fadeIn();
                                        $("#botao-avancar").unbind();
                                        $("#botao-avancar").html("Avançar");
                                        $("#botao-avancar").bind('click', function() {
                                            selectInstitute();
                                        });
                                    });
                                });

                            }
                        });
                    }

                    function finishClone(params) {

                        $("#steps-years").hide();

                        var method = "POST";
                        var url_action = api_path + "/api/user/$$user/clone_variable".render2({
                            user: $.cookie("user.id")
                        });

                        args = [{
                            name: "api_key",
                            value: $.cookie("key")
                        }, {
                            name: "institute_id",
                            value: params.institute_id
                        }];

                        if (params.periods) {
                            $.each(params.periods, function(index, item) {
                                args.push({
                                    name: "period" + index,
                                    value: item
                                });
                            });
                        }

                        var filteredRows = oTable.$('tr', {
                            "filter": "applied"
                        });
                        $(filteredRows).each(function(index, row) {
                            $(row).find("td input.chk-year").each(function(index, item) {
                                if ($(this).attr("checked")) {
                                    args.push({
                                        name: "variable:" + $(this).attr("id").replace("chk", ""),
                                        value: 1
                                    });
                                }
                            });
                        });

                        $.ajax({
                            type: method,
                            dataType: 'json',
                            url: url_action,
                            data: args,
                            success: function(data, status, jqXHR) {
                                var mensagem = "";
                                if (data && (data.number_of_clones)) {
                                    mensagem = "<br />Total de itens clonados: " + data.number_of_clones;
                                }
                                $("#aviso").setWarning({
                                    msg: "Operação efetuada com sucesso." + mensagem
                                });
                                $("#botao-avancar").unbind();
                                $("#botao-avancar").html("$$e".render({
                                    e: 'Voltar'
                                }));
                                $("#botao-avancar").bind('click', function() {
                                    resetWarnings();
                                    selectVariables();
                                });
                                $("#botao-cancelar").hide();
                                $.loading.hide();
                            },
                            error: function(data) {
                                $("#aviso").setWarning({
                                    msg: "Erro ao enviar. ($$codigo)".render2({
                                        codigo: $.trataErro(data)
                                    })
                                });
                                $("#steps-years").fadeIn();
                                $.loading.hide();

                            }
                        });

                    }

                    var stepsLayers = "<div id='steps-variables'></div><div id='steps-years'></div><div id='steps-finish'></div><div id='steps-buttons'></div>";
                    $("#dashboard-content .content").append(stepsLayers);

                    selectVariables();

                }
            } else if (getUrlSub() == "axis") {
                /*  EIXOS  */
                if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {

                    var axisList = buildDataTable({
                        headers: ["Nome", "_"]
                    });

                    $("#dashboard-content .content").append(axisList);

                    $("#button-add").click(function() {
                        resetWarnings();
                        location.hash = "#!/" + getUrlSub() + "?option=add";
                    });

                    $("#results").dataTable({
                        iDisplayLength: 50,
                        "oLanguage": get_datatable_lang(),
                        "bProcessing": true,
                        "sAjaxSource": api_path + '/api/axis?api_key=$$key&content-type=application/json&lang=$$lang&columns=name,url,_,_'.render2({
                            lang: cur_lang,
                            key: $.cookie("key")
                        }),
                        "aoColumnDefs": [{
                            "bSearchable": false,
                            "bSortable": false,
                            "sClass": "botoes",
                            "sWidth": "60px",
                            "aTargets": [1]
                        }],
                        "fnDrawCallback": function() {
                            DTdesenhaBotoes();
                        }
                    });

                } else if ($.getUrlVar("option") == "add" || $.getUrlVar("option") == "edit") {

                    var txtOption = ($.getUrlVar("option") == "add") ? "$$e".render({
                        e: 'Cadastrar'
                    }) : "$$e".render({
                        e: 'Editar'
                    });

                    var newform = [];

                    newform.push({
                        label: "Nome",
                        input: ["text,name,itext"]
                    });

                    var formbuild = $("#dashboard-content .content").append(buildForm(newform, txtOption));
                    $(formbuild).find("div .field:odd").addClass("odd");
                    $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

                    $(formbuild).find("#name").qtip($.extend(true, {}, qtip_input, {
                        content: "Nome do eixo. Ex: Ação Local para Saúde, Bens Naturais Comuns"
                    }));

                    if ($.getUrlVar("option") == "edit") {
                        $.ajax({
                            type: 'GET',
                            dataType: 'json',
                            url: $.getUrlVar("url") + "?api_key=$$key".render2({
                                key: $.cookie("key")
                            }),
                            success: function(data, status, jqXHR) {
                                switch (jqXHR.status) {
                                    case 200:
                                        $(formbuild).find("input#name").val(data.name);
                                        break;
                                }
                            },
                            error: function(data) {
                                switch (data.status) {
                                    case 400:
                                        $(".form-aviso").setWarning({
                                            msg: "Erro: ($$codigo)".render2({
                                                codigo: $.trataErro(data)
                                            })
                                        });
                                        break;
                                }
                            }
                        });
                    }

                    $("#dashboard-content .content .botao-form[ref='enviar']").click(function() {
                        resetWarnings();
                        if ($(this).parent().parent().find("#name").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe o Nome"
                            });
                        } else {

                            if ($.getUrlVar("option") == "add") {
                                var action = "create";
                                var method = "POST";
                                var url_action = api_path + "/api/axis";
                            } else {
                                var action = "update";
                                var method = "POST";
                                var url_action = $.getUrlVar("url");
                            }

                            args = [{
                                name: "api_key",
                                value: $.cookie("key")
                            }, {
                                name: "axis." + action + ".name",
                                value: $(this).parent().parent().find("#name").val()
                            }];

                            $("#dashboard-content .content .botao-form[ref='enviar']").hide();
                            $.ajax({
                                type: method,
                                dataType: 'json',
                                url: url_action,
                                data: args,
                                success: function(data, status, jqXHR) {
                                    $("#aviso").setWarning({
                                        msg: "Cadastro efetuado com sucesso.".render2({
                                            codigo: jqXHR.status
                                        })
                                    });
                                    location.hash = "#!/" + getUrlSub();
                                },
                                error: function(data) {
                                    switch (data.status) {
                                        case 400:
                                            $("#aviso").setWarning({
                                                msg: "Erro ao cadastrar. ($$codigo)".render2({
                                                    codigo: $.trataErro(data)
                                                })
                                            });
                                            break;
                                    }
                                    $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                }
                            });
                        }
                    });
                    $("#dashboard-content .content .botao-form[ref='cancelar']").click(function() {
                        resetWarnings();
                        history.back();
                    });
                } else if ($.getUrlVar("option") == "delete") {
                    deleteRegister({
                        url: $.getUrlVar("url") + "?api_key=$$key".render2({
                            key: $.cookie("key")
                        })
                    });
                }
            } else if (getUrlSub() == "indicator") {
                /*  INDICATOR  */
                if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {

                    var indicatorList = buildDataTable({
                        headers: ["Nome", "Formula", "Data Criação", "_"]
                    });

                    $("#dashboard-content .content").append(indicatorList);

                    $("#button-add").click(function() {
                        resetWarnings();
                        location.hash = "#!/" + getUrlSub() + "?option=add";
                    });

                    var data_variables = [];
                    $.ajax({
                        async: false,
                        type: 'GET',
                        dataType: 'json',
                        url: api_path + '/api/variable?api_key=$$key'.render2({
                            key: $.cookie("key"),
                            userid: $.cookie("user.id")
                        }),
                        success: function(data, textStatus, jqXHR) {

                            $.each(data.variables, function(index, value) {
                                data_variables.push({
                                    "id": data.variables[index].id,
                                    "name": data.variables[index].name
                                });
                            });
                        }

                    });

                    var data_vvariables = [];
                    $.ajax({
                        async: false,
                        type: 'GET',
                        dataType: 'json',
                        url: api_path + '/api/indicator/variable?api_key=$$key&all_variables=1'.render2({
                            key: $.cookie("key"),
                            userid: $.cookie("user.id")
                        }),
                        success: function(data, textStatus, jqXHR) {

                            $.each(data.variables, function(index, value) {
                                data_vvariables.push({
                                    "id": data.variables[index].id,
                                    "name": data.variables[index].name
                                });
                            });
                        }

                    });

                    $("#results").dataTable({
                        iDisplayLength: 50,
                        "oLanguage": get_datatable_lang(),
                        "bProcessing": true,
                        "sAjaxSource": api_path + '/api/indicator?use=edit&api_key=$$key&content-type=application/json&lang=$$lang&columns=name,formula,created_at,url,_,_'.render2({
                            lang: cur_lang,
                            key: $.cookie("key")
                        }),
                        "aoColumnDefs": [{
                            "bSearchable": false,
                            "bSortable": false,
                            "sClass": "botoes",
                            "sWidth": "60px",
                            "aTargets": [3]
                        }, {
                            "sWidth": "140px",
                            "sClass": "center",
                            "aTargets": [2]
                        }, {
                            "sClass": "formula",
                            "aTargets": [1]
                        }, {
                            "fnRender": function(oObj, sVal) {
                                return $.format.date(sVal, "dd/MM/yyyy HH:mm:ss");
                            },
                            "aTargets": [2]
                        }, {
                            "fnRender": function(oObj, sVal) {
                                return "$$x".render({
                                    x: formataFormula(sVal, data_variables, data_vvariables)
                                });
                            },
                            "aTargets": [1]
                        }, ],
                        "aaSorting": [
                            [2, "desc"],
                            [0, "asc"]
                        ],
                        "fnDrawCallback": function() {
                            DTdesenhaBotoes();
                        }
                    });

                } else if ($.getUrlVar("option") == "add" || $.getUrlVar("option") == "edit") {

                    var txtOption = ($.getUrlVar("option") == "add") ? "$$e".render({
                        e: 'Cadastrar'
                    }) : "$$e".render({
                        e: 'Editar'
                    });

                    var newform = [];

                    newform.push({
                        label: "Nome",
                        input: ["text,name,itext"]
                    });

                    if (user_info.user_type != 'user') {
                        newform.push({
                            label: "",
                            input: ["select,visibility_level,iselect"]
                        });
                    }

                    newform.push({
                        label: "Nome da Faixa",
                        input: ["text,variety_name,itext"]
                    });
                    newform.push({
                        label: "Faixas",
                        input: ["text,variacoes_placeholder,itext"]
                    });
                    newform.push({
                        label: "Variáveis da Faixa",
                        input: ["text,vvariacoes_placeholder,itext"]
                    });
                    newform.push({
                        label: "Todas as variáveis são obrigatórias",
                        input: ["checkbox,all_variations_variables_are_required,icheckbox"]
                    });
                    newform.push({
                        label: "Formula",
                        extra_label: "<br /><a href='javascript: void(0);' id='help-formula'>ajuda</a>",
                        input: ["textarea,formula,itext"]
                    });
                    newform.push({
                        label: "Descrição da formula",
                        input: ["textarea,explanation,itext"]
                    });
                    newform.push({
                        label: "Nossa leitura",
                        input: ["textarea,observations,itext"]
                    });
                    newform.push({
                        label: "Direção de classificação",
                        input: ["select,sort_direction,iselect"]
                    });
                    newform.push({
                        label: "Método de composição",
                        input: ["select,summarization_method,iselect"]
                    });
                    newform.push({
                        label: "Fonte",
                        input: ["select,source,iselect source", "text,source_new,itext300px"]
                    });
                    newform.push({
                        label: "Campo texto reservado",
                        input: ["textarea,goal_explanation,itext"]
                    });

                    var formbuild = $("#dashboard-content .content").append(buildForm(newform, txtOption));
                    $(formbuild).find("div .field:odd").addClass("odd");
                    $(formbuild).find(".form").width(890);
                    $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

                    setNewSource($("#dashboard-content .content select#goal_source"), $("#dashboard-content .content input#goal_source_new"));
                    setNewSource($("#dashboard-content .content select#source"), $("#dashboard-content .content input#source_new"));

                    $(formbuild).find("#name").qtip($.extend(true, {}, qtip_input, {
                        content: "Nome do Indicador"
                    }));
                    $(formbuild).find("a#help-formula").qtip($.extend(true, {}, qtip_editor, {
                        content: "Crie a fórmula selecionando as variáveis ao lado e os botões de operações abaixo.<br />Para excluir um parâmetro adicionado, clique sobre o mesmo e depois aperte Delete no seu teclado."
                    }));
                    $("#formula-editor .button").qtip($.extend(true, {}, qtip_editor, {
                        content: "Adiciona a Variável/Valor na fórmula."
                    }));
                    $("input#formula-input").qtip($.extend(true, {}, qtip_editor, {
                        content: "Utilize esse campo para inserir valores manualmente."
                    }));
                    $(formbuild).find("#tags").qtip($.extend(true, {}, qtip_input, {
                        content: "Tags separadas por vírgula"
                    }));

                    loadSources();

                    //loadComboSources(sources, $("#dashboard-content .content select#goal_source"), $("#dashboard-content .content input#goal_source_new"));
                    loadComboSources(sources, $("#dashboard-content .content select#source"), $("#dashboard-content .content input#source_new"));

                    $("#summarization_method").append($("<option selected>Somátorio</option>").val('sum'));
                    $("#summarization_method").append($("<option>Média</option>").val('avg'));

                    $.each(visibility_level, function(key, value) {
                        $("#dashboard-content .content select#visibility_level").append($("<option></option>").val(key).html(value));
                    });

                    //$.each(indicator_types, function(key, value) {
                    //    $("#dashboard-content .content select#indicator_type").append($("<option></option>").val(key).html(value));
                    //});

                    $.each(goal_operators, function(key, value) {
                        $("#dashboard-content .content select#goal_operator").append($("<option></option>").val(key).html(value));
                    });

                    $.each(sort_directions, function(key, value) {
                        $("#dashboard-content .content select#sort_direction").append($("<option></option>").val(key).html(value));
                    });

                    visibilityChanged();

                    function visibilityChanged(args) {
                        if ($("#visibility_level").val() == "public" || $("#visiblity_level").val() == "private" && user_info.roles[0] == "admin") {
                            $("#visibility-options").remove();
                        } else {
                            $("#visibility-options").remove();
                            $("#visibility_level").after("<div id='visibility-options'></div>");
                            if ($("#visibility_level").val() == "private") {
                                $("#visibility-options").append("<label class='visibility'>Selecione um usuário:</label><select id='visibility_user_id' class='iselect'><option value=''>carregando...</option></select>");
                                $.ajax({
                                    type: 'GET',
                                    dataType: 'json',
                                    url: api_path + '/api/user?role=admin&api_key=$$key'.render2({
                                        key: $.cookie("key")
                                    }),
                                    success: function(data, textStatus, jqXHR) {
                                        data.users.sort(function(a, b) {
                                            a = a.name,
                                                b = b.name;
                                            return a.localeCompare(b);
                                        });
                                        $("#dashboard-content .content #visibility_user_id option").remove();
                                        $.each(data.users, function(index, item) {
                                            $("#dashboard-content .content #visibility_user_id").append($("<option value='$$id'>$$nome</option>".render({
                                                id: getIdFromUrl(item.url),
                                                nome: item.name
                                            })));
                                        });
                                        if (args) args.callBack();
                                    }
                                });
                            } else if ($("#visibility_level").val() == "country") {
                                $("#visibility-options").append("<label class='visibility'>Selecione um país:</label><select id='visibility_country_id' class='iselect'><option value=''>carregando...</option></select>");
                                $.ajax({
                                    type: 'GET',
                                    dataType: 'json',
                                    url: api_path + "/api/country?api_key=$$key".render2({
                                        key: $.cookie("key")
                                    }),
                                    success: function(data, textStatus, jqXHR) {
                                        data.countries.sort(function(a, b) {
                                            a = a.name,
                                                b = b.name;
                                            return a.localeCompare(b);
                                        });
                                        $("#dashboard-content .content #visibility_country_id option").remove();
                                        $.each(data.countries, function(index, item) {
                                            $("#dashboard-content .content #visibility_country_id").append($("<option value='$$id'>$$nome</option>".render({
                                                id: getIdFromUrl(item.url),
                                                nome: item.name
                                            })));
                                        });
                                        if (args) args.callBack();
                                    }
                                });
                            } else if ($("#visibility_level").val() == "network") {
                                $("#visibility-options").before("<div class='clear'></div>");
                                $("#visibility-options").addClass("inline");
                                $("#visibility-options").append("<label class='visibility'>Selecione uma ação:</label><br /><select multiple id='visibility_networks_select' class='iselect multiselect'><option value=''>carregando...</option></select><div class='buttons'><button id='button-add'>>></button><button id='button-remove'><<</button></div><select multiple id='visibility_networks_id' class='iselect multiselect'></select>");
                                $.ajax({
                                    type: 'GET',
                                    dataType: 'json',
                                    url: api_path + '/api/network?api_key=$$key'.render2({
                                        key: $.cookie("key")
                                    }),
                                    success: function(data, textStatus, jqXHR) {
                                        data.network.sort(function(a, b) {
                                            a = a.name,
                                                b = b.name;
                                            return a.localeCompare(b);
                                        });
                                        $("#dashboard-content .content #visibility_networks_select option").remove();
                                        $.each(data.network, function(index, item) {
                                            $("#dashboard-content .content #visibility_networks_select").append($("<option value='$$id'>$$nome</option>".render2({
                                                id: getIdFromUrl(item.url),
                                                nome: item.name
                                            })));
                                        });
                                        $("#visibility-options #button-add").click(function() {
                                            if ($("#visibility_networks_select option:selected").length > 0) {
                                                $("#visibility_networks_select option:selected").appendTo("#visibility_networks_id");
                                                sortSelectBox("#visibility_networks_id");
                                            }
                                        });
                                        $("#visibility-options #button-remove").click(function() {
                                            if ($("#visibility_networks_id option:selected").length > 0) {
                                                $("#visibility_networks_id option:selected").appendTo("#visibility_networks_select");
                                                sortSelectBox("#visibility_networks_select");
                                            }
                                        });
                                        if (args) args.callBack();
                                    }
                                });
                            } else if ($("#visibility_level").val() == "restrict") {
                                $("#visibility-options").before("<div class='clear'></div>");
                                $("#visibility-options").addClass("inline");
                                $("#visibility-options").append("<label class='visibility'>Selecione um ou mais usuários:</label><br /><select multiple id='visibility_users_select' class='iselect multiselect'><option value=''>carregando...</option></select><div class='buttons'><button id='button-add'>>></button><button id='button-remove'><<</button></div><select multiple id='visibility_users_id' class='iselect multiselect'></select>");
                                $.ajax({
                                    type: 'GET',
                                    dataType: 'json',
                                    url: api_path + '/api/user?role=admin&api_key=$$key'.render2({
                                        key: $.cookie("key")
                                    }),
                                    success: function(data, textStatus, jqXHR) {
                                        data.users.sort(function(a, b) {
                                            a = a.name,
                                                b = b.name;
                                            return a.localeCompare(b);
                                        });
                                        $("#dashboard-content .content #visibility_users_select option").remove();
                                        $.each(data.users, function(index, item) {
                                            $("#dashboard-content .content #visibility_users_select").append($("<option value='$$id'>$$nome</option>".render2({
                                                id: getIdFromUrl(item.url),
                                                nome: item.name
                                            })));
                                        });
                                        $("#visibility-options #button-add").click(function() {
                                            if ($("#visibility_users_select option:selected").length > 0) {
                                                $("#visibility_users_select option:selected").appendTo("#visibility_users_id");
                                                sortSelectBox("#visibility_users_id");
                                            }
                                        });
                                        $("#visibility-options #button-remove").click(function() {
                                            if ($("#visibility_users_id option:selected").length > 0) {
                                                $("#visibility_users_id option:selected").appendTo("#visibility_users_select");
                                                sortSelectBox("#visibility_users_select");
                                            }
                                        });
                                        if (args) args.callBack();
                                    }
                                });
                            }
                        }

                        setTimeout(function() {
                            $("#visibility_level").remove()
                        }, 0);
                    }

                    $("#dashboard-content .content textarea#formula").after("<div id='formula-editor'><div class='editor'><div class='editor-content'></div></div><div class='button'><<</div><div class='variables-title'>Variáveis</div><div class='variables'></div><div class='user-input'></div><div class='operators'></div></div>");
                    $("#formula-editor .user-input").append("<input type='text' id='formula-input' placeholder='valor'>");
                    $("#formula-editor .operators").append("<div class='op-button' val='$$value' title='$$title'>$$caption</div>".render2({
                        value: "+",
                        caption: "+",
                        title: "Soma"
                    }));
                    $("#formula-editor .operators").append("<div class='op-button' val='$$value' title='$$title'>$$caption</div>".render2({
                        value: "-",
                        caption: "-",
                        title: "Subtração"
                    }));
                    $("#formula-editor .operators").append("<div class='op-button' val='$$value' title='$$title'>$$caption</div>".render2({
                        value: "/",
                        caption: "÷",
                        title: "Divisão"
                    }));
                    $("#formula-editor .operators").append("<div class='op-button' val='$$value' title='$$title'>$$caption</div>".render2({
                        value: "*",
                        caption: "×",
                        title: "Multiplicação"
                    }));
                    $("#formula-editor .operators").append("<div class='op-button' val='$$value' title='$$title''>$$caption</div>".render2({
                        value: "(",
                        caption: "(",
                        title: "Abre Parenteses"
                    }));
                    $("#formula-editor .operators").append("<div class='op-button' val='$$value' title='$$title'>$$caption</div>".render2({
                        value: ")",
                        caption: ")",
                        title: "Fecha Parenteses"
                    }));
                    $("#formula-editor .operators").append("<div class='op-button' val='$$value' title='$$title'>$$caption</div>".render2({
                        value: "CONCATENAR",
                        caption: "[ ]",
                        title: "Concatenar"
                    }));
                    $("#formula-editor .operators").append("<div class='reset-button' val='erase' title='apagar tudo'>apagar tudo</div>");
                    $("#dashboard-content .content textarea#formula").hide();

                    $("html").click(function(e) {
                        click_editor = false;
                    });
                    $("html").keydown(function(e) {
                        if (click_editor) {
                            if (e.which == 46) { //TECLA DEL
                                $("#formula-editor .editor-content .selected").remove();
                            } else if (e.which == 8) { //TECLA BACKSPACE
                                e.preventDefault();
                                return false;
                            }
                        }
                    });
                    $("#formula-editor #formula-input").keydown(function(e) {
                        if (e.which == 13) { //TECLA ENTER
                            e.stopPropagation();
                            $("#formula-editor .button").click();
                            return false;
                        }
                    });
                    $("#formula-editor .editor").click(function(e) {
                        click_editor = true;
                        e.stopPropagation();
                        if ($(e.target).hasClass("f-operator") || $(e.target).hasClass("f-variable") || $(e.target).hasClass("f-vvariable") || $(e.target).hasClass("f-input")) {
                            $(e.target).toggleClass("selected");
                        }
                    });

                    $("#formula-editor .button").click(function(e) {
                        if ($(this).parent().find(".variables .selected").length > 0) {
                            if ($(this).parent().find(".variables .selected").attr("type") == "normal") {
                                var newItem = $(this).parent().find(".editor .editor-content").append("<div class='f-variable' var_id='$$_var_id'>$$nome</div>".render({
                                    nome: $(this).parent().find(".variables .selected").html(),
                                    _var_id: $(this).parent().find(".variables .selected").attr("var_id")
                                }));
                                var period_selected = $(this).parent().find(".variables .selected").attr("period");
                                $(this).parent().find(".variables .item[period!='" + period_selected + "'][type=='normal']").hide();
                            } else {
                                var newItem = $(this).parent().find(".editor .editor-content").append("<div class='f-vvariable' var_id='$$_var_id'>$$nome</div>".render({
                                    nome: $(this).parent().find(".variables .selected").html(),
                                    _var_id: $(this).parent().find(".variables .selected").attr("var_id")
                                }));
                            }
                        } else if ($(this).parent().find("input#formula-input").val() != "") {
                            var newItem = $(this).parent().find(".editor .editor-content").append("<div class='f-input'>$$valor</div>".render2({
                                valor: $(this).parent().find("input#formula-input").val()
                            }));
                            $("input#formula-input").val("");
                        }
                        updateFormula();
                    });

                    $("#formula-editor .op-button").click(function() {
                        if (!$(this).hasClass("op-button-disabled")) {
                            var newItem = $("#formula-editor .editor .editor-content").append("<div class='f-operator' val='$$_value'>$$caption</div>".render({
                                _value: $(this).attr("val"),
                                caption: $(this).html()
                            }));
                            updateFormula();
                            if ($(this).attr("val") == "CONCATENAR") {
                                $("#formula-editor .op-button[value!='erase']").addClass("op-button-disabled");
                            }
                        } else {}
                    });
                    $("#formula-editor .reset-button").click(function() {
                        $("#formula-editor .editor .editor-content").empty();
                        $("#formula-editor .op-button").removeClass("op-button-disabled");
                        $("#formula-editor .variables .item").show();
                        updateFormula();
                    });
                    $("#formula-editor input#formula-input").focus(function() {
                        $("#formula-editor .variables .item").removeClass("selected");
                    });

                    //carrega variaveis
                    $.ajax({
                        async: false,
                        type: 'GET',
                        dataType: 'json',
                        url: api_path + '/api/variable?api_key=$$key&all_variables=1'.render2({
                            key: $.cookie("key")
                        }),
                        success: function(data, textStatus, jqXHR) {
                            // ordena variaveis pelo nome
                            data.variables.sort(function(a, b) {
                                a = a.name,
                                    b = b.name;

                                return a.localeCompare(b);
                            });

                            $.each(data.variables, function(index, value) {
                                $("#formula-editor .variables").append($("<div class='item'></div>").attr({
                                    "var_id": data.variables[index].id,
                                    "period": data.variables[index].period,
                                    "type": "normal"
                                }).html(data.variables[index].name));
                            });
                            trataCliqueVariaveis();
                            convertFormulaToCss();
                        },
                        error: function(data) {
                            $("#aviso").setWarning({
                                msg: "Erro ao carregar ($$codigo)".render2({
                                    codigo: $.trataErro(data)
                                })
                            });
                        }
                    });

                    //Variações

                    variacoes_list = [];
                    variacoes_id_temp = 0;

                    $("#dashboard-content .content input#variacoes_placeholder").after("<div id='variacoes-form'><div class='variacoes-list'><table><thead><tr><th>$$nome</th><th></th><th></th><th></th><th></th></tr></thead><tbody></tbody></table></div><div class='variacoes-add'></div></div>".render({
                        nome: 'Nome'
                    }));
                    $("#variacoes-form .variacoes-add").append("<input type='text' id='variacoes-input' placeholder=''><input type='button' value='$$a' id='variacoes-button-add'><input type='button' style='display: none;' value='$$d' id='variacoes-button-edit'>".render({
                        a: 'adicionar',
                        d: 'salvar'
                    }));
                    $("#dashboard-content .content input#variacoes_placeholder").hide();

                    function updateVariacoesTable() {
                        if (variacoes_list.length > 0) {
                            variacoes_list.sort(function(a, b) {
                                a = a.order.toString(),
                                    b = b.order.toString();
                                return a.localeCompare(b);
                            });
                            $("#variacoes-form .variacoes-list table tbody").empty();
                            $.each(variacoes_list, function(index, item) {
                                $("#variacoes-form .variacoes-list table tbody").append("<tr id='$$_id' order='$$_order' temp='$$_temp' delete='$$_delete'><td>$$name</td><td class='edit'><a href='#'>editar</a></td><td class='delete'><a href='#'>$$r</a></td><td class='up'><a href='#'>$$s</a></td><td class='down'><a href='#'>$$d</a></td></tr>".render({
                                    name: item.name,
                                    d: 'descer',
                                    s: 'subir',
                                    r: 'remover',
                                    _id: item.id,
                                    _order: item.order,
                                    _temp: item.temp,
                                    _delete: item.delete
                                }));
                                if (item.delete || item.delete == "true") {
                                    $("#variacoes-form .variacoes-list table tbody tr:last").hide();
                                }
                            });
                            $("#variacoes-form .variacoes-list table td.delete a").click(function(e) {
                                e.preventDefault();
                                deleteVariacao($(this).parent().parent());
                            });
                            $("#variacoes-form .variacoes-list table td.up a").click(function(e) {
                                e.preventDefault();
                                sobeVariacao($(this).parent().parent());
                            });
                            $("#variacoes-form .variacoes-list table td.down a").click(function(e) {
                                e.preventDefault();
                                desceVariacao($(this).parent().parent());
                            });
                            $("#variacoes-form .variacoes-list table td.edit a").click(function(e) {
                                var tr = $(this).parent().parent();
                                e.preventDefault();
                                $("#variacoes-input").val($(this).parent().prev("td").text());
                                $("#variacoes-input").focus();
                                $("#variacoes-button-add").hide();
                                $("#variacoes-button-edit").show();
                                $("#variacoes-button-edit").unbind();
                                $("#variacoes-button-edit").click(function(e) {
                                    updateVariacao(tr);
                                });
                            });

                        } else {
                            $("#variacoes-form .variacoes-list table tbody").empty();
                            $("#variacoes-form .variacoes-list table tbody").append("<tr><td colspan='4' align='center'>$$e</td></tr>".render({
                                e: 'Nenhuma faixa adicionada'
                            }));
                        }
                    }

                    function reSortVariacao() {
                        var order = 0;
                        $.each(variacoes_list, function(index, item) {
                            variacoes_list[index].order = order;
                            order++;
                        });
                    }

                    function addVariacao() {
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

                    function deleteVariacao(item) {
                        if (item.attr("temp") == "true") {
                            variacoes_list.splice(item.attr("order"), 1);
                        } else {
                            $.each(variacoes_list, function(index, item2) {
                                if (item2.id == item.attr("id")) {
                                    variacoes_list[index].delete = true;
                                }
                            });
                            item.attr("delete", "true");
                        }
                        reSortVariacao();
                        updateVariacoesTable();
                    }

                    function sobeVariacao(item) {
                        if (parseInt(item.attr("order")) > 0) {
                            $.each(variacoes_list, function(index, item2) {
                                if (parseInt(item2.order) == (parseInt(item.attr("order")) - 1)) {
                                    variacoes_list[index].order = parseInt(variacoes_list[index].order) + 1;
                                } else if (parseInt(item2.order) == parseInt(item.attr("order"))) {
                                    variacoes_list[index].order = parseInt(variacoes_list[index].order) - 1;
                                }
                            });
                        }
                        updateVariacoesTable();
                    }

                    function desceVariacao(item) {
                        if (parseInt(item.attr("order")) < $("#variacoes-form .variacoes-list table tbody tr").length) {
                            $.each(variacoes_list, function(index, item2) {
                                if (parseInt(item2.order) == (parseInt(item.attr("order")) + 1)) {
                                    variacoes_list[index].order = parseInt(variacoes_list[index].order) - 1;
                                } else if (parseInt(item2.order) == parseInt(item.attr("order"))) {
                                    variacoes_list[index].order = parseInt(variacoes_list[index].order) + 1;
                                }
                            });
                        }
                        updateVariacoesTable();
                    }


                    function updateVariacao(item) {
                        if (item.attr("temp") == "true") {
                            $.each(variacoes_list, function(index, value) {
                                if (parseInt(variacoes_list[index].id) == parseInt(item.attr("id"))) {
                                    variacoes_list[index].name = $("#variacoes-input").val();
                                }
                            });
                        } else {
                            $.each(variacoes_list, function(index, item2) {
                                if (item2.id == item.attr("id")) {
                                    variacoes_list[index].update = true;
                                    variacoes_list[index].name = $("#variacoes-input").val();
                                    updateFormula();
                                }
                            });
                            item.attr("update", "true");
                        }
                        $("#variacoes-button-add").show();
                        $("#variacoes-button-edit").hide();
                        $("#variacoes-input").val("");
                        updateVariacoesTable();
                    }

                    updateVariacoesTable();

                    $("#variacoes-button-add").click(function() {
                        addVariacao();
                    });

                    //Variáveis da Variação

                    vvariacoes_list = [];
                    vvariacoes_id_temp = 0;

                    $("#dashboard-content .content input#vvariacoes_placeholder").after("<div id='vvariacoes-form'><div class='vvariacoes-list'><table><thead><tr><th>Nome</th><th></th><th></th></tr></thead><tbody></tbody></table></div><div class='vvariacoes-add'></div></div>");
                    $("#vvariacoes-form .vvariacoes-add").append("<input type='text' id='vvariacoes-input' placeholder=''><input type='button' value='adicionar' id='vvariacoes-button-add'><input type='button' style='display: none;' value='salvar' id='vvariacoes-button-edit'>");
                    $("#dashboard-content .content input#vvariacoes_placeholder").hide();

                    function updateVVariacoesTable() {
                        if (vvariacoes_list.length > 0) {
                            vvariacoes_list.sort(function(a, b) {
                                a = a.name,
                                    b = b.name;
                                return a.localeCompare(b);
                            });
                            $("#vvariacoes-form .vvariacoes-list table tbody").empty();
                            $.each(vvariacoes_list, function(index, item) {
                                $("#vvariacoes-form .vvariacoes-list table tbody").append("<tr id='$$_id' temp='$$temp' delete='$$delete'><td>$$name</td><td class='edit'><a href='#'>$$e</a></td><<td class='delete'><a href='#'>remover</a></td></tr>".render({
                                    name: item.name,
                                    e: 'editar',
                                    _id: item.id,
                                    temp: item.temp,
                                    delete: item.delete
                                }));
                                if (item.delete || item.delete == "true") {
                                    $("#vvariacoes-form .vvariacoes-list table tbody tr:last").hide();
                                }
                            });
                            $("#vvariacoes-form .vvariacoes-list table td.delete a").click(function(e) {
                                e.preventDefault();
                                deleteVVariacao($(this).parent().parent());
                            });
                            $("#vvariacoes-form .vvariacoes-list table td.edit a").click(function(e) {
                                var tr = $(this).parent().parent();
                                e.preventDefault();
                                $("#vvariacoes-input").val($(this).parent().prev("td").text());
                                $("#vvariacoes-input").focus();
                                $("#vvariacoes-button-add").hide();
                                $("#vvariacoes-button-edit").show();
                                $("#vvariacoes-button-edit").unbind();
                                $("#vvariacoes-button-edit").click(function(e) {
                                    updateVVariacao(tr);
                                });
                            });

                        } else {
                            $("#vvariacoes-form .vvariacoes-list table tbody").empty();
                            $("#vvariacoes-form .vvariacoes-list table tbody").append("<tr><td colspan='4' align='center'>$$aa</td></tr>".render({
                                aa: 'Nenhuma variável adicionada'
                            }));
                        }
                    }

                    function addVVariacao() {
                        vvariacoes_list.push({
                            name: $("#vvariacoes-form .vvariacoes-add #vvariacoes-input").val(),
                            id: vvariacoes_id_temp,
                            temp: true
                        });
                        updateVVariacoesTable();

                        $("#formula-editor .variables").append($("<div class='item'></div>").attr({
                            "var_id": vvariacoes_id_temp,
                            "type": "varied"
                        }).html($("#vvariacoes-form .vvariacoes-add #vvariacoes-input").val()));
                        vvariacoes_id_temp++;
                        $("#vvariacoes-input").val("");
                        trataCliqueVariaveis();
                    }

                    function deleteVVariacao(item) {
                        if (item.attr("temp") == "true") {
                            var selecionado;
                            $.each(vvariacoes_list, function(index, value) {
                                if (parseInt(vvariacoes_list[index].id) == parseInt(item.attr("id"))) {
                                    $("#formula-editor .variables .item[var_id='$$var_id'][type='varied']".render({
                                        var_id: item.attr("id")
                                    })).remove();
                                    $("#formula-editor .editor-content .f-vvariable[var_id='$$var_id']".render({
                                        var_id: item.attr("id")
                                    })).remove();
                                    updateFormula();
                                    selecionado = index;
                                }
                            });
                            if (selecionado >= 0) {
                                vvariacoes_list.splice(selecionado, 1);
                            }
                        } else {
                            $.each(vvariacoes_list, function(index, item2) {
                                if (item2.id == item.attr("id")) {
                                    vvariacoes_list[index].delete = true;
                                    $("#formula-editor .variables .item[var_id='$$var_id'][type='varied']".render({
                                        var_id: item.attr("id")
                                    })).remove();
                                    $("#formula-editor .editor-content .f-vvariable[var_id='$$var_id']".render({
                                        var_id: item.attr("id")
                                    })).remove();
                                    updateFormula();
                                }
                            });
                            item.attr("delete", "true");
                        }
                        updateVVariacoesTable();
                    }

                    function updateVVariacao(item) {
                        if (item.attr("temp") == "true") {
                            $.each(vvariacoes_list, function(index, value) {
                                if (parseInt(vvariacoes_list[index].id) == parseInt(item.attr("id"))) {
                                    vvariacoes_list[index].name = $("#vvariacoes-input").val();
                                    $("#formula-editor .variables .item[var_id='$$var_id'][type='varied']".render({
                                        var_id: item.attr("id")
                                    })).text($("#vvariacoes-input").val());
                                    $("#formula-editor .editor-content .f-vvariable[var_id='$$var_id']".render({
                                        var_id: item.attr("id")
                                    })).text($("#vvariacoes-input").val());
                                    updateFormula();
                                }
                            });
                        } else {
                            $.each(vvariacoes_list, function(index, item2) {
                                if (item2.id == item.attr("id")) {
                                    vvariacoes_list[index].update = true;
                                    vvariacoes_list[index].name = $("#vvariacoes-input").val();
                                    $("#formula-editor .variables .item[var_id='$$var_id'][type='varied']".render({
                                        var_id: item.attr("id")
                                    })).text($("#vvariacoes-input").val());
                                    $("#formula-editor .editor-content .f-vvariable[var_id='$$var_id']".render({
                                        var_id: item.attr("id")
                                    })).text($("#vvariacoes-input").val());
                                    updateFormula();
                                }
                            });
                            item.attr("update", "true");
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

                    $("#vvariacoes-button-add").click(function() {
                        addVVariacao();
                    });

                    if (user_info.institute && user_info.institute.fixed_indicator_axis_id && user_info.user_type == 'user') {
                        $("#axis_id option[value=" + user_info.institute.fixed_indicator_axis_id + "]").prop('selected', true);
                        $("#axis_id").attr('disabled', 'disabled');
                        $("#axis_id").attr('title', '$$x'.render({
                            x: 'Desabilitado'
                        }));
                    }

                    if ($.getUrlVar("option") == "add") {
                        $("#dashboard-content .content .botao-form[ref='enviar']").click(function() {
                            if ($("#source").val() == '_new') {
                                $("#add-source").click();
                            }

                            resetWarnings();
                            if ($(this).parent().parent().find("#name").val() == "") {
                                $(".form-aviso").setWarning({
                                    msg: "Por favor informe o Nome"
                                });
                            } else if ($(this).parent().parent().find("#formula").val() == "") {
                                $(".form-aviso").setWarning({
                                    msg: "Por favor informe a Fórmula"
                                });
                            } else {
                                args = [{
                                    name: "api_key",
                                    value: $.cookie("key")
                                }, {
                                    name: "indicator.create.name",
                                    value: $(this).parent().parent().find("#name").val()
                                }, {
                                    name: "indicator.create.indicator_type",
                                    value: 'normal'
                                }, {
                                    name: "indicator.create.formula",
                                    value: $(this).parent().parent().find("#formula").val()
                                }, {
                                    name: "indicator.create.explanation",
                                    value: $(this).parent().parent().find("#explanation").val()
                                }, {
                                    name: "indicator.create.sort_direction",
                                    value: $(this).parent().parent().find("#sort_direction option:selected").val()
                                }, {
                                    name: "indicator.create.summarization_method",
                                    value: $("#summarization_method option:selected").val()
                                }, {
                                    name: "indicator.create.goal_explanation",
                                    value: $(this).parent().parent().find("#goal_explanation").val()
                                }, {
                                    name: "indicator.create.axis_id",
                                    value: 1
                                }, {
                                    name: "indicator.create.source",
                                    value: $("#source option:selected").val()
                                }, {
                                    name: "indicator.create.observations",
                                    value: $(this).parent().parent().find("#observations").val()
                                }];


                                args.push({
                                    name: "indicator.create.visibility_level",
                                    value: 'network'
                                });

                                args.push({
                                    name: "indicator.create.visibility_networks_id",
                                    value: $(this).parent().parent().find("#visibility_networks_id").val()
                                });


                                $("#dashboard-content .content .botao-form[ref='enviar']").hide();
                                $.ajax({
                                    async: false,
                                    type: 'POST',
                                    dataType: 'json',
                                    url: api_path + '/api/indicator',
                                    data: args,
                                    success: function(data, status, jqXHR) {
                                        var newId = data.id;
                                        var formula_update = $("#dashboard-content textarea#formula").val();

                                        if (formula_update != $("#dashboard-content textarea#formula").val()) {
                                            args = [{
                                                name: "api_key",
                                                value: $.cookie("key")
                                            }, {
                                                name: "indicator.update.formula",
                                                value: formula_update
                                            }];
                                            $.ajax({
                                                async: false,
                                                type: 'POST',
                                                dataType: 'json',
                                                url: api_path + '/api/indicator/$$newid'.render2({
                                                    newid: newId
                                                }),
                                                data: args
                                            });
                                        }
                                        // cadastra flag mostrar na home
                                        args = [{
                                            name: "api_key",
                                            value: $.cookie("key")
                                        }, {
                                            name: "indicator.network_config.upsert.unfolded_in_home",
                                            value: ($("input#unfolded_in_home").attr("checked") ? 1 : 0)
                                        }];

                                        $.ajax({
                                            async: false,
                                            type: 'POST',
                                            dataType: 'json',
                                            url: api_path + '/api/indicator/$$newid/network_config/$$network_id'.render2({
                                                newid: newId,
                                                network_id: user_info.network
                                            }),
                                            data: args
                                        });

                                        $("#aviso").setWarning({
                                            msg: "Cadastro efetuado com sucesso.".render2({
                                                codigo: jqXHR.status
                                            })
                                        });
                                        location.hash = "#!/" + getUrlSub();
                                    },
                                    error: function(data) {
                                        //switch (data.status) {
                                        //case 400:
                                        $("#aviso").setWarning({
                                            msg: "Erro ao cadastrar. ($$codigo)".render2({
                                                codigo: $.trataErro(data)
                                            })
                                        });
                                        //break;
                                        //}
                                        $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                    }
                                });
                            }
                        });
                    } else if ($.getUrlVar("option") == "edit") {
                        $.ajax({
                            async: false,
                            type: 'GET',
                            dataType: 'json',
                            url: $.getUrlVar("url") + "?api_key=$$key".render2({
                                key: $.cookie("key")
                            }),
                            success: function(data, status, jqXHR) {
                                switch (jqXHR.status) {
                                    case 200:
                                        $(formbuild).find("input#name").val(data.name);

                                        $(formbuild).find("select#visibility_level").val(data.visibility_level);

                                        visibilityChanged({
                                            "callBack": function() {
                                                if (data.visibility_level == "private") {
                                                    if (data.visibility_user_id) {
                                                        $(formbuild).find("select#visibility_user_id").val(data.visibility_user_id)
                                                    }
                                                } else if (data.visibility_level == "country") {
                                                    if (data.visibility_country_id) {
                                                        $(formbuild).find("select#visibility_country_id").val(data.visibility_country_id)
                                                    }
                                                } else if (data.visibility_level == "network") {
                                                    if (data.restrict_to_networks) {
                                                        var networks = data.restrict_to_networks;
                                                        $.each(networks, function(index, value) {
                                                            $("#visibility_networks_select option[value=" + value + "]").appendTo("#visibility_networks_id");
                                                        });
                                                    }
                                                } else if (data.visibility_level == "restrict") {
                                                    if (data.restrict_to_users) {
                                                        var users = data.restrict_to_users;
                                                        $.each(users, function(index, value) {
                                                            $("#visibility_users_select option[value=" + value + "]").appendTo("#visibility_users_id");
                                                        });
                                                    }
                                                }
                                            }
                                        });

                                        $(formbuild).find("textarea#formula").val(data.formula);
                                        $(formbuild).find("textarea#explanation").val(data.explanation);
                                        $(formbuild).find("select#sort_direction").val(String(data.sort_direction));
                                        $(formbuild).find("input#goal").val($.convertNumberFromBd(data.goal));
                                        $(formbuild).find("select#goal_source").val(data.goal_source);
                                        $(formbuild).find("select#summarization_method").val(String(data.summarization_method));
                                        $(formbuild).find("textarea#goal_explanation").val(data.goal_explanation);
                                        $(formbuild).find("select#axis_id").val(data.axis_id);
                                        $(formbuild).find("select#source").val(data.source);
                                        $(formbuild).find("textarea#observations").val(data.observations);

                                        $.each(data.network_configs, function(index, item) {
                                            if (item.network_id == user_info.network) {
                                                if (item.unfolded_in_home == 1) {
                                                    $(formbuild).find("input#unfolded_in_home").attr("checked", true);
                                                }
                                            }
                                        });

                                        if ($("#formula-editor .variables .item").length > 0) convertFormulaToCss();

                                        if (data.indicator_type == "varied") {
                                            $("#variety_name").parent().parent().show();
                                            $("#variacoes_placeholder").parent().parent().show();
                                            $("#vvariacoes_placeholder").parent().parent().show();
                                            $("#all_variations_variables_are_required").parent().parent().show();
                                            if (data.all_variations_variables_are_required == 1) {
                                                $(formbuild).find("input#all_variations_variables_are_required").attr("checked", "checked");
                                            } else {
                                                $(formbuild).find("input#all_variations_variables_are_required").attr("checked", "");
                                            }
                                            $(formbuild).find("input#variety_name").val($.convertNumberFromBd(data.variety_name));

                                            //carrega variaveis
                                            $.ajax({
                                                async: false,
                                                type: 'GET',
                                                dataType: 'json',
                                                url: api_path + '/api/indicator/$$indicator_id/variables_variation?api_key=$$key'.render2({
                                                    key: $.cookie("key"),
                                                    indicator_id: getIdFromUrl($.getUrlVar("url"))
                                                }),
                                                success: function(data, textStatus, jqXHR) {
                                                    // ordena variaveis pelo nome
                                                    data.variables_variations.sort(function(a, b) {
                                                        a = a.name,
                                                            b = b.name;

                                                        return a.localeCompare(b);
                                                    });

                                                    $.each(data.variables_variations, function(index, item) {
                                                        $("#formula-editor .variables").append($("<div class='item'></div>").attr({
                                                            "var_id": item.id,
                                                            "period": "",
                                                            "type": "varied"
                                                        }).html(item.name));
                                                    });
                                                    trataCliqueVariaveis();
                                                    convertFormulaToCss();
                                                },
                                                error: function(data) {
                                                    $("#aviso").setWarning({
                                                        msg: "Erro ao carregar ($$codigo)".render2({
                                                            codigo: $.trataErro(data)
                                                        })
                                                    });
                                                }
                                            });
                                        }

                                        break;
                                }
                            },
                            error: function(data) {
                                switch (data.status) {
                                    case 400:
                                        $(".form-aviso").setWarning({
                                            msg: "Erro: ($$codigo)".render2({
                                                codigo: $.trataErro(data)
                                            })
                                        });
                                        break;
                                }
                            }
                        });

                        $("#dashboard-content .content .botao-form[ref='enviar']").click(function() {
                            if ($("#source").val() == '_new') {
                                $("#add-source").click();
                            }
                            resetWarnings();
                            if ($(this).parent().parent().find("#name").val() == "") {
                                $(".form-aviso").setWarning({
                                    msg: "Por favor informe o Nome"
                                });
                            } else if ($(this).parent().parent().find("#formula").val() == "") {
                                $(".form-aviso").setWarning({
                                    msg: "Por favor informe a Fórmula"
                                });
                            } else {
                                args = [{
                                    name: "api_key",
                                    value: $.cookie("key")
                                }, {
                                    name: "indicator.update.name",
                                    value: $(this).parent().parent().find("#name").val()
                                }, {
                                    name: "indicator.update.indicator_type",
                                    value: 'normal'
                                }, {
                                    name: "indicator.update.formula",
                                    value: $(this).parent().parent().find("#formula").val()
                                }, {
                                    name: "indicator.update.explanation",
                                    value: $(this).parent().parent().find("#explanation").val()
                                }, {
                                    name: "indicator.update.sort_direction",
                                    value: $(this).parent().parent().find("#sort_direction option:selected").val()
                                }, {
                                    name: "indicator.update.summarization_method",
                                    value: $("#summarization_method option:selected").val()
                                }, {
                                    name: "indicator.update.goal_explanation",
                                    value: $(this).parent().parent().find("#goal_explanation").val()
                                }, {
                                    name: "indicator.update.axis_id",
                                    value: 1
                                }, {
                                    name: "indicator.update.source",
                                    value: $(this).parent().parent().find("#source").val()
                                }, {
                                    name: "indicator.update.observations",
                                    value: $(this).parent().parent().find("#observations").val()
                                }];


                                args.push({
                                    name: "indicator.update.visibility_level",
                                    value: 'network'
                                });

                                var networks = "";
                                $("#visibility_networks_id option").each(function(index, item) {
                                    if (networks != "") networks += ",";
                                    networks += item.value;
                                });
                                args.push({
                                    name: "indicator.update.visibility_networks_id",
                                    value: networks
                                });


                                args.push({
                                    name: "indicator.update.all_variations_variables_are_required",
                                    value: ''
                                });
                                args.push({
                                    name: "indicator.update.variety_name",
                                    value: ''
                                });

                                $("#dashboard-content .content .botao-form[ref='enviar']").hide();
                                $.ajax({
                                    type: 'POST',
                                    dataType: 'json',
                                    url: $.getUrlVar("url"),
                                    data: args,
                                    success: function(data, textStatus, jqXHR) {
                                        var newId = data.id;
                                        var formula_update = $("#dashboard-content textarea#formula").val();


                                        if (formula_update != $("#dashboard-content textarea#formula").val()) {
                                            args = [{
                                                name: "api_key",
                                                value: $.cookie("key")
                                            }, {
                                                name: "indicator.update.formula",
                                                value: formula_update
                                            }];
                                            $.ajax({
                                                async: false,
                                                type: 'POST',
                                                dataType: 'json',
                                                url: api_path + '/api/indicator/$$newid'.render2({
                                                    newid: newId
                                                }),
                                                data: args
                                            });
                                        }


                                        $("#aviso").setWarning({
                                            msg: "Cadastro editado com sucesso.".render2({
                                                codigo: jqXHR.status
                                            })
                                        });
                                        location.hash = "#!/" + getUrlSub();
                                        $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                    },
                                    error: function(data) {
                                        $(".form-aviso").setWarning({
                                            msg: "Erro ao editar. ($$erro)".render2({
                                                erro: $.trataErro(data)
                                            })
                                        });
                                        $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                    }
                                });
                            }
                        });
                    }
                    $("#dashboard-content .content .botao-form[ref='cancelar']").click(function() {
                        resetWarnings();
                        history.back();
                    });
                } else if ($.getUrlVar("option") == "delete") {

                    deleteRegister({
                        url: $.getUrlVar("url") + "?api_key=$$key".render2({
                            key: $.cookie("key")
                        })
                    });
                }

            } else if (getUrlSub() == "topic") {

                if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {

                    var userList = buildDTWithButton({
                        headers: ["Nome", "Url", "_"]
                    });

                    $("#dashboard-content .content").append(userList);


                    $("#results").dataTable({
                        iDisplayLength: 50,
                        "oLanguage": get_datatable_lang(),
                        "bProcessing": true,
                        "sAjaxSource": api_path + '/api/network?api_key=$$key&topic=1&content-type=application/json&user_id=$$user_id&lang=$$lang&columns=name,name_url,url,_,_'.render2({
                            lang: cur_lang,
                            key: $.cookie("key"),
                            user_id: user_info.id
                        }),
                        "aoColumnDefs": [{
                            "bSearchable": false,
                            "bSortable": false,
                            "sClass": "botoes",
                            "sWidth": "60px",
                            "aTargets": [2]
                        }],
                        "fnDrawCallback": function() {
                            DTdesenhaBtEntrar();
                        }

                    });


                } else if ($.getUrlVar("option") == "save") {
                    // var network_id = $.getUrlVar("url").split('/')[5];


                    $.ajax({
                        type: "POST",
                        dataType: 'json',
                        url: $.getUrlVar("url") + '/user/$$userid?api_key=$$key'.render2({
                            key: $.cookie("key"),
                            userid: $.cookie("user.id"),
                            networkid: $.getUrlVar("url").split('/')[5]
                        }),

                        success: function(data, textStatus, jqXHR) {
                            $("#aviso").setWarning({
                                msg: "Participação cadastrada com sucesso.".render2({
                                    codigo: jqXHR.status
                                })
                            });
                            $.loading.hide();
                        },
                        error: function(data) {
                            $("#aviso").setWarning({
                                msg: "Erro ao salvar. ($$erro)".render2({
                                    erro: $.trataErro(data)
                                })
                            });
                            $.loading.hide();
                        }
                    });

                    location.hash = "#!/" + getUrlSub();
                }

            } else if (getUrlSub() == "myindicator") {
                /*  INDICATORS */
                if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {


                    var redeid, redeparam = $.getUrlVar("redeid");
                    if (redeparam == undefined && (window.location.href.indexOf("http://indicadores.cidadessustentaveis.org.br") >= 0)) {
                        redeid = '1';
                    } else if (/^[0-9]+$/.test(redeparam)) {
                        redeid = +redeparam;
                    } /* else = all ou outras strings = todos indicadores */

                    $.ajax({
                        type: 'GET',
                        dataType: 'json',
                        url: api_path + '/api/indicator?api_key=$$key&config_user_id=$$userid'.render2({
                            key: $.cookie("key"),
                            userid: $.cookie("user.id")
                        }),
                        data: {
                            network_id: redeid
                        },
                        success: function(data, textStatus, jqXHR) {
                            var data_indicators = [];
                            $.each(data.indicators, function(index, value) {
                                data_indicators.push({
                                    "id": data.indicators[index].id,
                                    "name": data.indicators[index].name,
                                    "formula": data.indicators[index].formula,
                                    "axis_id": data.indicators[index].axis_id,
                                    "axis": data.indicators[index].axis,
                                    "network_configs": data.indicators[index].network_configs,
                                    "user_indicator_config": data.indicators[index].user_indicator_config,
                                    "period": 'yearly'
                                });
                            });

                            data_indicators.sort(function(a, b) {
                                a = a.axis.name,
                                    b = b.axis.name;

                                return a.localeCompare(b);
                            });

                            var data_groups = [];
                            $.ajax({
                                async: false,
                                type: 'GET',
                                dataType: 'json',
                                url: api_path + '/api/user_indicator_axis?api_key=$$key'.render2({
                                    key: $.cookie("key"),
                                    userid: $.cookie("user.id")
                                }),
                                success: function(data, textStatus, jqXHR) {
                                    data_groups = data.user_indicator_axis;
                                }
                            });

                            var data_variables = [];
                            $.ajax({
                                async: false,
                                type: 'GET',
                                dataType: 'json',
                                url: api_path + '/api/variable?api_key=$$key'.render2({
                                    key: $.cookie("key"),
                                    userid: $.cookie("user.id")
                                }),
                                success: function(data, textStatus, jqXHR) {
                                    $.each(data.variables, function(index, value) {
                                        data_variables.push({
                                            "id": data.variables[index].id,
                                            "name": data.variables[index].name
                                        });
                                    });
                                }
                            });

                            var data_vvariables = [];
                            $.ajax({
                                async: false,
                                type: 'GET',
                                dataType: 'json',
                                url: api_path + '/api/indicator/variable?api_key=$$key'.render2({
                                    key: $.cookie("key"),
                                    userid: $.cookie("user.id")
                                }),
                                success: function(data, textStatus, jqXHR) {
                                    $.each(data.variables, function(index, value) {
                                        data_vvariables.push({
                                            "id": data.variables[index].id,
                                            "name": data.variables[index].name
                                        });
                                    });
                                }
                            });

                            var axis_ant = "";
                            var indicators_table = "";

                            var indicators_status = "";




                            indicators_table = "<div class='indicadores_list'>";
                            indicators_table += "<div class='status'></div>";



                            //carrega grupos

                            var indicators_in_groups = [];


                            //carrega indicadores por eixo
                            data_indicators.sort(function(a, b) {
                                a = a.axis.name, b = b.axis.name;

                                return a.localeCompare(b);
                            });


                            var indicators_hash = {};


                            for (i = 0; i < data_indicators.length; i++) {

                                if (data_indicators[i].user_indicator_config && data_indicators[i].user_indicator_config.hide_indicator == 1) {
                                    if (!indicators_hash['hidden']) {
                                        indicators_hash['hidden'] = [data_indicators[i]];
                                    } else {
                                        indicators_hash['hidden'].push(data_indicators[i]);
                                    }

                                } else {
                                    var axis_name = data_indicators[i].axis.name;


                                    if (!indicators_hash[axis_name]) {
                                        indicators_hash[axis_name] = [data_indicators[i]];
                                    } else {
                                        indicators_hash[axis_name].push(data_indicators[i]);
                                    }
                                }

                            }

                            var count_i = 0;

                            if (indicators_hash != "") {
                                for (var key in indicators_hash) {

                                    indicators_hash[key].sort(function(a, b) {
                                        a = a.name,
                                            b = b.name;

                                        return a.localeCompare(b);
                                    });

                                    if (key == 'hidden') {
                                        continue;
                                    }
                                    if (count_i > 0) {
                                        indicators_table += "</div>";
                                    }

                                    indicators_table += "<div class='eixos'><div class='title'>$$axis</div><div class='clear'></div>".render({
                                        axis: key
                                    });

                                    for (i = 0; i < indicators_hash[key].length; i++) {

                                        axis_ant = indicators_hash[key][i].axis_id;

                                        //
                                        var formula = formataFormula(indicators_hash[key][i].formula, data_variables, data_vvariables);
                                        var tr_class = "folded";
                                        $.each(indicators_hash[key][i].network_configs, function(index_config, item_config) {
                                            if (item_config.network_id == user_info.network && item_config.unfolded_in_home == 1) {
                                                tr_class = "unfolded";
                                            }
                                        });
                                        indicators_table += "<div class='variable $$_tr_class' indicator-id='$$_indicator_id'><div class='name'>$$name</div><div class='formula'>$$fxormula</div><div class='link'><a href='$$_hash?option=edit&url=$$_url' class='icone edit' title='$$a' alt='$$a'>editar</a></div><div class='clear'></div><div class='historico-popup'></div></div>".render({
                                            name: indicators_hash[key][i].name,
                                            a: 'adicionar valores',
                                            ss: 'Série Histórica',
                                            fxormula: formula,
                                            _hash: "#!/" + getUrlSub(),
                                            _url: api_path + "/api/indicator/" + indicators_hash[key][i].id,
                                            _indicator_id: indicators_hash[key][i].id,
                                            det: 'detalhes',
                                            _period: indicators_hash[key][i].period,
                                            _id: indicators_hash[key][i].id,
                                            _tr_class: tr_class
                                        });
                                        indicators_table += "<div class='clear'></div>";
                                        count_i++;
                                    }
                                }

                            } else {

                                indicators_table += "<div class='eixos'><div class='title'>$$aviso</div><div class='clear'></div>".render({
                                    aviso: 'Nenhum indicador encontrado'
                                });
                            }


                            indicators_table += "</div>";
                            indicators_table += "<div class='clear'></div>";

                            $("#dashboard-content .content").append(indicators_table);

                            $("#dashboard-content .content .indicadores_list .eixos").each(function(index, item) {
                                if ($(item).find(".variable").length <= 0) {
                                    $(item).append("<div class='empty'>$$e</div>".render({
                                        e: 'Nenhum indicador encontrado'
                                    }));
                                }
                            });



                            $("#dashboard-content .content .variable-filter .form-pesquisa").append("<div class='variable'>$$v: <select id='rede_id'></select></div>".render({
                                v: 'Redes'
                            }));
                            $("#dashboard-content .content .variable-filter .form-pesquisa").append("<div class='botao'><input type='button' id='botao-pesquisar' value='$$e'></div><div class='clear'></div>".render({
                                e: 'Pesquisar'
                            }));

                            $("#dashboard-content .content .variable-filter").hide();
                            $("#dashboard-content .content .variable-filter .form-pesquisa .variable").hide();
                            $("#dashboard-content .content .variable-filter .form-pesquisa .botao").hide();

                            $("#dashboard-content .content .variable-filter #botao-pesquisar").click(function() {

                                location.hash = "#!/" + getUrlSub() + "?redeid=$$_rede_id".render2({
                                    _rede_id: $("#dashboard-content .content .variable-filter select#rede_id option:selected").val()
                                });

                            });



                        },
                        error: function(data) {
                            $("#aviso").setWarning({
                                msg: "Erro ao carregar ($$codigo)".render2({
                                    codigo: $.trataErro(data)
                                })
                            });
                        }
                    });
                } else if ($.getUrlVar("option") == "edit") { //EDIT MYINDICATOR

                    $.ajax({
                        type: 'GET',
                        dataType: 'json',
                        url: api_path + '/api/indicator/$$id?api_key=$$key'.render2({
                            key: $.cookie("key"),
                            id: getIdFromUrl($.getUrlVar("url"))
                        }),
                        success: function(data, textStatus, jqXHR) {

                            $("#dashboard-content .content").append("<div class='filter_indicator'></div><div class='clear'><br /></div><div class='filter_result'></div><div class='clear'><br /></div><div class='tech_info'></div><div class='clear'><br /></div><div class='historico'></div>");

                            var data_indicator = data;

                            var data_region = SUPER_CACHE_data_region;
                            if (user_info.regions_enabled && !data_region) {
                                $.ajax({
                                    async: false,
                                    type: 'GET',
                                    dataType: 'json',
                                    url: api_path + '/api/city/$$city/region?api_key=$$key'.render2({
                                        key: $.cookie("key"),
                                        city: getIdFromUrl(user_info.city)
                                    }),
                                    success: function(data, textStatus, jqXHR) {
                                        data_region = data.regions;
                                        SUPER_CACHE_data_region = data_region;
                                    }
                                });
                            }

                            var newform = [];

                            if (data_region && data_region.length > 0) {
                                newform.push({
                                    label: "Região",
                                    input: ["select,region_id,iselect"]
                                });
                            }

                            newform.push({
                                label: "Fórmula",
                                input: ["textlabel,textlabel_formula,ilabel"]
                            });
                            newform.push({
                                label: "Período",
                                input: ["textlabel,textlabel_periodo,ilabel"]
                            });
                            if (data_indicator.period == "yearly") {
                                newform.push({
                                    label: "Data",
                                    input: ["select,date_filter,iselect"]
                                });
                            } else if (data_indicator.period == "monthly") {
                                newform.push({
                                    label: "Data",
                                    input: ["select,date_filter_year,iselect", "select,date_filter,iselect"]
                                });
                            } else if (data_indicator.period == "daily") {
                                newform.push({
                                    label: "Data",
                                    input: ["text,date_filter,itextdata"]
                                });
                            } else {
                                newform.push({
                                    label: "Data",
                                    input: ["select,date_filter,iselect"]
                                });
                            }

                            if (user_info.regions_enabled && data_region && data_region.length > 0) {
                                var formbuild = $("#dashboard-content .content .filter_indicator").append(buildForm(newform, "Informe a Região e o Período"));
                            } else {
                                var formbuild = $("#dashboard-content .content .filter_indicator").append(buildForm(newform, "Informe o Período"));
                            }
                            $(formbuild).find("div .field:odd").addClass("odd");
                            $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

                            if (user_info.regions_enabled && data_region && data_region.length > 0) {

                                $("#region_id").change(function(e) {

                                    if (!$("#dashboard-content .content .filter_result").is(':empty')) {
                                        if (window.confirm('Ao alterar a região, você irá perder os dados preenchidos abaixo. Deseja continuar?')) {
                                            $('.filter_result a[ref="cancelar"]').click();

                                            $("#dashboard-content .content div.historico").html('Carregando...');
                                            buildIndicatorHistory({
                                                "id": getIdFromUrl($.getUrlVar("url")),
                                                "period": data_indicator.period,
                                                "target": $("#dashboard-content .content div.historico")
                                            });


                                        }
                                    } else {
                                        $("#dashboard-content .content div.historico").html('Carregando...');
                                        buildIndicatorHistory({
                                            "id": getIdFromUrl($.getUrlVar("url")),
                                            "period": data_indicator.period,
                                            "target": $("#dashboard-content .content div.historico")
                                        });

                                    }

                                });
                                $("#dashboard-content .content select#region_id").append($("<option data-dp=1></option>").val("1").html("$$e".render({
                                    e: '◇ Litoral Sustentável'
                                }))).change();

                                var region = [];
                                var district = [];
                                var district_vs_len = {};
                                $.each(data_region, function(index, item) {
                                    if (item.depth_level == 2) {
                                        region.push({
                                            "id": item.id,
                                            "name": item.name,
                                            "url": item.url
                                        });
                                    } else if (item.depth_level == 3) {
                                        district_vs_len[item.upper_region.id] = district_vs_len[item.upper_region.id] ? district_vs_len[item.upper_region.id] + 1 : 1;
                                        district.push({
                                            "id": item.id,
                                            "name": item.name,
                                            "url": item.url,
                                            "upper_region_id": item.upper_region.id,
                                            "upper_region_name": item.upper_region.name
                                        });
                                    }
                                });
                                region.sort(function(a, b) {
                                    a = String(a.name),
                                        b = String(b.name);
                                    return a.localeCompare(b);
                                });
                                district.sort(function(a, b) {
                                    a = String(a.name),
                                        b = String(b.name);
                                    return a.localeCompare(b);
                                });
                                $.each(region, function(index, item) {
                                    $("#region_id").append($("<option data-dp=2></option>").val(item.id).html("╔◌ $$e".render({
                                        e: item.name
                                    })));

                                    var in_loop = 0;
                                    $.each(district, function(index2, item2) {
                                        if (item2.upper_region_id == item.id) {
                                            in_loop++;
                                            $("#region_id").append($("<option data-dp=3></option>").val(item2.id).html((in_loop == district_vs_len[item.id] ? "╚" : "╠") + "═◎ $$e".render({
                                                e: item2.name
                                            })));
                                        }
                                    });
                                });

                            }
                            var data_variables = SUPER_CACHE_data_variables;
                            if (!data_variables) {
                                data_variables = [];
                                $.ajax({
                                    async: false,
                                    cache: true,
                                    type: 'GET',
                                    dataType: 'json',
                                    url: api_path + '/api/variable?api_key=$$key'.render2({
                                        key: $.cookie("key"),
                                        userid: $.cookie("user.id")
                                    }),
                                    success: function(data, textStatus, jqXHR) {
                                        $.each(data.variables, function(index, value) {
                                            data_variables.push({
                                                "id": data.variables[index].id,
                                                "name": data.variables[index].name
                                            });
                                        });

                                        SUPER_CACHE_data_variables = data_variables;
                                    }
                                });
                            }

                            var data_vvariables = [];


                            $("#dashboard-content .content .filter_indicator #textlabel_formula").html("$$e".render({
                                e: formataFormula(data_indicator.formula, data_variables, data_vvariables)
                            }));

                            $("#dashboard-content .content .filter_indicator #textlabel_periodo").html("$$e".render({
                                e: variable_periods[data_indicator.period]
                            }));

                            $("#dashboard-content .content .filter_indicator .botao-form[ref='enviar']").html("$$e".render({
                                e: 'Cadastrar'
                            }));

                            $("#dashboard-content .content .filter_indicator .botao-form[ref='cancelar']").html("$$e".render({
                                e: 'Voltar'
                            }));
                            $("#dashboard-content .content .filter_indicator .botao-form[ref='cancelar']").click(function() {
                                resetWarnings();
                                location.hash = "#!/myindicator";
                            });

                            if (!SUPERA_CACHE_YEARS) {
                                $.ajax({
                                    type: 'GET',
                                    cache: true,
                                    async: false,
                                    dataType: 'json',
                                    url: api_path + '/api/period/year'.render2({
                                        key: $.cookie("key")
                                    }),
                                    success: function(data, textStatus, jqXHR) {
                                        SUPERA_CACHE_YEARS = data.options;
                                    }
                                });
                            }

                            $.each(SUPERA_CACHE_YEARS, function(index, value) {
                                $("#dashboard-content .content .filter_indicator select#date_filter").append("<option value='$$_value'>$$_text</option>".render({
                                    _text: value.text,
                                    _value: value.value
                                }));
                            });


                            $("#dashboard-content .content .filter_indicator #date_filter").change(function() {
                                if (!$("#dashboard-content .content .filter_result").is(':empty')) {
                                    if (window.confirm('Ao alterar o ano, você irá perder os dados preenchidos abaixo. Deseja continuar?')) {
                                        $('.filter_result a[ref="cancelar"]').click();
                                    }
                                } else {
                                    $('.filter_result a[ref="cancelar"]').click();
                                }
                            });

                            $("#dashboard-content .content .filter_indicator .botao-form[ref='enviar']").click(function() {
                                $.loading();

                                $("#dashboard-content .content .filter_result").empty();
                                $.ajax({
                                    type: 'GET',
                                    dataType: 'json',
                                    url: api_path + '/api/indicator/$$id/variable/period/$$period?api_key=$$key$$region$$active_value'.render2({
                                        key: $.cookie("key"),
                                        id: getIdFromUrl($.getUrlVar("url")),
                                        period: $("#dashboard-content .content .filter_indicator select#date_filter option:selected").val(),
                                        region: ($("#dashboard-content .content select#region_id option:selected").val()) ? "&region_id=" + $("#dashboard-content .content select#region_id option:selected").val() : "",
                                        active_value: ($("#region_id option:selected").attr('data-dp') <= 2) ? "&active_value=0" : ""
                                    }),
                                    success: function(data, textStatus, jqXHR) {
                                        var data_variables = data.rows;
                                        var data_vvariables;
                                        var data_variations;
                                        var newform = [];

                                        $.each(data_variables, function(index, item) {
                                            if (item.type == "str") {
                                                newform.push({
                                                    label: item.name,
                                                    bold: 1,
                                                    input: ["textarea,var_$$id,itext".render2({
                                                        id: item.id
                                                    })]
                                                });
                                            } else {
                                                newform.push({
                                                    label: item.name,
                                                    bold: 1,
                                                    input: ["text,var_$$id,itext ivar$$num".render2({
                                                        id: item.id,
                                                        num: item.type == 'num' ? ' inum' : ''
                                                    })]
                                                });
                                            }
                                            newform.push({
                                                label: "Descrição",
                                                input: ["textlabel,textlabel_explanation_$$id,ilabel".render2({
                                                    id: item.id
                                                })]
                                            });
                                            newform.push({
                                                label: "Fonte",
                                                input: ["select,source_$$id,iselect source".render2({
                                                    id: item.id
                                                }), "text,source_$$id_new,itext300px".render2({
                                                    id: item.id
                                                })]
                                            });
                                            newform.push({
                                                label: "Observações",
                                                input: ["text,observations_$$id,itext".render2({
                                                    id: item.id
                                                })]
                                            });
                                            newform.push({
                                                type: "div"
                                            });
                                        });

                                        data_vvariables = [];

                                        data_variations = [];

                                        var formbuild = $("#dashboard-content .content .filter_result").append(buildForm(newform, data_indicator.name));
                                        $(formbuild).find("div .field:odd").addClass("odd");
                                        $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());
                                        $(formbuild).find("#new_variation_add").html("$$e".render({
                                            e: 'Adicionar'
                                        }));


                                        if (data_indicator.variable_type == 'int' || data_indicator.variable_type == 'num') {
                                            $(formbuild).find('.ivar').each(function(i, o) {
                                                // se o tipo do input for variado, usa numeric
                                                if (/_var_/.test(o.name)) {
                                                    setup_jStepper(o, 'num');
                                                } else {
                                                    setup_jStepper(o, /inum/.test(o.className) ? 1 : 0);
                                                }
                                            })
                                        }

                                        if (data_indicator.goal) {
                                            var ref_meta = "";
                                            if (data_indicator.goal_operator) {
                                                ref_meta += data_indicator.goal_operator + "&nbsp;";
                                            }
                                            ref_meta += data_indicator.goal;
                                            $(formbuild).find("#goal").after("<span class='ref-meta'>&nbsp;Ref. Meta:&nbsp;<span class='valor'>" + ref_meta + "</span></span>");
                                        }

                                        $.each(data_variables, function(index, item) {
                                            setNewSource($("#dashboard-content .content select#source_" + item.id), $("#dashboard-content .content input#source_" + item.id + "_new"));
                                        });

                                        loadSources();

                                        $.each(data_variables, function(index, item) {
                                            loadComboSources(sources, $("#dashboard-content .content select#source_" + item.id), $("#dashboard-content .content input#source_" + item.id + "_new"));
                                        });

                                        /*$("#no_data").after("Não possuo um ou mais dados, quero justificar o indicador.");
                                        $("#dashboard-content .content .filter_result .field:last").hide();
                                        $("#no_data").change(function() {
                                            if ($(this).attr("checked")) {
                                                $("#dashboard-content .content .filter_result .field:last").show();
                                                $("#goal").parents('.field').hide();
                                            } else {
                                                $("#dashboard-content .content .filter_result .field:last").hide();
                                                $("#goal").parents('.field').show();
                                                $("#justification_of_missing_field").val('');
                                            }
                                        });*/

                                        $.each(data_variables, function(index, value) {
                                            $("#dashboard-content .content .filter_result div#textlabel_explanation_$$id".render({
                                                id: data_variables[index].id
                                            })).html(data_variables[index].explanation)

                                            var $select = $("#source_$$id".render({
                                                id: data_variables[index].id
                                            }));
                                            /* sources */
                                            $select.val(data_variables[index].source);
                                            if (!($select.val() == data_variables[index].source)) {
                                                $select.append($("<option></option>").val(data_variables[index].source).html(data_variables[index].source).attr("source-id", '?'));
                                                $select.val(data_variables[index].source);
                                            }

                                            $("#observations_$$id".render2({
                                                id: data_variables[index].id
                                            })).val(data_variables[index].observations);

                                            if (data_variables[index].value != null && data_variables[index].value != undefined && data_variables[index].value != "") {
                                                $("#var_$$id".render({
                                                    id: data_variables[index].id
                                                })).val($.convertNumberFromBd(data_variables[index].value));

                                            } else {
                                                $("#var_$$id".render({
                                                    id: data_variables[index].id
                                                })).attr("disabled", false);
                                                $("#source_$$id".render({
                                                    id: data_variables[index].id
                                                })).attr("disabled", false);
                                                $("#observations_$$id".render2({
                                                    id: data_variables[index].id
                                                })).attr("disabled", false);
                                                $("#no_data").attr("disabled", false);
                                                $("#goal").attr("disabled", false);
                                            }
                                        });


                                        $.loading.hide();
                                        $("#dashboard-content .content .filter_result .botao-form[ref='enviar']").click(function() {
                                            resetWarnings();

                                            $.each(data_variables, function(index, value) {
                                                var data_formatada = "";
                                                if (data_indicator.period == "yearly" || data_indicator.period == "monthly") {
                                                    data_formatada = $(this).parent().parent().find("#date_filter option:selected").val();
                                                } else if (data_indicator.period == "daily") {
                                                    data_formatada = $(this).parent().parent().find("#date_filter").val();
                                                }
                                            });

                                            var informou_valores = true;
                                            var informou_valores_validos = true;
                                            var informou_vvalores_validos = true;
                                            var informou_fontes = true;
                                            $.each(data_variables, function(index, value) {
                                                if ($("#dashboard-content .content .filter_result").find("#var_" + data_variables[index].id).val() == "") {
                                                    informou_valores = false;
                                                }
                                                var valor = $("#dashboard-content .content .filter_result").find("#var_" + data_variables[index].id).val();
                                                if ($("#dashboard-content .content .filter_result").find("#var_" + data_variables[index].id).is("input")) {
                                                    valor = $.convertNumberToBd(valor);
                                                    if (isNaN(valor)) {
                                                        informou_valores_validos = false;
                                                    }
                                                    if ($("#dashboard-content .content .filter_result").find("#var_" + data_variables[index].id).val() != "" &&
                                                        ($("#dashboard-content .content .filter_result").find("#source_" + data_variables[index].id).val() == "" ||
                                                            $("#dashboard-content .content .filter_result").find("#source_" + data_variables[index].id).val() == "_new")
                                                    ) {

                                                        informou_valores = true;
                                                        informou_fontes = false;
                                                    }
                                                }
                                            });

                                            if (data_vvariables.length > 0) {
                                                $.each(data_variations, function(index_variation, item_variation) {
                                                    $.each(data_vvariables, function(index_variables, item_variables) {
                                                        var valor = $("#dashboard-content .content .filter_result").find("#v_" + item_variation.id + "_var_" + item_variables.id).val();
                                                        valor = $.convertNumberToBd(valor);
                                                        if (isNaN(valor) && valor != "") {
                                                            informou_valores_validos = false;
                                                        }
                                                        /*                                                        if (!$.isInt(valor) && valor != ""){
                                                            informou_vvalores_validos = false;
                                                        }*/
                                                    });
                                                });
                                            }

                                            if (!informou_valores) {
                                                $(".filter_result .form-aviso").setWarning({
                                                    msg: "Por favor informe os valores ou justificativa"
                                                });
                                            } else if (!informou_valores_validos) {
                                                $(".filter_result .form-aviso").setWarning({
                                                    msg: "Os valores devem ser apenas numéricos"
                                                });
                                            } else if (!informou_vvalores_validos) {
                                                $(".filter_result .form-aviso").setWarning({
                                                    msg: "Os valores devem ser apenas números inteiros"
                                                });
                                            } else if (!informou_fontes) {
                                                $(".filter_result .form-aviso").setWarning({
                                                    msg: "Por favor informe a fonte dos valores"
                                                });
                                            } else {
                                                $("#dashboard-content .content .filter_result .botao-form[ref='enviar']").hide();

                                                var cont_total = data_variables.length;
                                                var cont_sent = 0;
                                                var cont_returned = 0;

                                                while (cont_sent < cont_total) {
                                                    if ($("#dashboard-content .content .filter_result").find("#var_" + data_variables[cont_sent].id).attr("disabled") == "disabled") {
                                                        cont_sent++;
                                                        cont_returned++;
                                                    } else {
                                                        var data_formatada = "";
                                                        if (data_indicator.period == "yearly" || data_indicator.period == "monthly") {
                                                            data_formatada = $("#dashboard-content .content .filter_indicator").find("#date_filter option:selected").val();
                                                        } else if (data_indicator.period == "daily") {
                                                            data_formatada = $("#dashboard-content .content .filter_indicator").find("#date_filter").val();
                                                        }


                                                        var url = api_path + '/api/city/$$city/region/$$region/value'.render2({
                                                            city: getIdFromUrl(user_info.city),
                                                            region: $("#region_id option:selected").val()
                                                        });
                                                        var prefix = "region.";

                                                        if (!$("#dashboard-content .content input#no_data").attr("checked")) {
                                                            args = [{
                                                                name: "api_key",
                                                                value: $.cookie("key")
                                                            }, {
                                                                name: prefix + "variable.value.put.value",
                                                                value: $.convertNumberToBd($("#dashboard-content .content .filter_result").find("#var_" + data_variables[cont_sent].id).val())
                                                            }, {
                                                                name: prefix + "variable.value.put.source",
                                                                value: $("#dashboard-content .content .filter_result").find("#source_" + data_variables[cont_sent].id).val()
                                                            }, {
                                                                name: prefix + "variable.value.put.observations",
                                                                value: $("#dashboard-content .content .filter_result").find("#observations_" + data_variables[cont_sent].id).val()
                                                            }, {
                                                                name: prefix + "variable.value.put.value_of_date",
                                                                value: data_formatada
                                                            }];
                                                        } else if ($("#dashboard-content .content .filter_result").find("#var_" + data_variables[cont_sent].id).val() == "") {
                                                            args = [{
                                                                name: "api_key",
                                                                value: $.cookie("key")
                                                            }, {
                                                                name: prefix + "variable.value.put.value",
                                                                value: ""
                                                            }, {
                                                                name: prefix + "variable.value.put.source",
                                                                value: ""
                                                            }, {
                                                                name: prefix + "variable.value.put.observations",
                                                                value: $("#dashboard-content .content .filter_result").find("#observations_" + data_variables[cont_sent].id).val()
                                                            }, {
                                                                name: prefix + "variable.value.put.value_of_date",
                                                                value: data_formatada
                                                            }];
                                                        } else {
                                                            args = [{
                                                                name: "api_key",
                                                                value: $.cookie("key")
                                                            }, {
                                                                name: prefix + "variable.value.put.value",
                                                                value: $.convertNumberToBd($("#dashboard-content .content .filter_result").find("#var_" + data_variables[cont_sent].id).val())
                                                            }, {
                                                                name: prefix + "variable.value.put.source",
                                                                value: $("#dashboard-content .content .filter_result").find("#source_" + data_variables[cont_sent].id).val()
                                                            }, {
                                                                name: prefix + "variable.value.put.observations",
                                                                value: $("#dashboard-content .content .filter_result").find("#observations_" + data_variables[cont_sent].id).val()
                                                            }, {
                                                                name: prefix + "variable.value.put.value_of_date",
                                                                value: data_formatada
                                                            }];
                                                        }

                                                        if ($("#region_id option:selected").val()) {
                                                            args.push({
                                                                name: prefix + "variable.value.put.variable_id",
                                                                value: data_variables[cont_sent].id
                                                            });
                                                            args.push({
                                                                name: prefix + "variable.value.put.user_id",
                                                                value: $.cookie("user.id")
                                                            });
                                                        }

                                                        $.ajax({
                                                            type: 'PUT',
                                                            dataType: 'json',
                                                            url: url,
                                                            data: args,
                                                            success: function(data, textStatus, jqXHR) {
                                                                cont_returned++;
                                                            },
                                                            error: function(data) {
                                                                $(".filter_result .form-aviso").setWarning({
                                                                    msg: "Erro ao editar. ($$erro)".render2({
                                                                        erro: data.statusText
                                                                    })
                                                                });
                                                                $("#dashboard-content .content .filter_result .botao-form[ref='enviar']").show();
                                                                cont_sent = 999999999999;
                                                                cont_returned = 0;
                                                            }
                                                        });
                                                        cont_sent++;
                                                    }
                                                }

                                                // se deu sucesso
                                                if (cont_sent == cont_total) {

                                                    var data_formatada = $("#dashboard-content .content .filter_indicator").find("#date_filter option:selected").val();

                                                    var acao = "user.indicator." + data.action + ".";

                                                    $("#aviso").setWarning({
                                                        msg: "Cadastro editado com sucesso.".render2({
                                                            codigo: jqXHR.status
                                                        })
                                                    });
                                                    $("#dashboard-content .content .filter_result .botao-form[ref='enviar']").show();
                                                    $("#dashboard-content .content .filter_result").empty();
                                                    //mostra historico
                                                    buildIndicatorHistory({
                                                        "id": getIdFromUrl($.getUrlVar("url")),
                                                        "period": data_indicator.period,
                                                        "target": $("#dashboard-content .content div.historico")
                                                    });


                                                }


                                            }
                                        });

                                        $("#dashboard-content .content .botao-form[ref='cancelar']").click(function() {
                                            resetWarnings();
                                            $("#dashboard-content .content .filter_result").empty();
                                        });

                                    },
                                    error: function(data) {
                                        $("#aviso").setWarning({
                                            msg: "Erro ao carregar ($$codigo)".render2({
                                                codigo: $.trataErro(data)
                                            })
                                        });
                                    }
                                });
                            });
                        }
                    });
                } else if ($.getUrlVar("option") == "unhide") {
                    $.loading();
                    var action = "update";
                    url_action = api_path + "/api/user/$$user_id/indicator_config/$$id".render2({
                        user_id: $.cookie("user.id"),
                        id: $.getUrlVar("config_id")
                    });
                    args = [{
                        name: "api_key",
                        value: $.cookie("key")
                    }, {
                        name: "user.indicator_config." + action + ".hide_indicator",
                        value: 0
                    }, {
                        name: "user.indicator_config." + action + ".indicator_id",
                        value: getIdFromUrl($.getUrlVar("url"))
                    }];

                    $.ajax({
                        type: "POST",
                        dataType: 'json',
                        url: url_action,
                        data: args,
                        success: function(data, textStatus, jqXHR) {
                            $("#aviso").setWarning({
                                msg: "Informação salva com sucesso.".render2({
                                    codigo: jqXHR.status
                                })
                            });
                            $.loading.hide();
                            location.hash = "#!/" + getUrlSub();
                        },
                        error: function(data) {
                            $("#aviso").setWarning({
                                msg: "Erro ao salvar. ($$erro)".render2({
                                    erro: $.trataErro(data)
                                })
                            });
                            $.loading.hide();
                        }
                    });
                }
            } else if (getUrlSub() == "mygroup") {
                /*  GRUPOS DE INDICADORES  */
                if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {

                    var userList = buildDataTable({
                        headers: ["Nome", "_"]
                    });

                    $("#dashboard-content .content").append(userList);

                    $("#button-add").click(function() {
                        resetWarnings();
                        location.hash = "#!/" + getUrlSub() + "?option=add";
                    });

                    $("#results").dataTable({
                        iDisplayLength: 50,
                        "oLanguage": get_datatable_lang(),
                        "bProcessing": true,
                        "sAjaxSource": api_path + '/api/user_indicator_axis?api_key=$$key&content-type=application/json&lang=$$lang&columns=name,url,_,_'.render2({
                            lang: cur_lang,
                            key: $.cookie("key")
                        }),
                        "aoColumnDefs": [{
                            "bSearchable": false,
                            "bSortable": false,
                            "sClass": "botoes",
                            "sWidth": "60px",
                            "aTargets": [1]
                        }],
                        "fnDrawCallback": function() {
                            DTdesenhaBotoes();
                        }
                    });

                } else if ($.getUrlVar("option") == "add" || $.getUrlVar("option") == "edit") {

                    var txtOption = ($.getUrlVar("option") == "add") ? "$$e".render({
                        e: 'Cadastrar'
                    }) : "$$e".render({
                        e: 'Editar'
                    });

                    var newform = [];

                    newform.push({
                        label: "Nome",
                        input: ["text,name,itext"]
                    });
                    newform.push({
                        label: "Indicadores",
                        input: ["textarea,indicators,itext"]
                    });

                    var formbuild = $("#dashboard-content .content").append(buildForm(newform, txtOption));
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
                        url: api_path + '/api/indicator?api_key=$$key'.render2({
                            key: $.cookie("key")
                        }),
                        success: function(data, textStatus, jqXHR) {
                            // ordena indicadores pelo nome
                            data.indicators.sort(function(a, b) {
                                a = a.name,
                                    b = b.name;

                                return a.localeCompare(b);
                            });

                            $.each(data.indicators, function(index, item) {
                                $("#group-editor .indicator-list").append($("<div class='item'></div>").attr({
                                    "indicator-id": item.id
                                }).html(item.name));
                            });
                        },
                        error: function(data) {
                            $("#aviso").setWarning({
                                msg: "Erro ao carregar ($$codigo)".render2({
                                    codigo: $.trataErro(data)
                                })
                            });
                        }
                    });

                    $("#group-editor #indicator-search").keyup(function() {
                        if ($(this).val() != "") {
                            $("#group-editor .indicator-list :not(.remove, .no-items)").hide();
                            var termo = $(this).val();
                            var matches = $('#group-editor .indicator-list  :not(.remove, .no-items)').filter(function() {
                                var match = normalize(termo);

                                var pattern = match;
                                var re = new RegExp(pattern, 'g');

                                return re.test(normalize($(this).text()));
                            });
                            $(matches).fadeIn();
                        }
                    });

                    $("#group-editor .indicator-list .item").click(function(e) {
                        if ($(this).hasClass("no-items")) {
                            return;
                        }
                        $(this).toggleClass("selected");
                        if ($("#group-editor .indicator-list .selected").length > 0) {
                            $("#group-editor #indicator-add").addClass("active");
                        } else {
                            $("#group-editor #indicator-add").removeClass("active");
                        }
                    });
                    $("#group-editor #indicator-add").live('click', function(e) {
                        e.preventDefault();
                        if ($(this).hasClass("active")) {
                            addIndicatorList();
                        }
                    });

                    $("#group-editor #indicator-remove").live('click', function(e) {
                        e.preventDefault();
                        if ($(this).hasClass("active")) {
                            removeIndicatorList();
                        }
                    });

                    function addIndicatorList() {
                        $("#group-editor .indicator-list .selected").each(function(index, item) {
                            $("#group-editor .indicator-list-selected").append($("<div class='item'></div>").attr({
                                "indicator-id": $(item).attr("indicator-id")
                            }).html($(item).text()));
                            $(item).removeClass("selected");
                            $(item).addClass("remove");
                        });
                        $("#group-editor .indicator-list-selected .no-items").remove();
                        $("#group-editor #indicator-add").removeClass("active");

                        if ($("#group-editor .indicator-list :not(.remove)").length <= 0) {
                            $("#group-editor .indicator-list").append($("<div class='item no-items'></div>").html("nenhum indicador selecionado"));
                        }

                        $("#group-editor .indicator-list-selected .item").unbind();
                        $("#group-editor .indicator-list-selected .item").click(function(e) {
                            if ($(this).hasClass("no-items")) {
                                return;
                            }
                            $(this).toggleClass("selected");
                            if ($("#group-editor .indicator-list-selected .selected").length > 0) {
                                $("#group-editor #indicator-remove").addClass("active");
                            } else {
                                $("#group-editor #indicator-remove").removeClass("active");
                            }
                        });
                    }

                    function removeIndicatorList() {
                        $("#group-editor .indicator-list-selected .selected").each(function(index, item) {
                            $("#group-editor .indicator-list .item[indicator-id='$$id']".render({
                                id: $(item).attr("indicator-id")
                            })).removeClass("remove");
                            $(item).remove();
                        });
                        if ($("#group-editor .indicator-list-selected .item").length <= 0) {
                            $("#group-editor .indicator-list-selected").append($("<div class='item no-items'></div>").html("nenhum indicador selecionado"));
                        }
                        $("#group-editor #indicator-remove").removeClass("active");
                        $("#group-editor .indicator-list .no-items").remove();
                    }

                    function getSelectedIndicators() {
                        var selectedIndicators = [];
                        $("#group-editor .indicator-list-selected .item").each(function(index, item) {
                            if (!$(item).hasClass("no-items")) {
                                selectedIndicators.push($(item).attr("indicator-id"));
                            }
                        });
                        return selectedIndicators;
                    }

                    if ($.getUrlVar("option") == "edit") {
                        $.ajax({
                            async: false,
                            type: 'GET',
                            dataType: 'json',
                            url: $.getUrlVar("url") + "?api_key=$$key".render2({
                                key: $.cookie("key")
                            }),
                            success: function(data, status, jqXHR) {
                                switch (jqXHR.status) {
                                    case 200:
                                        $(formbuild).find("input#name").val(data.name);
                                        if (data.items.length > 0) {
                                            var selectedIndicators = [];
                                            $.each(data.items, function(index, item) {
                                                selectedIndicators.push(item.indicator_id);
                                                $("#group-editor .indicator-list .item[indicator-id='$$id']".render({
                                                    id: item.indicator_id
                                                })).attr("item-id", item.id);
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
                            error: function(data) {
                                switch (data.status) {
                                    case 400:
                                        $(".form-aviso").setWarning({
                                            msg: "Erro: ($$codigo)".render2({
                                                codigo: $.trataErro(data)
                                            })
                                        });
                                        break;
                                }
                            }
                        });
                    }

                    $("#dashboard-content .content .botao-form[ref='enviar']").click(function() {
                        resetWarnings();
                        if ($(this).parent().parent().find("#name").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe o Nome"
                            });
                        } else if (getSelectedIndicators().length <= 0) {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe pelo menos um Indicador"
                            });
                        } else {

                            if ($.getUrlVar("option") == "add") {
                                var action = "create";
                                var method = "POST";
                                var url_action = api_path + '/api/user_indicator_axis';
                            } else {
                                var action = "update";
                                var method = "POST";
                                var url_action = $.getUrlVar("url");
                            }

                            args = [{
                                name: "api_key",
                                value: $.cookie("key")
                            }, {
                                name: "user_indicator_axis." + action + ".name",
                                value: $(this).parent().parent().find("#name").val()
                            }];

                            $("#dashboard-content .content .botao-form[ref='enviar']").hide();
                            $.ajax({
                                type: method,
                                dataType: 'json',
                                url: url_action,
                                data: args,
                                success: function(data, textStatus, jqXHR) {
                                    newId = data.id;
                                    var selected = getSelectedIndicators();
                                    $.each(selected, function(index, value) {
                                        if (!findInArray($("#dashboard-content .content textarea#indicators").val().split(","), value)) {
                                            args = [{
                                                name: "api_key",
                                                value: $.cookie("key")
                                            }, {
                                                name: "user_indicator_axis_item.create.indicator_id",
                                                value: value
                                            }, {
                                                name: "user_indicator_axis_item.create.position",
                                                value: index
                                            }];
                                            $.ajax({
                                                async: false,
                                                type: 'POST',
                                                dataType: 'json',
                                                url: api_path + '/api/user_indicator_axis/$$id/item'.render2({
                                                    id: newId
                                                }),
                                                data: args
                                            });
                                        }
                                    });

                                    if ($.getUrlVar("option") == "edit") {
                                        var old_selected = $("#dashboard-content .content textarea#indicators").val().split(",");
                                        $.each(old_selected, function(index, value) {
                                            if (!findInArray(selected, value)) {
                                                $.ajax({
                                                    async: false,
                                                    type: 'DELETE',
                                                    dataType: 'json',
                                                    url: api_path + '/api/user_indicator_axis/$$id/item/$$item_id'.render2({
                                                        id: newId,
                                                        item_id: $("#group-editor .indicator-list .item[indicator-id='" + value + "']").attr("item-id")
                                                    }),
                                                    data: args
                                                });
                                            }
                                        });
                                    }
                                    $("#aviso").setWarning({
                                        msg: "Cadastro editado com sucesso."
                                    });
                                    location.hash = "#!/" + getUrlSub();
                                    $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                },
                                error: function(data) {
                                    $(".form-aviso").setWarning({
                                        msg: "Erro ao editar. ($$erro)".render2({
                                            erro: $.trataErro(data)
                                        })
                                    });
                                    $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                }
                            });
                        }
                    });

                    $("#dashboard-content .content .botao-form[ref='cancelar']").click(function() {
                        resetWarnings();
                        history.back();
                    });
                } else if ($.getUrlVar("option") == "delete") {
                    deleteRegister({
                        url: $.getUrlVar("url") + "?api_key=$$key".render2({
                            key: $.cookie("key")
                        })
                    });
                }
            } else if (getUrlSub() == "css") {
                /*  CSS  */
                if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {

                    $("#dashboard-content .content").append("<div class='upload_css'></div>");
                    var newform = [];
                    newform.push({
                        label: "Arquivo CSS",
                        input: ["file,arquivo,itext"]
                    });
                    var formbuild = $("#dashboard-content .content .upload_css").append(buildForm(newform, "Customizar CSS"));
                    $(formbuild).find("div .field:odd").addClass("odd");
                    $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());
                    $("#dashboard-content .content .upload_css .botao-form[ref='cancelar']").hide()

                    $("#dashboard-content .content .upload_css .botao-form[ref='enviar']").click(function() {

                        var clickedButton = $(this);

                        var file = "arquivo";
                        var form = $("#formFileUpload_" + file);

                        original_id = $('#arquivo_' + file).attr("original-id");

                        $('#arquivo_' + file).attr({
                            name: "arquivo",
                            id: "arquivo"
                        });

                        form.attr("action", api_path + '/api/user/$$user_id/arquivo/custom.css?api_key=$$key&content-type=application/json'.render2({
                            key: $.cookie("key"),
                            user_id: $.cookie("user.id")
                        }));
                        form.attr("method", "post");
                        form.attr("enctype", "multipart/form-data");
                        form.attr("encoding", "multipart/form-data");
                        form.attr("target", "iframe_" + file);
                        form.attr("file", $('#arquivo').val());
                        form.submit();
                        $('#arquivo').attr({
                            name: original_id,
                            id: original_id
                        });

                        $("#iframe_" + file).load(function() {

                            var erro = 0;
                            if ($(this).contents()) {
                                if ($(this).contents()[0].body) {
                                    if ($(this).contents()[0].body.outerHTML) {
                                        var retorno = $(this).contents()[0].body.outerHTML;
                                        retorno = $(retorno).text();
                                        retorno = $.parseJSON(retorno);
                                    } else {
                                        erro = 1;
                                    }
                                } else {
                                    erro = 1;
                                }
                            } else {
                                erro = 1;
                            }

                            if (erro == 0) {
                                if (!retorno.error) {
                                    $(".upload_css .form-aviso").setWarning({
                                        msg: "Arquivo enviado com sucesso"
                                    });
                                    $(clickedButton).html("Enviar");
                                    $(clickedButton).attr("is-disabled", 0);
                                } else {
                                    $(".upload_css .form-aviso").setWarning({
                                        msg: "Erro ao enviar arquivo (" + retorno.error + ")"
                                    });
                                    $(clickedButton).html("Enviar");
                                    $(clickedButton).attr("is-disabled", 0);
                                    return;
                                }
                            } else {

                                $(".value_via_file .form-aviso").setWarning({
                                    msg: "Erro ao enviar arquivo"
                                });
                                $(clickedButton).html("Enviar");
                                $(clickedButton).attr("is-disabled", 0);
                                return;
                            }
                        });
                    });
                }
            } else if (getUrlSub() == "menus") {
                /*  Menus  */
                var data_menus = [];
                if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {

                    $.ajax({
                        async: false,
                        type: 'GET',
                        dataType: 'json',
                        url: api_path + "/api/menu?api_key=$$key".render2({
                            key: $.cookie("key")
                        }),
                        success: function(data, status, jqXHR) {
                            data.menus.sort(function(a, b) {
                                a = String(a.title),
                                    b = String(b.title);
                                return a.localeCompare(b);
                            });
                            $.each(data.menus, function(index, item) {
                                data_menus[item.id] = item.title;
                            });
                        }
                    });

                    var userList = buildDataTable({
                        headers: ["Título", "Pai", "Posição", "_"]
                    });

                    $("#dashboard-content .content").append(userList);

                    $("#button-add").click(function() {
                        resetWarnings();
                        location.hash = "#!/" + getUrlSub() + "?option=add";
                    });

                    $("#results").dataTable({
                        iDisplayLength: 50,
                        "oLanguage": get_datatable_lang(),
                        "bProcessing": true,
                        "sAjaxSource": api_path + '/api/menu?api_key=$$key&content-type=application/json&lang=$$lang&columns=title,menu_id,position,url,_,_'.render2({
                            lang: cur_lang,
                            key: $.cookie("key")
                        }),
                        "aoColumnDefs": [{
                            "bSearchable": false,
                            "bSortable": false,
                            "sClass": "botoes",
                            "sWidth": "60px",
                            "aTargets": [3]
                        }, {
                            "sClass": "center",
                            "aTargets": [1, 2]
                        }, {
                            "fnRender": function(oObj, sVal) {
                                if (!sVal) {
                                    sVal = "--";
                                } else {
                                    sVal = data_menus[parseInt(sVal)];
                                }
                                return sVal;
                            },
                            "aTargets": [1]
                        }],
                        "aaSorting": [
                            [1, 'asc'],
                            [2, 'asc']
                        ],
                        "fnDrawCallback": function() {
                            DTdesenhaBotoes();
                        }
                    });

                } else if ($.getUrlVar("option") == "add" || $.getUrlVar("option") == "edit") {

                    var txtOption = ($.getUrlVar("option") == "add") ? "$$e".render({
                        e: 'Cadastrar'
                    }) : "$$e".render({
                        e: 'Editar'
                    });

                    var newform = [];

                    newform.push({
                        label: "Menu Pai",
                        input: ["select,menu_id,iselect"]
                    });
                    newform.push({
                        label: "Título",
                        input: ["text,title,itext"]
                    });
                    newform.push({
                        label: "Posição",
                        input: ["select,position,iselect"]
                    });
                    newform.push({
                        label: "Página",
                        input: ["select,page_id,iselect"]
                    });

                    var formbuild = $("#dashboard-content .content").append(buildForm(newform, txtOption));
                    $(formbuild).find("div .field:odd").addClass("odd");
                    $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

                    $(formbuild).find("#title").qtip($.extend(true, {}, qtip_input, {
                        content: "Título do Menu."
                    }));

                    $("#dashboard-content .content select#menu_id").append($("<option></option>").val("").html("Nenhum"));
                    $.ajax({
                        async: false,
                        type: 'GET',
                        dataType: 'json',
                        url: api_path + "/api/menu?api_key=$$key".render2({
                            key: $.cookie("key")
                        }),
                        success: function(data, status, jqXHR) {
                            data.menus.sort(function(a, b) {
                                a = String(a.title),
                                    b = String(b.title);
                                return a.localeCompare(b);
                            });
                            $.each(data.menus, function(index, item) {
                                if (!data.menu_id) {
                                    $("#dashboard-content .content select#menu_id").append($("<option></option>").val(item.id).html(item.title));
                                }
                            });
                        }
                    });

                    for (i = 0; i <= 10; i++) {
                        $("#dashboard-content .content select#position").append($("<option></option>").val(i).html(i));
                    }

                    $("#dashboard-content .content select#page_id").append($("<option></option>").val("").html("$$e".render({
                        e: 'Nenhuma'
                    })));
                    $.ajax({
                        async: false,
                        type: 'GET',
                        dataType: 'json',
                        url: api_path + "/api/page?api_key=$$key".render2({
                            key: $.cookie("key")
                        }),
                        success: function(data, status, jqXHR) {
                            data.pages.sort(function(a, b) {
                                a = String(a.title),
                                    b = String(b.title);
                                return a.localeCompare(b);
                            });
                            $.each(data.pages, function(index, item) {
                                if (!data.page_id) {
                                    $("#dashboard-content .content select#page_id").append($("<option></option>").val(item.id).html(item.title + " - url: " + item.title_url));
                                }
                            });
                        }
                    });

                    if ($.getUrlVar("option") == "edit") {
                        $.ajax({
                            type: 'GET',
                            dataType: 'json',
                            url: $.getUrlVar("url") + "?api_key=$$key".render2({
                                key: $.cookie("key")
                            }),
                            success: function(data, status, jqXHR) {
                                switch (jqXHR.status) {
                                    case 200:
                                        $(formbuild).find("select#menu_id").val(data.menu_id);
                                        $(formbuild).find("input#title").val(data.title);
                                        $(formbuild).find("select#position").val(data.position);
                                        $(formbuild).find("select#page_id").val(data.page_id);
                                        break;
                                }
                            },
                            error: function(data) {
                                switch (data.status) {
                                    case 400:
                                        $(".form-aviso").setWarning({
                                            msg: "Erro: ($$codigo)".render2({
                                                codigo: $.trataErro(data)
                                            })
                                        });
                                        break;
                                }
                            }
                        });
                    }

                    $("#dashboard-content .content .botao-form[ref='enviar']").click(function() {
                        resetWarnings();
                        if ($(this).parent().parent().find("#institute_id option:selected").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe o Título"
                            });
                        } else {

                            if ($.getUrlVar("option") == "add") {
                                var action = "create";
                                var method = "POST";
                                var url_action = api_path + "/api/menu";
                            } else {
                                var action = "update";
                                var method = "POST";
                                var url_action = $.getUrlVar("url");
                            }

                            args = [{
                                name: "api_key",
                                value: $.cookie("key")
                            }, {
                                name: "menu." + action + ".menu_id",
                                value: $(this).parent().parent().find("#menu_id option:selected").val()
                            }, {
                                name: "menu." + action + ".title",
                                value: $(this).parent().parent().find("#title").val()
                            }, {
                                name: "menu." + action + ".position",
                                value: $(this).parent().parent().find("#position option:selected").val()
                            }, {
                                name: "menu." + action + ".page_id",
                                value: $(this).parent().parent().find("#page_id option:selected").val()
                            }];
                            $("#dashboard-content .content .botao-form[ref='enviar']").hide();
                            $.ajax({
                                type: method,
                                dataType: 'json',
                                url: url_action,
                                data: args,
                                success: function(data, status, jqXHR) {
                                    $("#aviso").setWarning({
                                        msg: "Operação efetuada com sucesso.".render2({
                                            codigo: jqXHR.status
                                        })
                                    });
                                    location.hash = "#!/" + getUrlSub();
                                },
                                error: function(data) {
                                    switch (data.status) {
                                        case 400:
                                            $("#aviso").setWarning({
                                                msg: "Erro ao $$operacao. ($$codigo)".render2({
                                                    operacao: txtOption,
                                                    codigo: $.trataErro(data)
                                                })
                                            });
                                            break;
                                    }
                                    $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                }
                            });
                        }
                    });
                    $("#dashboard-content .content .botao-form[ref='cancelar']").click(function() {
                        resetWarnings();
                        history.back();
                    });
                } else if ($.getUrlVar("option") == "delete") {
                    deleteRegister({
                        url: $.getUrlVar("url") + "?api_key=$$key".render2({
                            key: $.cookie("key")
                        })
                    });
                }
            } else if (getUrlSub() == "pages") {
                /*  Páginas  */
                if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {

                    var userList = buildDataTable({
                        headers: ["Título", "Url", "_"]
                    });

                    $("#dashboard-content .content").append(userList);

                    $("#button-add").click(function() {
                        resetWarnings();
                        location.hash = "#!/" + getUrlSub() + "?option=add";
                    });

                    $("#results").dataTable({
                        iDisplayLength: 50,
                        "oLanguage": get_datatable_lang(),
                        "bProcessing": true,
                        "sAjaxSource": api_path + '/api/page?api_key=$$key&content-type=application/json&lang=$$lang&columns=title,title_url,url,_,_'.render2({
                            lang: cur_lang,
                            key: $.cookie("key")
                        }),
                        "aoColumnDefs": [{
                            "bSearchable": false,
                            "bSortable": false,
                            "sClass": "botoes",
                            "sWidth": "60px",
                            "aTargets": [2]
                        }],
                        "fnDrawCallback": function() {
                            DTdesenhaBotoes();
                        }
                    });

                } else if ($.getUrlVar("option") == "add" || $.getUrlVar("option") == "edit") {

                    var txtOption = ($.getUrlVar("option") == "add") ? "$$e".render({
                        e: 'Cadastrar'
                    }) : "$$e".render({
                        e: 'Editar'
                    });

                    var newform = [];

                    newform.push({
                        label: "Título",
                        input: ["text,title,itext"]
                    });
                    newform.push({
                        label: "Conteúdo",
                        input: ["textarea,page_content"]
                    });

                    var formbuild = $("#dashboard-content .content").append(buildForm(newform, txtOption));
                    $(formbuild).find("div .field:odd").addClass("odd");
                    $(formbuild).find(".form").width(800);
                    $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

                    $(formbuild).find("#title").qtip($.extend(true, {}, qtip_input, {
                        content: "Título da Página."
                    }));

                    if ($.getUrlVar("option") == "edit") {
                        $.ajax({
                            async: false,
                            type: 'GET',
                            dataType: 'json',
                            url: $.getUrlVar("url") + "?api_key=$$key".render2({
                                key: $.cookie("key")
                            }),
                            success: function(data, status, jqXHR) {
                                switch (jqXHR.status) {
                                    case 200:
                                        $(formbuild).find("input#title").val(data.title);

                                        $(formbuild).find("textarea#page_content").val(data.content);
                                        break;
                                }
                            },
                            error: function(data) {
                                switch (data.status) {
                                    case 400:
                                        $(".form-aviso").setWarning({
                                            msg: "Erro: ($$codigo)".render2({
                                                codigo: $.trataErro(data)
                                            })
                                        });
                                        break;
                                }
                            }
                        });
                    }

                    var editor = new TINY.editor.edit('editor', {
                        id: 'page_content',
                        width: 600,
                        height: 175,
                        cssclass: 'tinyeditor',
                        controlclass: 'tinyeditor-control',
                        rowclass: 'tinyeditor-header',
                        dividerclass: 'tinyeditor-divider',
                        controls: ['bold', 'italic', 'underline', 'strikethrough', '|', 'subscript', 'superscript', '|',
                            'orderedlist', 'unorderedlist', '|', 'outdent', 'indent', '|', 'leftalign',
                            'centeralign', 'rightalign', 'blockjustify', '|', 'unformat', '|', 'undo', 'redo', 'n',
                            'size', 'style', '|', 'image', 'hr', 'link', 'unlink'
                        ],
                        footer: true,
                        fonts: ['Asap'],
                        xhtml: true,
                        cssfile: '../js/tinyeditor/custom.css',
                        bodyid: 'editor',
                        footerclass: 'tinyeditor-footer',
                        toggle: {
                            text: 'código-fonte',
                            activetext: 'wysiwyg',
                            cssclass: 'toggle'
                        },
                        resize: {
                            cssclass: 'resize'
                        }
                    });

                    $("#dashboard-content .content .botao-form[ref='enviar']").click(function() {
                        resetWarnings();
                        if ($(this).parent().parent().find("#institute_id option:selected").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe o Título"
                            });
                        } else {

                            if ($.getUrlVar("option") == "add") {
                                var action = "create";
                                var method = "POST";
                                var url_action = api_path + "/api/page";
                            } else {
                                var action = "update";
                                var method = "POST";
                                var url_action = $.getUrlVar("url");
                            }

                            editor.post();

                            args = [{
                                name: "api_key",
                                value: $.cookie("key")
                            }, {
                                name: "page." + action + ".title",
                                value: $(this).parent().parent().find("#title").val()
                            }, {
                                name: "page." + action + ".content",
                                value: $(this).parent().parent().find("#page_content").val()
                            }];
                            $("#dashboard-content .content .botao-form[ref='enviar']").hide();
                            $.ajax({
                                type: method,
                                dataType: 'json',
                                url: url_action,
                                data: args,
                                success: function(data, status, jqXHR) {
                                    $("#aviso").setWarning({
                                        msg: "Operação efetuada com sucesso.".render2({
                                            codigo: jqXHR.status
                                        })
                                    });
                                    location.hash = "#!/" + getUrlSub();
                                },
                                error: function(data) {
                                    switch (data.status) {
                                        case 400:
                                            $("#aviso").setWarning({
                                                msg: "Erro ao $$operacao. ($$codigo)".render2({
                                                    operacao: txtOption,
                                                    codigo: $.trataErro(data)
                                                })
                                            });
                                            break;
                                    }
                                    $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                }
                            });
                        }
                    });
                    $("#dashboard-content .content .botao-form[ref='cancelar']").click(function() {
                        resetWarnings();
                        history.back();
                    });
                } else if ($.getUrlVar("option") == "delete") {
                    deleteRegister({
                        url: $.getUrlVar("url") + "?api_key=$$key".render2({
                            key: $.cookie("key")
                        })
                    });
                }
            } else if (getUrlSub() == "best_pratice") {
                /*  Boas Práticas  */
                if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {

                    var userList = buildDataTable({
                        headers: ["Nome", "Url", "_"]
                    });

                    $("#dashboard-content .content").append(userList);

                    $("#button-add").click(function() {
                        resetWarnings();
                        location.hash = "#!/" + getUrlSub() + "?option=add";
                    });

                    $("#results").dataTable({
                        iDisplayLength: 50,
                        "oLanguage": get_datatable_lang(),
                        "bProcessing": true,
                        "sAjaxSource": api_path + '/api/best_pratice?api_key=$$key&content-type=application/json&lang=$$lang&columns=name,name_url,url,_,_'.render2({
                            lang: cur_lang,
                            key: $.cookie("key")
                        }),
                        "aoColumnDefs": [{
                            "bSearchable": false,
                            "bSortable": false,
                            "sClass": "botoes",
                            "sWidth": "60px",
                            "aTargets": [2]
                        }],
                        "fnDrawCallback": function() {
                            DTdesenhaBotoes();
                        }
                    });

                } else if ($.getUrlVar("option") == "add" || $.getUrlVar("option") == "edit") {

                    var txtOption = ($.getUrlVar("option") == "add") ? "$$e".render({
                        e: 'Cadastrar'
                    }) : "$$e".render({
                        e: 'Editar'
                    });

                    var newform = [];

                    newform.push({
                        label: "Eixo",
                        input: ["select,axis_id,iselect"]
                    });
                    newform.push({
                        label: "Nome",
                        input: ["text,name,itext"]
                    });
                    newform.push({
                        label: "Descrição",
                        input: ["textarea,description"]
                    });
                    newform.push({
                        label: "Objetivos",
                        input: ["textarea,goals"]
                    });
                    newform.push({
                        label: "Cronograma",
                        input: ["textarea,schedule"]
                    });
                    newform.push({
                        label: "Resultados",
                        input: ["textarea,results"]
                    });
                    newform.push({
                        label: "Instituições envolvidas",
                        input: ["textarea,institutions_involved"]
                    });
                    newform.push({
                        label: "Contatos",
                        input: ["textarea,contacts"]
                    });
                    newform.push({
                        label: "Fontes",
                        input: ["textarea,sources"]
                    });
                    newform.push({
                        label: "Tags",
                        input: ["text,tags,itext"]
                    });

                    var formbuild = $("#dashboard-content .content").append(buildForm(newform, txtOption));
                    $(formbuild).find("div .field:odd").addClass("odd");
                    $(formbuild).find(".form").width(800);
                    $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

                    $(formbuild).find("#title").qtip($.extend(true, {}, qtip_input, {
                        content: "Título da Página."
                    }));

                    $.ajax({
                        type: 'GET',
                        dataType: 'json',
                        url: api_path + '/api/axis?api_key=$$key'.render2({
                            key: $.cookie("key")
                        }),
                        success: function(data, textStatus, jqXHR) {
                            data.axis.sort(function(a, b) {
                                a = a.name,
                                    b = b.name;

                                return a.localeCompare(b);
                            });
                            $.each(data.axis, function(index, item) {
                                $("#dashboard-content .content select#axis_id").append($("<option></option>").val(item.id).html(item.name));
                            });
                            if ($("#dashboard-content .content select#axis_id").attr("selected-id")) {
                                $("#dashboard-content .content select#axis_id").val($("#dashboard-content .content select#axis_id").attr("selected-id"));
                                $("#dashboard-content .content select#axis_id").attr("selected-id", "")
                            }

                        },
                        error: function(data) {
                            $("#aviso").setWarning({
                                msg: "Erro ao carregar ($$codigo)".render2({
                                    codigo: $.trataErro(data)
                                })
                            });
                        }
                    });

                    if ($.getUrlVar("option") == "edit") {
                        $.ajax({
                            async: false,
                            type: 'GET',
                            dataType: 'json',
                            url: $.getUrlVar("url") + "?api_key=$$key".render2({
                                key: $.cookie("key")
                            }),
                            success: function(data, status, jqXHR) {
                                switch (jqXHR.status) {
                                    case 200:
                                        $(formbuild).find("input#name").val(data.name);

                                        $(formbuild).find("textarea#description").val(data.description);
                                        $(formbuild).find("textarea#goals").val(data.goals);
                                        $(formbuild).find("textarea#schedule").val(data.schedule);
                                        $(formbuild).find("textarea#results").val(data.results);
                                        $(formbuild).find("textarea#institutions_involved").val(data.institutions_involved);
                                        $(formbuild).find("textarea#contacts").val(data.contatcts);
                                        $(formbuild).find("textarea#sources").val(data.sources);
                                        if (!($(formbuild).find("textarea#sources").val() == data.sources)) {
                                            $(formbuild).find("textarea#sources").append($("<option></option>").val(data.sources).html(data.sources).attr("source-id", '?'));
                                            $(formbuild).find("textarea#sources").val(data.sources);
                                        }

                                        $(formbuild).find("input#tags").val(data.tags);
                                        $(formbuild).find("select#axis_id").val(data.axis_id);
                                        $(formbuild).find("select#axis_id").attr("selected-id", data.axis_id);
                                        break;
                                }
                            },
                            error: function(data) {
                                switch (data.status) {
                                    case 400:
                                        $(".form-aviso").setWarning({
                                            msg: "Erro: ($$codigo)".render2({
                                                codigo: $.trataErro(data)
                                            })
                                        });
                                        break;
                                }
                            }
                        });
                    }

                    var default_params = {
                        id: 'description',
                        width: 600,
                        height: 175,
                        cssclass: 'tinyeditor',
                        controlclass: 'tinyeditor-control',
                        rowclass: 'tinyeditor-header',
                        dividerclass: 'tinyeditor-divider',
                        controls: ['bold', 'italic', 'underline', 'strikethrough', '|', 'subscript', 'superscript', '|',
                            'orderedlist', 'unorderedlist', '|', 'outdent', 'indent', '|', 'leftalign',
                            'centeralign', 'rightalign', 'blockjustify', '|', 'unformat', '|', 'undo', 'redo', 'n',
                            'size', 'style', '|', 'image', 'hr', 'link', 'unlink'
                        ],
                        footer: true,
                        fonts: ['Asap'],
                        xhtml: true,
                        cssfile: '../js/tinyeditor/custom.css',
                        bodyid: 'editor',
                        footerclass: 'tinyeditor-footer',
                        toggle: {
                            text: 'código-fonte',
                            activetext: 'wysiwyg',
                            cssclass: 'toggle'
                        },
                        resize: {
                            cssclass: 'resize'
                        }
                    };

                    default_params.id = 'description';
                    default_params.bodyid = 'editorDescricao';
                    var editorDescricao = new TINY.editor.edit('editorDescricao', default_params);

                    default_params.id = 'goals';
                    default_params.bodyid = 'editorObjetivos';
                    var editorObjetivos = new TINY.editor.edit('editorObjetivos', default_params);

                    default_params.id = 'schedule';
                    default_params.bodyid = 'editorCronograma';
                    var editorCronograma = new TINY.editor.edit('editorCronograma', default_params);

                    default_params.id = 'results';
                    default_params.bodyid = 'editorResultados';
                    var editorResultados = new TINY.editor.edit('editorResultados', default_params);

                    default_params.id = 'institutions_involved';
                    default_params.bodyid = 'editorInstituicoes';
                    var editorInstituicoes = new TINY.editor.edit('editorInstituicoes', default_params);

                    default_params.id = 'contacts';
                    default_params.bodyid = 'editorContatos';
                    var editorContatos = new TINY.editor.edit('editorContatos', default_params);

                    default_params.id = 'sources';
                    default_params.bodyid = 'editorFontes';
                    var editorFontes = new TINY.editor.edit('editorFontes', default_params);

                    $("#dashboard-content .content .botao-form[ref='enviar']").click(function() {
                        resetWarnings();
                        if ($(this).parent().parent().find("#institute_id option:selected").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe o Título"
                            });
                        } else {

                            if ($.getUrlVar("option") == "add") {
                                var action = "create";
                                var method = "POST";
                                var url_action = api_path + "/api/best_pratice";
                            } else {
                                var action = "update";
                                var method = "POST";
                                var url_action = $.getUrlVar("url");
                            }

                            editorDescricao.post();
                            editorObjetivos.post();
                            editorCronograma.post();
                            editorResultados.post();
                            editorInstituicoes.post();
                            editorContatos.post();
                            editorFontes.post();

                            args = [{
                                name: "api_key",
                                value: $.cookie("key")
                            }, {
                                name: "best_pratice." + action + ".name",
                                value: $(this).parent().parent().find("#name").val()
                            }, {
                                name: "best_pratice." + action + ".description",
                                value: $(this).parent().parent().find("#description").val()
                            }, {
                                name: "best_pratice." + action + ".goals",
                                value: $(this).parent().parent().find("#goals").val()
                            }, {
                                name: "best_pratice." + action + ".schedule",
                                value: $(this).parent().parent().find("#schedule").val()
                            }, {
                                name: "best_pratice." + action + ".results",
                                value: $(this).parent().parent().find("#results").val()
                            }, {
                                name: "best_pratice." + action + ".institutions_involved",
                                value: $(this).parent().parent().find("#institutions_involved").val()
                            }, {
                                name: "best_pratice." + action + ".contatcts",
                                value: $(this).parent().parent().find("#contacts").val()
                            }, {
                                name: "best_pratice." + action + ".sources",
                                value: $(this).parent().parent().find("#sources").val()
                            }, {
                                name: "best_pratice." + action + ".tags",
                                value: $(this).parent().parent().find("#tags").val()
                            }, {
                                name: "best_pratice." + action + ".axis_id",
                                value: $(this).parent().parent().find("#axis_id option:selected").val()
                            }];

                            $("#dashboard-content .content .botao-form[ref='enviar']").hide();
                            $.ajax({
                                type: method,
                                dataType: 'json',
                                url: url_action,
                                data: args,
                                success: function(data, status, jqXHR) {
                                    $("#aviso").setWarning({
                                        msg: "Operação efetuada com sucesso.".render2({
                                            codigo: jqXHR.status
                                        })
                                    });
                                    location.hash = "#!/" + getUrlSub();
                                },
                                error: function(data) {
                                    switch (data.status) {
                                        case 400:
                                            $("#aviso").setWarning({
                                                msg: "Erro ao $$operacao. ($$codigo)".render2({
                                                    operacao: txtOption,
                                                    codigo: $.trataErro(data)
                                                })
                                            });
                                            break;
                                    }
                                    $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                }
                            });
                        }
                    });
                    $("#dashboard-content .content .botao-form[ref='cancelar']").click(function() {
                        resetWarnings();
                        history.back();
                    });
                } else if ($.getUrlVar("option") == "delete") {
                    deleteRegister({
                        url: $.getUrlVar("url") + "?api_key=$$key".render2({
                            key: $.cookie("key")
                        })
                    });
                }

            } else if (getUrlSub() == "files_upload") {
                /*  Arquivos  */
                if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {

                    var userList = buildDataTable({
                        headers: ["Status", "Arquivo", "Data do envio"]
                    });

                    $("#dashboard-content .content").append(userList);

                    $("#results").dataTable({
                        iDisplayLength: 50,
                        "oLanguage": get_datatable_lang(),
                        "bProcessing": true,
                        "sAjaxSource": api_path + '/api/file?api_key=$$key&hide_listing=0&content-type=application/json&lang=$$lang&columns=status_text,public_path,created_at'.render2({
                            user: $.cookie("user.id"),
                            lang: cur_lang,
                            key: $.cookie("key")
                        }),
                        "aoColumnDefs": [{
                            "sClass": "center",
                            "aTargets": [1]
                        }, {
                            "fnRender": function(oObj, sVal) {
                                sVal = "<a href='$$url' target='_blank' title='$$url'>Clique para fazer download</a>".render2({
                                    url: sVal
                                });
                                return sVal;
                            },
                            "aTargets": [1]
                        }, {
                            "fnRender": function(oObj, sVal) {
                                return $.format.date(sVal, "dd/MM/yyyy hh:mm");
                            },
                            "aTargets": [2]
                        }
                        ]
                    });

                }

            } else if (getUrlSub() == "files") {
                /*  Arquivos  */
                if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {

                    var userList = buildDataTable({
                        headers: ["Nome", "Arquivo", "_"]
                    });

                    $("#dashboard-content .content").append(userList);

                    $("#button-add").click(function() {
                        resetWarnings();
                        location.hash = "#!/" + getUrlSub() + "?option=add";
                    });

                    $("#results").dataTable({
                        iDisplayLength: 50,
                        "oLanguage": get_datatable_lang(),
                        "bProcessing": true,
                        "sAjaxSource": api_path + '/api/user/$$user/file?api_key=$$key&hide_listing=0&content-type=application/json&lang=$$lang&columns=public_name,public_url,id'.render2({
                            user: $.cookie("user.id"),
                            lang: cur_lang,
                            key: $.cookie("key")
                        }),
                        "aoColumnDefs": [{
                            "bSearchable": false,
                            "bSortable": false,
                            "sClass": "botoes",
                            "sWidth": "60px",
                            "aTargets": [2]
                        }, {
                            "sClass": "center",
                            "aTargets": [1]
                        }, {
                            "fnRender": function(oObj, sVal) {
                                sVal = "<a href='$$url' target='_blank' title='$$url'>Link</a>".render2({
                                    url: sVal
                                });
                                return sVal;
                            },
                            "aTargets": [1]
                        }],
                        "fnDrawCallback": function() {
                            $("#results td.botoes").each(function() {
                                var id = $(this).html();
                                $(this).html(api_path + "/api/user/" + $.cookie("user.id") + "/file/" + id);
                            });
                            DTdesenhaBotoes();
                        }
                    });

                } else if ($.getUrlVar("option") == "add" || $.getUrlVar("option") == "edit") {

                    $("#dashboard-content .content").append("<div class='upload_file'></div>");
                    var newform = [];
                    if ($.getUrlVar("option") == "add") {
                        newform.push({
                            label: "Arquivo",
                            input: ["file,arquivo,itext"]
                        });
                    } else if ($.getUrlVar("option") == "edit") {
                        newform.push({
                            label: "Arquivo",
                            input: ["textlabel,textlabel_arquivo,ilabel"]
                        });
                    }
                    newform.push({
                        label: "Nome",
                        input: ["text,public_name,itext"]
                    });
                    newform.push({
                        label: "Grupo do arquivo",
                        input: ["select,class_name,iselect source", "text,class_name_new,itext300px add_new"]
                    });
                    newform.push({
                        label: "Descrição",
                        input: ["textarea,description,itext"]
                    });
                    var formbuild = $("#dashboard-content .content .upload_file").append(buildForm(newform, "Enviar arquivo"));
                    $(formbuild).find("div .field:odd").addClass("odd");
                    $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());
                    $("#dashboard-content .content .upload_css .botao-form[ref='cancelar']").hide()

                    $.ajax({
                        async: false,
                        type: 'GET',
                        dataType: 'json',
                        url: api_path + "/api/user/$$user/file?api_key=$$key".render2({
                            key: $.cookie("key"),
                            user: $.cookie("user.id")
                        }),
                        success: function(data, status, jqXHR) {
                            var classes = [];
                            data.files = data.files ? data.files : [];
                            data.files.sort(function(a, b) {
                                a = a.class_name,
                                    b = b.class_name;

                                return a.localeCompare(b);
                            });
                            $.each(data.files, function(index, item) {
                                if (item.hide_listing == 0) {
                                    if (item.class_name) {
                                        if (!findInArray(classes, item.class_name)) {
                                            classes.push(item.class_name);
                                        }
                                    }
                                }
                            });
                            $("select#class_name").empty();
                            $("select#class_name").append($("<option></option>").val("").html("Selecione"));
                            $.each(classes, function(index, item) {
                                $("select#class_name").append($("<option></option>").val(item).html(item));
                            });
                            $("select#class_name").append($("<option></option>").val("_new").html("- nova classe"));
                            $("select#class_name").change(function(e) {
                                if ($(this).val() == "_new") {
                                    $("input#class_name_new").show();
                                } else if ($(this).val() != "") {
                                    $("input#class_name_new").hide();
                                }
                            });
                        },
                        error: function(data) {
                            switch (data.status) {
                                case 400:
                                    $(".form-aviso").setWarning({
                                        msg: "Erro: ($$codigo)".render2({
                                            codigo: $.trataErro(data)
                                        })
                                    });
                                    break;
                            }
                        }
                    });


                    if ($.getUrlVar("option") == "edit") {
                        $.ajax({
                            async: false,
                            type: 'GET',
                            dataType: 'json',
                            url: $.getUrlVar("url") + "?api_key=$$key".render2({
                                key: $.cookie("key")
                            }),
                            success: function(data, status, jqXHR) {
                                switch (jqXHR.status) {
                                    case 200:
                                        textlabel_arquivo
                                        $(formbuild).find("div#textlabel_arquivo").html(data.public_url);
                                        $(formbuild).find("input#public_name").val(data.public_name);
                                        $(formbuild).find("select#class_name").val(data.class_name);
                                        $(formbuild).find("textarea#description").val(data.description);
                                        break;
                                }
                            },
                            error: function(data) {
                                switch (data.status) {
                                    case 400:
                                        $(".form-aviso").setWarning({
                                            msg: "Erro: ($$codigo)".render2({
                                                codigo: $.trataErro(data)
                                            })
                                        });
                                        break;
                                }
                            }
                        });
                    }

                    $("#dashboard-content .content .botao-form[ref='enviar']").click(function() {
                        resetWarnings();
                        if ($(this).parent().parent().find("#public_name").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe o Nome"
                            });
                        } else {

                            if ($.getUrlVar("option") == "add") {
                                var action = "create";
                                var method = "POST";
                                var url_action = api_path + "/api/user/$$user/file?api_key=$$key&content-type=application/json".render2({
                                    key: $.cookie("key"),
                                    user: $.cookie("user.id")
                                });

                                var clickedButton = $(this);

                                var file = "arquivo";
                                var form = $("#formFileUpload_" + file);

                                original_id = $('#arquivo_' + file).attr("original-id");

                                $('#arquivo_' + file).attr({
                                    name: "arquivo",
                                    id: "arquivo"
                                });

                                form.attr("action", url_action);
                                form.attr("method", "post");
                                form.attr("enctype", "multipart/form-data");
                                form.attr("encoding", "multipart/form-data");
                                form.attr("target", "iframe_" + file);
                                form.attr("file", $('#arquivo').val());

                                var sClass = $(".form select#class_name").val();
                                if (sClass == "_new") {
                                    sClass = $(".form input#class_name_new").val();
                                }

                                form.find("input[type='hidden']").remove();
                                form.append("<input type='hidden' name='user.file.create.public_name' id='user.file.createpublic_name' value='" + $(".form input#public_name").val() + "'>");
                                form.append("<input type='hidden' name='user.file.create.class_name' id='user.file.createclass_name' value='" + sClass + "'>");
                                form.append("<input type='hidden' name='user.file.create.description' id='user.file.createdescription' value='" + $(".form textarea#description").val() + "'>");

                                form.submit();
                                $('#arquivo').attr({
                                    name: original_id,
                                    id: original_id
                                });

                                $("#iframe_" + file).load(function() {

                                    var erro = 0;
                                    if ($(this).contents()) {
                                        if ($(this).contents()[0].body) {
                                            if ($(this).contents()[0].body.outerHTML) {
                                                var retorno = $(this).contents()[0].body.outerHTML;
                                                retorno = $(retorno).text();
                                                retorno = $.parseJSON(retorno);
                                            } else {
                                                erro = 1;
                                            }
                                        } else {
                                            erro = 1;
                                        }
                                    } else {
                                        erro = 1;
                                    }

                                    if (erro == 0) {
                                        if (!retorno.error) {
                                            $(clickedButton).html("Enviar");
                                            $(clickedButton).attr("is-disabled", 0);
                                            $("#aviso").setWarning({
                                                msg: "Arquivo enviado com sucesso."
                                            });
                                            location.hash = "#!/" + getUrlSub();
                                        } else {
                                            $(".upload_file .form-aviso").setWarning({
                                                msg: "Erro ao enviar arquivo (" + retorno.error + ")"
                                            });
                                            $(clickedButton).html("Enviar");
                                            $(clickedButton).attr("is-disabled", 0);
                                            return;
                                        }
                                    } else {

                                        $(".value_via_file .form-aviso").setWarning({
                                            msg: "Erro ao enviar arquivo"
                                        });
                                        $(clickedButton).html("Enviar");
                                        $(clickedButton).attr("is-disabled", 0);
                                        return;
                                    }
                                });
                            } else {
                                var action = "update";
                                var method = "POST";
                                var url_action = $.getUrlVar("url");

                                var sClass = $(this).parent().parent().find("#class_name").val();
                                if (sClass == "_new") {
                                    sClass = $(this).parent().parent().find("#class_name_new").val();
                                }

                                args = [{
                                    name: "api_key",
                                    value: $.cookie("key")
                                }, {
                                    name: "user.file." + action + ".class_name",
                                    value: sClass
                                }, {
                                    name: "user.file." + action + ".description",
                                    value: $(this).parent().parent().find("#description").val()
                                }, {
                                    name: "user.file." + action + ".public_name",
                                    value: $(this).parent().parent().find("#public_name").val()
                                }];
                                $("#dashboard-content .content .botao-form[ref='enviar']").hide();
                                $.ajax({
                                    type: method,
                                    dataType: 'json',
                                    url: url_action,
                                    data: args,
                                    success: function(data, status, jqXHR) {
                                        $("#aviso").setWarning({
                                            msg: "Operação efetuada com sucesso.".render2({
                                                codigo: jqXHR.status
                                            })
                                        });
                                        location.hash = "#!/" + getUrlSub();
                                    },
                                    error: function(data) {
                                        switch (data.status) {
                                            case 400:
                                                $("#aviso").setWarning({
                                                    msg: "Erro ao $$operacao. ($$codigo)".render2({
                                                        operacao: txtOption,
                                                        codigo: $.trataErro(data)
                                                    })
                                                });
                                                break;
                                        }
                                        $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                    }
                                });

                            }
                        }
                    });
                    $("#dashboard-content .content .botao-form[ref='cancelar']").click(function() {
                        resetWarnings();
                        history.back();
                    });
                } else if ($.getUrlVar("option") == "delete") {
                    deleteRegister({
                        url: $.getUrlVar("url") + "?api_key=$$key".render2({
                            key: $.cookie("key")
                        })
                    });
                }
            } else if (getUrlSub() == "region-list") {
                /*  Regiões  */
                var data_region = [];
                var data_district = [];
                if ($.getUrlVar("option") == "list" || $.getUrlVar("option") == undefined) {
                    $.ajax({
                        async: false,
                        type: 'GET',
                        dataType: 'json',
                        url: api_path + "/api/city/$$city/region?api_key=$$key".render2({
                            key: $.cookie("key"),
                            city: getIdFromUrl(user_info.city)
                        }),
                        success: function(data, status, jqXHR) {
                            results = [];
                            $.each(data.regions, function(index, item) {
                                if (item.depth_level == 2) {
                                    data_region.push({
                                        "id": item.id,
                                        "name": item.name,
                                        "url": item.url
                                    });
                                } else if (item.depth_level == 3) {
                                    data_district.push({
                                        "id": item.id,
                                        "name": item.name,
                                        "url": item.url,
                                        "upper_region_id": item.upper_region.id,
                                        "upper_region_name": item.upper_region.name
                                    });
                                }
                            });
                            data_region.sort(function(a, b) {
                                a = String(a.name),
                                    b = String(b.name);
                                return a.localeCompare(b);
                            });
                            data_district.sort(function(a, b) {
                                a = String(a.name),
                                    b = String(b.name);
                                return a.localeCompare(b);
                            });
                            $.each(data_region, function(index, item) {
                                results.push([item.name, "--", item.url]);
                                $.each(data_district, function(index2, item2) {
                                    if (item2.upper_region_id == item.id) {
                                        results.push([item2.name, item.name, item2.url]);
                                    }
                                });
                            });
                        }
                    });

                    var regionList = buildDataTable({
                        headers: ["Nome", "Distrito de", "_"]
                    });

                    $("#dashboard-content .content").append(regionList);


                    $("#button-add").click(function() {
                        resetWarnings();
                        location.hash = "#!/" + getUrlSub() + "?option=add";
                    });

                    $("#results").dataTable({
                        iDisplayLength: 50,
                        "oLanguage": get_datatable_lang(),
                        "aaData": results,
                        "bSort": false,
                        "aoColumnDefs": [{
                            "bSearchable": false,
                            "bSortable": false,
                            "sClass": "botoes",
                            "sWidth": "60px",
                            "aTargets": [2]
                        }, {
                            "sClass": "center",
                            "aTargets": [2]
                        }],
                        "fnDrawCallback": function() {
                            DTdesenhaBotoes();
                        }
                    });

                } else if ($.getUrlVar("option") == "add" || $.getUrlVar("option") == "edit") {

                    var txtOption = ($.getUrlVar("option") == "add") ? "$$e".render({
                        e: 'Cadastrar'
                    }) : "$$e".render({
                        e: 'Editar'
                    });

                    var newform = [];

                    newform.push({
                        label: "Tipo",
                        input: ["radio,region_type,iradio"]
                    });

                    newform.push({
                        label: "Distrito de",
                        input: ["select,region_id,iselect"]
                    });
                    newform.push({
                        label: "Nome",
                        input: ["text,name,itext"]
                    });
                    newform.push({
                        label: "Descrição",
                        input: ["textarea,description,itext"]
                    });
                    newform.push({
                        label: "Data",
                        input: ["select,subregions_valid_after,iselect"]
                    });

                    var formbuild = $("#dashboard-content .content").append(buildForm(newform, txtOption));
                    $(formbuild).find("div .field:odd").addClass("odd");
                    $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());

                    var newradio = $("#dashboard-content .content input#region_type").clone().attr("value", "1");
                    $("#dashboard-content .content input#region_type").attr("value", "0").after("Região&nbsp;&nbsp;", newradio, "Sub-região&nbsp;&nbsp;");
                    $("#dashboard-content .content input#region_type:first").attr("checked", true);

                    $("#dashboard-content .content .form .field:eq(1)").hide();

                    $("#dashboard-content .content input#region_type").change(function(e) {
                        if ($(this).val() == 0) {
                            $("#dashboard-content .content .form .field:eq(1)").hide();
                            $("#dashboard-content .content .form .field:eq(4)").show();
                        } else {
                            $("#dashboard-content .content .form .field:eq(1)").show();
                            $("#dashboard-content .content .form .field:eq(4)").hide();
                        }
                    });

                    $(formbuild).find("#subregions_valid_after").qtip($.extend(true, {}, qtip_input, {
                        content: "Ano em que as sub-regiões começam a possuir dados."
                    }));

                    $(formbuild).find("#name").qtip($.extend(true, {}, qtip_input, {
                        content: "Nome da Subprefeitura."
                    }));

                    $.ajax({
                        type: 'GET',
                        dataType: 'json',
                        url: api_path + '/api/period/year?api_key=$$key'.render2({
                            key: $.cookie("key")
                        }),
                        success: function(data, textStatus, jqXHR) {
                            $("#dashboard-content .content select#subregions_valid_after").append("<option value='$$_value'>$$_text</option>".render({
                                _text: "Nenhuma",
                                _value: ""
                            }));
                            $.each(data.options, function(index, value) {
                                $("#dashboard-content .content select#subregions_valid_after").append("<option value='$$_value'>$$_text</option>".render({
                                    _text: data.options[index].text,
                                    _value: data.options[index].value
                                }));
                            });
                            if ($("#dashboard-content .content select#subregions_valid_after").attr("initial-value")) {
                                $("#dashboard-content .content select#subregions_valid_after").val($("#dashboard-content .content select#subregions_valid_after").attr("initial-value"));
                            }
                        }
                    });

                    $("#dashboard-content .content select#region_id").append($("<option></option>").val("").html("Carregando..."));
                    $.ajax({
                        type: 'GET',
                        dataType: 'json',
                        url: api_path + "/api/city/$$city/region?api_key=$$key".render2({
                            key: $.cookie("key"),
                            city: getIdFromUrl(user_info.city)
                        }),
                        success: function(data, status, jqXHR) {
                            $("#dashboard-content .content select#region_id option").remove();
                            data.regions.sort(function(a, b) {
                                a = String(a.name),
                                    b = String(b.name);
                                return a.localeCompare(b);
                            });
                            $.each(data.regions, function(index, item) {
                                if (!item.upper_region) {
                                    $("#dashboard-content .content select#region_id").append($("<option></option>").val(item.id).html(item.name));
                                }
                            });
                            if ($("#dashboard-content .content select#region_id").attr("initial-id")) {
                                $("#dashboard-content .content select#region_id").val($("#dashboard-content .content select#region_id").attr("initial-id"));
                            }
                        }
                    });

                    if ($.getUrlVar("option") == "edit") {
                        $.ajax({
                            async: false,
                            type: 'GET',
                            dataType: 'json',
                            url: $.getUrlVar("url") + "?api_key=$$key".render2({
                                key: $.cookie("key")
                            }),
                            success: function(data, status, jqXHR) {
                                switch (jqXHR.status) {
                                    case 200:
                                        if (data.upper_region) {
                                            $(formbuild).find("select#region_id").val(data.upper_region.id);
                                            $(formbuild).find("select#region_id").attr("initial-id", data.upper_region.id);
                                            $(formbuild).find("#region_type").eq(1).attr("checked", "checked");
                                            $("#dashboard-content .content .form .field:eq(1)").show();
                                            $("#dashboard-content .content .form .field:eq(4)").hide();
                                        } else {
                                            $(formbuild).find("#region_type").eq(0).attr("checked", "checked");
                                            $("#dashboard-content .content .form .field:eq(1)").hide();
                                            $("#dashboard-content .content .form .field:eq(4)").show();
                                        }
                                        $(formbuild).find("input#name").val(data.name);
                                        if (data.subregions_valid_after) {
                                            var data_tmp = data.subregions_valid_after.split(" ");
                                            $(formbuild).find("select#subregions_valid_after").attr("initial-value", data_tmp[0]);
                                            $(formbuild).find("select#subregions_valid_after").val(data_tmp[0]);
                                        }
                                        $(formbuild).find("textarea#description").val(data.description);
                                        current_map_string = data.polygon_path;
                                        break;
                                }
                            },
                            error: function(data) {
                                switch (data.status) {
                                    case 400:
                                        $(".form-aviso").setWarning({
                                            msg: "Erro: ($$codigo)".render2({
                                                codigo: $.trataErro(data)
                                            })
                                        });
                                        break;
                                }
                            }
                        });
                    }

                    google.load("maps", "3", {
                        other_params: 'sensor=false&libraries=drawing,geometry',
                        callback: function() {
                            $("#dashboard-content .content div.form").after("<div id='panel-map'><div id='panel'><button id='edit-button'>Editar forma</button><button id='delete-button'>Apagar forma</button></div><div id='map'></div></div>");

                            if (!google.maps.Polygon.prototype.getBounds) {

                                google.maps.Polygon.prototype.getBounds = function(latLng) {

                                    var bounds = new google.maps.LatLngBounds();
                                    var paths = this.getPaths();
                                    var path;

                                    for (var p = 0; p < paths.getLength(); p++) {
                                        path = paths.getAt(p);
                                        for (var i = 0; i < path.getLength(); i++) {
                                            bounds.extend(path.getAt(i));
                                        }
                                    }

                                    return bounds;
                                }
                            }

                            $map.init({
                                on_selection_unavaiable: function() {
                                    document.getElementById('delete-button').setAttribute('disabled', 'disabled');
                                },
                                on_selection_available: function() {
                                    document.getElementById('delete-button').removeAttribute('disabled');
                                },
                                // talvez pegar a cidade do usuario logado. ou se for superadmin, todo o mapa
                                center: new google.maps.LatLng(-15.781444, -47.930523)
                            });

                            $map.addPolygon({
                                "focus": true,
                                "select": true
                            });
                            if ($.getUrlVar("option") == "add") {
                                $map.deleteAllShapes();
                            }

                        }
                    });

                    $("#dashboard-content .content .botao-form[ref='enviar']").click(function() {
                        resetWarnings();
                        if ($(this).parent().parent().find("#name").val() == "") {
                            $(".form-aviso").setWarning({
                                msg: "Por favor informe o Nome"
                            });
                        } else {

                            if ($.getUrlVar("option") == "add") {
                                var action = "create";
                                var method = "POST";
                                var url_action = api_path + "/api/city/$$city/region".render2({
                                    city: getIdFromUrl(user_info.city)
                                });
                            } else {
                                var action = "update";
                                var method = "POST";
                                var url_action = $.getUrlVar("url");

                            }
                            args = [{
                                name: "api_key",
                                value: $.cookie("key")
                            }, {
                                name: "city.region." + action + ".name",
                                value: $(this).parent().parent().find("#name").val()
                            }, {
                                name: "city.region." + action + ".description",
                                value: $(this).parent().parent().find("#description").val()
                            }, {
                                name: "city.region." + action + ".polygon_path",
                                value: current_map_string
                            }];

                            if ($(this).parent().parent().find("#region_id option:selected").val() != "" && $(this).parent().parent().find("#region_type:checked").val() == 1) {
                                args.push({
                                    name: "city.region." + action + ".upper_region",
                                    value: $(this).parent().parent().find("#region_id option:selected").val()
                                });
                            } else {
                                args.push({
                                    name: "city.region." + action + ".subregions_valid_after",
                                    value: $(this).parent().parent().find("#subregions_valid_after option:selected").val()
                                });
                            }

                            $("#dashboard-content .content .botao-form[ref='enviar']").hide();
                            $.ajax({
                                type: method,
                                dataType: 'json',
                                url: url_action,
                                data: args,
                                success: function(data, status, jqXHR) {
                                    $("#aviso").setWarning({
                                        msg: "Operação efetuada com sucesso.".render2({
                                            codigo: jqXHR.status
                                        })
                                    });
                                    location.hash = "#!/" + getUrlSub();
                                },
                                error: function(data) {
                                    switch (data.status) {
                                        case 400:
                                            $("#aviso").setWarning({
                                                msg: "Erro ao $$operacao. ($$codigo)".render2({
                                                    operacao: txtOption,
                                                    codigo: $.trataErro(data)
                                                })
                                            });
                                            break;
                                    }
                                    $("#dashboard-content .content .botao-form[ref='enviar']").show();
                                }
                            });
                        }
                    });
                    $("#dashboard-content .content .botao-form[ref='cancelar']").click(function() {
                        resetWarnings();
                        history.back();
                    });
                } else if ($.getUrlVar("option") == "delete") {
                    deleteRegister({
                        url: $.getUrlVar("url") + "?api_key=$$key".render2({
                            key: $.cookie("key")
                        })
                    });
                }
            } else if (getUrlSub() == "region-map") {
                /*  Regiões Setando mapa */

                $("#dashboard-content .content").append("<div id='panel-region'><div id='region-top'><div id='list-label'>$$re:</div><div id='region-panel'><div class='contents'><div id='region-selected'>$$rr: <span class='selected'>$$ax</span></div></div></div></div><div id='region-list'><div class='contents'></div></div><div id='panel-map'><div id='panel'><button id='edit-button' class='disabled'>$$ex</button><button id='delete-button' class='disabled'>$$f</button><button id='save-button' class='disabled'>$$a</button></div><div id='map'></div></div></div>".render({
                    ax: 'Nenhuma',
                    ex: 'Editar forma',
                    re: 'Regiões',
                    f: 'Apagar forma',
                    rr: 'Região selecionada',
                    a: 'Associar forma à região selecionada'
                }));

                $("#dashboard-content .content").append("<div class='upload_via_file'></div>");
                var newform = [];
                newform.push({
                    label: "Arquivo .KML",
                    input: ["file,arquivo,itext"]
                });
                newform.push({
                    label: "Precisão",
                    input: ["select,precision,iselect"]
                });
                var formbuild = $("#dashboard-content .content .upload_via_file").append(buildForm(newform, "Importar KML"));
                $(formbuild).find("div .field:odd").addClass("odd");
                $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());
                $("#dashboard-content .content .upload_via_file .botao-form[ref='enviar']").after('<a href="javascript: void(0);" class="botao-form" ref="atualizar">$$e</a>'.render({
                    e: 'Atualizar Precisão'
                }));
                $("#dashboard-content .content .upload_via_file .botao-form[ref='cancelar']").attr("ref", "re-enviar").text("$$e".render({
                    e: 'Enviar outro arquivo'
                }));
                $("#dashboard-content .content .upload_via_file .botao-form[ref='re-enviar']").hide();
                $("#dashboard-content .content .upload_via_file .botao-form[ref='atualizar']").hide();

                $("#dashboard-content .content .upload_via_file #precision").after("<div class='aviso'>$$e.</div>".render({
                    e: 'Quanto menor a escala de precisão, maior será o nível de detalhes e processamento necessário. Utilize uma precisão menor caso seu navegador apresente travamentos'
                }));

                $("#dashboard-content .content #precision").after("<div id='precision-value'>0</div><div id='precision-slider'></div>");
                $("#dashboard-content .content #precision").remove();

                $("#precision-slider").slider({
                    value: 0,
                    min: 0,
                    max: 1000,
                    step: 10,
                    slide: function(event, ui) {
                        $("#precision-value").text(ui.value);
                    }
                });

                data_region = [];
                data_district = [];
                data_regions = "";

                $.ajax({
                    type: 'GET',
                    dataType: 'json',
                    url: api_path + "/api/city/$$city/region?api_key=$$key&with_polygon_path=1&limit=1000".render2({
                        key: $.cookie("key"),
                        city: getIdFromUrl(user_info.city)
                    }),
                    success: function(data, status, jqXHR) {
                        data_regions = data;
                        $.each(data.regions, function(index, item) {
                            if (item.depth_level == 2) {
                                data_region.push({
                                    "id": item.id,
                                    "name": item.name,
                                    "url": item.url
                                });
                            } else if (item.depth_level == 3) {
                                data_district.push({
                                    "id": item.id,
                                    "name": item.name,
                                    "url": item.url,
                                    "upper_region_id": item.upper_region.id,
                                    "upper_region_name": item.upper_region.name
                                });
                            }
                        });
                        data_region.sort(function(a, b) {
                            a = String(a.name),
                                b = String(b.name);
                            return a.localeCompare(b);
                        });
                        data_district.sort(function(a, b) {
                            a = String(a.name),
                                b = String(b.name);
                            return a.localeCompare(b);
                        });

                        var count = 0;
                        $.each(data_region, function(index, item) {
                            $("#panel-region #region-list .contents").append("<div class='item' region-id='$$id' region-count='$$count' depth='$$depth'>$$name</div>".render({
                                id: item.id,
                                name: item.name,
                                count: count,
                                depth: 2
                            }));
                            $.each(data_district, function(index2, item2) {
                                if (item2.upper_region_id == item.id) {
                                    count++;
                                    $("#panel-region #region-list .contents").append("<div class='item' region-id='$$id' region-count='$$count' depth='$$depth'>$$name</div>".render({
                                        id: item2.id,
                                        name: item2.name,
                                        count: count,
                                        depth: 3
                                    }));
                                }
                            });
                        });

                        $("#panel-region #region-list .contents").css("height", $("#panel-map").height() + "px");

                        google.load("maps", "3", {
                            other_params: 'sensor=false&libraries=drawing,geometry',
                            callback: function() {

                                if (!google.maps.Polygon.prototype.getBounds) {

                                    google.maps.Polygon.prototype.getBounds = function(latLng) {

                                        var bounds = new google.maps.LatLngBounds();
                                        var paths = this.getPaths();
                                        var path;

                                        for (var p = 0; p < paths.getLength(); p++) {
                                            path = paths.getAt(p);
                                            for (var i = 0; i < path.getLength(); i++) {
                                                bounds.extend(path.getAt(i));
                                            }
                                        }

                                        return bounds;
                                    }
                                }

                                $map.init({
                                    on_selection_unavaiable: function() {
                                        document.getElementById('delete-button').setAttribute('disabled', 'disabled');
                                    },
                                    on_selection_available: function() {
                                        document.getElementById('delete-button').removeAttribute('disabled');
                                    },
                                    // talvez pegar a cidade do usuario logado. ou se for superadmin, todo o mapa
                                    center: new google.maps.LatLng(-15.781444, -47.930523),
                                    google: google
                                });

                                $.each(data_regions.regions, function(index, item) {
                                    if (item.polygon_path) {
                                        //                                  $map.addPolygon({"map_string": item.polygon_path,"focus": false, "region_id": item.id, "select": false});
                                    }
                                });
                                $map.focusAll();

                                $("#region-list .item").bind('click', function(e) {
                                    $("#region-list .item").removeClass("selected");
                                    $(this).addClass("selected");
                                    if ($(this).attr("region-id")) {
                                        var region_selected = getRegion($(this).attr("region-id"));
                                        var region_index = $(this).attr("region-index");
                                        if ((region_selected) && region_selected.polygon_path) {
                                            if (!$map.getObjTriangle(region_index)) {
                                                $map.addPolygon({
                                                    "map_string": region_selected.polygon_path,
                                                    "focus": true,
                                                    "region_id": region_selected.id,
                                                    "select": true
                                                });
                                            } else {
                                                $map.selectPolygon(region_index);
                                            }
                                        }
                                    }
                                    $.setSelectedRegion();

                                });


                            }
                        });
                    }
                });

                $("#dashboard-content .content .upload_via_file .botao-form[ref='atualizar']").click(function() {
                    if (typeof retorno_kml == "undefined") return;
                    if (!retorno_kml) return;
                    trataRetornoKML();
                });

                $("#dashboard-content .content .upload_via_file .botao-form[ref='re-enviar']").click(function() {
                    $("#dashboard-content .content .upload_via_file .botao-form[ref='atualizar']").hide();
                    $("#dashboard-content .content .upload_via_file .botao-form[ref='re-enviar']").hide();
                    $("#dashboard-content .content .upload_via_file .botao-form[ref='enviar']").show();

                    $("#dashboard-content .content .upload_via_file .form .field:first").show();
                });

                $("#dashboard-content .content .upload_via_file .botao-form[ref='enviar']").click(function() {
                    resetWarnings();
                    $.confirm({
                        'title': 'Confirmação',
                        'message': 'As regiões atuais serão apagadas do mapa.<br />Deseja continuar?',
                        'buttons': {
                            'Sim': {
                                'class': '',
                                'action': function() {

                                    $.loading({
                                        title: "Enviando..."
                                    });

                                    var clickedButton = $(this);

                                    var file = "arquivo";
                                    var form = $("#formFileUpload_" + file);

                                    original_id = $('#arquivo_' + file).attr("original-id");

                                    $('#arquivo_' + file).attr({
                                        name: "arquivo",
                                        id: "arquivo"
                                    });

                                    form.attr("action", api_path + '/api/user/$$user/kml?api_key=$$key&content-type=application/json'.render2({
                                        user: $.cookie("user.id"),
                                        key: $.cookie("key")
                                    }));
                                    form.attr("method", "post");
                                    form.attr("enctype", "multipart/form-data");
                                    form.attr("encoding", "multipart/form-data");
                                    form.attr("target", "iframe_" + file);
                                    form.attr("file", $('#arquivo').val());
                                    form.submit();
                                    $('#arquivo').attr({
                                        name: original_id,
                                        id: original_id
                                    });

                                    $("#iframe_" + file).load(function() {
                                        $.loading.hide();
                                        var erro = 0;
                                        if ($(this).contents()) {
                                            if ($(this).contents()[0].body) {
                                                if ($(this).contents()[0].body.outerHTML) {
                                                    var retorno = $(this).contents()[0].body.outerHTML;
                                                    retorno = $(retorno).text();
                                                    retorno = $.parseJSON(retorno);
                                                } else {
                                                    erro = 1;
                                                }
                                            } else {
                                                erro = 1;
                                            }
                                        } else {
                                            erro = 1;
                                        }
                                        if (erro == 0) {
                                            if (!retorno.error) {
                                                $(".upload_via_file .form-aviso").setWarning({
                                                    msg: "$$a".render({
                                                        a: 'Arquivo recebido com sucesso'
                                                    })
                                                });
                                                $(clickedButton).html("Enviar");
                                                $(clickedButton).attr("is-disabled", 0);
                                                if (retorno.vec) {
                                                    retorno_kml = retorno;
                                                    $("#dashboard-content .content .upload_via_file .form .field:first").hide();
                                                    $("#dashboard-content .content .upload_via_file .botao-form[ref='atualizar']").show();
                                                    $("#dashboard-content .content .upload_via_file .botao-form[ref='re-enviar']").show();
                                                    $("#dashboard-content .content .upload_via_file .botao-form[ref='enviar']").hide();
                                                    trataRetornoKML();
                                                } else {
                                                    $(".upload_via_file .form-aviso").setWarning({
                                                        msg: "O arquivo possui um formato inválido."
                                                    });
                                                    $(clickedButton).html("Enviar");
                                                    $(clickedButton).attr("is-disabled", 0);
                                                }
                                            } else {
                                                $(".upload_via_file .form-aviso").setWarning({
                                                    msg: "$$aa ".render({
                                                        aa: 'Erro ao enviar arquivo'
                                                    }) + file + " (" + retorno.error + ")"
                                                });
                                                $(clickedButton).html("Enviar");
                                                $(clickedButton).attr("is-disabled", 0);
                                                return;
                                            }
                                        } else {
                                            $(".upload_via_file .form-aviso").setWarning({
                                                msg: "$$aa ".render({
                                                    aa: 'Erro ao enviar arquivo'
                                                }) + file
                                            });
                                            $(clickedButton).html("Enviar");
                                            $(clickedButton).attr("is-disabled", 0);
                                            return;
                                        }
                                    });
                                }
                            },
                            'Não': {
                                'class': '',
                                'action': function() {}
                            }
                        }
                    });
                });

                function trataRetornoKML() {
                    $map.deleteAllShapes();
                    if ($("#region-list").length > 0) {
                        $("#region-list .item").removeClass("selected");
                        $("#region-list .item").removeAttr("region-index");
                    }
                    $.each(retorno_kml.vec, function(index, foo) {
                        $map.addPolygon({
                            "kml_string": foo,
                            "focus": false,
                            "select": false
                        });
                    });
                    $map.focusAll();
                }

                function getRegion(id) {
                    var i = "";
                    $.each(data_regions.regions, function(index, item) {
                        if (item.id == id) {
                            i = index;
                        }
                    });
                    if (i) {
                        return data_regions.regions[i];
                    } else {
                        return null;
                    }
                }

            } else if (getUrlSub() == "prefs") {

                var newform = [];

                newform.push({
                    label: "Nome",
                    input: ["text,name,itext"]
                });
                newform.push({
                    label: "Email",
                    input: ["text,email,itext"]
                });
                newform.push({
                    label: "Senha",
                    input: ["password,password,itext"]
                });
                newform.push({
                    label: "Confirmar Senha",
                    input: ["password,password_confirm,itext"]
                });

                var formbuild = $("#dashboard-content .content").append(buildForm(newform, "Preferências"));
                $(formbuild).find("div .field:odd").addClass("odd");
                $(formbuild).find(".form-buttons").width($(formbuild).find(".form").width());


                $.ajax({
                    type: 'GET',
                    dataType: 'json',
                    url: api_path + '/api/user/$$userid/?api_key=$$key'.render2({
                        userid: $.cookie("user.id"),
                        key: $.cookie("key")
                    }),
                    success: function(data, status, jqXHR) {
                        switch (jqXHR.status) {
                            case 200:
                                $(formbuild).find("input#name").val(data.name);
                                $(formbuild).find("input#email").val(data.email);
                                $(formbuild).find("select#cur_lang option[value=" + data.cur_lang + "]").attr("selected", "selected");
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
                                if (findInArray(user_info.roles, "user")) {
                                    if (user_info.institute.id == 1) {
                                        if (data.files.programa_metas) {
                                            $("input#arquivo_programa_metas").after("<br />[<a href='" + data.files.programa_metas + "' class='link-files' target='_blank'> arquivo atual </a>]");
                                        }
                                        if (data.files.carta_compromis) {
                                            $("input#arquivo_carta_compromisso").after("<br />[<a href='" + data.files.carta_compromis + "' class='link-files' target='_blank'> arquivo atual </a>]");
                                        }
                                        if (data.files.imagem_cidade) {
                                            $("input#arquivo_imagem_cidade").after("<br /><img src='" + data.files.imagem_cidade + "' border='0' class='imagem_preview'>");
                                        }
                                    }
                                    if (user_info.institute.id == 2) {
                                        if (data.files.logo_movimento) {
                                            $("input#arquivo_logo_movimento").after("<br /><img src='" + data.files.logo_movimento + "' border='0' height='60' class='logo_preview'>");
                                        }
                                        if (data.files.imagem_cidade) {
                                            $("input#arquivo_imagem_cidade").after("<br /><img src='" + data.files.imagem_cidade + "' border='0' class='imagem_preview'>");
                                        }
                                    }
                                }

                                break;
                        }
                    },
                    error: function(data) {
                        switch (data.status) {
                            case 400:
                                $(".form-aviso").setWarning({
                                    msg: "Erro: ($$codigo)".render2({
                                        codigo: $.trataErro(data)
                                    })
                                });
                                break;
                        }
                    }
                });

                $("#dashboard-content .content .botao-form[ref='enviar']").html("$$save".render({
                    save: 'Salvar'
                }));

                $("#dashboard-content .content .botao-form[ref='enviar']").click(function() {
                    if ($(this).attr("is-disabled") == 1) return false;

                    var clickedButton = $(this);

                    resetWarnings();
                    if ($(this).parent().parent().find("#name").val() == "") {
                        $(".form-aviso").setWarning({
                            msg: "Por favor informe o Nome"
                        });
                    } else if ($(this).parent().parent().find("#email").val() == "") {
                        $(".form-aviso").setWarning({
                            msg: "Por favor informe o Email"
                        });
                    } else if ($(this).parent().parent().find("#password_confirm").val() != $(this).parent().parent().find("#password").val()) {
                        $(".form-aviso").setWarning({
                            msg: "Confirmação de senha inválida"
                        });
                    } else {

                        var sendForm = function() {

                            args = [{
                                name: "api_key",
                                value: $.cookie("key")
                            }, {
                                name: "user.update.name",
                                value: $(".form").find("#name").val()
                            }, {
                                name: "user.update.email",
                                value: $(".form").find("#email").val()
                            }, {
                                name: "user.update.cur_lang",
                                value: $(".form").find("#cur_lang option:selected").val()
                            }, {
                                name: "user.update.endereco",
                                value: $(".form").find("#endereco").val()
                            }, {
                                name: "user.update.cidade",
                                value: $(".form").find("#cidade").val()
                            }, {
                                name: "user.update.estado",
                                value: $(".form").find("#estado").val()
                            }, {
                                name: "user.update.bairro",
                                value: $(".form").find("#bairro").val()
                            }, {
                                name: "user.update.cep",
                                value: $(".form").find("#cep").val()
                            }, {
                                name: "user.update.telefone",
                                value: $(".form").find("#telefone").val()
                            }, {
                                name: "user.update.email_contato",
                                value: $(".form").find("#email_contato").val()
                            }, {
                                name: "user.update.telefone_contato",
                                value: $(".form").find("#telefone_contato").val()
                            }, {
                                name: "user.update.nome_responsavel_cadastro",
                                value: $(".form").find("#nome_responsavel_cadastro").val()
                            }, {
                                name: "user.update.city_summary",
                                value: $(".form").find("#city_summary").val()
                            }];


                            if ($(this).parent().parent().find("#password").val() != "") {
                                args.push({
                                    name: "user.update.password",
                                    value: $(".form").find("#password").val()
                                }, {
                                    name: "user.update.password_confirm",
                                    value: $(".form").find("#password").val()
                                });
                            }
                            $.ajax({
                                type: 'POST',
                                dataType: 'json',
                                url: api_path + '/api/user/$$userid/?api_key=$$key'.render2({
                                    userid: $.cookie("user.id"),
                                    key: $.cookie("key")
                                }),
                                data: args,
                                success: function(data, textStatus, jqXHR) {

                                    $(clickedButton).html("$$save".render({
                                        save: 'Salvar'
                                    }));
                                    $(clickedButton).attr("is-disabled", 0);
                                    $("#aviso").setWarning({
                                        msg: "$$a.".render({
                                            a: 'Preferências salvas'
                                        })
                                    });
                                    location.hash = "#!/" + getUrlSub();
                                },
                                error: function(data) {
                                    $(".form-aviso").setWarning({
                                        msg: "Erro ao editar. ($$erro)".render2({
                                            erro: $.trataErro(data)
                                        })
                                    });
                                    $(clickedButton).html("$$save".render({
                                        save: 'Salvar'
                                    }));
                                    $(clickedButton).attr("is-disabled", 0);
                                }
                            });
                        }

                        var original_id = "";

                        var sendFiles = function() {
                            if (cont_files_sent < files_sent.length) {
                                var file = files_sent[cont_files_sent];
                                var form = $("#formFileUpload_" + file);

                                original_id = $('#arquivo_' + file).attr("original-id");

                                $('#arquivo_' + file).attr({
                                    name: "arquivo",
                                    id: "arquivo"
                                });

                                form.attr("action", api_path + '/api/user/$$userid/arquivo/$$tipo?api_key=$$key&content-type=application/json'.render2({
                                    userid: $.cookie("user.id"),
                                    tipo: file,
                                    key: $.cookie("key")
                                }));
                                form.attr("method", "post");
                                form.attr("enctype", "multipart/form-data");
                                form.attr("encoding", "multipart/form-data");
                                form.attr("target", "iframe_" + file);
                                form.attr("file", $('#arquivo').val());
                                cont_files_sent++;
                                form.submit();
                                $('#arquivo').attr({
                                    name: original_id,
                                    id: original_id
                                });

                                $("#iframe_" + file).load(function() {

                                    var erro = 0;
                                    if ($(this).contents()) {
                                        if ($(this).contents().find('pre')) {
                                            var retorno = $(this).contents().find('pre').text();
                                            retorno = $.parseJSON(retorno);
                                        } else {
                                            erro = 1;
                                        }
                                    } else {
                                        erro = 1;
                                    }

                                    if (erro == 0) {
                                        if (!retorno.error) {
                                            if (cont_files_sent < files_sent.length) {
                                                sendFiles();
                                            } else {
                                                $(clickedButton).html("Enviando Dados do Formulário...");
                                                sendForm();
                                            }
                                        } else {
                                            $(".form-aviso").setWarning({
                                                msg: "$$aa ".render({
                                                    aa: 'Erro ao enviar arquivo'
                                                }) + file + " (" + retorno.error + ")"
                                            });
                                            $(clickedButton).html("$$save".render({
                                                save: 'Salvar'
                                            }));
                                            $(clickedButton).attr("is-disabled", 0);
                                            cont_files_sent = files_sent.length;
                                            return;
                                        }
                                    } else {


                                        $(".form-aviso").setWarning({
                                            msg: "$$aa ".render({
                                                aa: 'Erro ao enviar arquivo'
                                            }) + file
                                        });
                                        $(clickedButton).html("$$save".render({
                                            save: 'Salvar'
                                        }));
                                        $(clickedButton).attr("is-disabled", 0);
                                        cont_files_sent = files_sent.length;
                                        return;
                                    }
                                });
                            } else {
                                sendForm()
                            }
                        }

                        var files = ["programa_metas", "carta_compromisso", "logo_movimento", "imagem_cidade"];

                        var files_sent = [];
                        for (i = 0; i < files.length; i++) {
                            if ($(".form #arquivo_" + files[i]).val() != undefined) {
                                if ($(".form #arquivo_" + files[i]).val() != "") {
                                    files_sent.push(files[i]);
                                }
                            }
                        }

                        var cont_files_sent = 0;

                        $(clickedButton).html("Salvando...");
                        $(clickedButton).attr("is-disabled", 1);

                        $(clickedButton).html("Enviando Arquivos...");
                        sendFiles();
                    }
                });
                $("#dashboard-content .content .botao-form[ref='cancelar']").click(function() {
                    if ($(this).attr("is-disabled") == 1) return false;
                    resetWarnings();
                    location.hash = "#!/dashboard";
                });

            } else if (getUrlSub() == "premio") {

                $("#dashboard-content .content").append("<br /><br /><div id='form-inscricao'></div>");
                $("#form-inscricao").append('<iframe src="https://docs.google.com/forms/d/1vtC5nIUFvEX47JIqqgFKHFf3yMi9f-BqFTOfdTKh4C0/viewform?embedded=true" width="760" height="500" frameborder="0" marginheight="0" marginwidth="0" style="border: 2px solid #e0e0e0;">Carregando...</iframe>');

            } else if (getUrlSub() == "logs") {

                var logList = buildDataTable({
                    headers: ["Usuário", "Mensagem", "Data"]
                }, null, false);

                $("#dashboard-content .content").append(logList);

                var url_log = api_path + '/api/log?api_key=' + $.cookie("key") + "&content-type=application/json&lang=$$lang&columns=user.nome,message,date";
                lang: cur_lang,

                    $("#results").dataTable({
                        iDisplayLength: 50,
                        "oLanguage": get_datatable_lang(),
                        "bProcessing": true,
                        "sAjaxSource": url_log,
                        "aaSorting": [
                            [2, 'desc']
                        ],
                        "aoColumnDefs": [{
                            "sClass": "log",
                            "aTargets": [0, 1, 2]
                        }, {
                            "sClass": "log.data",
                            "aTargets": [2]
                        }, {
                            "fnRender": function(oObj, sVal) {
                                return $.format.date(sVal.replace("T", " "), "dd/MM/yyyy HH:mm:ss");
                            },
                            "aTargets": [2]
                        }]
                    });

            } else if (getUrlSub() == "logout") {
                if ($.cookie("key")) {
                    var url_logout = api_path + '/api/logout?api_key=$$key'.render2({
                        key: $.cookie("key")
                    });
                    resetCookies();
                    $.ajax({
                        type: 'GET',
                        dataType: 'json',
                        url: url_logout,
                        success: function(data, textStatus, jqXHR) {
                            switch (jqXHR.status) {
                                case 200:
                                    resetWarnings();
                                    resetDashboard();
                                    location.hash = "";
                                    break;
                            }
                        }
                    });
                } else {
                    resetWarnings();
                    resetDashboard();
                    location.hash = "";
                }
            }
        } else if (getUrlSub() == "") {
            if ($.cookie("key") == null || $.cookie("key") == "") {
                resetDashboard();
                $("#dashboard #form-login").show();
            } else {
                location.hash = "!/dashboard";
            }
        }
    }
    $(window).hashchange();

});
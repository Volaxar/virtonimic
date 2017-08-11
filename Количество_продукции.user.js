// ==UserScript==
// @name         Количество продукции
// @version      0.1
// @descroption  Расчёт количества продукции на заводах
// @author       Volaxar
// @match        https://virtonomica.ru/*/main/unit/view/*
// @exclude      https://virtonomica.ru/*/main/unit/view/*/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/localforage/1.5.0/localforage.min.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    var hrefMatch = window.location.href.match(/https:\/\/virtonomica.ru\/(\w+)\/main\/unit\/view\/(\d+)/);
    var realmName;  // Название реалма
    var unitId; // ИД юнита
    var unitTypeName;   // Название типа юнита
    var product = {'id': 0, 'name': '', 'bonus':0, 'raws': {}, 'value': {}};   // Производимый продукт

    var setProductCount = function () {
        var equipLines = $('i.fa-cogs').parents('div').eq(0).find('table.unit_table > tbody > tr');

        var equipCount = equipLines.eq(0).children('td').eq(-1).text().replace(/ /g, '');
        var lastLine = equipLines.eq(-1);

        var equipMin = parseInt(equipCount.match(/^\d+/)[0]);
        var equipMax = parseInt(equipCount.match(/\d+$/)[0]);

        var bonus = 1 + product.bonus / 100;

        var productMax = parseInt(product.value[+equipMax]);
        var productMin = productMax * (equipMin / equipMax);

        var maxWBonus = Math.floor(productMax * bonus);
        var minWBonus = Math.floor(productMin * bonus);

        // alert(JSON.stringify(product));

        lastLine.after('<tr><td>Прогноз производства:</td><td>' + minWBonus + ' / ' + maxWBonus + '</td></tr>');
    };

    var loadTechBonus = function () {
        $.get('/' + realmName + '/main/unit/view/' + unitId + '/technology', function (data) {
            var techLine = $(data).find('tr.current_row td:eq(7)');
            var techValue = techLine.text().replace(/[+ %]/g, '');

            if(techValue != '') {
                product.bonus = parseFloat(techValue);
            } else {
                product.bonus = 0.0;
            }

            setProductCount();
        });
    };

    var loadRawData = function () {
        localforage.getItem('Материалы_' + product.name).then(function (value) {
            product.raws = value['raws'];
            product.value = value['value'];
        });

        loadTechBonus();
    };

    var saveRawData = function (unitTypeId) {
        $.get('/' + realmName + '/main/industry/unit_type/info/' + unitTypeId, function (data) {
            var productList = $(data).find('#mainContent table.grid:first > tbody > tr:gt(0)');
            var productData = [];

            productList.each(function () {
                var productName = $(this).children('td').eq(0).text();

                var raws = {};
                $(this).children('td').eq(2).find('a:even').each(function () {
                    var rawName = $(this).attr('title');

                    var countText = $(this).parents('table').first().find('td:last').text().match(/[0-9\/]+/)[0];
                    var count = parseInt(countText);
                    var countRight = countText.match(/\/(\d+)/);
                    if (countRight) {
                        count = count / parseInt(countRight[1]);
                    }

                    raws[rawName] = count;
                });

                if (productName == product.name) {
                    product.raws = raws;
                }

                var productId = $(this).children('td').eq(3).find('a:first').attr('href').match(/^.*?(\d+)$/)[1];

                productData.push({
                    'id': productId,
                    'name': productName,
                    'raws': raws,
                    'value': {}
                });
            });

            var valueList = $(data).find('#mainContent table.grid:last > tbody > tr:gt(1)');

            valueList.each(function () {
                var equipLine = $(this);
                var equipCount = equipLine.children('td').eq(1).text().match(/\d+$/);

                productData.forEach(function (item, i) {
                    item['value'][equipCount] = equipLine.children('td').eq(3+i).children().text().replace(/\s+/g, '');
                });
            });

            productData.forEach(function (item) {
                if(product.name == item.name) {
                    product.value = item.value;
                }

                localforage.setItem('Материалы_' + item.name, item);
            });

            loadTechBonus();

        }, 'html');
    };

    if (hrefMatch) {
        realmName = hrefMatch[1];
        unitId = hrefMatch[2];
        unitTypeName = $('#headerInfo h1').text();

        var productItem = $('i.fa-industry').parents('div').eq(0).find('li:eq(0)');

        product.name = productItem.attr('title');
        product.id = productItem.find('a:eq(0)').attr('href').match(/^.*?(\d+)$/)[1];

        // Хаки кривых имён
        product.name = product.name.replace('навигатор', 'навигаторы');
        product.name = product.name.replace('Компьютер', 'Компьютеры');
        product.name = product.name.replace('Измерительный прибор', 'Измерительные приборы');
        product.name = product.name.replace('Нефть', 'Добыча нефти');

        localforage.keys().then(function (value) {
            if (value.indexOf('Материалы_' + product.name) != -1) {
                loadRawData();
            } else {
                $.get('/' + realmName + '/main/common/main_page/game_info/industry', function (data) {
                    var unitTypeHref = $(data).find('a:contains(' + unitTypeName + ')').attr('href');
                    var unitTypeId = unitTypeHref.match(/\/(\d+)$/)[1];

                    saveRawData(unitTypeId);
                }, 'html');
            }
        });
    }

})();
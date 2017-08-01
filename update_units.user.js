// ==UserScript==
// @name         Обновление предприятий
// @version      0.1
// @descroption  Расчёт количества материалов с учётом заказов
// @author       Volaxar
// @match        https://virtonomica.ru/*/main/unit/view/*/supply
// @require      https://cdnjs.cloudflare.com/ajax/libs/localforage/1.5.0/localforage.min.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    var hrefMatch = window.location.href.match(/https:\/\/virtonomica.ru\/(\w+)\/main\/unit\/view\/(\d+)\/supply/);
    var realmName;  // Название реалма
    var unitId; // ИД юнита
    var unitTypeName;   // Название типа юнита
    var product = {'id': 0, 'name': '', 'sale': {}, 'raws': {}};   // Производимый продукт

    var setMaterialValue = function () {
        $('#mDestroy').find('tr[id^=r]').each(function () {
            var line = $(this);

            if (line.attr('id').length > 1) {
                var materialName = line.children('td').eq(0).attr('title');
                var multiplier = parseFloat(product['raws'][materialName]);

                var cell = line.children('td').eq(6);
                var count = Math.ceil(parseInt(product['sale'][product['id']]) * multiplier);
                cell.append('</br><span class="pseudolink min-order">' + count + '</span></br>');
            }
        });

        $('span.min-order').css('margin-right', '3px').click(function () {
            var spanCount = $(this);
            var itemId = spanCount.parents('tr').eq(0).attr('id').replace('r', 'qc');
            var input = $('#' + itemId);

            input.val(spanCount.text());
        });
    };

    var loadRawData = function () {
        localforage.getItem(materialName).then(function (value) {
            product['id'] = value['id'];
            product['raws'] = value['raws'];

            setMaterialValue();
        });
    };

    var saveRawData = function (unitTypeId) {
        $.get('/' + realmName + '/main/industry/unit_type/info/' + unitTypeId, function (data) {
            var productList = $(data).find('#mainContent table.grid:first > tbody > tr:gt(0)');

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

                var productId = $(this).children('td').eq(3).find('a:first').attr('href').match(/^.*?(\d+)$/)[1];

                if (productName == product['name']) {
                    product['id'] = productId;
                    product['raws'] = raws;
                }

                localforage.setItem('Материалы_' + productName, {
                    'id': productId,
                    'raws': raws
                });
            });

            setMaterialValue();

        }, 'html');
    };

    // Загружаем страницу сбыта.
    // Получаем название специализации, типа юнита.
    var loadSalePage = function (data) {
        product['name'] = $(data).find('#mainContent table:first td:eq(2)').text();

        unitTypeName = $(data).find('#headerInfo h1').text();

        var saleList = $(data).find('form[name=storageForm] table.grid > tbody > tr:gt(0)');

        saleList.each(function () {
            var orderLink = $(this).children('td').eq(-7).find('a');
            var orderId = orderLink.attr('href').match(/^.*?(\d+)$/)[1];

            product['sale'][orderId] = $(this).children('td').eq(-4).text().replace(' ', '');
        });

        // Проверяем наличие информации по составу продукта
        localforage.keys().then(function (value) {
            if (value.indexOf(product['name']) != -1) {
                loadRawData();
            } else {
                $.get('/' + realmName + '/main/common/main_page/game_info/industry', function (data) {
                    var unitTypeHref = $(data).find('a:contains(' + unitTypeName + ')').attr('href');
                    var unitTypeId = unitTypeHref.match(/\/(\d+)$/)[1];

                    saveRawData(unitTypeId);
                }, 'html');
            }
        });
    };

    if (hrefMatch) {
        realmName = hrefMatch[1];
        unitId = hrefMatch[2];

        $.get('/' + realmName + '/main/unit/view/' + unitId + '/sale/', loadSalePage, 'html');
    }
})();
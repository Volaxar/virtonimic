// ==UserScript==
// @name         Обновление предприятий
// @version      0.1
// @descroption  Расчёт количества материалов с учётом заказов
// @author       Volaxar
// @match        https://virtonomica.ru/*/main/unit/view/*/supply
// @require      https://cdnjs.cloudflare.com/ajax/libs/localforage/1.5.0/localforage.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var hrefMatch = window.location.href.match(/https:\/\/virtonomica.ru\/(\w+)\/main\/unit\/view\/(\d+)\/supply/);
    var realmName;
    var unitId;

    var getProductSale = function(pageSale, productId) {
        var productLine = pageSale.children('form[name=storageForm]').find('a[href*=' + productId + ']').eq(0).parents('tr').eq(0);
        var productSale = productLine.children('td').filter('[align=right]').eq(2).text().replace(' ', '');

        return(productSale);
    };

    var setMaterialValue = function(raws, count) {
        $('#mDestroy').find('tr[id^=r]').each(function() {
            var line = $(this);

            if(line.attr('id').length > 1) {
                var materialName = line.children('td').eq(0).attr('title');
                var multiplier = parseFloat(raws[materialName].count);

                var cell = line.children('td').eq(6);
                cell.append('</br><span class="pseudolink min-order">' + Math.ceil(parseInt(count) * multiplier) + '</span></br>');
            }
        });
        $('span.min-order').css('margin-right', '3px');
    };

    var loadCount = function(mainContent, materialName) {
        localforage.getItem(materialName).then(function(value) {
            if(value) {
                var productSale = getProductSale(mainContent, value.id);

                setMaterialValue(value.raws, productSale);

                $('span.min-order').click(function() {
                    var spanCount = $(this);
                    var itemId = spanCount.parents('tr').eq(0).attr('id').replace('r', 'qc');
                    var input = $('#' + itemId);

                    input.val(spanCount.text());
                });
            }
        });
    };

    var loadSale = function(data) {
        var mainContent = $(data).find('#mainContent');
        var specName = mainContent.children('table').eq(0).find('td').eq(2).text();
        var materialName = 'Материалы_' + specName;

        localforage.keys().then(function(value) {
            if(value.indexOf(materialName) != -1) {
                loadCount(mainContent, materialName);
            } else {
                alert('Информация о количестве материалов не загруженна');
            }
        });
    };

    if(hrefMatch) {
        realmName = hrefMatch[1];
        unitId = hrefMatch[2];
    }

    $.get('/' + realmName + '/main/unit/view/' + unitId + '/sale/', loadSale, 'html');
})();
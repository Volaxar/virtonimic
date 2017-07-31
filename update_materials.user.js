// ==UserScript==
// @name         Обновление материалов
// @version      0.1
// @author       Volaxar
// @match        https://virtonomica.ru/*/main/industry/unit_type/info/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/localforage/1.5.0/localforage.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var grids = $('#mainContent').children('table.grid');

    grids.eq(0).children('tbody').children('tr').slice(1).each(function() {
        var line = $(this);
        var tds = line.children('td');

        var spec_text = tds.eq(0).children('b').text();

        var raws = {};

        tds.eq(2).find('a').filter(':even').each(function() {
            var item = $(this);

            var id = item.attr('href').match(/^.*?(\d+)$/)[1];
            var text = item.attr('title');

            var count_text = item.parents('tr').eq(0).next().children('td').text().match(/[0-9\/]+/)[0];
            var count = parseInt(count_text.match(/\d+/)[0]);
            var count_right = count_text.match(/\/(\d+)/);

            if(count_right) {
                count = count / parseInt(count_right[1]);
            }

            raws[text] = {
                'id': id,
                'count': count

            };
        });

        var prod_id = tds.eq(3).find('a').eq(0).attr('href').match(/^.*?(\d+)$/)[1];

        localforage.setItem(spec_text, {'id': prod_id, 'raws': raws});
    });
})();
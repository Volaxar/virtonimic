// ==UserScript==
// @name        Торговый зал
// @include     https://virtonomica.ru/*/main/unit/view/*/trading_hall
// @version     1
// @grant       none
// ==/UserScript==

(function () {
    'use strict';

    var changeCurPrice = function () {
        var inputPrice = $(this);

        var currentPrice = parseFloat(inputPrice.val());
        var productLine = inputPrice.parents('tr').eq(0);

        var curMulCel = productLine.find('.cur-mul');
        var cityPrice = parseFloat(productLine.find('.city-price').text());

        curMulCel.text((currentPrice * 100 / cityPrice).toFixed(0) + '%');
    };

    $('table.grid tr:gt(2)').each(function () {
        var productLine = $(this);
        var cells = productLine.children('td');

        var maxMulCell = cells.eq(-6);
        var cellInput = cells.eq(-5);
        var curMulCell = cells.eq(-4);
        var cityPriceCell = cells.eq(-3);

        var myQuality = parseFloat(cells.eq(-8).text());
        var myBrand = parseFloat(cells.eq(-7).text());

        var cityQuality = parseFloat(cells.eq(-2).text());
        var cityBrand = parseFloat(cells.eq(-1).text());

        var cityPrice = parseFloat(cityPriceCell.text().replace(/(©| )/g, '')).toFixed(2);
        var myPrice = (cityPrice * (1 + (myQuality + myBrand - cityQuality - cityBrand))).toFixed(2);

        cityPriceCell.html('<div><span class="pseudolink city-price">' + cityPrice + '</span></div>');

        if(!isNaN(myPrice)) {
            cityPriceCell.append('<div><span class="pseudolink max-price">' + myPrice + '</span></div>');
        }

        var maxMul = (myPrice * 100 / cityPrice).toFixed(0);
        maxMulCell.append('<div><span class="mul">' + maxMul + '%</span></div>');

        var inputPrice = cellInput.children('input');

        var curMul = (parseFloat(inputPrice.val()) * 100 / cityPrice).toFixed(0);
        curMulCell.append('<div><span class="mul cur-mul">' + curMul + '%</span></div>');

        cellInput.append('<div>' +
            '<span class="price-cmd">+1</span>' +
            '&nbsp;&nbsp;' +
            '<span class="price-cmd">+10</span>' +
            '&nbsp;' +
            '<span class="mid-price">@</span>' +
            '&nbsp;' +
            '<span class="price-cmd">-1</span>' +
            '&nbsp;&nbsp;' +
            '<span class="price-cmd">-10' +
            '</span></div>'
        );

        inputPrice.addClass('cur-price');

        cellInput.find('span').addClass('pseudolink');
    });

    $('.pseudolink').css({
        'border-bottom': '1px dashed #0184D0',
        'color': '#0184D0',
        'cursor': 'pointer',
        'text-decoration': 'none'
    });

    $('.mul').css({
        'color': 'green'
    });

    $('.max-price, .city-price').click(function () {
        var spanPrice = $(this);
        var inputPrice = spanPrice.parents('tr').eq(0).find('input[type=text]');

        inputPrice.val(spanPrice.text());
        inputPrice.change();
    });

    $('.cur-price').change(changeCurPrice);

    $('.price-cmd').click(function () {
        var cmd = $(this);
        var value = parseInt(cmd.text());
        var inputPrice = cmd.parents('td').eq(0).children('input');

        inputPrice.val((inputPrice.val() * (1 + (value / 100))).toFixed(2));
        inputPrice.change();
    });

    $('.mid-price').click(function () {
        var mid = $(this);
        var inputPrice = mid.parents('td').eq(0).children('input');

        var productLine = mid.parents('tr').eq(0);

        var cityPrice = parseFloat(productLine.find('.city-price').text());
        var maxPrice = parseFloat(productLine.find('.max-price').text());

        inputPrice.val(((maxPrice + cityPrice) / 2).toFixed(2));
        inputPrice.change();
    });

})();
/**
 * Created by Daniel Fischer on 04.12.15.
 */

// Enable bootstrap-confirmation, initialize other stuff...
$(document).ready(function () {
    //$('[data-toggle="confirmation"]').confirmation();
    $('[data-toggle="confirmation"]').confirmation({
        singleton: true,
        popout: true,
        placement: 'left'
    });

    $('.hasTooltip').tooltip();

    if (document.getElementById('runtimeGraph')) {
        google.charts.load('current', {packages: ['corechart']});
        google.charts.setOnLoadCallback(initGraphs);
    }

    if (document.getElementById('cronhelper')) {
        initCronHelper();
    }
});

/**
 * initialize Cronhelper
 */
function initCronHelper() {
    var $cronField = $('#command_scheduler_detail_cronExpression'),
        oldExpression = $cronField.val();

    $('body').on('click', '#cronHelperLink', function (e) {
        e.preventDefault();
        $('#cron_expression').val(oldExpression);
        presetCronHelper(oldExpression);
        $('#cronhelper').modal();
    });

    // confirmation for save
    $('#cronhelper_save').confirmation({
        singleton: true,
        popout: true,
        placement: 'left',
        onConfirm: function (event) {
            $cronField.val($('#cron_expression').val());
            $('#cronhelper').modal('hide');
        }
    });

    // change selection
    $('#cronhelper').on('change', '.cron_toggle', function (e) {
        var $this = $(this),
            $selector = $('.' + $this.data('class')),
            selection = $this.val(),
            isModulo = false;

        // empty selection is not allowed, select *
        if ((selection == null) || (selection.length == 0)) {
            $this.val('*');
        }

        // if modulo is selected unselect all values and toggle input
        var len = selection.length;
        for (var i = 0; i < len; i++) {
            isModulo = isModulo || (selection[i] == '-');
        }

        if (isModulo) {
            $this.val('-');
            $selector.toggleClass('hide');
            // select 'wildcard' option for visible input
            $('.' + $this.data('class') + ':visible').val('*');
        }

        // update current cron expression
        buildCronExpression()
    });
}

/**
 * preset selection based on the existing cron expression
 */
function presetCronHelper(expression) {
    var values = expression.split(' ');

    handleCronValue(values[0], 'cron_minute');
    handleCronValue(values[1], 'cron_hour');
    handleCronValue(values[2], 'cron_day');
    handleCronValue(values[3], 'cron_month');
    handleCronValue(values[4], 'cron_week');
}

/**
 * preselect values from existing crontab subentry for given field
 *
 * @param value string cronvalue
 * @param field string fieldname
 */
function handleCronValue(value, field) {
    var classSel = '.' + field,
        idSel = '#' + field;

    if (value.match(/\*\/[0-9]+/)) {
        $(classSel).toggleClass('hide');
        $(idSel + '_modulo').val(value);
    } else if (value == '*') {
        $(classSel).val('*');
    } else {
        var values = value.split(','),
            result = [];

        for (var i = 0; i < values.length; i++) {
            if (values[i].match(/[0-9]+\-[0-9]+/)) {
                var vals = values[i].split('-')
                for (var j = vals[0]; j <= vals[1]; j++) {
                    result.push(j.toString());
                }
            } else {
                result.push(values[i].toString());
            }
        }

        $(classSel).val(result);
    }
}

/**
 * generate new cron expression from input fields
 */
function buildCronExpression() {
    var expression = '';

    expression += handleVal($('.cron_minute:visible').val()) + " ";
    expression += handleVal($('.cron_hour:visible').val()) + " ";
    expression += handleVal($('.cron_day:visible').val()) + " ";
    expression += handleVal($('.cron_month:visible').val()) + " ";
    expression += handleVal($('.cron_week:visible').val());

    $('#cron_expression').val(expression);
}

/**
 * generate textual representation of a cron entry from selected values
 *
 * @param value string|array selected values
 */
function handleVal(value) {
    // we have a simple value - nothing do do, return
    if (typeof value == 'string') {
        return value;
    }

    // now comes the fun part - handle complex selections
    var len = value.length,
        wildcard = false,
        result = [],
        limit = -1,
        j = 0,
        help = false;

    // check if there is a wildcard ('*' or '-') selected - '-' should not happend, handle as '*'
    for (var i = 0; (i < len) && !wildcard; i++) {
        // try to convert entry to integer
        if (!isNaN(help = parseInt(value[i]))) {
            value[i] = help;
        }

        // check for wildcard
        if ((value[i] == '*') || (value[i] == '-')) {
            wildcard = true;
            continue;
        }

        // init search for successing values
        limit = value[i];

        // search for successing values
        for (j = i + 1; (j < len) && (value[j] == (limit + 1)); j++) {
            // try to convert entry to integer
            if (!isNaN(help = parseInt(value[j]))) {
                value[j] = help;
            }

            limit = value[j];
        }

        // difference detected -> add range
        if (limit > value[i]) {
            result.push(value[i] + '-' + limit);
            i = j - 1;
        } else { // add single value
            result.push(value[i]);
        }
    }

    // wildcard detected
    if (wildcard) {
        result = ['*'];
    }

    return result.join(',');
}

/**
 * initialize runtime and returncode graph
 */
function initGraphs() {
    $('body').on('click', '.toggleGraph', function (e) {
        var $this = $(this);
        $('#' + $this.data('graph')).toggleClass('hide');
        e.preventDefault();
    });

    if (executionData.length == 0) {
        $('.toggleGraph').hide();
        return;
    }

    var returnData = {},
        runtimeData = [],
        help = null;

    for (var i in executionData) {
        help = executionData[i];
        if (returnData.hasOwnProperty(help.returnCode)) {
            returnData[help.returnCode][1]++;
        } else {
            returnData[help.returnCode] = [help.returnCode, 1];
        }

        runtimeData.push([
            help.executionDate,
            help.runtime
        ]);
    }

    //initReturnGraph(returnData);
    initRuntimeGraph(runtimeData);
}

function initRuntimeGraph(data){
    var runtimeData = [[js_lang.execution_date, js_lang.runtime]],
        runtimeGraphData,
        runtimeGraphOptions = {
            title: js_lang.title_runtime,
            textStyle: {
                bold: true,
                fontSize: 10,
                color: '#4d4d4d'
            },
            titleTextStyle: {
                bold: true,
                fontSize: 14,
                color: '#4d4d4d'
            },
            hAxis: {
                title: js_lang.execution_date,
                minValue: 0,
                gridlines: {
                    count: 0
                },
                minorGridlines:{
                    count:0
                }
            },
            vAxis: {
                title: js_lang.runtime + '/s'
            },
            animation:{
                duration: 750,
                easing: 'linear',
                startup: true
            },
            legend: {
                position:'bottom'
            },
           trendlines: {
    0: {
      type: 'linear',
      color: 'red',
      lineWidth: 3,
      visibleInLegend: true
    },
    1: {
      type: 'linear',
      color: 'green',
      lineWidth: 3,
      visibleInLegend: true
    },
    2: {
      type: 'linear',
      color: 'pink',
      lineWidth: 3,
      visibleInLegend: true
    }
  }
        },
        runtimeChart;

    // convert data
    for(var i in data){
        runtimeData.push([data[i][0].date, data[i][1]]);
    }
    
    // that's it, render graph
    runtimeGraphData = google.visualization.arrayToDataTable(runtimeData);

    runtimeChart = new google.visualization.LineChart(document.getElementById('runtimeGraph'));
    runtimeChart.draw(runtimeGraphData, runtimeGraphOptions);
}

/**
 * render returncode statistics as bargraph
 *
 * @param data object statistical data
 */
function initReturnGraph(data) {
    var returnData = [[js_lang.return_code, js_lang.number]],
        returnGraphData,
        returnGraphOptions = {
            title: js_lang.title_return,
            textStyle: {
                bold: true,
                fontSize: 10,
                color: '#4d4d4d'
            },
            titleTextStyle: {
                bold: true,
                fontSize: 14,
                color: '#4d4d4d'
            },
            hAxis: {
                title: js_lang.return_code,
                minValue: 0,
                gridlines: {
                    count: 0
                },
                minorGridlines:{
                    count:0
                }
            },
            vAxis: {
                title: js_lang.number
            },
            animation:{
                duration: 750,
                easing: 'linear',
                startup: true
            },
            legend: {position:'none'}
        },
        returnChart;

    // convert data to array
    for(var i in data) {
        returnData.push(data[i]);
    }

    // that's it, render graph
    returnGraphData = google.visualization.arrayToDataTable(returnData);

    returnChart = new google.visualization.ColumnChart(document.getElementById('returnGraph'));
    returnChart.draw(returnGraphData, returnGraphOptions);
}

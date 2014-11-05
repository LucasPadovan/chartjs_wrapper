var chartUtils = ( function() {
  var generateCharts = function (selector) {
      var charts = document.querySelectorAll(selector)
      for (var a = 0; chart = charts[a++];) {
        var
            url       = chart.getAttribute('data-url')
          , extraData = {
                target     : chart.getAttribute('data-target')
              , chart_type : chart.getAttribute('data-chart-type')
            }

        $.ajax({
            beforeSend : setCSRFToken
          , type       : 'GET'
          , url        : url
          , data       : extraData
          , dataType   : 'json'
          , success    : function (response) {
              drawChart(response)
          }
        })
      }
  }

  , drawChart = function (data) {
      var
          target     = document.getElementById(data['target'])
        , chartType  = data['chart_type']
        , labels     = data['labels']
        , references = data['references']
        , values     = data['values']
        , context    = target.getContext('2d')
        , chart      = new Chart(context)

      drawReferences(references, target)

      switch(chartType){
        case 'line':
          drawLineChart(labels, values, chart)
          break
        case 'pie':
          drawPieChart(labels, values, chart)
          break
        case 'polarArea':
          drawPolarAreaChart(labels, values, chart)
          break
        case 'bar':
          drawBarChart(labels, values, chart)
          break
        case 'radar':
          drawRadarChart(labels, values, chart)
          break
        case 'doughnut':
          drawDoughnutChart(labels, values, chart)
          break
      }
      cleanDataAttributes(target)
  }

  , drawLineChart = function (labels, values, chart) {
      var
          data       = labeledDataset(labels, values)
        , options    = {}

      chart.Line(data, options)
  }

  , drawPieChart = function (labels, values, chart) {
      var
          data    = genericDataset(labels, values)
        , options = {}

      chart.Pie(data, options)
  }

  , drawPolarAreaChart = function (labels, values, chart) {
      var
          data    = genericDataset(labels, values)
        , options = {}

      chart.PolarArea(data, options)
  }

  , drawBarChart = function (labels, values, chart) {
    var
        data    = labeledDataset(labels, values)
      , options = {}

      chart.Bar(data, options);
  }

  , drawRadarChart = function (labels, values, chart) {
    var
        data    = labeledDataset(labels, values)
      , options = {}

      chart.Radar(data, options);
  }

  , drawDoughnutChart = function (labels, values, chart) {
      var
          data    = labeledDataset(labels, values)
        , options = {}

      chart.Doughnut(data, options);
    }

  // Utilities
  , drawReferences = function (references, chart) {
      var
          target   = chart.getAttribute('data-references-target')
        , list     = document.getElementById(target)
        , colors   = getColors()

      for (var i = 0; i < references.length; i++){
        var
            liElement = document.createElement('li')
          , textNode  = document.createTextNode(references[i])
          , color     = ['rgb(', colors[i], ')'].join('')

        liElement.appendChild(textNode)
        liElement.style.color = color
        liElement.style.display = 'inline'
        liElement.style.padding = '5px'
        list.appendChild(liElement)
      }
      list.style.margin = '10px 0'
  }

  // dataset generators
  , labeledDataset = function (labels, values) {
      var
          data  = {
              labels   : labels
            , datasets : []
          }
        , colors = getColors()

      for (var i = 0, numberOfValues = values.length; i < numberOfValues; i++) {
        var
            color = colors[i]
          , value = values[i]
          , dataset = {
              fillColor        : ['rgba(', color, ',0.5)'].join('')
            , strokeColor      : ['rgba(', color, ',1)'].join('')
            , pointColor       : ['rgba(', color, ',1)'].join('')
            , pointStrokeColor : "#fff"
            , data             : value
          }

        data['datasets'].push(dataset)
      }
      return data
  }

  , genericDataset = function (labels, values) {
      var
          data       = []
        , colors     = getHexColors()
        , highlights = getHighlightColors()

      for (var i = 0, numberOfValues = values.length; i < numberOfValues; i++) {
        data.push({
            value     : values[i]
          , color     : colors[i]
          , highlight : highlights[i]
          , label     : labels[i]
        })
      }

      return data
  }

  // just colors for coloring the charts
  , getColors = function () {
      return ['138,11,11','11,52,138','64,138,11','100,11,138','138,104,11','11,111,138','114,74,74','74,84,114','74,114,85','114,100,74','110,74,114','74,111,114']
  }

  , getHexColors = function () {
      return ['#8a0b0b', '#0b348a', '#408a0b', '#640b8a', '#8a680b', '#0b6f8a', '#724a4a', '#4a5472', '#4a7255', '#72644a', '#6e4a72', '#4a6f72']
  }

  , getHighlightColors = function () {
      return ['#A0020b', '#0b50A2', '#529b0b', '#7b0bA0', '#A06820b', '#0b839f', '#8a5a5a', '#5a7492', '#5a9275', '#92755a', '#7e5a92', '#5a8f92']
    }

  // deleting data attributes prevents succesives calls on 'chartUtils.init' to double render the chart,
  , cleanDataAttributes = function (target) {
      var dataAttributes = [ 'data-target', 'data-references-target', 'data-chart-type' ]

      for (var i = 0; attribute = dataAttributes[i++];)
        target.removeAttribute(attribute)
  }

  , bind = function (selector) {
      generateCharts(selector)
  }

  return {
    init: bind
  }
}() );

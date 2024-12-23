
var chartDom = document.getElementById('main');
var myChart = echarts.init(chartDom);
const startDateField = document.getElementById('start-date');
const endDateField = document.getElementById('end-date');

let stockId = null;

window.electronAPI.onMessage(async (event, id) => {
  stockId = id;
  const startDate = moment().startOf('day');
  const endDate = moment();

  startDateField.value = startDate.format('YYYY-MM-DD HH:mm');
  endDateField.value = endDate.format('YYYY-MM-DD HH:mm');

  const data = await window.electronAPI.getStock({
    id,
    startDate: startDate.toDate(),
    endDate: endDate.toDate()
  });

  document.getElementById('title').innerText = data.stock.title;
  document.title = `Analise - ${data.stock.title}`;
  mountChart(data);
});

function mountChart(data) {
  var option = {
    tooltip: {
      triggerOn: 'mousemove|click',
      formatter: function (params) {
        return (`<b>${params.name}</b><br />R$ ${params.data}`);
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: []
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: [],
        type: 'line',
        smooth: true,
        areaStyle: {}
      }
    ]
  };

  data.stockValues.forEach(element => {
    option.series[0].data.push(parseFloat(element.value));
    option.xAxis.data.push(moment(element.created_at).format(`DD/MM/YYYY HH:mm`));
  });

  const lastStatus = data.stockValues[data.stockValues.length - 1].status;
  lastStatus === 'positive' ? option.color = ['#67C23Aaf'] :  option.color = ['#FF5f5faf'];

  const max = parseInt(data.stock.max);
  const min = parseInt(data.stock.min);
  option.yAxis.max = max + 10;
  option.yAxis.min = (min - 10) < 0 ? 0 : min - 10;
  // option.yAxis.max = max + (max * 0.1);
  // option.yAxis.min = min - (min * 0.1);

  document.getElementById('max-price').innerText = `R$ ${data.stock.max}`;
  document.getElementById('min-price').innerText = `R$ ${data.stock.min}`;

  const maxPercentage = document.getElementById('max-percent');
  maxPercentage.innerText = data.stock.maxPercentage;
  maxPercentage.classList.remove('positive', 'negative');
  maxPercentage.classList.add(data.stock.maxPercentageStatus === 'positive' ? 'positive' : 'negative');

  const minPercentage = document.getElementById('min-percent');
  minPercentage.innerText = data.stock.minPercentage;
  minPercentage.classList.remove('positive', 'negative');
  minPercentage.classList.add(data.stock.minPercentageStatus === 'positive' ? 'positive' : 'negative');

  option && myChart.setOption(option);
}

async function apply() {
  const startDate = moment(startDateField.value).toDate();
  const endDate = moment(endDateField.value).toDate();
  const data = await window.electronAPI.getStock({ id: stockId, startDate, endDate });
  mountChart(data);
}
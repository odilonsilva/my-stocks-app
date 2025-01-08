var chartDom = document.getElementById('chart-main');
var loadingContainer = document.getElementById('loading');
var stockInfoContainer = document.querySelector('.stocks-info');

const startDateField = document.getElementById('start-date');
const endDateField = document.getElementById('end-date');
let stockId = null;
let analyzeCustomColor = true;

window.electronAPI.onMessage(async (event, id) => {
  stockId = id;
  const startDate = moment().startOf('day');
  const endDate = moment().endOf('day');
  
  startDateField.value = startDate.format('YYYY-MM-DD HH:mm');
  endDateField.value = endDate.format('YYYY-MM-DD HH:mm');
  
  const data = await window.electronAPI.getStock({
    id,
    startDate: startDate.toDate(),
    endDate: endDate.toDate()
  });
  
  document.getElementById('title').innerText = data.stock.title;
  document.title = `Analise - ${data.stock.title}`;
  apply();
});

function mountChart(data) {
  var myChart = echarts.init(chartDom);
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
        smooth: false,
        areaStyle: {}
      }
    ]
  };

  data.stockValues.forEach(element => {
    option.series[0].data.push(parseFloat(element.value));
    option.xAxis.data.push(moment(element.created_at).format(`DD/MM/YYYY HH:mm`));
  });

  if (analyzeCustomColor) {
    const lastStatus = data.stockValues[data.stockValues.length - 1].status;
    if(lastStatus === 'positive') {
      option.color = ['#67C23Aaf'];
    } else if(lastStatus === 'negative') {
      option.color = ['#FF5f5faf'];
    } else {
      option.color = ['#f1a20eaf'];
    }
  }

  const max = isNaN(parseInt(data.stock.max)) ? 0 : parseInt(data.stock.max);
  const min = isNaN(parseInt(data.stock.min)) ? 0 : parseInt(data.stock.min);

  option.yAxis.max = max + 10;
  option.yAxis.min = (min - 10) < 0 ? 0 : min - 10;

  document.getElementById('max-price').innerText = `R$ ${data.stock.max}`;
  document.getElementById('min-price').innerText = `R$ ${data.stock.min}`;

  const maxPercentage = document.getElementById('max-percent');
  maxPercentage.innerText = `${data.stock.maxPercentage}%`;
  maxPercentage.classList.remove('positive', 'negative', 'neutral');
  maxPercentage.classList.add(data.stock.maxPercentageStatus);

  const minPercentage = document.getElementById('min-percent');
  minPercentage.innerText = `${data.stock.minPercentage}%`;
  minPercentage.classList.remove('positive', 'negative', 'neutral');
  minPercentage.classList.add(data.stock.minPercentageStatus);

  option && myChart.setOption(option);
}

async function apply() {
  const startDate = moment(startDateField.value).toDate();
  const endDate = moment(endDateField.value).toDate();
  const data = await window.electronAPI.getStock({ id: stockId, startDate, endDate });

  if (data.stockValues.length === 0) {
    loadingContainer.innerHTML = '<h3>Não há dados para exibir</h3>';
    loadingContainer.style.display = 'flex';
    chartDom.style.display = 'none';
    stockInfoContainer.style.display = 'none';
    return;
  }
  
  loadingContainer.style.display = 'none';
  chartDom.style.display = 'flex';
  stockInfoContainer.style.display = 'flex';
  
  mountChart(data);
}

window.onload = async () => {
  const settings = await window.electronAPI.loadSettings();
  analyzeCustomColor = settings.analyze_custom_color === 1;
}
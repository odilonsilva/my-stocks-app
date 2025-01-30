let stocks = [];
let filter = "all";
let interval;

function openAddStock() {
  const backdrop = document.querySelector(".entries-container");
  backdrop.style = "display: block";
}

function closeAddStock() {
  const backdrop = document.querySelector(".entries-container");
  backdrop.style = "display: none";
}

async function saveUrl() {
  const input = document.querySelector("#url");
  const emptyUrl = document.querySelector("#emptyUrl");
  const invalidUrl = document.querySelector("#urlError");
  const btnSave = document.querySelector("#btn-save");

  emptyUrl.style = "display: none";
  invalidUrl.style = "display: none";
  input.classList.remove("input-error");

  if (input.value == "" || input.value == null) {
    emptyUrl.style = "display: block";
    input.classList.add("input-error");
    return false;
  }
  const urlRegex = /^https:\/\/www\.infomoney\.com\.br\/[^\s/$.?#].[^\s]*$/i;
  if (!urlRegex.test(input.value)) {
    invalidUrl.style = "display: block";
    input.classList.add("input-error");
    return false;
  }

  btnSave.textContent = "Carregando...";
  const result = await window.electronAPI.findStock(input.value);
  btnSave.textContent = "Salvar";

  if (!result) {
    invalidUrl.style = "display: block";
    input.classList.add("input-error");
    return false;
  }
}

function mountStock(stock) {
  const updated_at = document.querySelector("#updated_at");
  updated_at.textContent = new Date(stock.updated_at).toLocaleString();

  const stocksContainer = document.querySelector(".stocks");
  const newStock = `
  <div class="flex items-container">
    <div class="remove" onclick="remove(${stock.id})">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
        <p>Excluir</p>
    </div>
    <div class="analyze" onclick="analyze(${stock.id})">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
        </svg>
        <p>Analisar</p>
    </div>
    <div class="card">
      <div class="card-title">${stock.title}</div>
      <div class="card-info">
        <div class="card-price">${stock.value}</div>
        <div class="card-percent ${stock.status}">${showSignal(stock)} ${
    stock.percentage
  }%</div>
      </div>
    </div>
  </div>`;
  stocksContainer.innerHTML += newStock;
}

function settings() {
  window.electronAPI.openSettings();
}

function analyze(id) {
  window.electronAPI.openAnalyze(id);
}

function remove(id) {
  if (window.confirm("Deseja excluir esse item")) {
    window.electronAPI.deleteStock(id);
    setTimeout(() => {
      clearStocks();
      loadStocks();
    }, 200);
  }
}

function clearStocks() {
  const stocksContainer = document.querySelector(".stocks");
  stocksContainer.innerHTML = "";
}

window.electronAPI.updateListHandler((event, value) => {
  mountStock(value);
  closeAddStock();
});

function setFilter(element, value) {
  const filterList = document.querySelectorAll(".filters button");
  filter = value;
  let stocksLocal;

  for (const filter of filterList) filter.classList.remove("active");

  element.classList.add("active");
  clearStocks();

  switch (value) {
    case "all":
      loadStocks();
      return;
    case "positive":
      stocksLocal = stocks.filter((item) => item.status === "positive");
      break;
    case "negative":
      stocksLocal = stocks.filter((item) => item.status === "negative");
      break;
    case "neutral":
      stocksLocal = stocks.filter((item) => item.status === "neutral");
      break;
    case "fii":
      stocksLocal = stocks.filter((item) => item.url.includes("fii"));
      break;
  }

  for (const stock of stocksLocal) {
    mountStock(stock);
  }
}

async function loadStocks() {
  stocks = await window.electronAPI.loadStocks();

  if (stocks.length === 0) openAddStock();

  for (const stock of stocks) {
    mountStock(stock);
  }
}

async function updateData() {
  console.log(`updated at`, new Date().toLocaleString());
  const selectedElement = document.querySelector(".filters button.active");
  const buttonUpdate = document.getElementById("btn-update");
  buttonUpdate.classList.add("disabled");
  buttonUpdate.attributes.disabled = true;

  await window.electronAPI.updateData();

  clearStocks();
  setFilter(selectedElement, filter);

  buttonUpdate.classList.remove("disabled");
  buttonUpdate.attributes.disabled = false;
}

function showSignal(stocks) {
  if (stocks.status === "positive") {
    return "+";
  } else if (stocks.status === "negative") {
    return "-";
  } else {
    return "";
  }
}

window.electronAPI.updateInterval(async (event, value) => {
  clearInterval(interval);
  interval = setInterval(updateData, 1000 * 60 * value);
});

window.onload = async function () {
  const settings = await window.electronAPI.loadSettings();

  loadStocks();

  if (settings === null) return;

  interval = setInterval(updateData, 1000 * 60 * settings.refresh_interval);

  if (settings.update_on_startup === 1) updateData();
};

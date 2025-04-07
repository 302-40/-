// public/script.js
const ctx = document.getElementById('myChart').getContext('2d');
let currentMonth = '2025-01';
let currentType = 'expense';

const monthText = document.getElementById('currentMonth');
const detailsList = document.getElementById('detailsList');
const expenseBtn = document.getElementById('expenseBtn');
const incomeBtn = document.getElementById('incomeBtn');

let chart;

function fetchData() {
  fetch(`/api/${currentType}?month=${currentMonth}`)
    .then(res => res.json())
    .then(data => {
      updateChart(data);
      updateDetails(data);
    });
}

function updateChart(data) {
  const labels = data.map(item => item.name);
  const amounts = data.map(item => item.amount);

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: amounts,
        backgroundColor: ['#70d6ff', '#0077b6', '#90e0ef']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function updateDetails(data) {
  detailsList.innerHTML = '';
  data.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.name}: ${item.amount}元`;
    detailsList.appendChild(li);
  });
}

function changeMonth(step) {
  let [year, month] = currentMonth.split('-').map(Number);
  month += step;
  if (month <= 0) {
    month = 12;
    year--;
  } else if (month > 12) {
    month = 1;
    year++;
  }
  currentMonth = `${year}-${month.toString().padStart(2, '0')}`;
  monthText.textContent = `${year}年${month}月`;
  fetchData();
}

// 按鈕切換
expenseBtn.addEventListener('click', () => {
  currentType = 'expense';
  expenseBtn.classList.add('active');
  incomeBtn.classList.remove('active');
  fetchData();
});

incomeBtn.addEventListener('click', () => {
  currentType = 'income';
  incomeBtn.classList.add('active');
  expenseBtn.classList.remove('active');
  fetchData();
});

document.getElementById('prevMonth').addEventListener('click', () => {
    currentMonth = getPreviousMonth(currentMonth);
    loadChartWithAnimation(currentMonth);
  });
  
  document.getElementById('nextMonth').addEventListener('click', () => {
    currentMonth = getNextMonth(currentMonth);
    loadChartWithAnimation(currentMonth);
  });
  

  function loadChart(month) {
    const chartContainer = document.getElementById('chartContainer');
    const totalAmountElement = document.getElementById('totalAmount');
    const chartType = document.getElementById('chartType').value;
    const category = chartType === 'expense' ? 'expense' : 'income';
  
    fetch(`/api/records?month=${month}&category=${category}`)
      .then(response => response.json())
      .then(data => {
        // 計算總金額
        const total = data.reduce((sum, item) => sum + item.amount, 0);
        totalAmountElement.textContent = `本月${category === 'expense' ? '總支出' : '總收入'}：$${total}`;
  
        // 如果沒有資料
        if (data.length === 0) {
          chartContainer.innerHTML = `<div class="no-data">這個月沒有${category === 'expense' ? '支出' : '收入'}資料唷😸</div>`;
          return;
        }
  
        const ctx = document.getElementById('myChart').getContext('2d');
        if (myChart) {
          myChart.destroy();
        }
        myChart = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: data.map(item => item.name),
            datasets: [{
              data: data.map(item => item.amount),
              backgroundColor: generateColors(data.length),
            }]
          },
          options: {
            responsive: true,
          }
        });
      });
  }
  
  document.getElementById('prevMonth').addEventListener('click', () => {
    changeMonth(-1);
  });
  
  document.getElementById('nextMonth').addEventListener('click', () => {
    changeMonth(1);
  });
  
  function changeMonth(offset) {
    const monthSelector = document.getElementById('monthSelector');
    let currentIndex = monthSelector.selectedIndex;
    let newIndex = currentIndex + offset;
  
    if (newIndex >= 0 && newIndex < monthSelector.options.length) {
      monthSelector.selectedIndex = newIndex;
      const selectedMonth = monthSelector.value;
      loadChart(selectedMonth);
    }
  }

  myChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: data.map(item => item.name),
      datasets: [{
        data: data.map(item => item.amount),
        backgroundColor: generateColors(data.length),
      }]
    },
    options: {
      responsive: true,
      onClick: (e, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const categoryName = data[index].name;
          showDetails(categoryName, month, category);
        }
      }
    }
  });
  
  function showDetails(name, month, category) {
    fetch(`/api/records/details?month=${month}&category=${category}&name=${encodeURIComponent(name)}`)
      .then(response => response.json())
      .then(details => {
        if (details.length === 0) {
          alert(`沒有找到 ${name} 的詳細紀錄喔！`);
          return;
        }
        
        let message = `${name} 的詳細紀錄：\n\n`;
        details.forEach((item, index) => {
          message += `${index + 1}. 🗓️ ${item.date} - 💵 $${item.amount} - 📝 ${item.note || '無備註'}\n`;
        });
        
        const toDelete = prompt(`${message}\n想刪除哪一筆？請輸入編號（或取消）`);
  
        if (toDelete !== null) {
          const selectedIndex = parseInt(toDelete, 10) - 1;
          if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < details.length) {
            const recordId = details[selectedIndex].id;
            deleteRecord(recordId, month);
          } else {
            alert('輸入錯誤喔！請輸入正確的編號');
          }
        }
      });
  }
  
  function deleteRecord(id, month) {
    fetch(`/api/records/${id}`, {
      method: 'DELETE'
    })
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          alert('刪除成功！');
          loadChart(month); // 重新載入當月圖表
        } else {
          alert('刪除失敗，請稍後再試～');
        }
      });
  }
  

  document.getElementById('downloadBtn').addEventListener('click', () => {
    const month = document.getElementById('monthPicker').value;
    window.location.href = `/api/records/download?month=${month}`;
  });
  
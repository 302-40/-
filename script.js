let currentType = 'expenses';
let currentMonth = new Date().toISOString().slice(0, 7);

// DOM 元素
const chart = document.getElementById('chart').getContext('2d');
const details = document.getElementById('details');
const addForm = document.getElementById('addTransactionForm');
const typeBtns = document.querySelectorAll('.type-btn');
const monthText = document.getElementById('month');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const downloadBtn = document.getElementById('download-btn');
const categorySelect = document.getElementById('transactionCategory');
const transactionTypeInput = document.getElementById('transactionType');
const expenseBtn = document.getElementById('selectExpense');
const incomeBtn = document.getElementById('selectIncome');
const successMessage = document.getElementById('successMessage');

let pieChart;

// 初始化
updateMonthText();
loadData();
loadCategories();

// 收支切換（圖表）
typeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentType = btn.dataset.type;
    typeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadData();
    loadCategories();
  });
});

// 收支切換（表單）
expenseBtn.addEventListener('click', () => {
  expenseBtn.classList.add('active');
  incomeBtn.classList.remove('active');
  transactionTypeInput.value = 'expense';
});

incomeBtn.addEventListener('click', () => {
  incomeBtn.classList.add('active');
  expenseBtn.classList.remove('active');
  transactionTypeInput.value = 'income';
});

// 表單送出
addForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const data = {
    type: transactionTypeInput.value,
    date: document.getElementById('transactionDate').value,
    category: document.getElementById('transactionCategory').value,
    amount: Number(document.getElementById('transactionAmount').value),
  };

  fetch(`/api/${data.type}s`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then(res => {
      if (!res.ok) throw new Error('新增失敗');
      showSuccessMessage();
      addForm.reset();
      expenseBtn.click(); // 重設為預設支出
      loadData();
    })
    .catch(err => {
      console.error(err);
      alert('發生錯誤：' + err.message);
    });
});

// 月份切換
prevMonthBtn.addEventListener('click', () => {
  const d = new Date(currentMonth + '-01');
  d.setMonth(d.getMonth() - 1);
  currentMonth = d.toISOString().slice(0, 7);
  updateMonthText();
  loadData();
});

nextMonthBtn.addEventListener('click', () => {
  const d = new Date(currentMonth + '-01');
  d.setMonth(d.getMonth() + 1);
  currentMonth = d.toISOString().slice(0, 7);
  updateMonthText();
  loadData();
});

// 顯示月份（中文格式）
function updateMonthText() {
  const [year, month] = currentMonth.split('-');
  monthText.textContent = `${year}年${parseInt(month)}月`;
}

// 顯示成功訊息
function showSuccessMessage() {
  successMessage.style.display = 'block';
  successMessage.style.opacity = '1';

  setTimeout(() => {
    successMessage.style.opacity = '0';
  }, 2000);
  setTimeout(() => {
    successMessage.style.display = 'none';
  }, 2500);
}

// 載入分類選單
function loadCategories() {
  fetch(`/api/${currentType}/categories`)
    .then(res => res.json())
    .then(categories => {
      categorySelect.innerHTML = '';
      categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
      });
    })
    .catch(err => {
      console.error(err);
      alert('無法載入分類');
    });
}

// 載入圖表與細項
function loadData() {
  fetch(`/api/${currentType}?month=${currentMonth}`)
    .then(res => res.json())
    .then(data => {
      updateChart(data);
      updateDetails(data);
    })
    .catch(err => {
      console.error(err);
      alert('資料載入失敗');
    });
}

// 更新圖表
function updateChart(data) {
  const labels = data.map(item => item.category);
  const values = data.map(item => item.total);

  if (pieChart) pieChart.destroy();
  pieChart = new Chart(chart, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: generateColors(values.length),
      }],
    },
    options: {
      onClick: (e, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const category = labels[index];
          loadDetails(category);
        }
      },
    },
  });
}

// 更新分類總表
function updateDetails(data) {
  details.innerHTML = '';
  data.forEach(item => {
    const div = document.createElement('div');
    div.textContent = `${item.category}: $${item.total}`;
    details.appendChild(div);
  });
}

// 顯示分類明細
function loadDetails(category) {
  fetch(`/api/${currentType}/details?month=${currentMonth}&category=${encodeURIComponent(category)}`)
    .then(res => res.json())
    .then(data => {
      details.innerHTML = '';
      data.forEach(record => {
        const div = document.createElement('div');
        div.innerHTML = `#${record.id} ${record.date} $${record.amount} <span style="color:red; cursor:pointer;">❌</span>`;
        const deleteBtn = div.querySelector('span');
        deleteBtn.addEventListener('click', () => deleteRecord(record.id, deleteBtn));
        details.appendChild(div);
      });
    })
    .catch(err => {
      console.error(err);
      alert('載入明細失敗');
    });
}

// 刪除紀錄
function deleteRecord(id, deleteBtn) {
  if (!confirm(`確定要刪除編號 #${id} 嗎？`)) return;
  deleteBtn.textContent = '⌛';
  deleteBtn.style.pointerEvents = 'none';

  fetch(`/api/${currentType}/${id}`, {
    method: 'DELETE',
  })
    .then(res => {
      if (!res.ok) throw new Error('刪除失敗');
      loadData();
    })
    .catch(err => {
      console.error(err);
      alert('刪除錯誤：' + err.message);
    });
}

// 產生圓餅圖顏色
function generateColors(num) {
  const colors = [];
  for (let i = 0; i < num; i++) {
    colors.push(`hsl(${(i * 360) / num}, 70%, 70%)`);
  }
  return colors;
}

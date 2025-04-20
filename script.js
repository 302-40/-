const apiUrl = "https://script.google.com/macros/s/AKfycbxTjznN8bAR0hbRJzkM4p_yF50Sr6Xw33dJM5j-gRyIjb8zXh-UL07Ir7mglqQk5DUfJw/exec"; // 替換為你的 API 網址
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const recordsContainer = document.getElementById("records");
const form = document.getElementById("recordForm");

// 點擊漢堡選單顯示/隱藏側邊欄
menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("show");
});

// 格式化日期
function formatDate(date) {
    const [year, month, day] = date.split("-");
    return `${year}-${month}-${day}`;
}

// 讀取 Google Sheets 的記帳紀錄並顯示
async function loadRecords() {
    try {
        const response = await fetch(apiUrl); // `GET` 請求 API
        const data = await response.json();   // 解析 JSON

        recordsContainer.innerHTML = ""; // 清空舊資料

        for (let i = 1; i < data.length; i++) { // 跳過標題列
            const [date, category, amount, note, transactionType] = data[i]; // 加入 transactionType
        
            // 設定顏色
            const recordClass = transactionType === '支出' ? 'expense' : 'income';
        
            const recordElement = document.createElement("div");
            recordElement.classList.add("record", recordClass); // 添加類型的 class
            const formattedDate = formatDate(date);  // 格式化日期
            recordElement.innerHTML = `
                <p><strong>日期：</strong>${formattedDate}</p>
                <p><strong>類別：</strong>${category}</p>
                <p><strong>金額：</strong>${amount}</p>
                <p><strong>備註：</strong>${note}</p>
            `;
            recordsContainer.appendChild(recordElement);
        }
        
    } catch (error) {
        console.error("讀取紀錄時發生錯誤：", error);
    }
}

// 新增記帳
form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const date = document.getElementById("date").value;
    const category = document.getElementById("category").value;
    const amount = Number(document.getElementById("amount").value);
    const note = document.getElementById("note").value;
    const transactionType = document.getElementById("transactionType").value;  // 新增的部分

    const newRecord = { 
        date, 
        category, 
        amount, 
        note, 
        transactionType  // 包含這個欄位
    };

    await fetch(apiUrl, {
        method: "POST",
        body: JSON.stringify(newRecord),
        headers: { "Content-Type": "application/json" },
        mode: "cors" // 改為 cors，允許跨域請求
    });

    form.reset();
    alert("記帳成功！（請到 Google Sheets 查看資料）");

    setTimeout(loadRecords, 2000); 
});

// 網頁載入時自動載入記帳紀錄
window.addEventListener("load", loadRecords);

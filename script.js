const apiUrl = "https://script.google.com/macros/s/AKfycbzmC6aC0av8gMHH0HREKHpZ30LvN4mVpsUbpGzYoVV7Xe9prF2UoC0wQ-Cjg2NYeiBHQg/exec"; // 替換為你的 API 網址
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

        const filterType = document.getElementById("filterType").value;

        for (let i = 1; i < data.length; i++) {
            const [date, category, amount, note, transactionType] = data[i];

            if (filterType !== "all" && transactionType !== filterType) continue;

            const recordClass = transactionType === 'expense' ? 'expense' : 'income';
            const recordElement = document.createElement("div");
            recordElement.classList.add("record", recordClass);
            const formattedDate = formatDate(date);
            recordElement.innerHTML = `
                <p><strong>日期：</strong>${formattedDate}</p>
                <p><strong>類別：</strong>${category}</p>
                <p><strong>金額：</strong>${amount}</p>
                <p><strong>備註：</strong>${note}</p>
            `;
            recordsContainer.appendChild(recordElement);
        }

        document.getElementById("filterType").addEventListener("change", loadRecords);

    } catch (error) {
        console.error("讀取紀錄時發生錯誤：", error);
    }
}

// 新增記帳
form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const date = document.getElementById("date").value;
    let category = document.getElementById("category").value;
    const amount = Number(document.getElementById("amount").value);
    const note = document.getElementById("note").value;
    const transactionType = document.getElementById("transactionType").value;

    // 如果選擇了「自訂」，則將輸入的類別設為使用者填寫的內容
    if (category === "custom") {
        category = document.getElementById("customCategory").value;
    }

    const newRecord = { 
        date, 
        category, 
        amount, 
        note, 
        transactionType 
    };

    await fetch(apiUrl, {
        method: "POST",
        body: JSON.stringify(newRecord),
        headers: { "Content-Type": "application/json" },
        mode: "no-cors" // 改為 cors，允許跨域請求
    });

    form.reset();
    alert("記帳成功！（請到 Google Sheets 查看資料）");

    setTimeout(loadRecords, 2000); 
});

// 網頁載入時自動載入記帳紀錄
window.addEventListener("load", loadRecords);

const categorySelect = document.getElementById("category");
const customCategoryInput = document.getElementById("customCategory");

// 當類別選擇改變時
categorySelect.addEventListener("change", () => {
    if (categorySelect.value === "custom") {
        customCategoryInput.style.display = "block"; // 顯示自訂類別輸入框
    } else {
        customCategoryInput.style.display = "none"; // 隱藏自訂類別輸入框
    }
});

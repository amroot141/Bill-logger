document.addEventListener('DOMContentLoaded', function () {
    // Elements
    const currentTimeEl = document.getElementById('currentTime');
    const customerNameInput = document.getElementById('customerName');
    const amountInput = document.getElementById('amount');
    const paymentModeSelect = document.getElementById('paymentMode');
    const addBillBtn = document.getElementById('addBillBtn');
    const syncAllBtn = document.getElementById('syncAllBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const billsTable = document.getElementById('billsTable').getElementsByTagName('tbody')[0];
    const totalAmountEl = document.getElementById('totalAmount');
    const billsCountEl = document.getElementById('billsCount');
    const totalBillsEl = document.getElementById('totalBills');
    const cashTotalEl = document.getElementById('cashTotal');
    const onlineTotalEl = document.getElementById('onlineTotal');
    const virtualKeyboard = document.getElementById('virtualKeyboard');
    const keyboardKeys = document.querySelector('.keyboard-keys');

    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz46wO_f2S7pzuMs143cfdwflK2kAXSupmlFRX1gd55dePe3XbPZnEeJKdaun7CxujD/exec'; // Replace with your own

    let bills = JSON.parse(localStorage.getItem('bills')) || [];
    let activeInput = null;

    // Format as ₹
    function formatINR(value) {
        return '₹' + parseFloat(value).toFixed(2);
    }

    // Add a bill
    addBillBtn.addEventListener('click', function () {
        const name = customerNameInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const mode = paymentModeSelect.value;
        const time = new Date().toLocaleTimeString();

        if (!name || isNaN(amount) || amount <= 0) {
            alert("Enter valid item name and amount.");
            return;
        }

        const bill = { name, amount, mode, time };
        bills.push(bill);
        saveBills();
        renderBills();
        updateSummary();
        customerNameInput.value = '';
        amountInput.value = '';
    });

    // Save to localStorage
    function saveBills() {
        localStorage.setItem('bills', JSON.stringify(bills));
    }

    // Render all bills
    function renderBills() {
        billsTable.innerHTML = '';
        bills.forEach((bill, index) => {
            const row = billsTable.insertRow();
            row.innerHTML = `
                <td>${bill.name}</td>
                <td>${formatINR(bill.amount)}</td>
                <td>${bill.mode}</td>
                <td>${bill.time}</td>
                <td><button onclick="deleteBill(${index})">❌</button></td>
            `;
        });
    }

    // Delete bill
    window.deleteBill = function (index) {
        if (confirm("Delete this bill?")) {
            bills.splice(index, 1);
            saveBills();
            renderBills();
            updateSummary();
        }
    };

    // Update totals
    function updateSummary() {
        let total = 0, count = bills.length;
        let cash = 0, online = 0;

        bills.forEach(bill => {
            total += bill.amount;
            if (bill.mode === 'cash') cash += bill.amount;
            else online += bill.amount;
        });

        totalAmountEl.textContent = formatINR(total);
        billsCountEl.textContent = count;
        totalBillsEl.textContent = formatINR(total);
        cashTotalEl.textContent = formatINR(cash);
        onlineTotalEl.textContent = formatINR(online);
    }

    // Clear all bills
    clearAllBtn.addEventListener('click', function () {
        if (confirm("Clear all bills?")) {
            bills = [];
            saveBills();
            renderBills();
            updateSummary();
        }
    });

    // Sync to Google Sheets
    syncAllBtn.addEventListener('click', function () {
        if (!bills.length) {
            alert("No bills to sync.");
            return;
        }

        fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ bills }),
            headers: { 'Content-Type': 'application/json' }
        })
        .then(res => res.text())
        .then(msg => {
            alert("✅ Synced to Google Sheets");
        })
        .catch(err => {
            alert("❌ Sync failed");
            console.error(err);
        });
    });

    // Realtime Clock
    setInterval(() => {
        const now = new Date();
        currentTimeEl.textContent = now.toLocaleTimeString();
    }, 1000);

    // ========== Virtual Keyboard ==========
    function initVirtualKeyboard() {
        const keys = [
            '1','2','3','4','5','6','7','8','9','0',
            'Q','W','E','R','T','Y','U','I','O','P',
            'A','S','D','F','G','H','J','K','L',
            'Z','X','C','V','B','N','M',
            'Backspace','Space','Close'
        ];

        keyboardKeys.innerHTML = '';
        keys.forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'keyboard-key';
            btn.textContent = key;

            if (key === 'Backspace') btn.textContent = '⌫';
            if (key === 'Space') btn.innerHTML = '&nbsp;';
            if (key === 'Close') btn.classList.add('keyboard-close-btn');

            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                btn.classList.add('active');
            });
            btn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                btn.classList.remove('active');
                handleKeyPress(key);
            });

            keyboardKeys.appendChild(btn);
        });

        [customerNameInput, amountInput].forEach(input => {
            input.addEventListener('focus', () => {
                activeInput = input;
                showVirtualKeyboard();
                input.blur();
            });
        });

        document.querySelector('.keyboard-close').addEventListener('click', hideVirtualKeyboard);
    }

    function handleKeyPress(key) {
        if (!activeInput) return;

        let val = activeInput.value;
        let start = activeInput.selectionStart || val.length;

        if (key === 'Backspace') {
            activeInput.value = val.slice(0, start - 1) + val.slice(start);
        } else if (key === 'Space') {
            activeInput.value = val.slice(0, start) + ' ' + val.slice(start);
        } else if (key === 'Close') {
            hideVirtualKeyboard();
            return;
        } else {
            activeInput.value = val.slice(0, start) + key + val.slice(start);
        }
    }

    function showVirtualKeyboard() {
        virtualKeyboard.classList.add('show');
    }

    function hideVirtualKeyboard() {
        virtualKeyboard.classList.remove('show');
        activeInput = null;
    }

    // Init all
    initVirtualKeyboard();
    renderBills();
    updateSummary();
});

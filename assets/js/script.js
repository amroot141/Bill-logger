document.addEventListener('DOMContentLoaded', function () {
  const customerNameInput = document.getElementById('customerName');
  const amountInput = document.getElementById('amount');
  const paymentModeInput = document.getElementById('paymentMode');
  const addBillBtn = document.getElementById('addBillBtn');
  const billsTableBody = document.querySelector('#billsTable tbody');
  const totalAmountSpan = document.getElementById('totalAmount');
  const billsCountSpan = document.getElementById('billsCount');
  const cashTotal = document.getElementById('cashTotal');
  const onlineTotal = document.getElementById('onlineTotal');
  const totalBills = document.getElementById('totalBills');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const syncAllBtn = document.getElementById('syncAllBtn');
  const currentTimeEl = document.getElementById('currentTime');
  const scriptURL = "https://script.google.com/macros/s/AKfycbwyPj3iGRxUYCiRfOoKRzQhxeTbUxIkngr7QnPRCeWCd03I0wyLDhEQKn1hKP4WX-QeeA/exec";

  let bills = JSON.parse(localStorage.getItem('bills')) || [];

  function updateClock() {
    const now = new Date();
    currentTimeEl.textContent = now.toLocaleString();
  }
  setInterval(updateClock, 1000);
  updateClock();

  function saveToStorage() {
    localStorage.setItem('bills', JSON.stringify(bills));
  }

  function renderTable() {
    billsTableBody.innerHTML = '';
    let total = 0, cash = 0, online = 0;

    bills.forEach((bill, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${bill.name}</td>
        <td>₹${parseFloat(bill.amount).toFixed(2)}</td>
        <td>${bill.payment}</td>
        <td>${bill.time}</td>
        <td>
          <button onclick="editBill(${index})" class="btn-secondary">Edit</button>
          <button onclick="deleteBill(${index})" class="btn-danger">Delete</button>
        </td>
      `;
      billsTableBody.appendChild(tr);
      total += parseFloat(bill.amount);
      if (bill.payment === 'cash') cash += parseFloat(bill.amount);
      else online += parseFloat(bill.amount);
    });

    totalAmountSpan.textContent = `₹${total.toFixed(2)}`;
    billsCountSpan.textContent = bills.length;
    cashTotal.textContent = `₹${cash.toFixed(2)}`;
    onlineTotal.textContent = `₹${online.toFixed(2)}`;
    totalBills.textContent = `₹${total.toFixed(2)}`;
  }

  function addBill() {
    const name = customerNameInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const payment = paymentModeInput.value;
    const time = new Date().toLocaleTimeString();

    if (!name || isNaN(amount) || amount <= 0) {
      alert('Please enter valid item name and amount.');
      return;
    }

    bills.push({ name, amount, payment, time });
    saveToStorage();
    renderTable();
    customerNameInput.value = '';
    amountInput.value = '';
  }

  window.editBill = function (index) {
    const bill = bills[index];
    const newName = prompt("Edit item name:", bill.name);
    const newAmount = prompt("Edit amount:", bill.amount);
    const newPayment = prompt("Edit payment mode (cash/online):", bill.payment);

    if (newName && newAmount && (newPayment === 'cash' || newPayment === 'online')) {
      bills[index] = {
        name: newName,
        amount: parseFloat(newAmount),
        payment: newPayment,
        time: new Date().toLocaleTimeString()
      };
      saveToStorage();
      renderTable();
    }
  };

  window.deleteBill = function (index) {
    if (confirm('Delete this bill?')) {
      bills.splice(index, 1);
      saveToStorage();
      renderTable();
    }
  };

  addBillBtn.addEventListener('click', addBill);

  clearAllBtn.addEventListener('click', () => {
    if (confirm('Clear all bills?')) {
      bills = [];
      saveToStorage();
      renderTable();
    }
  });

  syncAllBtn.addEventListener('click', async () => {
    const sheetURL = "https://script.google.com/macros/s/AKfycbweEnpewg5U8UiBxIjYEJgtctpg8qvREKveVcfhRnxanLQNI694HXOyOpfAEllv1yN5Xw/exec";
    if (!bills.length) return alert("No bills to sync.");
    try {
      const res = await fetch(sheetURL, {
        method: "POST",
        body: JSON.stringify(bills),
        headers: { "Content-Type": "application/json" }
      });
      const text = await res.text();
      alert("Sync response: " + text);
    } catch (err) {
      alert("Sync failed: " + err.message);
    }
  });

  renderTable();
});

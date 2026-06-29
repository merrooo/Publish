import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  remove,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ============= FIREBASE CONFIGURATION =============
const firebaseConfig = {
  apiKey: "AIzaSyBrwioR6w9GHIxVnHWriyYB4BaJbXZ8xlU",
  authDomain: "codeae-85.firebaseapp.com",
  databaseURL: "https://codeae-85-default-rtdb.firebaseio.com",
  projectId: "codeae-85",
  storageBucket: "codeae-85.firebasestorage.app",
  messagingSenderId: "855701949624",
  appId: "1:855701949624:web:2cf2ea8802a2d372f3384d",
  measurementId: "G-LL3X996JHP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
console.log("✅ Firebase initialized");

// ============= DOM ELEMENTS =============
const form = document.getElementById("contactForm");
const emailUsername = document.getElementById("emailUsername");
const emailDomain = document.getElementById("emailDomain");
const fullEmailInput = document.getElementById("fullEmail");
const recordTypeSelect = document.getElementById("recordType");
const meterIdInput = document.getElementById("meterId");
const userNameInput = document.getElementById("userName");
const messageInput = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");
const successMessage = document.getElementById("successMessage");
const tableBody = document.getElementById("tableBody");
const tableFilter = document.getElementById("tableFilter");
const toastNotification = document.getElementById("toastNotification");

let allRecords = [];

// ============= EMAILJS CONFIGURATION =============
const EMAILJS_CONFIG = {
  SERVICE_ID: "service_oq68jve",
  TEMPLATE_ID: "template_jtobege",
  USER_ID: "NKAr3yhm8ujPe0aMP",
};

if (typeof emailjs !== "undefined") {
  emailjs.init(EMAILJS_CONFIG.USER_ID);
  console.log("✅ EmailJS initialized");
}

// ============= FETCH DATA FROM FIREBASE =============
async function fetchAllData() {
  console.log("🔄 Fetching data from Firebase...");

  try {
    const ticketsRef = ref(database, 'tickets');
    const snapshot = await get(ticketsRef);
    const records = [];

    if (snapshot.exists()) {
      const ticketsData = snapshot.val();
      console.log("📁 Raw Firebase data:", ticketsData);

      for (const [ticketType, tickets] of Object.entries(ticketsData)) {
        console.log(`Processing type: ${ticketType}`, tickets);

        if (tickets && typeof tickets === 'object') {
          for (const [ticketId, ticketData] of Object.entries(tickets)) {
            if (ticketData && typeof ticketData === 'object') {
              records.push({
                id: ticketId,
                fullPath: `tickets/${ticketType}/${ticketId}`,
                type: ticketType,
                meter_id: ticketData.meter_id || "",
                name: ticketData.name || "",
                email: ticketData.email || "",
                message: ticketData.message || "",
                timestamp: ticketData.timestamp || "",
                date: ticketData.date || "",
              });
            }
          }
        }
      }
    } else {
      console.log("No data found in 'tickets' path");
    }

    console.log(`📊 Total records fetched: ${records.length}`);

    records.sort((a, b) => {
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return b.timestamp.localeCompare(a.timestamp);
    });

    allRecords = records;
    return records;

  } catch (error) {
    console.error("❌ Error fetching data:", error);
    showToast("Error loading data: " + error.message, "error");
    return [];
  }
}

// ============= DISPLAY TABLE =============
function displayTable(records) {
  if (!tableBody) {
    console.error("Table body not found!");
    return;
  }

  console.log(`📋 Displaying ${records.length} records`);

  if (!records || records.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 60px 20px;">
          <div style="font-size: 48px; margin-bottom: 20px;">📭</div>
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">No Tickets Found</div>
          <div style="color: #666;">No tickets have been submitted yet.</div>
        </td>
      </tr>
    `;
    return;
  }

  const filter = tableFilter ? tableFilter.value.toLowerCase() : "";
  const filtered = filter ? records.filter(
    (r) =>
      (r.meter_id && r.meter_id.toString().toLowerCase().includes(filter)) ||
      (r.name && r.name.toLowerCase().includes(filter)) ||
      (r.message && r.message.toLowerCase().includes(filter)) ||
      (r.type && r.type.toLowerCase().includes(filter)) ||
      (r.email && r.email.toLowerCase().includes(filter))
  ) : records;

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px;">
          🔍 No matching tickets found
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map((record) => {
    let badgeColor = '#2196F3';

    if (record.type === 'اضافة بيانات') {
      badgeColor = '#4CAF50';
    } else if (record.type === 'عطل تقني') {
      badgeColor = '#f44336';
    } else if (record.type === 'تعديل بيانات') {
      badgeColor = '#FF9800';
    }

    return `
      <tr data-path="${record.fullPath}" data-id="${record.id}" onclick="selectRow(this)" style="cursor: pointer;">
        <td style="padding: 12px 8px;">
          <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; background: ${badgeColor}; color: white;">
            ${record.type}
          </span>
        </td>
        <td style="padding: 12px 8px;">${record.meter_id || '-'}</td>
        <td style="padding: 12px 8px;">${record.name || '-'}</td>
        <td style="padding: 12px 8px;">${record.email || '-'}</td>
        <td style="font-size: 11px; padding: 12px 8px;">${record.timestamp || '-'}</td>
        <td style="padding: 12px 8px; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${(record.message || '-').substring(0, 60)}${(record.message || '').length > 60 ? '...' : ''}
        </td>
       </tr>
    `;
  }).join('');

  if (!document.querySelector('#table-styles')) {
    const style = document.createElement('style');
    style.id = 'table-styles';
    style.textContent = `
      #tableBody tr.selected {
        background-color: #e3f2fd !important;
        border-left: 3px solid #2196F3;
      }
      #tableBody tr:hover {
        background-color: #f5f5f5;
      }
    `;
    document.head.appendChild(style);
  }
}

// ============= ROW SELECTION =============
window.selectRow = (row) => {
  const path = row.getAttribute("data-path");
  const record = allRecords.find((r) => r.fullPath === path);

  if (record) {
    document.querySelectorAll("#tableBody tr").forEach((t) => t.classList.remove("selected"));
    row.classList.add("selected");

    if (recordTypeSelect) recordTypeSelect.value = record.type || "";
    if (meterIdInput) meterIdInput.value = record.meter_id || "";
    if (userNameInput) userNameInput.value = record.name || "";
    if (fullEmailInput) fullEmailInput.value = record.email || "";

    if (messageInput) {
      messageInput.value = `Replying to your request: "${record.message || ''}"\n\n--- Your Response: ---\n`;
    }

    if (record.email && record.email.includes('@') && emailUsername && emailDomain) {
      const [u, d] = record.email.split('@');
      emailUsername.value = u;
      emailDomain.value = '@' + d;
    }

    showToast(`📋 Selected ticket from: ${record.name || record.email}`, "info");
    if (messageInput) messageInput.focus();
  }
};

// ============= DELETE FROM DATABASE =============
async function deleteTicketFromDatabase(pathToDelete) {
  try {
    console.log("🗑️ Attempting to delete:", pathToDelete);
    const recordRef = ref(database, pathToDelete);
    await remove(recordRef);
    console.log("✅ Successfully deleted from database:", pathToDelete);
    return true;
  } catch (error) {
    console.error("❌ Database deletion failed:", error);
    return false;
  }
}

// ============= HANDLE SUBMISSION =============
async function handleSubmission() {
  const selectedRow = document.querySelector("#tableBody tr.selected");
  const toEmail = fullEmailInput && fullEmailInput.value ?
    fullEmailInput.value :
    (emailUsername && emailDomain ? emailUsername.value + emailDomain.value : "");

  const msgContent = messageInput ? messageInput.value : "";
  const currentTime = new Date().toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "medium",
  });

  if (!toEmail || !msgContent) {
    showToast("❌ Please fill in email and message", "error");
    return false;
  }

  let emailBody = "";
  let isProcessA = false;
  let pathToDelete = "";

  if (selectedRow) {
    pathToDelete = selectedRow.getAttribute("data-path");
    if (pathToDelete) {
      isProcessA = true;
      const originalTicket = allRecords.find((r) => r.fullPath === pathToDelete);
      const ticketTypeDisplay = originalTicket?.type || "";

      emailBody = `
===========================================
        SUPPORT TICKET RESPONSE
===========================================
Customer Name: ${userNameInput ? userNameInput.value : ""}
Meter ID: ${meterIdInput ? meterIdInput.value : ""}
Ticket Type: ${ticketTypeDisplay}
-------------------------------------------
ORIGINAL MESSAGE FROM CUSTOMER:
${originalTicket ? originalTicket.message : "No message provided"}
-------------------------------------------
OUR RESPONSE:
${msgContent}
-------------------------------------------
Response Time: ${currentTime}
===========================================
      `;
    }
  }

  if (!isProcessA) {
    emailBody = `
===========================================
            NEW MESSAGE
===========================================
To: ${toEmail}
From: Support Team
-------------------------------------------
Message:
${msgContent}
-------------------------------------------
Time: ${currentTime}
===========================================
    `;
  }

  const templateParams = {
    to_email: toEmail,
    message: emailBody,
    user_name: userNameInput ? userNameInput.value || "Customer" : "Customer",
    time: currentTime,
  };

  try {
    // Step 1: Send the email
    console.log("📧 Sending email...");
    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams
    );

    if (response.status === 200) {
      console.log("✅ Email sent successfully!");

      // Step 2: If this was a ticket reply, delete from database IMMEDIATELY
      if (isProcessA && pathToDelete) {
        console.log("🗑️ Deleting ticket from database...");
        const deleted = await deleteTicketFromDatabase(pathToDelete);

        if (!deleted) {
          showToast("⚠️ Email sent but database deletion failed", "error");
          return false;
        }

        console.log("✅ Ticket deleted successfully!");

        allRecords = allRecords.filter((record) => record.fullPath !== pathToDelete);
        displayTable(allRecords);

        if (messageInput) messageInput.value = "";
        if (recordTypeSelect) recordTypeSelect.value = "";
        if (meterIdInput) meterIdInput.value = "";
        if (userNameInput) userNameInput.value = "";
        if (fullEmailInput) fullEmailInput.value = "";

        showToast("✅ Ticket resolved and removed from database!", "success");
      }

      // Show success message
      if (successMessage) {
        successMessage.style.display = "block";
        successMessage.textContent = isProcessA
          ? "✓ Ticket response sent and ticket removed from database!"
          : "✓ Email sent successfully!";
        setTimeout(() => (successMessage.style.display = "none"), 5000);
      }

      if (!isProcessA) {
        showToast("✅ Email sent successfully!", "success");
        // Clear form for normal emails
        if (form) form.reset();
        if (emailDomain) emailDomain.value = "";
      }

      return true;
    }
  } catch (error) {
    console.error("EmailJS Error:", error);
    showToast("❌ Error sending email: " + (error.message || "Unknown error"), "error");
    return false;
  }
}

// ============= REFRESH DATA =============
async function refreshData() {
  console.log("🔄 Refreshing data...");

  try {
    const data = await fetchAllData();
    displayTable(data);

    if (data.length === 0) {
      showToast("⚠️ No tickets found in database", "warning");
    } else {
    }
  } catch (error) {
    console.error("Refresh error:", error);
    showToast("❌ Error loading tickets", "error");

    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 60px 20px; color: red;">
            ❌ Error loading data: ${error.message}
          </td>
        </tr>
      `;
    }
  }
}

// ============= TOAST NOTIFICATION =============
function showToast(msg, type = "info") {
  if (!toastNotification) {
    console.log("Toast:", msg, type);
    return;
  }

  toastNotification.textContent = msg;
  toastNotification.className = `toast-notification show ${type}`;
  setTimeout(() => toastNotification.classList.remove("show"), 3000);
}

// ============= EVENT LISTENERS =============
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = fullEmailInput?.value || (emailUsername?.value + emailDomain?.value);
    if (!email || !messageInput?.value) {
      showToast("❌ Please fill in email and message", "error");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Sending...";

      await handleSubmission();

      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

if (tableFilter) {
  tableFilter.addEventListener("input", () => {
    displayTable(allRecords);
  });
}

// ============= INITIALIZE ON PAGE LOAD =============
window.onload = async () => {
  console.log("🚀 Page loaded, initializing...");
  await refreshData();
  setInterval(refreshData, 5000);
};
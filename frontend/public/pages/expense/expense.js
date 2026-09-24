const expense_URL = `${API_BASE_URL}/expense`;
const ai_URL = `${API_BASE_URL}/ai/suggest-category`;

const PAGE_SIZE_STORAGE_KEY = "expensePageSize";
const CURRENT_PAGE_STORAGE_KEY = "expenseCurrentPage";

const DEFAULT_PAGE_SIZE = 3;
const DEFAULT_CURRENT_PAGE = 0;

const ALLOWED_PAGE_SIZES = [2, 3, 5, 10, 20, 30, 40];

function getSavedPageSize() {
  const savedPageSize = parseInt(
    localStorage.getItem(PAGE_SIZE_STORAGE_KEY),
    10,
  );

  if (ALLOWED_PAGE_SIZES.includes(savedPageSize)) {
    return savedPageSize;
  }

  return DEFAULT_PAGE_SIZE;
}

function getSavedCurrentPage() {
  const savedPage = parseInt(
    localStorage.getItem(CURRENT_PAGE_STORAGE_KEY),
    10,
  );

  if (!isNaN(savedPage) && savedPage >= 0) {
    return savedPage;
  }

  return DEFAULT_CURRENT_PAGE;
}

let currentPage = getSavedCurrentPage();

let pageSize = getSavedPageSize();

let totalPages = 1;

let totalExpenses = 0;

function saveCurrentPage() {
  localStorage.setItem(CURRENT_PAGE_STORAGE_KEY, currentPage);
}

function savePageSize() {
  localStorage.setItem(PAGE_SIZE_STORAGE_KEY, pageSize);
}

axios.interceptors.response.use(
  (response) => response,

  (error) => {
    const isRealAuthFailure =
      error.response &&
      error.response.status === 401 &&
      error.response.data?.message !== "Unauthorized - premium users only";

    if (isRealAuthFailure) {
      localStorage.removeItem("token");
      window.location.href = "../signup/signup.html";
    }

    return Promise.reject(error);
  },
);

function setupCategorySuggestions() {
  const descriptionInput = document.getElementById("description");
  const categoryInput = document.getElementById("category");

  if (!descriptionInput || !categoryInput) {
    return;
  }

  let debounceTimer = null;

  descriptionInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);

    const description = descriptionInput.value.trim();

    if (!description) {
      return;
    }

    // Wait 500ms after the user stops typing before calling the AI,
    // instead of requiring them to press Enter.
    debounceTimer = setTimeout(async () => {
      const category = await fetchCategorySuggestion(description);

      // Only auto-fill if the user hasn't already typed their own category,
      // so we never overwrite something they entered themselves.
      if (category && !categoryInput.value.trim()) {
        categoryInput.value = category;
      }
    }, 500);
  });
}

async function fetchCategorySuggestion(description) {
  try {
    const response = await axios.get(ai_URL, {
      params: {
        description,
      },
    });

    console.log("AI response:", response.data);

    return response.data.category;
  } catch (error) {
    console.log("AI error:", error.message);

    return null;
  }
}

async function handleExpenseForm(event) {
  event.preventDefault();

  const amount = document.getElementById("amount").value;

  const description = document.getElementById("description").value;

  const category = document.getElementById("category").value;
  const note = document.getElementById("note").value;

  const expenseData = {
    amount,
    description,
    category,
    note,
  };

  const token = localStorage.getItem("token");

  try {
    await axios.post(expense_URL, expenseData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    event.target.reset();

    alert("Expense added successfully!");

    currentPage = 0;

    saveCurrentPage();

    await fetchExpenses(currentPage);
  } catch (error) {
    console.log(error.message);
  }
}

function createExpenseCard(expense) {
  const expenseCard = document.createElement("div");

  expenseCard.className = "expense-card";

  expenseCard.innerHTML = `
        <div class="expense-info">

            <p class="expense-amount">
                ₹${expense.amount}
            </p>

            <p class="expense-description">
                ${expense.description}
            </p>

            <p class="expense-category">
                Category: ${expense.category}
            </p>
            <p class="expense-note">
               Note: ${expense.note || "No note"}
           </p>

        </div>

        <button
            class="delete-expense-btn"
            type="button"
        >
            Delete
        </button>
    `;

  expenseCard
    .querySelector(".delete-expense-btn")
    .addEventListener("click", () => {
      deleteExpense(expense.id);
    });

  return expenseCard;
}

function renderExpenses(expenses) {
  const expensesList = document.getElementById("expenses-list");

  const emptyState = document.getElementById("empty-state");

  expensesList
    .querySelectorAll(".expense-card")
    .forEach((card) => card.remove());

  if (!expenses || expenses.length === 0) {
    emptyState.hidden = false;

    return;
  }

  emptyState.hidden = true;

  expenses
    .map(createExpenseCard)
    .forEach((card) => expensesList.appendChild(card));
}

async function deleteExpense(id) {
  const token = localStorage.getItem("token");

  try {
    await axios.delete(`${expense_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await fetchExpenses(currentPage);
  } catch (error) {
    console.log(error.message);
  }
}

async function fetchExpenses(page = currentPage) {
  const token = localStorage.getItem("token");

  // Make sure page is valid
  page = Math.max(parseInt(page, 10) || 0, 0);

  try {
    const response = await axios.get(expense_URL, {
      params: {
        page: page,
        pageSize: pageSize,
      },

      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    currentPage = response.data.currentPage;

    totalPages = response.data.totalPages;

    totalExpenses = response.data.totalExpenses;

    pageSize = response.data.pageSize;

    saveCurrentPage();

    savePageSize();

    updatePageSizeSelect();

    renderExpenses(response.data.expenses);

    renderPagination();
  } catch (error) {
    console.log(error.message);
  }
}

function handlePageSizeChange(event) {
  const newPageSize = parseInt(event.target.value, 10);

  if (!ALLOWED_PAGE_SIZES.includes(newPageSize)) {
    return;
  }

  pageSize = newPageSize;

  savePageSize();

  currentPage = 0;

  saveCurrentPage();

  fetchExpenses(currentPage);
}

function updatePageSizeSelect() {
  const pageSizeSelect = document.getElementById("page-size-select");

  if (!pageSizeSelect) {
    return;
  }

  pageSizeSelect.value = String(pageSize);
}

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "../signup/signup.html";

    return;
  }

  const pageSizeSelect = document.getElementById("page-size-select");

  if (pageSizeSelect) {
    pageSizeSelect.value = String(pageSize);

    pageSizeSelect.addEventListener("change", handlePageSizeChange);
  }

  fetchExpenses(currentPage);
  setupCategorySuggestions();
});
function download() {
  const token = localStorage.getItem("token");

  axios
    .get(`${expense_URL}/download`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => {
      const fileUrl = response.data.fileUrl;

      const resultBox = document.getElementById("download-result");
      if (resultBox) {
        resultBox.innerHTML = `Your file is ready: <a href="${fileUrl}" target="_blank" rel="noopener">${fileUrl}</a>`;
        resultBox.hidden = false;
      }
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = "expenses.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch((err) => {
      if (err.response?.status === 401) {
        alert("This is a premium feature. Upgrade to download your expenses.");
      } else {
        console.error(err);
      }
    });
}
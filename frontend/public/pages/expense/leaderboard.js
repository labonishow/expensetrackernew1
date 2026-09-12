let leaderboardModal;
let leaderboardList;
let leaderboardBtn;

document.addEventListener("DOMContentLoaded", () => {
  leaderboardModal = new bootstrap.Modal(
    document.getElementById("leaderboardModal"),
  );

  leaderboardList = document.getElementById("leaderboard-list");
  leaderboardBtn = document.getElementById("leaderboard-btn");

  leaderboardBtn?.addEventListener("click", handleLeaderboardClick);
});

async function handleLeaderboardClick() {
  if (window.isPremiumUser !== true) return;

  const token = localStorage.getItem("token");

  leaderboardModal.show();

  leaderboardList.innerHTML =
    '<p class="empty-state">Loading leaderboard...</p>';

  try {
    const { data } = await axios.get(`${API_BASE_URL}/premium/showleaderboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const users = data?.data || [];

    if (!users.length) {
      leaderboardList.innerHTML =
        '<p class="empty-state">No expenses recorded yet.</p>';
      return;
    }

    leaderboardList.innerHTML = users
      .map(
        (user, index) => `
            <div class="leaderboard-row" data-user-id="${user.userId}">
                <span class="lb-rank">#${index + 1}</span>
                <span class="lb-name">${user.name || "Unknown user"}</span>
                <span class="lb-total">
                    $${(Number(user.totalExpense) || 0).toFixed(2)}
                </span>
            </div>
        `,
      )
      .join("");
  } catch (error) {
    if (error.response?.status === 403) {
      leaderboardModal.hide();
      window.isPremiumUser = false;
      leaderboardBtn.disabled = true;
      return;
    }

    console.error("Failed to load leaderboard:", error);

    leaderboardList.innerHTML =
      '<p class="empty-state">Could not load leaderboard. Please try again.</p>';
  }
}

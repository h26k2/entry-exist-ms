document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("card-generation-form");
  const cnicInput = document.getElementById("cnic");
  const nameInput = document.getElementById("name");
  const cardNumberInput = document.getElementById("card_number");
  const issuedDateInput = document.getElementById("card_issued_date");
  const messageDiv = document.getElementById("card-generation-message");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    messageDiv.textContent = "";
    cardNumberInput.value = "";
    issuedDateInput.value = "";

    const cnic = cnicInput.value.trim();
    const name = nameInput.value.trim();
    if (!cnic || !name) {
      messageDiv.textContent = "Please enter both CNIC and Name.";
      return;
    }

    try {
      const res = await fetch("/api/generate-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnic, name }),
      });
      const data = await res.json();
      if (data.success) {
        cardNumberInput.value = data.card_number;
        issuedDateInput.value = data.card_issued_date;
        messageDiv.textContent = "Card generated successfully!";
        messageDiv.className = "text-green-600 mt-4";
      } else {
        messageDiv.textContent = data.message || "Failed to generate card.";
        messageDiv.className = "text-red-600 mt-4";
      }
    } catch (err) {
      messageDiv.textContent = "Server error.";
      messageDiv.className = "text-red-600 mt-4";
    }
  });
});

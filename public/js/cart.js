
  // Update quantity
  document.querySelectorAll(".update-qty").forEach(btn => {
    btn.addEventListener("click", async function () {
      const variantId = this.dataset.id;
      const action = this.dataset.action;

      const res = await fetch(`/cart/update/${variantId}/${action}`, { method: "GET" });
      const result = await res.json();

      if (result.success) {
        //Swal.fire({ icon: "success", title: "Updated", text: result.message, timer: 2000, showConfirmButton: false });
        location.reload(); // or update DOM manually for qty & total
      } else {
        Swal.fire({ icon: "error", title: "Oops", text: result.message });
      }
    });
  });

  // Remove item
  document.querySelectorAll(".remove-item").forEach(btn => {
    btn.addEventListener("click", async function () {
      const variantId = this.dataset.id;

      const res = await fetch(`/cart/remove/${variantId}`, { method: "GET" });
      const result = await res.json();

      if (result.success) {
       // Swal.fire({ icon: "success", title: "Removed", text: result.message, timer: 2000, showConfirmButton: false });
        location.reload();
      } else {
        Swal.fire({ icon: "error", title: "Oops", text: result.message });
      }
    });
  });

document.getElementById("continueBtn")?.addEventListener("click", async function (e) {
  e.preventDefault(); // stop normal navigation

  const res = await fetch("/cart/validate", { method: "GET" });
  const result = await res.json();

  if (!result.success && result.invalidItems) {
    let message = "Some items are not available:\n\n";
    result.invalidItems.forEach(item => {
      message += `${item.name} (Requested: ${item.requested}, Available: ${item.available})\n`;
    });

    Swal.fire({
      icon: "error",
      title: "Stock Issue",
      text: message,
    });
  } else if (result.success) {
    // proceed to address page
    window.location.href = "/select-address";
  } else {
    Swal.fire({ icon: "error", title: "Oops", text: result.message });
  }
});


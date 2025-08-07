let variantIndex = document.querySelectorAll(".variant-group").length;

document.getElementById("addVariantBtn").addEventListener("click", () => {
  const container = document.getElementById("variantContainer");
  const group = document.querySelector(".variant-group");
  const clone = group.cloneNode(true);

  // Update all input/select names and clear values
  clone.querySelectorAll("select, input").forEach((el) => {
    const name = el.getAttribute("name");
    if (name) {
      const newName = name.replace(/\[\d+\]/, `[${variantIndex}]`);
      el.setAttribute("name", newName);
    }
    if (el.tagName === "INPUT") el.value = "";
    if (el.tagName === "SELECT") el.selectedIndex = 0;
  });

  // Remove error messages if any
  clone.querySelectorAll(".text-danger").forEach((el) => el.remove());

  // Add Remove Button if not already present
  let removeBtn = clone.querySelector(".remove-variant-btn");
  if (!removeBtn) {
    const btnCol = document.createElement("div");
    btnCol.className = "col-md-3 d-flex align-items-end";

    const btn = document.createElement("button");
    btn.className = "btn btn-danger remove-variant-btn";
    btn.type = "button";
    btn.textContent = "Remove";

    btnCol.appendChild(btn);
    clone.appendChild(btnCol);
  }

  container.appendChild(clone);
  variantIndex++;
});

// Event delegation to handle dynamic remove buttons
document.getElementById("variantContainer").addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-variant-btn")) {
    const allGroups = document.querySelectorAll(".variant-group");
    if (allGroups.length > 1) {
      e.target.closest(".variant-group").remove();
    } else {
      alert("At least one variant is required.");
    }
  }
});

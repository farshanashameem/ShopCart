let variantIndex = document.querySelectorAll(".variant-group").length;

document.getElementById("addVariantBtn").addEventListener("click", () => {
  const container = document.getElementById("variantContainer");
  const group = document.querySelector(".variant-group");
  const clone = group.cloneNode(true);

  clone.querySelectorAll("select, input").forEach((el) => {
    const name = el.getAttribute("name");
    if (name) {
      const newName = name.replace(/\[\d+\]/, `[${variantIndex}]`);
      el.setAttribute("name", newName);
    }
    if (el.tagName === "INPUT") el.value = "";
  });

  container.appendChild(clone);
  variantIndex++;
});

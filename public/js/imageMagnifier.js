document.querySelectorAll(".product-image-container").forEach(container => {
  const productImage = container.querySelector(".product-image");
  const closeBtn = container.querySelector(".close-btn");
  const magnifierLens = container.querySelector(".magnifierLens");
  let zoomLevel = 2;

  // Click to enlarge
  productImage.addEventListener("click", () => {
    productImage.classList.add("enlarged");
    closeBtn.style.display = "block";
    productImage.style.zIndex = 100; // bring to front
  });

  // Close enlarged view
  closeBtn.addEventListener("click", () => {
    productImage.classList.remove("enlarged");
    closeBtn.style.display = "none";
    magnifierLens.style.display = "none";
    productImage.style.zIndex = 1; // reset
  });

  // Show magnifier when hovering over enlarged image
  productImage.addEventListener("mouseenter", () => {
    if (productImage.classList.contains("enlarged")) {
      magnifierLens.style.display = "block";
      magnifierLens.style.backgroundImage = `url('${productImage.src}')`;
      magnifierLens.style.backgroundSize = `${productImage.width * zoomLevel}px ${productImage.height * zoomLevel}px`;
    }
  });

  // Hide magnifier when leaving image
  productImage.addEventListener("mouseleave", () => {
    magnifierLens.style.display = "none";
  });

  // Move magnifier with mouse
productImage.addEventListener("mousemove", (e) => {
  if (!productImage.classList.contains("enlarged")) return;

  const rect = productImage.getBoundingClientRect();

  const lensHalfWidth = magnifierLens.offsetWidth / 2;
  const lensHalfHeight = magnifierLens.offsetHeight / 2;

  const minX = lensHalfWidth;
  const maxX = rect.width - lensHalfWidth;
  const minY = lensHalfHeight;
  const maxY = rect.height - lensHalfHeight;

  let centerX = e.clientX - rect.left;
  let centerY = e.clientY - rect.top;

  centerX = Math.max(minX, Math.min(centerX, maxX));
  centerY = Math.max(minY, Math.min(centerY, maxY));

  let x = centerX - lensHalfWidth;
  let y = centerY - lensHalfHeight;

  magnifierLens.style.left = x + "px";
  magnifierLens.style.top = y + "px";

  magnifierLens.style.backgroundPosition = `-${x * zoomLevel}px -${y * zoomLevel}px`;
});



});

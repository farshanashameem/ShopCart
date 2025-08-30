
  const thumbs = document.querySelectorAll(".thumb-img");
  const mainImage = document.getElementById("mainImage");
  const lens = document.getElementById("magnifierLens");

  thumbs.forEach(thumb => {
    thumb.addEventListener("click", () => {
      // change active thumbnail
      thumbs.forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");
      // change main image
      mainImage.src = thumb.src;
      lens.style.backgroundImage = `url(${thumb.src})`;
    });
  });

  // Magnifier effect
  mainImage.addEventListener("mousemove", moveLens);
  mainImage.addEventListener("mouseenter", () => lens.style.display = "block");
  mainImage.addEventListener("mouseleave", () => lens.style.display = "none");

  function moveLens(e) {
    const rect = mainImage.getBoundingClientRect();
    const lensSize = 100;
    const x = e.clientX - rect.left - lensSize / 2;
    const y = e.clientY - rect.top - lensSize / 2;

    lens.style.left = `${x}px`;
    lens.style.top = `${y}px`;
    lens.style.backgroundImage = `url(${mainImage.src})`;
    lens.style.backgroundSize = `${mainImage.width * 2}px ${mainImage.height * 2}px`;
    lens.style.backgroundPosition = `-${x * 2}px -${y * 2}px`;
  }


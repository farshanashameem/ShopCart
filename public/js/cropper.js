const imageContainer = document.getElementById("imageContainer");

function refreshUploadSlots() {
  const boxes = imageContainer.querySelectorAll(".upload-box");
  const total = boxes.length;

  // If fewer than 3 slots, add new empty slots
  for (let i = total; i < 3; i++) {
    const div = document.createElement("div");
    div.className = "upload-box position-relative text-center";
    div.dataset.slot = i;
    div.innerHTML = `
      <input type="file" class="d-none image-input" name="images${i}" accept="image/*">
      <div class="upload-preview d-flex align-items-center justify-content-center bg-light border rounded"
           style="width:120px;height:120px;cursor:pointer;">
        <span class="text-muted">+</span>
      </div>
      <small class="text-muted d-block text-center">Click to upload</small>
    `;
    imageContainer.appendChild(div);
    attachUploadListeners(div); // attach crop + remove handlers
  }
}

// Function to attach cropper and remove functionality to a box
function attachUploadListeners(box) {
  const input = box.querySelector(".image-input");
  let preview = box.querySelector(".upload-preview");

  // Remove button (if exists)
const removeBtn = box.querySelector(".remove-image-btn");
if (removeBtn) {
  removeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const hiddenInput = box.querySelector('input[type="hidden"]');
    if (hiddenInput) hiddenInput.remove();

    input.value = "";

    // Replace preview with placeholder
    const newPreviewHTML = `
      <div class="upload-preview d-flex align-items-center justify-content-center bg-light border rounded"
           style="width:120px;height:120px;cursor:pointer;">
        <span class="text-muted">+</span>
      </div>
    `;
    preview.outerHTML = newPreviewHTML;

    // Update reference to the new preview
    const newPreview = box.querySelector(".upload-preview");
    window.currentPreview = newPreview;

    // Reattach click listener for file selection
    newPreview.addEventListener("click", () => input.click());

    refreshUploadSlots(); // ensure max 3 slots
  });
}


  // Click preview to select file
  preview.addEventListener("click", () => input.click());

  // File input change (cropping logic remains same)
  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const cropImage = document.getElementById("cropImage");
      cropImage.src = event.target.result;
      if (window.cropper) window.cropper.destroy();
      window.cropper = new Cropper(cropImage, {
        aspectRatio: 1,
        viewMode: 1,
        autoCropArea: 1
      });
      window.currentInput = input;
      window.currentPreview = preview;
      new bootstrap.Modal(document.getElementById("cropModal")).show();
    };
    reader.readAsDataURL(file);
  });
}

// Attach listeners to existing boxes on page load
document.querySelectorAll(".upload-box").forEach(attachUploadListeners);
refreshUploadSlots(); // ensure there are always 3 slots

document.getElementById("cropSave").addEventListener("click", () => {
  if (!window.cropper || !window.currentInput || !window.currentPreview) return;

  window.cropper.getCroppedCanvas({ width: 500, height: 500 }).toBlob((blob) => {
    const url = URL.createObjectURL(blob);

    // Replace preview with cropped image
    if (window.currentPreview.tagName.toLowerCase() === "img") {
      window.currentPreview.src = url;
    } else {
      window.currentPreview.outerHTML = `<img src="${url}" 
        class="upload-preview img-thumbnail"
        style="width:120px;height:120px;object-fit:cover;cursor:pointer;" />`;
      // Update reference
      window.currentPreview = window.currentInput.parentElement.querySelector(".upload-preview");
      window.currentPreview.addEventListener("click", () => window.currentInput.click());
    }

    // Update file input with cropped file
    const newFile = new File([blob], "cropped.jpg", { type: "image/jpeg" });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(newFile);
    window.currentInput.files = dataTransfer.files;

    // Hide modal
    bootstrap.Modal.getInstance(document.getElementById("cropModal")).hide();
  }, "image/jpeg", 0.9);
});
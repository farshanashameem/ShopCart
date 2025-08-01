
  // Select all upload boxes
  document.querySelectorAll('.upload-box').forEach((box, index) => {
    const input = box.querySelector('.image-input');
    const img = box.querySelector('.upload-preview');

    // Click on box triggers file input
    box.addEventListener('click', () => {
      input.click();
    });

    // Preview on file select
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          img.src = e.target.result;
          img.style.width = '100%';
          img.style.height = 'auto';
        };
        reader.readAsDataURL(file);
      }
    });
  });


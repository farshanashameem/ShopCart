
document.querySelectorAll('.track').forEach(track => {
    const status = track.dataset.status;
    const returnDate = track.dataset.return;
    const returnPending = track.dataset.returnPending === 'true';

    let stepIndex = 0;  

    // Fully complete the tracker if returned or return pending
    if(returnDate || returnPending) {
        stepIndex = 3;
    } else {
        switch(status) {
            case 'placed': stepIndex = 0; break;
            case 'shipped': stepIndex = 1; break;
            case 'out-for-delivery': stepIndex = 2; break;
            case 'delivered': stepIndex = 3; break;
        }
    }

    const totalSteps = 3; // 3 gaps between 4 circles
    const progressPercent = (stepIndex / totalSteps) * 100;
    track.style.setProperty('--progress-width', progressPercent + '%');

    // Mark all circles active if return pending or completed
    if(returnDate || returnPending) {
        track.querySelectorAll('.step').forEach(step => step.classList.add('active'));
    }
});




//modal taking values
 document.addEventListener("DOMContentLoaded", () => {
  const returnButtons = document.querySelectorAll(".btn-return");
  returnButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("modalOrderId").value = btn.dataset.orderId;
      document.getElementById("modalVariantId").value = btn.dataset.variantId;
      document.getElementById("modalProductId").value = btn.dataset.productId;
    });
  });
});
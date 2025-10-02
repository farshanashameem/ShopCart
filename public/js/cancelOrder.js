document.addEventListener("DOMContentLoaded", () => {
    const cancelButtons = document.querySelectorAll(".btn-cancel");

    cancelButtons.forEach(button => {
        button.addEventListener("click", () => {
    const orderId = button.dataset.orderId;
    const variantId = button.dataset.variantId;
    const productId = button.dataset.productId;

    Swal.fire({
        title: "Cancel Order",
        text: "Please select a reason for cancellation:",
        input: "select",
        inputOptions: {
            "Ordered by mistake": "Ordered by mistake",
            "Found cheaper elsewhere": "Found cheaper elsewhere",
            "Delivery time too long": "Delivery time too long",
            "Other": "Other"
        },
        inputPlaceholder: "-- Select Reason --",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Cancel Order"
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            const reason = result.value;

            fetch("/cancelOrder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId,
                    variantId,
                    productId,
                    reason
                })
            })
            .then(res => res.json())
            .then(data => {
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: data.success ? "success" : "error",
                    title: data.message,
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true
                });

                if (data.success) {
                    button.closest(".order-row")?.remove();
                    setTimeout(() => {
                                location.reload();
                            }, 2000);
                }
            })
            .catch(err => {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Something went wrong. Please try again."
                });
                console.error(err);
            });
        }
    });
});

    });
});

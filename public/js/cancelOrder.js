document.addEventListener("DOMContentLoaded", () => {
    const cancelButtons = document.querySelectorAll(".btn-cancel");

    cancelButtons.forEach(button => {
        button.addEventListener("click", () => {
            const orderId = button.dataset.orderId;
            const variantId = button.dataset.variantId;
            const productId = button.dataset.productId;

            Swal.fire({
                title: "Are you sure?",
                text: "Do you really want to cancel this order?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Yes, cancel it!"
            }).then((result) => {
                if (result.isConfirmed) {
                    fetch("/cancelOrder", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            orderId,
                            variantId,
                            productId
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
                            // Optional: remove or update the cancelled order row
                            button.closest(".order-row")?.remove();
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

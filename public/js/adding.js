
document.addEventListener("DOMContentLoaded", () => {
    const sizeInputs = document.querySelectorAll("input[name='size']");
    const colorInputs = document.querySelectorAll("input[name='color']");
    const cartBtn = document.getElementById("cartBtn");
    const wishlistBtn = document.getElementById("wishlistBtn");

    let selectedSize = null;
    let selectedColor = null;

    function checkSelection() {
        if (selectedSize && selectedColor) {
            cartBtn.disabled = false;
            wishlistBtn.disabled = false;
        } else {
            cartBtn.disabled = true;
            wishlistBtn.disabled = true;
        }
    }

    sizeInputs.forEach(input => {
        input.addEventListener("change", () => {
            selectedSize = input.value;
            checkSelection();
        });
    });

    colorInputs.forEach(input => {
        input.addEventListener("change", () => {
            selectedColor = input.value;
            checkSelection();
        });
    });

    // Example: Sending data when button is clicked
    const productId = document.body.dataset.productId;
    cartBtn.addEventListener("click", () => {
        if (!selectedSize || !selectedColor) return;

        fetch("/addToCart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                productId: productId,
                size: selectedSize,
                color: selectedColor
            })
        })
        .then(res => res.json())
       .then(data => {
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: data.success ? "success" : "warning",
                    title: data.message,
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true
                });
            })
       .catch(err => {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Something went wrong. Please try again.",
            });
        });
   }); 


    wishlistBtn.addEventListener("click", () => {
        if (!selectedSize || !selectedColor) return;

        fetch("/addToWishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                productId:  productId,
                size: selectedSize,
                color: selectedColor
            })
        })
        .then(res => res.json())
         .then(data => {
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: data.success ? "success" : "info",
                title: data.message,
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
        })

            .catch(err => {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Something went wrong. Please try again.",
                });
            });
    });
});


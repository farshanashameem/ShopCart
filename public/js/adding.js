
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
            alert(data.message || "Added to cart!");
        })
        .catch(err => console.error(err));
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
            alert(data.message || "Added to wishlist!");
        })
        .catch(err => console.error(err));
    });
});


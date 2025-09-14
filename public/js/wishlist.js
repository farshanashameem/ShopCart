
  // Add to cart from wishlist
  document.querySelectorAll(".add-to-cart-btn").forEach(button => {
    button.addEventListener("click", async function () {
      const productId = this.dataset.productid;
      const variantId = this.dataset.variantid;

      try {
        const response = await fetch(`/addToCart/${productId}/${variantId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });

        const result = await response.json();

        if (result.success) {
          Swal.fire({
            icon: 'success',
            title: 'Added!',
            text: result.message || "Item moved to cart successfully",
            timer: 2000,
            showConfirmButton: false
          }).then(() => location.reload());
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: result.message || "Something went wrong"
          });
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: "Server error, please try again later"
        });
      }
    });
  });

  // Delete from wishlist
  document.querySelectorAll(".delete-wishlist-btn").forEach(button => {
    button.addEventListener("click", async function () {
      const productId = this.dataset.productid;
      const variantId = this.dataset.variantid;

      Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to undo this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!'
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const response = await fetch(`/wishlistItemDelete/${productId}/${variantId}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" }
            });

            const data = await response.json();

            if (data.success) {
              Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: data.message || "Item removed from wishlist",
                timer: 1500,
                showConfirmButton: false
              }).then(() => location.reload());
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: data.message || "Something went wrong"
              });
            }
          } catch (err) {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: "Server error, please try again later"
            });
          }
        }
      });
    });
  });

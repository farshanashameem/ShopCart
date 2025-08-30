document.querySelectorAll('.return-action').forEach(btn => {
  btn.addEventListener('click', function (e) {
    e.preventDefault();

    const action = this.dataset.action;
    const orderId = this.closest("form").querySelector("input[name='orderId']").value;
    const productId = this.closest("form").querySelector("input[name='productId']").value;
    const userId = this.closest("form").querySelector("input[name='userId']").value;
    const variantId = this.closest("form").querySelector("input[name='variantId']").value;
    const total= this.closest("form").querySelector("input[name='total']").value;

    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to mark this return as ${action}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: action === "approved" ? '#28a745' : '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Yes, ${action}`
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`/admin/returns`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, productId, variantId, userId,total, action }) // 👈 send action too
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            Swal.fire("Success!", data.message, "success").then(() => location.reload());
          } else {
            Swal.fire("Error", data.message, "error");
          }
        })
        .catch(() => Swal.fire("Error", "Something went wrong!", "error"));
      }
    });
  });
});

const showBtn = document.getElementById("showCouponsBtn");
const coupenBar = document.getElementById("coupenBar");
const cancelBtn = document.getElementById("cancelBtn");
const couponForm = document.getElementById('couponForm');
const couponList = document.querySelector('.couponList');
const saveBtn=document.getElementById('saveBtn');

let editingId = null; // Track editing coupon ID

// Show form
showBtn.addEventListener("click", () => {
    editingId = null;
    couponForm.reset(); // Clear previous inputs
    coupenBar.classList.remove("d-none");
});

// Hide form
cancelBtn.addEventListener("click", () => {
    coupenBar.classList.add("d-none");
    editingId = null;
});

// Handle Add / Edit
saveBtn.addEventListener('click', async () => {
    const formData = new FormData(couponForm);
    const data = {};
    formData.forEach((v, k) => data[k] = v);

    const actionUrl = editingId ? `/updateCoupon/${editingId}` : '/addCoupon';

    try {
        const res = await fetch(actionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        // Handle validation errors
        if (result.errors) {
            Object.keys(result.errors).forEach(key => {
                const el = document.querySelector(`[name=${key}]`);
                if (el) {
                    let p = el.nextElementSibling;
                    if (p && p.tagName === 'P') p.innerText = result.errors[key];
                    else {
                        const errorP = document.createElement('p');
                        errorP.className = 'text-danger m-0';
                        errorP.innerText = result.errors[key];
                        el.after(errorP);
                    }
                }
            });
            return; // stop if validation errors exist
        }

        // Update DOM dynamically
        if (result.address) {
            if (editingId) {
                // Replace edited address
                const oldDiv = document.getElementById(`address-${editingId}`);
                if (oldDiv) oldDiv.outerHTML = createAddressHTML(result.address);
            } else {
                // Add new address at top
                addressList.insertAdjacentHTML('afterbegin', createAddressHTML(result.address));
            }
            couponForm.reset();
            couponBar.classList.add("d-none");
            editingId = null;

            attachEditDeleteEvents(); // Reattach events
        }

    } catch (err) {
        console.log(err);
    }
});
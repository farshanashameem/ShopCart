const showBtn = document.getElementById("showAddressBtn");
const addressBar = document.getElementById("addressBar");
const cancelBtn = document.getElementById("cancelBtn");
const addressForm = document.getElementById('addressForm');
const addressList = document.querySelector('.addressList');

let editingId = null; // Track editing address ID

// Show form
showBtn.addEventListener("click", () => {
    editingId = null;
    addressForm.reset(); // Clear previous inputs
    addressBar.classList.remove("d-none");
});
  
// Hide form
cancelBtn.addEventListener("click", () => {
    addressBar.classList.add("d-none");
    editingId = null;
});

// Handle Add / Edit
document.getElementById('addAddressBtn').addEventListener('click', async () => {
    const formData = new FormData(addressForm);
    const data = {};
    formData.forEach((v, k) => data[k] = v);

    const actionUrl = editingId ? `/updateAddress/${editingId}` : '/addAddress';

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
            addressForm.reset();
            addressBar.classList.add("d-none");
            editingId = null;

            attachEditDeleteEvents(); // Reattach events
        }

    } catch (err) {
        console.log(err);
    }
});

// Create HTML for a single address
function createAddressHTML(address) {
    return `
    <div class="mb-3 p-3 border rounded position-relative" id="address-${address._id}">
        <div class="dropdown position-absolute top-0 end-0 m-2">
            <button class="btn btn-light btn-sm" type="button" data-bs-toggle="dropdown">
                <i class="bi bi-three-dots-vertical"></i>
            </button>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item edit-address" data-id="${address._id}">Edit</a></li>
                <li><a class="dropdown-item delete-address text-danger" data-id="${address._id}">Delete</a></li>
            </ul>
        </div>

        <p class="p-1 mb-2 bg-secondary text-white text-start rounded" style="width:auto; display:inline-block;">
            ${address.type}
        </p>
        <p>
            ${address.name}<br>
            ${address.address}, ${address.locality}, ${address.city}<br>
            ${address.state}<br>
            ${address.pincode}<br>
            ${address.phoneNumber}<br>
            ${address.landmark ? `<strong>Landmark:</strong> ${address.landmark}<br>` : ''}
            ${address.altnumber ? `<strong>Alternate Phone:</strong> ${address.altnumber}<br>` : ''}
        </p>
    </div>`;
}

// Attach edit/delete events dynamically
function attachEditDeleteEvents() {
    document.querySelectorAll('.edit-address').forEach(btn => {
        btn.onclick = () => {
            const id = btn.dataset.id;
            const div = document.getElementById(`address-${id}`);
            if (!div) return;

            editingId = id;
            addressBar.classList.remove('d-none');
            
            // Prefill form values from DOM
            addressForm.action = `/updateAddress/${id}`;
            addressForm.name.value = div.dataset.name || '';
            addressForm.phone.value = getLocalPhone(div.dataset.phone);
            addressForm.pin.value = div.dataset.pin || '';
            addressForm.locality.value = div.dataset.locality || '';
            addressForm.address.value = div.dataset.address || '';
            addressForm.city.value = div.dataset.city || '';
            addressForm.state.value = div.dataset.state || '';
            addressForm.landmark.value = div.dataset.landmark || '';
            addressForm.altnumber.value = div.dataset.altnumber || '';

            if (div.dataset.type === 'home') {
                addressForm.querySelector('#home').checked = true;
            } else if (div.dataset.type === 'office') {
                addressForm.querySelector('#office').checked = true;
            }
            
        };
    });

    document.querySelectorAll('.delete-address').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.id;
            if (!confirm('Are you sure to delete this address?')) return;

            try {
                const res = await fetch(`/deleteAddress/${id}`, { method: 'DELETE' });
                const result = await res.json();
                if (result.success) {
                    const div = document.getElementById(`address-${id}`);
                    if (div) div.remove();
                }
            } catch (err) {
                console.log(err);
            }
        };
    });
}

function getLocalPhone(fullPhone) {
    if (!fullPhone) return '';
    // Assuming '+91' as country code
    return fullPhone.startsWith('+91') ? fullPhone.slice(3) : fullPhone;
}
// Initial attach on page load
attachEditDeleteEvents();


document.addEventListener("DOMContentLoaded", function () {
    // Get all pencil icons
    document.querySelectorAll(".edit-icon").forEach(icon => {
        icon.addEventListener("click", function () {
            // Find the input next to the clicked icon
            let input = this.previousElementSibling;
            
            // Enable editing
            input.removeAttribute("readonly");
            input.focus();

            // Optional: change border to show editable state
            input.style.border = "1px solid #007bff";
            input.style.backgroundColor = "#fff";
        });
    });
});

document.getElementById('avatarUpload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // Show preview before saving
            document.getElementById('profileImage').src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    }
});




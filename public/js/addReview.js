// /public/js/addReview.js
document.addEventListener("DOMContentLoaded", function() {
  const reviewForm = document.getElementById("reviewForm");
  const userReviewDiv = document.getElementById("userReview");
  const noReviewText = document.getElementById("noReviewText");

  // Submit new or edited review via AJAX
  reviewForm.addEventListener("submit", async function(e) {
    e.preventDefault();

    const formData = new FormData(reviewForm);
    const productId = formData.get("productId");
    const rating = formData.get("rating");
    const comment = formData.get("comment");

    if (!rating) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Please select a rating.'
      });
      return;
    }

    try {
      const res = await fetch(`/review/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({productId , rating, comment })
      });

      const data = await res.json();

      if (data.success) {
        // Remove "You haven't submitted a review yet." text if exists
        if(noReviewText) noReviewText.remove();

        userReviewDiv.innerHTML = `
          <p><strong>Rating:</strong> <span id="reviewRating">${rating}</span> ★</p>
          <p><strong>Comment:</strong> <span id="reviewComment">${comment}</span></p>
          <button class="btn btn-sm btn-primary" id="editReviewBtn">Edit</button>
        `;

        reviewForm.reset();
        attachEditListener();

        Swal.fire({
          icon: 'success',
          title: data.isUpdate ? 'Review Updated' : 'Review Submitted',
          text: data.isUpdate ? 'Your review has been updated!' : 'Thank you for your feedback!',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          text: data.message || 'An error occurred while submitting your review.'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Please check your internet connection and try again.'
      });
      console.error(err);
    }
  });

  // Attach edit button listener
  function attachEditListener() {
    const editBtn = document.getElementById("editReviewBtn");
    if (editBtn) {
      editBtn.addEventListener("click", function() {
        const ratingValue = parseInt(document.getElementById("reviewRating").innerText);
        const commentValue = document.getElementById("reviewComment").innerText;

        // Set rating in the form
        const ratingInputs = reviewForm.querySelectorAll("input[name='rating']");
        ratingInputs.forEach(input => input.checked = parseInt(input.value) === ratingValue);

        // Set comment
        reviewForm.comment.value = commentValue;

        // Scroll to form for editing
        reviewForm.scrollIntoView({ behavior: "smooth" });
      });
    }
  }

  attachEditListener();
});

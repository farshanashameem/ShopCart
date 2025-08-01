// public/js/otp-timer.js

document.addEventListener("DOMContentLoaded", () => {
  // === OTP Auto Focus ===
  const otpInputs = document.querySelectorAll('.otp-input');

  otpInputs.forEach((input, index) => {
    input.addEventListener('input', () => {
      // Move to next input if value is entered
      if (input.value.length === 1 && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      // Go back to previous input on Backspace
      if (e.key === "Backspace" && input.value === "" && index > 0) {
        otpInputs[index - 1].focus();
      }
    });
  });

  // === OTP Timer ===
 let timeLeft = parseInt(document.getElementById("timer")?.innerText) || 60;
const timerDisplay = document.getElementById("timer");
const resendLink = document.getElementById("resend-link");
const resendContainer = document.getElementById("resend-container");

if (timerDisplay && resendLink && resendContainer) {
  const countdown = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(countdown);
      resendContainer.style.display = 'none';         //  hide timer text
      resendLink.classList.remove('d-none');          //  show resend link
    }
  }, 1000);
}
})
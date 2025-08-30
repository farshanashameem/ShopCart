document.addEventListener("DOMContentLoaded", () => {
  const orderId = document.getElementById("orderId").value;

document.getElementById('shipped')?.addEventListener('click', () => {
  
   window.location.href = `/admin/changeStatus/${orderId}/shipped`;
});

document.getElementById('out-for-delivery')?.addEventListener('click', () => {
  
   window.location.href = `/admin/changeStatus/${orderId}/out-for-delivery`;
});
document.getElementById('delivered')?.addEventListener('click', () => {
  
   window.location.href = `/admin/changeStatus/${orderId}/delivered`;
});

});
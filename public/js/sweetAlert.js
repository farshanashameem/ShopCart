//-- Sweet Alert Handler --//
    
      document.addEventListener("DOMContentLoaded", () => {
        // Block/Unblock
        document.querySelectorAll(".block-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            const actionType = btn.dataset.status;
            const name = btn.dataset.name;
            confirmAction(`blockForm-${id}`, actionType, name);
          });
        });

        // Delete
        document.querySelectorAll(".delete-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            const name = btn.dataset.name;
            confirmAction(`deleteForm-${id}`, "delete", name);
          });
        });
      });
    
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwsQdsX9cRh9LjrmoyE9w5u_x645pMkSvOPrHCnnJ2h-B1NLRlNCxZXtEb8HiiNwUcoyg/exec";

const contactForm = document.querySelector("form");

if (contactForm) {
  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const submitBtn = this.querySelector("button[type='submit']");
    const originalBtnText = submitBtn.innerText;

    let statusMessage = this.querySelector(".form-status");

    if (!statusMessage) {
      statusMessage = document.createElement("div");
      statusMessage.className = "form-status";
      this.appendChild(statusMessage);
    }

    submitBtn.disabled = true;
    submitBtn.innerText = "SENDING...";

    statusMessage.className = "form-status";
    statusMessage.innerText = "";

    const formData = {
      fullName:
        this.querySelector("[name='fullName']")?.value.trim() || "",

      email:
        this.querySelector("[name='email']")?.value.trim() || "",

      subject:
        this.querySelector("[name='subject']")?.value.trim() || "",

      orderNumber:
        this.querySelector("[name='orderNumber']")?.value.trim() || "",

      message:
        this.querySelector("[name='message']")?.value.trim() || ""
    };

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      statusMessage.className = "form-status success";
      statusMessage.innerText =
        "✓ Message sent successfully. Thank you for contacting us!";

      this.reset();

      setTimeout(() => {
        statusMessage.className = "form-status";
        statusMessage.innerText = "";
      }, 5000);

    } catch (error) {
      console.error("Error:", error);

      statusMessage.className = "form-status error";
      statusMessage.innerText =
        "✕ Something went wrong. Please try again.";

    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = originalBtnText;
    }
  });
}
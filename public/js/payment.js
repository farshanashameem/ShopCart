
    const originalTotal = <%= cart.total %>;
    let selectedCoupon = null;

    // Payment option selection
    document.querySelectorAll('.payment-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            const radio = this.querySelector('input[type="radio"]');
            radio.checked = true;
        });
    });

    document.getElementById('showCoupons').addEventListener('click', () => {
        const couponList = document.getElementById('couponList');
        couponList.style.display = couponList.style.display === 'none' ? 'block' : 'none';
    });

    document.querySelectorAll('.apply-coupon').forEach(button => {
        button.addEventListener('click', (e) => {
            const parent = e.target.closest('.coupon-item');
            const discount = parseInt(parent.dataset.discount);
            const code = parent.dataset.code;

            // Highlight active coupon
            if (selectedCoupon) selectedCoupon.classList.remove('active');
            parent.classList.add('active');
            selectedCoupon = parent;

            // Show coupon discount row
            document.getElementById('couponDiscountRow').style.display = 'flex';
            document.getElementById('couponDiscount').textContent = `-₹${discount}`;

            // Update total
            let newTotal = Math.max(originalTotal - discount, 0);
            document.getElementById('totalAmount').textContent = newTotal;

            // Update hidden fields
            document.getElementById('finalTotal').value = newTotal;
            document.getElementById('appliedCoupon').value = code;
            document.getElementById('couponDiscountValue').value = discount;
            document.getElementById('discountCode').value = code;
        });
    });

    // Payment button click
    document.getElementById('payButton').addEventListener('click', function() {
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        
        if (paymentMethod === 'razorpay') {
            // Initiate Razorpay payment
            initiateRazorpayPayment();
        } else {
            // Submit form for COD or other methods
            document.getElementById('paymentForm').submit();
        } 
    });

    // Razorpay payment function
    function initiateRazorpayPayment() {
        // Show loading overlay
        document.getElementById('loadingOverlay').style.display = 'flex';
        
        const totalAmount = parseFloat(document.getElementById('finalTotal').value) * 100; // Convert to paise
        
        // Get Razorpay key from server-side rendering
        const razorpayKey = '<%= process.env.RAZORPAY_KEY_ID %>';
        
        // Validate Razorpay key
        if (!razorpayKey || razorpayKey === '') {
            alert('Payment configuration error. Please try again later.');
            document.getElementById('loadingOverlay').style.display = 'none';
            return;
        }
        
        // Create order first on server side
        fetch('/create-razorpay-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: totalAmount,
                currency: 'INR'
            })
        })
        .then(response => response.json())
        .then(order => {
            const options = {
                key: razorpayKey,
                amount: order.amount,
                currency: order.currency,
                order_id: order.id,
                name: 'ShopCart',
                description: 'Order Payment',
                image: '/images/logo.png',
                handler: function(response) {
                    handlePaymentSuccess(response);
                },
                prefill: {
                    name: '<%= user.name %>',
                    email: '<%= user.email %>',
                    contact: '<%= user.phone || "9999999999" %>'
                },
                notes: {
                    address: 'Customer Address',
                    order_reference: 'ORDER_<%= Date.now() %>'
                },
                theme: {
                    color: '#000000'
                }
            };
            
            try {
                const rzp = new Razorpay(options);
                
                // Add error handler
                rzp.on('payment.failed', function(response) {
                    console.error('Payment failed:', response.error);
                    document.getElementById('loadingOverlay').style.display = 'none';
                    
                    // More detailed error handling
                    let errorMessage = 'Payment failed. Please try again.';
                    if (response.error && response.error.description) {
                        errorMessage = response.error.description;
                    }
                    
                    // Redirect to payment failed page with error message
                    window.location.href = '/failed?error=' + encodeURIComponent(errorMessage);
                });
                
                rzp.open();
                document.getElementById('loadingOverlay').style.display = 'none';
            } catch (error) {
                console.error('Razorpay initialization error:', error);
                document.getElementById('loadingOverlay').style.display = 'none';
                alert('Error initializing payment. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error creating order:', error);
            document.getElementById('loadingOverlay').style.display = 'none';
            alert('Error creating payment order. Please try again.');
        });
    }

    // Handle payment success
    function handlePaymentSuccess(response) {
        // Show loading overlay again
        document.getElementById('loadingOverlay').style.display = 'flex';
        
        console.log('Payment success response:', response);
        
        // Create a form to submit the payment data
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/payment';
        
        // Add all necessary fields
        const fields = {
            payment: 'razorpay',
            appliedCoupon: document.getElementById('appliedCoupon').value,
            couponDiscount: document.getElementById('couponDiscountValue').value,
            total: document.getElementById('finalTotal').value,
            addressId: document.getElementById('addressId').value,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature
        };
        
        for (const [key, value] of Object.entries(fields)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
        }
        
        // Add the form to the document and submit it
        document.body.appendChild(form);
        form.submit();
    }
